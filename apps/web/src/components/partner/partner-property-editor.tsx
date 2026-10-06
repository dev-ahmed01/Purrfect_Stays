'use client';

import {
  createRoomTypeSchema,
  replacePropertyAmenitiesSchema,
  replacePropertyImagesSchema,
  updateInventoryCalendarSchema,
  updatePartnerPropertySchema,
  updateRoomTypeSchema,
  upsertPetPolicySchema,
} from '@purrfect/contracts';
import { CheckCircle2, CircleAlert, Plus, Send, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type {
  InventoryRow,
  ListingReadiness,
  PartnerAmenity,
  PartnerPropertyDetail,
} from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { formatDateOnly, formatInrPaise } from '../../lib/format';
import { humanizeStatus, statusTone, zodFieldErrors } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody, CardHeader } from '../ui/card';
import {
  FieldFrame,
  SelectInput,
  TextArea,
  TextInput,
} from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';

type Tab = 'listing' | 'policy' | 'media' | 'rooms' | 'inventory' | 'history';

export function PartnerPropertyEditor({ propertyId }: { propertyId: string }) {
  const { request } = useAuth();
  const [property, setProperty] = useState<PartnerPropertyDetail | null>(null);
  const [amenities, setAmenities] = useState<PartnerAmenity[]>([]);
  const [readiness, setReadiness] = useState<ListingReadiness | null>(null);
  const [tab, setTab] = useState<Tab>('listing');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [inventoryRoomId, setInventoryRoomId] = useState('');
  const [inventoryFrom, setInventoryFrom] = useState('');
  const [inventoryTo, setInventoryTo] = useState('');
  const [inventory, setInventory] = useState<InventoryRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [propertyData, amenityData, readinessData] = await Promise.all([
        request<PartnerPropertyDetail>('/partner/properties/' + propertyId),
        request<{ items: PartnerAmenity[] }>('/partner/amenities'),
        request<ListingReadiness>('/partner/properties/' + propertyId + '/readiness'),
      ]);
      setProperty(propertyData);
      setAmenities(amenityData.items);
      setReadiness(readinessData);
      setInventoryRoomId((current) => current || propertyData.roomTypes[0]?.id || '');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load this property.');
    } finally {
      setLoading(false);
    }
  }, [propertyId, request]);

  useEffect(() => {
    void load();
  }, [load]);

  const draftEditable = property?.status === 'DRAFT';
  const roomDefinitionEditable = property?.status !== 'PENDING_REVIEW';

  const selectedAmenitySlugs = useMemo(
    () => new Set(property?.amenities.map((item) => item.amenity.slug) ?? []),
    [property],
  );

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
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
      latitude: String(form.get('latitude') ?? '').trim() || null,
      longitude: String(form.get('longitude') ?? '').trim() || null,
    };

    const parsed = updatePartnerPropertySchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error.issues));
      return;
    }

    await mutate('/partner/properties/' + property.id, 'PATCH', parsed.data);
  }

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
    setErrors({});
    setError(null);
    const form = new FormData(event.currentTarget);

    const allowedSizes = ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'].filter(
      (size) => form.get('size_' + size) === 'on',
    );
    const allowedBreedKeys = String(form.get('allowedBreedKeys') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const restrictedBreedKeys = String(form.get('restrictedBreedKeys') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const parsed = upsertPetPolicySchema.safeParse({
      maxPets: form.get('maxPets'),
      petFeePaise: Math.round(Number(form.get('petFeeRupees') || 0) * 100),
      petFeeMode: form.get('petFeeMode'),
      allowsDogs: form.get('allowsDogs') === 'on',
      allowsCats: form.get('allowsCats') === 'on',
      allowsOther: form.get('allowsOther') === 'on',
      allowedSizes,
      allowedBreedKeys,
      restrictedBreedKeys,
      requiresVaccination: form.get('requiresVaccination') === 'on',
      notes: String(form.get('notes') ?? '').trim() || null,
    });

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error.issues));
      return;
    }

    await mutate('/partner/properties/' + property.id + '/pet-policy', 'PUT', parsed.data);
  }

  async function saveImages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    const urls = String(form.get('imageUrls') ?? '').split('\n').map((value) => value.trim()).filter(Boolean);
    const alts = String(form.get('imageAlts') ?? '').split('\n').map((value) => value.trim());

    const parsed = replacePropertyImagesSchema.safeParse({
      images: urls.map((url, index) => ({
        url,
        altText: alts[index] || property.name + ' image ' + String(index + 1),
      })),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the image list.');
      return;
    }

    await mutate('/partner/properties/' + property.id + '/images', 'PUT', parsed.data);
  }

  async function saveAmenities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
    const form = new FormData(event.currentTarget);
    const amenitySlugs = amenities
      .map((amenity) => amenity.slug)
      .filter((slug) => form.get('amenity_' + slug) === 'on');

    const parsed = replacePropertyAmenitiesSchema.safeParse({ amenitySlugs });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the amenity selections.');
      return;
    }

    await mutate('/partner/properties/' + property.id + '/amenities', 'PUT', parsed.data);
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = createRoomTypeSchema.safeParse({
      name: form.get('name'),
      description: String(form.get('description') ?? '').trim() || null,
      capacity: form.get('capacity'),
      totalUnits: form.get('totalUnits'),
      nightlyRatePaise: Math.round(Number(form.get('nightlyRateRupees') || 0) * 100),
      serviceFeePaise: Math.round(Number(form.get('serviceFeeRupees') || 0) * 100),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the room fields.');
      return;
    }

    await mutate('/partner/properties/' + property.id + '/room-types', 'POST', parsed.data);
    formElement.reset();
  }

  async function updateRoom(roomId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = updateRoomTypeSchema.safeParse({
      name: form.get('name'),
      description: String(form.get('description') ?? '').trim() || null,
      capacity: form.get('capacity'),
      totalUnits: form.get('totalUnits'),
      nightlyRatePaise: Math.round(Number(form.get('nightlyRateRupees') || 0) * 100),
      serviceFeePaise: Math.round(Number(form.get('serviceFeeRupees') || 0) * 100),
      active: form.get('active') === 'on',
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the room fields.');
      return;
    }

    await mutate('/partner/room-types/' + roomId, 'PATCH', parsed.data);
  }

  async function loadInventory() {
    if (!inventoryRoomId || !inventoryFrom || !inventoryTo) {
      setError('Choose a room type and calendar range.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = await request<{ items: InventoryRow[] }>(
        '/partner/room-types/' + inventoryRoomId + '/inventory?from=' + encodeURIComponent(inventoryFrom) + '&to=' + encodeURIComponent(inventoryTo),
      );
      setInventory(data.items);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load inventory.');
    } finally {
      setBusy(false);
    }
  }

  async function setInventoryDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inventoryRoomId) return;
    const form = new FormData(event.currentTarget);
    const date = String(form.get('date') ?? '');
    const parsed = updateInventoryCalendarSchema.safeParse({
      updates: [{
        date,
        totalUnits: form.get('totalUnits'),
        nightlyRatePaise: String(form.get('nightlyRateRupees') ?? '').trim()
          ? Math.round(Number(form.get('nightlyRateRupees')) * 100)
          : null,
        closed: form.get('closed') === 'on',
      }],
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the inventory fields.');
      return;
    }

    const payload = {
      updates: parsed.data.updates.map((row) => ({
        ...row,
        date: row.date.toISOString().slice(0, 10),
      })),
    };

    setBusy(true);
    setError(null);
    try {
      await request('/partner/room-types/' + inventoryRoomId + '/inventory', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (inventoryFrom && inventoryTo) await loadInventory();
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not update inventory.');
    } finally {
      setBusy(false);
    }
  }

  async function submitForReview() {
    if (!property) return;
    await mutate('/partner/properties/' + property.id + '/submit', 'POST');
  }

  async function withdraw() {
    if (!property) return;
    if (!window.confirm('Withdraw this listing to DRAFT? It will leave the public catalogue until it is reviewed again.')) return;
    await mutate('/partner/properties/' + property.id + '/withdraw', 'POST');
  }

  async function deleteDraft() {
    if (!property) return;
    if (!window.confirm('Delete this draft property? Properties with booking history cannot be deleted.')) return;
    setBusy(true);
    try {
      await request('/partner/properties/' + property.id, { method: 'DELETE' });
      window.location.href = '/partner/properties';
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not delete this property.');
      setBusy(false);
    }
  }

  async function mutate(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      await request(path, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not save that change.');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !property) {
    return <div className="skeleton workspace-editor-skeleton" />;
  }

  if (!property) {
    return <Alert tone="danger" title="Property unavailable">{error ?? 'This property could not be loaded.'}</Alert>;
  }

  const policy = property.petPolicy;

  return (
    <>
      <PageHeader
        eyebrow="Property operations"
        title={property.name}
        description={property.city + ', ' + property.state + ' · ' + humanizeStatus(property.type)}
        actions={
          <div className="workspace-header-actions">
            <StatusBadge tone={statusTone(property.status)}>{humanizeStatus(property.status)}</StatusBadge>
            <StatusBadge tone={statusTone(property.verificationStatus)}>{humanizeStatus(property.verificationStatus)}</StatusBadge>
            {property.status === 'PUBLISHED' ? (
              <Link className="button button-outline button-sm" href={'/stays/' + property.slug}>Public page</Link>
            ) : null}
          </div>
        }
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      <Card className="readiness-card">
        <CardBody>
          <div className="workspace-row-heading">
            <div>
              <span className="workspace-kicker">Publication readiness</span>
              <h2>{readiness?.ready ? 'Ready for review' : 'Listing setup still needs work'}</h2>
            </div>
            {readiness?.ready ? <CheckCircle2 className="ready-icon" /> : <CircleAlert className="warning-icon" />}
          </div>
          <div className="readiness-checks">
            <span>Pet policy: {readiness?.checks.petPolicy ? 'ready' : 'missing'}</span>
            <span>Images: {readiness?.checks.images ?? 0}</span>
            <span>Active room types: {readiness?.checks.activeRoomTypes ?? 0}</span>
            <span>Future inventory rows: {readiness?.checks.futureInventoryRows ?? 0}</span>
          </div>
          <div className="workspace-inline-actions">
            {property.status === 'DRAFT' ? (
              <Button disabled={busy || !readiness?.ready} onClick={submitForReview}>
                <Send size={15} aria-hidden="true" /> Submit for review
              </Button>
            ) : null}
            {property.status === 'PUBLISHED' || property.status === 'PENDING_REVIEW' ? (
              <Button disabled={busy} variant="outline" onClick={withdraw}>
                <Undo2 size={15} aria-hidden="true" /> Withdraw to draft
              </Button>
            ) : null}
            {property.status === 'DRAFT' ? (
              <Button disabled={busy} variant="ghost" onClick={deleteDraft}>Delete draft</Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <div className="workspace-tabs" role="tablist" aria-label="Property management sections">
        {(['listing','policy','media','rooms','inventory','history'] as Tab[]).map((item) => (
          <button
            className={tab === item ? 'workspace-tab workspace-tab-active' : 'workspace-tab'}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {humanizeStatus(item)}
          </button>
        ))}
      </div>

      {tab === 'listing' ? (
        <Card>
          <CardHeader
            title="Listing details"
            description={draftEditable ? 'Editable while this listing is a draft.' : 'Withdraw to DRAFT before changing verified listing claims.'}
          />
          <CardBody>
            <form className="workspace-form" onSubmit={saveListing}>
              <div className="workspace-form-grid">
                <FieldFrame label="Name" error={errors.name}><TextInput disabled={!draftEditable} defaultValue={property.name} name="name" /></FieldFrame>
                <FieldFrame label="Type" error={errors.type}>
                  <SelectInput disabled={!draftEditable} defaultValue={property.type} name="type">
                    {['VILLA','HOMESTAY','RESORT','HOTEL','COTTAGE','APARTMENT'].map((value) => <option key={value} value={value}>{humanizeStatus(value)}</option>)}
                  </SelectInput>
                </FieldFrame>
              </div>
              <FieldFrame label="Short description" error={errors.shortDescription}><TextArea disabled={!draftEditable} defaultValue={property.shortDescription} name="shortDescription" /></FieldFrame>
              <FieldFrame label="Full description" error={errors.description}><TextArea disabled={!draftEditable} defaultValue={property.description} name="description" /></FieldFrame>
              <div className="workspace-form-grid">
                <FieldFrame label="Address line 1"><TextInput disabled={!draftEditable} defaultValue={property.addressLine1} name="addressLine1" /></FieldFrame>
                <FieldFrame label="Address line 2"><TextInput disabled={!draftEditable} defaultValue={property.addressLine2 ?? ''} name="addressLine2" /></FieldFrame>
                <FieldFrame label="Locality"><TextInput disabled={!draftEditable} defaultValue={property.locality ?? ''} name="locality" /></FieldFrame>
                <FieldFrame label="City"><TextInput disabled={!draftEditable} defaultValue={property.city} name="city" /></FieldFrame>
                <FieldFrame label="State"><TextInput disabled={!draftEditable} defaultValue={property.state} name="state" /></FieldFrame>
                <FieldFrame label="Postal code"><TextInput disabled={!draftEditable} defaultValue={property.postalCode ?? ''} name="postalCode" /></FieldFrame>
                <FieldFrame label="Country"><TextInput disabled={!draftEditable} defaultValue={property.country} name="country" /></FieldFrame>
                <FieldFrame label="Latitude"><TextInput disabled={!draftEditable} defaultValue={property.latitude ?? ''} name="latitude" type="number" step="any" /></FieldFrame>
                <FieldFrame label="Longitude"><TextInput disabled={!draftEditable} defaultValue={property.longitude ?? ''} name="longitude" type="number" step="any" /></FieldFrame>
              </div>
              {draftEditable ? <div className="workspace-form-actions"><Button disabled={busy} type="submit">Save listing details</Button></div> : null}
            </form>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'policy' ? (
        <Card>
          <CardHeader title="Pet policy" description="These rules are used by search and the booking compatibility engine." />
          <CardBody>
            <form className="workspace-form" onSubmit={savePolicy}>
              <div className="workspace-form-grid">
                <FieldFrame label="Maximum pets"><TextInput disabled={!draftEditable} defaultValue={policy?.maxPets ?? 1} min="1" max="10" name="maxPets" type="number" /></FieldFrame>
                <FieldFrame label="Pet fee (₹)"><TextInput disabled={!draftEditable} defaultValue={(policy?.petFeePaise ?? 0) / 100} min="0" name="petFeeRupees" type="number" /></FieldFrame>
                <FieldFrame label="Fee mode">
                  <SelectInput disabled={!draftEditable} defaultValue={policy?.petFeeMode ?? 'PER_STAY'} name="petFeeMode">
                    <option value="PER_STAY">Per pet / stay</option>
                    <option value="PER_NIGHT">Per pet / night</option>
                  </SelectInput>
                </FieldFrame>
              </div>

              <fieldset className="workspace-check-group">
                <legend>Allowed species</legend>
                <label><input disabled={!draftEditable} defaultChecked={policy?.allowsDogs ?? true} name="allowsDogs" type="checkbox" /> Dogs</label>
                <label><input disabled={!draftEditable} defaultChecked={policy?.allowsCats ?? false} name="allowsCats" type="checkbox" /> Cats</label>
                <label><input disabled={!draftEditable} defaultChecked={policy?.allowsOther ?? false} name="allowsOther" type="checkbox" /> Other pets</label>
              </fieldset>

              <fieldset className="workspace-check-group">
                <legend>Allowed sizes</legend>
                {['SMALL','MEDIUM','LARGE','EXTRA_LARGE'].map((size) => (
                  <label key={size}>
                    <input disabled={!draftEditable} defaultChecked={policy?.allowedSizes.includes(size) ?? size !== 'EXTRA_LARGE'} name={'size_' + size} type="checkbox" />
                    {humanizeStatus(size)}
                  </label>
                ))}
              </fieldset>

              <FieldFrame label="Allowed breeds" hint="Comma-separated. Leave empty to allow all non-restricted breeds.">
                <TextArea disabled={!draftEditable} defaultValue={policy?.allowedBreedKeys.join(', ') ?? ''} name="allowedBreedKeys" />
              </FieldFrame>
              <FieldFrame label="Restricted breeds" hint="Comma-separated normalized breed names.">
                <TextArea disabled={!draftEditable} defaultValue={policy?.restrictedBreedKeys.join(', ') ?? ''} name="restrictedBreedKeys" />
              </FieldFrame>
              <label className="workspace-checkbox">
                <input disabled={!draftEditable} defaultChecked={policy?.requiresVaccination ?? true} name="requiresVaccination" type="checkbox" />
                <span>Require current vaccination</span>
              </label>
              <FieldFrame label="Policy notes"><TextArea disabled={!draftEditable} defaultValue={policy?.notes ?? ''} name="notes" /></FieldFrame>
              {draftEditable ? <div className="workspace-form-actions"><Button disabled={busy} type="submit">Save pet policy</Button></div> : null}
            </form>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'media' ? (
        <div className="workspace-card-list">
          <Card>
            <CardHeader title="Images" description="One HTTPS URL per line. Alt text lines map by position." />
            <CardBody>
              <form className="workspace-form" onSubmit={saveImages}>
                <FieldFrame label="Image URLs">
                  <TextArea disabled={!draftEditable} defaultValue={property.images.map((image) => image.url).join('\n')} name="imageUrls" />
                </FieldFrame>
                <FieldFrame label="Alt text">
                  <TextArea disabled={!draftEditable} defaultValue={property.images.map((image) => image.altText).join('\n')} name="imageAlts" />
                </FieldFrame>
                {draftEditable ? <div className="workspace-form-actions"><Button disabled={busy} type="submit">Replace images</Button></div> : null}
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Amenity claims" description="Selected amenities remain unverified until platform approval." />
            <CardBody>
              <form className="workspace-form" onSubmit={saveAmenities}>
                <div className="amenity-admin-grid">
                  {amenities.map((amenity) => (
                    <label key={amenity.id}>
                      <input disabled={!draftEditable} defaultChecked={selectedAmenitySlugs.has(amenity.slug)} name={'amenity_' + amenity.slug} type="checkbox" />
                      <span><strong>{amenity.name}</strong><small>{amenity.category}</small></span>
                    </label>
                  ))}
                </div>
                {draftEditable ? <div className="workspace-form-actions"><Button disabled={busy} type="submit">Save amenity claims</Button></div> : null}
              </form>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === 'rooms' ? (
        <div className="workspace-card-list">
          <Card>
            <CardHeader title="Add room type" description={roomDefinitionEditable ? 'Room definitions can be changed outside PENDING_REVIEW.' : 'Room definitions are frozen during review.'} />
            <CardBody>
              <form className="workspace-form workspace-form-grid" onSubmit={createRoom}>
                <FieldFrame label="Name"><TextInput disabled={!roomDefinitionEditable} name="name" required /></FieldFrame>
                <FieldFrame label="Capacity"><TextInput disabled={!roomDefinitionEditable} min="1" name="capacity" type="number" required /></FieldFrame>
                <FieldFrame label="Default units"><TextInput disabled={!roomDefinitionEditable} min="1" name="totalUnits" type="number" required /></FieldFrame>
                <FieldFrame label="Nightly price (₹)"><TextInput disabled={!roomDefinitionEditable} min="0" name="nightlyRateRupees" type="number" required /></FieldFrame>
                <FieldFrame label="Service fee (₹)"><TextInput disabled={!roomDefinitionEditable} defaultValue="0" min="0" name="serviceFeeRupees" type="number" /></FieldFrame>
                <FieldFrame label="Description"><TextArea disabled={!roomDefinitionEditable} name="description" /></FieldFrame>
                {roomDefinitionEditable ? <div className="workspace-form-actions"><Button type="submit"><Plus size={15} /> Add room</Button></div> : null}
              </form>
            </CardBody>
          </Card>

          {property.roomTypes.map((room) => (
            <Card key={room.id}>
              <CardBody>
                <form className="workspace-form" onSubmit={(event) => updateRoom(room.id, event)}>
                  <div className="workspace-row-heading">
                    <div><span className="workspace-kicker">Room type</span><h2>{room.name}</h2></div>
                    <StatusBadge tone={room.active ? 'success' : 'neutral'}>{room.active ? 'Active' : 'Inactive'}</StatusBadge>
                  </div>
                  <div className="workspace-form-grid">
                    <FieldFrame label="Name"><TextInput disabled={!roomDefinitionEditable} defaultValue={room.name} name="name" /></FieldFrame>
                    <FieldFrame label="Capacity"><TextInput disabled={!roomDefinitionEditable} defaultValue={room.capacity} min="1" name="capacity" type="number" /></FieldFrame>
                    <FieldFrame label="Default units"><TextInput disabled={!roomDefinitionEditable} defaultValue={room.totalUnits} min="1" name="totalUnits" type="number" /></FieldFrame>
                    <FieldFrame label="Nightly price (₹)"><TextInput disabled={!roomDefinitionEditable} defaultValue={room.nightlyRatePaise / 100} min="0" name="nightlyRateRupees" type="number" /></FieldFrame>
                    <FieldFrame label="Service fee (₹)"><TextInput disabled={!roomDefinitionEditable} defaultValue={room.serviceFeePaise / 100} min="0" name="serviceFeeRupees" type="number" /></FieldFrame>
                  </div>
                  <FieldFrame label="Description"><TextArea disabled={!roomDefinitionEditable} defaultValue={room.description ?? ''} name="description" /></FieldFrame>
                  <label className="workspace-checkbox"><input disabled={!roomDefinitionEditable} defaultChecked={room.active} name="active" type="checkbox" /><span>Room type is active</span></label>
                  {roomDefinitionEditable ? <div className="workspace-form-actions"><Button disabled={busy} type="submit">Save room</Button></div> : null}
                </form>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === 'inventory' ? (
        <div className="workspace-card-list">
          <Card>
            <CardHeader title="Inventory calendar" description="Reserved units are read-only and cannot be reduced by partner input." />
            <CardBody className="workspace-form">
              <div className="workspace-form-grid">
                <FieldFrame label="Room type">
                  <SelectInput value={inventoryRoomId} onChange={(event) => setInventoryRoomId(event.target.value)}>
                    {property.roomTypes.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                  </SelectInput>
                </FieldFrame>
                <FieldFrame label="From"><TextInput type="date" value={inventoryFrom} onChange={(event) => setInventoryFrom(event.target.value)} /></FieldFrame>
                <FieldFrame label="To"><TextInput type="date" value={inventoryTo} onChange={(event) => setInventoryTo(event.target.value)} /></FieldFrame>
              </div>
              <Button variant="outline" onClick={loadInventory}>Load calendar</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Set one inventory date" description="Creates or updates a single calendar row atomically." />
            <CardBody>
              <form className="workspace-form" onSubmit={setInventoryDate}>
                <div className="workspace-form-grid">
                  <FieldFrame label="Date"><TextInput name="date" type="date" required /></FieldFrame>
                  <FieldFrame label="Total units"><TextInput min="1" name="totalUnits" type="number" required /></FieldFrame>
                  <FieldFrame label="Nightly override (₹)" hint="Leave empty to use the room default."><TextInput min="0" name="nightlyRateRupees" type="number" /></FieldFrame>
                </div>
                <label className="workspace-checkbox"><input name="closed" type="checkbox" /><span>Close this date to new bookings</span></label>
                <div className="workspace-form-actions"><Button disabled={busy} type="submit">Save inventory date</Button></div>
              </form>
            </CardBody>
          </Card>

          {inventory.length > 0 ? (
            <Card>
              <CardBody>
                <div className="inventory-table">
                  <div className="inventory-row inventory-head"><span>Date</span><span>Total</span><span>Reserved</span><span>Available</span><span>Rate</span><span>State</span></div>
                  {inventory.map((row) => (
                    <div className="inventory-row" key={row.id}>
                      <strong>{formatDateOnly(row.date)}</strong>
                      <span>{row.totalUnits}</span>
                      <span>{row.reservedUnits}</span>
                      <span>{row.availableUnits}</span>
                      <span>{row.nightlyRatePaise === null ? 'Default' : formatInrPaise(row.nightlyRatePaise)}</span>
                      <StatusBadge tone={row.closed ? 'danger' : 'success'}>{row.closed ? 'Closed' : 'Open'}</StatusBadge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="workspace-two-column">
          <Card>
            <CardHeader title="Listing lifecycle" />
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
      ) : null}
    </>
  );
}
