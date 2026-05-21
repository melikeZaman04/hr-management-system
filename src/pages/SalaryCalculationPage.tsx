import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { calcSalary } from '../features/salary/salaryService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Field, Input, Select, Textarea } from '../components/ui/Field'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export function SalaryCalculationPage() {
  const [searchParams] = useSearchParams()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [empId, setEmpId] = useState(searchParams.get('employee_id') ?? '')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [unpaidDays, setUnpaidDays] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    void getEmployees().then(emps => {
      setEmployees(emps)
      if (!empId && emps.length > 0) setEmpId(emps[0].id)
    }).catch(() => null)
  }, [])

  const emp = employees.find(e => e.id === empId)
  const base = emp?.base_salary ?? 0
  const { monthlyBase, daily, deduction, total } = calcSalary(base, unpaidDays)

  const activeEmployees = employees.filter(e => e.employment_status === 'active')

  return (
    <>
      <PageHeader
        eyebrow="Payroll"
        title="Salary calculation"
        subtitle="Estimate an employee's monthly pay after unpaid leave. Internal use only — not a legal payroll document."
        actions={
          <>
            <Button variant="secondary" icon="download">Export PDF</Button>
            <Button variant="primary" icon="check">Save calculation</Button>
          </>
        }
      />

      <div className="alert alert--info" style={{ marginBottom: 'var(--sp-6)' }}>
        <Icon name="info" size={14} />
        <div>This module is for internal estimation. Final payroll is handled in your accounting system.</div>
      </div>

      <div className="calc">
        <div className="calc__head">
          <div className="row gap-3">
            <Icon name="wallet" size={14} className="text-ter" />
            <strong style={{ fontSize: 'var(--fs-14)' }}>Estimate for</strong>
            <Badge tone="info" dot={false}>{MONTHS[month - 1]} {year}</Badge>
          </div>
          <div className="text-ter" style={{ fontSize: 'var(--fs-12)' }}>Last saved: never</div>
        </div>

        <div className="calc__body">
          <div className="calc__inputs">
            <Field label="Employee" required htmlFor="emp">
              <Select id="emp" value={empId} onChange={e => setEmpId(e.target.value)}>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid--2">
              <Field label="Month" required htmlFor="mo">
                <Select id="mo" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </Select>
              </Field>
              <Field label="Year" required htmlFor="yr">
                <Select id="yr" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Annual base salary" hint="Sourced from employee record" htmlFor="base">
              <Input id="base" addon="USD" value={base.toLocaleString()} readOnly />
            </Field>

            <Field label="Unpaid leave days" hint="Used to calculate the deduction below" htmlFor="days">
              <Input id="days" addon="days" type="number" min="0" value={unpaidDays} onChange={e => setUnpaidDays(Number(e.target.value))} />
            </Field>

            <Field label="Notes (optional)" htmlFor="notes">
              <Textarea id="notes" placeholder="e.g. Adjustment approved by manager for unpaid family leave." value={notes} onChange={e => setNotes(e.target.value)} />
            </Field>
          </div>

          <div className="calc__summary">
            {emp ? (
              <div className="row gap-3">
                <Avatar name={emp.full_name} size="md" />
                <div className="col">
                  <strong>{emp.full_name}</strong>
                  <span className="text-ter" style={{ fontSize: 'var(--fs-12)' }}>{emp.position} · {emp.department}</span>
                </div>
              </div>
            ) : (
              <div className="text-ter">Select an employee</div>
            )}
            <div className="calc__divider" />
            <div className="calc__row"><span className="calc__row-label">Annual base</span><span className="calc__row-value">{fmtCurrency(base)}</span></div>
            <div className="calc__row"><span className="calc__row-label">Monthly base ({MONTHS[month - 1]})</span><span className="calc__row-value">{fmtCurrency(monthlyBase)}</span></div>
            <div className="calc__row"><span className="calc__row-label">Approx. daily rate</span><span className="calc__row-value">{fmtCurrency(daily)}</span></div>
            <div className="calc__row">
              <span className="calc__row-label">Unpaid leave deduction ({unpaidDays}d)</span>
              <span className="calc__row-value" style={{ color: deduction ? 'var(--status-danger-fg)' : undefined }}>
                {deduction ? `-${fmtCurrency(deduction)}` : '—'}
              </span>
            </div>
            <div className="calc__divider" />
            <div className="calc__total">
              <span className="calc__total-l">Calculated salary</span>
              <span className="calc__total-v">{fmtCurrency(total)}</span>
            </div>
            <div className="calc__note">
              Calculation uses 22 working days per month. Not a legal payroll output; verify with your accounting system.
            </div>
          </div>
        </div>
      </div>

      <Panel
        title="Recent calculations"
        actions={<Button variant="ghost" size="sm" iconRight="arrowRight">View all</Button>}
        foot={<><span>Recent calculations will appear here once saved</span><span /></>}
        style={{ marginTop: 'var(--sp-6)' } as React.CSSProperties}
      >
        <div className="state" style={{ padding: 'var(--sp-8)' }}>
          <div className="state__desc">No saved calculations yet</div>
        </div>
      </Panel>
    </>
  )
}
