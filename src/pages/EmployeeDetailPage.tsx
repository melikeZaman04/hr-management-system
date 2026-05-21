import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeById, type EmployeeDetail } from '../features/employees/employeeService'

const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US').format(new Date(value))
}

export function EmployeeDetailPage() {
  const { id } = useParams()
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEmployee() {
      if (!id) {
        setErrorMessage('Employee id is missing from the route.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage(null)
        const employeeRecord = await getEmployeeById(id)

        if (isMounted) {
          setEmployee(employeeRecord)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Employee could not be loaded.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadEmployee()

    return () => {
      isMounted = false
    }
  }, [id])

  return (
    <div className="page">
      <div className="page-heading">
        <p className="eyebrow">Employee Profile</p>
        <h2>{employee?.full_name ?? 'Employee Detail'}</h2>
        <p>Review employee profile information from the Supabase employees table.</p>
      </div>

      <section className="data-panel" aria-labelledby="employee-detail-title">
        <div className="panel-heading">
          <div>
            <h3 id="employee-detail-title">Profile Details</h3>
            <p>{id ? `Record id: ${id}` : 'No employee selected'}</p>
          </div>
          <Link className="text-action" to="/employees">
            Back to employees
          </Link>
        </div>

        {isLoading ? (
          <div className="state-box">Loading employee...</div>
        ) : errorMessage ? (
          <div className="state-box state-box-error" role="alert">
            {errorMessage}
          </div>
        ) : !employee ? (
          <div className="state-box">No employee was found for this id.</div>
        ) : (
          <div className="detail-grid">
            <div className="detail-item">
              <span>Full name</span>
              <strong>{employee.full_name}</strong>
            </div>
            <div className="detail-item">
              <span>Email</span>
              <strong>{employee.email}</strong>
            </div>
            <div className="detail-item">
              <span>Phone</span>
              <strong>{employee.phone ?? '-'}</strong>
            </div>
            <div className="detail-item">
              <span>Department</span>
              <strong>{employee.department ?? '-'}</strong>
            </div>
            <div className="detail-item">
              <span>Position</span>
              <strong>{employee.position ?? '-'}</strong>
            </div>
            <div className="detail-item">
              <span>Status</span>
              <strong>{employee.employment_status}</strong>
            </div>
            <div className="detail-item">
              <span>Start date</span>
              <strong>{formatDate(employee.start_date)}</strong>
            </div>
            <div className="detail-item">
              <span>Base salary</span>
              <strong>{amountFormatter.format(employee.base_salary)}</strong>
            </div>
            <div className="detail-item">
              <span>Created</span>
              <strong>{formatDate(employee.created_at)}</strong>
            </div>
            <div className="detail-item">
              <span>Updated</span>
              <strong>{formatDate(employee.updated_at)}</strong>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
