import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ProjectForm } from "@/components/admin/ProjectForm";
import type { Category, Project } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  let project: Project | null = null;
  if (id !== "new") {
    if (!UUID.test(id)) notFound();
    const { data } = await supabase.from("projects").select("*, categories(name, slug)").eq("id", id).maybeSingle();
    if (!data) notFound();
    project = data as Project;
  }

  return (
    <>
      <h1 className="adm__h1">{project ? "Edit project" : "New project"}</h1>
      <p className="adm__lead">
        {project ? "Changes go live as soon as you click Publish (or Save, if already published)." : "Fill in the details, then Publish — or save as a draft to finish later."}
      </p>
      <ProjectForm project={project} categories={(categories ?? []) as Category[]} />
    </>
  );
}
