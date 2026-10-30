import { requireAdmin } from "@/lib/auth";
import { CollectionManager } from "@/components/admin/CollectionManager";

export default async function TestimonialsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("testimonials").select("*").order("sort_order");
  return (
    <>
      <h1 className="adm__h1">Testimonials</h1>
      <p className="adm__lead">Only add real quotes from real people. The section is hidden on the site until you add one.</p>
      <CollectionManager
        table="testimonials"
        noun="Testimonial"
        titleKey="author"
        subtitleKey="quote"
        items={data ?? []}
        fields={[
          { name: "quote", label: "Quote", type: "textarea", maxLength: 600 },
          { name: "author", label: "Name", type: "text", maxLength: 80 },
          { name: "role", label: "Role / company (optional)", type: "text", maxLength: 80 },
          { name: "visible", label: "Visible on site", type: "checkbox" },
        ]}
      />
    </>
  );
}
