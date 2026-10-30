export type PublishStatus = "draft" | "published";

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  id: number;
  display_name: string;
  hero_headline: string;
  hero_subline: string;
  hero_skills: string[];
  roles: string[];
  portrait_url: string | null;
  hero_bg_url: string | null;
  about_heading: string;
  about_body: string;
  about_skills: string[];
  about_image_url: string | null;
  location: string | null;
  showreel_url: string | null;
  showreel_poster_url: string | null;
  showreel_title: string;
  ai_title: string;
  ai_body: string;
  pipeline_steps: string[];
  contact_headline: string;
  contact_email: string | null;
  social_links: SocialLink[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  creative_approach: string;
  category_id: string | null;
  thumbnail_url: string | null;
  cover_url: string | null;
  video_url: string | null;
  video_path: string | null;
  tools: string[];
  project_date: string | null;
  featured: boolean;
  accent_color: string;
  is_placeholder: boolean;
  status: PublishStatus;
  sort_order: number;
  categories?: { name: string; slug: string } | null;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  accent_color: string;
  visible: boolean;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  visible: boolean;
  sort_order: number;
}

export interface Tool {
  id: string;
  name: string;
  role_description: string;
  kind: "ai" | "software";
  visible: boolean;
  sort_order: number;
}

export interface PipelineExample {
  id: string;
  title: string;
  description: string;
  tools: string[];
  project_id: string | null;
  visible: boolean;
  sort_order: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  project_type: string | null;
  budget: string | null;
  message: string;
  read: boolean;
  created_at: string;
}
