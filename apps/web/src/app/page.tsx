import Link from 'next/link';
import { DestinationCard } from '../components/destination-card';
import { PropertyCard, type PropertyCardData } from '../components/property-card';
import { SearchPanel } from '../components/search-panel';
import { SectionHeading } from '../components/section-heading';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';

const destinations = [
  { name: 'Goa', stays: 1, icon: '🏖️' },
  { name: 'Coorg', stays: 1, icon: '🌿' },
  { name: 'Ooty', stays: 1, icon: '⛰️' },
  { name: 'Manali', stays: 1, icon: '🏔️' },
  { name: 'Jaipur', stays: 1, icon: '🏰' },
  { name: 'Pondicherry', stays: 1, icon: '🌊' },
];

const featured: PropertyCardData[] = [
  {
    slug: 'the-paw-villa',
    name: 'The Paw Villa',
    location: 'Anjuna, Goa',
    type: 'Villa',
    pricePaise: 580_000,
    rating: 4.9,
    reviewCount: 127,
    imageUrl:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'The Paw Villa property exterior',
    tags: ['Pet-friendly', 'Pool', 'Grooming', 'Vet nearby'],
  },
  {
    slug: 'forest-paws-homestay',
    name: 'Forest Paws Homestay',
    location: 'Madikeri, Coorg',
    type: 'Homestay',
    pricePaise: 340_000,
    rating: 4.8,
    reviewCount: 88,
    imageUrl:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Forest Paws Homestay property exterior',
    tags: ['Pet-friendly', 'Large garden', 'Walking trails'],
  },
  {
    slug: 'snow-peaks-pet-resort',
    name: 'Snow Peaks Pet Resort',
    location: 'Old Manali, Himachal Pradesh',
    type: 'Resort',
    pricePaise: 720_000,
    rating: 4.9,
    reviewCount: 104,
    imageUrl:
      'https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Snow Peaks Pet Resort mountain property',
    tags: ['Pet-friendly', 'Grooming', 'In-house vet'],
  },
];

const reasons = [
  ['✓', 'Pet-Approved Stays', 'Structured pet policies make the rules clear before you travel.'],
  ['🩺', 'Vet Support Nearby', 'Verified facilities can surface nearby or in-house veterinary support.'],
  ['✂️', 'Grooming & Play', 'Find grooming, gardens, walking space and dedicated play areas.'],
  ['📋', 'Verified Facilities', 'Amenity claims are reviewed before they appear as verified publicly.'],
];

export default function HomePage() {
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
          <div className="hero-stats" aria-label="Current demo catalogue highlights">
            <div><strong>8</strong><span>Seeded pet-friendly stays</span></div>
            <div><strong>8</strong><span>Indian destinations</span></div>
            <div><strong>12</strong><span>Amenity categories</span></div>
            <div><strong>4.9★</strong><span>Top seeded rating</span></div>
          </div>
        </section>

        <section className="section section-white">
          <SectionHeading
            eyebrow="Explore India"
            title="Popular Pet-Friendly Destinations"
            description="From beaches to mountains — start with a destination and refine by the pet travelling with you."
          />
          <div className="destination-grid">
            {destinations.map((destination) => (
              <DestinationCard key={destination.name} {...destination} />
            ))}
          </div>
        </section>

        <section className="section">
          <SectionHeading
            eyebrow="Top Picks"
            title="Featured Pet-Friendly Stays"
            description="A polished preview of the seeded catalogue. Phase 11 connects these same cards to the live search API."
          />
          <div className="property-grid">
            {featured.map((property) => (
              <PropertyCard key={property.slug} property={property} />
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
