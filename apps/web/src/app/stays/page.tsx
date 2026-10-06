import { propertySearchSchema } from '@purrfect/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchFilters } from '../../components/search-filters';
import { SearchSort } from '../../components/search-sort';
import { PropertyCard } from '../../components/property-card';
import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import { Alert } from '../../components/ui/alert';
import { EmptyState } from '../../components/ui/empty-state';
import type {
  CatalogueFacets,
  PropertySearchResponse,
} from '../../lib/catalogue-types';
import { publicApiGet } from '../../lib/public-api';
import {
  catalogueInputFromSearchParams,
  catalogueQueryString,
  firstParam,
  type PublicSearchParams,
} from '../../lib/search-params';
import { toPropertyCardData } from '../../lib/property-view';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pet-friendly stays',
  description: 'Search verified pet-friendly stays by destination, pet policy, amenities and price.',
};

function pageHref(params: PublicSearchParams, page: number) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || !value) continue;

    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else {
      query.set(key, value);
    }
  }

  query.set('page', String(page));
  return `/stays?${query.toString()}`;
}

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  const params = await searchParams;
  const validation = propertySearchSchema.safeParse(
    catalogueInputFromSearchParams(params),
  );
  const query = catalogueQueryString(params);
  const stayContext = query;

  const facets = await publicApiGet<CatalogueFacets>('/properties/facets', {
    revalidate: 60,
  });

  const results = validation.success
    ? await publicApiGet<PropertySearchResponse>(`/properties?${query}`, {
        revalidate: false,
      })
    : null;

  const destination = firstParam(params, 'destination');
  const title = destination
    ? `Pet-friendly stays in ${destination}`
    : 'Find a stay that fits your pet';

  return (
    <>
      <SiteHeader />
      <main className="stays-page" id="main-content">
        <section className="stays-heading">
          <div>
            <p className="section-eyebrow">Verified stays</p>
            <h1>{title}</h1>
            <p>
              {results
                ? results.meta.totalItems === 1
                  ? '1 stay matches your filters.'
                  : `${results.meta.totalItems} stays match your filters.`
                : 'Adjust the filters below to continue.'}
            </p>
          </div>
          <SearchSort params={params} />
        </section>

        <div className="stays-layout">
          <aside className="stays-sidebar">
            <SearchFilters facets={facets} params={params} />
          </aside>

          <section className="stays-results" aria-label="Stay search results">
            {!validation.success ? (
              <Alert tone="danger" title="Check your search filters">
                {validation.error.issues[0]?.message ?? 'One or more search filters are invalid.'}
              </Alert>
            ) : results && results.items.length > 0 ? (
              <>
                <div className="stays-grid">
                  {results.items.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={toPropertyCardData(property, stayContext)}
                    />
                  ))}
                </div>

                <nav className="pagination" aria-label="Search result pages">
                  {results.meta.hasPreviousPage ? (
                    <Link
                      className="button button-outline button-sm"
                      href={pageHref(params, results.meta.page - 1)}
                    >
                      ← Previous
                    </Link>
                  ) : <span />}

                  <span>
                    Page {results.meta.page} of {results.meta.totalPages}
                  </span>

                  {results.meta.hasNextPage ? (
                    <Link
                      className="button button-outline button-sm"
                      href={pageHref(params, results.meta.page + 1)}
                    >
                      Next →
                    </Link>
                  ) : <span />}
                </nav>
              </>
            ) : (
              <EmptyState
                title="No stays match those filters"
                description="Try widening the destination, price or pet-policy filters. We won’t substitute properties that don’t actually match."
                action={<Link className="button button-outline" href="/stays">Clear filters</Link>}
              />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
