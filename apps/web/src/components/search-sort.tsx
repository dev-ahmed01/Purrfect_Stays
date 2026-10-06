import type { PublicSearchParams } from '../lib/search-params';
import { firstParam } from '../lib/search-params';

export function SearchSort({ params }: { params: PublicSearchParams }) {
  return (
    <label className="stays-sort">
      <span>Sort by</span>
      <select
        defaultValue={firstParam(params, 'sort') ?? 'recommended'}
        form="stays-sort-form"
        name="sort"
      >
        <option value="recommended">Recommended</option>
        <option value="rating">Highest rated</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </label>
  );
}
