import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevices, type Device } from '../features/devices/deviceService'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Tabs'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'

const DEVICE_ICON: Record<string, string> = { Phone: 'phone', Monitor: 'cube', Mouse: 'cube' }

export function DevicesPage() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusF, setStatusF] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [dv, emps] = await Promise.all([getDevices(), getEmployees()])
      setDevices(dv)
      setEmployees(emps)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load devices.')
    } finally {
      setLoading(false)
    }
  }

  const empMap = new Map(employees.map(e => [e.id, e]))

  const filtered = devices.filter(d => {
    if (statusF !== 'all' && d.status !== statusF) return false
    if (query && !`${d.name} ${d.serial_number} ${d.device_type}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const counts = {
    all: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    assigned:  devices.filter(d => d.status === 'assigned').length,
    returned:  devices.filter(d => d.status === 'returned').length,
    broken:    devices.filter(d => d.status === 'broken').length,
  }

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Devices"
        subtitle="Track company-owned hardware and who currently has it."
        actions={
          <>
            <Button variant="secondary" icon="download">Export</Button>
            <Button variant="primary" icon="plus">Add device</Button>
          </>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 'var(--sp-6)' }}>
        <StatCard label="Total devices"  value={String(counts.all)}       icon="cube" />
        <StatCard label="Assigned"       value={String(counts.assigned)}  icon="laptop" />
        <StatCard label="Available"      value={String(counts.available)} icon="check" />
        <StatCard label="Needs repair"   value={String(counts.broken)}    icon="alert" />
      </div>

      <Panel
        title={
          <Segmented
            value={statusF}
            onChange={setStatusF}
            items={[
              { value: 'all',       label: 'All',       count: counts.all },
              { value: 'available', label: 'Available', count: counts.available },
              { value: 'assigned',  label: 'Assigned',  count: counts.assigned },
              { value: 'returned',  label: 'Returned',  count: counts.returned },
              { value: 'broken',    label: 'Broken',    count: counts.broken },
            ]}
          />
        }
        actions={
          <div className="toolbar__search" style={{ width: 240 }}>
            <Icon name="search" size={14} />
            <input placeholder="Search by name or serial…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        }
      >
        {loading ? (
          <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
        ) : error ? (
          <ErrorState desc={error} action={<Button onClick={load}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="laptop" title="No devices match" desc="Try clearing the filters above." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Type</th>
                <th>Serial number</th>
                <th>Assigned to</th>
                <th>Status</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const owner = d.assignee_id ? empMap.get(d.assignee_id) : null
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="table__cell-primary">
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
                          <Icon name={(DEVICE_ICON[d.device_type] ?? 'laptop') as never} size={14} />
                        </div>
                        <div className="table__cell-stack">
                          <span className="table__cell-name">{d.name}</span>
                          <span className="table__cell-sub">{d.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sec">{d.device_type}</td>
                    <td className="mono text-sec">{d.serial_number}</td>
                    <td>
                      {owner ? (
                        <button className="row gap-2" onClick={() => navigate(`/employees/${owner.id}`)} style={{ cursor: 'pointer' }}>
                          <Avatar name={owner.full_name} size="sm" />
                          <span>{owner.full_name}</span>
                        </button>
                      ) : <span className="text-ter">—</span>}
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      {d.status === 'assigned'
                        ? <Button variant="secondary" size="sm" icon="arrowLeft">Return</Button>
                        : d.status === 'available'
                          ? <Button variant="primary" size="sm" icon="arrowRight">Assign</Button>
                          : <Button variant="ghost" size="sm" icon="more" className="table__action" aria-label="More" />}
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
