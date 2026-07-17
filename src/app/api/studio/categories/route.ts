import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("name");

  if (error) {
    // 表不存在时返回空
    return NextResponse.json([]);
  }
  return NextResponse.json(data || []);
}
