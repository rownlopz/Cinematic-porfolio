"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createUploadUrl } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------ toast ------------------------------ */
export type ToastState = { kind: "ok" | "err"; text: string } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), kind === "ok" ? 3500 : 8000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = toast ? (
    <div className={`toast toast--${toast.kind}`} role={toast.kind === "err" ? "alert" : "status"}>{toast.text}</div>
  ) : null;
  return { show, node };
}

/* --------------------------- confirm dialog --------------------------- */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <div className="modal__box">
        <h2 id="dlg-title">{title}</h2>
        <p style={{ color: "var(--paper-dim)" }}>{body}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button ref={cancelRef} className="b" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="b b--red" onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- upload field ----------------------------- */
export function UploadField({
  label,
  value,
  onChange,
  kind = "image",
  folder,
  help,
  onPathChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  kind?: "image" | "video";
  folder: "projects" | "site" | "services";
  help?: string;
  onPathChange?: (path: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useRef(`up-${Math.random().toString(36).slice(2, 8)}`).current;

  const accept = kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm,video/quicktime";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const res = await createUploadUrl({ filename: file.name, type: file.type, size: file.size, folder });
      if (!res.ok || !res.data) throw new Error(res.ok ? "Upload could not start" : res.error);
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(res.data.path, res.data.token, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      onChange(res.data.publicUrl);
      onPathChange?.(res.data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fld">
      <span className="lbl" id={`${id}-l`}>{label}</span>
      <div className="upl">
        <div className="upl__thumb">
          {value ? (
            kind === "image" ? <img src={value} alt="" /> : <video src={value} muted preload="metadata" />
          ) : (
            <span>No {kind}</span>
          )}
        </div>
        <div>
          <input ref={input} id={id} type="file" accept={accept} onChange={onFile} hidden aria-labelledby={`${id}-l`} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="b b--sm" onClick={() => input.current?.click()} disabled={busy}>
              {busy ? "Uploading…" : value ? `Replace ${kind}` : `Upload ${kind}`}
            </button>
            {value && !busy && (
              <button type="button" className="b b--sm b--ghost" onClick={() => { onChange(null); onPathChange?.(null); }}>Remove</button>
            )}
          </div>
          <input
            className="input"
            style={{ marginTop: 8, background: "#0a0a0a", border: "1px solid var(--line)", padding: "8px 10px", color: "var(--paper)", width: "100%" }}
            placeholder="…or paste an https:// image/video URL"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            aria-label={`${label} URL`}
          />
          {help && <small>{help}</small>}
          {error && <p className="err" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- small inputs ---------------------------- */
export function Text({
  label, value, onChange, error, help, multiline, placeholder, type = "text", maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; help?: string;
  multiline?: boolean; placeholder?: string; type?: string; maxLength?: number;
}) {
  const id = useRef(`t-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} aria-invalid={!!error} />
      ) : (
        <input id={id} className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} aria-invalid={!!error} />
      )}
      {help && <small>{help}</small>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

/** Comma-separated list editor that stores string[]. */
export function Tags({ label, value, onChange, help, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; help?: string; placeholder?: string }) {
  const [raw, setRaw] = useState(value.join(", "));
  const last = useRef(value.join("|"));
  useEffect(() => {
    // Re-sync only when the parent replaces the list from outside.
    if (value.join("|") !== last.current) { setRaw(value.join(", ")); last.current = value.join("|"); }
  }, [value]);
  const id = useRef(`g-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        value={raw}
        placeholder={placeholder}
        onChange={(e) => {
          setRaw(e.target.value);
          const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
          last.current = arr.join("|");
          onChange(arr);
        }}
      />
      <small>{help ?? "Separate items with commas."}</small>
    </div>
  );
}

export function Check({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <div className="fld">
      <label className="chk">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
      {help && <small>{help}</small>}
    </div>
  );
}
