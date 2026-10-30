import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/content";
import { ProjectDetail } from "@/components/public/ProjectDetail";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await getProjectBySlug(slug);
  if (!project) return { title: "Not found" };
  const image = project.cover_url || project.thumbnail_url || undefined;
  return {
    title: project.title,
    description: project.short_description || undefined,
    openGraph: { title: project.title, description: project.short_description || undefined, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `/work/${project.slug}` },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const { data, project, next } = await getProjectBySlug(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} next={next} settings={data.settings} />;
}
