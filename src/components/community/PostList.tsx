"use client";

import { useState, useEffect } from "react";
import { CommunityPost, CATEGORY_LABELS, SortOption, SORT_OPTIONS, CommunityCategory } from "@/lib/supabase/community-types";
import PostCard from "@/components/community/PostCard";
import { createClient } from "@/lib/supabase/client";

export default function PostList({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const [posts,setPosts]=useState<CommunityPost[]>(initialPosts);
  const [category,setCategory]=useState<CommunityCategory|"">("");
  const [sort,setSort]=useState<SortOption>("latest");
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(false);
  const supabase=createClient();

  useEffect(()=>{
    if(category===""&&sort==="latest"&&page===1){setPosts(initialPosts);return;}
    let cancelled=false;setLoading(true);
    (async()=>{
      let q=supabase.from("community_posts").select("*");
      if(category)q=q.eq("category",category);
      if(sort==="latest")q=q.order("is_pinned",{ascending:false}).order("created_at",{ascending:false});
      else if(sort==="hot")q=q.order("is_pinned",{ascending:false}).order("view_count",{ascending:false});
      else if(sort==="trending"){const d=new Date(Date.now()-7*24*60*60*1000).toISOString();q=q.gte("created_at",d).order("view_count",{ascending:false});}
      q=q.range((page-1)*12,page*12-1);
      const {data:posts}=await q;
      if(!cancelled&&posts&&posts.length>0){
        // 批量查作者、标签、计数
        const aIds=[...new Set(posts.map((p:any)=>p.author_id))];
        const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",aIds);
        const aMap=new Map((authors||[]).map((a:any)=>[a.id,a]));
        const pIds=posts.map((p:any)=>p.id);
        const {data:tr}=await supabase.from("community_post_tags").select("post_id,tag_id").in("post_id",pIds);
        const tIds=[...new Set((tr||[]).map((r:any)=>r.tag_id))];
        const tMap=new Map<string,any[]>();
        if(tIds.length>0){const {data:tags}=await supabase.from("community_tags").select("id,name,slug,color").in("id",tIds);const tb=new Map((tags||[]).map((t:any)=>[t.id,t]));(tr||[]).forEach((r:any)=>{if(tb.has(r.tag_id)){if(!tMap.has(r.post_id))tMap.set(r.post_id,[]);tMap.get(r.post_id)!.push(tb.get(r.tag_id)!);}});}
        const enriched=await Promise.all(posts.map(async(p:any)=>{
          const[lk,cm]=await Promise.all([
            supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",p.id),
            supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",p.id)]);
          return{...p,author:aMap.get(p.author_id)||null,like_count:(lk as any).count||0,comment_count:(cm as any).count||0,tags:tMap.get(p.id)||[]};
        }));
        setPosts(enriched as CommunityPost[]);
      }
      setLoading(false);
    })();
    return ()=>{cancelled=true;};
  },[category,sort,page,initialPosts,supabase]);
  return (<div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={()=>{setCategory("");setPage(1);}} className={"rounded-full px-3 py-1 text-sm font-medium transition "+(category===""?"bg-emerald-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>全部</button>
          {(Object.entries(CATEGORY_LABELS) as [CommunityCategory,string][]).map(([key,label])=>(<button key={key} onClick={()=>{setCategory(key);setPage(1);}} className={"rounded-full px-3 py-1 text-sm font-medium transition "+(category===key?"bg-emerald-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>{label}</button>))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {SORT_OPTIONS.map(opt=>(<button key={opt.value} onClick={()=>{setSort(opt.value);setPage(1);}} className={"rounded-full px-3 py-1 text-sm font-medium transition "+(sort===opt.value?"bg-emerald-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>{opt.label}</button>))}
        </div>
      </div>
      {loading&&(<div className="py-12 text-center text-gray-400">加载中...</div>)}
      {!loading&&posts.length===0&&(<div className="py-20 text-center"><p className="text-4xl text-gray-200">🐾</p><p className="mt-4 text-gray-400">暂无帖子，来做第一个发帖的人吧</p></div>)}
      {!loading&&(<div className="grid gap-4">{posts.map(post=>(<PostCard key={post.id} post={post} />))}</div>)}
      {posts.length>=12&&(<div className="mt-8 flex items-center justify-center gap-4"><button disabled={page<=1} onClick={()=>setPage(page-1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">上一页</button><span className="text-sm text-gray-400">第 {page} 页</span><button onClick={()=>setPage(page+1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">下一页</button></div>)}
    </div>);
}