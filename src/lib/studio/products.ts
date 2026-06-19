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

export async function getProductsByStatus(status?: string, species?: string) {
  const supabase = await createClient();
  let query = supabase.from("studio_products").select("*").order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (species && species !== "all") {
    query = query.eq("species", species);
  }

  const { data } = await query;
  return (data || []) as StudioProduct[];
}

export async function getAllSpecies() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_products")
    .select("species");
  
  const species = [...new Set((data || []).map((d: any) => d.species))];
  return species.filter(Boolean);
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
