import { AdminListingsClient } from '../../../components/admin/admin-listings-client';

const ALLOWED_STATUSES = new Set([
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'SUSPENDED',
]);

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = rawStatus && ALLOWED_STATUSES.has(rawStatus)
    ? rawStatus
    : 'PENDING_REVIEW';

  return <AdminListingsClient initialStatus={status} />;
}
