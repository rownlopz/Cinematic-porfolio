"use client";
import Script from "next/script";
import { useRef, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { KineticText } from "./Reveal";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "error"; message: string };

function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, turnstileToken: payload["cf-turnstile-response"] ?? "" }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string> };
      if (res.ok && json.ok) {
        setStatus({ kind: "ok" });
        formRef.current?.reset();
        return;
      }
      if (json.fields) setErrors(json.fields);
      setStatus({ kind: "error", message: json.error ?? "Something went wrong. Please try again or email me directly." });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  const sending = status.kind === "sending";

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate aria-label="Project inquiry">
      {/* Honeypot: real visitors never see or fill this. */}
      <div className="hp" aria-hidden>
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" required maxLength={120} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "e-name" : undefined} />
        {errors.name && <span id="e-name" className="err">{errors.name}</span>}
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "e-email" : undefined} />
        {errors.email && <span id="e-email" className="err">{errors.email}</span>}
      </div>
      <div className="field">
        <label htmlFor="project_type">Project type</label>
        <select id="project_type" name="project_type" defaultValue="">
          <option value="">Select…</option>
          <option>Video editing</option>
          <option>Motion graphics</option>
          <option>AI video</option>
          <option>Social media content</option>
          <option>Commercial / brand video</option>
          <option>Something else</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="budget">Budget (optional)</label>
        <input id="budget" name="budget" maxLength={80} placeholder="e.g. a range or 'not sure yet'" />
      </div>
      <div className="field">
        <label htmlFor="message">Tell me about your idea</label>
        <textarea id="message" name="message" required minLength={10} maxLength={5000} aria-invalid={!!errors.message} aria-describedby={errors.message ? "e-message" : undefined} />
        {errors.message && <span id="e-message" className="err">{errors.message}</span>}
      </div>

      {TURNSTILE_KEY && <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} data-theme="dark" />}

      <button type="submit" className="btn btn--primary" disabled={sending}>
        {sending ? "Sending…" : "Send inquiry →"}
      </button>

      <div aria-live="polite">
        {status.kind === "ok" && <p className="notice notice--ok">Thanks! Your message was delivered. I&apos;ll get back to you soon.</p>}
        {status.kind === "error" && <p className="notice notice--err" role="alert">{status.message}</p>}
      </div>
    </form>
  );
}

export function Contact({ s }: { s: SiteSettings }) {
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-h">
      {TURNSTILE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />}
      <div className="wrap">
        <p className="label" style={{ color: "#fff" }}>06 — Contact</p>
        <KineticText as="h2" className="display h-xl" text={s.contact_headline} />
        <div className="contact__grid">
          <div>
            {s.contact_email ? (
              <a className="big" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>
            ) : (
              <p className="label" style={{ color: "#fff" }}>Set your email in Admin → Site content</p>
            )}
            {s.social_links.length > 0 && (
              <ul className="socials" aria-label="Social links">
                {s.social_links.map((l) => (
                  <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a></li>
                ))}
              </ul>
            )}
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

export function Footer({ name }: { name: string }) {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} {name}</span>
      <a href="#top">Back to top ↑</a>
    </footer>
  );
}
