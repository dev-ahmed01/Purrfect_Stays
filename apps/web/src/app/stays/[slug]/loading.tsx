import { SiteHeader } from '../../../components/site-header';
import { Skeleton } from '../../../components/ui/skeleton';

export default function PropertyLoading() {
  return (
    <>
      <SiteHeader />
      <main className="detail-page" id="main-content" aria-live="polite">
        <Skeleton className="detail-title-skeleton" />
        <Skeleton className="detail-gallery-loading" />
        <div className="detail-layout">
          <div className="detail-main">
            <Skeleton className="detail-section-skeleton" />
            <Skeleton className="detail-section-skeleton" />
          </div>
          <Skeleton className="detail-booking-skeleton" />
        </div>
      </main>
    </>
  );
}
