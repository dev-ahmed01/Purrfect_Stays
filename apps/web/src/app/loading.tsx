import { Skeleton } from '../components/ui/skeleton';

export default function Loading() {
  return (
    <main className="route-state" id="main-content" aria-live="polite">
      <div className="route-state-card">
        <Skeleton className="skeleton-line skeleton-line-short" />
        <Skeleton className="skeleton-line skeleton-line-wide" />
        <Skeleton className="skeleton-card" />
      </div>
    </main>
  );
}
