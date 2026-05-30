import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/");
  return (<div className="mx-auto max-w-2xl px-4 py-10"><h1 className="mb-8 text-3xl font-bold text-gray-900">编辑资料</h1><EditProfileForm profile={profile} /></div>);
}