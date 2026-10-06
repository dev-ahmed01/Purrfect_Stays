import { ReviewsClient } from '../../../components/account/reviews-client';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string | string[] }>;
}) {
  const params = await searchParams;
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;

  return <ReviewsClient initialBookingId={bookingId} />;
}
