import { ProjectDetail } from "@/features/projects/project-detail/project-detail";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
