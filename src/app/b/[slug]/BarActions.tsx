"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BarActions({ barId, initialMember, userId }: { barId: string; initialMember: boolean; userId?: string | null }) {
  const [isMember, setIsMember] = useState(initialMember);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function toggle() {
    if (!userId) { router.push("/auth"); return; }
    setLoading(true);
    if (isMember) {
      await supabase.from("bar_members").delete().eq("bar_id", barId).eq("user_id", userId);
      setIsMember(false);
    } else {
      const { error } = await supabase.from("bar_members").insert({ bar_id: barId, user_id: userId });
      if (!error) setIsMember(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition shrink-0 ${
        isMember
          ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      } disabled:opacity-50`}
    >
      {loading ? "..." : isMember ? "已加入" : "+ 加入社区"}
    </button>
  );
}
