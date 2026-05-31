import { getConversations } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConversationList from "@/components/ConversationList";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const conversations = await getConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">私信</h1>
      <ConversationList userId={user.id} initialData={conversations} />
    </div>
  );
}
