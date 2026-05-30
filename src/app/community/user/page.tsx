import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CommunityUserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  redirect("/community/user/" + user.id);
}
