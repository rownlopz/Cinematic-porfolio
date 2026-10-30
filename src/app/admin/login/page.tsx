import "../admin.css";
import { signInAction } from "../actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  invalid: "Incorrect email or password.",
  forbidden: "This account isn't allowed to access the dashboard.",
  "not-admin": "This account isn't on the admin allow-list yet. See README step 3.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <main id="main" className="login">
      <form className="login__box" action={signInAction}>
        <p className="label label--red">Private area</p>
        <h1 className="adm__h1" style={{ marginTop: 8 }}>Dashboard sign in</h1>
        {!configured && <p className="notice notice--err" role="alert">Supabase isn&apos;t configured. Copy .env.example to .env.local and fill it in.</p>}
        {error && MESSAGES[error] && <p className="notice notice--err" role="alert" style={{ marginBottom: 12 }}>{MESSAGES[error]}</p>}
        <div className="fld">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" autoComplete="username" required style={{ background: "#0a0a0a", border: "1px solid var(--line)", padding: 10, color: "var(--paper)" }} />
        </div>
        <div className="fld">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" autoComplete="current-password" required style={{ background: "#0a0a0a", border: "1px solid var(--line)", padding: 10, color: "var(--paper)" }} />
        </div>
        <button className="b b--red" type="submit" disabled={!configured} style={{ width: "100%", justifyContent: "center" }}>Sign in</button>
      </form>
    </main>
  );
}
