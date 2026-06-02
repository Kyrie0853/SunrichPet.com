"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import { formatConvTime } from "@/lib/utils/time";

type ConvItem = {
  conversationId: string;
  userId: string;
  profile: any;
  lastMsg: string;
  lastTime: string;
  unread: number;
};

export default function ConversationList({ userId, initialData }: { userId: string; initialData: ConvItem[] }) {
  const [conversations, setConversations] = useState<ConvItem[]>(initialData);
  const supabase = createClient();

  // 🚀 订阅当前用户参与的所有会话的新消息
  useEffect(() => {
    if (conversations.length === 0) return;

    const convIds = conversations.map(c => c.conversationId);

    // 先获取会话 ID 列表用于 filter
    const channel = supabase
      .channel("conv-list-" + userId)
      .on("postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: convIds.map(id => `conversation_id=eq.${id}`).join(","),
        },
        (payload) => {
          const newMsg = payload.new as any;
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.conversationId === newMsg.conversation_id) {
                const isFromMe = newMsg.sender_id === userId;
                return {
                  ...c,
                  lastMsg: newMsg.content,
                  lastTime: newMsg.created_at,
                  unread: isFromMe ? c.unread : c.unread + 1,
                };
              }
              return c;
            });
            // 按最后消息时间重新排序
            updated.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
            return [...updated];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversations.map(c => c.conversationId).join(","), userId, supabase]);

  // 标记会话为已读（点击进入时）
  const markRead = useCallback((convId: string) => {
    setConversations(prev => prev.map(c =>
      c.conversationId === convId ? { ...c, unread: 0 } : c
    ));
  }, []);

  if (conversations.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl">💬</p>
        <p className="mt-4 text-gray-400">暂无私信对话</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {conversations.map((conv) => (
        <Link
          key={conv.conversationId}
          href={"/messages/" + conv.userId}
          onClick={() => markRead(conv.conversationId)}
          className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50"
        >
          <div className="relative flex-shrink-0">
            <Avatar userId={conv.userId} avatarUrl={conv.profile?.avatar_url} displayName={conv.profile?.display_name} size={48} clickable />
            {conv.unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0a04b] text-[10px] font-bold text-white">
                {conv.unread > 99 ? "99+" : conv.unread}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">{(conv.profile?.role === 'admin' || conv.profile?.role === 'super_admin') ? "平台客服" : (conv.profile?.display_name || "用户")}</span>
              <span className="text-xs text-gray-400">{formatConvTime(conv.lastTime)}</span>
            </div>
            <p className={"mt-0.5 truncate text-sm " + (conv.unread > 0 ? "font-medium text-gray-900" : "text-gray-500")}>
              {conv.lastMsg || "开始聊天"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
