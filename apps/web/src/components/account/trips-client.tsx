'use client';

import { cancelBookingSchema } from '@purrfect/contracts';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { BookingView, PaginationMeta } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly, formatInrPaise } from '../../lib/format';
import { humanizeStatus, statusTone } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { FieldFrame, TextArea } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';

export function TripsClient() {
  const { request } = useAuth();
  const [items, setItems] = useState<BookingView[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ items: BookingView[]; meta: PaginationMeta }>(
        '/bookings?page=1&pageSize=50',
      );
      setItems(data.items);
      setMeta(data.meta);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load your trips.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelBooking(bookingId: string) {
    const parsed = cancelBookingSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Add a cancellation reason.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await request('/bookings/' + bookingId + '/cancel', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      setCancelId(null);
      setReason('');
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not cancel this booking.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Trips"
        title="Your stays, from booked to completed."
        description={meta ? String(meta.totalItems) + ' reservation' + (meta.totalItems === 1 ? '' : 's') + ' in your account.' : 'Your reservation history.'}
        actions={<Link className="button button-primary" href="/stays">Find another stay</Link>}
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {loading ? (
        <div className="workspace-card-list">
          <div className="skeleton workspace-list-skeleton" />
          <div className="skeleton workspace-list-skeleton" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No trips yet"
          description="When you reserve a pet-friendly stay, it will appear here with its lifecycle and pricing snapshot."
          action={<Link className="button button-primary" href="/stays">Explore stays</Link>}
        />
      ) : (
        <div className="workspace-card-list">
          {items.map((booking) => (
            <Card key={booking.id}>
              <CardBody className="trip-card">
                <div className="trip-card-main">
                  <div className="workspace-row-heading">
                    <div>
                      <span className="workspace-kicker">{booking.reference}</span>
                      <h2>{booking.property.name}</h2>
                      <p>{booking.property.city}, {booking.property.state} · {booking.roomType.name}</p>
                    </div>
                    <StatusBadge tone={statusTone(booking.status)}>
                      {humanizeStatus(booking.status)}
                    </StatusBadge>
                  </div>

                  <div className="trip-facts">
                    <div><span>Check-in</span><strong>{formatDateOnly(booking.checkIn)}</strong></div>
                    <div><span>Check-out</span><strong>{formatDateOnly(booking.checkOut)}</strong></div>
                    <div><span>Guests</span><strong>{booking.guests}</strong></div>
                    <div><span>Pets</span><strong>{booking.petCount}</strong></div>
                    <div><span>Total</span><strong>{formatInrPaise(booking.pricing.totalPaise)}</strong></div>
                  </div>

                  <div className="trip-pets">
                    {booking.pets.map((pet, index) => (
                      <span key={booking.id + '-' + pet.name + '-' + String(index)}>{pet.name} · {pet.breed}</span>
                    ))}
                  </div>
                </div>

                <div className="trip-card-actions">
                  <Link className="button button-outline button-sm" href={'/stays/' + booking.property.slug}>
                    View property
                  </Link>
                  {booking.status === 'COMPLETED' ? (
                    <Link className="button button-primary button-sm" href={'/account/reviews?bookingId=' + booking.id}>
                      Review stay
                    </Link>
                  ) : null}
                  {booking.status === 'CONFIRMED' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setCancelId((current) => current === booking.id ? null : booking.id)}
                    >
                      Cancel booking
                    </Button>
                  ) : null}
                </div>

                {cancelId === booking.id ? (
                  <div className="inline-action-panel">
                    <FieldFrame label="Cancellation reason" required>
                      <TextArea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Tell us why you need to cancel."
                      />
                    </FieldFrame>
                    <div className="inline-action-buttons">
                      <Button variant="ghost" onClick={() => { setCancelId(null); setReason(''); }}>
                        Keep booking
                      </Button>
                      <Button
                        disabled={busy}
                        variant="danger"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        {busy ? 'Cancelling…' : 'Confirm cancellation'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
