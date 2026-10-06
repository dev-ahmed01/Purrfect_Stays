import Link from 'next/link';
import { DestinationCard } from '../components/destination-card';
import { PropertyCard } from '../components/property-card';
import { SearchPanel } from '../components/search-panel';
import { SectionHeading } from '../components/section-heading';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import type {
  CatalogueFacets,
  DestinationsResponse,
  FeaturedPropertiesResponse,
} from '../lib/catalogue-types';
import { publicApiGet } from '../lib/public-api';
import { toPropertyCardData } from '../lib/property-view';

export const dynamic = 'force-dynamic';

const destinationIcons: Record<string, string> = {
  Goa: '🏖️',
  Madikeri: '🌿',
  Ooty: '⛰️',
  Manali: '🏔️',
  Jaipur: '🏰',
  Pondicherry: '🌊',
  Munnar: '🌱',
  Varkala: '🌴',
};

const reasons = [
  ['✓', 'Pet-Approved Stays', 'Structured pet policies make the rules clear before you travel.'],
  ['🩺', 'Vet Support Nearby', 'Verified facilities can surface nearby or in-house veterinary support.'],
  ['✂️', 'Grooming & Play', 'Find grooming, gardens, walking space and dedicated play areas.'],
  ['📋', 'Verified Facilities', 'Amenity claims are reviewed before they appear as verified publicly.'],
];

export default async function HomePage() {
  const [featured, destinations, facets] = await Promise.all([
    publicApiGet<FeaturedPropertiesResponse>('/properties/featured?limit=3', {
      revalidate: 60,
    }),
    publicApiGet<DestinationsResponse>('/properties/destinations?limit=50', {
      revalidate: 60,
    }),
    publicApiGet<CatalogueFacets>('/properties/facets', {
      revalidate: 60,
    }),
  ]);

  const stayCount = destinations.items.reduce((sum, destination) => sum + destination.stays, 0);
  const topRating = featured.items.reduce(
    (highest, property) => Math.max(highest, property.rating),
    0,
  );

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <p className="hero-badge">🐶 Pet-first stays across India</p>
          <h1>
            Travel Across India
            <br />
            with Your Pets, <span>Stress-Free</span>
          </h1>
          <p className="hero-copy">
            Discover pet-friendly stays with clear policies, grooming, vets and play areas —
            all in one calm booking experience.
          </p>
          <SearchPanel />
          <div className="hero-stats" aria-label="Current catalogue highlights">
            <div><strong>{stayCount}</strong><span>Verified stays</span></div>
            <div><strong>{destinations.items.length}</strong><span>Destinations</span></div>
            <div><strong>{facets.amenities.length}</strong><span>Verified amenities</span></div>
            <div><strong>{topRating ? `${topRating.toFixed(1)}★` : '—'}</strong><span>Top rating</span></div>
          </div>
        </section>

        <section className="section section-white">
          <SectionHeading
            eyebrow="Explore India"
            title="Popular Pet-Friendly Destinations"
            description="From beaches to mountains — start with a destination and refine by the pet travelling with you."
          />
          <div className="destination-grid">
            {destinations.items.slice(0, 6).map((destination) => (
              <DestinationCard
                icon={destinationIcons[destination.city] ?? '🐾'}
                key={`${destination.city}-${destination.state}`}
                name={destination.city}
                stays={destination.stays}
              />
            ))}
          </div>
        </section>

        <section className="section">
          <SectionHeading
            eyebrow="Top Picks"
            title="Featured Pet-Friendly Stays"
            description="Verified stays selected from the live Purrfect catalogue."
          />
          <div className="property-grid">
            {featured.items.map((property) => (
              <PropertyCard
                key={property.slug}
                property={toPropertyCardData(property)}
              />
            ))}
          </div>
          <div className="section-action">
            <Link className="button button-outline" href="/stays">View All Stays →</Link>
          </div>
        </section>

        <section className="section why-section">
          <SectionHeading eyebrow="Why Us" title="Why Choose Purrfect?" />
          <div className="why-grid">
            {reasons.map(([icon, title, body]) => (
              <article className="why-card" key={title}>
                <span className="why-icon" aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="services">
          <SectionHeading
            eyebrow="Pet Services"
            title="Everything Your Pet Needs"
            description="Search around the travel experience without losing the simple stay-first hierarchy."
          />
          <div className="service-grid">
            {[
              ['🛝', 'Playground', 'Outdoor play areas & agility zones'],
              ['✂️', 'Grooming', 'Baths, trims & spa services'],
              ['🚗', 'Travel Assist', 'Pet-safe travel support'],
              ['🍖', 'Pet Food', 'Meals & special diets'],
              ['🩺', 'Vet / Emergency', 'Nearby veterinary support'],
            ].map(([icon, title, body]) => (
              <article className="service-card" key={title}>
                <span aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
