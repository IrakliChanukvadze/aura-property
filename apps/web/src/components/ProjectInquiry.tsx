"use client";
import { useRef } from "react";
import { Mail, X } from "lucide-react";
import type { Project } from "@/lib/api";
import { type Locale, t } from "@/lib/i18n";
import { InquiryForm } from "./InquiryForm";
export function ProjectInquiry({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const d = t(locale);
  return (
    <>
      <button
        className="button project-inquiry-button"
        onClick={() => dialog.current?.showModal()}
      >
        <Mail size={14} aria-hidden="true" />
        {d.inquire}
      </button>
      <dialog ref={dialog} className="unit-dialog" aria-label={d.inquire}>
        <button
          className="dialog-close"
          onClick={() => dialog.current?.close()}
          aria-label={d.close}
        >
          <X size={18} />
        </button>
        <h2>{d.inquire}</h2>
        <InquiryForm locale={locale} projectId={project.id} project={project} />
      </dialog>
    </>
  );
}
