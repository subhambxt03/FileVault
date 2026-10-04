export default function Toast({ tone = "info", children }) {
  const tones = {
    info: "border-indigo-500/40 bg-indigo-500/10 text-indigo-100",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/40 bg-red-500/10 text-red-100",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}