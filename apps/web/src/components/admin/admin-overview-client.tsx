'use client';

import { ShieldCheck, Star, Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PaginationMeta } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { Alert } from '../ui/alert';
import { Card, CardBody } from '../ui/card';
import { PageHeader } from '../ui/page-header';

type CountResponse = { items: unknown[]; meta: PaginationMeta };

export function AdminOverviewClient() {
  const { request } = useAuth();
  const [pendingListings, setPendingListings] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [suspendedListings, setSuspendedListings] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [listings, reviews, suspended] = await Promise.all([
        request<CountResponse>('/admin/listings?status=PENDING_REVIEW&page=1&pageSize=1'),
        request<CountResponse>('/admin/reviews?status=PENDING&page=1&pageSize=1'),
        request<CountResponse>('/admin/listings?status=SUSPENDED&page=1&pageSize=1'),
      ]);

      setPendingListings(listings.meta.totalItems);
      setPendingReviews(reviews.meta.totalItems);
      setSuspendedListings(suspended.meta.totalItems);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load admin queues.');
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Platform Admin"
        title="Trust-sensitive work, in one queue."
        description="Listing verification and guest-review moderation stay separate from partner/customer controls."
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      <div className="summary-grid">
        <Link href="/admin/listings">
          <Card><CardBody className="summary-card"><Store /><span>Listings awaiting review</span><strong>{pendingListings ?? '—'}</strong></CardBody></Card>
        </Link>
        <Link href="/admin/reviews">
          <Card><CardBody className="summary-card"><Star /><span>Reviews awaiting moderation</span><strong>{pendingReviews ?? '—'}</strong></CardBody></Card>
        </Link>
        <Link href="/admin/listings?status=SUSPENDED">
          <Card><CardBody className="summary-card"><ShieldCheck /><span>Suspended listings</span><strong>{suspendedListings ?? '—'}</strong></CardBody></Card>
        </Link>
      </div>

      <div className="workspace-two-column">
        <Card>
          <CardBody className="workspace-overview-card">
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Listing trust</span>
                <h2>Verify stable listing claims</h2>
              </div>
              <Store size={20} aria-hidden="true" />
            </div>
            <p className="detail-muted">
              Approvals publish the current submitted snapshot and verify its amenity claims in the same transaction.
            </p>
            <Link className="button button-primary button-sm" href="/admin/listings">Open listing queue</Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="workspace-overview-card">
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Guest trust</span>
                <h2>Moderate completed-stay reviews</h2>
              </div>
              <Star size={20} aria-hidden="true" />
            </div>
            <p className="detail-muted">
              Publishing or hiding a review updates public rating aggregates transactionally on the backend.
            </p>
            <Link className="button button-outline button-sm" href="/admin/reviews">Open review queue</Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
