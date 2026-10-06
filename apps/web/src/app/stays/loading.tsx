import { SiteHeader } from '../../components/site-header';
import { Skeleton } from '../../components/ui/skeleton';

export default function StaysLoading() {
  return (
    <>
      <SiteHeader />
      <main className="stays-page" id="main-content" aria-live="polite">
        <div className="stays-heading">
          <div className="route-list-loading-copy">
            <Skeleton className="skeleton-line skeleton-line-short" />
            <Skeleton className="skeleton-line skeleton-line-wide" />
          </div>
        </div>
        <div className="stays-layout">
          <Skeleton className="search-filter-skeleton" />
          <div className="stays-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton className="search-result-skeleton" key={index} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
