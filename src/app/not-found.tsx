import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="wrap" style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <p className="label label--red">Error 404</p>
        <h1 className="display h-xl">CUT. NOTHING HERE.</h1>
        <p style={{ margin: "16px 0 32px" }}>That page doesn&apos;t exist, or it hasn&apos;t been published yet.</p>
        <Link href="/" className="btn btn--primary">Back to the portfolio</Link>
      </div>
    </main>
  );
}
