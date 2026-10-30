import { getSiteData } from "@/lib/content";
import { Home } from "@/components/public/Home";

// Cached, then re-generated immediately whenever the admin saves (revalidatePath in server actions).
export const revalidate = 3600;

export default async function Page() {
  const data = await getSiteData(false);
  return <Home data={data} />;
}
