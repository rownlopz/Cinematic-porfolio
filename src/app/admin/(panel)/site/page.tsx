import { requireAdmin } from "@/lib/auth";
import { SiteForm } from "@/components/admin/SiteForm";
import { DEFAULT_SETTINGS } from "@/lib/content";
import type { SiteSettings } from "@/lib/types";

export default async function SitePage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return <p className="notice notice--err" role="alert">Couldn&apos;t load settings: {error.message}</p>;
  return (
    <>
      <h1 className="adm__h1">Site content</h1>
      <p className="adm__lead">Your hero, portrait, about text, showreel, contact details and social links.</p>
      <SiteForm settings={{ ...DEFAULT_SETTINGS, ...(data ?? {}) } as SiteSettings} />
    </>
  );
}
