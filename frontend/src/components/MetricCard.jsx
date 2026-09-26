export default function MetricCard({ label, value, description }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {description && (
        <span className="metric-description">{description}</span>
      )}
    </div>
  );
}
