"use client";

import Link from "next/link";

const TYPE_LABELS:Record<string,string>={comment:"评论了你的帖子",reply:"回复了你的评论",follow:"关注了你",like:"赞了你的帖子"};

function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();const m=Math.floor(diff/60000);if(m<1)return"刚刚";if(m<60)return m+"分钟前";const h=Math.floor(m/60);if(h<24)return h+"小时前";const days=Math.floor(h/24);if(days<30)return days+"天前";return Math.floor(days/30)+"个月前";}

export default function NotificationList({initialNotifications}:{initialNotifications:any[]}){
  if(initialNotifications.length===0)return(<div className="py-20 text-center"><p className="text-4xl text-gray-200">🔔</p><p className="mt-4 text-gray-400">暂无通知</p></div>);
  return(<div className="space-y-2">{initialNotifications.map((n:any)=>{
    const href=n.post_id?"/community/post/"+n.post_id:"/community/user/"+n.actor_id;
    return(<Link key={n.id} href={href} className={"flex items-start gap-3 rounded-xl border p-4 transition hover:shadow-sm "+(n.is_read?"border-gray-100 bg-white":"border-emerald-100 bg-emerald-50/50")}>
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">{n.actor?.display_name?.charAt(0)||"U"}</div>
      <div className="flex-1 min-w-0"><p className="text-sm text-gray-700"><span className="font-semibold">{n.actor?.display_name||"用户"}</span> {TYPE_LABELS[n.type]||n.type}</p><p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.created_at)}</p></div>
      {!n.is_read&&<span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500 mt-2"></span>}
    </Link>);
  })}</div>);
}