"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_UPLOAD_TYPES,
  exampleSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  slugify,
  testimonialSchema,
  toolSchema,
} from "@/lib/validation";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Record<string, string> };

function fail(error: z.ZodError | string): ActionResult<never> {
  if (typeof error === "string") return { ok: false, error };
  const fields: Record<string, string> = {};
  error.issues.forEach((i) => { fields[i.path.join(".")] ??= i.message; });
  return { ok: false, error: Object.values(fields)[0] ?? "Invalid input", fields };
}

/** Everything public is regenerated immediately after any content change. */
function refreshPublic() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ auth */

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/admin/login?error=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");

  // Authorization check (allow-list + optional ADMIN_EMAIL) happens inside requireAdmin.
  await requireAdmin();
  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ----------------------------------------------------------------- upload */

/**
 * Step 1 of an upload: validate the declared file and mint a one-time signed upload URL.
 * The browser then sends the bytes straight to Supabase Storage (no serverless body-size limit).
 * Storage itself enforces: admin-only writes (RLS), allowed MIME types, and the size limit.
 */
export async function createUploadUrl(input: {
  filename: string;
  type: string;
  size: number;
  folder: "projects" | "site" | "services";
}): Promise<ActionResult<{ path: string; token: string; publicUrl: string }>> {
  const { supabase } = await requireAdmin();
  const rule = ALLOWED_UPLOAD_TYPES[input.type];
  if (!rule) return fail("Unsupported file type. Use JPG, PNG, WebP, AVIF, MP4, WebM or MOV.");
  if (!Number.isFinite(input.size) || input.size <= 0) return fail("Empty file.");
  if (input.size > rule.maxBytes) {
    return fail(`File too large. Max ${Math.round(rule.maxBytes / 1024 / 1024)} MB for ${rule.kind}s. For bigger videos, upload to YouTube/Vimeo and paste the link.`);
  }
  if (!["projects", "site", "services"].includes(input.folder)) return fail("Invalid folder.");

  // Server-chosen random name: never trust the client filename for the storage path.
  const path = `${input.folder}/${randomUUID()}.${rule.ext}`;
  const { data, error } = await supabase.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return fail(error?.message ?? "Could not start upload. Is the 'media' bucket created?");
  const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
  return { ok: true, data: { path, token: data.token, publicUrl: pub.publicUrl } };
}

const MEDIA_MARKER = "/storage/v1/object/public/media/";
function mediaPathFromUrl(url: string | null | undefined) {
  if (!url) return null;
  const i = url.indexOf(MEDIA_MARKER);
  return i === -1 ? null : decodeURIComponent(url.slice(i + MEDIA_MARKER.length).split("?")[0]);
}

/* --------------------------------------------------------------- projects */

async function uniqueSlug(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], title: string) {
  const base = slugify(title);
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await supabase.from("projects").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 6)}`;
}

export async function saveProject(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const values = parsed.data;

  if (id) {
    const { error } = await supabase.from("projects").update(values).eq("id", id);
    if (error) return fail(error.message);
    refreshPublic();
    return { ok: true, data: { id } };
  }

  const slug = await uniqueSlug(supabase, values.title);
  const { data: last } = await supabase.from("projects").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...values, slug, sort_order: (last?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create project");
  refreshPublic();
  return { ok: true, data: { id: data.id } };
}

export async function setProjectFlag(
  id: string,
  flag: "status" | "featured",
  value: "draft" | "published" | boolean,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed =
    flag === "status" ? z.enum(["draft", "published"]).safeParse(value) : z.boolean().safeParse(value);
  if (!parsed.success) return fail("Invalid value");
  const { error } = await supabase.from("projects").update({ [flag]: parsed.data }).eq("id", id);
  if (error) return fail(error.message);
  refreshPublic();
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase.from("projects").select("thumbnail_url,cover_url,video_url,video_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return fail(error.message);

  // Best-effort cleanup of this project's uploaded media.
  if (p) {
    const paths = [mediaPathFromUrl(p.thumbnail_url), mediaPathFromUrl(p.cover_url), mediaPathFromUrl(p.video_url), p.video_path]
      .filter((x): x is string => !!x && x.startsWith("projects/"));
    if (paths.length) await supabase.storage.from("media").remove(paths);
  }
  refreshPublic();
  return { ok: true };
}

export async function reorderProjects(orderedIds: string[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const ids = z.array(z.string().uuid()).max(500).safeParse(orderedIds);
  if (!ids.success) return fail("Invalid order");
  const results = await Promise.all(
    ids.data.map((id, i) => supabase.from("projects").update({ sort_order: i + 1 }).eq("id", id)),
  );
  const bad = results.find((r) => r.error);
  if (bad?.error) return fail(bad.error.message);
  refreshPublic();
  return { ok: true };
}

/* ----------------------------------------------------------- site content */

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1);
  if (error) return fail(error.message);
  refreshPublic();
  return { ok: true };
}

/* ------------------------------------- generic collections (services etc.) */

const TABLES = {
  services: serviceSchema,
  testimonials: testimonialSchema,
  tools: toolSchema,
  pipeline_examples: exampleSchema,
} as const;
export type CollectionTable = keyof typeof TABLES;

function schemaFor(table: string) {
  return (TABLES as Record<string, z.ZodTypeAny>)[table] ?? null;
}

export async function saveItem(table: CollectionTable, id: string | null, input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const schema = schemaFor(table);
  if (!schema) return fail("Unknown collection");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);

  if (id) {
    const { error } = await supabase.from(table).update(parsed.data).eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { data: last } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from(table).insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 });
    if (error) return fail(error.message);
  }
  refreshPublic();
  return { ok: true };
}

export async function deleteItem(table: CollectionTable, id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!schemaFor(table)) return fail("Unknown collection");
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return fail(error.message);
  refreshPublic();
  return { ok: true };
}

export async function reorderItems(table: CollectionTable, orderedIds: string[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!schemaFor(table)) return fail("Unknown collection");
  const ids = z.array(z.string().uuid()).max(200).safeParse(orderedIds);
  if (!ids.success) return fail("Invalid order");
  const results = await Promise.all(ids.data.map((id, i) => supabase.from(table).update({ sort_order: i + 1 }).eq("id", id)));
  const bad = results.find((r) => r.error);
  if (bad?.error) return fail(bad.error.message);
  refreshPublic();
  return { ok: true };
}

/* --------------------------------------------------------------- messages */

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("messages").update({ read }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
