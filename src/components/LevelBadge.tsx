const LEVELS = ["", "Lv1 新手", "Lv2 学徒", "Lv3 达人", "Lv4 专家", "Lv5 大佬", "Lv6 传说"];
const COLORS = ["", "#9ca3af", "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

export function getLevelInfo(points: number) {
  let lv = 1;
  if (points >= 2000) lv = 6;
  else if (points >= 1000) lv = 5;
  else if (points >= 600) lv = 4;
  else if (points >= 300) lv = 3;
  else if (points >= 100) lv = 2;
  const nextThreshold = lv === 1 ? 100 : lv === 2 ? 300 : lv === 3 ? 600 : lv === 4 ? 1000 : lv === 5 ? 2000 : Infinity;
  const progress = nextThreshold === Infinity ? 100 : Math.round((points / nextThreshold) * 100);
  return { level: lv, label: LEVELS[lv], color: COLORS[lv], next: nextThreshold, progress };
}

export default function LevelBadge({ points, size = "sm" }: { points?: number; size?: "sm" | "md" }) {
  const { level, label, color } = getLevelInfo(points || 0);
  if (!points || level <= 1) return null;
  return (
    <span className={"inline-flex items-center rounded-full px-2 py-0.5 font-bold " + (size === "sm" ? "text-[10px]" : "text-xs")}
      style={{ backgroundColor: color + "20", color }}>
      {label}
    </span>
  );
}
