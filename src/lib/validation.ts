import { z } from "zod";
import { isSupportedVideoUrl } from "@/lib/video";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #e10600");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

/** http(s) URL, or a path inside our own media bucket (already a full https URL). */
const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a valid https:// URL");

const optionalUrl = z
  .union([z.literal(""), httpsUrl])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optionalVideoUrl = z
  .union([z.literal(""), httpsUrl.refine(isSupportedVideoUrl, "Use a YouTube or Vimeo link, or a direct https .mp4/.webm/.mov link")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "project";

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  short_description: z.string().trim().max(400).default(""),
  creative_approach: z.string().trim().max(4000).default(""),
  category_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  thumbnail_url: optionalUrl,
  cover_url: optionalUrl,
  video_url: optionalVideoUrl,
  video_path: optionalText(512),
  tools: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  project_date: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  featured: z.boolean().default(false),
  accent_color: hex.default("#e10600"),
  is_placeholder: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const settingsSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  hero_headline: z.string().trim().min(1).max(160),
  hero_subline: z.string().trim().max(400),
  hero_skills: z.array(z.string().trim().min(1).max(40)).max(8),
  roles: z.array(z.string().trim().min(1).max(60)).max(10),
  portrait_url: optionalUrl,
  hero_bg_url: optionalUrl,
  about_heading: z.string().trim().max(120),
  about_body: z.string().trim().max(2000),
  about_skills: z.array(z.string().trim().min(1).max(80)).max(12),
  about_image_url: optionalUrl,
  location: optionalText(80),
  showreel_url: optionalVideoUrl,
  showreel_poster_url: optionalUrl,
  showreel_title: z.string().trim().max(60),
  ai_title: z.string().trim().max(120),
  ai_body: z.string().trim().max(1500),
  pipeline_steps: z.array(z.string().trim().min(1).max(40)).min(2).max(10),
  contact_headline: z.string().trim().max(160),
  contact_email: z
    .union([z.literal(""), z.string().email()])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  social_links: z
    .array(z.object({ label: z.string().trim().min(1).max(40), url: httpsUrl }))
    .max(10),
  seo_title: optionalText(70),
  seo_description: optionalText(200),
  og_image_url: optionalUrl,
});

export const serviceSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(""),
  thumbnail_url: optionalUrl,
  accent_color: hex.default("#e10600"),
  visible: z.boolean().default(true),
});

export const testimonialSchema = z.object({
  quote: z.string().trim().min(1).max(600),
  author: z.string().trim().min(1).max(80),
  role: optionalText(80),
  visible: z.boolean().default(true),
});

export const toolSchema = z.object({
  name: z.string().trim().min(1).max(60),
  role_description: z.string().trim().max(240).default(""),
  kind: z.enum(["ai", "software"]).default("ai"),
  visible: z.boolean().default(true),
});

export const exampleSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).default(""),
  tools: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  project_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  visible: z.boolean().default(true),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(254),
  project_type: z.string().trim().max(80).optional().default(""),
  budget: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(10, "Tell me a little more (10+ characters)").max(5000),
  website: z.string().max(0).optional().default(""), // honeypot: must stay empty
  turnstileToken: z.string().optional().default(""),
});

export const ALLOWED_UPLOAD_TYPES: Record<string, { kind: "image" | "video"; ext: string; maxBytes: number }> = {
  "image/jpeg": { kind: "image", ext: "jpg", maxBytes: 8 * 1024 * 1024 },
  "image/png": { kind: "image", ext: "png", maxBytes: 8 * 1024 * 1024 },
  "image/webp": { kind: "image", ext: "webp", maxBytes: 8 * 1024 * 1024 },
  "image/avif": { kind: "image", ext: "avif", maxBytes: 8 * 1024 * 1024 },
  "video/mp4": { kind: "video", ext: "mp4", maxBytes: 50 * 1024 * 1024 },
  "video/webm": { kind: "video", ext: "webm", maxBytes: 50 * 1024 * 1024 },
  "video/quicktime": { kind: "video", ext: "mov", maxBytes: 50 * 1024 * 1024 },
};
