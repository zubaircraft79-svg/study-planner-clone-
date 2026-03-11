export default function StatCard({ label, value, hint }) {
  return (
    <div className="card stat-card">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}