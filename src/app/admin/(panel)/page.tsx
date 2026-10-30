import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function Overview() {
  const { supabase } = await requireAdmin();
  const [projects, settings, services, unread] = await Promise.all([
    supabase.from("projects").select("status,is_placeholder"),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
  ]);
  const list = projects.data ?? [];
  const published = list.filter((p) => p.status === "published").length;
  const drafts = list.length - published;
  const real = list.filter((p) => p.status === "published" && !p.is_placeholder).length;
  const s = settings.data;

  const checks = [
    { ok: !!s && s.display_name !== "YOUR NAME", text: "Set your name", href: "/admin/site" },
    { ok: !!s?.portrait_url, text: "Upload your portrait", href: "/admin/site" },
    { ok: !!s?.showreel_url, text: "Add your showreel link", href: "/admin/site" },
    { ok: real > 0, text: "Publish a real (non-placeholder) project", href: "/admin/projects" },
    { ok: !!s?.contact_email, text: "Set your contact email", href: "/admin/site" },
    { ok: (s?.social_links?.length ?? 0) > 0, text: "Add social links", href: "/admin/site" },
  ];

  return (
    <>
      <h1 className="adm__h1">Overview</h1>
      <p className="adm__lead">Everything here updates your live website automatically when you save or publish.</p>

      <div className="stats">
        <div className="stat"><b>{published}</b>Published projects</div>
        <div className="stat"><b>{drafts}</b>Drafts</div>
        <div className="stat"><b>{services.count ?? 0}</b>Services</div>
        <div className="stat"><b>{unread.count ?? 0}</b>Unread inquiries</div>
      </div>

      <div className="card">
        <h2>Quick actions</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="b b--red" href="/admin/projects/new">+ New project</Link>
          <Link className="b" href="/admin/site">Edit hero & showreel</Link>
          <Link className="b" href="/admin/messages">Read inquiries</Link>
          <Link className="b" href="/preview" target="_blank">Preview with drafts ↗</Link>
        </div>
      </div>

      <div className="card">
        <h2>Launch checklist</h2>
        <ul className="check">
          {checks.map((c) => (
            <li key={c.text}>
              <span className={`dot ${c.ok ? "on" : ""}`} aria-hidden />
              <Link href={c.href} style={{ textDecoration: c.ok ? "line-through" : "underline", color: c.ok ? "var(--paper-dim)" : undefined }}>{c.text}</Link>
              <span className="sr-only" style={{ position: "absolute", left: -9999 }}>{c.ok ? "done" : "to do"}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
