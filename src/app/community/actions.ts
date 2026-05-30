"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("请先登录");

  const displayName = (formData.get("display_name") as string || "").trim();
  const bio = (formData.get("bio") as string || "").trim();
  const avatarUrl = (formData.get("avatar_url") as string || "").trim();

  if (displayName && (displayName.length < 2 || displayName.length > 20)) throw new Error("昵称长度 2-20 个字符");
  if (bio.length > 200) throw new Error("个人签名最多 200 字");

  const updates: Record<string, string> = {};
  if (displayName) updates.display_name = sanitizeHtml(displayName, { allowedTags: [], allowedAttributes: {} });
  updates.bio = sanitizeHtml(bio, { allowedTags: [], allowedAttributes: {} });
  if (avatarUrl) updates.avatar_url = avatarUrl;

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) throw new Error("保存失败: " + error.message);

  revalidatePath("/community/user/" + user.id);
  revalidatePath("/");
  redirect("/community/user/" + user.id);
}
