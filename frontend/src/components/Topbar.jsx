import { Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function resolveAvatar(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

export default function Topbar() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/notifications").then((r) => setUnread(r.data.unread)).catch(() => {});
  }, []);

  const avatarSrc = resolveAvatar(user?.avatar_url);

  return (
    <header className="app-topbar flex items-center gap-3 px-4 py-3">
      <div className="md:hidden font-bold">
        File<span className="text-indigo-500">Flow</span>
      </div>
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input pl-9" placeholder="Search jobs…" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Link to="/notifications" className="app-topbar-icon relative">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] bg-indigo-500 text-white rounded-full px-1.5">
              {unread}
            </span>
          )}
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-slate-700"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-xs font-semibold">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-sm">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}