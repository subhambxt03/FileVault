
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Download,
  UploadCloud, Copy, FileText, FileType, Image as ImageIcon, FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import StatusBadge from "../components/StatusBadge.jsx";
import { getJob, getDownload } from "../services/jobs";
import { api, extractError } from "../api/client";
import Toast from "../components/Toast.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STEPS = ["Queued", "Processing", "Completed"];

function resolve(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

export default function JobDetails() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewErr, setPreviewErr] = useState("");

  useEffect(() => {
    let alive = true;
    let timer = null;

    const load = async () => {
      try {
        const j = await getJob(id);
        if (!alive) return;
        setJob(j);
        if (j.status === "DONE" || j.status === "FAILED") {
          if (timer) clearInterval(timer);
        }
      } catch (e) {
        if (alive) setErr(extractError(e));
      }
    };

    load();
    timer = setInterval(load, 3000);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    if (!job || job.status !== "DONE") return;
    api
      .get(`/jobs/${job.id}/preview`)
      .then((r) => setPreview(r.data))
      .catch((e) => setPreviewErr(e?.response?.data?.detail || "Preview unavailable."));
  }, [job?.id, job?.status]);

  const copyJobId = async () => {
    try {
      await navigator.clipboard.writeText(`JOB-${job.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const downloadResult = async () => {
    setBusy(true);
    try {
      const r = await getDownload(id);
      r.urls.forEach((u) => window.open(u, "_blank"));
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  const buildPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FileFlow — Processed Result", margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`File: ${job.original_filename}`, margin, y); y += 16;
    doc.text(`Job ID: JOB-${job.id}`, margin, y); y += 16;
    doc.text(`Type: ${job.processing_type}`, margin, y); y += 16;
    doc.text(`Completed: ${job.completed_at || "-"}`, margin, y); y += 22;

    if (preview?.type === "text") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Top Words", margin, y); y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      preview.words.slice(0, 5).forEach((w, i) => {
        doc.text(`${i + 1}. ${w.word} — ${w.count}`, margin + 10, y);
        y += 16;
      });
    } else if (preview?.type === "pdf") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Extracted Text", margin, y); y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(preview.text || "", 515);
      lines.slice(0, 40).forEach((line) => {
        if (y > 780) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 14;
      });
    } else if (preview?.type === "image") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Image Variants", margin, y); y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      preview.variants.forEach((v) => {
        doc.text(`${v.label} — max width ${v.width}px`, margin + 10, y);
        y += 16;
      });
    }

    doc.save(`fileflow-JOB-${job.id}.pdf`);
  };

  if (err && !job) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <BackLink />
        <Toast tone="error">{err}</Toast>
      </div>
    );
  }

  if (!job) return <p className="text-slate-400 p-6">Loading…</p>;

  const activeStep =
    job.status === "QUEUED" ? 0 :
    job.status === "PROCESSING" ? 1 :
    job.status === "DONE" ? 2 :
    job.status === "FAILED" ? 1 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <BackLink />
      <h1 className="text-xl sm:text-2xl font-semibold">Job Details</h1>

      {err && <Toast tone="error">{err}</Toast>}

      {/* =================== Two-column layout =================== */}
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        {/* ---------- LEFT COLUMN: 3 stacked cards ---------- */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* -------- Card 1: File header with DONE on the right -------- */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 grid place-items-center flex-shrink-0">
                <FileType size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{job.original_filename}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(job.file_size / (1024 * 1024)).toFixed(2)} MB · {job.processing_type.toUpperCase()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={job.status} />
              </div>
            </div>
          </div>

          {/* -------- Card 2: Timeline with connector lines -------- */}
          <div className="card p-4 sm:p-5 flex-1">
            <ol className="relative">
              {STEPS.map((s, i) => {
                const done = i <= activeStep && job.status !== "FAILED" ? true : i < activeStep;
                const failed = job.status === "FAILED" && i === activeStep;
                const active = i === activeStep && job.status !== "DONE" && job.status !== "FAILED";
                const times = [job.created_at, job.started_at, job.completed_at];
                const isLast = i === STEPS.length - 1;

                return (
                  <li key={s} className="relative flex items-start gap-4 pb-8 last:pb-0">
                    {/* Vertical connector line */}
                    {!isLast && (
                      <span
                        aria-hidden
                        className={`absolute left-[13px] top-7 bottom-0 w-px ${
                          done ? "bg-emerald-500/40" : "bg-slate-700"
                        }`}
                      />
                    )}

                    {/* Node */}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full grid place-items-center flex-shrink-0 ring-4 ring-slate-950 ${
                        failed ? "bg-red-500/20 text-red-300"
                        : done ? "bg-emerald-500/20 text-emerald-300"
                        : active ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {failed ? <AlertTriangle size={13} />
                        : done ? <CheckCircle2 size={13} />
                        : active ? <Loader2 size={13} className="animate-spin" />
                        : <UploadCloud size={13} />}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 pt-0.5">
                      <p className={`text-sm font-medium ${active ? "text-amber-300" : ""}`}>
                        {s}
                      </p>
                      {times[i] ? (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(times[i]).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-0.5">Pending</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* -------- Card 3: Processing time -------- */}
          {job.status === "DONE" && job.duration_seconds != null && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 grid place-items-center flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Processing time</p>
                  <p className="text-base font-semibold text-emerald-300">
                    {job.duration_seconds.toFixed(1)} seconds
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="space-y-4 min-w-0">
          {/* Job ID + Download */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-400">Job ID</p>
                <p className="font-mono text-sm">JOB-{job.id}</p>
              </div>
              <button
                onClick={copyJobId}
                className="btn-ghost text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <Copy size={13} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {job.status === "DONE" && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="font-medium mb-3">Download Result</p>
                <button
                  onClick={downloadResult}
                  disabled={busy}
                  className="btn-primary w-full justify-center"
                >
                  <Download size={14} />
                  {busy ? "Preparing…" : "Get Signed URL"}
                </button>
                <p className="text-center text-xs text-slate-500 mt-2">Valid for 1 hour</p>
              </div>
            )}
          </div>

          {/* Processing Output — compact */}
          {job.status === "DONE" && (
            <div className="card p-4 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="text-base font-semibold">Processing Output</h2>
                <button
                  onClick={buildPdf}
                  disabled={!preview}
                  className="btn-ghost text-xs flex items-center gap-1.5"
                >
                  <FileDown size={13} />
                  Download as PDF
                </button>
              </div>

              {previewErr && <p className="text-sm text-slate-400">{previewErr}</p>}

              {!previewErr && !preview && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Loading output…
                </div>
              )}

              {preview?.type === "text" && (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900/60 flex items-center gap-2 text-xs font-medium">
                    <FileText size={13} className="text-sky-400" />
                    Word Frequency (top 5)
                  </div>
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-slate-400">
                      <tr>
                        <th className="text-left px-3 py-1.5">Word</th>
                        <th className="text-right px-3 py-1.5">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.words.slice(0, 5).map((w) => (
                        <tr key={w.word} className="border-t border-slate-800">
                          <td className="px-3 py-1.5 truncate">{w.word}</td>
                          <td className="px-3 py-1.5 text-right text-slate-400">{w.count}</td>
                        </tr>
                      ))}
                      {preview.words.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-3 py-4 text-center text-slate-500">
                            No words found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {preview?.type === "pdf" && (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900/60 flex items-center gap-2 text-xs font-medium">
                    <FileType size={13} className="text-red-400" />
                    Extracted Text (PDF)
                  </div>
                  <div className="max-h-48 overflow-y-auto p-3 bg-slate-900/30">
                    <pre className="text-xs whitespace-pre-wrap break-words text-slate-300 font-mono">
                      {preview.text || "(no text extracted)"}
                    </pre>
                  </div>
                </div>
              )}

              {preview?.type === "image" && (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900/60 flex items-center gap-2 text-xs font-medium">
                    <ImageIcon size={13} className="text-indigo-400" />
                    Generated Sizes
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {preview.variants.map((v) => (
                      <div key={v.label} className="text-center">
                        <img
                          src={resolve(v.url)}
                          alt={v.label}
                          className="w-full h-20 object-cover bg-slate-900 rounded-lg"
                          loading="lazy"
                        />
                        <p className="mt-1.5 text-xs font-medium capitalize">{v.label}</p>
                        <p className="text-[10px] text-slate-400">{v.width}px</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-width state cards when job is not DONE */}
      {job.status === "FAILED" && (
        <div className="card p-4 sm:p-5 border-red-500/40">
          <p className="font-medium text-red-300">Processing failed</p>
          <p className="text-sm text-slate-300 mt-2">{job.error_message || "Unknown error."}</p>
          <p className="text-xs text-slate-500 mt-3">Retries attempted: {job.retry_count}/3</p>
        </div>
      )}

      {job.status === "QUEUED" && (
        <div className="card p-4 sm:p-5 text-sm text-slate-400">
          Your file is waiting to be processed.
        </div>
      )}
      {job.status === "PROCESSING" && (
        <div className="card p-4 sm:p-5 text-sm text-slate-400 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Your file is currently being processed.
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/jobs"
      className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition"
    >
      <ArrowLeft size={14} /> Back to Jobs
    </Link>
  );
}
