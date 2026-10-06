'use client';

import {
  adminListingActionSchema,
  adminListingDecisionSchema,
} from '@purrfect/contracts';
import { CheckCircle2, ShieldAlert, Undo2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { AdminListingDetail } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly, formatInrPaise } from '../../lib/format';
import { humanizeStatus, statusTone } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody, CardHeader } from '../ui/card';
import { FieldFrame, TextArea } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';

export function AdminListingDetailClient({ propertyId }: { propertyId: string }) {
  const { request } = useAuth();
  const [property, setProperty] = useState<AdminListingDetail | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProperty(await request<AdminListingDetail>('/admin/listings/' + propertyId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load this listing.');
    }
  }, [propertyId, request]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(decision: 'APPROVE' | 'REJECT') {
    const parsed = adminListingDecisionSchema.safeParse({ decision, note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Add an admin note.');
      return;
    }

    await mutate('/admin/listings/' + propertyId + '/decision', parsed.data);
  }

  async function action(actionName: 'suspend' | 'restore') {
    const parsed = adminListingActionSchema.safeParse({ note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Add an admin note.');
      return;
    }

    await mutate('/admin/listings/' + propertyId + '/' + actionName, parsed.data);
  }

  async function mutate(path: string, payload: unknown) {
    setBusy(true);
    setError(null);
    try {
      const updated = await request<AdminListingDetail>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setProperty(updated);
      setNote('');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not apply that listing action.');
    } finally {
      setBusy(false);
    }
  }

  if (!property) {
    return error
      ? <Alert tone="danger" title="Listing unavailable">{error}</Alert>
      : <div className="skeleton workspace-editor-skeleton" />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Listing review"
        title={property.name}
        description={property.city + ', ' + property.state + ' · Partner: ' + property.partner.fullName}
        actions={
          <div className="workspace-header-actions">
            <StatusBadge tone={statusTone(property.status)}>{humanizeStatus(property.status)}</StatusBadge>
            <StatusBadge tone={statusTone(property.verificationStatus)}>{humanizeStatus(property.verificationStatus)}</StatusBadge>
          </div>
        }
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      <div className="workspace-two-column">
        <Card>
          <CardHeader title="Partner" description="The account responsible for this listing." />
          <CardBody className="admin-partner-card">
            <strong>{property.partner.fullName}</strong>
            <span>{property.partner.email}</span>
            {property.partner.phone ? <span>{property.partner.phone}</span> : null}
            {property.partner.city ? <span>{property.partner.city}</span> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Public positioning" />
          <CardBody className="admin-partner-card">
            <strong>{humanizeStatus(property.type)}</strong>
            <span>{property.shortDescription}</span>
            <span>Starting price: {formatInrPaise(property.startingPrice.amountPaise)}</span>
            <span>Average rating: {property.averageRating.toFixed(1)} ({property.reviewCount} ratings)</span>
          </CardBody>
        </Card>
      </div>

      <Card className="workspace-section-card">
        <CardHeader title="Listing content" description="This is the submitted operational snapshot, not a client-side reconstruction." />
        <CardBody>
          <div className="admin-listing-content">
            <div><span>Address</span><strong>{property.addressLine1}, {property.city}, {property.state}, {property.country}</strong></div>
            <div><span>Description</span><p>{property.description}</p></div>
          </div>
        </CardBody>
      </Card>

      <Card className="workspace-section-card">
        <CardHeader title="Submitted media" description="Review the partner-provided HTTPS image references and alt text." />
        <CardBody>
          {property.images.length > 0 ? (
            <div className="admin-media-list">
              {property.images.map((image) => (
                <a href={image.url} key={image.id} rel="noreferrer" target="_blank">
                  <span>Image {image.sortOrder + 1}</span>
                  <strong>{image.altText}</strong>
                  <small>{image.url}</small>
                </a>
              ))}
            </div>
          ) : <p className="detail-muted">No submitted images.</p>}
        </CardBody>
      </Card>

      <div className="workspace-two-column">
        <Card>
          <CardHeader title="Pet policy" />
          <CardBody>
            {property.petPolicy ? (
              <dl className="policy-admin-list">
                <div><dt>Maximum pets</dt><dd>{property.petPolicy.maxPets}</dd></div>
                <div><dt>Pet fee</dt><dd>{formatInrPaise(property.petPolicy.petFeePaise)} · {humanizeStatus(property.petPolicy.petFeeMode)}</dd></div>
                <div><dt>Allowed sizes</dt><dd>{property.petPolicy.allowedSizes.map(humanizeStatus).join(', ')}</dd></div>
                <div><dt>Vaccination</dt><dd>{property.petPolicy.requiresVaccination ? 'Required' : 'Not required'}</dd></div>
                <div><dt>Restricted breeds</dt><dd>{property.petPolicy.restrictedBreedKeys.join(', ') || 'None listed'}</dd></div>
              </dl>
            ) : <p className="detail-muted">No pet policy is attached.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Claimed amenities" />
          <CardBody className="admin-amenity-list">
            {property.amenities.map((item) => (
              <div key={item.amenity.id}>
                <strong>{item.amenity.name}</strong>
                <StatusBadge tone={item.verifiedAt ? 'success' : 'warning'}>
                  {item.verifiedAt ? 'Verified' : 'Unverified claim'}
                </StatusBadge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="workspace-section-card">
        <CardHeader title="Rooms & capacity" />
        <CardBody>
          <div className="workspace-table">
            {property.roomTypes.map((room) => (
              <div className="workspace-table-row" key={room.id}>
                <div><strong>{room.name}</strong><span>{room.active ? 'Active' : 'Inactive'}</span></div>
                <div><span>Guests</span><strong>{room.capacity}</strong></div>
                <div><span>Default units</span><strong>{room.totalUnits}</strong></div>
                <div><span>Nightly</span><strong>{formatInrPaise(room.nightlyRatePaise)}</strong></div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="workspace-section-card">
        <CardHeader title="Admin action" description="Every decision is recorded in listing and verification history." />
        <CardBody className="workspace-form">
          <FieldFrame label="Decision note" required>
            <TextArea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record the reason/evidence for this decision." />
          </FieldFrame>

          <div className="workspace-inline-actions">
            {property.status === 'PENDING_REVIEW' ? (
              <>
                <Button disabled={busy} onClick={() => decide('APPROVE')}>
                  <CheckCircle2 size={16} aria-hidden="true" /> Approve & publish
                </Button>
                <Button disabled={busy} variant="danger" onClick={() => decide('REJECT')}>
                  <XCircle size={16} aria-hidden="true" /> Reject to draft
                </Button>
              </>
            ) : null}

            {property.status === 'PUBLISHED' ? (
              <Button disabled={busy} variant="danger" onClick={() => action('suspend')}>
                <ShieldAlert size={16} aria-hidden="true" /> Suspend listing
              </Button>
            ) : null}

            {property.status === 'SUSPENDED' ? (
              <Button disabled={busy} onClick={() => action('restore')}>
                <Undo2 size={16} aria-hidden="true" /> Restore listing
              </Button>
            ) : null}

            {property.status === 'PUBLISHED' ? (
              <Link className="button button-outline button-sm" href={'/stays/' + property.slug}>View public page</Link>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <div className="workspace-two-column">
        <Card>
          <CardHeader title="Lifecycle history" />
          <CardBody className="history-list">
            {property.statusEvents.map((event) => (
              <div key={event.id}>
                <StatusBadge tone={statusTone(event.toStatus)}>{humanizeStatus(event.toStatus)}</StatusBadge>
                <strong>{event.fromStatus ? humanizeStatus(event.fromStatus) + ' → ' : ''}{humanizeStatus(event.toStatus)}</strong>
                <span>{formatDateOnly(event.createdAt)} · {event.actor?.fullName ?? 'System'}</span>
                {event.reason ? <p>{event.reason}</p> : null}
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Verification history" />
          <CardBody className="history-list">
            {property.verifications.map((verification) => (
              <div key={verification.id}>
                <StatusBadge tone={statusTone(verification.status)}>{humanizeStatus(verification.status)}</StatusBadge>
                <strong>{verification.actor?.fullName ?? 'System'}</strong>
                <span>{formatDateOnly(verification.createdAt)}</span>
                {verification.notes ? <p>{verification.notes}</p> : null}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
