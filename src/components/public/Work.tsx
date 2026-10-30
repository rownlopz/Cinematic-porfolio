"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Category, Project } from "@/lib/types";
import { parseVideo } from "@/lib/video";
import { KineticText, Reveal } from "./Reveal";

const VARIANTS = ["a", "b", "c", "d", "full"] as const;

function ProjectCard({ p, index, variant, base }: { p: Project; index: number; variant: string; base: string }) {
  const [hover, setHover] = useState(false);
  const vref = useRef<HTMLVideoElement>(null);
  const src = parseVideo(p.video_url);
  const img = p.thumbnail_url || p.cover_url || (src && src.kind !== "file" ? src.thumbnail : null);
  // Hover preview only for direct video files, only on devices that truly hover (never on touch).
  const canPreview = src?.kind === "file";

  const enter = () => {
    if (!canPreview || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setHover(true);
  };

  return (
    <Reveal as="article" className={`proj proj--${variant}`}>
      <div style={{ ["--accent" as string]: p.accent_color }}>
        <Link
          href={`${base}/work/${p.slug}`}
          className="proj"
          style={{ ["--accent" as string]: p.accent_color }}
          onPointerEnter={enter}
          onPointerLeave={() => setHover(false)}
          onFocus={enter}
          onBlur={() => setHover(false)}
          aria-label={`${p.title}${p.categories?.name ? `, ${p.categories.name}` : ""}. Open project`}
        >
          <span className="proj__num" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
          <div className="proj__media">
            {img ? (
              <img className="rgb-img" src={img} alt="" loading="lazy" decoding="async" />
            ) : (
              <div className="proj__placeholder"><span>{p.title}</span></div>
            )}
            {hover && src?.kind === "file" && (
              <video
                ref={vref}
                src={src.url}
                muted
                loop
                playsInline
                autoPlay
                preload="none"
                aria-hidden
                tabIndex={-1}
              />
            )}
            {p.is_placeholder && <span className="proj__badge">Placeholder</span>}
            {p.status === "draft" && <span className="proj__badge proj__badge--draft">Draft</span>}
            {src && <span className="proj__play" aria-hidden>▶ Watch</span>}
          </div>
          <div className="proj__meta">
            <div>
              <h3 className="proj__title">{p.title}</h3>
              {p.short_description && <p className="proj__desc">{p.short_description}</p>}
            </div>
            <span className="label proj__cat" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
              {p.categories?.name ?? ""}
              {p.project_date ? <><br />{new Date(p.project_date).getFullYear()}</> : null}
            </span>
          </div>
        </Link>
      </div>
    </Reveal>
  );
}

export function Work({ projects, categories, base = "" }: { projects: Project[]; categories: Category[]; base?: string }) {
  const [filter, setFilter] = useState<string>("all");

  // Only offer categories that actually have projects.
  const used = useMemo(() => {
    const ids = new Set(projects.map((p) => p.category_id));
    return categories.filter((c) => ids.has(c.id));
  }, [projects, categories]);

  const list = useMemo(() => {
    const filtered = filter === "all" ? projects : projects.filter((p) => p.category_id === filter);
    // Featured first, then the admin-defined order.
    return [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order);
  }, [projects, filter]);

  return (
    <section id="work" className="section" aria-labelledby="work-h">
      <div className="wrap">
        <div className="work__head">
          <div>
            <p className="label label--red">02 — Selected Work</p>
            <KineticText as="h2" className="display h-xl" text="SELECTED WORK" />
          </div>
          {used.length > 1 && (
            <div className="filters" role="group" aria-label="Filter projects by category">
              <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
              {used.map((c) => (
                <button key={c.id} className="chip" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {list.length === 0 ? (
          <div className="empty" role="status">
            <p className="display h-md">NOTHING PUBLISHED YET</p>
            <p>Projects you publish in the admin dashboard will appear here automatically.</p>
          </div>
        ) : (
          <div className="work__grid" aria-live="polite">
            {list.map((p, i) => (
              <ProjectCard key={p.id} p={p} index={i} variant={VARIANTS[i % VARIANTS.length]} base={base} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
