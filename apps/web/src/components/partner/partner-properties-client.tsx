'use client';

import { createPartnerPropertySchema } from '@purrfect/contracts';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PaginationMeta, PartnerPropertySummary } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatInrPaise } from '../../lib/format';
import { humanizeStatus, statusTone, zodFieldErrors } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { FieldFrame, SelectInput, TextArea, TextInput } from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';
import { WorkspacePagination } from '../ui/workspace-pagination';

export function PartnerPropertiesClient() {
  const { request } = useAuth();
  const [items, setItems] = useState<PartnerPropertySummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ items: PartnerPropertySummary[]; meta: PaginationMeta }>(
        '/partner/properties?page=' + String(page) + '&pageSize=12',
      );
      setItems(data.items);
      setMeta(data.meta);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load your properties.');
    } finally {
      setLoading(false);
    }
  }, [page, request]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setError(null);

    const form = new FormData(event.currentTarget);
    const raw = {
      name: form.get('name'),
      type: form.get('type'),
      shortDescription: form.get('shortDescription'),
      description: form.get('description'),
      addressLine1: form.get('addressLine1'),
      addressLine2: String(form.get('addressLine2') ?? '').trim() || null,
      locality: String(form.get('locality') ?? '').trim() || null,
      city: form.get('city'),
      state: form.get('state'),
      country: form.get('country'),
      postalCode: String(form.get('postalCode') ?? '').trim() || null,
    };

    const parsed = createPartnerPropertySchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error.issues));
      return;
    }

    setBusy(true);
    try {
      const property = await request<PartnerPropertySummary & { id: string }>('/partner/properties', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      window.location.href = '/partner/properties/' + property.id;
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not create this property.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Properties"
        title="Your listing portfolio."
        description={meta ? String(meta.totalItems) + ' propert' + (meta.totalItems === 1 ? 'y' : 'ies') + ' in this partner account.' : 'Draft, verify and operate your stays.'}
        actions={
          <Button onClick={() => setShowCreate((current) => !current)}>
            <Plus size={17} aria-hidden="true" /> New property
          </Button>
        }
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {showCreate ? (
        <Card className="workspace-form-card">
          <CardBody>
            <form className="workspace-form" onSubmit={create} noValidate>
              <div className="workspace-form-heading">
                <div>
                  <p className="section-eyebrow">New listing</p>
                  <h2>Create a draft property</h2>
                </div>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Close</Button>
              </div>

              <div className="workspace-form-grid">
                <FieldFrame label="Property name" error={errors.name} required>
                  <TextInput name="name" required />
                </FieldFrame>
                <FieldFrame label="Type" error={errors.type} required>
                  <SelectInput defaultValue="VILLA" name="type">
                    <option value="VILLA">Villa</option>
                    <option value="HOMESTAY">Homestay</option>
                    <option value="RESORT">Resort</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="COTTAGE">Cottage</option>
                    <option value="APARTMENT">Apartment</option>
                  </SelectInput>
                </FieldFrame>
              </div>

              <FieldFrame label="Short description" error={errors.shortDescription} required>
                <TextArea name="shortDescription" placeholder="A concise public summary." required />
              </FieldFrame>
              <FieldFrame label="Full description" error={errors.description} required>
                <TextArea name="description" placeholder="Describe the stay, setting and pet-friendly experience." required />
              </FieldFrame>

              <div className="workspace-form-grid">
                <FieldFrame label="Address line 1" error={errors.addressLine1} required>
                  <TextInput name="addressLine1" required />
                </FieldFrame>
                <FieldFrame label="Address line 2" error={errors.addressLine2}>
                  <TextInput name="addressLine2" />
                </FieldFrame>
                <FieldFrame label="Locality" error={errors.locality}>
                  <TextInput name="locality" />
                </FieldFrame>
                <FieldFrame label="City" error={errors.city} required>
                  <TextInput name="city" required />
                </FieldFrame>
                <FieldFrame label="State" error={errors.state} required>
                  <TextInput name="state" required />
                </FieldFrame>
                <FieldFrame label="Postal code" error={errors.postalCode}>
                  <TextInput name="postalCode" />
                </FieldFrame>
              </div>

              <FieldFrame label="Country" error={errors.country} required>
                <TextInput defaultValue="India" name="country" required />
              </FieldFrame>

              <div className="workspace-form-actions">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button disabled={busy} type="submit">{busy ? 'Creating…' : 'Create draft'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {loading ? (
        <div className="workspace-card-list"><div className="skeleton workspace-list-skeleton" /></div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Create a draft, add its pet policy, media, amenities, room inventory, then submit it for platform review."
          action={<Button onClick={() => setShowCreate(true)}>Create first property</Button>}
        />
      ) : (
        <div className="workspace-card-list">
          {items.map((property) => (
            <Card key={property.id}>
              <CardBody className="partner-property-row">
                <div className="workspace-row-heading">
                  <div>
                    <span className="workspace-kicker">{humanizeStatus(property.type)}</span>
                    <h2>{property.name}</h2>
                    <p>{property.city}, {property.state}</p>
                  </div>
                  <div className="workspace-status-stack">
                    <StatusBadge tone={statusTone(property.status)}>{humanizeStatus(property.status)}</StatusBadge>
                    <StatusBadge tone={statusTone(property.verificationStatus)}>{humanizeStatus(property.verificationStatus)}</StatusBadge>
                  </div>
                </div>

                <p className="partner-property-description">{property.shortDescription}</p>

                <div className="partner-property-facts">
                  <div><span>Starting price</span><strong>{formatInrPaise(property.startingPrice.amountPaise)}</strong></div>
                  <div><span>Rooms</span><strong>{property._count.roomTypes}</strong></div>
                  <div><span>Images</span><strong>{property._count.images}</strong></div>
                  <div><span>Bookings</span><strong>{property._count.bookings}</strong></div>
                </div>

                <div className="workspace-inline-actions">
                  <Link className="button button-primary button-sm" href={'/partner/properties/' + property.id}>
                    Manage property
                  </Link>
                  {property.status === 'PUBLISHED' ? (
                    <Link className="button button-outline button-sm" href={'/stays/' + property.slug}>
                      View public page
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
