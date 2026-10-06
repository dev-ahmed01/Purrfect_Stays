'use client';

import { CalendarDays, Heart, PawPrint, Star } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PaginationMeta, PetProfile } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { Card, CardBody } from '../ui/card';
import { Alert } from '../ui/alert';
import { PageHeader } from '../ui/page-header';

type Overview = {
  bookingTotal: number;
  upcomingConfirmed: number;
  completed: number;
  pets: PetProfile[];
  favourites: Array<unknown>;
  reviewTotal: number;
  publishedReviews: number;
};

export function AccountOverviewClient() {
  const { user, request } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [bookings, confirmed, completed, pets, favourites, reviews, publishedReviews] = await Promise.all([
        request<{ meta: PaginationMeta }>('/bookings?page=1&pageSize=1'),
        request<{ meta: PaginationMeta }>('/bookings?status=CONFIRMED&page=1&pageSize=1'),
        request<{ meta: PaginationMeta }>('/bookings?status=COMPLETED&page=1&pageSize=1'),
        request<{ items: PetProfile[] }>('/pets'),
        request<{ items: Array<unknown> }>('/favourites'),
        request<{ meta: PaginationMeta }>('/reviews?page=1&pageSize=1'),
        request<{ meta: PaginationMeta }>('/reviews?status=PUBLISHED&page=1&pageSize=1'),
      ]);

      setData({
        bookingTotal: bookings.meta.totalItems,
        upcomingConfirmed: confirmed.meta.totalItems,
        completed: completed.meta.totalItems,
        pets: pets.items,
        favourites: favourites.items,
        reviewTotal: reviews.meta.totalItems,
        publishedReviews: publishedReviews.meta.totalItems,
      });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load your account overview.');
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="My Purrfect"
        title={user ? 'Welcome back, ' + user.fullName.split(' ')[0] + '.' : 'Your travel workspace.'}
        description="Trips, pet profiles, saved stays and completed-stay reviews share one account."
        actions={<Link className="button button-primary" href="/stays">Find a stay</Link>}
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      <div className="summary-grid">
        <Link href="/account/trips">
          <Card><CardBody className="summary-card"><CalendarDays /><span>Upcoming trips</span><strong>{data ? data.upcomingConfirmed : '—'}</strong></CardBody></Card>
        </Link>
        <Link href="/account/pets">
          <Card><CardBody className="summary-card"><PawPrint /><span>Active pets</span><strong>{data ? data.pets.length : '—'}</strong></CardBody></Card>
        </Link>
        <Link href="/account/favourites">
          <Card><CardBody className="summary-card"><Heart /><span>Saved stays</span><strong>{data ? data.favourites.length : '—'}</strong></CardBody></Card>
        </Link>
      </div>

      <div className="workspace-two-column">
        <Card>
          <CardBody className="workspace-overview-card">
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Travel</span>
                <h2>Stay history</h2>
              </div>
              <CalendarDays size={20} aria-hidden="true" />
            </div>
            <div className="overview-metrics">
              <div><strong>{data ? data.completed : '—'}</strong><span>Completed</span></div>
              <div><strong>{data ? data.bookingTotal : '—'}</strong><span>Total reservations</span></div>
            </div>
            <Link className="button button-outline button-sm" href="/account/trips">Open trips</Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="workspace-overview-card">
            <div className="workspace-row-heading">
              <div>
                <span className="workspace-kicker">Trust</span>
                <h2>Your reviews</h2>
              </div>
              <Star size={20} aria-hidden="true" />
            </div>
            <div className="overview-metrics">
              <div><strong>{data ? data.reviewTotal : '—'}</strong><span>Written</span></div>
              <div><strong>{data ? data.publishedReviews : '—'}</strong><span>Published</span></div>
            </div>
            <Link className="button button-outline button-sm" href="/account/reviews">Manage reviews</Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
