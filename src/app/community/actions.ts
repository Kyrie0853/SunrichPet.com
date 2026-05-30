"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";

const ALLOWED_IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;


export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("请先登录");

  const title = (formData.get("title") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const category = (formData.get("category") as string || "general").trim();
  const tagIds = formData.getAll("tags") as string[];

  if (title.length < 2 || title.length > 200) throw new Error("标题长度 2-200 字");
  if (content.length < 10) throw new Error("内容至少 10 字");

  // XSS 防护
  const cleanContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "span", "div"]),
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });

  // 处理图片上传
  const imageUrls: string[] = [];
  const imageFiles = formData.getAll("images") as File[];

  for (const file of imageFiles.slice(0, MAX_IMAGES)) {
    if (!file || !(file instanceof File) || file.size === 0) continue;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("不支持的图片格式");
    if (file.size > MAX_IMAGE_SIZE) throw new Error("单张图片最大 5MB");

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;

    const { error: uploadError } = await supabase.storage
      .from("community-images")
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error("图片上传失败");

    const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName);
    imageUrls.push(urlData.publicUrl);
  }

  // 创建帖子
  const { data: post, error } = await supabase
    .from("community_posts")
    .insert({ author_id: user.id, title, content: cleanContent, category, images: imageUrls })
    .select("id")
    .single();

  if (error || !post) throw new Error("发帖失败");

  // 关联标签
  if (tagIds.length > 0) {
    await supabase.from("community_post_tags").insert(tagIds.map(tagId => ({ post_id: post.id, tag_id: tagId })));
  }

  revalidatePath("/community");
  revalidatePath("/");
  redirect("/community/post/" + post.id);
}