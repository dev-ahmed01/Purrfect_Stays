import { Injectable, NotFoundException } from '@nestjs/common';
import { PropertyStatus, VerificationStatus } from '@purrfect/database';
import { PrismaService } from '../database/prisma.service.js';
import { mapPropertySummary } from '../properties/property.mapper.js';
import { propertySummarySelect } from '../properties/property.select.js';

@Injectable()
export class FavouritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const favourites = await this.prisma.favourite.findMany({
      where: {
        userId,
        property: {
          status: PropertyStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VERIFIED,
          petPolicy: { isNot: null },
          roomTypes: { some: { active: true } },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        property: {
          select: propertySummarySelect,
        },
      },
    });

    return {
      items: favourites.map((item) => ({
        createdAt: item.createdAt,
        property: mapPropertySummary(item.property),
      })),
    };
  }

  async add(userId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        status: PropertyStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VERIFIED,
        petPolicy: { isNot: null },
        roomTypes: { some: { active: true } },
      },
      select: { id: true },
    });

    if (!property) throw new NotFoundException('Property not found.');

    const favourite = await this.prisma.favourite.upsert({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      update: {},
      create: {
        userId,
        propertyId,
      },
      select: {
        createdAt: true,
        property: {
          select: propertySummarySelect,
        },
      },
    });

    return {
      saved: true,
      createdAt: favourite.createdAt,
      property: mapPropertySummary(favourite.property),
    };
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.favourite.deleteMany({
      where: {
        userId,
        propertyId,
      },
    });

    return { saved: false };
  }
}
