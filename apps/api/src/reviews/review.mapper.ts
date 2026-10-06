export function reviewAuthorDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? 'Guest';

  return `${parts[0]} ${parts.at(-1)?.charAt(0).toUpperCase()}.`;
}

export function mapReview(review: {
  id: string;
  bookingId: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  moderationNote: string | null;
  moderatedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { fullName: string };
  property?: { id: string; slug: string; name: string; city: string; state: string };
  booking?: { reference: string };
}) {
  return {
    id: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    status: review.status,
    ...(review.user
      ? { author: { displayName: reviewAuthorDisplayName(review.user.fullName) } }
      : {}),
    ...(review.property ? { property: review.property } : {}),
    ...(review.booking ? { booking: review.booking } : {}),
    moderation: {
      note: review.moderationNote,
      moderatedAt: review.moderatedAt,
    },
    deletedAt: review.deletedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
