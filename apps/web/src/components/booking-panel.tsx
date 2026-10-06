'use client';

import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  PawPrint,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import type {
  BookingCreateResult,
  BookingQuote,
  PetProfile,
  PropertyDetail,
} from '../lib/catalogue-types';
import { ApiError } from '../lib/api-types';
import { formatInrPaise } from '../lib/format';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { FieldFrame, SelectInput, TextInput } from './ui/form-field';
import { BookingCardShell } from './booking-card-shell';

type BookingPayload = {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  petIds: string[];
};

export function BookingPanel({
  property,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  minDate,
  returnTo,
}: {
  property: PropertyDetail;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  minDate: string;
  returnTo: string;
}) {
  const { status, user, request } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState(property.roomTypes[0]?.id ?? '');
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? '');
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? '');
  const [guests, setGuests] = useState(Number(initialGuests ?? '2') || 2);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [booking, setBooking] = useState<BookingCreateResult | null>(null);
  const [busy, setBusy] = useState<'quote' | 'book' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    setSelectedPetIds([]);
    setQuote(null);
    setBooking(null);
    idempotencyRef.current = null;

    if (status !== 'authenticated' || user?.role !== 'USER') {
      setPets([]);
      return;
    }

    let cancelled = false;
    setPetsLoading(true);

    void request<{ items: PetProfile[] }>('/pets')
      .then((response) => {
        if (!cancelled) setPets(response.items);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'We could not load your pet profiles.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPetsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [request, status, user?.id, user?.role]);

  const selectedRoom = useMemo(
    () => property.roomTypes.find((room) => room.id === roomTypeId) ?? null,
    [property.roomTypes, roomTypeId],
  );

  function invalidateReservationState() {
    setQuote(null);
    setBooking(null);
    setError(null);
    idempotencyRef.current = null;
  }

  function payload(): BookingPayload | null {
    if (!roomTypeId || !checkIn || !checkOut || selectedPetIds.length === 0) {
      return null;
    }

    return {
      roomTypeId,
      checkIn,
      checkOut,
      guests,
      petIds: [...selectedPetIds].sort(),
    };
  }

  async function requestQuote() {
    const current = payload();

    if (!current) {
      setError('Choose a room, travel dates and at least one pet before requesting a quote.');
      return;
    }

    setBusy('quote');
    setError(null);
    setBooking(null);

    try {
      const result = await request<BookingQuote>('/bookings/quote', {
        method: 'POST',
        body: JSON.stringify(current),
      });
      setQuote(result);
    } catch (requestError) {
      setQuote(null);
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'We could not calculate a quote for this stay.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function createBooking() {
    const current = payload();

    if (!current || !quote) {
      setError('Request a current quote before confirming this booking.');
      return;
    }

    const fingerprint = JSON.stringify(current);
    if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
      idempotencyRef.current = {
        fingerprint,
        key: `web-${crypto.randomUUID()}`,
      };
    }

    setBusy('book');
    setError(null);

    try {
      const result = await request<BookingCreateResult>('/bookings', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyRef.current.key,
        },
        body: JSON.stringify(current),
      });

      setBooking(result);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'We could not confirm the reservation. You can safely try again.',
      );
    } finally {
      setBusy(null);
    }
  }

  if (status === 'loading') {
    return (
      <BookingCardShell eyebrow="Book this stay">
        <div className="skeleton skeleton-line skeleton-line-wide" />
        <div className="skeleton skeleton-card booking-panel-skeleton" />
      </BookingCardShell>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <BookingCardShell
        eyebrow="Book this stay"
        price={
          <>
            {formatInrPaise(property.startingPrice.amountPaise)}
            <span> / night from</span>
          </>
        }
      >
        <p className="booking-card-copy">
          Sign in to select your saved pets, check policy compatibility and get an authoritative quote.
        </p>
        <Link
          className="button button-primary button-full"
          href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Sign in to book
        </Link>
      </BookingCardShell>
    );
  }

  if (user.role !== 'USER') {
    return (
      <BookingCardShell eyebrow="Pet-parent booking">
        <Alert tone="info" title="Use a pet-parent account to reserve">
          Partner and admin accounts cannot create customer reservations.
        </Alert>
      </BookingCardShell>
    );
  }

  if (booking) {
    return (
      <BookingCardShell eyebrow="Reservation confirmed">
        <div className="booking-confirmed">
          <CheckCircle2 size={34} aria-hidden="true" />
          <h2>You’re booked.</h2>
          <p>
            Reference <strong>{booking.booking.reference}</strong>
          </p>
          <p>
            {booking.booking.checkIn} → {booking.booking.checkOut}
          </p>
          <p className="detail-muted">
            {booking.idempotentReplay
              ? 'This confirmation was safely recovered from your original booking attempt.'
              : 'Your room inventory has been reserved.'}
          </p>
        </div>
      </BookingCardShell>
    );
  }

  return (
    <BookingCardShell
      eyebrow="Book this stay"
      price={
        quote ? (
          <>
            {formatInrPaise(quote.pricing.totalPaise)}
            <span> total</span>
          </>
        ) : (
          <>
            {formatInrPaise(property.startingPrice.amountPaise)}
            <span> / night from</span>
          </>
        )
      }
      footer={
        quote ? (
          <Button
            disabled={busy !== null}
            fullWidth
            onClick={createBooking}
            size="lg"
          >
            {busy === 'book' ? 'Confirming…' : 'Confirm reservation'}
          </Button>
        ) : null
      }
    >
      {error ? (
        <Alert tone="danger" title="We couldn’t continue">
          {error}
        </Alert>
      ) : null}

      <FieldFrame label="Room">
        <SelectInput
          onChange={(event) => {
            setRoomTypeId(event.target.value);
            invalidateReservationState();
          }}
          value={roomTypeId}
        >
          {property.roomTypes.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} · {formatInrPaise(room.nightlyRate.amountPaise)}
            </option>
          ))}
        </SelectInput>
      </FieldFrame>

      <div className="booking-field-grid">
        <FieldFrame label="Check-in">
          <TextInput
            min={minDate}
            onChange={(event) => {
              setCheckIn(event.target.value);
              invalidateReservationState();
            }}
            type="date"
            value={checkIn}
          />
        </FieldFrame>
        <FieldFrame label="Check-out">
          <TextInput
            min={checkIn || minDate}
            onChange={(event) => {
              setCheckOut(event.target.value);
              invalidateReservationState();
            }}
            type="date"
            value={checkOut}
          />
        </FieldFrame>
      </div>

      <FieldFrame label="Guests">
        <TextInput
          max={selectedRoom?.capacity ?? 20}
          min="1"
          onChange={(event) => {
            setGuests(Number(event.target.value) || 1);
            invalidateReservationState();
          }}
          type="number"
          value={guests}
        />
      </FieldFrame>

      <fieldset className="pet-selector">
        <legend>Your pets</legend>
        {petsLoading ? (
          <div className="skeleton skeleton-line skeleton-line-wide" />
        ) : pets.length > 0 ? (
          <div className="pet-selector-list">
            {pets.map((pet) => {
              const checked = selectedPetIds.includes(pet.id);
              return (
                <label key={pet.id}>
                  <input
                    checked={checked}
                    onChange={(event) => {
                      setSelectedPetIds((current) =>
                        event.target.checked
                          ? [...current, pet.id]
                          : current.filter((id) => id !== pet.id),
                      );
                      invalidateReservationState();
                    }}
                    type="checkbox"
                  />
                  <span className="pet-selector-icon"><PawPrint size={16} aria-hidden="true" /></span>
                  <span>
                    <strong>{pet.name}</strong>
                    <small>{pet.breed} · {pet.size.toLowerCase().replace('_', ' ')}</small>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="detail-muted">
            You don’t have an active pet profile yet. Add one from your account before booking.
          </p>
        )}
      </fieldset>

      {quote ? (
        <div className="quote-breakdown">
          <div><span>Room · {quote.nights} nights</span><strong>{formatInrPaise(quote.pricing.subtotalPaise)}</strong></div>
          <div><span>Pet fee</span><strong>{formatInrPaise(quote.pricing.petFeePaise)}</strong></div>
          <div><span>Service fee</span><strong>{formatInrPaise(quote.pricing.serviceFeePaise)}</strong></div>
          <div><span>Tax</span><strong>{formatInrPaise(quote.pricing.taxPaise)}</strong></div>
          <div className="quote-total"><span>Total</span><strong>{formatInrPaise(quote.pricing.totalPaise)}</strong></div>
          <p>{quote.notice}</p>
        </div>
      ) : (
        <Button
          disabled={busy !== null || pets.length === 0}
          fullWidth
          onClick={requestQuote}
          size="lg"
        >
          {busy === 'quote' ? 'Checking…' : 'Check price & availability'}
        </Button>
      )}

      <div className="booking-trust-row">
        <CalendarDays size={15} aria-hidden="true" />
        <span>Availability is rechecked when you confirm.</span>
      </div>
      <div className="booking-trust-row">
        <Users size={15} aria-hidden="true" />
        <span>Guest and pet compatibility is enforced by the server.</span>
      </div>
    </BookingCardShell>
  );
}
