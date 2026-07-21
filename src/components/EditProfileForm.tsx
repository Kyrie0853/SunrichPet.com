"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

export default function EditProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState<string|null>(profile.avatar_url);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (displayName.trim() && (displayName.trim().length < 2 || displayName.trim().length > 20)) { setError("昵称长度 2-20 个字符"); return; }
    if (bio.length > 200) { setError("个人签名最多 200 字"); return; }
    setSubmitting(true);
    const updates: any = {};
    if (displayName.trim()) updates.display_name = displayName.trim();
    updates.bio = bio.trim();
    if (avatarUrl) updates.avatar_url = avatarUrl;
    const { error: updateErr } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    if (updateErr) { setError("保存失败: " + updateErr.message); setSubmitting(false); return; }
    setSuccess(true);
    setSubmitting(false);
    router.refresh();
    setTimeout(() => router.push("/profile"), 800);
  }

  return (<form onSubmit={handleSubmit} className="space-y-6">
    {/* 头像 */}
    <div className="flex flex-col items-center gap-3">
      <Avatar userId={profile.id} avatarUrl={avatarUrl} displayName={displayName||profile.display_name} size={96} editable={true} onAvatarChange={setAvatarUrl} />
      <p className="text-xs text-gray-400">点击头像更换照片（≤2MB）</p>
    </div>

    {/* 昵称 */}
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">昵称</label>
      <input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="给自己起个昵称" maxLength={20} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500" />
      <p className="mt-1 text-xs text-gray-400">{displayName.length}/20（2-20 个字符）</p>
    </div>

    {/* 个人签名 */}
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">个人签名</label>
      <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="介绍一下自己..." maxLength={200} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500" />
      <p className="mt-1 text-xs text-gray-400">{bio.length}/200</p>
    </div>

    {/* 消息 */}
    {error && (<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>)}
    {success && (<div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">保存成功，正在跳转...</div>)}

    {/* 按钮 */}
    <div className="flex gap-3">
      <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{submitting?"保存中...":"保存修改"}</button>
      <button type="button" onClick={()=>router.back()} className="rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-50">取消</button>
    </div>
  </form>);
}