import { StatCard } from '../components/ui/StatCard'

export function DashboardPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <p className="eyebrow">Overview</p>
        <h2>Dashboard</h2>
        <p>Placeholder metrics for employees, leave requests, devices, and documents.</p>
      </div>
      <div className="stat-grid">
        <StatCard label="Employees" value="--" helperText="Connected later" />
        <StatCard label="Pending Leave" value="--" helperText="Connected later" />
        <StatCard label="Assigned Devices" value="--" helperText="Connected later" />
        <StatCard label="Documents" value="--" helperText="Connected later" />
      </div>
    </div>
  )
}
