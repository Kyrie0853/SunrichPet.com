'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SellerFollowButton({ sellerId, initialFollowing, userId }: { sellerId: string; initialFollowing: boolean; userId?: string | null }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function toggle() {
    if (!userId) return;
    setLoading(true);
    if (following) {
      await supabase.from('user_follows').delete().eq('follower_id', userId).eq('following_id', sellerId);
    } else {
      await supabase.from('user_follows').insert({ follower_id: userId, following_id: sellerId });
    }
    setFollowing(!following);
    setLoading(false);
  }

  if (!userId || userId === sellerId) return null;

  return (
    <button onClick={toggle} disabled={loading}
      className={'shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition min-h-[44px] ' + (following ? 'border border-[#d1d5db] text-[#6b7280] hover:bg-[#f3f4f6]' : 'bg-[#1a7f5a] text-white hover:bg-[#166b4b]')}>
      {following ? '已关注' : '+ 关注'}
    </button>
  );
}
