import { ProjectForm } from "@/features/projects/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectForm projectId={id} />;
}
