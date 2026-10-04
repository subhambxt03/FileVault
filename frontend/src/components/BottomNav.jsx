import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, UploadCloud, Files, Bell, Settings,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/jobs", label: "Jobs", icon: Files },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden
                 border-t border-slate-200 dark:border-slate-800
                 bg-white/95 dark:bg-slate-950/95 backdrop-blur
                 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition ${
                  isActive
                    ? "text-indigo-500"
                    : "text-slate-500 dark:text-slate-400"
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}