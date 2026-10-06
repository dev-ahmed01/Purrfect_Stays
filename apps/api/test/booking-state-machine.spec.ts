import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@purrfect/database';
import {
  assertBookingTransition,
  canCustomerCancel,
} from '../src/bookings/booking-state-machine.js';

describe('booking state machine', () => {
  it.each([
    [BookingStatus.PENDING, BookingStatus.CONFIRMED],
    [BookingStatus.PENDING, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
    [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CHECKED_IN, BookingStatus.COMPLETED],
  ])('allows %s -> %s', (from, to) => {
    expect(() => assertBookingTransition(from, to)).not.toThrow();
  });

  it.each([
    [BookingStatus.COMPLETED, BookingStatus.CONFIRMED],
    [BookingStatus.CANCELLED, BookingStatus.CONFIRMED],
    [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
  ])('rejects %s -> %s', (from, to) => {
    expect(() => assertBookingTransition(from, to)).toThrow(BadRequestException);
  });

  it('limits customer cancellation to pending or confirmed', () => {
    expect(canCustomerCancel(BookingStatus.PENDING)).toBe(true);
    expect(canCustomerCancel(BookingStatus.CONFIRMED)).toBe(true);
    expect(canCustomerCancel(BookingStatus.CHECKED_IN)).toBe(false);
    expect(canCustomerCancel(BookingStatus.COMPLETED)).toBe(false);
    expect(canCustomerCancel(BookingStatus.CANCELLED)).toBe(false);
  });
});
