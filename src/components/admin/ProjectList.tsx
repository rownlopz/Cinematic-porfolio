"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject, reorderProjects, setProjectFlag } from "@/app/admin/actions";
import type { Project } from "@/lib/types";
import { parseVideo } from "@/lib/video";
import { ConfirmDialog, useToast } from "./ui";

export function ProjectList({ initial }: { initial: Project[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) { toast.show("err", r.error ?? "Failed"); router.refresh(); return; }
      toast.show("ok", okMsg);
      after?.();
      router.refresh();
    });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    run(() => reorderProjects(next.map((p) => p.id)), "Order saved");
  };

  const togglePublish = (p: Project) => {
    const status = p.status === "published" ? "draft" : "published";
    setItems((l) => l.map((x) => (x.id === p.id ? { ...x, status } : x)));
    run(() => setProjectFlag(p.id, "status", status), status === "published" ? "Published — live now" : "Unpublished");
  };
  const toggleFeatured = (p: Project) => {
    setItems((l) => l.map((x) => (x.id === p.id ? { ...x, featured: !p.featured } : x)));
    run(() => setProjectFlag(p.id, "featured", !p.featured), p.featured ? "Removed from featured" : "Marked featured");
  };

  if (items.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <p>No projects yet.</p>
        <Link href="/admin/projects/new" className="b b--red">Add your first project</Link>
      </div>
    );
  }

  return (
    <>
      <p className="adm__lead" style={{ marginBottom: 12 }}>
        Use ↑ ↓ to reorder. The public site shows featured projects first, then this order. Only “Published” projects are visible to visitors.
      </p>
      {items.map((p, i) => {
        const src = parseVideo(p.video_url);
        const thumb = p.thumbnail_url || p.cover_url || (src && src.kind !== "file" ? src.thumbnail : null);
        return (
          <div className="row" key={p.id}>
            <div className="row__thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : "No image"}</div>
            <div>
              <div className="row__title">{p.title}</div>
              <div className="row__meta">
                {p.categories?.name ?? "No category"} · /work/{p.slug}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`tag ${p.status === "published" ? "tag--pub" : "tag--draft"}`}>{p.status}</span>
                {p.featured && <span className="tag tag--feat">featured</span>}
                {p.is_placeholder && <span className="tag">placeholder</span>}
                {!src && <span className="tag">no video</span>}
              </div>
            </div>
            <div className="row__actions">
              <button className="b b--sm" onClick={() => move(i, -1)} disabled={pending || i === 0} aria-label={`Move ${p.title} up`}>↑</button>
              <button className="b b--sm" onClick={() => move(i, 1)} disabled={pending || i === items.length - 1} aria-label={`Move ${p.title} down`}>↓</button>
              <button className="b b--sm" onClick={() => toggleFeatured(p)} disabled={pending}>{p.featured ? "Unfeature" : "Feature"}</button>
              <button className="b b--sm" onClick={() => togglePublish(p)} disabled={pending}>{p.status === "published" ? "Unpublish" : "Publish"}</button>
              <Link className="b b--sm" href={`/admin/projects/${p.id}`}>Edit</Link>
              <button className="b b--sm b--danger" onClick={() => setToDelete(p)} disabled={pending}>Delete</button>
            </div>
          </div>
        );
      })}

      {toDelete && (
        <ConfirmDialog
          title="Delete this project?"
          body={`“${toDelete.title}” will be removed from your site and its uploaded files deleted. This can't be undone.`}
          busy={pending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            const target = toDelete;
            run(() => deleteProject(target.id), "Project deleted", () => {
              setItems((l) => l.filter((x) => x.id !== target.id));
              setToDelete(null);
            });
          }}
        />
      )}
      {toast.node}
    </>
  );
}
