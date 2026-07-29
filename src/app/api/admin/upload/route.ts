import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "缺少文件" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error: uploadErr } = await supabase.storage
      .from("public")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadErr) {
      console.error("[Upload] 上传失败:", uploadErr);
      return NextResponse.json({ error: "上传失败: " + uploadErr.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("public").getPublicUrl(fileName);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    console.error("[Upload] 错误:", err);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
