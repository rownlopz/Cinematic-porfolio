import Link from "next/link";
import type { Project, SiteSettings } from "@/lib/types";
import { Cursor } from "./Chrome";
import { VideoPlayer } from "./VideoPlayer";
import { Footer } from "./Contact";

export function ProjectDetail({
  project: p,
  next,
  settings,
  base = "",
}: {
  project: Project;
  next: Project | null;
  settings: SiteSettings;
  base?: string;
}) {
  const accent = { ["--accent" as string]: p.accent_color };
  return (
    <>
      <Cursor />
      <header className="nav is-scrolled">
        <Link href={base || "/"} className="nav__logo">{settings.display_name.split(" ")[0]}<i>.</i></Link>
        <Link href={`${base}/#work`} className="label">← All work</Link>
      </header>
      <main id="main" className="detail wrap" style={accent}>
        <div className="detail__head">
          <div>
            <p className="label" style={{ color: p.accent_color }}>
              {p.categories?.name ?? "Project"}{p.project_date ? ` · ${new Date(p.project_date).getFullYear()}` : ""}
            </p>
            <h1 className="display h-xl" style={{ marginTop: 12 }}>{p.title}</h1>
          </div>
          {p.is_placeholder && <span className="sticker" style={{ position: "static" }}>Placeholder project</span>}
          {p.status === "draft" && <span className="sticker" style={{ position: "static", background: "var(--blue)", color: "#fff" }}>Draft</span>}
        </div>

        <div style={{ paddingRight: 14, paddingBottom: 14 }}>
          <VideoPlayer url={p.video_url} poster={p.cover_url || p.thumbnail_url} title={p.title} emptyLabel="Video coming soon" />
        </div>

        <div className="detail__cols">
          <div>
            {p.short_description && <p className="about__lede" style={{ marginTop: 0 }}>{p.short_description}</p>}
            {p.creative_approach && (
              <>
                <p className="label label--red">Creative approach</p>
                <div style={{ marginTop: 12, maxWidth: "68ch", whiteSpace: "pre-line" }}>{p.creative_approach}</div>
              </>
            )}
          </div>
          <aside>
            <ul className="facts">
              <li><span className="label">Category</span><span>{p.categories?.name ?? "—"}</span></li>
              {p.project_date && (
                <li><span className="label">Date</span><span>{new Date(p.project_date).toLocaleDateString("en", { year: "numeric", month: "long" })}</span></li>
              )}
              <li style={{ display: "block" }}>
                <span className="label">Tools used</span>
                <div className="pills" style={{ marginTop: 10 }}>
                  {p.tools.length ? p.tools.map((t) => <span key={t} className="pill">{t}</span>) : <span>—</span>}
                </div>
              </li>
            </ul>
          </aside>
        </div>

        {next && (
          <Link href={`${base}/work/${next.slug}`} className="next">
            <span className="label">Next project →</span>
            <span className="display h-lg" style={{ display: "block", marginTop: 8 }}>{next.title}</span>
          </Link>
        )}
      </main>
      <Footer name={settings.display_name} />
    </>
  );
}
