import { createClient } from "@/lib/supabase/server";

export default async function ShopPage() {
  let error: string | null = null;
  let products: any[] = [];
  let dbCheck: string = "";

  try {
    const supabase = await createClient();

    // 诊断步骤
    const { data: tableCheck, error: tableErr } = await supabase
      .from("studio_products")
      .select("id")
      .limit(1);

    if (tableErr) {
      error = `表查询失败 [${tableErr.code}]: ${tableErr.message}`;
    } else {
      dbCheck = `studio_products 表存在，记录数: ${tableCheck?.length ?? 0}`;
      
      const { data, error: dataErr } = await supabase
        .from("studio_products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (dataErr) {
        error = `数据查询失败 [${dataErr.code}]: ${dataErr.message}`;
      } else {
        products = data || [];
      }
    }
  } catch (e: any) {
    error = `异常: ${e?.message || String(e)}`;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-700 mb-4">商城加载失败</h2>
          <div className="font-mono text-[13px] text-red-600 whitespace-pre-wrap">{error}</div>
          <div className="mt-4 text-[12px] text-red-400">{dbCheck}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">商城</h1>
      <p className="text-[13px] text-gray-500 mb-6">{dbCheck}</p>

      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-5xl mb-4">🦎</p>
          <p>暂无商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border p-3">
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-4xl">
                🦎
              </div>
              <p className="text-[14px] font-semibold truncate">{p.name}</p>
              <p className="text-[12px] text-gray-500">{p.species}</p>
              <p className="text-[16px] font-bold text-[#1a7f5a] mt-1">¥{p.price}</p>
              <span className="text-[11px] text-gray-400">{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
