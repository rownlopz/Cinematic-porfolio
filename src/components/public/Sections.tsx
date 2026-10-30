"use client";
import { useEffect, useState } from "react";
import type { PipelineExample, Project, Service, SiteSettings, Testimonial, Tool } from "@/lib/types";
import { KineticText, Reveal } from "./Reveal";
import { VideoPlayer } from "./VideoPlayer";

/* ---------------- Showreel ---------------- */
export function Showreel({ s }: { s: SiteSettings }) {
  return (
    <section id="reel" className="section reel" aria-labelledby="reel-h">
      <div className="wrap">
        <p className="label label--red">03 — Showreel</p>
        <KineticText as="h2" className="display h-xl" text={s.showreel_title || "SHOWREEL"} />
        <Reveal>
          <div style={{ marginTop: 48, paddingRight: 14, paddingBottom: 14 }}>
            <VideoPlayer
              url={s.showreel_url}
              poster={s.showreel_poster_url}
              title={s.showreel_title || "Showreel"}
              emptyLabel="Showreel coming soon"
            />
          </div>
          <div className="timeline-bar" aria-hidden>
            {Array.from({ length: 48 }).map((_, i) => <i key={i} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- AI pipeline ---------------- */
export function Pipeline({
  s,
  tools,
  examples,
  projects,
}: {
  s: SiteSettings;
  tools: Tool[];
  examples: PipelineExample[];
  projects: Project[];
}) {
  const steps = s.pipeline_steps;
  const [active, setActive] = useState(0);

  // Keyboard: arrow keys move between steps (tablist pattern).
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(a + 1, steps.length - 1));
    if (e.key === "ArrowLeft") setActive((a) => Math.max(a - 1, 0));
  };
  useEffect(() => { if (active > steps.length - 1) setActive(0); }, [steps.length, active]);

  const pct = steps.length > 1 ? (active / (steps.length - 1)) * 100 : 0;
  const titleOf = (id: string | null) => projects.find((p) => p.id === id)?.title;

  return (
    <section id="pipeline" className="section ai" aria-labelledby="ai-h">
      <div className="wrap">
        <p className="label label--red">04 — AI Creative</p>
        <KineticText as="h2" className="display h-xl" text={s.ai_title} />
        <Reveal>
          <p className="about__lede" style={{ maxWidth: 820 }}>{s.ai_body}</p>
        </Reveal>

        <div role="tablist" aria-label="Creative pipeline steps" className="pipe" onKeyDown={onKey}>
          {steps.map((step, i) => (
            <button
              key={step + i}
              role="tab"
              id={`step-${i}`}
              aria-selected={active === i}
              aria-controls="pipe-panel"
              tabIndex={active === i ? 0 : -1}
              className={`pipe__step ${i < active ? "is-done" : ""}`}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
            >
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span>{step}</span>
            </button>
          ))}
        </div>
        <div className="pipe__bar" aria-hidden><i style={{ width: `${pct}%` }} /></div>

        <div id="pipe-panel" role="tabpanel" aria-labelledby={`step-${active}`} className="pipe__detail">
          <div>
            <p className="label">Step {active + 1} of {steps.length}</p>
            <p className="display h-lg" style={{ marginTop: 12 }}>{steps[active]}</p>
          </div>
          <div>
            {tools.length === 0 ? (
              <p className="label">Add your tools in Admin → AI tools</p>
            ) : (
              <ul className="tool-list">
                {tools.map((t) => (
                  <li key={t.id}>
                    <div>
                      <strong>{t.name}</strong>
                      <br />
                      <span className={`tag ${t.kind === "ai" ? "is-ai" : ""}`}>{t.kind === "ai" ? "AI tool" : "Software"}</span>
                    </div>
                    <span>{t.role_description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {examples.length > 0 && (
          <div>
            <p className="label" style={{ marginTop: 64 }}>Pipeline in practice</p>
            <div className="examples">
              {examples.map((e) => (
                <article key={e.id} className="example">
                  <h4>{e.title}</h4>
                  <p>{e.description}</p>
                  {titleOf(e.project_id) && <p className="label">Project: {titleOf(e.project_id)}</p>}
                  <div className="pills" style={{ ["--accent" as string]: "var(--yellow)" }}>
                    {e.tools.map((t) => <span key={t} className="pill">{t}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Services + testimonials ---------------- */
export function Services({ services, testimonials }: { services: Service[]; testimonials: Testimonial[] }) {
  return (
    <section id="services" className="section paper-section" aria-labelledby="services-h">
      <div className="torn torn--top" aria-hidden />
      <div className="wrap">
        <p className="label">05 — Services</p>
        <KineticText as="h2" className="display h-xl" text="WHAT I MAKE" />
        {services.length === 0 ? (
          <div className="empty" style={{ marginTop: 40, color: "#555" }}>Add services in Admin → Services.</div>
        ) : (
          <ul className="services" style={{ listStyle: "none", padding: 0, marginTop: 56 }}>
            {services.map((sv, i) => (
              <Reveal as="li" key={sv.id} delay={(i % 2) * 0.08} className="service">
                <div style={{ display: "contents", ["--accent" as string]: sv.accent_color }}>
                  <span className="service__n" style={{ color: sv.accent_color }} aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{sv.title}</h3>
                    <p>{sv.description}</p>
                    {sv.thumbnail_url && (
                      <div className="service__thumb"><img src={sv.thumbnail_url} alt="" loading="lazy" decoding="async" /></div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        )}

        {testimonials.length > 0 && (
          <>
            <p className="label" style={{ marginTop: 96 }}>Kind words</p>
            <div className="quotes">
              {testimonials.map((t) => (
                <figure key={t.id} className="quote" style={{ margin: 0 }}>
                  <blockquote>“{t.quote}”</blockquote>
                  <figcaption className="label">{t.author}{t.role ? ` — ${t.role}` : ""}</figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
