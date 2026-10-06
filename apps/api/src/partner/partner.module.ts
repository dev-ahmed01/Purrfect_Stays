import { Module } from '@nestjs/common';
import { AdminListingsController } from './admin-listings.controller.js';
import { AdminListingsService } from './admin-listings.service.js';
import { PartnerBookingsController } from './partner-bookings.controller.js';
import { PartnerDashboardController } from './partner-dashboard.controller.js';
import { PartnerBookingsService } from './partner-bookings.service.js';
import { PartnerDashboardService } from './partner-dashboard.service.js';
import { PartnerPropertiesController } from './partner-properties.controller.js';
import { PartnerPropertiesService } from './partner-properties.service.js';

@Module({
  controllers: [
    PartnerPropertiesController,
    PartnerBookingsController,
    PartnerDashboardController,
    AdminListingsController,
  ],
  providers: [
    PartnerPropertiesService,
    PartnerBookingsService,
    PartnerDashboardService,
    AdminListingsService,
  ],
  exports: [PartnerPropertiesService, PartnerBookingsService],
})
export class PartnerModule {}
