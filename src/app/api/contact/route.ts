import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_PER_HOUR = 5;

function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // captcha not configured: honeypot + rate limit still apply
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean };
  return json.success === true;
}

async function notifyByEmail(m: { name: string; email: string; project_type: string; budget: string; message: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: m.email,
        subject: `New inquiry from ${m.name}`,
        text: `Name: ${m.name}\nEmail: ${m.email}\nType: ${m.project_type || "-"}\nBudget: ${m.budget || "-"}\n\n${m.message}`,
      }),
    });
  } catch {
    /* The message is already stored; a failed notification must not fail the request. */
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Cheap size guard before parsing further.
  if (JSON.stringify(body).length > 20_000) {
    return NextResponse.json({ ok: false, error: "Message too large." }, { status: 413 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    // A filled honeypot lands here too; answer like a success so bots learn nothing.
    const hpFilled = typeof (body as { website?: unknown })?.website === "string" && (body as { website: string }).website.length > 0;
    if (hpFilled) return NextResponse.json({ ok: true });
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach((i) => { fields[String(i.path[0])] ??= i.message; });
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", fields }, { status: 400 });
  }
  const m = parsed.data;
  const ip = clientIp(req);

  if (!(await verifyTurnstile(m.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "Spam check failed. Please reload and try again." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "The contact form isn't configured yet. Please email me directly." },
      { status: 503 },
    );
  }

  const ipHash = createHash("sha256").update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12) ?? ""}`).digest("hex");

  // Database-backed rate limit (works across serverless instances).
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json({ ok: false, error: "Too many messages from your network. Please try again later." }, { status: 429 });
  }

  const { error } = await supabase.from("messages").insert({
    name: m.name,
    email: m.email,
    project_type: m.project_type || null,
    budget: m.budget || null,
    message: m.message,
    ip_hash: ipHash,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: "Couldn't save your message. Please try again or email me directly." }, { status: 500 });
  }

  await notifyByEmail(m);
  return NextResponse.json({ ok: true });
}
