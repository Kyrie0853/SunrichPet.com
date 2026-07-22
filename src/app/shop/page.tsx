import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProductsByStatus, getAllSpecies, getAllMorphs, type StudioProduct } from "@/lib/studio/products";

const STATUS_STYLES: Record<string, string> = {
  presale: "bg-orange-50 text-orange-600 border-orange-200",
  available: "bg-emerald-50 text-emerald-600 border-emerald-200",
  sold: "bg-gray-100 text-gray-400 border-gray-200",
};

export default async function ShopPage() {
  const supabase = await createClient();

  let isAdmin = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      isAdmin = p?.role === "admin" || p?.role === "super_admin";
    }
  } catch {}

  let products: StudioProduct[] = [];
  let allSpecies: string[] = [];
  let allMorphs: string[] = [];

  try {
    products = await getProductsByStatus();
    allSpecies = await getAllSpecies();
    allMorphs = await getAllMorphs();
  } catch (e: any) {
    return <div className="p-10 text-red-600 font-mono">查询失败: {e?.message || String(e)}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/" className="text-[13px] text-gray-500 hover:text-[#1a7f5a]">&larr; 返回首页</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">全部个体</h1>
      <p className="text-[14px] text-gray-500 mb-6">共 {products.length} 只</p>

      {products.length === 0 ? (
        <p className="text-center py-20 text-gray-400">暂无商品</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/shop/product/${p.id}`} className="bg-white rounded-xl border p-3 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-4xl">
                {p.images?.length > 0 ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : '🦎'}
              </div>
              <p className="text-[14px] font-semibold truncate">{p.name}</p>
              <p className="text-[12px] text-gray-500">{p.species}{p.morph ? ' · ' + p.morph : ''}</p>
              <p className="text-[16px] font-bold text-[#1a7f5a]">¥{p.price}</p>
              <span className={"inline-block rounded-full px-2 py-0.5 text-[10px] border mt-1 " + (STATUS_STYLES[p.status] || "")}>{p.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
