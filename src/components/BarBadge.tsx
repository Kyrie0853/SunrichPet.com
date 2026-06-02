import { createClient } from "@/lib/supabase/server";

type BarRoleInfo = { bar_slug: string; bar_name: string; role: "owner" | "bar_admin" };

/** Server component: fetch and display bar role badges for a user */
export async function BarBadges({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Check bar ownership
  const { data: owned } = await supabase.from("bars").select("slug,name").eq("owner_id", userId);
  // Check bar admin roles
  const { data: adminBars } = await supabase.from("bar_admins").select("bar_id").eq("user_id", userId);

  let roles: BarRoleInfo[] = [];
  if (owned && owned.length > 0) {
    roles = roles.concat(owned.map((b: any) => ({ bar_slug: b.slug, bar_name: b.name, role: "owner" as const })));
  }
  if (adminBars && adminBars.length > 0) {
    const barIds = adminBars.map((a: any) => a.bar_id);
    const { data: bars } = await supabase.from("bars").select("slug,name").in("id", barIds);
    if (bars) {
      const ownedSlugs = new Set(roles.filter(r => r.role === "owner").map(r => r.bar_slug));
      for (const b of bars as any[]) {
        if (!ownedSlugs.has(b.slug)) {
          roles.push({ bar_slug: b.slug, bar_name: b.name, role: "bar_admin" });
        }
      }
    }
  }

  if (roles.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {roles.map((r) => (
        <span
          key={r.bar_slug}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            r.role === "owner"
              ? "bg-amber-100 text-amber-700 border border-amber-300"
              : "bg-gray-100 text-gray-600 border border-gray-300"
          }`}
          title={r.role === "owner" ? `${r.bar_name}区主` : `${r.bar_name}区管理`}
        >
          {r.role === "owner" ? "👑" : "🛡️"} {r.bar_name}
          {r.role === "owner" ? "区主" : "管理"}
        </span>
      ))}
    </span>
  );
}
