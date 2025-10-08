import { redirect } from 'next/navigation';

interface ProjectsPageProps {
  params: {
    locale: string;
  };
}

// Redirect /projects to /workno
export default function ProjectsPage({ params: { locale } }: ProjectsPageProps) {
  redirect(`/${locale}/workno`);
}