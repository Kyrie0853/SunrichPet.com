import { getNotifications, markNotificationsRead } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationList from "@/components/community/NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { notifications } = await getNotifications(user.id);
  await markNotificationsRead(user.id);

  return (<div className="mx-auto max-w-3xl px-4 py-10"><h1 className="mb-6 text-2xl font-bold text-gray-900">消息通知</h1><NotificationList initialNotifications={notifications} /></div>);
}