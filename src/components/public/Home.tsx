import type { SiteData } from "@/lib/content";
import { About } from "./About";
import { Contact, Footer } from "./Contact";
import { Cursor, Loader, Nav } from "./Chrome";
import { Hero, Marquee } from "./Hero";
import { Pipeline, Services, Showreel } from "./Sections";
import { Work } from "./Work";

/** The whole one-page portfolio. Used by "/" (published only) and "/preview" (includes drafts). */
export function Home({ data, preview = false }: { data: SiteData; preview?: boolean }) {
  const { settings: s } = data;
  const base = preview ? "/preview" : "";
  return (
    <>
      {!data.configured && (
        <div className="config-banner" role="status">
          Supabase isn&apos;t configured yet — showing default content. Follow the README to connect your database.
        </div>
      )}
      {data.error && (
        <div className="config-banner" role="alert">Couldn&apos;t load content from the database: {data.error}</div>
      )}
      <Loader />
      <Cursor />
      <Nav name={s.display_name} base={preview ? "/preview" : ""} />
      <main id="main">
        <Hero s={s} hasReel={!!s.showreel_url} />
        <Marquee items={s.hero_skills.length ? s.hero_skills : ["EDIT", "ANIMATE", "CREATE"]} />
        <Work projects={data.projects} categories={data.categories} base={base} />
        <Showreel s={s} />
        <About s={s} />
        <Pipeline s={s} tools={data.tools} examples={data.examples} projects={data.projects} />
        <Services services={data.services} testimonials={data.testimonials} />
        <Contact s={s} />
      </main>
      <Footer name={s.display_name} />
      {preview && (
        <div className="preview-banner" role="status">
          <span>Preview — drafts are visible here, not on the live site</span>
          <a href="/admin" style={{ textDecoration: "underline" }}>Back to dashboard</a>
        </div>
      )}
    </>
  );
}
