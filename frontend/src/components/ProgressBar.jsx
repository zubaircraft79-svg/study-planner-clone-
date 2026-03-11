export default function ProgressBar({ value, color = "#4F46E5" }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color }} />
    </div>
  );
}