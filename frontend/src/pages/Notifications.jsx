import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCcw, Webhook } from "lucide-react";
import { listNotifications, markAllRead, markRead } from "../services/notifications";
import { formatDate } from "../utils/format";

const ICONS = {
  FILE_COMPLETED: { icon: CheckCircle2, color: "text-emerald-300" },
  FILE_FAILED: { icon: AlertTriangle, color: "text-red-300" },
  FILE_RETRY: { icon: RefreshCcw, color: "text-amber-300" },
  WEBHOOK_SUCCESS: { icon: Webhook, color: "text-indigo-300" },
  WEBHOOK_FAILED: { icon: Webhook, color: "text-red-300" },
};

export default function Notifications() {
  const [data, setData] = useState({ items: [], unread: 0, total: 0 });

  const load = () => listNotifications().then(setData);
  useEffect(() => { load(); }, []);

  const read = async (id) => { await markRead(id); load(); };
  const readAll = async () => { await markAllRead(); load(); };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-slate-400">{data.unread} unread</p>
        </div>
        {data.unread > 0 && (
          <button onClick={readAll} className="btn-ghost">Mark all as read</button>
        )}
      </div>

      <div className="space-y-2">
        {data.items.map((n) => {
          const { icon: Icon, color } = ICONS[n.type] || { icon: Webhook, color: "text-slate-300" };
          return (
            <div
              key={n.id}
              onClick={() => !n.is_read && read(n.id)}
              className={`card p-4 flex items-start gap-3 cursor-pointer ${
                n.is_read ? "opacity-70" : "border-indigo-500/40"
              }`}
            >
              <Icon size={18} className={color} />
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-400 mt-2" />}
            </div>
          );
        })}
        {data.items.length === 0 && <p className="text-slate-500">No notifications yet.</p>}
      </div>
    </div>
  );
}