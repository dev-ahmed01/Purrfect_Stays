import { Prisma } from '@purrfect/database';
import { bookingViewSelect } from '../bookings/booking.select.js';

export const partnerBookingSelect = {
  ...bookingViewSelect,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.BookingSelect;
