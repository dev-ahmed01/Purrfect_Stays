import type { PublicSearchParams } from '../lib/search-params';
import { firstParam } from '../lib/search-params';

const preservedKeys = [
  'destination',
  'checkIn',
  'checkOut',
  'guests',
  'pets',
  'species',
  'size',
  'breed',
  'propertyType',
  'minPrice',
  'maxPrice',
  'minRating',
  'amenities',
  'pageSize',
];

export function SearchSort({ params }: { params: PublicSearchParams }) {
  return (
    <form action="/stays" className="stays-sort" method="get">
      {preservedKeys.flatMap((key) => {
        const value = params[key];
        if (!value) return [];

        const values = Array.isArray(value) ? value : [value];
        return values.map((item, index) => (
          <input
            key={`${key}-${index}`}
            name={key}
            type="hidden"
            value={item}
          />
        ));
      })}
      <label>
        <span>Sort by</span>
        <select
          defaultValue={firstParam(params, 'sort') ?? 'recommended'}
          name="sort"
          onChange={undefined}
        >
          <option value="recommended">Recommended</option>
          <option value="rating">Highest rated</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>
      <button className="button button-outline button-sm" type="submit">
        Apply
      </button>
    </form>
  );
}
