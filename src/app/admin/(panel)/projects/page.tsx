import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ProjectList } from "@/components/admin/ProjectList";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("*, categories(name, slug)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="adm__bar">
        <div>
          <h1 className="adm__h1">Projects</h1>
          <p className="adm__lead" style={{ marginBottom: 0 }}>Add, edit, reorder, publish or delete your work.</p>
        </div>
        <Link className="b b--red" href="/admin/projects/new">+ New project</Link>
      </div>
      {error ? <p className="notice notice--err" role="alert">Couldn&apos;t load projects: {error.message}</p> : <ProjectList initial={(data ?? []) as Project[]} />}
    </>
  );
}
