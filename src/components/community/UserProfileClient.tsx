"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function timeFormat(d:string){return new Date(d).toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"});}

export default function UserProfileClient({ profile }: { profile: any }) {
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.follower_count);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { setCurrentUser(user); if (user) { supabase.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", profile.id).single().then(({ data }) => { if (data) setFollowing(true); }); } }); }, [profile.id, supabase]);

  const toggleFollow = async () => {
    if (!currentUser) return;
    if (following) { await supabase.from("user_follows").delete().eq("follower_id", currentUser.id).eq("following_id", profile.id); setFollowing(false); setFollowerCount((c: number) => c - 1); }
    else { await supabase.from("user_follows").insert({ follower_id: currentUser.id, following_id: profile.id }); setFollowing(true); setFollowerCount((c: number) => c + 1); }
  };

  const isOwn = currentUser?.id === profile.id;

  return (<div><div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-8 sm:flex-row"><div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">{profile.display_name?.charAt(0)||"U"}</div><div className="flex-1 text-center sm:text-left"><h1 className="text-2xl font-bold text-gray-900">{profile.display_name||"用户"}</h1>{profile.bio&&<p className="mt-1 text-sm text-gray-500">{profile.bio}</p>}<p className="mt-2 text-xs text-gray-400">加入于 {timeFormat(profile.created_at)}</p><div className="mt-3 flex items-center gap-4 text-sm"><span className="text-gray-600"><strong className="text-gray-900">{profile.following_count}</strong> 关注</span><span className="text-gray-600"><strong className="text-gray-900">{followerCount}</strong> 粉丝</span></div></div>{!isOwn&&(<button onClick={toggleFollow} className={"rounded-xl px-5 py-2.5 text-sm font-semibold transition "+(following?"border border-gray-200 text-gray-600 hover:bg-gray-50":"bg-emerald-600 text-white hover:bg-emerald-700")}>{following?"已关注":"+ 关注"}</button>)}</div><div className="mt-10"><h2 className="mb-4 text-lg font-bold text-gray-900">发布的帖子 ({profile.posts?.length||0})</h2>{profile.posts?.length>0?(<div className="space-y-2">{profile.posts.map((post:any)=>(<Link key={post.id} href={"/community/post/"+post.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3 transition hover:shadow-sm"><span className="font-medium text-gray-900 truncate">{post.title}</span><span className="ml-4 flex-shrink-0 text-xs text-gray-400">{timeFormat(post.created_at)} · {post.view_count} 浏览</span></Link>))}</div>):(<p className="py-8 text-center text-sm text-gray-400">暂无帖子</p>)}</div></div>);
}