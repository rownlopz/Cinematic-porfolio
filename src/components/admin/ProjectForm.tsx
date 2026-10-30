"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProject } from "@/app/admin/actions";
import type { Category, Project } from "@/lib/types";
import { parseVideo } from "@/lib/video";
import { Check, Tags, Text, UploadField, useToast } from "./ui";

const SUGGESTED_TOOLS = ["After Effects", "Premiere Pro", "Claude AI", "Google Gemini", "Google Flow", "DaVinci Resolve"];

export function ProjectForm({ project, categories }: { project: Project | null; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [v, setV] = useState({
    title: project?.title ?? "",
    short_description: project?.short_description ?? "",
    creative_approach: project?.creative_approach ?? "",
    category_id: project?.category_id ?? "",
    thumbnail_url: project?.thumbnail_url ?? "",
    cover_url: project?.cover_url ?? "",
    video_url: project?.video_url ?? "",
    video_path: project?.video_path ?? "",
    tools: project?.tools ?? [],
    project_date: project?.project_date ?? "",
    featured: project?.featured ?? false,
    accent_color: project?.accent_color ?? "#e10600",
    is_placeholder: project?.is_placeholder ?? false,
    status: (project?.status ?? "draft") as "draft" | "published",
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));
  const videoOk = !v.video_url || parseVideo(v.video_url) !== null;

  function submit(status: "draft" | "published") {
    setErrors({});
    start(async () => {
      const res = await saveProject(project?.id ?? null, { ...v, status });
      if (!res.ok) {
        setErrors(res.fields ?? {});
        toast.show("err", res.error);
        return;
      }
      set("status", status);
      toast.show("ok", status === "published" ? "Published. It's live on your site now." : "Saved as draft.");
      if (!project) router.replace(`/admin/projects/${res.data!.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(v.status); }}>
      <div className="card">
        <h2>Basics</h2>
        <Text label="Project title *" value={v.title} onChange={(x) => set("title", x)} error={errors.title} maxLength={140} />
        <Text label="Short description" value={v.short_description} onChange={(x) => set("short_description", x)} multiline maxLength={400} help="Shown on the project card. Max 400 characters." error={errors.short_description} />
        <div className="grid2">
          <div className="fld">
            <label htmlFor="cat">Category</label>
            <select id="cat" value={v.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Text label="Project date" type="date" value={v.project_date} onChange={(x) => set("project_date", x)} />
        </div>
        <Tags label="Software & tools used" value={v.tools} onChange={(x) => set("tools", x)} placeholder={SUGGESTED_TOOLS.slice(0, 3).join(", ")} help={`Comma-separated. Ideas: ${SUGGESTED_TOOLS.join(", ")}`} />
      </div>

      <div className="card">
        <h2>Media</h2>
        <UploadField label="Thumbnail image" value={v.thumbnail_url} onChange={(x) => set("thumbnail_url", x ?? "")} folder="projects" help="Shown on the project card. 16:9 or 4:5 works best. JPG/PNG/WebP/AVIF, up to 8 MB." />
        <UploadField label="Cover image (optional)" value={v.cover_url} onChange={(x) => set("cover_url", x ?? "")} folder="projects" help="Used as the video poster and social-share image on the project page." />
        <Text label="Video link (YouTube or Vimeo)" value={v.video_url} onChange={(x) => set("video_url", x)} placeholder="https://www.youtube.com/watch?v=…" error={errors.video_url ?? (!videoOk ? "Not a recognised YouTube/Vimeo/.mp4 link" : undefined)} help="Best for long or high-quality videos. Or upload a file below (max 50 MB on the free Supabase plan)." />
        <UploadField label="…or upload a video file" kind="video" value={v.video_path ? v.video_url : null} onChange={(x) => { set("video_url", x ?? ""); }} onPathChange={(p) => set("video_path", p ?? "")} folder="projects" help="MP4 / WebM / MOV, up to 50 MB. Uploading replaces the link above." />
      </div>

      <div className="card">
        <h2>Story</h2>
        <Text label="Creative approach" value={v.creative_approach} onChange={(x) => set("creative_approach", x)} multiline maxLength={4000} help="What was the idea, and how did you make it? Shown on the project page." />
      </div>

      <div className="card">
        <h2>Presentation</h2>
        <div className="grid2">
          <div className="fld">
            <label htmlFor="accent">Accent colour</label>
            <input id="accent" type="color" value={v.accent_color} onChange={(e) => set("accent_color", e.target.value)} style={{ width: 80, height: 40, background: "none", border: "1px solid var(--line)" }} />
            <small>Used for the project number, hover outline and tags.</small>
          </div>
          <div>
            <Check label="Featured (shown first)" checked={v.featured} onChange={(x) => set("featured", x)} />
            <Check label="Mark as placeholder" checked={v.is_placeholder} onChange={(x) => set("is_placeholder", x)} help="Shows a clear “Placeholder” label so sample entries are never mistaken for real work." />
          </div>
        </div>
      </div>

      <div className="savebar">
        <button type="button" className="b b--red" disabled={pending || !v.title.trim()} onClick={() => submit("published")}>
          {pending ? "Saving…" : v.status === "published" ? "Save & keep published" : "Publish"}
        </button>
        <button type="button" className="b" disabled={pending || !v.title.trim()} onClick={() => submit("draft")}>
          {v.status === "published" ? "Unpublish (save as draft)" : "Save draft"}
        </button>
        {project && (
          <Link className="b b--ghost" href={`/preview/work/${project.slug}`} target="_blank">Preview ↗</Link>
        )}
        <Link className="b b--ghost" href="/admin/projects">Back to projects</Link>
        <span className="tag" aria-live="polite">{v.status === "published" ? "Currently published" : "Currently draft"}</span>
      </div>
      {toast.node}
    </form>
  );
}
