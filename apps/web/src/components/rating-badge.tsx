import { Star } from 'lucide-react';

export function RatingBadge({
  rating,
  count,
}: {
  rating: number;
  count?: number;
}) {
  return (
    <span className="rating-badge" aria-label={`${rating} out of 5 stars${count ? `, ${count} reviews` : ''}`}>
      <Star size={12} fill="currentColor" aria-hidden="true" />
      {rating.toFixed(1)}
      {count ? <span className="rating-count">({count})</span> : null}
    </span>
  );
}
