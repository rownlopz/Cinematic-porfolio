import "../admin.css";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOutAction } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdmin();
  const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false);

  return (
    <div className="adm">
      <aside className="adm__side">
        <div className="adm__brand">Edit<i>.</i>Bay</div>
        <AdminNav unread={count ?? 0} />
        <div className="adm__foot">
          <Link className="b b--sm" href="/preview" target="_blank">Preview site ↗</Link>
          <Link className="b b--sm" href="/" target="_blank">Live site ↗</Link>
          <form action={signOutAction}><button className="b b--sm b--ghost" type="submit" style={{ width: "100%" }}>Sign out</button></form>
          <small style={{ color: "var(--paper-dim)", wordBreak: "break-all" }}>{user.email}</small>
        </div>
      </aside>
      <main id="main" className="adm__main">{children}</main>
    </div>
  );
}
