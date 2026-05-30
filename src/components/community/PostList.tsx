"use client";

import { useState, useEffect } from "react";
import { CommunityPost, SortOption, SORT_OPTIONS, PARENT_TABS, CommunityTag } from "@/lib/supabase/community-types";
import PostCard from "@/components/community/PostCard";
import { createClient } from "@/lib/supabase/client";

export default function PostList({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const [posts,setPosts]=useState<CommunityPost[]>(initialPosts);
  const [parentTab,setParentTab]=useState("");
  const [selectedTagIds,setSelectedTagIds]=useState<string[]>([]);
  const [sort,setSort]=useState<SortOption>("latest");
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(false);
  const [allTags,setAllTags]=useState<CommunityTag[]>([]);
  const supabase=createClient();

  // 加载全部标签
  useEffect(()=>{supabase.from("community_tags").select("*").order("name").then(({data})=>{if(data)setAllTags(data as CommunityTag[])})},[supabase]);

  useEffect(()=>{
    if(parentTab!=="featured"&&parentTab===""&&selectedTagIds.length===0&&sort==="latest"&&page===1){setPosts(initialPosts);return;}
    let cancelled=false;setLoading(true);
    (async()=>{
      let q=supabase.from("community_posts").select("*");
      if(sort==="latest")q=q.order("is_pinned",{ascending:false}).order("created_at",{ascending:false});
      else if(sort==="hot")q=q.order("is_pinned",{ascending:false}).order("view_count",{ascending:false});
      else if(sort==="trending"){const d=new Date(Date.now()-7*24*60*60*1000).toISOString();q=q.gte("created_at",d).order("view_count",{ascending:false});}
      q=q.range((page-1)*12,page*12-1);
      const {data:fetched}=await q;
      if(!cancelled&&fetched&&fetched.length>0){
        const aIds=[...new Set(fetched.map((p:any)=>p.author_id))];
        const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",aIds);
        const aMap=new Map((authors||[]).map((a:any)=>[a.id,a]));
        const pIds=fetched.map((p:any)=>p.id);
        let tagQuery=supabase.from("community_post_tags").select("post_id,tag_id").in("post_id",pIds);
        const {data:tr}=await tagQuery;
        const tIds=[...new Set((tr||[]).map((r:any)=>r.tag_id))];
        const tMap=new Map<string,any[]>();
        if(tIds.length>0){const {data:tags}=await supabase.from("community_tags").select("*").in("id",tIds);const tb=new Map((tags||[]).map((t:any)=>[t.id,t]));(tr||[]).forEach((r:any)=>{if(tb.has(r.tag_id)){if(!tMap.has(r.post_id))tMap.set(r.post_id,[]);tMap.get(r.post_id)!.push(tb.get(r.tag_id)!);}});}
        let filtered=fetched;
        // 精华区
        if(parentTab==="featured"){filtered=filtered.filter((p:any)=>p.is_featured===true);}
        // 按父分类过滤（通过标签的 parent_id）
        else if(parentTab){const parentChildren=allTags.filter(t=>t.parent_id===parentTab).map(t=>t.id);if(parentChildren.length>0){filtered=filtered.filter((p:any)=>{const ptIds=(tMap.get(p.id)||[]).map((t:any)=>t.id);return ptIds.some((id:string)=>parentChildren.includes(id));});}}
        // 按选中标签过滤
        if(selectedTagIds.length>0){filtered=filtered.filter((p:any)=>{const ptIds=(tMap.get(p.id)||[]).map((t:any)=>t.id);return selectedTagIds.some((id:string)=>ptIds.includes(id));});}
        const enriched=await Promise.all(filtered.map(async(p:any)=>{const[lk,cm]=await Promise.all([supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",p.id),supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",p.id)]);return{...p,author:aMap.get(p.author_id)||null,like_count:(lk as any).count||0,comment_count:(cm as any).count||0,tags:tMap.get(p.id)||[]};}));
        setPosts(enriched as CommunityPost[]);
      }else if(!cancelled){setPosts([]);}
      setLoading(false);
    })();return ()=>{cancelled=true;};
  },[parentTab,selectedTagIds,sort,page,initialPosts,supabase,allTags]);

  // 父分类子标签
  const childTags=parentTab?allTags.filter(t=>t.parent_id===parentTab):[];
  return (<div>
    {/* 父分类 Tab */}
    <div className="mb-4 flex gap-1">
      {PARENT_TABS.map(tab => (
        <button key={tab.key}
          onClick={() => { setParentTab(tab.key); setSelectedTagIds([]); setPage(1); }}
          className={"rounded-lg px-4 py-2 text-sm font-semibold transition " + (parentTab === tab.key ? "bg-emerald-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          {tab.label}
        </button>
      ))}
    </div>

    {/* 子分类标签云 */}
    {childTags.length > 0 && (
      <div className="mb-4 flex flex-wrap gap-1.5">
        {childTags.map(tag => (
          <button key={tag.id}
            onClick={() => { setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]); setPage(1); }}
            className={"rounded-full px-3 py-1 text-xs font-medium transition " + (selectedTagIds.includes(tag.id) ? "text-white border-transparent" : "border border-gray-200 text-gray-600 hover:border-gray-300")}
            style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}>
            {tag.name}
          </button>
        ))}
      </div>
    )}

    {/* 排序 */}
    <div className="mb-4 flex gap-1.5">
      {SORT_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => { setSort(opt.value); setPage(1); }}
          className={"rounded-full px-3 py-1 text-xs font-medium transition " + (sort === opt.value ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:text-gray-700")}>
          {opt.label}
        </button>
      ))}
    </div>

    {loading && <div className="py-12 text-center text-gray-400">加载中...</div>}
    {!loading && posts.length === 0 && <div className="py-20 text-center"><p className="text-4xl">🐾</p><p className="mt-4 text-gray-400">暂无帖子</p></div>}
    {!loading && <div className="space-y-3">{posts.map(post => <PostCard key={post.id} post={post} />)}</div>}
    {posts.length >= 12 && <div className="mt-8 flex items-center justify-center gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">上一页</button><span className="text-sm text-gray-400">第 {page} 页</span><button onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">下一页</button></div>}
  </div>);
}
