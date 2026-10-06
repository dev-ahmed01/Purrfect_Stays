import { Prisma } from '@purrfect/database';

export const bookingViewSelect = {
  id: true,
  reference: true,
  idempotencyKey: true,
  requestHash: true,
  status: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  guests: true,
  petCount: true,
  currency: true,
  subtotalPaise: true,
  petFeePaise: true,
  serviceFeePaise: true,
  taxPaise: true,
  taxRateBps: true,
  discountPaise: true,
  totalPaise: true,
  confirmedAt: true,
  checkedInAt: true,
  completedAt: true,
  cancellationReason: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      state: true,
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: {
          url: true,
          altText: true,
        },
      },
    },
  },
  roomType: {
    select: {
      id: true,
      name: true,
    },
  },
  pets: {
    orderBy: { name: 'asc' },
    select: {
      petId: true,
      name: true,
      species: true,
      breed: true,
      size: true,
    },
  },
  statusEvents: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      createdAt: true,
    },
  },
} satisfies Prisma.BookingSelect;
