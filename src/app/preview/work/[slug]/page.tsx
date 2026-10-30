import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/content";
import { ProjectDetail } from "@/components/public/ProjectDetail";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewProject({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const { data, project, next } = await getProjectBySlug(slug, true);
  if (!project) notFound();
  return <ProjectDetail project={project} next={next} settings={data.settings} base="/preview" />;
}
