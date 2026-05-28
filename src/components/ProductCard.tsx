import Link from "next/link";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:shadow-md"
    >
      {/* 商品图片 */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
            {product.name.charAt(0)}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-gray-800 group-hover:text-emerald-700">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-base font-bold text-emerald-600">
            ¥{product.price}
          </span>
          {product.stock === 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              已售罄
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
