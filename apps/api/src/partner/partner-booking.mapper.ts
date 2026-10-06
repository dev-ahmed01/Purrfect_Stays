import { mapBooking } from '../bookings/booking.mapper.js';

export function mapPartnerBooking(
  booking: Parameters<typeof mapBooking>[0] & {
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
    };
  },
) {
  return {
    ...mapBooking(booking),
    guest: booking.user,
  };
}
