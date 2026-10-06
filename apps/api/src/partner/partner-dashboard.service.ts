import { Injectable } from '@nestjs/common';
import { BookingStatus, PropertyStatus } from '@purrfect/database';
import { todayInIndia } from '../bookings/business-date.js';
import { PrismaService } from '../database/prisma.service.js';
import { mapPartnerBooking } from './partner-booking.mapper.js';
import { partnerBookingSelect } from './partner-booking.select.js';

@Injectable()
export class PartnerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(partnerId: string) {
    const today = todayInIndia();
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const activeReservationStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.CHECKED_IN,
    ];

    const [
      propertyGroups,
      upcomingBookings,
      checkedInBookings,
      arrivalsToday,
      departuresToday,
      reservationValue,
      nextArrivals,
    ] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['status'],
        where: { partnerId },
        _count: { _all: true },
      }),
      this.prisma.booking.count({
        where: {
          property: { partnerId },
          status: BookingStatus.CONFIRMED,
          checkIn: { gte: today },
        },
      }),
      this.prisma.booking.count({
        where: {
          property: { partnerId },
          status: BookingStatus.CHECKED_IN,
        },
      }),
      this.prisma.booking.count({
        where: {
          property: { partnerId },
          status: BookingStatus.CONFIRMED,
          checkIn: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.booking.count({
        where: {
          property: { partnerId },
          status: BookingStatus.CHECKED_IN,
          checkOut: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          property: { partnerId },
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.CHECKED_IN,
              BookingStatus.COMPLETED,
            ],
          },
        },
        _sum: { totalPaise: true },
      }),
      this.prisma.booking.findMany({
        where: {
          property: { partnerId },
          status: { in: activeReservationStatuses },
          checkIn: { gte: today },
        },
        orderBy: [{ checkIn: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        take: 5,
        select: partnerBookingSelect,
      }),
    ]);

    const propertyCounts = Object.fromEntries(
      Object.values(PropertyStatus).map((status) => [status, 0]),
    ) as Record<PropertyStatus, number>;

    for (const group of propertyGroups) {
      propertyCounts[group.status] = group._count._all;
    }

    return {
      properties: {
        total: Object.values(propertyCounts).reduce((sum, count) => sum + count, 0),
        byStatus: propertyCounts,
      },
      stays: {
        upcomingConfirmed: upcomingBookings,
        checkedIn: checkedInBookings,
        arrivalsToday,
        departuresToday,
      },
      reservationValue: {
        currency: 'INR',
        amountPaise: reservationValue._sum.totalPaise ?? 0,
        note: 'Reservation value is not equivalent to captured payment revenue.',
      },
      nextArrivals: nextArrivals.map(mapPartnerBooking),
      businessDate: today.toISOString().slice(0, 10),
    };
  }
}
