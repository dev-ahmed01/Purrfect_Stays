import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateReviewInput,
  ModerateReviewInput,
  PublicReviewsQuery,
  ReviewsQuery,
  UpdateReviewInput,
} from '@purrfect/contracts';
import {
  BookingStatus,
  Prisma,
  PropertyStatus,
  ReviewStatus,
  VerificationStatus,
} from '@purrfect/database';
import { buildPaginationMeta, toPrismaPagination } from '../common/pagination/pagination.js';
import { PrismaService } from '../database/prisma.service.js';
import { mapReview } from './review.mapper.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateReviewInput) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: input.bookingId,
        userId,
        status: BookingStatus.COMPLETED,
      },
      select: {
        id: true,
        propertyId: true,
        review: { select: { id: true } },
      },
    });

    if (!booking) {
      throw new BadRequestException(
        'A review can only be submitted for your own completed stay.',
      );
    }

    if (booking.review) {
      throw new ConflictException('This booking already has a review.');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          bookingId: booking.id,
          userId,
          propertyId: booking.propertyId,
          rating: input.rating,
          title: input.title,
          body: input.body,
          status: ReviewStatus.PENDING,
        },
        include: {
          property: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              state: true,
            },
          },
          booking: { select: { reference: true } },
        },
      });

      return mapReview(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This booking already has a review.');
      }
      throw error;
    }
  }

  async listMine(userId: string, input: ReviewsQuery) {
    const where: Prisma.ReviewWhereInput = {
      userId,
      ...(input.status ? { status: input.status as ReviewStatus } : {}),
    };
    const pagination = toPrismaPagination(input);

    const [totalItems, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        ...pagination,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: {
          property: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              state: true,
            },
          },
          booking: { select: { reference: true } },
        },
      }),
    ]);

    return {
      items: reviews.map(mapReview),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async update(userId: string, reviewId: string, input: UpdateReviewInput) {
    const review = await this.prisma.serializable(async (tx) => {
      const existing = await tx.review.findFirst({
        where: {
          id: reviewId,
          userId,
          deletedAt: null,
        },
      });

      if (!existing) throw new NotFoundException('Review not found.');

      const wasPublished = existing.status === ReviewStatus.PUBLISHED;
      const updated = await tx.review.update({
        where: { id: existing.id },
        data: {
          ...(input.rating === undefined ? {} : { rating: input.rating }),
          ...(input.title === undefined ? {} : { title: input.title }),
          ...(input.body === undefined ? {} : { body: input.body }),
          status: ReviewStatus.PENDING,
          moderatedByUserId: null,
          moderatedAt: null,
          moderationNote: null,
        },
        include: {
          property: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              state: true,
            },
          },
          booking: { select: { reference: true } },
        },
      });

      if (wasPublished) {
        await this.recomputePropertyRating(tx, existing.propertyId);
      }

      return updated;
    });

    return mapReview(review);
  }

  async withdraw(userId: string, reviewId: string) {
    const result = await this.prisma.serializable(async (tx) => {
      const existing = await tx.review.findFirst({
        where: {
          id: reviewId,
          userId,
        },
      });

      if (!existing) throw new NotFoundException('Review not found.');
      if (existing.deletedAt) return { alreadyWithdrawn: true };

      const wasPublished = existing.status === ReviewStatus.PUBLISHED;

      await tx.review.update({
        where: { id: existing.id },
        data: {
          status: ReviewStatus.HIDDEN,
          deletedAt: new Date(),
          moderationNote: 'Withdrawn by author',
        },
      });

      if (wasPublished) {
        await this.recomputePropertyRating(tx, existing.propertyId);
      }

      return { alreadyWithdrawn: false };
    });

    return {
      withdrawn: true,
      alreadyWithdrawn: result.alreadyWithdrawn,
    };
  }

  async publicForProperty(slug: string, input: PublicReviewsQuery) {
    const property = await this.prisma.property.findFirst({
      where: {
        slug,
        status: PropertyStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      select: {
        id: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    if (!property) throw new NotFoundException('Property not found.');

    const where: Prisma.ReviewWhereInput = {
      propertyId: property.id,
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
    };
    const pagination = toPrismaPagination(input);

    const [totalItems, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        ...pagination,
        orderBy: this.publicOrder(input.sort),
        include: {
          user: { select: { fullName: true } },
        },
      }),
    ]);

    return {
      summary: {
        averageRating: Number(property.averageRating),
        reviewCount: property.reviewCount,
      },
      items: reviews.map(mapReview),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async adminList(input: ReviewsQuery) {
    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      ...(input.status ? { status: input.status as ReviewStatus } : {}),
    };
    const pagination = toPrismaPagination(input);

    const [totalItems, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        ...pagination,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: {
          user: { select: { fullName: true } },
          property: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              state: true,
            },
          },
          booking: { select: { reference: true } },
        },
      }),
    ]);

    return {
      items: reviews.map(mapReview),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async moderate(adminUserId: string, reviewId: string, input: ModerateReviewInput) {
    const review = await this.prisma.serializable(async (tx) => {
      const existing = await tx.review.findUnique({
        where: { id: reviewId },
      });

      if (!existing) throw new NotFoundException('Review not found.');
      if (existing.deletedAt && input.status === ReviewStatus.PUBLISHED) {
        throw new BadRequestException('A withdrawn review cannot be published.');
      }

      const nextStatus = input.status as ReviewStatus;
      const publicStateChanged =
        (existing.status === ReviewStatus.PUBLISHED) !==
        (nextStatus === ReviewStatus.PUBLISHED);

      const updated = await tx.review.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          moderatedByUserId: adminUserId,
          moderatedAt: new Date(),
          moderationNote: input.note ?? null,
        },
        include: {
          user: { select: { fullName: true } },
          property: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              state: true,
            },
          },
          booking: { select: { reference: true } },
        },
      });

      if (publicStateChanged) {
        await this.recomputePropertyRating(tx, existing.propertyId);
      }

      return updated;
    });

    return mapReview(review);
  }

  private publicOrder(
    sort: PublicReviewsQuery['sort'],
  ): Prisma.ReviewOrderByWithRelationInput[] {
    switch (sort) {
      case 'rating_high':
        return [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
      case 'rating_low':
        return [{ rating: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }];
      case 'recent':
      default:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
    }
  }

  private async recomputePropertyRating(
    tx: Prisma.TransactionClient,
    propertyId: string,
  ) {
    const [property, aggregate] = await Promise.all([
      tx.property.findUniqueOrThrow({
        where: { id: propertyId },
        select: {
          ratingBaselineCount: true,
          ratingBaselineTotal: true,
        },
      }),
      tx.review.aggregate({
        where: {
          propertyId,
          status: ReviewStatus.PUBLISHED,
          deletedAt: null,
        },
        _sum: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const reviewCount = property.ratingBaselineCount + aggregate._count._all;
    const ratingTotal =
      Number(property.ratingBaselineTotal) + (aggregate._sum.rating ?? 0);

    await tx.property.update({
      where: { id: propertyId },
      data: {
        averageRating: reviewCount === 0 ? 0 : ratingTotal / reviewCount,
        reviewCount,
      },
    });
  }
}
