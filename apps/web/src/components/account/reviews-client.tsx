'use client';

import {
  createReviewSchema,
  updateReviewSchema,
} from '@purrfect/contracts';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { BookingView, MyReview, PaginationMeta } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly } from '../../lib/format';
import { humanizeStatus, statusTone, zodFieldErrors } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { FieldFrame, SelectInput, TextArea, TextInput } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';
import { WorkspacePagination } from '../ui/workspace-pagination';

type Editor =
  | { kind: 'closed' }
  | { kind: 'create'; bookingId: string }
  | { kind: 'edit'; review: MyReview };

export function ReviewsClient({ initialBookingId }: { initialBookingId?: string }) {
  const { request } = useAuth();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [editor, setEditor] = useState<Editor>(
    initialBookingId ? { kind: 'create', bookingId: initialBookingId } : { kind: 'closed' },
  );
  const [page, setPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedMeta, setCompletedMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewData, bookingData] = await Promise.all([
        request<{ items: MyReview[]; meta: PaginationMeta }>('/reviews?page=' + String(page) + '&pageSize=12'),
        request<{ items: BookingView[]; meta: PaginationMeta }>(
          '/bookings?status=COMPLETED&page=' + String(completedPage) + '&pageSize=12',
        ),
      ]);
      setReviews(reviewData.items);
      setMeta(reviewData.meta);
      setCompletedMeta(bookingData.meta);

      let completedBookings = bookingData.items;
      if (
        initialBookingId &&
        !completedBookings.some((booking) => booking.id === initialBookingId)
      ) {
        try {
          const linkedBooking = await request<BookingView>('/bookings/' + initialBookingId);
          if (linkedBooking.status === 'COMPLETED') {
            completedBookings = [linkedBooking, ...completedBookings];
          }
        } catch {
          // Eligibility is still enforced by the create-review endpoint.
        }
      }

      setBookings(completedBookings);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load your reviews.');
    } finally {
      setLoading(false);
    }
  }, [completedPage, initialBookingId, page, request]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewableBookings = useMemo(
    () => bookings.filter((booking) => booking.review === null),
    [bookings],
  );

  useEffect(() => {
    if (
      editor.kind === 'create' &&
      bookings.some(
        (booking) => booking.id === editor.bookingId && booking.review !== null,
      )
    ) {
      setEditor({ kind: 'closed' });
    }
  }, [bookings, editor]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setError(null);

    const form = new FormData(event.currentTarget);
    const raw = {
      rating: form.get('rating'),
      title: form.get('title'),
      body: form.get('body'),
    };

    const parsed = editor.kind === 'edit'
      ? updateReviewSchema.safeParse(raw)
      : createReviewSchema.safeParse({
          ...raw,
          bookingId: editor.kind === 'create' ? editor.bookingId : '',
        });

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error.issues));
      return;
    }

    setBusy(true);
    try {
      if (editor.kind === 'edit') {
        await request('/reviews/' + editor.review.id, {
          method: 'PATCH',
          body: JSON.stringify(parsed.data),
        });
      } else {
        await request('/reviews', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
      }

      setEditor({ kind: 'closed' });
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not save your review.');
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(review: MyReview) {
    if (!window.confirm('Withdraw this review? The completed stay will remain linked to its review history.')) return;

    setBusy(true);
    setError(null);
    try {
      await request('/reviews/' + review.id, { method: 'DELETE' });
      if (editor.kind === 'edit' && editor.review.id === review.id) {
        setEditor({ kind: 'closed' });
      }
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not withdraw this review.');
    } finally {
      setBusy(false);
    }
  }

  const editReview = editor.kind === 'edit' ? editor.review : null;
  const createBooking = editor.kind === 'create'
    ? reviewableBookings.find((booking) => booking.id === editor.bookingId)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Reviews"
        title="Reviews are tied to stays you actually completed."
        description={meta ? String(meta.totalItems) + ' review' + (meta.totalItems === 1 ? '' : 's') + ' written from your account.' : 'Manage your stay reviews.'}
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {editor.kind !== 'closed' ? (
        <Card className="workspace-form-card">
          <CardBody>
            {editor.kind === 'create' && !createBooking ? (
              <Alert tone="info" title="That stay is not reviewable">
                It may already have a review, or it may no longer be an eligible completed booking.
              </Alert>
            ) : (
              <form className="workspace-form" onSubmit={submit} noValidate>
                <div className="workspace-form-heading">
                  <div>
                    <p className="section-eyebrow">{editReview ? 'Edit review' : 'Completed stay'}</p>
                    <h2>
                      {editReview?.property?.name ?? createBooking?.property.name ?? 'Write your review'}
                    </h2>
                  </div>
                  <Button variant="ghost" onClick={() => setEditor({ kind: 'closed' })}>Close</Button>
                </div>

                <FieldFrame label="Rating" error={errors.rating} required>
                  <SelectInput defaultValue={String(editReview?.rating ?? 5)} name="rating">
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Very good</option>
                    <option value="3">3 — Good</option>
                    <option value="2">2 — Fair</option>
                    <option value="1">1 — Poor</option>
                  </SelectInput>
                </FieldFrame>

                <FieldFrame label="Title" error={errors.title} required>
                  <TextInput
                    defaultValue={editReview?.title}
                    name="title"
                    placeholder="What stood out?"
                    required
                  />
                </FieldFrame>

                <FieldFrame label="Review" error={errors.body} required>
                  <TextArea
                    defaultValue={editReview?.body}
                    name="body"
                    placeholder="Share useful details about the stay and travelling with your pet."
                    required
                  />
                </FieldFrame>

                <div className="workspace-form-actions">
                  <Button variant="ghost" onClick={() => setEditor({ kind: 'closed' })}>Cancel</Button>
                  <Button disabled={busy} type="submit">
                    {busy ? 'Saving…' : editReview ? 'Save & resubmit' : 'Submit review'}
                  </Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      ) : null}

      {bookings.length > 0 ? (
        <Card className="reviewable-stays-card">
          <CardBody>
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Ready to review</span>
                <h2>Completed stays without a review</h2>
              </div>
              <Star size={20} aria-hidden="true" />
            </div>
            {reviewableBookings.length > 0 ? (
              <div className="reviewable-stay-list">
                {reviewableBookings.map((booking) => (
                  <div key={booking.id}>
                    <div>
                      <strong>{booking.property.name}</strong>
                      <span>{formatDateOnly(booking.checkOut)} · {booking.reference}</span>
                    </div>
                    <Button size="sm" onClick={() => setEditor({ kind: 'create', bookingId: booking.id })}>
                      Write review
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="detail-muted">Every completed stay on this page already has review history.</p>
            )}
            {completedMeta ? (
              <WorkspacePagination meta={completedMeta} onPage={setCompletedPage} />
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {loading ? (
        <div className="workspace-card-list">
          <div className="skeleton workspace-list-skeleton" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="After a stay is completed, you can review it once from this page."
        />
      ) : (
        <div className="workspace-card-list">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardBody className="my-review-card">
                <div className="workspace-row-heading">
                  <div>
                    <span className="workspace-kicker">{review.booking?.reference ?? 'Completed stay'}</span>
                    <h2>{review.property?.name ?? review.title}</h2>
                    <p>{review.property ? review.property.city + ', ' + review.property.state : ''}</p>
                  </div>
                  <StatusBadge tone={statusTone(review.status)}>
                    {review.deletedAt ? 'Withdrawn' : humanizeStatus(review.status)}
                  </StatusBadge>
                </div>

                <div className="my-review-rating" aria-label={String(review.rating) + ' out of 5 stars'}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <h3>{review.title}</h3>
                <p>{review.body}</p>

                {review.moderation.note ? (
                  <Alert tone={review.status === 'HIDDEN' ? 'danger' : 'info'} title="Moderation note">
                    {review.moderation.note}
                  </Alert>
                ) : null}

                {review.deletedAt ? (
                  <p className="detail-muted">
                    This review was withdrawn and remains linked to its completed stay history.
                  </p>
                ) : (
                  <div className="workspace-inline-actions">
                    <Button size="sm" variant="outline" onClick={() => setEditor({ kind: 'edit', review })}>
                      <Pencil size={15} aria-hidden="true" /> Edit
                    </Button>
                    <Button disabled={busy} size="sm" variant="ghost" onClick={() => withdraw(review)}>
                      <Trash2 size={15} aria-hidden="true" /> Withdraw
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {meta ? <WorkspacePagination meta={meta} onPage={setPage} /> : null}
    </>
  );
}
