import { getMessages, getOrCreateConversation, getUserProfile } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ChatView from "@/components/ChatView";

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (userId === user.id) redirect("/messages");

  const other = await getUserProfile(userId);
  if (!other) notFound();

  // 尝试获取或创建会话，失败时优雅降级
  let conversation: any = null;
  let conversationError: string | null = null;
  try {
    conversation = await getOrCreateConversation(user.id, userId);
  } catch (e: any) {
    console.error("ChatPage: getOrCreateConversation failed:", e.message);
    conversationError = e.message;
  }

  // 如果无法创建会话，显示错误提示
  if (!conversation || conversationError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">💬</p>
        <p className="text-lg text-gray-700 font-semibold mb-2">无法建立私信会话</p>
        <p className="text-sm text-gray-400 mb-6">
          {conversationError || "会话服务暂不可用，请稍后重试"}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href={"/community/user/" + userId} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            返回用户主页
          </Link>
          <Link href="/messages" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            返回会话列表
          </Link>
        </div>
      </div>
    );
  }

  const messages = await getMessages(conversation.id);

  return (
    <div className="mx-auto flex max-w-2xl md:px-4 flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* 头部 */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href="/messages" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Link href={"/community/user/" + userId} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">
            {(other.display_name || "U").charAt(0)}
          </div>
          <span className="font-semibold text-gray-900">{other.display_name || "用户"}</span>
        </Link>
      </div>

      {/* 聊天区域（客户端实时组件） */}
      <ChatView conversationId={conversation.id} currentUserId={user.id} initialMessages={messages} />
    </div>
  );
}
