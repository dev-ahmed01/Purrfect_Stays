import { ConflictException } from '@nestjs/common';
import { PropertyStatus } from '@purrfect/database';

const ALLOWED_TRANSITIONS: Record<PropertyStatus, readonly PropertyStatus[]> = {
  [PropertyStatus.DRAFT]: [PropertyStatus.PENDING_REVIEW],
  [PropertyStatus.PENDING_REVIEW]: [
    PropertyStatus.DRAFT,
    PropertyStatus.PUBLISHED,
  ],
  [PropertyStatus.PUBLISHED]: [
    PropertyStatus.DRAFT,
    PropertyStatus.SUSPENDED,
  ],
  [PropertyStatus.SUSPENDED]: [PropertyStatus.PUBLISHED],
};

export function assertPropertyTransition(
  from: PropertyStatus,
  to: PropertyStatus,
) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Property cannot transition from ${from} to ${to}.`,
    );
  }
}
