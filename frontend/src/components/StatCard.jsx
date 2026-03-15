const icons = ["✦", "◌", "↗", "◎", "◐", "✳"];

export default function StatCard({ label, value, hint, index = 0 }) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">{icons[index % icons.length]}</div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        {hint ? <div className="stat-hint">{hint}</div> : null}
      </div>
    </div>
  );
}