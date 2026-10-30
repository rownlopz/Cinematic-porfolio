"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/app/admin/actions";
import type { ContactMessage } from "@/lib/types";
import { ConfirmDialog, useToast } from "./ui";

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<ContactMessage | null>(null);

  if (messages.length === 0) return <div className="card" style={{ textAlign: "center" }}>No inquiries yet. Messages from your contact form appear here.</div>;

  return (
    <>
      {messages.map((m) => (
        <article key={m.id} className={`msg ${m.read ? "" : "unread"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong>{m.name}</strong>
            <span className="row__meta">{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <div className="row__meta"><a href={`mailto:${m.email}`} style={{ textDecoration: "underline" }}>{m.email}</a>{m.project_type ? ` · ${m.project_type}` : ""}{m.budget ? ` · Budget: ${m.budget}` : ""}</div>
          <pre>{m.message}</pre>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="b b--sm b--red" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your project inquiry")}`}>Reply</a>
            <button className="b b--sm" disabled={pending} onClick={() => start(async () => { const r = await setMessageRead(m.id, !m.read); if (!r.ok) toast.show("err", r.error); router.refresh(); })}>
              Mark {m.read ? "unread" : "read"}
            </button>
            <button className="b b--sm b--danger" onClick={() => setToDelete(m)}>Delete</button>
          </div>
        </article>
      ))}
      {toDelete && (
        <ConfirmDialog
          title="Delete this message?"
          body={`The message from ${toDelete.name} will be permanently deleted.`}
          busy={pending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => start(async () => {
            const r = await deleteMessage(toDelete.id);
            if (!r.ok) toast.show("err", r.error);
            setToDelete(null);
            router.refresh();
          })}
        />
      )}
      {toast.node}
    </>
  );
}
