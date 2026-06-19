import Link from "next/link";
import { getAvailableProducts } from "@/lib/studio/products";
import { getLatestBlogPosts } from "@/lib/studio/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sunrich Pet 爬宠工作室 — 专注高品质守宫繁育",
  description: "个人爬宠工作室直营商城，专注高品质爬宠繁育。支付宝担保交易，每一只都是亲手养大的宝贝。",
  openGraph: {
    title: "Sunrich Pet 爬宠工作室",
    description: "专注高品质守宫繁育，每一只都是亲手养大的宝贝",
    type: "website",
  },
};

const STATUS_STYLES: Record<string, string> = {
  presale: "bg-orange-50 text-orange-600 border-orange-200",
  available: "bg-emerald-50 text-emerald-600 border-emerald-200",
  sold: "bg-gray-100 text-gray-400 border-gray-200",
};
const STATUS_LABELS: Record<string, string> = {
  presale: "预售中",
  available: "可发货",
  sold: "已售出",
};

export default async function HomePage() {
  const products = await getAvailableProducts(6);
  const blogPosts = await getLatestBlogPosts(3);

  return (
    <div className="mx-auto max-w-5xl px-3 md:px-4">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a7f5a] via-emerald-600 to-teal-700 mb-10 mt-6 p-6 md:p-10 text-white">
        <div className="relative z-10 max-w-lg">
          <p className="text-emerald-200/80 text-[13px] md:text-[14px] font-medium tracking-wide uppercase mb-2">
            个人爬宠工作室
          </p>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
            Sunrich Pet 爬宠工作室
          </h1>
          <p className="mt-3 text-emerald-100/90 text-[14px] md:text-[16px] leading-relaxed">
            专注高品质守宫繁育，每一只都是亲手养大的宝贝
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-[#1a7f5a] transition-all hover:bg-emerald-50 active:scale-[0.97]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              查看在售个体
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-[14px] font-medium text-white transition-all hover:bg-white/10 active:scale-[0.97]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              了解我的繁育故事
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 hidden md:block">
          <svg viewBox="0 0 200 200" className="h-full w-full" fill="white">
            <circle cx="150" cy="30" r="60" />
            <circle cx="170" cy="100" r="40" />
            <circle cx="130" cy="160" r="50" />
          </svg>
        </div>
      </section>

      {/* ===== 担保交易标识 ===== */}
      <div className="mb-8 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-3 flex items-center gap-2.5 text-[13px] md:text-[14px]">
        <span className="text-lg shrink-0">🛡️</span>
        <span className="text-[#1a7f5a] font-medium">支付宝担保交易 · 收货验货后付款 · 每一只个体都经过精心养护</span>
      </div>

      {/* ===== 在售个体推荐 ===== */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-bold text-[#1f2937] flex items-center gap-2">
            <span className="w-1 h-5 bg-[#1a7f5a] rounded-full inline-block"></span>
            在售个体推荐
          </h2>
          <Link
            href="/shop"
            className="text-[13px] text-[#1a7f5a] hover:text-[#166b4b] font-medium transition-colors flex items-center gap-1"
          >
            查看全部
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🦎</p>
            <p className="text-[#9ca3af] text-[14px]">在售个体即将上线，敬请期待</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/product/${product.id}`}
                className="group bg-white rounded-xl border border-[#f3f4f6] overflow-hidden hover:shadow-md transition-all hover:border-[#1a7f5a]/20"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300">🦎</div>
                  )}
                  <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium border ${STATUS_STYLES[product.status] || STATUS_STYLES.available}`}>
                    {STATUS_LABELS[product.status] || "可发货"}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-[#9ca3af] font-mono mb-0.5">#{product.product_id}</p>
                  <h3 className="text-[14px] md:text-[15px] font-semibold text-[#1f2937] line-clamp-1 group-hover:text-[#1a7f5a] transition-colors">{product.name}</h3>
                  {product.morph && (
                    <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-1">{product.morph}</p>
                  )}
                  <p className="mt-2 text-[18px] md:text-[20px] font-bold text-[#1a7f5a]">¥{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 最新繁育笔记 ===== */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-bold text-[#1f2937] flex items-center gap-2">
            <span className="w-1 h-5 bg-[#1a7f5a] rounded-full inline-block"></span>
            最新繁育笔记
          </h2>
          <Link
            href="/blog"
            className="text-[13px] text-[#1a7f5a] hover:text-[#166b4b] font-medium transition-colors flex items-center gap-1"
          >
            查看全部
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {blogPosts.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-[#9ca3af] text-[14px]">繁育笔记即将上线</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-xl border border-[#f3f4f6] p-4 md:p-5 hover:border-[#1a7f5a]/20 hover:shadow-sm transition-all group"
              >
                <h3 className="text-[15px] md:text-[17px] font-semibold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">{post.title}</h3>
                {post.excerpt && (
                  <p className="mt-1.5 text-[13px] text-[#6b7280] line-clamp-2">{post.excerpt}</p>
                )}
                <p className="mt-2 text-[12px] text-[#9ca3af]">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
                    : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 工作室信息 ===== */}
      <section className="mb-12 rounded-2xl bg-white border border-[#f3f4f6] p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <h3 className="text-[14px] font-semibold text-[#1f2937] mb-2">工作室实名信息</h3>
            <p className="text-[13px] text-[#6b7280] leading-relaxed">
              Sunrich Pet 爬宠工作室 · 个人繁育者实名认证<br />专注于豹纹守宫、睫角守宫等高品质爬宠繁育
            </p>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1f2937] mb-2">联系方式</h3>
            <p className="text-[13px] text-[#6b7280] leading-relaxed">
              邮箱：553043978@qq.com<br />工作时间：9:00-21:00<br />所有交易请通过支付宝担保完成
            </p>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1f2937] mb-2">担保交易说明</h3>
            <p className="text-[13px] text-[#6b7280] leading-relaxed">
              本店所有交易通过支付宝担保交易<br />付款 → 发货 → 验货 → 确认收货<br />杜绝私下转账，保障双方权益
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}