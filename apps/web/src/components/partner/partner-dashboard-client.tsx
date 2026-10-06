'use client';

import { Building2, CalendarCheck2, DoorOpen, LogOut, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PartnerDashboard } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly, formatInrPaise } from '../../lib/format';
import { Card, CardBody } from '../ui/card';
import { Alert } from '../ui/alert';
import { PageHeader } from '../ui/page-header';

export function PartnerDashboardClient() {
  const { request } = useAuth();
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await request<PartnerDashboard>('/partner/dashboard'));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load partner operations.');
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Partner Hub"
        title="Today’s operating picture."
        description={data ? 'Business date ' + formatDateOnly(data.businessDate) + '. Reservation value is not payment revenue.' : 'Listings, inventory and guest stays in one place.'}
        actions={<Link className="button button-primary" href="/partner/properties">Manage properties</Link>}
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      <div className="summary-grid partner-summary-grid">
        <Card><CardBody className="summary-card"><Building2 /><span>Properties</span><strong>{data ? data.properties.total : '—'}</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><CalendarCheck2 /><span>Upcoming confirmed</span><strong>{data ? data.stays.upcomingConfirmed : '—'}</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><DoorOpen /><span>Arrivals today</span><strong>{data ? data.stays.arrivalsToday : '—'}</strong></CardBody></Card>
        <Card><CardBody className="summary-card"><LogOut /><span>Departures today</span><strong>{data ? data.stays.departuresToday : '—'}</strong></CardBody></Card>
      </div>

      <div className="workspace-two-column">
        <Card>
          <CardBody className="workspace-overview-card">
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Reservations</span>
                <h2>Operational value</h2>
              </div>
              <WalletCards size={20} aria-hidden="true" />
            </div>
            <strong className="workspace-big-number">
              {data ? formatInrPaise(data.reservationValue.amountPaise) : '—'}
            </strong>
            <p className="detail-muted">
              {data?.reservationValue.note ?? 'Confirmed, checked-in and completed reservation totals.'}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="workspace-overview-card">
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Listing states</span>
                <h2>Portfolio</h2>
              </div>
              <Building2 size={20} aria-hidden="true" />
            </div>
            <div className="overview-metrics overview-metrics-wrap">
              {Object.entries(data?.properties.byStatus ?? {}).map(([status, count]) => (
                <div key={status}><strong>{count}</strong><span>{status.toLowerCase().replace('_', ' ')}</span></div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="workspace-section-card">
        <CardBody>
          <div className="workspace-row-heading">
            <div>
              <span className="workspace-kicker">Next arrivals</span>
              <h2>Upcoming guests</h2>
            </div>
            <Link className="button button-outline button-sm" href="/partner/bookings">Open bookings</Link>
          </div>

          {data?.nextArrivals.length ? (
            <div className="workspace-table">
              {data.nextArrivals.map((booking) => (
                <div className="workspace-table-row" key={booking.id}>
                  <div>
                    <strong>{booking.guest.fullName}</strong>
                    <span>{booking.property.name} · {booking.roomType.name}</span>
                  </div>
                  <div><span>Check-in</span><strong>{formatDateOnly(booking.checkIn)}</strong></div>
                  <div><span>Pets</span><strong>{booking.petCount}</strong></div>
                  <div><span>Total</span><strong>{formatInrPaise(booking.pricing.totalPaise)}</strong></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="detail-muted">No upcoming arrivals are currently scheduled.</p>
          )}
        </CardBody>
      </Card>
    </>
  );
}
