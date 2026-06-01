"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMessageTime } from "@/lib/utils/time";

type Message = { id: string; conversation_id: string; sender_id: string; content: string; is_read: boolean; created_at: string; _status?: "sending" | "sent" | "failed" };
function tempId() { return "temp-" + Math.random().toString(36).slice(2, 10); }

export default function ChatView({ conversationId, currentUserId, initialMessages }: { conversationId: string; currentUserId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 标记已读
  useEffect(() => {
    const unread = messages.filter(m => m.sender_id !== currentUserId && !m.is_read && m._status !== "sending");
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
            // 如果已是乐观更新的消息（temp-xxx），替换为真实消息
            const exists = prev.find(m => m.id === newMsg.id);
            if (exists) return prev;
            // 替换可能存在的乐观更新消息（同一内容 + 同一 sender）
            const withoutOptimistic = prev.filter(m => !(m.id.startsWith("temp-") && m.sender_id === newMsg.sender_id && m.content === newMsg.content));
            return [...withoutOptimistic, newMsg];
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

  // 🚀 发送消息（乐观更新）
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setSendError("");

    const optimisticId = tempId();
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      _status: "sending",
    };

    // 乐观更新：立即显示消息
    setMessages(prev => [...prev, optimisticMsg]);
    setSending(true);

    const { data: inserted, error } = await supabase.from("messages").insert({
      conversation_id: conversationId, sender_id: currentUserId, content
    }).select("*").single();

    if (error) {
      console.error("Send error:", error);
      // 标记失败
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, _status: "failed" as const } : m));
      setSendError("发送失败: " + (error.message || "请稍后重试"));
    } else if (inserted) {
      // 替换临时消息为真实消息
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...inserted, _status: "sent" as const } : m));
    }
    setSending(false);
  }

  // 重发失败消息
  const retryMessage = useCallback(async (failedMsg: Message) => {
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    // 触发重新发送
    const { data: inserted, error } = await supabase.from("messages").insert({
      conversation_id: conversationId, sender_id: currentUserId, content: failedMsg.content
    }).select("*").single();

    if (error) {
      setMessages(prev => [...prev, { ...failedMsg, id: tempId(), _status: "failed" }]);
      setSendError("重发失败");
    } else if (inserted) {
      setMessages(prev => [...prev, { ...inserted, _status: "sent" }]);
    }
  }, [conversationId, currentUserId, supabase]);

  return (
    <>
      {/* 消息列表 */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.length === 0 && <p className="py-12 text-center text-sm text-gray-400">开始聊天吧</p>}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isFailed = msg._status === "failed";
          const isSending = msg._status === "sending";
          return (
            <div key={msg.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
              <div className={"max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative " + (
                isFailed ? "bg-red-50 text-red-600 border border-red-200 rounded-br-md" :
                isSending ? "bg-emerald-400 text-white rounded-br-md opacity-70" :
                isMe ? "bg-emerald-600 text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
              )}>
                {msg.content}
                <div className={"mt-1 text-right text-[10px] flex items-center gap-1 " + (isMe && !isFailed ? "text-emerald-200" : isFailed ? "text-red-400" : "text-gray-400")}>
                  {isSending && <span className="inline-block w-2.5 h-2.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin mr-1" />}
                  {isFailed && (
                    <button onClick={() => retryMessage(msg)} className="underline hover:text-red-800 mr-1">重发</button>
                  )}
                  {formatMessageTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 错误提示 */}
      {sendError && (
        <div className="mx-4 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{sendError}</div>
      )}

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
