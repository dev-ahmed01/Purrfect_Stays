import { Star } from 'lucide-react';
import type { PublicReviewsResponse } from '../lib/catalogue-types';

export function PropertyReviews({
  reviews,
}: {
  reviews: PublicReviewsResponse;
}) {
  return (
    <section className="detail-section" id="reviews">
      <div className="detail-section-heading">
        <div>
          <p className="section-eyebrow">Guest trust</p>
          <h2>Reviews from completed stays</h2>
        </div>
        <div className="review-summary">
          <Star size={17} fill="currentColor" aria-hidden="true" />
          <strong>{reviews.summary.averageRating.toFixed(1)}</strong>
          <span>{reviews.summary.reviewCount} ratings</span>
        </div>
      </div>

      {reviews.items.length > 0 ? (
        <div className="review-list">
          {reviews.items.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card-top">
                <div>
                  <strong>{review.author?.displayName ?? 'Verified guest'}</strong>
                  <span>{new Intl.DateTimeFormat('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(review.createdAt))}</span>
                </div>
                <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                  ★ {review.rating}
                </span>
              </div>
              <h3>{review.title}</h3>
              <p>{review.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="detail-muted">
          No locally stored published review text is available yet.
        </p>
      )}
    </section>
  );
}
