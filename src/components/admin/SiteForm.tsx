"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings, SocialLink } from "@/lib/types";
import { parseVideo } from "@/lib/video";
import { Tags, Text, UploadField, useToast } from "./ui";

export function SiteForm({ settings }: { settings: SiteSettings }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [v, setV] = useState({
    ...settings,
    portrait_url: settings.portrait_url ?? "",
    hero_bg_url: settings.hero_bg_url ?? "",
    about_image_url: settings.about_image_url ?? "",
    location: settings.location ?? "",
    showreel_url: settings.showreel_url ?? "",
    showreel_poster_url: settings.showreel_poster_url ?? "",
    contact_email: settings.contact_email ?? "",
    seo_title: settings.seo_title ?? "",
    seo_description: settings.seo_description ?? "",
    og_image_url: settings.og_image_url ?? "",
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));
  const reelOk = !v.showreel_url || parseVideo(v.showreel_url) !== null;

  const setSocial = (i: number, patch: Partial<SocialLink>) =>
    set("social_links", v.social_links.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  function submit() {
    setErrors({});
    start(async () => {
      const { id: _id, ...payload } = v;
      void _id;
      const res = await saveSettings(payload);
      if (!res.ok) { setErrors(res.fields ?? {}); toast.show("err", res.error); return; }
      toast.show("ok", "Saved. Your live site is updated.");
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="card">
        <h2>Hero & identity</h2>
        <Text label="Your name (shown huge in the hero)" value={v.display_name} onChange={(x) => set("display_name", x)} error={errors.display_name} />
        <Text label="Headline" value={v.hero_headline} onChange={(x) => set("hero_headline", x)} error={errors.hero_headline} help="Split into two lines at the first full stop, e.g. “EDITING REALITY. DESIGNING THE UNSEEN.”" />
        <Text label="Introduction" value={v.hero_subline} onChange={(x) => set("hero_subline", x)} multiline error={errors.hero_subline} />
        <Tags label="Primary skills (hero strip)" value={v.hero_skills} onChange={(x) => set("hero_skills", x)} />
        <Tags label="Professional roles" value={v.roles} onChange={(x) => set("roles", x)} />
        <UploadField label="Portrait / cutout image" value={v.portrait_url} onChange={(x) => set("portrait_url", x ?? "")} folder="site" help="A PNG/WebP with a transparent or plain background works best." />
        <UploadField label="Hero background texture (optional)" value={v.hero_bg_url} onChange={(x) => set("hero_bg_url", x ?? "")} folder="site" />
      </div>

      <div className="card">
        <h2>About</h2>
        <Text label="Heading" value={v.about_heading} onChange={(x) => set("about_heading", x)} />
        <Text label="Introduction" value={v.about_body} onChange={(x) => set("about_body", x)} multiline error={errors.about_body} />
        <Tags label="Skills list" value={v.about_skills} onChange={(x) => set("about_skills", x)} />
        <Text label="Location (optional)" value={v.location} onChange={(x) => set("location", x)} />
        <UploadField label="About image" value={v.about_image_url} onChange={(x) => set("about_image_url", x ?? "")} folder="site" help="Falls back to your portrait if empty." />
      </div>

      <div className="card">
        <h2>Showreel</h2>
        <Text label="Section title" value={v.showreel_title} onChange={(x) => set("showreel_title", x)} />
        <Text label="Showreel link (YouTube, Vimeo or direct .mp4)" value={v.showreel_url} onChange={(x) => set("showreel_url", x)} placeholder="https://vimeo.com/…" error={errors.showreel_url ?? (!reelOk ? "Not a recognised YouTube/Vimeo/.mp4 link" : undefined)} help="Changing this updates the homepage as soon as you save. Leave empty to show a “coming soon” player." />
        <UploadField label="Custom poster image" value={v.showreel_poster_url} onChange={(x) => set("showreel_poster_url", x ?? "")} folder="site" help="Optional. Otherwise YouTube/Vimeo's own thumbnail is used." />
      </div>

      <div className="card">
        <h2>AI pipeline section</h2>
        <Text label="Title" value={v.ai_title} onChange={(x) => set("ai_title", x)} />
        <Text label="Description" value={v.ai_body} onChange={(x) => set("ai_body", x)} multiline />
        <Tags label="Workflow steps (in order)" value={v.pipeline_steps} onChange={(x) => set("pipeline_steps", x)} help="2–10 steps, comma-separated." />
        <p className="adm__lead" style={{ margin: 0 }}>Tools and project examples are managed under <Link href="/admin/tools" style={{ textDecoration: "underline" }}>AI tools</Link>.</p>
      </div>

      <div className="card">
        <h2>Contact & social</h2>
        <Text label="Contact headline" value={v.contact_headline} onChange={(x) => set("contact_headline", x)} />
        <Text label="Public email address" type="email" value={v.contact_email} onChange={(x) => set("contact_email", x)} error={errors.contact_email} />
        <div className="fld">
          <span className="lbl">Social links (Instagram, YouTube, LinkedIn, anything else)</span>
          {v.social_links.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 8 }}>
              <input className="input" aria-label={`Link ${i + 1} label`} placeholder="Instagram" value={s.label} onChange={(e) => setSocial(i, { label: e.target.value })} />
              <input className="input" aria-label={`Link ${i + 1} URL`} placeholder="https://instagram.com/…" value={s.url} onChange={(e) => setSocial(i, { url: e.target.value })} />
              <button type="button" className="b b--sm b--danger" onClick={() => set("social_links", v.social_links.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          {errors["social_links.0.url"] && <span className="err">{errors["social_links.0.url"]}</span>}
          <div>
            <button type="button" className="b b--sm" disabled={v.social_links.length >= 10} onClick={() => set("social_links", [...v.social_links, { label: "", url: "" }])}>+ Add link</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>SEO & sharing</h2>
        <Text label="Page title" value={v.seo_title} onChange={(x) => set("seo_title", x)} maxLength={70} help="Shown in Google and browser tabs." />
        <Text label="Description" value={v.seo_description} onChange={(x) => set("seo_description", x)} multiline maxLength={200} />
        <UploadField label="Social share image" value={v.og_image_url} onChange={(x) => set("og_image_url", x ?? "")} folder="site" help="1200×630 recommended. Falls back to your portrait." />
      </div>

      <div className="savebar">
        <button type="submit" className="b b--red" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        <Link className="b b--ghost" href="/preview" target="_blank">Preview site ↗</Link>
      </div>
      {toast.node}
    </form>
  );
}
