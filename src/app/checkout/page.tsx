import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
  if (!cart) redirect("/cart");

  const { data: items } = await supabase.from("cart_items").select("product_id,quantity,products(name,price,image_url,stock)").eq("cart_id", cart.id);

  if (!items?.length) redirect("/cart");

  const lineItems = items.map((item: any) => ({
    product_id: item.product_id,
    name: item.products?.name || "商品",
    price: item.products?.price || 0,
    quantity: item.quantity,
    image: item.products?.image_url,
    stock: item.products?.stock || 0,
  }));

  const total = lineItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">确认订单</h1>
      <div className="mb-5 rounded-lg bg-[#e8f5ef] border border-[#1a7f5a]/15 px-4 py-2.5 text-[13px] text-[#1a7f5a] font-medium">
        🛡️ 平台担保模式 · 下单后平台确认收款 → 商家发货 → 验货后确认收货
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {lineItems.map((item: any) => (
          <div key={item.product_id} className="flex items-center justify-between border-b border-gray-50 py-3">
            <div>
              <p className="font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-400">x{item.quantity}</p>
            </div>
            <p className="font-bold text-emerald-700">¥{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <div className="mt-4 flex items-center justify-between text-lg">
          <span className="font-bold text-gray-900">合计</span>
          <span className="font-bold text-emerald-700">¥{total.toFixed(2)}</span>
        </div>
      </div>
      <CheckoutForm items={lineItems} />
    </div>
  );
}
