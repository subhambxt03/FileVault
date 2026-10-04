import { Link } from "react-router-dom";
import {
  UploadCloud, Cpu, Database, ShieldCheck, RefreshCcw, Webhook, FileText, Image as ImageIcon, FileType,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="font-bold text-lg">File<span className="text-indigo-400">Flow</span></div>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="inline-block text-xs uppercase tracking-widest text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full mb-6">
            Asynchronous file processing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Upload once. <span className="text-indigo-400">Process in the background.</span>
          </h1>
          <p className="mt-5 text-slate-300 max-w-xl">
            FileFlow processes images, PDFs, and text asynchronously using reliable background
            workers, automatic retries, and secure cloud storage.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">Start Processing</Link>
            <Link to="/dashboard" className="btn-ghost">View Dashboard</Link>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs uppercase text-slate-400 mb-4">Pipeline</p>
          <div className="space-y-3">
            {[
              { icon: UploadCloud, label: "Upload" },
              { icon: Cpu, label: "Queue" },
              { icon: RefreshCcw, label: "Worker" },
              { icon: Database, label: "Cloud Storage" },
              { icon: ShieldCheck, label: "Signed Result" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 grid place-items-center text-indigo-300">
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{label}</p>
                </div>
                <span className="text-xs text-slate-500">step {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-6">Supported files</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: ImageIcon, title: "Images", body: "JPG, PNG, WEBP — auto-resized to small / medium / large." },
            { icon: FileType, title: "PDF", body: "Extract plain text from every page." },
            { icon: FileText, title: "Text", body: "TXT — compute word frequency." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <Icon size={20} className="text-indigo-300" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="text-sm text-slate-400 mt-1">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
        {[
          { title: "Fast uploads", body: "API returns a job ID instantly — no waiting." },
          { title: "Background processing", body: "Celery + Redis process files off the request path." },
          { title: "Automatic retries", body: "Exponential backoff, up to three attempts." },
          { title: "Secure storage", body: "S3-compatible object storage — never the local disk." },
          { title: "Signed URLs", body: "Time-limited download links, credentials never leave the server." },
          { title: "Webhook notifications", body: "POST payloads on completion or failure." },
        ].map(({ title, body }) => (
          <div key={title} className="card p-5">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-slate-400 mt-1">{body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-6">How it works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {["Upload", "Queue", "Process", "Download"].map((step, i) => (
            <div key={step} className="card p-5">
              <p className="text-xs text-slate-500">Step {i + 1}</p>
              <p className="mt-1 font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to automate your file processing?</h2>
          <div className="mt-5">
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-sm text-slate-500 flex items-center justify-between">
        <span>© FileFlow</span>
        <span className="flex items-center gap-2">
          <Webhook size={14} /> Webhooks · Signed URLs · Retries
        </span>
      </footer>
    </div>
  );
}