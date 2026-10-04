const MAP = {
  QUEUED: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  PROCESSING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  DONE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  FAILED: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function StatusBadge({ status }) {
  const cls = MAP[status] || "bg-slate-500/15 text-slate-300 border-slate-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-lg border ${cls}`}>
      {status}
    </span>
  );
}