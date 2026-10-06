import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminListingActionInput,
  AdminListingDecisionInput,
  AdminListingQueueQuery,
} from '@purrfect/contracts';
import {
  Prisma,
  PropertyStatus,
  VerificationStatus,
} from '@purrfect/database';
import {
  buildPaginationMeta,
  toPrismaPagination,
} from '../common/pagination/pagination.js';
import { PrismaService } from '../database/prisma.service.js';
import { mapPartnerPropertyDetail, mapPartnerPropertySummary } from './partner-property.mapper.js';
import { PartnerPropertiesService } from './partner-properties.service.js';
import {
  adminListingDetailSelect,
  adminListingSummarySelect,
} from './admin-listing.select.js';
import { assertPropertyTransition } from './property-state-machine.js';

@Injectable()
export class AdminListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerProperties: PartnerPropertiesService,
  ) {}

  async list(input: AdminListingQueueQuery) {
    const where: Prisma.PropertyWhereInput = {
      ...(input.status ? { status: input.status as PropertyStatus } : {}),
      ...(input.verificationStatus
        ? { verificationStatus: input.verificationStatus as VerificationStatus }
        : {}),
    };
    const pagination = toPrismaPagination(input);

    const [totalItems, properties] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        ...pagination,
        orderBy: [
          { updatedAt: 'asc' },
          { id: 'asc' },
        ],
        select: adminListingSummarySelect,
      }),
    ]);

    return {
      items: properties.map((property) => ({
        ...mapPartnerPropertySummary(property),
        partner: property.partner,
      })),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async findOne(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: adminListingDetailSelect,
    });

    if (!property) throw new NotFoundException('Property not found.');

    return {
      ...mapPartnerPropertyDetail(property),
      partner: property.partner,
    };
  }

  async decide(
    adminUserId: string,
    propertyId: string,
    input: AdminListingDecisionInput,
  ) {
    const property = await this.prisma.serializable(async (tx) => {
      const existing = await tx.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          status: true,
          verificationStatus: true,
        },
      });

      if (!existing) throw new NotFoundException('Property not found.');
      if (existing.status !== PropertyStatus.PENDING_REVIEW) {
        throw new ConflictException(
          'Only a listing currently pending review can be approved or rejected.',
        );
      }

      const now = new Date();

      if (input.decision === 'APPROVE') {
        assertPropertyTransition(existing.status, PropertyStatus.PUBLISHED);
        await this.partnerProperties.assertListingReady(tx, existing.id);

        await tx.propertyAmenity.updateMany({
          where: { propertyId: existing.id },
          data: { verifiedAt: now },
        });

        await tx.propertyStatusEvent.create({
          data: {
            propertyId: existing.id,
            fromStatus: existing.status,
            toStatus: PropertyStatus.PUBLISHED,
            actorUserId: adminUserId,
            reason: input.note,
          },
        });

        await tx.propertyVerification.create({
          data: {
            propertyId: existing.id,
            status: VerificationStatus.VERIFIED,
            notes: input.note,
            actorUserId: adminUserId,
          },
        });

        return tx.property.update({
          where: { id: existing.id },
          data: {
            status: PropertyStatus.PUBLISHED,
            verificationStatus: VerificationStatus.VERIFIED,
            publishedAt: now,
          },
          select: adminListingDetailSelect,
        });
      }

      assertPropertyTransition(existing.status, PropertyStatus.DRAFT);

      await tx.propertyAmenity.updateMany({
        where: { propertyId: existing.id },
        data: { verifiedAt: null },
      });

      await tx.propertyStatusEvent.create({
        data: {
          propertyId: existing.id,
          fromStatus: existing.status,
          toStatus: PropertyStatus.DRAFT,
          actorUserId: adminUserId,
          reason: input.note,
        },
      });

      await tx.propertyVerification.create({
        data: {
          propertyId: existing.id,
          status: VerificationStatus.REJECTED,
          notes: input.note,
          actorUserId: adminUserId,
        },
      });

      return tx.property.update({
        where: { id: existing.id },
        data: {
          status: PropertyStatus.DRAFT,
          verificationStatus: VerificationStatus.REJECTED,
          publishedAt: null,
        },
        select: adminListingDetailSelect,
      });
    });

    return {
      ...mapPartnerPropertyDetail(property),
      partner: property.partner,
    };
  }

  async suspend(
    adminUserId: string,
    propertyId: string,
    input: AdminListingActionInput,
  ) {
    const property = await this.prisma.serializable(async (tx) => {
      const existing = await tx.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existing) throw new NotFoundException('Property not found.');
      assertPropertyTransition(existing.status, PropertyStatus.SUSPENDED);

      await tx.propertyStatusEvent.create({
        data: {
          propertyId: existing.id,
          fromStatus: existing.status,
          toStatus: PropertyStatus.SUSPENDED,
          actorUserId: adminUserId,
          reason: input.note,
        },
      });

      return tx.property.update({
        where: { id: existing.id },
        data: {
          status: PropertyStatus.SUSPENDED,
        },
        select: adminListingDetailSelect,
      });
    });

    return {
      ...mapPartnerPropertyDetail(property),
      partner: property.partner,
    };
  }

  async restore(
    adminUserId: string,
    propertyId: string,
    input: AdminListingActionInput,
  ) {
    const property = await this.prisma.serializable(async (tx) => {
      const existing = await tx.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          status: true,
          verificationStatus: true,
          publishedAt: true,
        },
      });

      if (!existing) throw new NotFoundException('Property not found.');
      if (existing.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new ConflictException(
          'Only a previously verified suspended listing can be restored directly.',
        );
      }

      assertPropertyTransition(existing.status, PropertyStatus.PUBLISHED);
      await this.partnerProperties.assertListingReady(tx, existing.id);

      await tx.propertyStatusEvent.create({
        data: {
          propertyId: existing.id,
          fromStatus: existing.status,
          toStatus: PropertyStatus.PUBLISHED,
          actorUserId: adminUserId,
          reason: input.note,
        },
      });

      return tx.property.update({
        where: { id: existing.id },
        data: {
          status: PropertyStatus.PUBLISHED,
          publishedAt: existing.publishedAt ?? new Date(),
        },
        select: adminListingDetailSelect,
      });
    });

    return {
      ...mapPartnerPropertyDetail(property),
      partner: property.partner,
    };
  }
}
