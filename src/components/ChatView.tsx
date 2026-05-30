"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; conversation_id: string; sender_id: string; content: string; is_read: boolean; created_at: string };

function timeFormat(d: string) { return new Date(d).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); }

export default function ChatView({ conversationId, currentUserId, initialMessages }: { conversationId: string; currentUserId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 标记已读
  useEffect(() => {
    const unread = messages.filter(m => m.sender_id !== currentUserId && !m.is_read);
    if (unread.length > 0) {
      supabase.from("messages").update({ is_read: true }).eq("conversation_id", conversationId).neq("sender_id", currentUserId).eq("is_read", false).then(() => {});
    }
  }, [conversationId, currentUserId, supabase, messages]);

  // Supabase Realtime 订阅
  useEffect(() => {
    const channel = supabase
      .channel("chat-" + conversationId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + conversationId },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // 自动标记收到的消息已读
          if (newMsg.sender_id !== currentUserId) {
            supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId, supabase]);

  // 聚焦输入框
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId, sender_id: currentUserId, content
    });
    if (error) console.error("Send error:", error);
    setSending(false);
  }

  return (
    <>
      {/* 消息列表 */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.length === 0 && <p className="py-12 text-center text-sm text-gray-400">开始聊天吧</p>}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
              <div className={"max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed " + (isMe ? "bg-emerald-600 text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100")}>
                {msg.content}
                <div className={"mt-1 text-right text-[10px] " + (isMe ? "text-emerald-200" : "text-gray-400")}>{timeFormat(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t bg-white px-4 py-3">
        <button type="button" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="图片（即将推出）">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)}
          placeholder="输入消息..." maxLength={500}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white" />
        <button type="submit" disabled={sending || !text.trim()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
          {sending ? "..." : "发送"}
        </button>
      </form>
    </>
  );
}
