import { getUserProfile } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import UserProfileTabs from "@/components/community/UserProfileTabs";
import Link from "next/link";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getUserProfile(id);
  if (!profile) notFound();
  return (<div className="mx-auto max-w-4xl px-4 py-10"><Link href="/community" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700">&larr; 返回社区</Link><UserProfileTabs profile={profile} currentUserId={user?.id || null} /></div>);
}