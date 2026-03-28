export default function StatCard({ title, value, hint, positive, icon }) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <span className="stat-title">{title}</span>
        {icon && <span className="icon-badge">{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className={positive === undefined ? "stat-hint" : positive ? "stat-hint positive" : "stat-hint negative"}>{hint}</div>}
    </div>
  );
}
