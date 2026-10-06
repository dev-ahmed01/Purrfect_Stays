import type { PropertySummary } from './catalogue-types';
import type { PropertyCardData } from '../components/property-card';

export function toPropertyCardData(
  property: PropertySummary,
  hrefQuery?: string,
): PropertyCardData {
  const location = [
    property.location.locality,
    property.location.city,
    property.location.state,
  ].filter(Boolean);

  return {
    slug: property.slug,
    name: property.name,
    location: location.join(', '),
    type: titleCase(property.type),
    pricePaise: property.startingPrice.amountPaise,
    rating: property.rating,
    reviewCount: property.reviewCount,
    imageUrl: canOptimizeImage(property.heroImage?.url)
      ? property.heroImage?.url ?? null
      : null,
    imageAlt: property.heroImage?.altText ?? property.name,
    tags: property.amenities.map((amenity) => amenity.name),
    hrefQuery,
  };
}

export function canOptimizeImage(url?: string | null): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
