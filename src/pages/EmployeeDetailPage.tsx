import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getEmployeeById, type EmployeeDetail } from '../features/employees/employeeService'
import { getLeaveRequestsForEmployee, type LeaveRequest } from '../features/leave/leaveRequestService'
import { getDevicesForEmployee, type Device } from '../features/devices/deviceService'
import { getDocumentsForEmployee, type Document } from '../features/documents/documentService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Tabs } from '../components/ui/Tabs'
import { DetailField } from '../components/ui/DetailField'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State'

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function tenure(startDate: string | null) {
  if (!startDate) return '—'
  const years = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
  return `${years}y`
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'overview'

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    if (!id) return
    let mounted = true
    void (async () => {
      try {
        setLoading(true)
        const [emp, lv, dv, dc] = await Promise.all([
          getEmployeeById(id),
          getLeaveRequestsForEmployee(id).catch(() => []),
          getDevicesForEmployee(id).catch(() => []),
          getDocumentsForEmployee(id).catch(() => []),
        ])
        if (!mounted) return
        setEmployee(emp)
        setLeaves(lv)
        setDevices(dv)
        setDocuments(dc)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load employee.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) return <LoadingState />
  if (error) return <ErrorState desc={error} action={<Button onClick={() => navigate('/employees')}>Back to employees</Button>} />
  if (!employee) return (
    <EmptyState icon="users" title="Employee not found" desc="They may have been removed or the link is incorrect." action={<Button variant="primary" onClick={() => navigate('/employees')}>Return to employees list</Button>} />
  )

  function setTab(t: string) {
    setSearchParams({ tab: t }, { replace: true })
  }

  return (
    <>
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => navigate('/employees')}>All employees</Button>
      </div>

      <div className="panel" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="panel__body" style={{ display: 'flex', gap: 'var(--sp-5)', alignItems: 'center', padding: 'var(--sp-6)' }}>
          <Avatar name={employee.full_name} size="xl" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row gap-3" style={{ marginBottom: 6 }}>
              <h2 style={{ fontSize: 'var(--fs-24)', letterSpacing: '-0.02em' }}>{employee.full_name}</h2>
              <StatusBadge status={employee.employment_status} />
            </div>
            <div className="row gap-4 text-sec" style={{ fontSize: 'var(--fs-13)', flexWrap: 'wrap' }}>
              {employee.position && <span className="row gap-2"><Icon name="briefcase" size={13} />{employee.position}</span>}
              {employee.department && <span className="row gap-2"><Icon name="building" size={13} />{employee.department}</span>}
              <span className="row gap-2"><Icon name="mail" size={13} />{employee.email}</span>
              {employee.phone && <span className="row gap-2"><Icon name="phone" size={13} />{employee.phone}</span>}
            </div>
          </div>
          <div className="row gap-2">
            <Button variant="secondary" icon="mail">Email</Button>
            <Button variant="secondary" icon="edit">Edit profile</Button>
            <Button variant="ghost" size="sm" icon="more" aria-label="More" />
          </div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'overview',  label: 'Overview' },
          { id: 'leave',     label: 'Leave',     count: leaves.length },
          { id: 'devices',   label: 'Devices',   count: devices.length },
          { id: 'documents', label: 'Documents', count: documents.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid grid--12-8" style={{ alignItems: 'start' }}>
          <Panel title="Employment details" padded>
            <div className="detail-grid">
              <DetailField label="Full name"          value={employee.full_name} />
              <DetailField label="Work email"         value={employee.email} mono />
              <DetailField label="Phone"              value={employee.phone ?? undefined} mono />
              <DetailField label="Department"         value={employee.department ?? undefined} />
              <DetailField label="Position"           value={employee.position ?? undefined} />
              <DetailField label="Start date"         value={fmtDate(employee.start_date)} mono />
              <DetailField label="Employment status"  value={<StatusBadge status={employee.employment_status} />} />
              <DetailField label="Base salary"        value={fmtCurrency(employee.base_salary)} mono />
              <DetailField label="Employee ID"        value={employee.id} mono muted />
            </div>
          </Panel>

          <div className="col gap-4">
            <Panel title="At a glance" padded>
              <div className="col gap-3">
                <div className="row row--between"><span className="text-ter">Tenure</span><span className="tabnum">{tenure(employee.start_date)}</span></div>
                <div className="row row--between"><span className="text-ter">Devices</span><span className="tabnum">{devices.length}</span></div>
                <div className="row row--between"><span className="text-ter">Documents</span><span className="tabnum">{documents.length}</span></div>
                <div className="row row--between"><span className="text-ter">Leave requests</span><span className="tabnum">{leaves.length}</span></div>
              </div>
            </Panel>
            <Panel title="Quick actions" padded>
              <div className="col gap-2">
                <Button variant="secondary" icon="calendar" block onClick={() => setTab('leave')}>Submit leave on behalf</Button>
                <Button variant="secondary" icon="wallet" block onClick={() => navigate(`/salary-calculation?employee_id=${employee.id}`)}>Calculate salary</Button>
                <Button variant="secondary" icon="laptop" block onClick={() => setTab('devices')}>Assign device</Button>
                <Button variant="danger" icon="x" block>Mark as inactive</Button>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <Panel title="Leave history" actions={<Button variant="primary" size="sm" icon="plus">New request</Button>}>
          {leaves.length === 0
            ? <EmptyState icon="calendar" title="No leave records yet" desc="Leave taken or requested by this employee will appear here." />
            : (
              <table className="table">
                <thead><tr><th>Type</th><th>Dates</th><th style={{ textAlign: 'right' }}>Days</th><th>Status</th><th>Reason</th></tr></thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id}>
                      <td><Badge tone="neutral" dot={false}>{l.leave_type}</Badge></td>
                      <td className="mono text-sec">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                      <td style={{ textAlign: 'right' }} className="tabnum">{l.total_days}</td>
                      <td><StatusBadge status={l.status} /></td>
                      <td className="text-sec">{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Panel>
      )}

      {tab === 'devices' && (
        <Panel title="Assigned devices" actions={<Button variant="primary" size="sm" icon="plus">Assign device</Button>}>
          {devices.length === 0
            ? <EmptyState icon="laptop" title="No devices assigned" desc="Assign a laptop, monitor, or phone to this employee." />
            : (
              <table className="table">
                <thead><tr><th>Device</th><th>Type</th><th>Serial</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.id}>
                      <td className="table__cell-name">{d.name}</td>
                      <td className="text-sec">{d.device_type}</td>
                      <td className="mono text-sec">{d.serial_number}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td style={{ textAlign: 'right' }}><Button variant="ghost" size="sm">Return</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Panel>
      )}

      {tab === 'documents' && (
        <Panel title="Documents" actions={<Button variant="primary" size="sm" icon="upload">Upload</Button>}>
          {documents.length === 0
            ? <EmptyState icon="document" title="No documents uploaded yet" desc="Contracts, IDs and tax forms will appear here once uploaded." />
            : (
              <table className="table">
                <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td><div className="row gap-2"><Icon name="paperclip" size={14} className="text-ter" /><span className="mono">{d.file_name}</span></div></td>
                      <td><Badge tone="info" dot={false}>{d.document_type}</Badge></td>
                      <td className="text-sec tabnum">{d.size}</td>
                      <td className="text-sec">{fmtDate(d.created_at)}</td>
                      <td style={{ textAlign: 'right' }}><Button variant="ghost" size="sm" icon="download">Download</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Panel>
      )}
    </>
  )
}

// suppress unused import
void PageHeader
