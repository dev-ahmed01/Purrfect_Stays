import Link from 'next/link';
import type { CatalogueFacets } from '../lib/catalogue-types';
import {
  allParams,
  firstParam,
  type PublicSearchParams,
} from '../lib/search-params';
import { titleCase } from '../lib/property-view';

export function SearchFilters({
  facets,
  params,
}: {
  facets: CatalogueFacets;
  params: PublicSearchParams;
}) {
  const selectedAmenities = new Set(allParams(params, 'amenities'));

  return (
    <form className="stays-filter-panel" action="/stays" method="get">
      <div className="stays-filter-heading">
        <div>
          <p className="section-eyebrow">Refine</p>
          <h2>Find the right fit</h2>
        </div>
        <Link href="/stays">Clear</Link>
      </div>

      <label className="filter-field">
        <span>Destination</span>
        <input
          defaultValue={firstParam(params, 'destination')}
          name="destination"
          placeholder="Goa, Coorg, Manali…"
        />
      </label>

      <div className="filter-grid-two">
        <label className="filter-field">
          <span>Check-in</span>
          <input
            defaultValue={firstParam(params, 'checkIn')}
            name="checkIn"
            type="date"
          />
        </label>
        <label className="filter-field">
          <span>Check-out</span>
          <input
            defaultValue={firstParam(params, 'checkOut')}
            name="checkOut"
            type="date"
          />
        </label>
      </div>

      <div className="filter-grid-two">
        <label className="filter-field">
          <span>Guests</span>
          <input
            defaultValue={firstParam(params, 'guests') ?? '2'}
            min="1"
            max="20"
            name="guests"
            type="number"
          />
        </label>
        <label className="filter-field">
          <span>Pets</span>
          <input
            defaultValue={firstParam(params, 'pets') ?? '1'}
            min="0"
            max="10"
            name="pets"
            type="number"
          />
        </label>
      </div>

      <div className="filter-grid-two">
        <label className="filter-field">
          <span>Species</span>
          <select defaultValue={firstParam(params, 'species') ?? ''} name="species">
            <option value="">Any</option>
            <option value="DOG">Dog</option>
            <option value="CAT">Cat</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Pet size</span>
          <select defaultValue={firstParam(params, 'size') ?? ''} name="size">
            <option value="">Any</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="EXTRA_LARGE">Extra large</option>
          </select>
        </label>
      </div>

      <label className="filter-field">
        <span>Breed</span>
        <input
          defaultValue={firstParam(params, 'breed')}
          name="breed"
          placeholder="Golden retriever"
        />
      </label>

      <label className="filter-field">
        <span>Property type</span>
        <select
          defaultValue={firstParam(params, 'propertyType') ?? ''}
          name="propertyType"
        >
          <option value="">Any type</option>
          {facets.propertyTypes.map((type) => (
            <option key={type.type} value={type.type}>
              {titleCase(type.type)} ({type.stays})
            </option>
          ))}
        </select>
      </label>

      <div className="filter-grid-two">
        <label className="filter-field">
          <span>Min ₹ / night</span>
          <input
            defaultValue={firstParam(params, 'minPrice')}
            min="0"
            name="minPrice"
            placeholder="0"
            type="number"
          />
        </label>
        <label className="filter-field">
          <span>Max ₹ / night</span>
          <input
            defaultValue={firstParam(params, 'maxPrice')}
            min="0"
            name="maxPrice"
            placeholder="Any"
            type="number"
          />
        </label>
      </div>

      <label className="filter-field">
        <span>Minimum rating</span>
        <select defaultValue={firstParam(params, 'minRating') ?? ''} name="minRating">
          <option value="">Any rating</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </select>
      </label>

      <fieldset className="amenity-filter">
        <legend>Verified amenities</legend>
        <div className="amenity-check-grid">
          {facets.amenities.map((amenity) => (
            <label key={amenity.slug}>
              <input
                defaultChecked={selectedAmenities.has(amenity.slug)}
                name="amenities"
                type="checkbox"
                value={amenity.slug}
              />
              <span>{amenity.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <input name="pageSize" type="hidden" value="12" />

      <button className="button button-primary button-full" type="submit">
        Apply filters
      </button>
    </form>
  );
}
