import type { SiteSettings } from "@/lib/types";
import { KineticText, Reveal } from "./Reveal";

export function About({ s }: { s: SiteSettings }) {
  return (
    <section id="about" className="section paper-section" aria-labelledby="about-h">
      <div className="torn torn--top" aria-hidden />
      <div className="wrap about">
        <Reveal className="about__image">
          <div className="slab">
            {s.about_image_url || s.portrait_url ? (
              <img src={(s.about_image_url || s.portrait_url)!} alt={`${s.display_name} at work`} loading="lazy" decoding="async" />
            ) : (
              <div className="portrait__placeholder fx-halftone" style={{ color: "var(--paper)" }}>
                <p className="display" style={{ fontSize: 36 }}>IMAGE<br />PLACEHOLDER</p>
              </div>
            )}
          </div>
        </Reveal>

        <div className="about__text">
          <p className="label">01 — About{s.location ? ` · ${s.location}` : ""}</p>
          <KineticText as="h2" className="display h-lg" text={s.about_heading} />
          <Reveal>
            <p className="about__lede">{s.about_body}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="skills" aria-label="Skills">
              {s.about_skills.map((k, i) => (
                <li key={k} className="skill"><b>{String(i + 1).padStart(2, "0")}</b>{k}</li>
              ))}
            </ul>
            <div className="roles" aria-label="Roles">
              {s.roles.map((r) => <span key={r}>{r}</span>)}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
