import Link from 'next/link';
import { SearchPanel } from '../components/search-panel';
import { SectionHeading } from '../components/section-heading';
import { SiteHeader } from '../components/site-header';

const destinations = [
  { name: 'Goa', stays: 42, icon: '🏖️' },
  { name: 'Coorg', stays: 28, icon: '🌿' },
  { name: 'Ooty', stays: 19, icon: '⛰️' },
  { name: 'Manali', stays: 31, icon: '🏔️' },
  { name: 'Jaipur', stays: 22, icon: '🏰' },
  { name: 'Pondicherry', stays: 17, icon: '🌊' },
];

const featured = [
  {
    slug: 'the-paw-villa',
    name: 'The Paw Villa',
    location: 'Anjuna, Goa',
    type: 'Villa',
    price: 5800,
    rating: 4.9,
    icon: '🏖️',
    tags: ['Pet-friendly', 'Pool', 'Grooming', 'Vet nearby'],
  },
  {
    slug: 'forest-paws-homestay',
    name: 'Forest Paws Homestay',
    location: 'Madikeri, Coorg',
    type: 'Homestay',
    price: 3400,
    rating: 4.8,
    icon: '🌿',
    tags: ['Pet-friendly', 'Large garden', 'Walking trails'],
  },
  {
    slug: 'snow-peaks-pet-resort',
    name: 'Snow Peaks Pet Resort',
    location: 'Old Manali, Himachal Pradesh',
    type: 'Resort',
    price: 7200,
    rating: 4.9,
    icon: '🏔️',
    tags: ['Pet-friendly', 'Grooming', 'In-house vet'],
  },
];

const reasons = [
  ['✓', 'Pet-Approved Stays', 'Policies and facilities are recorded explicitly so you know what your pet is walking into.'],
  ['🩺', 'Vet Support Nearby', 'Emergency and nearby veterinary support can be surfaced with each property.'],
  ['✂️', 'Grooming & Play', 'Find properties with grooming, gardens, walking space and dedicated play areas.'],
  ['📋', 'Verified Facilities', 'Amenity and pet-policy information is structured instead of buried in vague listing copy.'],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <p className="hero-badge">🐶 India&apos;s pet travel platform</p>
          <h1>
            Travel Across India
            <br />
            with Your Pets, <span>Stress-Free</span>
          </h1>
          <p className="hero-copy">
            Discover pet-friendly stays with clear policies, grooming, vets and play areas —
            all in one place.
          </p>
          <SearchPanel />
          <div className="hero-stats" aria-label="Purrfect Stays platform highlights">
            <div><strong>2,400+</strong><span>Pet-friendly stays</span></div>
            <div><strong>85+</strong><span>Cities across India</span></div>
            <div><strong>48,000+</strong><span>Happy pet parents</span></div>
            <div><strong>4.9★</strong><span>Average rating</span></div>
          </div>
        </section>

        <section className="section section-white">
          <SectionHeading
            eyebrow="Explore India"
            title="Popular Pet-Friendly Destinations"
            description="From beaches to mountains — find a stay where your pet belongs too."
          />
          <div className="destination-grid">
            {destinations.map((destination) => (
              <Link
                className="destination-card"
                href={`/stays?destination=${encodeURIComponent(destination.name)}`}
                key={destination.name}
              >
                <div className="destination-art" aria-hidden="true">{destination.icon}</div>
                <div className="destination-info">
                  <strong>{destination.name}</strong>
                  <span>{destination.stays} stays</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <SectionHeading
            eyebrow="Top Picks"
            title="Featured Pet-Friendly Stays"
            description="A first look at the seed catalogue that will become database-driven in Phase 3."
          />
          <div className="property-grid">
            {featured.map((property) => (
              <article className="property-card" key={property.slug}>
                <Link className="property-image" href={`/stays/${property.slug}`} aria-label={property.name}>
                  <span aria-hidden="true">{property.icon}</span>
                </Link>
                <div className="property-body">
                  <div className="property-title-row">
                    <h3>{property.name}</h3>
                    <span className="rating-badge">★ {property.rating}</span>
                  </div>
                  <p className="property-location">📍 {property.location} · {property.type}</p>
                  <div className="tag-row">
                    {property.tags.map((tag) => <span className="pet-tag" key={tag}>{tag}</span>)}
                  </div>
                  <div className="property-footer">
                    <p className="property-price">
                      <strong>₹{property.price.toLocaleString('en-IN')}</strong> <span>/ night</span>
                    </p>
                    <Link className="button button-primary button-small" href={`/stays/${property.slug}`}>
                      View Stay
                    </Link>
                  </div>
                </div>
              </article>
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
            description="The platform will grow beyond stays without losing the simple travel-first experience."
          />
          <div className="service-grid">
            {[
              ['🛝', 'Playground', 'Outdoor play areas & agility zones'],
              ['✂️', 'Grooming', 'Baths, trims & spa services'],
              ['🚗', 'Travel Assist', 'Pet-safe transport'],
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
      <footer className="site-footer">
        <p className="footer-brand">🐾 Purrfect</p>
        <p>Pet-friendly travel, designed around the pet travelling with you.</p>
      </footer>
    </>
  );
}
