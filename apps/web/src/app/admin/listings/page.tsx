import { AdminListingsClient } from '../../../components/admin/admin-listings-client';

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  return <AdminListingsClient initialStatus={status} />;
}
