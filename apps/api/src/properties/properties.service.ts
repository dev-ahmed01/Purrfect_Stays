import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  DestinationsQuery,
  FeaturedPropertiesQuery,
  PropertySearchInput,
} from '@purrfect/contracts';
import {
  PetSize,
  PetSpecies,
  Prisma,
  PropertyStatus,
  PropertyType,
  VerificationStatus,
} from '@purrfect/database';
import { buildPaginationMeta, toPrismaPagination } from '../common/pagination/pagination.js';
import { PrismaService } from '../database/prisma.service.js';
import { mapPropertyDetail, mapPropertySummary } from './property.mapper.js';
import { propertyDetailSelect, propertySummarySelect } from './property.select.js';

const DAY_MS = 86_400_000;

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(input: PropertySearchInput) {
    const where = await this.buildSearchWhere(input);
    const pagination = toPrismaPagination(input);

    const [totalItems, properties] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        ...pagination,
        orderBy: this.orderBy(input.sort),
        select: propertySummarySelect,
      }),
    ]);

    return {
      items: properties.map(mapPropertySummary),
      meta: buildPaginationMeta(input, totalItems),
      query: {
        ...input,
        checkIn: input.checkIn?.toISOString().slice(0, 10),
        checkOut: input.checkOut?.toISOString().slice(0, 10),
        availabilityChecked: Boolean(input.checkIn && input.checkOut),
      },
    };
  }

  async featured(input: FeaturedPropertiesQuery) {
    const properties = await this.prisma.property.findMany({
      where: {
        ...this.publicWhere(),
        featured: true,
      },
      orderBy: [
        { averageRating: Prisma.SortOrder.desc },
        { reviewCount: Prisma.SortOrder.desc },
        { name: Prisma.SortOrder.asc },
      ],
      take: input.limit,
      select: propertySummarySelect,
    });

    return { items: properties.map(mapPropertySummary) };
  }

  async destinations(input: DestinationsQuery) {
    const rows = await this.prisma.property.groupBy({
      by: ['city', 'state'],
      where: this.publicWhere(),
      _count: { _all: true },
    });

    const items = rows
      .map((row) => ({
        city: row.city,
        state: row.state,
        stays: row._count._all,
      }))
      .sort((a, b) => b.stays - a.stays || a.city.localeCompare(b.city))
      .slice(0, input.limit);

    return { items };
  }

  async findBySlug(slug: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        slug,
        ...this.publicWhere(),
      },
      select: propertyDetailSelect,
    });

    if (!property) throw new NotFoundException('Property not found.');

    return mapPropertyDetail(property);
  }

  private async buildSearchWhere(input: PropertySearchInput): Promise<Prisma.PropertyWhereInput> {
    const and: Prisma.PropertyWhereInput[] = [this.publicWhere()];

    if (input.destination) {
      and.push({
        OR: [
          { city: { contains: input.destination, mode: Prisma.QueryMode.insensitive } },
          { state: { contains: input.destination, mode: Prisma.QueryMode.insensitive } },
          { locality: { contains: input.destination, mode: Prisma.QueryMode.insensitive } },
          { name: { contains: input.destination, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    if (input.propertyType) {
      and.push({ type: input.propertyType as PropertyType });
    }

    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      and.push({
        startingPricePaise: {
          ...(input.minPrice === undefined ? {} : { gte: Math.round(input.minPrice * 100) }),
          ...(input.maxPrice === undefined ? {} : { lte: Math.round(input.maxPrice * 100) }),
        },
      });
    }

    if (input.minRating !== undefined) {
      and.push({ averageRating: { gte: input.minRating } });
    }

    if (input.guests !== undefined) {
      and.push({
        roomTypes: {
          some: {
            active: true,
            capacity: { gte: input.guests },
          },
        },
      });
    }

    const effectivePetCount =
      input.pets ?? (input.species !== undefined || input.size !== undefined ? 1 : undefined);

    if (effectivePetCount !== undefined || input.species !== undefined || input.size !== undefined) {
      const policy: Prisma.PetPolicyWhereInput = {};

      if (effectivePetCount !== undefined) policy.maxPets = { gte: effectivePetCount };
      if (input.species === PetSpecies.DOG) policy.allowsDogs = true;
      if (input.species === PetSpecies.CAT) policy.allowsCats = true;
      if (input.species === PetSpecies.OTHER) policy.allowsOther = true;
      if (input.size !== undefined) policy.allowedSizes = { has: input.size as PetSize };

      and.push({ petPolicy: { is: policy } });
    }

    for (const slug of input.amenities ?? []) {
      and.push({
        amenities: {
          some: {
            verifiedAt: { not: null },
            amenity: { slug },
          },
        },
      });
    }

    if (input.checkIn && input.checkOut) {
      const availablePropertyIds = await this.availablePropertyIds(
        input.checkIn,
        input.checkOut,
        input.guests,
      );

      and.push({ id: { in: availablePropertyIds } });
    }

    return { AND: and };
  }

  private publicWhere(): Prisma.PropertyWhereInput {
    return {
      status: PropertyStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
      petPolicy: { isNot: null },
      roomTypes: { some: { active: true } },
    };
  }

  private orderBy(sort: PropertySearchInput['sort']): Prisma.PropertyOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return [
          { startingPricePaise: Prisma.SortOrder.asc },
          { averageRating: Prisma.SortOrder.desc },
        ];
      case 'price_desc':
        return [
          { startingPricePaise: Prisma.SortOrder.desc },
          { averageRating: Prisma.SortOrder.desc },
        ];
      case 'rating':
        return [
          { averageRating: Prisma.SortOrder.desc },
          { reviewCount: Prisma.SortOrder.desc },
          { name: Prisma.SortOrder.asc },
        ];
      case 'recommended':
      default:
        return [
          { featured: Prisma.SortOrder.desc },
          { averageRating: Prisma.SortOrder.desc },
          { reviewCount: Prisma.SortOrder.desc },
          { name: Prisma.SortOrder.asc },
        ];
    }
  }

  private async availablePropertyIds(
    checkIn: Date,
    checkOut: Date,
    guests?: number,
  ): Promise<string[]> {
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);

    const rows = await this.prisma.$queryRaw<Array<{ propertyId: string }>>(Prisma.sql`
      SELECT rt."propertyId" AS "propertyId"
      FROM "RoomType" rt
      INNER JOIN "RoomInventory" ri ON ri."roomTypeId" = rt."id"
      WHERE rt."active" = TRUE
        AND ri."date" >= ${checkIn}
        AND ri."date" < ${checkOut}
        AND ri."closed" = FALSE
        AND ri."reservedUnits" < ri."totalUnits"
        ${guests === undefined ? Prisma.empty : Prisma.sql`AND rt."capacity" >= ${guests}`}
      GROUP BY rt."id", rt."propertyId"
      HAVING COUNT(DISTINCT ri."date") = ${nights}
    `);

    return Array.from(new Set(rows.map((row) => row.propertyId)));
  }
}
