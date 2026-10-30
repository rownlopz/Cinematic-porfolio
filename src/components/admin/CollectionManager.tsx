"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteItem, reorderItems, saveItem, type CollectionTable } from "@/app/admin/actions";
import { Check, ConfirmDialog, Tags, Text, UploadField, useToast } from "./ui";

export type FieldDef =
  | { name: string; label: string; type: "text" | "textarea"; help?: string; maxLength?: number }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: "checkbox"; help?: string }
  | { name: string; label: string; type: "color" }
  | { name: string; label: string; type: "image"; help?: string }
  | { name: string; label: string; type: "tags"; help?: string };

type Item = { id: string; [k: string]: unknown };

function blank(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    out[f.name] = f.type === "checkbox" ? true : f.type === "tags" ? [] : f.type === "color" ? "#e10600" : f.type === "select" ? f.options[0]?.value ?? "" : "";
  }
  return out;
}

export function CollectionManager({
  table,
  items,
  fields,
  titleKey,
  subtitleKey,
  noun,
  hiddenKey = "visible",
}: {
  table: CollectionTable;
  items: Item[];
  fields: FieldDef[];
  titleKey: string;
  subtitleKey?: string;
  noun: string;
  hiddenKey?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Item | null>(null);

  const open = (item: Item | "new") => {
    setErrors({});
    if (item === "new") { setDraft(blank(fields)); setEditing("new"); return; }
    const d: Record<string, unknown> = {};
    for (const f of fields) d[f.name] = item[f.name] ?? (f.type === "tags" ? [] : "");
    setDraft(d);
    setEditing(item.id);
  };

  const save = () =>
    start(async () => {
      const res = await saveItem(table, editing === "new" ? null : editing, draft);
      if (!res.ok) { setErrors(res.fields ?? {}); toast.show("err", res.error); return; }
      toast.show("ok", "Saved. Live site updated.");
      setEditing(null);
      router.refresh();
    });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const ids = items.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    start(async () => {
      const r = await reorderItems(table, ids);
      if (!r.ok) toast.show("err", r.error);
      router.refresh();
    });
  };

  const remove = () => {
    const target = toDelete;
    if (!target) return;
    start(async () => {
      const r = await deleteItem(table, target.id);
      if (!r.ok) { toast.show("err", r.error); return; }
      toast.show("ok", `${noun} deleted`);
      setToDelete(null);
      router.refresh();
    });
  };

  const toggleVisible = (it: Item) =>
    start(async () => {
      const d: Record<string, unknown> = {};
      for (const f of fields) d[f.name] = it[f.name] ?? (f.type === "tags" ? [] : "");
      d[hiddenKey] = !it[hiddenKey];
      const r = await saveItem(table, it.id, d);
      if (!r.ok) toast.show("err", r.error);
      router.refresh();
    });

  return (
    <>
      <div className="adm__bar">
        <span className="row__meta">{items.length} {noun.toLowerCase()}{items.length === 1 ? "" : "s"}</span>
        <button className="b b--red" onClick={() => open("new")} disabled={editing === "new"}>+ Add {noun.toLowerCase()}</button>
      </div>

      {editing === "new" && (
        <EditorCard fields={fields} draft={draft} setDraft={setDraft} errors={errors} onSave={save} onCancel={() => setEditing(null)} pending={pending} heading={`New ${noun.toLowerCase()}`} />
      )}

      {items.length === 0 && editing !== "new" && <div className="card" style={{ textAlign: "center" }}>Nothing here yet.</div>}

      {items.map((it, i) =>
        editing === it.id ? (
          <EditorCard key={it.id} fields={fields} draft={draft} setDraft={setDraft} errors={errors} onSave={save} onCancel={() => setEditing(null)} pending={pending} heading={`Edit ${noun.toLowerCase()}`} />
        ) : (
          <div className="row" key={it.id} style={{ gridTemplateColumns: "1fr auto" }}>
            <div>
              <div className="row__title">{String(it[titleKey] ?? "")}</div>
              {subtitleKey && <div className="row__meta">{String(it[subtitleKey] ?? "").slice(0, 140)}</div>}
              <div style={{ marginTop: 6 }}>
                <span className={`tag ${it[hiddenKey] === false ? "tag--draft" : "tag--pub"}`}>{it[hiddenKey] === false ? "hidden" : "visible"}</span>
              </div>
            </div>
            <div className="row__actions">
              <button className="b b--sm" onClick={() => move(i, -1)} disabled={pending || i === 0} aria-label="Move up">↑</button>
              <button className="b b--sm" onClick={() => move(i, 1)} disabled={pending || i === items.length - 1} aria-label="Move down">↓</button>
              <button className="b b--sm" onClick={() => toggleVisible(it)} disabled={pending}>{it[hiddenKey] === false ? "Show" : "Hide"}</button>
              <button className="b b--sm" onClick={() => open(it)}>Edit</button>
              <button className="b b--sm b--danger" onClick={() => setToDelete(it)}>Delete</button>
            </div>
          </div>
        ),
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Delete this ${noun.toLowerCase()}?`}
          body={`“${String(toDelete[titleKey] ?? "")}” will be removed from your site. This can't be undone.`}
          busy={pending}
          onCancel={() => setToDelete(null)}
          onConfirm={remove}
        />
      )}
      {toast.node}
    </>
  );
}

function EditorCard({
  fields, draft, setDraft, errors, onSave, onCancel, pending, heading,
}: {
  fields: FieldDef[];
  draft: Record<string, unknown>;
  setDraft: (d: Record<string, unknown>) => void;
  errors: Record<string, string>;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  heading: string;
}) {
  const set = (k: string, v: unknown) => setDraft({ ...draft, [k]: v });
  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); onSave(); }} style={{ marginBottom: 12 }}>
      <h2>{heading}</h2>
      {fields.map((f) => {
        const val = draft[f.name];
        switch (f.type) {
          case "text":
            return <Text key={f.name} label={f.label} value={String(val ?? "")} onChange={(x) => set(f.name, x)} error={errors[f.name]} help={f.help} maxLength={f.maxLength} />;
          case "textarea":
            return <Text key={f.name} label={f.label} multiline value={String(val ?? "")} onChange={(x) => set(f.name, x)} error={errors[f.name]} help={f.help} maxLength={f.maxLength} />;
          case "select":
            return (
              <div className="fld" key={f.name}>
                <label htmlFor={`f-${f.name}`}>{f.label}</label>
                <select id={`f-${f.name}`} value={String(val ?? "")} onChange={(e) => set(f.name, e.target.value)}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {f.help && <small>{f.help}</small>}
              </div>
            );
          case "checkbox":
            return <Check key={f.name} label={f.label} checked={val !== false} onChange={(x) => set(f.name, x)} help={f.help} />;
          case "color":
            return (
              <div className="fld" key={f.name}>
                <label htmlFor={`f-${f.name}`}>{f.label}</label>
                <input id={`f-${f.name}`} type="color" value={String(val || "#e10600")} onChange={(e) => set(f.name, e.target.value)} style={{ width: 80, height: 40, background: "none", border: "1px solid var(--line)" }} />
              </div>
            );
          case "image":
            return <UploadField key={f.name} label={f.label} value={String(val ?? "") || null} onChange={(x) => set(f.name, x ?? "")} folder="services" help={f.help} />;
          case "tags":
            return <Tags key={f.name} label={f.label} value={(val as string[]) ?? []} onChange={(x) => set(f.name, x)} help={f.help} />;
        }
      })}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="b b--red" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        <button type="button" className="b" onClick={onCancel} disabled={pending}>Cancel</button>
      </div>
    </form>
  );
}
