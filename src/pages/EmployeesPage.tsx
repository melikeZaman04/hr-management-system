import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'

const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEmployees() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const employeeRecords = await getEmployees()

        if (isMounted) {
          setEmployees(employeeRecords)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Employees could not be loaded.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadEmployees()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page">
      <div className="page-heading">
        <p className="eyebrow">Employee Management</p>
        <h2>Employees</h2>
        <p>View employee records from the Supabase employees table.</p>
      </div>

      <section className="data-panel" aria-labelledby="employees-list-title">
        <div className="panel-heading">
          <div>
            <h3 id="employees-list-title">Employee List</h3>
            <p>{employees.length} records loaded</p>
          </div>
        </div>

        {isLoading ? (
          <div className="state-box">Loading employees...</div>
        ) : errorMessage ? (
          <div className="state-box state-box-error" role="alert">
            {errorMessage}
          </div>
        ) : employees.length === 0 ? (
          <div className="state-box">No employee records found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Base salary</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <Link className="table-link" to={`/employees/${employee.id}`}>
                        {employee.full_name}
                      </Link>
                    </td>
                    <td>{employee.email}</td>
                    <td>{employee.department ?? '-'}</td>
                    <td>{employee.position ?? '-'}</td>
                    <td>
                      <span className="status-pill">{employee.employment_status}</span>
                    </td>
                    <td>{amountFormatter.format(employee.base_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
