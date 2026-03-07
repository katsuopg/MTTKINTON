import DashboardLayout from '@/components/layout/DashboardLayout';
import SpacesContent from './SpacesContent';

export default async function SpacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DashboardLayout locale={locale}>
      <SpacesContent locale={locale} />
    </DashboardLayout>
  );
}
