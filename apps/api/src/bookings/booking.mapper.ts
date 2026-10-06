export function mapBooking(booking: {
  id: string;
  reference: string;
  status: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  petCount: number;
  currency: string;
  subtotalPaise: number;
  petFeePaise: number;
  serviceFeePaise: number;
  taxPaise: number;
  taxRateBps: number;
  discountPaise: number;
  totalPaise: number;
  confirmedAt: Date | null;
  checkedInAt: Date | null;
  completedAt: Date | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    images: Array<{ url: string; altText: string }>;
  };
  roomType: {
    id: string;
    name: string;
  };
  pets: Array<{
    petId: string | null;
    name: string;
    species: string;
    breed: string;
    size: string;
  }>;
  statusEvents: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: Date;
  }>;
}) {
  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    nights: booking.nights,
    guests: booking.guests,
    petCount: booking.petCount,
    property: {
      id: booking.property.id,
      slug: booking.property.slug,
      name: booking.property.name,
      city: booking.property.city,
      state: booking.property.state,
      heroImage: booking.property.images[0] ?? null,
    },
    roomType: booking.roomType,
    pets: booking.pets,
    pricing: {
      currency: booking.currency,
      subtotalPaise: booking.subtotalPaise,
      petFeePaise: booking.petFeePaise,
      serviceFeePaise: booking.serviceFeePaise,
      taxRateBps: booking.taxRateBps,
      taxPaise: booking.taxPaise,
      discountPaise: booking.discountPaise,
      totalPaise: booking.totalPaise,
    },
    lifecycle: {
      confirmedAt: booking.confirmedAt,
      checkedInAt: booking.checkedInAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
    },
    statusEvents: booking.statusEvents,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}
