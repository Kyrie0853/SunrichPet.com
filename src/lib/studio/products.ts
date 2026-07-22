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
  maxPrice?: string,
  category?: string,
  subcategory?: string
) {
  const supabase = await createClient();
  console.log("[getProductsByStatus] called with:", { status, species, morph, minPrice, maxPrice, category, subcategory });

  try {
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

  // 两级分类筛选
  if (category || subcategory) {
    // 先查出目标分类的 ID
    const targetSlug = subcategory || category;
    const { data: catData } = await supabase
      .from("product_categories")
      .select("id, parent_id")
      .eq("slug", targetSlug)
      .maybeSingle();

    if (catData) {
      let categoryIds: string[] = [catData.id];

      // 如果选的是顶级分类，包含所有子分类
      if (category && !subcategory) {
        const { data: children } = await supabase
          .from("product_categories")
          .select("id")
          .eq("parent_id", catData.id);
        if (children) {
          categoryIds = [catData.id, ...children.map(c => c.id)];
        }
      }

      query = query.in("category_id", categoryIds);
    } else {
      // 分类不存在，返回空
      query = query.eq("category_id", "nonexistent");
    }
  }

  const { data } = await query.order("created_at", { ascending: false });

    const products = (data || []) as StudioProduct[];
    const active = products.filter(p => p.status !== "sold");
    const sold = products.filter(p => p.status === "sold");
    return [...active, ...sold];
  } catch (err: any) {
    console.error("[getProductsByStatus] ERROR:", err?.message, err?.code, err?.stack);
    throw new Error(`getProductsByStatus failed: ${err?.message || err}`);
  }
}

// 获取子分类列表
export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export async function getSubcategories(parentSlug: string): Promise<Subcategory[]> {
  const supabase = await createClient();
  console.log("[getSubcategories] called with parentSlug:", parentSlug);
  try {
    const { data: parent } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", parentSlug)
      .maybeSingle();

    if (!parent) { console.log("[getSubcategories] parent not found for slug:", parentSlug); return []; }

    const { data } = await supabase
      .from("product_categories")
      .select("id, name, slug")
      .eq("parent_id", parent.id)
      .order("name");

    console.log("[getSubcategories] found", data?.length || 0, "subcategories");
    return (data || []) as Subcategory[];
  } catch (err: any) {
    console.error("[getSubcategories] ERROR:", err?.message, err?.code);
    throw new Error(`getSubcategories failed: ${err?.message || err}`);
  }
}

// 根据 slug 获取分类名称
export async function getCategoryName(slug: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return data?.name || slug;
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
  slug: string;
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

        result.push({ species: cat.name, slug: cat.slug, count: active.length, firstImage: firstImg });
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
      species, slug: species.toLowerCase().replace(/\s+/g, '-'), count: info.count, firstImage: info.firstImage,
    }));
    if (fallbackResult.length > 0) return fallbackResult;
  } catch (err) {
    console.error("getSpeciesCategories error:", err);
    // 继续往下走，返回占位分类
  }

  // 最终兜底：返回硬编码的占位分类（数据库无数据时保证首页不空白）
  return [
    { species: "守宫", slug: "gecko", count: 0, firstImage: null },
    { species: "蛇类", slug: "snake", count: 0, firstImage: null },
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
