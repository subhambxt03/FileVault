import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { listWebhooks, createWebhook, deleteWebhook } from "../services/webhooks";
import { extractError } from "../api/client";
import Toast from "../components/Toast.jsx";
import { formatDate } from "../utils/format";

const SAMPLE_COMPLETED = `{
  "event": "file.processing.completed",
  "job_id": "JOB-123",
  "filename": "resume.pdf",
  "status": "DONE",
  "download_url": "signed-url"
}`;

export default function Webhooks() {
  const [hooks, setHooks] = useState([]);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const load = () => listWebhooks().then(setHooks);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    try {
      await createWebhook(url);
      setUrl("");
      setOk("Webhook added.");
      load();
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete webhook?")) return;
    await deleteWebhook(id);
    load();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-semibold">Webhooks</h1>
      <p className="text-sm text-slate-400">
        Receive POST callbacks when files finish processing or fail.
      </p>

      {err && <Toast tone="error">{err}</Toast>}
      {ok && <Toast tone="success">{ok}</Toast>}

      <form onSubmit={add} className="card p-5 flex flex-col sm:flex-row gap-3">
        <input
          className="input flex-1"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button className="btn-primary" type="submit"><Plus size={16} /> Add Webhook</button>
      </form>

      <div className="space-y-2">
        {hooks.map((h) => (
          <div key={h.id} className="card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm">{h.url}</p>
              <p className="text-xs text-slate-500">Added {formatDate(h.created_at)}</p>
            </div>
            <button onClick={() => remove(h.id)} className="p-2 rounded hover:bg-slate-800 text-red-300">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {hooks.length === 0 && <p className="text-slate-500">No webhooks configured.</p>}
      </div>

      <div className="card p-5">
        <p className="font-medium">Example payload — completed</p>
        <pre className="mt-3 text-xs bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-slate-300">
{SAMPLE_COMPLETED}
        </pre>
      </div>
    </div>
  );
}