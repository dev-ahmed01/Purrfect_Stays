import { AdminListingDetailClient } from '../../../../components/admin/admin-listing-detail-client';

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return <AdminListingDetailClient propertyId={propertyId} />;
}
