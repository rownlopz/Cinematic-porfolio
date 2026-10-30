"use client";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#reel", label: "Reel" },
  { href: "#about", label: "About" },
  { href: "#pipeline", label: "AI Pipeline" },
  { href: "#services", label: "Services" },
  { href: "#contact", label: "Contact" },
];

export function Nav({ name, base = "" }: { name: string; base?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <a href={`${base}#top`} className="nav__logo" aria-label={`${name} — home`}>
        {name.split(" ")[0]}<i>.</i>
      </a>
      <button
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "CLOSE" : "MENU"}
      </button>
      <nav aria-label="Primary">
        <ul id="nav-links" className={`nav__links ${open ? "is-open" : ""}`}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={`${base}${l.href}`} aria-current={active === l.href.slice(1)} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/** Desktop-only custom cursor. Disabled for touch and reduced-motion users via CSS + this guard. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    document.body.classList.add("has-cursor");
    let x = -100, y = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        if (ref.current) ref.current.style.transform = `translate3d(${x - 7}px, ${y - 7}px, 0)`;
      });
      const t = e.target as HTMLElement | null;
      ref.current?.classList.toggle("is-hover", !!t?.closest("a, button, [role=tab], input, select, textarea"));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.body.classList.remove("has-cursor");
    };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden />;
}

/** Short branded intro bar; skipped for reduced motion and repeat visits in the same session. */
export function Loader() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try { seen = sessionStorage.getItem("seen-loader") === "1"; } catch { /* ignore */ }
    if (reduce || seen) return;
    setShow(true);
    try { sessionStorage.setItem("seen-loader", "1"); } catch { /* ignore */ }
    const t = setTimeout(() => setShow(false), 950);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="loader" aria-hidden>
      <div className="loader__bar"><i /></div>
    </div>
  );
}
