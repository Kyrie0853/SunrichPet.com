"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 关注后自动发送破冰消息（服务端安全执行）
 * A 关注 B → 自动以 B 身份向 A 发送欢迎消息，建立会话
 */
export async function sendFollowIcebreaker(followerId: string, targetId: string) {
  const supabase = await createClient();

  // 1. 获取或创建会话
  const p1 = followerId < targetId ? followerId : targetId;
  const p2 = followerId < targetId ? targetId : followerId;

  let { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_1", p1)
    .eq("participant_2", p2)
    .maybeSingle();

  if (!conv) {
    const { data: created, error: createErr } = await supabase
      .from("conversations")
      .insert({ participant_1: p1, participant_2: p2 })
      .select("id")
      .single();

    if (createErr) {
      // 并发冲突，重新查询
      if (createErr.code === "23505") {
        const { data: retry } = await supabase
          .from("conversations")
          .select("id")
          .eq("participant_1", p1)
          .eq("participant_2", p2)
          .maybeSingle();
        if (retry) conv = retry;
      }
      if (!conv) {
        console.error("sendFollowIcebreaker: 无法创建会话", createErr);
        return;
      }
    } else {
      conv = created;
    }
  }

  // 2. 检查是否已发送过破冰消息（防止取关再关注时重复）
  const icebreakerText = "你好！很高兴认识你，以后一起交流宠物吧～🐾";
  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conv.id)
    .eq("content", icebreakerText)
    .eq("sender_id", targetId)
    .maybeSingle();

  if (existing) return; // 已有破冰消息，跳过

  // 3. 发送破冰消息（targetId 作为发送者，followerId 作为接收者）
  const { error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: targetId,
      content: icebreakerText,
    });

  if (msgErr) {
    console.error("sendFollowIcebreaker: 消息发送失败", msgErr);
  }
}
