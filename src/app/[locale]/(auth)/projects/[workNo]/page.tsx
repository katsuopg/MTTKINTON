import { redirect } from 'next/navigation';

interface ProjectDetailPageProps {
  params: {
    locale: string;
    workNo: string;
  };
}

// Redirect /projects/[workNo] to /workno/[workNo]
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale, workNo } = await params;
  redirect(`/${locale}/workno/${workNo}`);
}