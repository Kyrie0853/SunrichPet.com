import { getConversations } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();const m=Math.floor(diff/60000);if(m<1)return"刚刚";if(m<60)return m+"分钟前";const h=Math.floor(m/60);if(h<24)return h+"小时前";const days=Math.floor(h/24);if(days<30)return days+"天前";return Math.floor(days/30)+"个月前";}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const conversations = await getConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">私信</h1>
      {conversations.length === 0 ? (
        <div className="py-20 text-center"><p className="text-4xl">💬</p><p className="mt-4 text-gray-400">暂无私信对话</p></div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv: any) => (
            <Link key={conv.userId} href={"/messages/" + conv.userId} className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-gray-50">
              <div className="relative h-12 w-12 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600">
                {conv.profile?.display_name?.charAt(0) || "U"}
                {conv.unread > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{conv.unread}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{conv.profile?.display_name || "用户"}</span>
                  <span className="text-xs text-gray-400">{timeAgo(conv.lastTime)}</span>
                </div>
                <p className="truncate text-sm text-gray-500">{conv.lastContent}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
