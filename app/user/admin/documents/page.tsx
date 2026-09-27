"use client";

import { useCallback, useState } from "react";
import { useLive } from "@/lib/use-live";
import {
  apiGet,
  apiSend,
  Confirm,
  DataTable,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  Spinner,
  StatusPill,
  Toast,
  type Column,
} from "@/components/admin/ui";

type Doc = {
  id: string;
  code: string;
  title: string;
  flagPath: string;
  fileUrl: string;
  sort: number;
  isActive: boolean;
};

const EMPTY: Omit<Doc, "id"> = { code: "", title: "", flagPath: "", fileUrl: "", sort: 0, isActive: true };

export default function AdminDocumentsPage() {
  const [data, setData] = useState<Doc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<(Doc & { isNew: boolean }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<Doc[]>("/api/admin/documents"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useLive(load);

  const save = async () => {
    if (!editor) return;
    if (!editor.code.trim() || !editor.title.trim() || !editor.flagPath.trim() || !editor.fileUrl.trim()) {
      setToast("All fields are required");
      return;
    }
    const body = {
      code: editor.code.trim(),
      title: editor.title.trim(),
      flagPath: editor.flagPath.trim(),
      fileUrl: editor.fileUrl.trim(),
      sort: Math.round(Number(editor.sort) || 0),
      isActive: editor.isActive,
    };
    setBusy(true);
    try {
      if (editor.isNew) {
        await apiSend("/api/admin/documents", "POST", body);
        setToast(`Document "${body.code}" created`);
      } else {
        await apiSend(`/api/admin/documents/${editor.id}`, "PATCH", body);
        setToast(`Document "${body.code}" updated`);
      }
      setEditor(null);
      load();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await apiSend(`/api/admin/documents/${deleteTarget.id}`, "DELETE");
      setToast(`Document "${deleteTarget.code}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setToast((e as Error).message);
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Doc>[] = [
    {
      label: "Doc",
      render: (d) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img className="adm-flag" src={d.flagPath} alt="" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")} />
          <div>
            <b>{d.code}</b>
            <span className="adm-cell-sub">{d.title}</span>
          </div>
        </div>
      ),
    },
    { label: "Sort", render: (d) => d.sort },
    { label: "Status", render: (d) => <StatusPill status={d.isActive ? "Active" : "Disabled"} /> },
    {
      label: "",
      className: "num",
      render: (d) => (
        <div className="adm-actions-cell">
          <button className="adm-link-btn" onClick={() => setEditor({ ...d, isNew: false })}>
            Edit
          </button>
          <button className="adm-link-btn danger" onClick={() => setDeleteTarget(d)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="PDF resources shown in the user dashboard Resources tab."
        actions={
          <button className="adm-btn primary" onClick={() => setEditor({ id: "", ...EMPTY, isNew: true })}>
            + New Document
          </button>
        }
      />

      {loading && !data ? (
        <Spinner label="Loading documents…" />
      ) : error && !data ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : data ? (
        <DataTable columns={columns} rows={data} />
      ) : null}

      {editor && (
        <Modal title={editor.isNew ? "New Document" : `Edit ${editor.code}`} onClose={() => !busy && setEditor(null)}>
          <Field label="Code">
            <input className="adm-input" value={editor.code} onChange={(e) => setEditor({ ...editor, code: e.target.value })} placeholder="QFS-OVERVIEW" />
          </Field>
          <Field label="Title">
            <input className="adm-input" value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} placeholder="Company Presentation" />
          </Field>
          <Field label="Flag image path">
            <input className="adm-input" value={editor.flagPath} onChange={(e) => setEditor({ ...editor, flagPath: e.target.value })} placeholder="/flags/uk.svg" />
          </Field>
          <Field label="File URL (PDF)">
            <input className="adm-input" value={editor.fileUrl} onChange={(e) => setEditor({ ...editor, fileUrl: e.target.value })} placeholder="/docs/qfs-overview.pdf" />
          </Field>
          <div className="adm-grid-2">
            <Field label="Sort">
              <input className="adm-input" inputMode="numeric" value={String(editor.sort)} onChange={(e) => setEditor({ ...editor, sort: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Status">
              <select className="adm-select" value={editor.isActive ? "active" : "disabled"} onChange={(e) => setEditor({ ...editor, isActive: e.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </Field>
          </div>
          <div className="adm-row-end">
            <button className="adm-btn ghost" onClick={() => setEditor(null)} disabled={busy}>
              Cancel
            </button>
            <button className="adm-btn primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editor.isNew ? "Create" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Confirm
          title={`Delete "${deleteTarget.code}"?`}
          text="This permanently removes the document from the platform."
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}