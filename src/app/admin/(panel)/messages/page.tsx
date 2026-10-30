import { requireAdmin } from "@/lib/auth";
import { MessageList } from "@/components/admin/MessageList";
import type { ContactMessage } from "@/lib/types";

export default async function MessagesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <h1 className="adm__h1">Inquiries</h1>
      <p className="adm__lead">Everything submitted through your contact form is stored here.</p>
      {error ? <p className="notice notice--err" role="alert">{error.message}</p> : <MessageList messages={(data ?? []) as ContactMessage[]} />}
    </>
  );
}
