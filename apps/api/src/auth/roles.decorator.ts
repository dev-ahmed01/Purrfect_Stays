import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@purrfect/contracts';

export const ROLES_KEY = 'purrfect:roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
