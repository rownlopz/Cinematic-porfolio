import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Authoritative server-side authorization. Call at the top of EVERY admin page, server action
 * and admin API route. Requires: a valid Supabase session, a row in public.admin_users, and
 * (if ADMIN_EMAIL is set) a matching email. Database RLS enforces the same rule independently.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/admin/login");

  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (allowedEmail && user.email?.toLowerCase() !== allowedEmail) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

  const { data: row } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { supabase, user };
}

/** Same check for route handlers: returns null instead of redirecting. */
export async function getAdminOrNull() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (allowedEmail && data.user.email?.toLowerCase() !== allowedEmail) return null;
  const { data: row } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return row ? { supabase, user: data.user } : null;
}
