import { ConflictException } from '@nestjs/common';
import { PropertyStatus } from '@purrfect/database';
import { assertPropertyTransition } from '../src/partner/property-state-machine.js';

describe('property state machine', () => {
  it.each([
    [PropertyStatus.DRAFT, PropertyStatus.PENDING_REVIEW],
    [PropertyStatus.PENDING_REVIEW, PropertyStatus.DRAFT],
    [PropertyStatus.PENDING_REVIEW, PropertyStatus.PUBLISHED],
    [PropertyStatus.PUBLISHED, PropertyStatus.DRAFT],
    [PropertyStatus.PUBLISHED, PropertyStatus.SUSPENDED],
    [PropertyStatus.SUSPENDED, PropertyStatus.PUBLISHED],
  ])('allows %s -> %s', (from, to) => {
    expect(() => assertPropertyTransition(from, to)).not.toThrow();
  });

  it.each([
    [PropertyStatus.DRAFT, PropertyStatus.PUBLISHED],
    [PropertyStatus.DRAFT, PropertyStatus.SUSPENDED],
    [PropertyStatus.SUSPENDED, PropertyStatus.DRAFT],
  ])('rejects %s -> %s', (from, to) => {
    expect(() => assertPropertyTransition(from, to)).toThrow(ConflictException);
  });
});
