import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud, X, CheckCircle2, ShieldCheck, Zap, FileText, Lock,
} from "lucide-react";
import { uploadFile } from "../services/jobs";
import { extractError } from "../api/client";
import Toast from "../components/Toast.jsx";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.txt";
const MAX_SIZE = 10 * 1024 * 1024;

const FEATURES = [
  { icon: ShieldCheck, title: "Secure Upload",    desc: "End-to-end encrypted file transfer." },
  { icon: Zap,         title: "Fast Processing",  desc: "Files are queued and handled quickly." },
  { icon: FileText,    title: "Multiple Formats", desc: "JPG, PNG, WEBP, PDF and TXT supported." },
  { icon: Lock,        title: "Privacy First",    desc: "Your files are never shared publicly." },
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => {
    setErr("");
    setJob(null);
    if (!f) return;
    if (f.size > MAX_SIZE) {
      setErr("File is too large. Maximum allowed size is 10 MB.");
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    pick(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const j = await uploadFile(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setJob(j);
      setFile(null);
      setProgress(0);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="
        min-h-[calc(100vh-8rem)]
        flex flex-col items-center justify-center
        px-4 py-8 gap-10
        md:justify-start md:pt-6 md:gap-8
      "
    >
      {/* ---------- Upload card ---------- */}
      <div className="w-full max-w-sm md:max-w-xl space-y-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Upload file</h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-1">
            Max 10 MB · JPG, JPEG, PNG, WEBP, PDF, TXT
          </p>
        </div>

        {err && <Toast tone="error">{err}</Toast>}

        {job && (
          <Toast tone="success">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>
                Upload successful — Job ID: <b>JOB-{job.id}</b> · Status:{" "}
                <b>{job.status}</b>
              </span>
              <Link
                to={`/jobs/${job.id}`}
                className="ml-auto text-indigo-200 underline whitespace-nowrap"
              >
                View Job
              </Link>
            </div>
          </Toast>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="
            card p-5 sm:p-6 border-dashed border-2 border-slate-700
            hover:border-indigo-500/60 transition text-center cursor-pointer
            md:p-10 md:hover:border-indigo-500 md:hover:shadow-lg md:hover:-translate-y-0.5
          "
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <UploadCloud
            size={26}
            className="mx-auto text-indigo-300 md:w-9 md:h-9"
          />
          <p className="mt-2 text-sm font-medium md:mt-3 md:text-base">
            Drop your file here
          </p>
          <p className="text-xs text-slate-400 md:text-sm">
            or click to choose a file
          </p>
        </div>

        {file && (
          <div className="card p-4 md:p-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium md:text-base">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400 md:text-sm">
                  {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 flex-shrink-0"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>

            {busy && (
              <div className="mt-3 h-1.5 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={submit}
                className="btn-primary text-sm md:text-base flex-1 justify-center"
              >
                {busy ? "Uploading…" : "Upload"}
              </button>
              <button
                disabled={busy}
                onClick={() => setFile(null)}
                className="btn-ghost text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Features grid ---------- */}
      <div className="w-full max-w-4xl md:max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="
              card p-3 sm:p-4 text-center flex flex-col items-center gap-2 min-w-0
              transition-all duration-200
              md:p-5
              md:hover:border-indigo-500/60
              md:hover:-translate-y-1
              md:hover:shadow-lg
              md:cursor-default
            "
          >
            <div
              className="
                w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-500/10
                flex items-center justify-center flex-shrink-0
                transition-transform duration-200
                md:w-12 md:h-12
                md:group-hover:scale-110
              "
            >
              <Icon size={18} className="text-indigo-300 md:w-5 md:h-5" />
            </div>
            <p className="text-xs sm:text-sm font-medium break-words md:text-base">
              {title}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 break-words md:text-sm">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}