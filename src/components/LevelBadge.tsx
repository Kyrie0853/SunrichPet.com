// Lv1-Lv7 based on XP
const LEVELS = [
  { level: 1, name: '初来乍到', icon: '🌱', color: '#9ca3af', xp: 0, next: 50 },
  { level: 2, name: '见习玩家', icon: '🌿', color: '#6b7280', xp: 50, next: 150 },
  { level: 3, name: '活跃宠友', icon: '🦎', color: '#1a7f5a', xp: 150, next: 400 },
  { level: 4, name: '资深玩家', icon: '🐢', color: '#166b4b', xp: 400, next: 1000 },
  { level: 5, name: '宠物达人', icon: '🐍', color: '#0d9488', xp: 1000, next: 2500 },
  { level: 6, name: '爬宠专家', icon: '🦖', color: '#0891b2', xp: 2500, next: 6000 },
  { level: 7, name: '传奇大师', icon: '👑', color: '#7c3aed', xp: 6000, next: Infinity },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) { if (xp >= LEVELS[i].xp) { current = LEVELS[i]; break; } }
  const progress = current.next === Infinity ? 100 : Math.min(100, Math.round(((xp - current.xp) / (current.next - current.xp)) * 100));
  return { ...current, progress, nextXp: current.next };
}

export default function LevelBadge({ xp, level: explicitLevel, size = 'sm' }: { xp?: number; level?: number; size?: 'sm' | 'md' }) {
  let current;
  if (explicitLevel && explicitLevel >= 1 && explicitLevel <= 7) { current = LEVELS[explicitLevel - 1]; }
  else { current = getLevelInfo(xp || 0); }
  const isSm = size === 'sm';
  return (
    <span className={'inline-flex items-center gap-1 rounded-full px-1.5 md:px-2 py-0.5 font-bold ' + (isSm ? 'text-[10px]' : 'text-[11px] md:text-xs')}
      style={{ backgroundColor: current.color + '18', color: current.color, border: '1px solid ' + current.color + '30' }}>
      <span>{current.icon}</span><span>Lv{current.level}</span>
    </span>
  );
}

export const MEDAL_DEFS = [
  { id: 'first_post', name: '初次发声', desc: '发布第一篇帖子', icon: '📝' },
  { id: 'popular', name: '人气之星', desc: '获得100个点赞', icon: '⭐' },
  { id: 'helper', name: '热心玩家', desc: '发表50条评论', icon: '💬' },
  { id: 'first_trade', name: '首笔交易', desc: '完成第一笔交易', icon: '🤝' },
  { id: 'checkin_master', name: '签到达人', desc: '连续签到30天', icon: '🔥' },
  { id: 'featured_author', name: '精华作者', desc: '帖子被加精5次', icon: '🏆' },
  { id: 'reptile_expert', name: '爬宠专家', desc: '达到Lv6等级', icon: '🦖' },
];
