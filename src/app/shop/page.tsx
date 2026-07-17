import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ status?: string; species?: string; morph?: string; min_price?: string; max_price?: string }> };

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  const q = qs.toString();
  redirect("/" + (q ? "?" + q : ""));
}
