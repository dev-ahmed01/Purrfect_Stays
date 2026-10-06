'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import type { PropertySummary } from '../lib/catalogue-types';
import { ApiError } from '../lib/api-types';
import { Button } from './ui/button';

export function SaveStayButton({
  propertyId,
  returnTo,
}: {
  propertyId: string;
  returnTo: string;
}) {
  const { status, user, request } = useAuth();
  const [saved, setSaved] = useState(false);
  const [known, setKnown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'USER') {
      setSaved(false);
      setKnown(true);
      return;
    }

    let cancelled = false;
    setKnown(false);

    void request<{ items: Array<{ property: PropertySummary }> }>('/favourites')
      .then((data) => {
        if (!cancelled) {
          setSaved(data.items.some((item) => item.property.id === propertyId));
          setKnown(true);
        }
      })
      .catch(() => {
        if (!cancelled) setKnown(true);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId, request, status, user?.id, user?.role]);

  if (status === 'anonymous' || !user) {
    return (
      <Link
        className="button button-outline button-sm"
        href={'/login?returnTo=' + encodeURIComponent(returnTo)}
      >
        <Heart size={15} aria-hidden="true" /> Save stay
      </Link>
    );
  }

  if (user.role !== 'USER') return null;

  async function toggle() {
    setBusy(true);
    setLabel(null);

    try {
      if (saved) {
        await request('/favourites/' + propertyId, { method: 'DELETE' });
        setSaved(false);
        setLabel('Removed');
      } else {
        await request('/favourites/' + propertyId, { method: 'POST' });
        setSaved(true);
        setLabel('Saved');
      }
    } catch (error) {
      setLabel(error instanceof ApiError ? error.message : 'Could not update saved stay.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="save-stay-control">
      <Button
        disabled={busy || !known}
        size="sm"
        variant={saved ? 'primary' : 'outline'}
        onClick={toggle}
      >
        <Heart size={15} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        {busy ? 'Updating…' : saved ? 'Saved' : 'Save stay'}
      </Button>
      {label && label !== 'Saved' && label !== 'Removed' ? <span>{label}</span> : null}
    </div>
  );
}
