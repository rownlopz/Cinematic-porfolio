"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { SiteSettings } from "@/lib/types";

export function Hero({ s, hasReel }: { s: SiteSettings; hasReel: boolean }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLElement>(null);

  // Pointer + scroll parallax. Writes CSS variables only (no React re-renders), rAF-throttled.
  useEffect(() => {
    if (reduce || !root.current) return;
    const el = root.current;
    let px = 0, py = 0, sy = 0, raf = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--px", px.toFixed(3));
      el.style.setProperty("--py", py.toFixed(3));
      el.style.setProperty("--sy", sy.toFixed(1));
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth - 0.5) * 2;
      py = (e.clientY / window.innerHeight - 0.5) * 2;
      queue();
    };
    const onScroll = () => { sy = Math.min(window.scrollY, 900); queue(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const [first, ...rest] = s.hero_headline.split(/(?<=\.)\s+/);
  const nameWord = s.display_name.split(" ")[0];

  return (
    <section
      id="top"
      ref={root}
      className="hero fx-scanlines"
      style={{ ["--px" as string]: 0, ["--py" as string]: 0, ["--sy" as string]: 0 }}
      aria-label="Introduction"
    >
      <div className="hero__bg" aria-hidden>
        {s.hero_bg_url && <img src={s.hero_bg_url} alt="" decoding="async" fetchPriority="low" />}
        <div className="fx-halftone" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      </div>

      {/* Editing-timeline motif */}
      <svg className="hero__timeline" aria-hidden viewBox="0 0 1440 900" preserveAspectRatio="none"
        style={{ transform: "translateY(calc(var(--sy) * -0.08px))" }}>
        {[120, 200, 280].map((y, row) => (
          <g key={y} stroke="#2c2c2c" fill="none" strokeWidth="1.5">
            <line x1="0" x2="1440" y1={y + 700 - 300} y2={y + 700 - 300} />
            {Array.from({ length: 5 }).map((_, i) => {
              const x = ((i * 337 + row * 191) % 1300) + 20;
              const w = 120 + ((i * 97 + row * 53) % 220);
              return <rect key={i} x={x} y={y + 700 - 330} width={w} height="28" fill={i % 3 === 0 ? "rgba(225,6,0,0.35)" : "none"} />;
            })}
          </g>
        ))}
        <line x1="900" x2="900" y1="360" y2="900" stroke="#e10600" strokeWidth="2" />
        <polygon points="888,360 912,360 900,380" fill="#e10600" />
      </svg>

      <div
        className="hero__name"
        aria-hidden
        style={{ transform: "translate3d(calc(var(--px) * -18px), calc(var(--sy) * 0.18px + var(--py) * -8px), 0)" }}
      >
        {nameWord}
      </div>

      {hasReel && (
        <a className="hero__reel" href="#reel" aria-label="Jump to showreel">
          <span className="rec" aria-hidden /> Showreel
        </a>
      )}

      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero__grid">
          <div className="hero__copy">
            <p className="label label--red">{s.roles.slice(0, 3).join(" / ")}</p>
            <h1 className="display hero__headline">
              <span className="rgb is-glitching" data-text={first}>{first}</span>
              {rest.length > 0 && (
                <>
                  <br />
                  <span className="mark">{rest.join(" ")}</span>
                </>
              )}
            </h1>
            <p className="hero__sub">{s.hero_subline}</p>
            <div className="hero__cta">
              <a href="#work" className="btn btn--primary">Explore My Work ↓</a>
              <a href="#contact" className="btn">Let&apos;s Work Together</a>
            </div>
          </div>

          <div className="hero__portrait">
            <div
              className="portrait"
              style={{ transform: "translate3d(calc(var(--px) * 14px), calc(var(--sy) * -0.06px + var(--py) * 8px), 0)" }}
            >
              <div className="portrait__outline" aria-hidden
                style={{ transform: "translate(calc(18px + var(--px) * 10px), calc(18px + var(--py) * 8px)) rotate(1.5deg)" }} />
              <div className="portrait__frame">
                {s.portrait_url ? (
                  <img src={s.portrait_url} alt={`Portrait of ${s.display_name}`} decoding="async" fetchPriority="high" />
                ) : (
                  <div className="portrait__placeholder fx-halftone">
                    <div>
                      <p className="display" style={{ fontSize: 40 }}>PORTRAIT<br />PLACEHOLDER</p>
                      <p className="label" style={{ marginTop: 12 }}>Upload yours in Admin → Site content</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="sticker" style={{ left: "-2%", bottom: "10%" }} aria-hidden>REC ● 00:00:24:12</span>
          </div>
        </div>

        <div className="hero__skills" aria-label="Primary skills">
          {s.hero_skills.map((k) => <span key={k}>{k}</span>)}
        </div>
      </div>
    </section>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee__track">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="marquee__item">{t} <span style={{ opacity: 0.5 }}>✦</span></span>
        ))}
      </div>
    </div>
  );
}
