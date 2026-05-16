type StatCardProps = {
  label: string
  value: string
  helperText: string
}

export function StatCard({ label, value, helperText }: StatCardProps) {
  return (
    <section className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helperText}</span>
    </section>
  )
}
