"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
    >
      退出
    </button>
  );
}
