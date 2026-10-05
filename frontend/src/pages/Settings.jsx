import { useEffect, useMemo, useRef, useState } from "react";
import {
  User as UserIcon, Lock, ShieldCheck, Smartphone, KeyRound,
  Cloud, Sun, Moon, Monitor, HardDrive, Check, X,
  Chrome, Github, Slack, Boxes, ArrowRight, Camera, Trash2,
} from "lucide-react";
import { useAuth, applyTheme } from "../context/AuthContext.jsx";
import { api, extractError } from "../api/client";
import { getStatistics } from "../services/statistics";
import { formatBytes, formatDate } from "../utils/format";
import Toast from "../components/Toast.jsx";
import Spinner from "../components/Spinner.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function resolveAvatar(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const INTEGRATION_ICONS = {
  google: { icon: Chrome, color: "text-amber-500" },
  dropbox: { icon: Boxes, color: "text-sky-500" },
  github: { icon: Github, color: "text-slate-700" },
  slack: { icon: Slack, color: "text-pink-500" },
};

export default function Settings() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStatistics().then(setStats).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 min-w-0">
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">Manage your account, security, and preferences.</p>
      </div>

      <ProfileSection user={user} setUser={setUser} />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <SecuritySection />
        <IntegrationsSection user={user} setUser={setUser} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <StorageSection stats={stats} />
        <AppearanceSection user={user} setUser={setUser} />
      </div>
    </div>
  );
}

/* ------------------------------- Profile ------------------------------- */

function ProfileSection({ user, setUser }) {
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    bio: user.bio || "",
    location: user.location || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [imgBust, setImgBust] = useState(Date.now());
  const fileRef = useRef(null);

  const avatarSrc = useMemo(() => {
    const url = resolveAvatar(user.avatar_url);
    return url ? `${url}?v=${imgBust}` : null;
  }, [user.avatar_url, imgBust]);

  const initials = useMemo(() => {
    const parts = (user.name || "U").split(" ").filter(Boolean);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
  }, [user.name]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      const r = await api.patch("/auth/me", form);
      setUser(r.data);
      setToast({ tone: "success", msg: "Profile updated." });
    } catch (e) {
      setToast({ tone: "error", msg: extractError(e) });
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setToast({ tone: "error", msg: "Avatar must be 2 MB or smaller." });
      return;
    }
    setUploading(true);
    setToast(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await api.post("/auth/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(r.data);
      setImgBust(Date.now());
      setToast({ tone: "success", msg: "Avatar updated." });
    } catch (e) {
      setToast({ tone: "error", msg: extractError(e) });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!confirm("Remove your profile photo?")) return;
    setUploading(true);
    try {
      const r = await api.delete("/auth/me/avatar");
      setUser(r.data);
      setImgBust(Date.now());
    } catch (e) {
      setToast({ tone: "error", msg: extractError(e) });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="card p-4 sm:p-6 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <UserIcon size={18} className="flex-shrink-0" />
            <span className="truncate">Profile Information</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-snug">
            Update your account details and profile picture.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary !px-3 !py-1.5 text-xs flex-shrink-0 self-start"
        >
          {saving ? <Spinner size={12} /> : "Save"}
        </button>
      </div>

      {toast && <div className="mt-4"><Toast tone={toast.tone}>{toast.msg}</Toast></div>}

      <div className="grid md:grid-cols-[180px_1fr] gap-6 mt-6 min-w-0">
        <div className="flex flex-col items-center text-center gap-3 min-w-0">
          <div className="relative">
            {avatarSrc ? (
              <img
                key={imgBust}
                src={avatarSrc}
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-indigo-500/40"
                onError={() => setToast({ tone: "error", msg: "Could not load avatar." })}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-3xl font-semibold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 grid place-items-center hover:bg-slate-700 transition disabled:opacity-50"
              title="Change photo"
            >
              {uploading ? <Spinner size={12} /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPhoto}
            />
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => fileRef.current?.click()} className="btn-ghost text-sm">
              Change Photo
            </button>
            {user.avatar_url && (
              <button onClick={removePhoto} className="btn-ghost text-sm text-red-400" title="Remove photo">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 space-y-1 mt-1">
            {user.location && <p className="break-words">📍 {user.location}</p>}
            <p>📅 Joined {formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 min-w-0">
          <Field label="Full Name">
            <input className="input" value={form.name} onChange={update("name")} />
          </Field>
          <Field label="Email Address">
            <input className="input opacity-60 cursor-not-allowed" value={user.email} readOnly />
          </Field>
          <Field label="Username">
            <input className="input" value={form.username} onChange={update("username")} placeholder="e.g. shubham_bisht" />
          </Field>
          <Field label="Bio">
            <textarea
              className="input min-h-[80px] resize-none break-words"
              maxLength={160}
              value={form.bio}
              onChange={update("bio")}
              placeholder="Tell us about yourself…"
            />
            <p className="text-[11px] text-slate-500 mt-1 text-right">{form.bio.length}/160</p>
          </Field>
          <Field label="Location" className="sm:col-span-2">
            <input className="input" value={form.location} onChange={update("location")} placeholder="e.g. Almora, Uttarakhand" />
          </Field>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Security ------------------------------ */

function SecuritySection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="card p-4 sm:p-6 min-w-0">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ShieldCheck size={18} className="flex-shrink-0" /> Security
      </h2>
      <p className="text-sm text-slate-400 mt-1">Keep your account safe and secure.</p>

      <ul className="mt-5 space-y-3">
        <Row
          icon={Lock}
          title="Change Password"
          desc="Update your password regularly."
          onClick={() => setOpen(true)}
          actionLabel="Change"
        />
        <Row
          icon={Smartphone}
          title="Two-Factor Authentication (2FA)"
          desc="Add an extra layer of security to your account."
          badge="Coming soon"
          disabled
        />
        <Row
          icon={KeyRound}
          title="Login Sessions"
          desc="Manage your active devices and sessions."
          badge="Coming soon"
          disabled
        />
      </ul>

      {open && <ChangePasswordModal onClose={() => setOpen(false)} />}
    </section>
  );
}

function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (next.length < 8) return setErr("New password must be at least 8 characters.");
    if (next !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      setOk(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center px-3 sm:px-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="card p-5 sm:p-6 w-full max-w-md space-y-4 min-w-0"
      >
        <h3 className="text-lg font-semibold">Change Password</h3>
        {err && <Toast tone="error">{err}</Toast>}
        {ok && <Toast tone="success">Password updated.</Toast>}
        <Field label="Current password">
          <input className="input" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password">
          <input className="input" type="password" required value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirm new password">
          <input className="input" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">
            {busy ? <Spinner size={14} /> : "Update password"}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost justify-center">Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------------- Integrations ---------------------------- */

function IntegrationsSection({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [setupFor, setSetupFor] = useState(null);

  const load = () =>
    api.get("/integrations").then((r) => setItems(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const connect = async (provider) => {
    setBusy(provider);
    setErr("");
    try {
      const r = await api.post(`/integrations/${provider}/connect`);
      window.location.href = r.data.authorize_url;
    } catch (e) {
      setSetupFor({ provider, message: extractError(e) });
    } finally {
      setBusy(null);
    }
  };

  const demoConnect = async (provider) => {
    setBusy(provider);
    try {
      await api.post(`/integrations/${provider}/demo-connect`);
      await load();
      const me = await api.get("/auth/me");
      setUser(me.data);
      setSetupFor(null);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (provider) => {
    setBusy(provider);
    try {
      await api.delete(`/integrations/${provider}`);
      await load();
      const me = await api.get("/auth/me");
      setUser(me.data);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card p-4 sm:p-6 min-w-0">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Boxes size={18} className="flex-shrink-0" /> Integrations
      </h2>
      <p className="text-sm text-slate-400 mt-1">Connect with third-party services to enhance your workflow.</p>

      {err && <div className="mt-4"><Toast tone="error">{err}</Toast></div>}

      <ul className="mt-5 space-y-2">
        {items.map((it) => {
          const style = INTEGRATION_ICONS[it.id] || { icon: Boxes, color: "text-indigo-400" };
          const Icon = style.icon;
          return (
            <li key={it.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 min-w-0">
              <div className={`w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-slate-100 dark:bg-slate-800/60 ${style.color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                  <span className="truncate">{it.name}</span>
                  {it.connected && (
                    <span className="flex-shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-500">
                      Connected
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 truncate">{it.description}</p>
              </div>

              {it.connected ? (
                <button
                  onClick={() => disconnect(it.id)}
                  disabled={busy === it.id}
                  className="btn-ghost text-xs flex-shrink-0"
                >
                  {busy === it.id ? <Spinner size={12} /> : "Disconnect"}
                </button>
              ) : (
                <button
                  onClick={() => connect(it.id)}
                  disabled={busy === it.id}
                  className="btn-primary text-xs flex-shrink-0"
                >
                  {busy === it.id ? <Spinner size={12} /> : "Connect"}
                </button>
              )}
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-slate-500">Loading…</li>}
      </ul>

      {setupFor && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center px-3 sm:px-4" onClick={() => setSetupFor(null)}>
          <div className="card p-5 sm:p-6 w-full max-w-lg min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">OAuth not configured</h3>
              <button onClick={() => setSetupFor(null)} className="p-1 rounded hover:bg-slate-800/40 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-2 break-words">{setupFor.message}</p>
            <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto break-all">
              {setupFor.provider.toUpperCase()}_CLIENT_ID=...
              <br />
              {setupFor.provider.toUpperCase()}_CLIENT_SECRET=...
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Add these to <code>backend/.env</code>, then restart the backend.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button onClick={() => setSetupFor(null)} className="btn-ghost justify-center">Close</button>
              <button onClick={() => demoConnect(setupFor.provider)} className="btn-primary justify-center">
                Demo connect (dev only)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------- Storage ------------------------------ */

function StorageSection({ stats }) {
  const usedBytes = stats?.total_storage_bytes ?? 0;
  const limitBytes = 10 * 1024 * 1024 * 1024;
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));

  return (
    <section className="card p-4 sm:p-6 min-w-0">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <HardDrive size={18} className="flex-shrink-0" /> Storage
      </h2>
      <p className="text-sm text-slate-400 mt-1">Track your storage usage and manage files.</p>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm mb-2 gap-2 flex-wrap">
          <span className="break-words"><b>{formatBytes(usedBytes)}</b> of 10 GB used</span>
          <span className="text-slate-400">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 grid place-items-center flex-shrink-0">
            <Cloud size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Need more space?</p>
            <p className="text-xs text-slate-400">Upgrade to a Pro plan and get 100 GB of storage.</p>
          </div>
        </div>
        <button
          disabled
          className="btn-primary !px-3 !py-1.5 text-xs opacity-60 cursor-not-allowed self-start sm:self-auto sm:ml-auto flex-shrink-0"
          title="Coming soon"
        >
          Upgrade
        </button>
      </div>
    </section>
  );
}

/* ------------------------------ Appearance ----------------------------- */

function AppearanceSection({ user, setUser }) {
  const [current, setCurrent] = useState(user.theme || "dark");

  const pick = async (id) => {
    setCurrent(id);
    applyTheme(id);
    try {
      const r = await api.patch("/auth/me", { theme: id });
      setUser(r.data);
    } catch {
      // Local preference already applied
    }
  };

  return (
    <section className="card p-4 sm:p-6 min-w-0">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Sun size={18} className="flex-shrink-0" /> Appearance
      </h2>
      <p className="text-sm text-slate-400 mt-1">Customize how FileFlow looks on your device.</p>

      <p className="text-xs uppercase tracking-wider text-slate-400 mt-5 mb-2">Theme</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {THEMES.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => pick(id)}
              className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition min-w-0 ${
                active
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs sm:text-sm">{label}</span>
              {active && <Check size={12} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------- Helpers ------------------------------- */

function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="mt-1 min-w-0">{children}</div>
    </label>
  );
}

function Row({ icon: Icon, title, desc, onClick, badge, disabled, actionLabel }) {
  return (
    <li
      className={`flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 min-w-0 ${
        disabled ? "opacity-60" : "hover:border-slate-400 cursor-pointer"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-slate-100 dark:bg-slate-800/60 text-indigo-500">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{title}</p>
        <p className="text-xs text-slate-400 break-words">{desc}</p>
      </div>
      {badge ? (
        <span className="flex-shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-slate-400/40 text-slate-400">
          {badge}
        </span>
      ) : (
        actionLabel && (
          <span className="flex-shrink-0 text-xs text-indigo-500 flex items-center gap-1">
            {actionLabel} <ArrowRight size={12} />
          </span>
        )
      )}
    </li>
  );
}