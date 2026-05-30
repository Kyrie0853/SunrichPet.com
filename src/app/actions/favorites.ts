"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleProductFavorite(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { data: existing } = await supabase
    .from("product_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("product_favorites").delete().eq("id", existing.id);
    revalidatePath("/products");
    revalidatePath("/profile");
    return { success: true, favorited: false, message: "已取消收藏" };
  } else {
    const { error } = await supabase.from("product_favorites").insert({
      user_id: user.id,
      product_id: productId,
    });
    if (error) return { success: false, message: error.message };
    revalidatePath("/products");
    revalidatePath("/profile");
    return { success: true, favorited: true, message: "已收藏" };
  }
}

export async function isProductFavorited(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("product_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function getUserProductFavorites(userId: string, page = 1) {
  const supabase = await createClient();
  const pageSize = 20;

  const { data: favs, count } = await supabase
    .from("product_favorites")
    .select("product_id, created_at", { count: "estimated" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (!favs?.length) return { products: [], total: 0 };

  const productIds = favs.map(f => f.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, image_url, status, avg_rating, review_count")
    .in("id", productIds);

  const pMap = new Map((products || []).map(p => [p.id, p]));
  const ordered = favs.map(f => ({
    ...pMap.get(f.product_id),
    favorited_at: f.created_at,
  })).filter(p => p.id);

  return { products: ordered, total: count || 0 };
}
