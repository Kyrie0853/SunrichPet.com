"use client";

import { CommunityPost, PARENT_TABS } from "@/lib/supabase/community-types";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ReportButton from "@/components/ReportButton";
import Avatar from "@/components/Avatar";

function timeFormat(d:string){return new Date(d).toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});}

export default function PostDetail({post}:{post:CommunityPost}){
  const router=useRouter();
  const [liked,setLiked]=useState(false);
  const [favorited,setFavorited]=useState(false);
  const [likeCount,setLikeCount]=useState(post.like_count);
  const [currentUserId,setCurrentUserId]=useState<string|null>(null);
  const [followingAuthor,setFollowingAuthor]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);
  const [pinned,setPinned]=useState(post.is_pinned);
  const [featured,setFeatured]=useState(post.is_featured);
  const supabase=createClient();
  const isAuthor=currentUserId===post.author_id;

  const togglePin=async()=>{const v=!pinned;await supabase.from("community_posts").update({is_pinned:v}).eq("id",post.id);setPinned(v);};
  const toggleFeatured=async()=>{const v=!featured;await supabase.from("community_posts").update({is_featured:v}).eq("id",post.id);setFeatured(v);};
  const toggleFollowAuthor=async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;if(followingAuthor){await supabase.from("user_follows").delete().eq("follower_id",user.id).eq("following_id",post.author_id);setFollowingAuthor(false)}else{await supabase.from("user_follows").insert({follower_id:user.id,following_id:post.author_id});setFollowingAuthor(true)}};

  useEffect(()=>{supabase.auth.getUser().then(({data:{user}})=>{if(user){setCurrentUserId(user.id);supabase.from("user_follows").select("id").eq("follower_id",user.id).eq("following_id",post.author_id).single().then(({data})=>{if(data)setFollowingAuthor(true)});supabase.from("profiles").select("role").eq("id",user.id).single().then(({data})=>{if(data?.role==="admin")setIsAdmin(true)});supabase.from("community_likes").select("id").eq("user_id",user.id).eq("post_id",post.id).single().then(({data})=>{if(data)setLiked(true)});supabase.from("community_favorites").select("id").eq("user_id",user.id).eq("post_id",post.id).single().then(({data})=>{if(data)setFavorited(true)});}});},[post.id,supabase]);

  const toggleLike=async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;if(liked){await supabase.from("community_likes").delete().eq("user_id",user.id).eq("post_id",post.id);setLiked(false);setLikeCount(c=>c-1)}else{await supabase.from("community_likes").insert({user_id:user.id,post_id:post.id});setLiked(true);setLikeCount(c=>c+1)}};
  const toggleFav=async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;if(favorited){await supabase.from("community_favorites").delete().eq("user_id",user.id).eq("post_id",post.id);setFavorited(false)}else{await supabase.from("community_favorites").insert({user_id:user.id,post_id:post.id});setFavorited(true)}};
  const shareLink=()=>{if(navigator.share)navigator.share({title:post.title,url:window.location.href});else{navigator.clipboard.writeText(window.location.href);alert("链接已复制")}};

  const handleDelete=async()=>{if(!confirm("确定要删除这篇帖子吗？删除后无法恢复。"))return;setDeleting(true);const{error}=await supabase.from("community_posts").delete().eq("id",post.id);if(error){alert("删除失败: "+error.message);setDeleting(false)}else{router.push("/")}};

  const parent=PARENT_TABS.find(t=>t.key===post.category);const label=parent?parent.label:post.category;

  return (<article>
    <div className="flex items-center gap-3">
      <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={48} />
      <div className="flex-1"><p className="font-semibold text-gray-900">{post.author?.display_name||"匿名用户"} {currentUserId&&currentUserId!==post.author_id&&(<button onClick={toggleFollowAuthor} className={followingAuthor?"ml-2 text-xs text-gray-400 hover:underline":"ml-2 text-xs text-emerald-600 font-semibold hover:underline"}>{followingAuthor?"已关注":"+ 关注"}</button>)}</p><p className="text-sm text-gray-400">{timeFormat(post.created_at)} · {post.view_count} 次浏览 · <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{label}</span></p></div>
      {isAdmin&&(<button onClick={togglePin} className={pinned?"rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700":"rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"}>{pinned?"取消置顶":"置顶"}</button>)}{isAdmin&&(<button onClick={toggleFeatured} className={featured?"rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700":"rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"}>{featured?"取消加精":"加精"}</button>)}{isAuthor&&(<div className="flex gap-2"><button onClick={()=>router.push("/community/post/"+post.id+"/edit")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">编辑</button><button onClick={handleDelete} disabled={deleting} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">{deleting?"删除中...":"删除"}</button></div>)}
    </div>
    <h1 className="mt-6 text-3xl font-bold text-gray-900">{post.title}</h1>
    <div className="mt-4 leading-relaxed text-gray-700 whitespace-pre-wrap">{post.content}</div>
    {post.images?.length>0&&(<div className="mt-6 grid grid-cols-2 gap-2">{post.images.map((url,i)=>(<img key={i} src={url} className="rounded-xl object-cover w-full" alt="" />))}</div>)}
    {post.tags?.length>0&&(<div className="mt-4 flex flex-wrap gap-1.5">{post.tags.map(t=>(<span key={t.id} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{backgroundColor:t.color+"20",color:t.color}}>{t.name}</span>))}</div>)}
    <div className="mt-8 flex items-center gap-4 border-t border-b border-gray-100 py-4">
      <button onClick={toggleLike} className={"flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition "+(liked?"bg-red-50 text-red-600":"bg-gray-50 text-gray-600 hover:bg-gray-100")}><svg className="h-4 w-4" fill={liked?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{likeCount}</button>
      <button onClick={toggleFav} className={"flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition "+(favorited?"bg-amber-50 text-amber-600":"bg-gray-50 text-gray-600 hover:bg-gray-100")}><svg className="h-4 w-4" fill={favorited?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>{favorited?"已收藏":"收藏"}</button>
      <button onClick={shareLink} className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>分享</button>
    </div>
  </article>);
}
