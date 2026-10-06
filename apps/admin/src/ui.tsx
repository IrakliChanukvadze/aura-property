import { t } from "./i18n";
import { api } from "./api";
import { useState, useRef, useEffect, type ReactNode } from "react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        ) || [],
      ).filter((e) => e.getClientRects().length);
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="modal"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon"
            onClick={onClose}
            aria-label={t("Close dialog")}
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  purpose?: string;
  multiple?: boolean;
  options?: { value: string; label: string }[];
  value?: any;
};
export function Form({
  fields,
  onSubmit,
  label = t("Save"),
  children,
}: {
  fields: Field[];
  onSubmit: (values: any) => Promise<void>;
  label?: string;
  children?: ReactNode;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const formData = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(formData);
        for (const field of fields)
          if (field.multiple) data[field.name] = formData.getAll(field.name);
        try {
          await onSubmit(data);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="fields">
        {fields.map((f) => (
          <label key={f.name}>
            {t(f.label)}
            {f.type === "upload" ? (
              <UploadField
                name={f.name}
                value={f.value}
                purpose={f.purpose || "PROJECT"}
              />
            ) : f.options ? (
              <select
                name={f.name}
                multiple={f.multiple}
                required={f.required}
                defaultValue={f.value}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.label)}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                name={f.name}
                required={f.required}
                defaultValue={f.value}
              />
            ) : (
              <input
                name={f.name}
                type={f.type || "text"}
                minLength={
                  f.type === "password" &&
                  f.name !== "currentPassword" &&
                  f.name !== "password"
                    ? 12
                    : undefined
                }
                required={f.required}
                defaultValue={f.value}
                step={f.type === "number" ? "any" : undefined}
              />
            )}
          </label>
        ))}
      </div>
      {children}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={busy}>
        {busy ? t("Saving…") : t(label)}
      </button>
    </form>
  );
}
export function Empty({ text = t("No records yet") }: { text?: string }) {
  return (
    <div className="empty">
      <span>◇</span>
      <p>{text}</p>
    </div>
  );
}
export const currencies = [
  { value: "GEL", label: t("GEL — Georgian lari") },
  { value: "USD", label: t("USD — US dollar") },
];
export const languages = [
  { value: "en", label: "English" },
  { value: "ka", label: "ქართული" },
  { value: "ru", label: "Русский" },
  { value: "he", label: "עברית" },
];
export function Money({ value }: { value: any }) {
  return (
    <>
      {new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(
        Number(value || 0),
      )}{" "}
      <small>GEL</small>
    </>
  );
}

export function UploadField({
  name,
  value,
  purpose,
  leadId,
  onUploaded,
}: {
  name: string;
  value?: string;
  purpose: string;
  leadId?: string;
  onUploaded?: (v: any) => void;
}) {
  const [url, setUrl] = useState(value || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="upload-field">
      <input
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={
          purpose === "AGREEMENT"
            ? "Private attachment"
            : "Image URL or upload below"
        }
      />
      <input
        type="file"
        aria-label={t("Upload file")}
        accept={
          purpose === "AGREEMENT"
            ? ".pdf,.jpg,.jpeg,.png,.webp"
            : ".jpg,.jpeg,.png,.webp"
        }
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            if (file.size > 10000000)
              throw new Error("Maximum file size is 10 MB");
            const bytes = new Uint8Array(await file.arrayBuffer());
            let encoded = "";
            for (const byte of bytes) encoded += String.fromCharCode(byte);
            const result = await api("/uploads", "POST", {
              name: file.name,
              mime: file.type,
              file: btoa(encoded),
              purpose,
              ...(leadId ? { leadId } : {}),
            });
            setUrl(result.url);
            onUploaded?.(result);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <small>{t("Uploading…")}</small>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
