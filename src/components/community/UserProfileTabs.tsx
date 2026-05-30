"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

function timeFormat(d:string){return new Date(d).toLocaleDateString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});}

export default function UserProfileTabs({profile,currentUserId}:{profile:any;currentUserId:string|null}){
  const [tab,setTab]=useState("posts");
  const [posts,setPosts]=useState<any[]>(profile.posts||[]);
  const [favorites,setFavorites]=useState<any[]>([]);
  const [likes,setLikes]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [following,setFollowing]=useState(false);
  const [fCount,setFCount]=useState(profile.follower_count);
  const supabase=createClient();
  const router=useRouter();
  const isOwn=currentUserId===profile.id;

  useEffect(()=>{if(currentUserId){supabase.from("user_follows").select("id").eq("follower_id",currentUserId).eq("following_id",profile.id).single().then(({data})=>{if(data)setFollowing(true)});}},[profile.id,currentUserId,supabase]);

  const loadTabData=useCallback(async(t:string)=>{if(t==="posts"||posts.length>0&&t==="posts")return;setLoading(true);
    if(t==="favorites"&&favorites.length===0){
      const{data:f}=await supabase.from("community_favorites").select("post_id,created_at").eq("user_id",profile.id).order("created_at",{ascending:false}).limit(50);
      if(f&&f.length>0){const ids=f.map(x=>x.post_id);const{data:p}=await supabase.from("community_posts").select("id,title,created_at,view_count,author_id").in("id",ids);
      if(p){const aIds=[...new Set(p.map(x=>x.author_id))];const{data:as}=await supabase.from("profiles").select("id,display_name").in("id",aIds);const aM=new Map((as||[]).map(a=>[a.id,a]));setFavorites(p.map(x=>({...x,author:aM.get(x.author_id)||null,favorited_at:f.find(y=>y.post_id===x.id)?.created_at})));}}
    }else if(t==="likes"&&likes.length===0){
      const{data:l}=await supabase.from("community_likes").select("post_id,created_at").eq("user_id",profile.id).order("created_at",{ascending:false}).limit(50);
      if(l&&l.length>0){const ids=[...new Set(l.map(x=>x.post_id).filter(Boolean))];if(ids.length>0){const{data:p}=await supabase.from("community_posts").select("id,title,created_at,view_count,author_id").in("id",ids);if(p)setLikes(p.map(x=>({...x,liked_at:l.find(y=>y.post_id===x.id)?.created_at})));}}
    }
    setLoading(false);
  },[tab,supabase,profile.id,favorites.length,likes.length,posts.length]);

  useEffect(()=>{loadTabData(tab);},[tab,loadTabData]);

  const toggleFollow=async()=>{if(!currentUserId)return;if(following){await supabase.from("user_follows").delete().eq("follower_id",currentUserId).eq("following_id",profile.id);setFollowing(false);setFCount((c:number)=>c-1)}else{await supabase.from("user_follows").insert({follower_id:currentUserId,following_id:profile.id});setFollowing(true);setFCount((c:number)=>c+1)}};

  const handleDelete=async(postId:string)=>{if(!confirm("删除这篇帖子？"))return;await supabase.from("community_posts").delete().eq("id",postId);setPosts(prev=>prev.filter(p=>p.id!==postId))};

  const tabs=[{key:"posts",label:"我的帖子"},{key:"favorites",label:"我的收藏"},{key:"likes",label:"点赞记录"}];
  return (<div>
    {/* Profile header */}
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-8 sm:flex-row">
      <Avatar userId={profile.id} avatarUrl={profile.avatar_url} displayName={profile.display_name} size={80} editable={isOwn} onAvatarChange={(newUrl: string) => { profile.avatar_url = newUrl; }} />
      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-900">{profile.display_name||"用户"}</h1>
        {profile.bio&&<p className="mt-1 text-sm text-gray-500">{profile.bio}</p>}
        <p className="mt-2 text-xs text-gray-400">加入于 {timeFormat(profile.created_at||profile.id)}</p>
        <div className="mt-3 flex items-center gap-4 text-sm"><span className="text-gray-600"><strong className="text-gray-900">{profile.following_count}</strong> 关注</span><span className="text-gray-600"><strong className="text-gray-900">{fCount}</strong> 粉丝</span></div>
      </div>
      {!isOwn&&(<button onClick={toggleFollow} className={"rounded-xl px-5 py-2.5 text-sm font-semibold transition "+(following?"border border-gray-200 text-gray-600 hover:bg-gray-50":"bg-emerald-600 text-white hover:bg-emerald-700")}>{following?"已关注":"+ 关注"}</button>)}
    </div>

    {/* Tabs */}
    <div className="mt-8">
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} className={"px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px "+(tab===t.key?"border-emerald-600 text-emerald-700":"border-transparent text-gray-500 hover:text-gray-700")}>{t.label}</button>))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading&&<div className="py-8 text-center text-sm text-gray-400">加载中...</div>}

        {tab==="posts"&&(<div className="space-y-2">
          {posts.length===0&&<p className="py-8 text-center text-sm text-gray-400">暂无帖子</p>}
          {posts.map((p:any)=>(<div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3 transition hover:shadow-sm">
            <Link href={"/community/post/"+p.id} className="min-w-0 flex-1"><span className="font-medium text-gray-900 truncate block">{p.title}</span><span className="text-xs text-gray-400">{timeFormat(p.created_at)} · {p.view_count||0} 浏览</span></Link>
            {isOwn&&(<div className="ml-3 flex gap-1.5 flex-shrink-0"><button onClick={()=>router.push("/community/post/"+p.id+"/edit")} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">编辑</button><button onClick={()=>handleDelete(p.id)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">删除</button></div>)}
          </div>))}
        </div>)}

        {tab==="favorites"&&(<div className="space-y-2">
          {favorites.length===0&&<p className="py-8 text-center text-sm text-gray-400">暂无收藏</p>}
          {favorites.map((p:any)=>(<Link key={p.id} href={"/community/post/"+p.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3 transition hover:shadow-sm"><span className="font-medium text-gray-900 truncate">{p.title}</span><span className="text-xs text-gray-400">{p.favorited_at?timeFormat(p.favorited_at):""}</span></Link>))}
        </div>)}

        {tab==="likes"&&(<div className="space-y-2">
          {likes.length===0&&<p className="py-8 text-center text-sm text-gray-400">暂无点赞记录</p>}
          {likes.map((p:any)=>(<Link key={p.id} href={"/community/post/"+p.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3 transition hover:shadow-sm"><span className="font-medium text-gray-900 truncate">{p.title}</span><span className="text-xs text-gray-400">{p.liked_at?timeFormat(p.liked_at):""}</span></Link>))}
        </div>)}
      </div>
    </div>
  </div>);
}