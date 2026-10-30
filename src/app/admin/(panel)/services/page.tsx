import { requireAdmin } from "@/lib/auth";
import { CollectionManager } from "@/components/admin/CollectionManager";

export default async function ServicesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("services").select("*").order("sort_order");
  return (
    <>
      <h1 className="adm__h1">Services</h1>
      <p className="adm__lead">What you offer. Each service can have its own accent colour and thumbnail.</p>
      <CollectionManager
        table="services"
        noun="Service"
        titleKey="title"
        subtitleKey="description"
        items={data ?? []}
        fields={[
          { name: "title", label: "Title", type: "text", maxLength: 100 },
          { name: "description", label: "Description", type: "textarea", maxLength: 500 },
          { name: "thumbnail_url", label: "Thumbnail (optional)", type: "image" },
          { name: "accent_color", label: "Accent colour", type: "color" },
          { name: "visible", label: "Visible on site", type: "checkbox" },
        ]}
      />
    </>
  );
}
