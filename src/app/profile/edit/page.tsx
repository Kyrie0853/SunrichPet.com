import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditProfileForm from "@/components/EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  let profile: any = null;
  try {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = p;
  } catch { /* ignore */ }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-5xl mb-4">😥</p>
          <p className="text-[16px] font-medium text-amber-700 mb-2">未找到用户资料</p>
          <p className="text-[13px] text-amber-600 mb-4">
            您的 profiles 记录缺失，无法编辑。请在 Supabase SQL Editor 中执行
            <code className="mx-1 rounded bg-amber-100 px-1 text-[12px]">docs/fix-profiles-missing.sql</code>
          </p>
          <Link href="/profile" className="inline-block rounded-xl bg-[#1a7f5a] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] transition-colors">
            返回个人信息
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">编辑资料</h1>
      <EditProfileForm profile={profile} />
    </div>
  );
}