import { createClient as createPublicClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import type {
  Category,
  PipelineExample,
  Project,
  Service,
  SiteSettings,
  Testimonial,
  Tool,
} from "@/lib/types";

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  display_name: "YOUR NAME",
  hero_headline: "EDITING REALITY. DESIGNING THE UNSEEN.",
  hero_subline:
    "Video editing, motion design, and AI-powered visuals built to make ideas impossible to ignore.",
  hero_skills: ["AFTER EFFECTS", "PREMIERE PRO", "AI VIDEO", "MOTION DESIGN"],
  roles: [
    "Video Editor",
    "Motion Graphics Designer",
    "Filmmaker",
    "AI Video Creator",
    "Creative Visual Storyteller",
  ],
  portrait_url: null,
  hero_bg_url: null,
  about_heading: "CREATIVE EDITOR / VISUAL STORYTELLER",
  about_body:
    "I'm a creative editor and visual storyteller working at the intersection of editing, motion design, and AI-powered filmmaking. I turn ideas into visual experiences through rhythm, movement, and creative experimentation.",
  about_skills: [
    "Adobe After Effects",
    "Adobe Premiere Pro",
    "AI-assisted creative production",
    "Motion graphics",
    "Cinematic editing",
    "Visual storytelling",
  ],
  about_image_url: null,
  location: null,
  showreel_url: null,
  showreel_poster_url: null,
  showreel_title: "SHOWREEL",
  ai_title: "THE NEW CREATIVE PIPELINE.",
  ai_body:
    "Conventional editing, motion graphics and generative AI working together: AI helps develop concepts and raw visuals, then editing and motion design give them rhythm, polish and a point of view.",
  pipeline_steps: [
    "IDEA",
    "SCRIPT",
    "VISUAL DEVELOPMENT",
    "AI GENERATION",
    "EDITING",
    "MOTION DESIGN",
    "FINAL DELIVERY",
  ],
  contact_headline: "HAVE AN IDEA? LET'S MAKE IT IMPOSSIBLE TO IGNORE.",
  contact_email: null,
  social_links: [],
  seo_title: null,
  seo_description: null,
  og_image_url: null,
};

export interface SiteData {
  configured: boolean;
  error: string | null;
  settings: SiteSettings;
  categories: Category[];
  projects: Project[];
  services: Service[];
  testimonials: Testimonial[];
  tools: Tool[];
  examples: PipelineExample[];
}

const EMPTY: SiteData = {
  configured: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  categories: [],
  projects: [],
  services: [],
  testimonials: [],
  tools: [],
  examples: [],
};

function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createPublicClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Loads everything the public page needs.
 * - preview=false: cookie-less anon client; RLS only returns published/visible rows. Pages using
 *   this are cached and re-generated instantly when the admin saves (revalidatePath).
 * - preview=true: uses the admin's session cookie so RLS also returns drafts.
 */
export async function getSiteData(preview = false): Promise<SiteData> {
  const supabase = preview ? await createCookieClient() : publicClient();
  if (!supabase) return EMPTY;

  try {
    const [settings, categories, projects, services, testimonials, tools, examples] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("projects")
        .select("*, categories(name, slug)")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("services").select("*").eq("visible", true).order("sort_order"),
      supabase.from("testimonials").select("*").eq("visible", true).order("sort_order"),
      supabase.from("tools").select("*").eq("visible", true).order("sort_order"),
      supabase.from("pipeline_examples").select("*").eq("visible", true).order("sort_order"),
    ]);

    const firstError = [settings, categories, projects, services, testimonials, tools, examples].find(
      (r) => r.error,
    )?.error;
    if (firstError) {
      return { ...EMPTY, configured: true, error: firstError.message };
    }

    let list = (projects.data ?? []) as Project[];
    if (!preview) list = list.filter((p) => p.status === "published");

    return {
      configured: true,
      error: null,
      settings: { ...DEFAULT_SETTINGS, ...(settings.data ?? {}) } as SiteSettings,
      categories: (categories.data ?? []) as Category[],
      projects: list,
      services: (services.data ?? []) as Service[],
      testimonials: (testimonials.data ?? []) as Testimonial[],
      tools: (tools.data ?? []) as Tool[],
      examples: (examples.data ?? []) as PipelineExample[],
    };
  } catch (e) {
    return { ...EMPTY, configured: true, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getProjectBySlug(slug: string, preview = false) {
  const data = await getSiteData(preview);
  const index = data.projects.findIndex((p) => p.slug === slug);
  if (index === -1) return { data, project: null, next: null as Project | null };
  const project = data.projects[index];
  const next = data.projects[(index + 1) % data.projects.length];
  return { data, project, next: next.id === project.id ? null : next };
}
