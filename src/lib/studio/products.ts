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

// ---- 分类类型 ----
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  count: number;
  firstImage: string | null;
  children?: CategoryWithCount[];
}

// 获取所有顶级分类（parent_id IS NULL），含商品数量和首图
export async function getTopCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  // 先获取分类表
  const { data: cats, error } = await supabase
    .from("product_categories")
    .select("*")
    .is("parent_id", null)
    .order("name");

  // 表不存在或为空时，回退到从产品 species 聚合
  if (error || !cats || cats.length === 0) {
    return getSpeciesCategoriesFallback();
  }

  // 获取每个顶级分类的子分类 ID
  const { data: allChildren } = await supabase
    .from("product_categories")
    .select("id, parent_id, slug, name")
    .not("parent_id", "is", null);

  const childIdsByParent = new Map<string, string[]>();
  (allChildren || []).forEach((c: any) => {
    if (!childIdsByParent.has(c.parent_id)) childIdsByParent.set(c.parent_id, []);
    childIdsByParent.get(c.parent_id)!.push(c.id);
  });

  const result: CategoryWithCount[] = [];

  for (const cat of cats) {
    const childIds = childIdsByParent.get(cat.id) || [];
    // 该顶级分类下所有子分类的 ID
    const allIds = [cat.id, ...childIds];

    // 查询这些分类下的在售商品
    const { data: products } = await supabase
      .from("studio_products")
      .select("images, status, category_id")
      .in("status", ["available", "presale"])
      .in("category_id", allIds);

    const activeProducts = (products || []).filter((p: any) => allIds.includes(p.category_id));
    const firstImg = activeProducts.find((p: any) => p.images?.length > 0)?.images?.[0] || null;

    // 也获取子分类信息
    const children = (allChildren || [])
      .filter((c: any) => c.parent_id === cat.id)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: 0,
        firstImage: null as string | null,
      }));

    result.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: activeProducts.length,
      firstImage: firstImg,
      children,
    });
  }

  return result;
}

// 回退方案：当 product_categories 表不存在时，从产品 species 聚合
async function getSpeciesCategoriesFallback(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_products")
    .select("species, images, status")
    .in("status", ["available", "presale"]);

  const speciesMap = new Map<string, { count: number; firstImage: string | null }>();
  (data || []).forEach((p: any) => {
    const existing = speciesMap.get(p.species);
    if (existing) {
      existing.count++;
      if (!existing.firstImage && p.images?.length > 0) {
        existing.firstImage = p.images[0];
      }
    } else {
      speciesMap.set(p.species, { count: 1, firstImage: p.images?.length > 0 ? p.images[0] : null });
    }
  });

  return Array.from(speciesMap.entries()).map(([species, info]) => ({
    id: species,
    name: species,
    slug: species.toLowerCase().replace(/\s+/g, '-'),
    count: info.count,
    firstImage: info.firstImage,
  }));
}

// 获取所有分类（树形，供表单选择器使用）
export async function getAllCategories(): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("name");
  if (error) return [];
  return (data || []) as ProductCategory[];
}

// 旧版兼容
export interface SpeciesCategory {
  species: string;
  count: number;
  firstImage: string | null;
}

export async function getSpeciesCategories(): Promise<SpeciesCategory[]> {
  const top = await getTopCategories();
  return top.map(c => ({ species: c.name, count: c.count, firstImage: c.firstImage }));
}

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
  categorySlug?: string
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

  // 按分类筛选：先查出该分类 slug 对应的 ID 及其所有子分类 ID
  if (categorySlug && categorySlug !== "all") {
    const { data: catData } = await supabase
      .from("product_categories")
      .select("id, parent_id")
      .or(`slug.eq.${categorySlug},parent_id.eq.(select id from product_categories where slug = '${categorySlug}')`);

    if (catData && catData.length > 0) {
      // 包括自身和子分类
      const catIds = catData.map((c: any) => c.id);
      // 如果该分类有子分类，也包括子分类
      const parentCat = catData.find((c: any) => c.slug === undefined);
      const allIds = catData.map((c: any) => c.id);

      if (allIds.length > 0) {
        query = query.in("category_id", allIds);
      }
    } else {
      // 回退: 用 species 字段模糊匹配
      query = query.ilike("species", `%${categorySlug.replace(/-/g, ' ')}%`);
    }
  }

  // 排序
  const { data } = await query.order("created_at", { ascending: false });

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
