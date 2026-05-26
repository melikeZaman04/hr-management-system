import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { StatCard } from '../components/ui/StatCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { getLeaveRequests, approveLeaveRequest, rejectLeaveRequest, type LeaveRequest } from '../features/leave/leaveRequestService'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [pendingLeave, setPendingLeave] = useState<LeaveRequest[]>([])

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'there'

  useEffect(() => {
    void getEmployees().then(setEmployees).catch(() => null)
    void getLeaveRequests({ status: 'pending' }).then(setPendingLeave).catch(() => null)
  }, [])

  const empMap = new Map(employees.map(e => [e.id, e]))

  async function handleApprove(id: string) {
    await approveLeaveRequest(id)
    setPendingLeave(prev => prev.filter(l => l.id !== id))
  }
  async function handleReject(id: string) {
    await rejectLeaveRequest(id)
    setPendingLeave(prev => prev.filter(l => l.id !== id))
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={`Good morning, ${firstName}`}
        subtitle="Here's what's waiting on you today across the team."
        actions={
          <>
            <Button variant="secondary" icon="download">Export report</Button>
            <Button variant="primary" icon="plus" onClick={() => navigate('/employees')}>Add employee</Button>
          </>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 'var(--sp-6)' }}>
        <StatCard label="Active employees" value={String(employees.filter(e => e.employment_status === 'active').length || '—')} icon="users" delta="+3 this month" deltaDir="up" sparkline="M0,18 L10,16 L20,17 L30,12 L40,13 L50,9 L60,10 L70,7 L80,5" />
        <StatCard label="Pending leave" value={String(pendingLeave.length || '—')} icon="calendar" delta="Awaiting decision" deltaDir="down" sparkline="M0,8 L10,12 L20,10 L30,14 L40,9 L50,15 L60,11 L70,16 L80,12" />
        <StatCard label="Devices assigned" value="—" icon="laptop" delta="+1 this week" deltaDir="up" sparkline="M0,14 L10,13 L20,12 L30,11 L40,11 L50,10 L60,8 L70,8 L80,7" />
        <StatCard label="Documents on file" value="—" icon="document" delta="6 added this month" deltaDir="up" sparkline="M0,16 L10,14 L20,15 L30,12 L40,13 L50,10 L60,11 L70,9 L80,8" />
      </div>

      <div className="grid grid--12-7" style={{ alignItems: 'start' }}>
        <Panel
          title={
            <>
              <Icon name="calendar" size={14} />
              <span>Leave awaiting your decision</span>
              {pendingLeave.length > 0 && <Badge tone="warning" dot>{pendingLeave.length} pending</Badge>}
            </>
          }
          actions={<Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => navigate('/leave-requests')}>View all</Button>}
        >
          {pendingLeave.length === 0 ? (
            <div className="state" style={{ padding: 'var(--sp-8)' }}>
              <div className="state__desc">No pending leave requests</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th style={{ textAlign: 'right' }}>Days</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {pendingLeave.slice(0, 4).map(l => {
                  const emp = empMap.get(l.employee_id)
                  return (
                    <tr key={l.id} onClick={() => navigate('/leave-requests')}>
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
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="sm" icon="check" onClick={() => handleApprove(l.id)}>Approve</Button>
                          <Button variant="ghost" size="sm" icon="x" onClick={() => handleReject(l.id)}>Reject</Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Panel>

        <div className="col gap-4">
          <Panel title={<><Icon name="sparkle" size={14} /><span>Recent activity</span></>} padded>
            <div className="state" style={{ padding: 'var(--sp-6)' }}>
              <div className="state__desc">Activity log coming soon</div>
            </div>
          </Panel>

          <Panel title="Quick actions" padded>
            <div className="col gap-2">
              <Button variant="secondary" icon="plus" block onClick={() => navigate('/employees')}>Add new employee</Button>
              <Button variant="secondary" icon="wallet" block onClick={() => navigate('/salary-calculation')}>Run salary calculation</Button>
              <Button variant="secondary" icon="laptop" block onClick={() => navigate('/devices')}>Assign a device</Button>
              <Button variant="secondary" icon="upload" block onClick={() => navigate('/documents')}>Upload document</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
