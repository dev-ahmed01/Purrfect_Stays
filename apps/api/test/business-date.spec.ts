import { nightsBetween, todayInIndia } from '../src/bookings/business-date.js';

describe('India business date', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses Asia/Kolkata rather than server-local calendar date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T19:15:00.000Z'));
    expect(todayInIndia().toISOString()).toBe('2026-10-07T00:00:00.000Z');
  });

  it('counts date-only nights without daylight-saving behavior', () => {
    const checkIn = new Date('2026-12-20T00:00:00.000Z');
    const checkOut = new Date('2026-12-25T00:00:00.000Z');
    expect(nightsBetween(checkIn, checkOut)).toBe(5);
  });
});
