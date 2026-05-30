import { getMessages, getUserProfile } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ChatInput from "@/components/ChatInput";

function timeFormat(d:string){return new Date(d).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});}

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (userId === user.id) redirect("/messages");

  const other = await getUserProfile(userId);
  if (!other) notFound();

  const messages = await getMessages(user.id, userId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-4" style={{ height: "calc(100vh - 4rem)" }}>
      {/* 头部 */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <Link href="/messages" className="text-gray-400 hover:text-gray-600">&larr;</Link>
        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">
          {(other.display_name || "U").charAt(0)}
        </div>
        <span className="font-semibold text-gray-900">{other.display_name || "用户"}</span>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-gray-400">开始聊天吧</p>}
        {messages.map((msg: any) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
              <div className={"max-w-[75%] rounded-2xl px-4 py-2.5 text-sm " + (isMe ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-800")}>
                {msg.content}
                <div className={"mt-1 text-right text-[10px] " + (isMe ? "text-emerald-200" : "text-gray-400")}>{timeFormat(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 输入框 */}
      <ChatInput userId={userId} />
    </div>
  );
}
