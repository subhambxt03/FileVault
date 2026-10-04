export default function Spinner({ size = 20 }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400"
      style={{ width: size, height: size }}
    />
  );
}