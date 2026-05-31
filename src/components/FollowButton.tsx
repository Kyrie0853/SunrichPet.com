"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendFollowIcebreaker } from "@/app/actions/messages";

export default function FollowButton({
  targetId,
  initialFollowing,
  currentUserId,
  size = "md",
}: {
  targetId: string;
  initialFollowing: boolean;
  currentUserId?: string | null;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!currentUserId || currentUserId === targetId) return null;

  async function toggleFollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    if (following) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUserId!)
        .eq("following_id", targetId);
      setFollowing(false);
    } else {
      await supabase
        .from("user_follows")
        .insert({ follower_id: currentUserId!, following_id: targetId });
      setFollowing(true);
      // 🧊 关注成功后自动发送破冰消息（fire-and-forget，不阻塞 UI）
      sendFollowIcebreaker(currentUserId!, targetId).catch(() => {});
    }
    setLoading(false);
  }

  const baseClass =
    "rounded-lg font-medium transition disabled:opacity-50 shrink-0";
  const sizeClass =
    size === "sm"
      ? "px-2.5 py-1 text-xs"
      : "px-4 py-1.5 text-sm";

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`${baseClass} ${sizeClass} ${
        following
          ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {loading ? "..." : following ? "已关注" : "+ 关注"}
    </button>
  );
}
