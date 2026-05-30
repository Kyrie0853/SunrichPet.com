"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChatInput({ userId }: { userId: string }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: userId, content: text.trim()
    });
    if (!error) { setText(""); router.refresh(); }
    setSending(false);
  }

  return (
    <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 pt-3">
      <input type="text" value={text} onChange={e => setText(e.target.value)}
        placeholder="输入消息..." maxLength={500}
        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
      <button type="submit" disabled={sending || !text.trim()}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
        发送
      </button>
    </form>
  );
}
