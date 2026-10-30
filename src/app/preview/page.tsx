import { getSiteData } from "@/lib/content";
import { Home } from "@/components/public/Home";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPage() {
  await requireAdmin();
  const data = await getSiteData(true);
  return <Home data={data} preview />;
}
