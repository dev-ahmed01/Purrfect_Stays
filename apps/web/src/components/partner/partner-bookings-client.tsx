'use client';

import { partnerBookingTransitionSchema } from '@purrfect/contracts';
import { CheckCircle2, DoorOpen, Mail, Phone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PaginationMeta, PartnerBookingView } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly, formatInrPaise } from '../../lib/format';
import { humanizeStatus, statusTone } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { FieldFrame, SelectInput, TextInput } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';
import { WorkspacePagination } from '../ui/workspace-pagination';

export function PartnerBookingsClient() {
  const { request } = useAuth();
  const [items, setItems] = useState<PartnerBookingView[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (statusFilter) params.set('status', statusFilter);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    try {
      const data = await request<{ items: PartnerBookingView[]; meta: PaginationMeta }>(
        '/partner/bookings?' + params.toString(),
      );
      setItems(data.items);
      setMeta(data.meta);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load partner bookings.');
    } finally {
      setLoading(false);
    }
  }, [from, page, request, statusFilter, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(booking: PartnerBookingView, toStatus: 'CHECKED_IN' | 'COMPLETED') {
    const parsed = partnerBookingTransitionSchema.safeParse({ toStatus });
    if (!parsed.success) return;

    setBusyId(booking.id);
    setError(null);
    try {
      await request('/partner/bookings/' + booking.id + '/status', {
        method: 'PATCH',
        body: JSON.stringify(parsed.data),
      });
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not update this stay.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Bookings"
        title="Guest stays, not just reservations."
        description={meta ? String(meta.totalItems) + ' booking' + (meta.totalItems === 1 ? '' : 's') + ' match the current view.' : 'Operational guest stays for your properties.'}
      />

      <Card className="workspace-filter-card">
        <CardBody className="workspace-filter-row">
          <FieldFrame label="Status">
            <SelectInput value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked in</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </SelectInput>
          </FieldFrame>
          <FieldFrame label="From">
            <TextInput type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
          </FieldFrame>
          <FieldFrame label="To">
            <TextInput type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
          </FieldFrame>
          <Button variant="outline" onClick={() => { setStatusFilter(''); setFrom(''); setTo(''); setPage(1); }}>
            Clear
          </Button>
        </CardBody>
      </Card>

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {loading ? (
        <div className="workspace-card-list"><div className="skeleton workspace-list-skeleton" /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No bookings in this view" description="Adjust the date or status filters to see other guest stays." />
      ) : (
        <div className="workspace-card-list">
          {items.map((booking) => (
            <Card key={booking.id}>
              <CardBody className="partner-booking-card">
                <div className="workspace-row-heading">
                  <div>
                    <span className="workspace-kicker">{booking.reference}</span>
                    <h2>{booking.guest.fullName}</h2>
                    <p>{booking.property.name} · {booking.roomType.name}</p>
                  </div>
                  <StatusBadge tone={statusTone(booking.status)}>{humanizeStatus(booking.status)}</StatusBadge>
                </div>

                <div className="trip-facts">
                  <div><span>Check-in</span><strong>{formatDateOnly(booking.checkIn)}</strong></div>
                  <div><span>Check-out</span><strong>{formatDateOnly(booking.checkOut)}</strong></div>
                  <div><span>Guests</span><strong>{booking.guests}</strong></div>
                  <div><span>Pets</span><strong>{booking.petCount}</strong></div>
                  <div><span>Value</span><strong>{formatInrPaise(booking.pricing.totalPaise)}</strong></div>
                </div>

                <div className="guest-contact-row">
                  <span><Mail size={14} aria-hidden="true" /> {booking.guest.email}</span>
                  {booking.guest.phone ? <span><Phone size={14} aria-hidden="true" /> {booking.guest.phone}</span> : null}
                </div>

                <div className="trip-pets">
                  {booking.pets.map((pet, index) => (
                    <span key={booking.id + '-pet-' + String(index)}>{pet.name} · {pet.breed}</span>
                  ))}
                </div>

                <div className="workspace-inline-actions">
                  {booking.status === 'CONFIRMED' ? (
                    <Button disabled={busyId === booking.id} onClick={() => transition(booking, 'CHECKED_IN')}>
                      <DoorOpen size={16} aria-hidden="true" />
                      {busyId === booking.id ? 'Updating…' : 'Check in'}
                    </Button>
                  ) : null}
                  {booking.status === 'CHECKED_IN' ? (
                    <Button disabled={busyId === booking.id} onClick={() => transition(booking, 'COMPLETED')}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {busyId === booking.id ? 'Updating…' : 'Complete stay'}
                    </Button>
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
