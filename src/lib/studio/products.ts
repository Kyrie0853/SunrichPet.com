import { createClient } from "@/lib/supabase/server";

export interface StudioProduct {
  id: string;
  product_id: string;
  name: string;
  species: string;
  morph: string | null;
  birth_date: string | null;
  current_weight: string | null;
  personality_tags: string[];
  estimated_ship_date: string | null;
  price: number;
  status: 'presale' | 'available' | 'sold';
  images: string[];
  video_url: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  presale: { label: "预售中", color: "bg-orange-50 text-orange-600 border-orange-200" },
  available: { label: "可发货", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  sold: { label: "已售出", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

export async function getAvailableProducts(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_products")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []) as StudioProduct[];
}

export async function getProductsByStatus(
  status?: string,
  species?: string,
  morph?: string,
  minPrice?: string,
  maxPrice?: string
) {
  const supabase = await createClient();
  let query = supabase.from("studio_products").select("*");

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (species && species !== "all") {
    query = query.eq("species", species);
  }
  if (morph && morph !== "all") {
    query = query.eq("morph", morph);
  }
  if (minPrice) {
    query = query.gte("price", parseFloat(minPrice));
  }
  if (maxPrice) {
    query = query.lte("price", parseFloat(maxPrice));
  }

  // 排序：非已售出的在前，按创建时间倒序
  const { data } = await query.order("created_at", { ascending: false });

  // 把已售出的排到最后
  const products = (data || []) as StudioProduct[];
  const active = products.filter(p => p.status !== "sold");
  const sold = products.filter(p => p.status === "sold");
  return [...active, ...sold];
}

export async function getAllSpecies() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_products")
    .select("species");

  const species = [...new Set((data || []).map((d: any) => d.species))];
  return species.filter(Boolean);
}

export interface SpeciesCategory {
  species: string;
  count: number;
  firstImage: string | null;
}

export async function getSpeciesCategories(): Promise<SpeciesCategory[]> {
  const supabase = await createClient();

  try {
    // 优先从 product_categories 分类表获取
    const { data: cats, error: catErr } = await supabase
      .from("product_categories")
      .select("*")
      .is("parent_id", null)
      .order("name");

    if (!catErr && cats && cats.length > 0) {
      // 按顶级分类聚合在售商品
      const { data: allChildren } = await supabase
        .from("product_categories")
        .select("id, parent_id")
        .not("parent_id", "is", null)
        .throwOnError();

      const childIdsByParent = new Map<string, string[]>();
      (allChildren || []).forEach((c: any) => {
        if (!childIdsByParent.has(c.parent_id)) childIdsByParent.set(c.parent_id, []);
        childIdsByParent.get(c.parent_id)!.push(c.id);
      });

      const result: SpeciesCategory[] = [];
      for (const cat of cats) {
        const childIds = childIdsByParent.get(cat.id) || [];
        const allIds = [cat.id, ...childIds];

        const { data: products } = await supabase
          .from("studio_products")
          .select("images, status, category_id")
          .in("status", ["available", "presale"])
          .in("category_id", allIds);

        const active = (products || []).filter((p: any) => allIds.includes(p.category_id));
        const firstImg = active.find((p: any) => p.images?.length > 0)?.images?.[0] || null;

        result.push({ species: cat.name, count: active.length, firstImage: firstImg });
      }
      if (result.some(c => c.count > 0)) return result;
    }

    // 回退方案：直接从 products species 字段聚合
    const { data: fallback } = await supabase
      .from("studio_products")
      .select("species, images, status")
      .in("status", ["available", "presale"]);

    const speciesMap = new Map<string, { count: number; firstImage: string | null }>();
    (fallback || []).forEach((p: any) => {
      const existing = speciesMap.get(p.species);
      if (existing) {
        existing.count++;
        if (!existing.firstImage && p.images?.length > 0) existing.firstImage = p.images[0];
      } else {
        speciesMap.set(p.species, { count: 1, firstImage: p.images?.length > 0 ? p.images[0] : null });
      }
    });

    const fallbackResult = Array.from(speciesMap.entries()).map(([species, info]) => ({
      species, count: info.count, firstImage: info.firstImage,
    }));
    if (fallbackResult.length > 0) return fallbackResult;
  } catch (err) {
    console.error("getSpeciesCategories error:", err);
    // 继续往下走，返回占位分类
  }

  // 最终兜底：返回硬编码的占位分类（数据库无数据时保证首页不空白）
  return [
    { species: "守宫", count: 0, firstImage: null },
    { species: "蛇类", count: 0, firstImage: null },
  ];
}

export async function getAllMorphs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_products")
    .select("morph");

  const morphs = [...new Set((data || []).map((d: any) => d.morph))];
  return morphs.filter(Boolean);
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_products")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as StudioProduct;
}

export async function getProductByProductId(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_products")
    .select("*")
    .eq("product_id", productId)
    .single();
  if (error || !data) return null;
  return data as StudioProduct;
}

export async function createProduct(data: Partial<StudioProduct>) {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("studio_products")
    .insert(data)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return result;
}

export async function updateProduct(id: string, data: Partial<StudioProduct>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("studio_products")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("studio_products")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
