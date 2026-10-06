import { Controller, Get } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { PartnerDashboardService } from './partner-dashboard.service.js';

@Roles('PARTNER')
@Controller('partner/dashboard')
export class PartnerDashboardController {
  constructor(private readonly dashboard: PartnerDashboardService) {}

  @Get()
  summary(@CurrentUser() currentUser: AuthenticatedPrincipal) {
    return this.dashboard.summary(currentUser.id);
  }
}
