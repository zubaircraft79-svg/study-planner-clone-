export default function ProgressBar({ value, color = "#7f86ff" }) {
  return (
    <div className="progress">
      <span
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.95))`,
        }}
      />
    </div>
  );
}