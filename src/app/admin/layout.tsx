import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("role,display_name,avatar_url").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <AdminSidebar currentRole={profile.role} />
      <div className="flex-1 flex flex-col ml-60">
        <AdminHeader displayName={profile.display_name} avatarUrl={profile.avatar_url} userId={user.id} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
