"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadImage(file: File): Promise<string> {
  const supabase = await createClient();

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP、AVIF 格式");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("图片不能超过 5MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`图片上传失败：${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(fileName);

  return publicUrl;
}

export type ProductFormData = {
  name: string;
  category_id: string;
  description: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  image?: File;
};

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "无管理员权限" };
  }

  const name = formData.get("name") as string;
  const category_id = formData.get("category_id") as string;
  const description = (formData.get("description") as string) || "";
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  const status = (formData.get("status") as string) || "active";
  const imageFile = formData.get("image") as File | null;

  if (!name || !category_id || isNaN(price) || isNaN(stock)) {
    return { success: false, message: "请填写所有必填字段" };
  }
  if (price < 0) return { success: false, message: "价格不能为负数" };
  if (stock < 0) return { success: false, message: "库存不能为负数" };

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now().toString(36);

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile);
    } catch (e: unknown) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "图片上传失败",
      };
    }
  }

  const { error } = await supabase.from("products").insert({
    seller_id: user.id,
    category_id,
    name,
    slug,
    description,
    price,
    stock,
    status,
    image_url: imageUrl,
  });

  if (error) {
    return { success: false, message: `创建失败：${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  return { success: true, message: "商品已添加" };
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "无管理员权限" };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const category_id = formData.get("category_id") as string;
  const description = (formData.get("description") as string) || "";
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  const status = (formData.get("status") as string) || "active";
  const imageFile = formData.get("image") as File | null;
  const keepExistingImage = formData.get("keep_existing_image") === "true";

  if (!id || !name || !category_id || isNaN(price) || isNaN(stock)) {
    return { success: false, message: "请填写所有必填字段" };
  }

  const updates: Record<string, string | number | null> = {
    name,
    category_id,
    description,
    price,
    stock,
    status,
    updated_at: new Date().toISOString(),
  };

  if (imageFile && imageFile.size > 0) {
    try {
      updates.image_url = await uploadImage(imageFile);
    } catch (e: unknown) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "图片上传失败",
      };
    }
  } else if (!keepExistingImage) {
    updates.image_url = null;
  }

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, message: `更新失败：${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  return { success: true, message: "商品已更新" };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "无管理员权限" };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { success: false, message: `删除失败：${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  return { success: true, message: "商品已删除" };
}
