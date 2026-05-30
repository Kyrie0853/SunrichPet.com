"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createReview(data: {
  productId: string;
  rating: number;
  content: string;
  images?: string[];
  orderId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { error } = await supabase.from("product_reviews").insert({
    product_id: data.productId,
    user_id: user.id,
    order_id: data.orderId || null,
    rating: data.rating,
    content: data.content,
    images: data.images || [],
  });

  if (error) {
    if (error.code === "23505") return { success: false, message: "您已评价过该商品" };
    return { success: false, message: error.message };
  }

  revalidatePath("/products/" + data.productId);
  return { success: true, message: "评价成功" };
}

export async function getProductReviews(productId: string, options: { filter?: string; page?: number } = {}) {
  const supabase = await createClient();
  const { filter = "all", page = 1 } = options;
  const pageSize = 10;

  let query = supabase
    .from("product_reviews")
    .select("*, profiles:user_id(display_name, avatar_url)", { count: "estimated" })
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (filter === "good") query = query.gte("rating", 4);
  else if (filter === "medium") query = query.eq("rating", 3);
  else if (filter === "bad") query = query.lte("rating", 2);

  query = query.range((page - 1) * pageSize, page * pageSize - 1);
  const { data: reviews, count } = await query;

  const normalized = (reviews || []).map((r: any) => ({
    ...r,
    profile: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
  }));

  return { reviews: normalized, total: count || 0 };
}

export async function getProductRating(productId: string) {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("avg_rating, review_count")
    .eq("id", productId)
    .single();
  return { avg: product?.avg_rating || 0, count: product?.review_count || 0 };
}

export async function deleteReview(reviewId: string, productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/products/" + productId);
  return { success: true, message: "已删除" };
}
