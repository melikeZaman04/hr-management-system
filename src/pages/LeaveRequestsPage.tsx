import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getLeaveRequests, approveLeaveRequest, rejectLeaveRequest, type LeaveRequest } from '../features/leave/leaveRequestService'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Tabs'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export function LeaveRequestsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusF = searchParams.get('status') ?? 'pending'
  const typeF = searchParams.get('type') ?? 'all'

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [lv, emps] = await Promise.all([getLeaveRequests(), getEmployees()])
      setRequests(lv)
      setEmployees(emps)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  const empMap = new Map(employees.map(e => [e.id, e]))

  const filtered = requests.filter(l => {
    if (statusF !== 'all' && l.status !== statusF) return false
    if (typeF !== 'all' && l.leave_type !== typeF) return false
    return true
  })

  const counts = {
    all: requests.length,
    pending:  requests.filter(l => l.status === 'pending').length,
    approved: requests.filter(l => l.status === 'approved').length,
    rejected: requests.filter(l => l.status === 'rejected').length,
  }

  function setStatus(s: string) { setSearchParams({ status: s, type: typeF }, { replace: true }) }
  function setType(t: string)   { setSearchParams({ status: statusF, type: t }, { replace: true }) }

  async function handleApprove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await approveLeaveRequest(id)
    setRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' as const } : l))
  }
  async function handleReject(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await rejectLeaveRequest(id)
    setRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' as const } : l))
  }

  return (
    <>
      <PageHeader
        eyebrow="Time off"
        title="Leave requests"
        subtitle="Review pending requests and keep the team's calendar up to date."
        actions={
          <>
            <Button variant="secondary" icon="download">Export</Button>
            <Button variant="primary" icon="plus">New request</Button>
          </>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 'var(--sp-6)' }}>
        <StatCard label="Pending"              value={String(counts.pending)}  icon="inbox" />
        <StatCard label="Approved this month"  value="—"                       icon="check" />
        <StatCard label="Rejected this month"  value="—"                       icon="x" />
        <StatCard label="Days planned"         value="—"                       icon="calendar" />
      </div>

      <Panel
        title={
          <Segmented
            value={statusF}
            onChange={setStatus}
            items={[
              { value: 'all',      label: 'All',      count: counts.all },
              { value: 'pending',  label: 'Pending',  count: counts.pending },
              { value: 'approved', label: 'Approved', count: counts.approved },
              { value: 'rejected', label: 'Rejected', count: counts.rejected },
            ]}
          />
        }
        actions={
          <div className="row gap-2">
            <select className="select" style={{ width: 160, height: 32, fontSize: 'var(--fs-13)' }} value={typeF} onChange={e => setType(e.target.value)}>
              <option value="all">All types</option>
              <option value="annual">Annual</option>
              <option value="unpaid">Unpaid</option>
              <option value="sick">Sick</option>
              <option value="other">Other</option>
            </select>
            <Button variant="ghost" size="sm" icon="filter">More filters</Button>
          </div>
        }
      >
        {loading ? (
          <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}</tbody></table>
        ) : error ? (
          <ErrorState desc={error} action={<Button onClick={load}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="calendar" title={`No ${statusF === 'all' ? '' : statusF} leave requests`} desc="When team members file leave, they'll show up here for your review." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th style={{ textAlign: 'right' }}>Days</th>
                <th>Reason</th>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const emp = empMap.get(l.employee_id)
                return (
                  <tr key={l.id} onClick={() => emp && navigate(`/employees/${emp.id}`)}>
                    <td>
                      <div className="table__cell-primary">
                        <Avatar name={emp?.full_name ?? ''} size="sm" />
                        <div className="table__cell-stack">
                          <span className="table__cell-name">{emp?.full_name ?? l.employee_id}</span>
                          <span className="table__cell-sub">{emp?.department ?? ''}</span>
                        </div>
                      </div>
                    </td>
                    <td><Badge tone="neutral" dot={false}>{l.leave_type}</Badge></td>
                    <td className="mono text-sec">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                    <td style={{ textAlign: 'right' }} className="tabnum">{l.total_days}</td>
                    <td className="text-sec" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                    <td className="text-ter mono">{fmtDate(l.created_at)}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      {l.status === 'pending' ? (
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="secondary" size="sm" icon="check" onClick={e => handleApprove(l.id, e)}>Approve</Button>
                          <Button variant="danger" size="sm" icon="x" onClick={e => handleReject(l.id, e)}>Reject</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" icon="more" className="table__action" aria-label="More" onClick={e => e.stopPropagation()} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  )
}

void Icon
