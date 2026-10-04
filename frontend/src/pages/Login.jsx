import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { extractError } from "../api/client";
import Toast from "../components/Toast.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
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
          <p className="text-xs uppercase tracking-widest text-indigo-300">Welcome back</p>
          <h1 className="text-2xl font-semibold mt-1">Sign in to FileFlow</h1>
        </div>

        {err && <Toast tone="error">{err}</Toast>}

        <div>
          <label className="text-sm text-slate-300">Email</label>
          <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-300">Password</label>
          <div className="relative">
            <input
              className="input mt-1 pr-10"
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button disabled={loading} className="btn-primary w-full justify-center" type="submit">
          {loading ? <Spinner /> : "Sign in"}
        </button>

        <p className="text-sm text-slate-400 text-center">
          No account? <Link to="/register" className="text-indigo-300">Create one</Link>
        </p>
      </form>
    </div>
  );
}