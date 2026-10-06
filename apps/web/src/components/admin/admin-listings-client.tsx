'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { AdminListingSummary, PaginationMeta } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatInrPaise } from '../../lib/format';
import { humanizeStatus, statusTone } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { FieldFrame, SelectInput } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';
import { WorkspacePagination } from '../ui/workspace-pagination';

export function AdminListingsClient({ initialStatus }: { initialStatus?: string }) {
  const { request } = useAuth();
  const [items, setItems] = useState<AdminListingSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(initialStatus ?? 'PENDING_REVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: '12', status });

    try {
      const data = await request<{ items: AdminListingSummary[]; meta: PaginationMeta }>(
        '/admin/listings?' + params.toString(),
      );
      setItems(data.items);
      setMeta(data.meta);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load the listing queue.');
    } finally {
      setLoading(false);
    }
  }, [page, request, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Listings"
        title="Review partner-submitted listing states."
        description={meta ? String(meta.totalItems) + ' listing' + (meta.totalItems === 1 ? '' : 's') + ' in this queue.' : 'Listing verification queue.'}
      />

      <Card className="workspace-filter-card">
        <CardBody className="workspace-filter-row">
          <FieldFrame label="Listing status">
            <SelectInput value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="PENDING_REVIEW">Pending review</option>
              <option value="PUBLISHED">Published</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DRAFT">Draft</option>
            </SelectInput>
          </FieldFrame>
        </CardBody>
      </Card>

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {loading ? (
        <div className="workspace-card-list"><div className="skeleton workspace-list-skeleton" /></div>
      ) : items.length === 0 ? (
        <EmptyState title="This queue is clear" description="No listings currently match the selected lifecycle state." />
      ) : (
        <div className="workspace-card-list">
          {items.map((listing) => (
            <Card key={listing.id}>
              <CardBody className="admin-listing-row">
                <div className="workspace-row-heading">
                  <div>
                    <span className="workspace-kicker">{humanizeStatus(listing.type)}</span>
                    <h2>{listing.name}</h2>
                    <p>{listing.city}, {listing.state}</p>
                  </div>
                  <div className="workspace-status-stack">
                    <StatusBadge tone={statusTone(listing.status)}>{humanizeStatus(listing.status)}</StatusBadge>
                    <StatusBadge tone={statusTone(listing.verificationStatus)}>{humanizeStatus(listing.verificationStatus)}</StatusBadge>
                  </div>
                </div>

                <p className="partner-property-description">{listing.shortDescription}</p>

                <div className="admin-partner-strip">
                  <div><span>Partner</span><strong>{listing.partner.fullName}</strong></div>
                  <div><span>Email</span><strong>{listing.partner.email}</strong></div>
                  <div><span>Rooms</span><strong>{listing._count.roomTypes}</strong></div>
                  <div><span>Starting price</span><strong>{formatInrPaise(listing.startingPrice.amountPaise)}</strong></div>
                </div>

                <div className="workspace-inline-actions">
                  <Link className="button button-primary button-sm" href={'/admin/listings/' + listing.id}>
                    Review listing
                  </Link>
                  {listing.status === 'PUBLISHED' ? (
                    <Link className="button button-outline button-sm" href={'/stays/' + listing.slug}>
                      Public page
                    </Link>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {meta ? <WorkspacePagination meta={meta} onPage={setPage} /> : null}
    </>
  );
}
