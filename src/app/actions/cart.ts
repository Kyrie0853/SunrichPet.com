"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** 确保用户有购物车，没有则创建，返回 cart id */
async function ensureCart(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("请先登录");

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (cart) return { cartId: cart.id, userId: user.id };

  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !newCart) throw new Error("创建购物车失败");
  return { cartId: newCart.id, userId: user.id };
}

/** 加入购物车 */
export async function addToCart(productId: string, quantity = 1) {
  const supabase = await createClient();
  const { cartId } = await ensureCart(supabase);

  // 检查商品是否存在且有库存
  const { data: product } = await supabase
    .from("products")
    .select("stock, status")
    .eq("id", productId)
    .single();

  if (!product || product.status !== "active") {
    return { success: false, message: "商品已下架" };
  }

  // 检查是否已在购物车中
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .single();

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock > 0 && newQty > product.stock) {
      return { success: false, message: `库存不足（剩余 ${product.stock}）` };
    }
    await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id);
  } else {
    if (product.stock > 0 && quantity > product.stock) {
      return { success: false, message: `库存不足（剩余 ${product.stock}）` };
    }
    await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, product_id: productId, quantity });
  }

  revalidatePath("/cart");
  return { success: true, message: "已加入购物车" };
}

/** 更新购物车商品数量 */
export async function updateCartItem(itemId: string, quantity: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  // 验证该 item 属于当前用户的购物车
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, product_id, cart:cart_id(user_id)")
    .eq("id", itemId)
    .single();

  // cart_items 是数组，需要处理 Supabase 的 join 返回格式
  const cartData = Array.isArray(item?.cart) ? item.cart[0] : item?.cart;
  if (!item || cartData?.user_id !== user.id) {
    return { success: false, message: "无权操作此购物车项" };
  }

  // 检查库存
  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", item.product_id)
    .single();

  if (product && quantity > product.stock) {
    return { success: false, message: `库存不足（剩余 ${product.stock}）` };
  }

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId);
  } else {
    await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
  }

  revalidatePath("/cart");
  return { success: true, message: "已更新" };
}

/** 删除购物车项 */
export async function removeCartItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  // 验证归属
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, cart:cart_id(user_id)")
    .eq("id", itemId)
    .single();

  const cartData = Array.isArray(item?.cart) ? item.cart[0] : item?.cart;
  if (!item || cartData?.user_id !== user.id) {
    return { success: false, message: "无权操作此购物车项" };
  }

  await supabase.from("cart_items").delete().eq("id", itemId);
  revalidatePath("/cart");
  return { success: true, message: "已删除" };
}

/** 模拟下单：基于购物车创建订单并清空购物车 */
export async function checkout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  // 获取购物车及所有商品
  const { data: cart, error: cartErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (cartErr || !cart) {
    return { success: false, message: "购物车为空" };
  }

  const { data: items } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product:product_id(id, name, price, stock, status)
    `
    )
    .eq("cart_id", cart.id);

  if (!items || items.length === 0) {
    return { success: false, message: "购物车为空" };
  }

  // 验证库存并计算总价
  let total = 0;
  const orderItems: {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    if (!product || product.status !== "active") {
      return { success: false, message: `"${product?.name || "某商品"}"已下架，请先从购物车移除` };
    }
    if (product.stock < item.quantity) {
      return {
        success: false,
        message: `"${product.name}"库存不足（剩余 ${product.stock}，购物车中有 ${item.quantity}）`,
      };
    }
    total += product.price * item.quantity;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: item.quantity,
    });
  }

  // 创建订单
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: total,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { success: false, message: "创建订单失败" };
  }

  // 创建订单明细
  const { error: itemsErr } = await supabase.from("order_items").insert(
    orderItems.map((oi) => ({
      order_id: order.id,
      product_id: oi.product_id,
      product_name: oi.product_name,
      product_price: oi.product_price,
      quantity: oi.quantity,
    }))
  );

  if (itemsErr) {
    return { success: false, message: "创建订单明细失败" };
  }

  // 扣减库存
  for (const oi of orderItems) {
    await supabase.rpc("decrement_stock", {
      p_product_id: oi.product_id,
      p_quantity: oi.quantity,
    });
  }

  // 清空购物车明细
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  revalidatePath("/cart");
  return { success: true, message: "下单成功", orderId: order.id };
}
