import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { extractError } from "../api/client";
import Toast from "../components/Toast.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password.length < 8) return setErr("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      nav("/dashboard");
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="card p-8 w-full max-w-md space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-300">New account</p>
          <h1 className="text-2xl font-semibold mt-1">Create your FileFlow account</h1>
        </div>

        {err && <Toast tone="error">{err}</Toast>}

        <div>
          <label className="text-sm text-slate-300">Name</label>
          <input className="input mt-1" required value={form.name} onChange={update("name")} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Email</label>
          <input className="input mt-1" type="email" required value={form.email} onChange={update("email")} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Password</label>
          <input className="input mt-1" type="password" required value={form.password} onChange={update("password")} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Confirm password</label>
          <input className="input mt-1" type="password" required value={form.confirm} onChange={update("confirm")} />
        </div>

        <button disabled={loading} className="btn-primary w-full justify-center" type="submit">
          {loading ? <Spinner /> : "Create account"}
        </button>

        <p className="text-sm text-slate-400 text-center">
          Already registered? <Link to="/login" className="text-indigo-300">Sign in</Link>
        </p>
      </form>
    </div>
  );
}