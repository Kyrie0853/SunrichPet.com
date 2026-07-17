import { cache } from 'react';
import { createClient } from "@/lib/supabase/server";

const _cached = <T extends (...args: any[]) => any>(fn: T): T => cache(fn) as unknown as T;

export const searchProducts = _cached(async function searchProducts(query:string,page=1){
  const supabase=await createClient();
  const term2=`%${query}%`;
  const filter2=`name.ilike.${term2},description.ilike.${term2}`;
  const {data:products,count}=await supabase.from("studio_products").select("*",{count:"estimated"}).or(filter2).order("created_at",{ascending:false}).range((page-1)*10,page*10-1);
  return {products:products||[],total:count||0};
});

export const searchUsers = _cached(async function searchUsers(query: string, currentUserId?: string, page = 1) {
  const supabase = await createClient();
  const term = `%${query}%`;
  const { data: users, count } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .ilike("display_name", term)
    .order("display_name", { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);

  return { users: users || [], total: count || 0 };
});
