import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { formatInrPaise } from '../lib/format';
import { AmenityBadge } from './amenity-badge';
import { RatingBadge } from './rating-badge';

export type PropertyCardData = {
  slug: string;
  name: string;
  location: string;
  type: string;
  pricePaise: number;
  rating: number;
  reviewCount?: number;
  imageUrl?: string | null;
  imageAlt?: string;
  tags: string[];
  hrefQuery?: string;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const href = `/stays/${property.slug}${property.hrefQuery ? `?${property.hrefQuery}` : ''}`;

  return (
    <article className="property-card">
      <Link
        className="property-image property-image-real"
        href={href}
        aria-label={`View ${property.name}`}
      >
        {property.imageUrl ? (
          <Image
            alt={property.imageAlt ?? property.name}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1020px) 50vw, 33vw"
            src={property.imageUrl}
          />
        ) : (
          <div className="property-image-fallback" aria-hidden="true">🐾</div>
        )}
      </Link>
      <div className="property-body">
        <div className="property-title-row">
          <h3><Link href={href}>{property.name}</Link></h3>
          <RatingBadge rating={property.rating} count={property.reviewCount} />
        </div>
        <p className="property-location">
          <MapPin size={14} aria-hidden="true" />
          {property.location} · {property.type}
        </p>
        <div className="tag-row">
          {property.tags.slice(0, 4).map((tag) => (
            <AmenityBadge key={tag}>{tag}</AmenityBadge>
          ))}
        </div>
        <div className="property-footer">
          <p className="property-price">
            <strong>{formatInrPaise(property.pricePaise)}</strong>{' '}
            <span>/ night</span>
          </p>
          <Link className="button button-primary button-sm" href={href}>
            View Stay
          </Link>
        </div>
      </div>
    </article>
  );
}
