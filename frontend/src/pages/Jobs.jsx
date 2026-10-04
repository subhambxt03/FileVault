import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, Trash2 } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import { listJobs, deleteJob, getDownload } from "../services/jobs";
import { formatBytes, formatDate, formatDuration } from "../utils/format";
import { extractError } from "../api/client";
import Toast from "../components/Toast.jsx";

const FILTERS = ["ALL", "QUEUED", "PROCESSING", "DONE", "FAILED"];

export default function Jobs() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  const load = () => {
    listJobs({ page, page_size: 10, status: filter, search: search || undefined })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e) => setErr(extractError(e)));
  };

  useEffect(load, [page, filter]);

  const download = async (id) => {
    try {
      const r = await getDownload(id);
      r.urls.forEach((u) => window.open(u, "_blank"));
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this job?")) return;
    await deleteJob(id);
    load();
  };

  const pages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">My Jobs</h1>
        <div className="flex items-center gap-2">
          <input
            className="input w-56"
            placeholder="Search filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
          />
        </div>
      </div>

      {err && <Toast tone="error">{err}</Toast>}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === f
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
                : "border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400 bg-slate-900/60">
              <tr>
                <th className="text-left px-4 py-3">File</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Uploaded</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Retries</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((j) => (
                <tr key={j.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 truncate max-w-[240px]">{j.original_filename}</td>
                  <td className="px-4 py-3 text-slate-400">{j.processing_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(j.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDuration(j.duration_seconds)}</td>
                  <td className="px-4 py-3 text-slate-400">{j.retry_count}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Link to={`/jobs/${j.id}`} className="p-2 inline-flex rounded hover:bg-slate-800"><Eye size={14} /></Link>
                    {j.status === "DONE" && (
                      <button onClick={() => download(j.id)} className="p-2 rounded hover:bg-slate-800"><Download size={14} /></button>
                    )}
                    <button onClick={() => remove(j.id)} className="p-2 rounded hover:bg-slate-800 text-red-300"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No jobs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-800">
          {items.map((j) => (
            <div key={j.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{j.original_filename}</p>
                <StatusBadge status={j.status} />
              </div>
              <p className="text-xs text-slate-400">
                {j.processing_type} · {formatBytes(j.file_size)} · {formatDate(j.created_at)}
              </p>
              <div className="flex gap-2">
                <Link to={`/jobs/${j.id}`} className="btn-ghost text-xs">Details</Link>
                {j.status === "DONE" && (
                  <button onClick={() => download(j.id)} className="btn-primary text-xs">Download</button>
                )}
                <button onClick={() => remove(j.id)} className="btn-ghost text-xs text-red-300">Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="p-6 text-center text-slate-500">No jobs found.</p>}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Page {page} of {pages}</span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost">Prev</button>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost">Next</button>
        </div>
      </div>
    </div>
  );
}