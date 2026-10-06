import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PartnerBookingsQuery,
  PartnerBookingTransitionInput,
} from '@purrfect/contracts';
import { BookingStatus, Prisma } from '@purrfect/database';
import { assertBookingTransition } from '../bookings/booking-state-machine.js';
import { todayInIndia } from '../bookings/business-date.js';
import { buildPaginationMeta, toPrismaPagination } from '../common/pagination/pagination.js';
import { PrismaService } from '../database/prisma.service.js';
import { mapPartnerBooking } from './partner-booking.mapper.js';
import { partnerBookingSelect } from './partner-booking.select.js';

@Injectable()
export class PartnerBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(partnerId: string, input: PartnerBookingsQuery) {
    if (input.propertyId) {
      const owned = await this.prisma.property.findFirst({
        where: {
          id: input.propertyId,
          partnerId,
        },
        select: { id: true },
      });

      if (!owned) throw new NotFoundException('Property not found.');
    }

    const and: Prisma.BookingWhereInput[] = [
      {
        property: { partnerId },
      },
    ];

    if (input.status) {
      and.push({ status: input.status as BookingStatus });
    }

    if (input.propertyId) {
      and.push({ propertyId: input.propertyId });
    }

    if (input.from) {
      and.push({ checkOut: { gt: input.from } });
    }

    if (input.to) {
      and.push({ checkIn: { lte: input.to } });
    }

    const where: Prisma.BookingWhereInput = { AND: and };
    const pagination = toPrismaPagination(input);

    const [totalItems, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        ...pagination,
        orderBy: [{ checkIn: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: partnerBookingSelect,
      }),
    ]);

    return {
      items: bookings.map(mapPartnerBooking),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async findOne(partnerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        property: { partnerId },
      },
      select: partnerBookingSelect,
    });

    if (!booking) throw new NotFoundException('Booking not found.');
    return mapPartnerBooking(booking);
  }

  async transition(
    partnerId: string,
    bookingId: string,
    input: PartnerBookingTransitionInput,
  ) {
    const booking = await this.prisma.serializable(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: {
          id: bookingId,
          property: { partnerId },
        },
        select: partnerBookingSelect,
      });

      if (!existing) throw new NotFoundException('Booking not found.');

      const nextStatus = input.toStatus as BookingStatus;
      assertBookingTransition(existing.status, nextStatus);

      const today = todayInIndia();

      if (nextStatus === BookingStatus.CHECKED_IN) {
        if (today < existing.checkIn || today >= existing.checkOut) {
          throw new BadRequestException(
            'Check-in can only be recorded on or after the check-in date and before check-out.',
          );
        }
      }

      if (nextStatus === BookingStatus.COMPLETED && today < existing.checkOut) {
        throw new BadRequestException(
          'A stay cannot be completed before its scheduled check-out date.',
        );
      }

      const now = new Date();

      await tx.bookingStatusEvent.create({
        data: {
          bookingId: existing.id,
          fromStatus: existing.status,
          toStatus: nextStatus,
          actorUserId: partnerId,
          reason: input.reason ?? null,
        },
      });

      return tx.booking.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          ...(nextStatus === BookingStatus.CHECKED_IN
            ? { checkedInAt: now }
            : {}),
          ...(nextStatus === BookingStatus.COMPLETED
            ? { completedAt: now }
            : {}),
        },
        select: partnerBookingSelect,
      });
    });

    return mapPartnerBooking(booking);
  }
}
