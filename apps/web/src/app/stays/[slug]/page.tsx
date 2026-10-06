import type { Metadata } from 'next';
import { CheckCircle2, MapPin, PawPrint, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AmenityBadge } from '../../../components/amenity-badge';
import { BookingPanel } from '../../../components/booking-panel';
import { PropertyGallery } from '../../../components/property-gallery';
import { PropertyReviews } from '../../../components/property-reviews';
import { RatingBadge } from '../../../components/rating-badge';
import { SiteFooter } from '../../../components/site-footer';
import { SiteHeader } from '../../../components/site-header';
import type {
  PropertyDetail,
  PublicReviewsResponse,
} from '../../../lib/catalogue-types';
import { ApiError } from '../../../lib/api-types';
import { formatInrPaise } from '../../../lib/format';
import { publicApiGet } from '../../../lib/public-api';
import {
  firstParam,
  type PublicSearchParams,
} from '../../../lib/search-params';
import { titleCase } from '../../../lib/property-view';

export const dynamic = 'force-dynamic';

async function getProperty(slug: string) {
  try {
    return await publicApiGet<PropertyDetail>(
      `/properties/${encodeURIComponent(slug)}`,
      { revalidate: 60 },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  return {
    title: property.name,
    description: property.shortDescription,
  };
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  const [property, reviews] = await Promise.all([
    getProperty(slug),
    publicApiGet<PublicReviewsResponse>(
      `/properties/${encodeURIComponent(slug)}/reviews?page=1&pageSize=6&sort=recent`,
      { revalidate: 60 },
    ),
  ]);

  const policy = property.petPolicy;
  const species = [
    policy?.allowsDogs ? 'Dogs' : null,
    policy?.allowsCats ? 'Cats' : null,
    policy?.allowsOther ? 'Other pets' : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <main className="detail-page" id="main-content">
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/stays">Stays</Link>
          <span aria-hidden="true">/</span>
          <span>{property.name}</span>
        </nav>

        <header className="detail-header">
          <div>
            <p className="section-eyebrow">
              {titleCase(property.type)} · Verified stay
            </p>
            <h1>{property.name}</h1>
            <p className="detail-location">
              <MapPin size={16} aria-hidden="true" />
              {[
                property.address.locality,
                property.address.city,
                property.address.state,
              ].filter(Boolean).join(', ')}
            </p>
          </div>
          <RatingBadge
            count={property.reviewCount}
            rating={property.rating}
          />
        </header>

        <PropertyGallery
          images={property.images}
          propertyName={property.name}
        />

        <div className="detail-layout">
          <div className="detail-main">
            <section className="detail-section">
              <p className="section-eyebrow">About the stay</p>
              <h2>A place designed to welcome pets too.</h2>
              <p className="detail-prose">{property.description}</p>
            </section>

            {policy ? (
              <section className="detail-section">
                <div className="detail-section-heading">
                  <div>
                    <p className="section-eyebrow">Pet policy</p>
                    <h2>Know the rules before you travel</h2>
                  </div>
                  <ShieldCheck size={23} aria-hidden="true" />
                </div>

                <div className="policy-grid">
                  <div>
                    <span>Pet types</span>
                    <strong>{species.join(', ') || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span>Maximum pets</span>
                    <strong>{policy.maxPets}</strong>
                  </div>
                  <div>
                    <span>Allowed sizes</span>
                    <strong>{policy.allowedSizes.map(titleCase).join(', ')}</strong>
                  </div>
                  <div>
                    <span>Vaccination</span>
                    <strong>{policy.requiresVaccination ? 'Required' : 'Not required'}</strong>
                  </div>
                  <div>
                    <span>Pet fee</span>
                    <strong>
                      {formatInrPaise(policy.fee.amountPaise)} · {policy.fee.mode === 'PER_NIGHT' ? 'per pet/night' : 'per pet/stay'}
                    </strong>
                  </div>
                  <div>
                    <span>Breed policy</span>
                    <strong>
                      {policy.restrictedBreedKeys.length > 0
                        ? `${policy.restrictedBreedKeys.length} restriction(s)`
                        : 'No listed breed restrictions'}
                    </strong>
                  </div>
                </div>

                {policy.notes ? <p className="policy-note">{policy.notes}</p> : null}
              </section>
            ) : null}

            <section className="detail-section">
              <p className="section-eyebrow">Verified facilities</p>
              <h2>What this stay offers</h2>
              <div className="detail-amenities">
                {property.amenities.map((amenity) => (
                  <AmenityBadge key={amenity.slug} verified>
                    {amenity.name}
                  </AmenityBadge>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <p className="section-eyebrow">Rooms</p>
              <h2>Choose the space that fits your trip</h2>
              <div className="room-list">
                {property.roomTypes.map((room) => (
                  <article className="room-card" key={room.id}>
                    <div>
                      <h3>{room.name}</h3>
                      {room.description ? <p>{room.description}</p> : null}
                      <span>Up to {room.capacity} guest{room.capacity === 1 ? '' : 's'}</span>
                    </div>
                    <div className="room-price">
                      <strong>{formatInrPaise(room.nightlyRate.amountPaise)}</strong>
                      <span>/ night</span>
                      {room.serviceFee.amountPaise > 0 ? (
                        <small>+ {formatInrPaise(room.serviceFee.amountPaise)} service fee</small>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="detail-section detail-trust-note">
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <strong>Verified listing boundary</strong>
                <p>
                  Public policy and amenity information comes only from the verified catalogue.
                  Final compatibility and availability are checked again when you request a quote.
                </p>
              </div>
            </section>

            <PropertyReviews reviews={reviews} />
          </div>

          <div className="detail-booking-column">
            <BookingPanel
              initialCheckIn={firstParam(query, 'checkIn')}
              initialCheckOut={firstParam(query, 'checkOut')}
              initialGuests={firstParam(query, 'guests')}
              property={property}
            />
            <div className="detail-pet-first-note">
              <PawPrint size={18} aria-hidden="true" />
              <p>
                Your saved pet profiles are matched against this property’s policy by the booking server.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
