import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  // 获取分类列表
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  // 获取全部商品（含下架）
  const { data: products } = await supabase
    .from("products")
    .select("*, category:category_id(name)")
    .order("created_at", { ascending: false });

  const normalized = (products || []).map((p) => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] : p.category,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">后台管理</h1>
      <AdminPanel
        products={normalized}
        categories={categories || []}
        adminId={user.id}
      />
    </div>
  );
}
