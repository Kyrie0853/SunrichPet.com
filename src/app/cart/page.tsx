import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartContent } from "@/components/CartContent";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // 获取购物车
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-gray-400">购物车是空的</p>
        <a href="/products" className="mt-4 inline-block text-emerald-600 hover:underline">
          去逛逛
        </a>
      </div>
    );
  }

  // 获取购物车明细 + 商品信息
  const { data: items } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product:product_id(id, slug, name, price, image_url, stock, status)
    `
    )
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  // 标准化 Supabase join 返回格式（many-to-one 返回对象）
  const cartItems = (items || []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: Array.isArray(item.product) ? item.product[0] : item.product,
  }));

  // 过滤已下架商品（已在购物车中但后被下架的）
  const validItems = cartItems.filter(
    (item) => item.product && item.product.status === "active"
  );

  if (validItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-gray-400">购物车是空的</p>
        <a href="/products" className="mt-4 inline-block text-emerald-600 hover:underline">
          去逛逛
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">购物车</h1>
      <CartContent items={cartItems} />
    </div>
  );
}
