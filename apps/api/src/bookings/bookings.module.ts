import { Module } from '@nestjs/common';
import { BookingEngineService } from './booking-engine.service.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingEngineService],
  exports: [BookingsService, BookingEngineService],
})
export class BookingsModule {}
