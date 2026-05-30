"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import FollowButton from "@/components/FollowButton";
import Avatar from "@/components/Avatar";

type Comment={id:string;post_id:string;author_id:string;parent_id:string|null;content:string;created_at:string;author:{id:string;display_name:string|null;avatar_url:string|null};replies?:Comment[]};
function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();const m=Math.floor(diff/60000);if(m<1)return"刚刚";if(m<60)return m+"分钟前";const h=Math.floor(m/60);if(h<24)return h+"小时前";return Math.floor(h/24)+"天前";}

export default function CommentSection({postId,initialComments,postAuthorId}:{postId:string;initialComments:any[];postAuthorId:string}){
  const [comments,setComments]=useState(initialComments);
  const [newComment,setNewComment]=useState("");
  const [replyTo,setReplyTo]=useState<string|null>(null);
  const [replyContent,setReplyContent]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [currentUser,setCurrentUser]=useState<any>(null);
  const [followedUsers,setFollowedUsers]=useState<Set<string>>(new Set());
  const supabase=createClient();

  useEffect(()=>{supabase.auth.getUser().then(({data:{user}})=>{setCurrentUser(user);if(user){supabase.from("user_follows").select("following_id").eq("follower_id",user.id).then(({data})=>{if(data)setFollowedUsers(new Set(data.map(f=>f.following_id)));});}});},[supabase]);

  const submitComment=async()=>{
    if(!currentUser||!newComment.trim())return;
    setSubmitting(true);
    const{data:inserted,error}=await supabase.from("community_comments").insert({post_id:postId,author_id:currentUser.id,content:newComment.trim()}).select("*").single();
    if(!error&&inserted){
      const{data:author}=await supabase.from("profiles").select("id,display_name,avatar_url").eq("id",currentUser.id).single();
      setComments(prev=>[...prev,{...inserted,author:author||null,replies:[]}]);
      setNewComment("");
    }
    setSubmitting(false);
  };

  const submitReply=async(parentId:string)=>{
    if(!currentUser||!replyContent.trim())return;
    const{data:inserted,error}=await supabase.from("community_comments").insert({post_id:postId,author_id:currentUser.id,parent_id:parentId,content:replyContent.trim()}).select("*").single();
    if(!error&&inserted){
      const{data:author}=await supabase.from("profiles").select("id,display_name,avatar_url").eq("id",currentUser.id).single();
      setComments(prev=>prev.map(c=>c.id===parentId?{...c,replies:[...(c.replies||[]),{...inserted,author:author||null}]}:c));
      setReplyContent("");
      setReplyTo(null);
    }
  };
  return (<div><div className="mb-6">{currentUser?(<div><textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="写下你的评论..." rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><div className="mt-2 flex justify-end"><button onClick={submitComment} disabled={submitting||!newComment.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{submitting?"提交中...":"发表评论"}</button></div></div>):(<div className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">请<a href="/auth" className="text-emerald-600 underline">登录</a>后发表评论</div>)}</div><div className="space-y-4">{comments.map(comment=>(<div key={comment.id} className="rounded-xl border border-gray-100 bg-white p-4"><div className="flex items-center gap-2"><Avatar userId={comment.author_id} avatarUrl={comment.author?.avatar_url} displayName={comment.author?.display_name} size={32} clickable /><span className="text-sm font-semibold text-gray-900">{comment.author?.display_name||"匿名"}{comment.author_id===postAuthorId&&(<span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">作者</span>)}</span><span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span><div className="ml-auto"><FollowButton targetId={comment.author_id} initialFollowing={followedUsers.has(comment.author_id)} currentUserId={currentUser?.id} size="sm" /></div></div><p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p><div className="mt-2">{currentUser&&(<button onClick={()=>setReplyTo(replyTo===comment.id?null:comment.id)} className="text-xs text-gray-400 hover:text-emerald-600">回复</button>)}{replyTo===comment.id&&(<div className="mt-2"><textarea value={replyContent} onChange={e=>setReplyContent(e.target.value)} placeholder="写下回复..." rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /><div className="mt-2 flex gap-2 justify-end"><button onClick={()=>{setReplyTo(null);setReplyContent("")}} className="rounded-lg px-3 py-1 text-xs text-gray-500">取消</button><button onClick={()=>submitReply(comment.id)} disabled={!replyContent.trim()} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">回复</button></div></div>)}</div>{comment.replies?.length>0&&(<div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-100 pl-4">{comment.replies.map((reply:any)=>(<div key={reply.id}><div className="flex items-center gap-2"><Avatar userId={reply.author_id} avatarUrl={reply.author?.avatar_url} displayName={reply.author?.display_name} size={24} clickable /><span className="text-sm font-semibold text-gray-900">{reply.author?.display_name||"匿名"}{reply.author_id===postAuthorId&&(<span className="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-xs text-emerald-700">作者</span>)}</span><span className="text-xs text-gray-400">{timeAgo(reply.created_at)}</span><div className="ml-auto"><FollowButton targetId={reply.author_id} initialFollowing={followedUsers.has(reply.author_id)} currentUserId={currentUser?.id} size="sm" /></div></div><p className="mt-1 text-sm text-gray-700">{reply.content}</p></div>))}</div>)}</div>))}</div>{comments.length===0&&(<p className="py-8 text-center text-sm text-gray-400">暂无评论，来发表第一条评论吧</p>)}</div>);
}