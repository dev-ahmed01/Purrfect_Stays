import { PartnerPropertyEditor } from '../../../../components/partner/partner-property-editor';

export default async function PartnerPropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return <PartnerPropertyEditor propertyId={propertyId} />;
}
