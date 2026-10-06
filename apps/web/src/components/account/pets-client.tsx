'use client';

import {
  createPetSchema,
  updatePetSchema,
} from '@purrfect/contracts';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/auth-provider';
import type { PetProfile } from '../../lib/catalogue-types';
import { ApiError } from '../../lib/api-types';
import { humanizeStatus, zodFieldErrors } from '../../lib/workspace-utils';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import {
  FieldFrame,
  SelectInput,
  TextArea,
  TextInput,
} from '../ui/form-field';
import { PageHeader } from '../ui/page-header';
import { StatusBadge } from '../ui/status-badge';

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; pet: PetProfile };

export function PetsClient() {
  const { request } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ items: PetProfile[] }>('/pets');
      setPets(data.items);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not load your pets.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setError(null);

    const form = new FormData(event.currentTarget);
    const raw = {
      name: form.get('name'),
      species: form.get('species'),
      breed: form.get('breed'),
      size: form.get('size'),
      weightKg: String(form.get('weightKg') ?? '').trim() || undefined,
      birthDate: String(form.get('birthDate') ?? '').trim() || undefined,
      vaccinated: form.get('vaccinated') === 'on',
      specialNeeds: String(form.get('specialNeeds') ?? '').trim() || undefined,
    };

    const parsed = mode.kind === 'edit'
      ? updatePetSchema.safeParse(raw)
      : createPetSchema.safeParse(raw);

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error.issues));
      return;
    }

    const parsedData = parsed.data as {
      name?: string;
      species?: string;
      breed?: string;
      size?: string;
      weightKg?: number | null;
      birthDate?: Date | null;
      vaccinated?: boolean;
      specialNeeds?: string | null;
    };

    const payload = {
      ...parsedData,
      ...(parsedData.birthDate === undefined
        ? {}
        : { birthDate: parsedData.birthDate === null ? null : parsedData.birthDate.toISOString().slice(0, 10) }),
    };

    setBusy(true);
    try {
      if (mode.kind === 'edit') {
        await request('/pets/' + mode.pet.id, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await request('/pets', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setMode({ kind: 'closed' });
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not save this pet profile.');
    } finally {
      setBusy(false);
    }
  }

  async function archive(pet: PetProfile) {
    if (!window.confirm('Archive ' + pet.name + '? Historical bookings will keep their pet snapshot.')) return;

    setBusy(true);
    setError(null);
    try {
      await request('/pets/' + pet.id, { method: 'DELETE' });
      if (mode.kind === 'edit' && mode.pet.id === pet.id) {
        setMode({ kind: 'closed' });
      }
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not archive this pet.');
    } finally {
      setBusy(false);
    }
  }

  const editing = mode.kind === 'edit' ? mode.pet : null;

  return (
    <>
      <PageHeader
        eyebrow="My pets"
        title="Profiles the booking engine can actually use."
        description="Keep breed, size and vaccination details current so policy checks use the right information."
        actions={
          <Button onClick={() => setMode({ kind: 'create' })}>
            <Plus size={17} aria-hidden="true" /> Add pet
          </Button>
        }
      />

      {error ? <Alert tone="danger" title="Something needs attention">{error}</Alert> : null}

      {mode.kind !== 'closed' ? (
        <Card className="workspace-form-card">
          <CardBody>
            <form className="workspace-form" onSubmit={submit} noValidate>
              <div className="workspace-form-heading">
                <div>
                  <p className="section-eyebrow">{editing ? 'Edit pet' : 'New pet'}</p>
                  <h2>{editing ? editing.name : 'Add a pet profile'}</h2>
                </div>
                <Button variant="ghost" onClick={() => setMode({ kind: 'closed' })}>
                  Close
                </Button>
              </div>

              <div className="workspace-form-grid">
                <FieldFrame label="Name" error={errors.name} required>
                  <TextInput defaultValue={editing?.name} name="name" required />
                </FieldFrame>
                <FieldFrame label="Species" error={errors.species} required>
                  <SelectInput defaultValue={editing?.species ?? 'DOG'} name="species">
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                    <option value="OTHER">Other</option>
                  </SelectInput>
                </FieldFrame>
                <FieldFrame label="Breed" error={errors.breed} required>
                  <TextInput defaultValue={editing?.breed} name="breed" required />
                </FieldFrame>
                <FieldFrame label="Size" error={errors.size} required>
                  <SelectInput defaultValue={editing?.size ?? 'MEDIUM'} name="size">
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                    <option value="EXTRA_LARGE">Extra large</option>
                  </SelectInput>
                </FieldFrame>
                <FieldFrame label="Weight (kg)" error={errors.weightKg}>
                  <TextInput
                    defaultValue={editing?.weightKg ?? ''}
                    min="0.1"
                    name="weightKg"
                    step="0.1"
                    type="number"
                  />
                </FieldFrame>
                <FieldFrame label="Birth date" error={errors.birthDate}>
                  <TextInput
                    defaultValue={editing?.birthDate ?? ''}
                    name="birthDate"
                    type="date"
                  />
                </FieldFrame>
              </div>

              <label className="workspace-checkbox">
                <input
                  defaultChecked={editing?.vaccinated ?? false}
                  name="vaccinated"
                  type="checkbox"
                />
                <span>Vaccinations are current</span>
              </label>

              <FieldFrame label="Special needs" error={errors.specialNeeds}>
                <TextArea
                  defaultValue={editing?.specialNeeds ?? ''}
                  name="specialNeeds"
                  placeholder="Medication, mobility, food, handling or other travel notes."
                />
              </FieldFrame>

              <div className="workspace-form-actions">
                <Button variant="ghost" onClick={() => setMode({ kind: 'closed' })}>
                  Cancel
                </Button>
                <Button disabled={busy} type="submit">
                  {busy ? 'Saving…' : editing ? 'Save changes' : 'Add pet'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {loading ? (
        <div className="workspace-card-grid">
          <div className="skeleton workspace-tile-skeleton" />
          <div className="skeleton workspace-tile-skeleton" />
        </div>
      ) : pets.length === 0 ? (
        <EmptyState
          title="No active pet profiles"
          description="Add the pet travelling with you. Booking compatibility is checked against these saved details."
          action={<Button onClick={() => setMode({ kind: 'create' })}>Add your first pet</Button>}
        />
      ) : (
        <div className="workspace-card-grid">
          {pets.map((pet) => (
            <Card key={pet.id}>
              <CardBody className="pet-profile-card">
                <div className="workspace-row-heading">
                  <div>
                    <span className="pet-profile-emoji" aria-hidden="true">
                      {pet.species === 'DOG' ? '🐶' : pet.species === 'CAT' ? '🐱' : '🐾'}
                    </span>
                    <h2>{pet.name}</h2>
                    <p>{pet.breed} · {humanizeStatus(pet.size)}</p>
                  </div>
                  <StatusBadge tone={pet.vaccinated ? 'success' : 'warning'}>
                    {pet.vaccinated ? 'Vaccinated' : 'Vaccination not marked'}
                  </StatusBadge>
                </div>

                <dl className="pet-profile-facts">
                  <div><dt>Species</dt><dd>{humanizeStatus(pet.species)}</dd></div>
                  <div><dt>Weight</dt><dd>{pet.weightKg ? String(pet.weightKg) + ' kg' : 'Not set'}</dd></div>
                  <div><dt>Birth date</dt><dd>{pet.birthDate ?? 'Not set'}</dd></div>
                </dl>

                {pet.specialNeeds ? <p className="pet-needs">{pet.specialNeeds}</p> : null}

                <div className="workspace-inline-actions">
                  <Button size="sm" variant="outline" onClick={() => setMode({ kind: 'edit', pet })}>
                    <Pencil size={15} aria-hidden="true" /> Edit
                  </Button>
                  <Button disabled={busy} size="sm" variant="ghost" onClick={() => archive(pet)}>
                    <Trash2 size={15} aria-hidden="true" /> Archive
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
