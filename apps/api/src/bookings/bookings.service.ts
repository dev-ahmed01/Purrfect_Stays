import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BookingsQuery, CancelBookingInput, CreateBookingInput, QuoteRequest } from '@purrfect/contracts';
import { BookingStatus, Prisma } from '@purrfect/database';
import { createHash, randomUUID } from 'node:crypto';
import { buildPaginationMeta, toPrismaPagination } from '../common/pagination/pagination.js';
import { PrismaService } from '../database/prisma.service.js';
import { BookingEngineService } from './booking-engine.service.js';
import { mapBooking } from './booking.mapper.js';
import { bookingViewSelect } from './booking.select.js';
import { assertBookingTransition, canCustomerCancel } from './booking-state-machine.js';
import { nightsBetween, todayInIndia } from './business-date.js';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: BookingEngineService,
  ) {}

  async quote(userId: string, input: QuoteRequest) {
    const quote = await this.prisma.$transaction((tx) =>
      this.engine.quote(tx, userId, input),
    );

    return this.engine.toPublicQuote(quote);
  }

  async create(userId: string, input: CreateBookingInput, idempotencyKey: string) {
    const requestHash = this.requestHash(input);

    try {
      const result = await this.prisma.serializable(async (tx) => {
        const existing = await tx.booking.findUnique({
          where: {
            userId_idempotencyKey: { userId, idempotencyKey },
          },
          select: bookingViewSelect,
        });

        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new ConflictException(
              'This Idempotency-Key was already used for a different booking request.',
            );
          }

          return { booking: existing, idempotentReplay: true };
        }

        const quote = await this.engine.quote(tx, userId, input);

        for (const row of quote.inventoryRows) {
          const changed = await tx.$executeRaw(Prisma.sql`
            UPDATE "RoomInventory"
            SET "reservedUnits" = "reservedUnits" + 1
            WHERE "id" = ${row.id}::uuid
              AND "closed" = FALSE
              AND "reservedUnits" < "totalUnits"
          `);

          if (changed !== 1) {
            throw new ConflictException(
              'Inventory changed while the booking was being created. Please request a new quote.',
            );
          }
        }

        const now = new Date();
        const booking = await tx.booking.create({
          data: {
            reference: this.bookingReference(),
            idempotencyKey,
            requestHash,
            userId,
            propertyId: quote.propertyId,
            roomTypeId: quote.roomTypeId,
            checkIn: quote.checkIn,
            checkOut: quote.checkOut,
            nights: quote.nights,
            guests: quote.guests,
            petCount: quote.petCount,
            currency: quote.pricing.currency,
            subtotalPaise: quote.pricing.subtotalPaise,
            petFeePaise: quote.pricing.petFeePaise,
            serviceFeePaise: quote.pricing.serviceFeePaise,
            taxRateBps: quote.pricing.taxRateBps,
            taxPaise: quote.pricing.taxPaise,
            discountPaise: quote.pricing.discountPaise,
            totalPaise: quote.pricing.totalPaise,
            status: BookingStatus.CONFIRMED,
            confirmedAt: now,
            pets: {
              create: quote.pets.map((pet) => ({
                petId: pet.id,
                name: pet.name,
                species: pet.species,
                breed: pet.breed,
                size: pet.size,
              })),
            },
            statusEvents: {
              create: {
                fromStatus: null,
                toStatus: BookingStatus.CONFIRMED,
                actorUserId: userId,
                reason: 'Booking created',
              },
            },
          },
          select: bookingViewSelect,
        });

        return { booking, idempotentReplay: false };
      });

      return {
        booking: mapBooking(result.booking),
        idempotentReplay: result.idempotentReplay,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.booking.findUnique({
          where: {
            userId_idempotencyKey: { userId, idempotencyKey },
          },
          select: bookingViewSelect,
        });

        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new ConflictException(
              'This Idempotency-Key was already used for a different booking request.',
            );
          }

          return { booking: mapBooking(existing), idempotentReplay: true };
        }
      }

      throw error;
    }
  }

  async list(userId: string, input: BookingsQuery) {
    const where: Prisma.BookingWhereInput = {
      userId,
      ...(input.status ? { status: input.status as BookingStatus } : {}),
    };
    const pagination = toPrismaPagination(input);

    const [totalItems, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        ...pagination,
        orderBy: [{ checkIn: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        select: bookingViewSelect,
      }),
    ]);

    return {
      items: bookings.map(mapBooking),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async findOne(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      select: bookingViewSelect,
    });

    if (!booking) throw new NotFoundException('Booking not found.');
    return mapBooking(booking);
  }

  async cancel(userId: string, bookingId: string, input: CancelBookingInput) {
    const result = await this.prisma.serializable(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, userId },
        select: bookingViewSelect,
      });

      if (!booking) throw new NotFoundException('Booking not found.');

      if (booking.status === BookingStatus.CANCELLED) {
        return booking;
      }

      if (!canCustomerCancel(booking.status)) {
        throw new BadRequestException(
          `A ${booking.status.toLowerCase()} booking can no longer be cancelled by the customer.`,
        );
      }

      if (booking.checkIn <= todayInIndia()) {
        throw new BadRequestException('Bookings cannot be cancelled on or after the check-in date.');
      }

      assertBookingTransition(booking.status, BookingStatus.CANCELLED);

      const expectedNights = nightsBetween(booking.checkIn, booking.checkOut);
      const released = await tx.$executeRaw(Prisma.sql`
        UPDATE "RoomInventory"
        SET "reservedUnits" = "reservedUnits" - 1
        WHERE "roomTypeId" = ${booking.roomType.id}::uuid
          AND "date" >= ${booking.checkIn}
          AND "date" < ${booking.checkOut}
          AND "reservedUnits" > 0
      `);

      if (released !== expectedNights) {
        throw new ConflictException(
          'Inventory ledger did not match this booking. Cancellation was not applied.',
        );
      }

      const now = new Date();
      await tx.bookingStatusEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          actorUserId: userId,
          reason: input.reason,
        },
      });

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: input.reason,
          cancelledAt: now,
        },
        select: bookingViewSelect,
      });
    });

    return mapBooking(result);
  }

  private requestHash(input: CreateBookingInput): string {
    const canonical = JSON.stringify({
      roomTypeId: input.roomTypeId,
      checkIn: input.checkIn.toISOString().slice(0, 10),
      checkOut: input.checkOut.toISOString().slice(0, 10),
      guests: input.guests,
      petIds: [...input.petIds].sort(),
    });

    return createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  private bookingReference(): string {
    return `PURR-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }
}
