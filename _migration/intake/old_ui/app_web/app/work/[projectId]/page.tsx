import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/work/ProjectHeader";
import { ProjectTabs } from "@/components/work/ProjectTabs";
import { MOCK_PROJECTS, getProject } from "@/lib/mock/projects";

export function generateStaticParams() {
  return MOCK_PROJECTS.map((p) => ({ projectId: p.id }));
}

export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const project = getProject(params.projectId);
  if (!project) notFound();
  return (
    <div>
      <ProjectHeader project={project} />
      <ProjectTabs project={project} />
    </div>
  );
}
