import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "customer" | "admin" | "super_admin";

/**
 * 获取当前登录用户的角色
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return (profile?.role as UserRole) || "customer";
}

/**
 * 要求 admin 及以上权限。不满足则 redirect。
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const role = await getUserRole(user.id);
  if (role !== "admin" && role !== "super_admin") {
    redirect("/?error=unauthorized");
  }
  return { userId: user.id, role };
}

/**
 * 要求 super_admin 权限。不满足则 redirect。
 */
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const role = await getUserRole(user.id);
  if (role !== "super_admin") {
    redirect("/?error=unauthorized");
  }
  return { userId: user.id, role };
}

/**
 * 检查当前用户是否为 admin（不 redirect，返回 boolean）
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const role = await getUserRole(user.id);
  return role === "admin" || role === "super_admin";
}
