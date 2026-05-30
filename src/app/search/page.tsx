import { searchPosts, searchProducts } from "@/lib/supabase/search";
import Link from "next/link";

function highlight(text: string, q: string) {
  if (!q || !text) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 150);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 110);
  return (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
}

function timeAgo(d: string) { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000); if (m < 1) return "刚刚"; if (m < 60) return m + "分钟前"; const h = Math.floor(m / 60); if (h < 24) return h + "小时前"; return Math.floor(h / 24) + "天前"; }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; tab?: string }> }) {
  const { q = "", tab = "posts" } = await searchParams;
  if (!q.trim()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-4xl">🔍</p><p className="mt-4 text-gray-400">请输入搜索关键词</p>
      </div>
    );
  }

  const [{ posts, total: postTotal }, { products, total: prodTotal }] = await Promise.all([
    tab === "posts" || tab === "all" ? searchPosts(q.trim()) : { posts: [], total: 0 } as any,
    tab === "products" || tab === "all" ? searchProducts(q.trim()) : { products: [], total: 0 } as any,
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">搜索 "{q}"</h1>
      <p className="mb-6 text-sm text-gray-400">帖子 {postTotal} 条 · 商品 {prodTotal} 条</p>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {[{ key: "posts", label: `帖子 (${postTotal})` }, { key: "products", label: `商品 (${prodTotal})` }].map(tabItem => (
          <Link key={tabItem.key} href={`/search?q=${encodeURIComponent(q)}&tab=${tabItem.key}`}
            className={"px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px " + (tab === tabItem.key ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {tabItem.label}
          </Link>
        ))}
      </div>

      {/* 帖子结果 */}
      {tab === "posts" && (
        <div className="space-y-3">
          {posts.length === 0 && <p className="py-12 text-center text-gray-400">未找到相关内容，换个关键词试试吧</p>}
          {posts.map((post: any) => (
            <Link key={post.id} href={"/community/post/" + post.id} className="block rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <h3 className="font-semibold text-gray-900">{post.title}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{highlight(post.content, q)}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>{post.author?.display_name || "匿名"}</span>
                <span>{timeAgo(post.created_at)}</span>
                <span>{post.like_count} 赞</span>
                <span>{post.comment_count} 评论</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 商品结果 */}
      {tab === "products" && (
        <div className="space-y-3">
          {products.length === 0 && <p className="py-12 text-center text-gray-400">未找到相关内容，换个关键词试试吧</p>}
          {products.map((product: any) => (
            <Link key={product.id} href={"/products/" + product.slug} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">无图</div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{highlight(product.description || "", q)}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-lg font-bold text-emerald-700">¥{product.price}</span>
                {product.stock > 0 ? <p className="text-xs text-green-600">有货</p> : <p className="text-xs text-red-400">缺货</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
