'use client';

import { HeartOff } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PropertySummary } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { toPropertyCardData } from '../../lib/property-view';
import { PropertyCard } from '../property-card';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';
import { PageHeader } from '../ui/page-header';

type FavouriteItem = {
  createdAt: string;
  property: PropertySummary;
};

export function FavouritesClient() {
  const { request } = useAuth();
  const [items, setItems] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ items: FavouriteItem[] }>('/favourites');
      setItems(data.items);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load your saved stays.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(propertyId: string) {
    setBusyId(propertyId);
    setError(null);
    try {
      await request('/favourites/' + propertyId, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.property.id !== propertyId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not remove this saved stay.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Saved stays"
        title="Shortlist the places worth coming back to."
        description="Only currently public, verified stays appear here."
        actions={<Link className="button button-primary" href="/stays">Explore more</Link>}
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {loading ? (
        <div className="workspace-card-grid">
          <div className="skeleton workspace-tile-skeleton" />
          <div className="skeleton workspace-tile-skeleton" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<HeartOff />}
          title="Nothing saved yet"
          description="Save a verified stay from its detail page and it will appear here."
          action={<Link className="button button-primary" href="/stays">Find stays</Link>}
        />
      ) : (
        <div className="saved-grid">
          {items.map((item) => (
            <div className="saved-property" key={item.property.id}>
              <PropertyCard property={toPropertyCardData(item.property)} />
              <Button
                disabled={busyId === item.property.id}
                fullWidth
                variant="ghost"
                onClick={() => remove(item.property.id)}
              >
                <HeartOff size={16} aria-hidden="true" />
                {busyId === item.property.id ? 'Removing…' : 'Remove from saved'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
