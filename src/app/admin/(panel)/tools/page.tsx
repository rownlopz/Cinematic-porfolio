import { requireAdmin } from "@/lib/auth";
import { CollectionManager } from "@/components/admin/CollectionManager";

export default async function ToolsPage() {
  const { supabase } = await requireAdmin();
  const [tools, examples, projects] = await Promise.all([
    supabase.from("tools").select("*").order("sort_order"),
    supabase.from("pipeline_examples").select("*").order("sort_order"),
    supabase.from("projects").select("id,title").order("title"),
  ]);
  return (
    <>
      <h1 className="adm__h1">AI tools & pipeline</h1>
      <p className="adm__lead">The tools in your workflow, and examples of how you used them. The step names themselves are edited in Site content.</p>

      <h2 className="adm__h1" style={{ fontSize: 28, marginTop: 8 }}>Tools</h2>
      <CollectionManager
        table="tools"
        noun="Tool"
        titleKey="name"
        subtitleKey="role_description"
        items={tools.data ?? []}
        fields={[
          { name: "name", label: "Name", type: "text", maxLength: 60 },
          { name: "role_description", label: "What you use it for", type: "textarea", maxLength: 240 },
          { name: "kind", label: "Type", type: "select", options: [{ value: "ai", label: "AI tool" }, { value: "software", label: "Software" }] },
          { name: "visible", label: "Visible on site", type: "checkbox" },
        ]}
      />

      <h2 className="adm__h1" style={{ fontSize: 28, marginTop: 40 }}>Pipeline examples</h2>
      <CollectionManager
        table="pipeline_examples"
        noun="Example"
        titleKey="title"
        subtitleKey="description"
        items={examples.data ?? []}
        fields={[
          { name: "title", label: "Title", type: "text", maxLength: 120 },
          { name: "description", label: "How the tools were used", type: "textarea", maxLength: 600 },
          { name: "tools", label: "Tools used", type: "tags" },
          {
            name: "project_id",
            label: "Linked project (optional)",
            type: "select",
            options: [{ value: "", label: "— none —" }, ...(projects.data ?? []).map((p) => ({ value: p.id as string, label: p.title as string }))],
          },
          { name: "visible", label: "Visible on site", type: "checkbox" },
        ]}
      />
    </>
  );
}
