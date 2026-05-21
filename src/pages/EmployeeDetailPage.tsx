import { useParams } from 'react-router-dom'

export function EmployeeDetailPage() {
  const { id } = useParams()

  return (
    <div className="page">
      <div className="page-heading">
        <p className="eyebrow">Employee Profile</p>
        <h2>Employee Detail</h2>
        <p>Placeholder detail view for employee record {id ?? 'selected from the list'}.</p>
      </div>
    </div>
  )
}
