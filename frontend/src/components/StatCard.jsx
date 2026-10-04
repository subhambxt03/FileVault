export default function StatCard({ label, value, icon: Icon, tone = "indigo" }) {
  const toneMap = {
    indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-300",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-300",
    green: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    red: "from-red-500/20 to-red-500/5 text-red-300",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-300",
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value ?? "—"}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br ${toneMap[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}