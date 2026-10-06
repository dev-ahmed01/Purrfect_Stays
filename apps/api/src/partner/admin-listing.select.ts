import { Prisma } from '@purrfect/database';
import {
  partnerPropertyDetailSelect,
  partnerPropertySummarySelect,
} from './partner-property.select.js';

export const adminListingSummarySelect = {
  ...partnerPropertySummarySelect,
  partner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.PropertySelect;

export const adminListingDetailSelect = {
  ...partnerPropertyDetailSelect,
  partner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      city: true,
    },
  },
} satisfies Prisma.PropertySelect;
