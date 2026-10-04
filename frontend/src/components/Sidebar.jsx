import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, UploadCloud, Files, Bell, Webhook, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/jobs", label: "My Jobs", icon: Files },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="app-sidebar hidden md:flex md:w-60 flex-col p-4">
      <div className="px-2 pb-6">
        <p className="text-lg font-bold tracking-tight">
          File<span className="text-indigo-500">Flow</span>
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `app-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="app-nav-link mt-4 w-full"
      >
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );
}