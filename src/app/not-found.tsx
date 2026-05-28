import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="text-center">
        <p className="text-6xl text-gray-200">404</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-700">页面未找到</h1>
        <p className="mt-2 text-gray-400">你访问的页面不存在或已下架</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
