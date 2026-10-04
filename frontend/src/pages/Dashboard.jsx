
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Files, Loader2, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getStatistics } from "../services/statistics";
import { listJobs } from "../services/jobs";
import { formatBytes, formatDate, formatDuration } from "../utils/format";

const COLORS = ["#6366f1", "#22d3ee", "#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    getStatistics().then(setStats).catch(() => {});
    listJobs({ page: 1, page_size: 6 }).then((r) => setJobs(r.items)).catch(() => {});
  }, []);

  const typeData = stats
    ? Object.entries(stats.file_type_distribution).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const sfData = stats
    ? [
        { name: "Success", value: stats.processing_success_failure.success },
        { name: "Failure", value: stats.processing_success_failure.failure },
      ]
    : [];

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Overview of your file processing activity.
          </p>
        </div>
        <Link
          to="/upload"
          className="btn-primary text-sm !px-3 !py-1.5 w-full sm:w-auto justify-center flex-shrink-0"
        >
          Upload file
        </Link>
      </div>

      {/* ---------- Stat cards ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total files" value={stats?.total_files} icon={Files} tone="indigo" />
        <StatCard label="Processing" value={stats?.processing} icon={Loader2} tone="amber" />
        <StatCard label="Completed" value={stats?.completed} icon={CheckCircle2} tone="green" />
        <StatCard label="Failed" value={stats?.failed} icon={XCircle} tone="red" />
      </div>

      {/* ---------- Uploads + Success/Failure ---------- */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 sm:p-5 lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium">Uploads (last 14 days)</p>
            <BarChart3 size={16} className="text-slate-500" />
          </div>
          <div className="h-56 sm:h-64 mt-4">
            <ResponsiveContainer>
              <LineChart data={stats?.uploads_per_day || []}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Line type="monotone" dataKey="uploads" stroke="#818cf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 sm:p-5 min-w-0">
          <p className="font-medium">Success vs failure</p>
          <div className="h-56 sm:h-64 mt-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sfData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {sfData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ---------- File type + Performance + Recent activity ---------- */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 sm:p-5 min-w-0">
          <p className="font-medium">File type distribution</p>
          <div className="h-52 sm:h-56 mt-4">
            <ResponsiveContainer>
              <BarChart data={typeData}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 sm:p-5 min-w-0">
          <p className="font-medium">Performance</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Success rate</span>
              <span>{stats?.success_rate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Avg processing time</span>
              <span>{formatDuration(stats?.avg_processing_time_seconds)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Storage used</span>
              <span>{formatBytes(stats?.total_storage_bytes)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Queued</span>
              <span>{stats?.queued ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5 min-w-0">
          <p className="font-medium flex items-center gap-2">
            <Clock size={14} /> Recent activity
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {jobs.slice(0, 6).map((j) => (
              <li key={j.id} className="flex items-center gap-2 min-w-0">
                <span className="truncate flex-1 text-slate-300">{j.original_filename}</span>
                <StatusBadge status={j.status} />
              </li>
            ))}
            {jobs.length === 0 && <li className="text-slate-500">No activity yet.</li>}
          </ul>
        </div>
      </div>

      {/* ---------- Recent jobs ---------- */}
      <div className="card p-4 sm:p-5 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium">Recent jobs</p>
          <Link to="/jobs" className="text-sm text-indigo-300">View all</Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left py-2">Filename</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Uploaded</th>
                <th className="text-left py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-slate-800">
                  <td className="py-2 pr-4 truncate max-w-[220px]">{j.original_filename}</td>
                  <td className="py-2 pr-4 text-slate-400">{j.processing_type}</td>
                  <td className="py-2 pr-4"><StatusBadge status={j.status} /></td>
                  <td className="py-2 pr-4 text-slate-400">{formatDate(j.created_at)}</td>
                  <td className="py-2 text-slate-400">{formatDuration(j.duration_seconds)}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-800">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to={`/jobs/${j.id}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{j.original_filename}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {j.processing_type} · {formatDate(j.created_at)}
                </p>
              </div>
              <StatusBadge status={j.status} />
            </Link>
          ))}
          {jobs.length === 0 && (
            <p className="py-6 text-center text-slate-500">No jobs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
