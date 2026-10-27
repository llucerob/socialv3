import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/dal";
import { getHomeRoute } from "@/lib/dashboard/nav";

export default async function Home() {
  const profile = await getProfile();
  redirect(getHomeRoute(profile.roles));
}
