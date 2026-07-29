import { getProductByProductId } from "@/lib/studio/products";
import CheckoutClient from "./CheckoutClient";

type Props = { searchParams: Promise<{ product_id?: string; from?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const { product_id, from } = await searchParams;

  // 单品直接购买：从服务端获取商品信息
  let singleProduct: { product_id: string; name: string; price: number; image?: string; quantity: number } | null = null;

  if (product_id && from !== "cart") {
    try {
      const product = await getProductByProductId(product_id);
      if (product && product.status !== "sold") {
        singleProduct = {
          product_id: product.product_id,
          name: product.name,
          price: typeof product.price === "number" ? product.price : Number(product.price) || 0,
          image: product.images?.[0] || "",
          quantity: 1,
        };
      }
    } catch {
      // 获取失败，交由客户端处理
    }
  }

  return (
    <CheckoutClient
      productId={product_id || null}
      fromCart={from === "cart"}
      singleProduct={singleProduct}
    />
  );
}
