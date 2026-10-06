'use client';

import { moderateReviewSchema } from '@purrfect/contracts';
import { CheckCircle2, EyeOff, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { AdminReview, PaginationMeta } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly } from '../../lib/format';
import { humanizeStatus, statusTone } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { FieldFrame, SelectInput, TextArea } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';
import { WorkspacePagination } from '../ui/workspace-pagination';

export function AdminReviewsClient() {
  const { request } = useAuth();
  const [items, setItems] = useState<AdminReview[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');
  const [actionId, setActionId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (status) params.set('status', status);

    try {
      const data = await request<{ items: AdminReview[]; meta: PaginationMeta }>(
        '/admin/reviews?' + params.toString(),
      );
      setItems(data.items);
      setMeta(data.meta);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load the review queue.');
    } finally {
      setLoading(false);
    }
  }, [page, request, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(reviewId: string, nextStatus: 'PUBLISHED' | 'HIDDEN') {
    const parsed = moderateReviewSchema.safeParse({
      status: nextStatus,
      note: note.trim() || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the moderation note.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await request('/admin/reviews/' + reviewId + '/moderate', {
        method: 'PATCH',
        body: JSON.stringify(parsed.data),
      });
      setActionId(null);
      setNote('');
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not moderate this review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Review moderation"
        title="Published ratings stay tied to completed stays."
        description={meta ? String(meta.totalItems) + ' review' + (meta.totalItems === 1 ? '' : 's') + ' in the selected moderation state.' : 'Guest-review moderation.'}
      />

      <Card className="workspace-filter-card">
        <CardBody className="workspace-filter-row">
          <FieldFrame label="Review state">
            <SelectInput value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="PENDING">Pending</option>
              <option value="PUBLISHED">Published</option>
              <option value="HIDDEN">Hidden</option>
              <option value="">All active reviews</option>
            </SelectInput>
          </FieldFrame>
        </CardBody>
      </Card>

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {loading ? (
        <div className="workspace-card-list"><div className="skeleton workspace-list-skeleton" /></div>
      ) : items.length === 0 ? (
        <EmptyState title="This moderation queue is clear" description="No active reviews match the selected state." />
      ) : (
        <div className="workspace-card-list">
          {items.map((review) => (
            <Card key={review.id}>
              <CardBody className="admin-review-card">
                <div className="workspace-row-heading">
                  <div>
                    <span className="workspace-kicker">{review.booking?.reference ?? 'Completed stay'}</span>
                    <h2>{review.property?.name ?? review.title}</h2>
                    <p>{review.author?.displayName ?? 'Verified guest'} · {formatDateOnly(review.createdAt)}</p>
                  </div>
                  <StatusBadge tone={statusTone(review.status)}>{humanizeStatus(review.status)}</StatusBadge>
                </div>

                <div className="my-review-rating" aria-label={String(review.rating) + ' out of 5 stars'}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <h3>{review.title}</h3>
                <p>{review.body}</p>

                {review.moderation.note ? (
                  <Alert tone={review.status === 'HIDDEN' ? 'danger' : 'info'} title="Current moderation note">
                    {review.moderation.note}
                  </Alert>
                ) : null}

                <div className="workspace-inline-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActionId(actionId === review.id ? null : review.id);
                      setNote(review.moderation.note ?? '');
                    }}
                  >
                    <Star size={15} aria-hidden="true" /> Moderate
                  </Button>
                </div>

                {actionId === review.id ? (
                  <div className="inline-action-panel">
                    <FieldFrame label="Moderation note" hint="Optional for review moderation.">
                      <TextArea value={note} onChange={(event) => setNote(event.target.value)} />
                    </FieldFrame>
                    <div className="inline-action-buttons">
                      <Button
                        disabled={busy}
                        onClick={() => moderate(review.id, 'PUBLISHED')}
                      >
                        <CheckCircle2 size={15} aria-hidden="true" />
                        {busy ? 'Saving…' : 'Publish'}
                      </Button>
                      <Button
                        disabled={busy}
                        variant="danger"
                        onClick={() => moderate(review.id, 'HIDDEN')}
                      >
                        <EyeOff size={15} aria-hidden="true" />
                        {busy ? 'Saving…' : 'Hide'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {meta ? <WorkspacePagination meta={meta} onPage={setPage} /> : null}
    </>
  );
}
