import DashboardLayout from '@/components/layout/DashboardLayout';
import SpaceDetailContent from './SpaceDetailContent';

export default async function SpaceDetailPage({ params }: { params: Promise<{ locale: string; spaceId: string }> }) {
  const { locale, spaceId } = await params;
  return (
    <DashboardLayout locale={locale}>
      <SpaceDetailContent locale={locale} spaceId={spaceId} />
    </DashboardLayout>
  );
}
