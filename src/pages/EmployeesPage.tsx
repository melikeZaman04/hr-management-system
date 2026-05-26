import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Tabs'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../components/ui/Field'

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'People Ops', 'Finance']

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type SortKey = keyof EmployeeListItem
type SortDir = 'asc' | 'desc'

export function EmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'full_name', dir: 'asc' })
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      setEmployees(await getEmployees())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(e => {
    if (status !== 'all' && e.employment_status !== status) return false
    if (dept !== 'all' && e.department !== dept) return false
    if (query) {
      const q = query.toLowerCase()
      if (
        !e.full_name.toLowerCase().includes(q) &&
        !(e.email ?? '').toLowerCase().includes(q) &&
        !(e.position ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  }).sort((a, b) => {
    const av = a[sort.key] ?? ''
    const bv = b[sort.key] ?? ''
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const counts = {
    all: employees.length,
    active: employees.filter(e => e.employment_status === 'active').length,
    inactive: employees.filter(e => e.employment_status === 'inactive').length,
    terminated: employees.filter(e => e.employment_status === 'terminated').length,
  }

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  function SortTh({ k, children, align }: { k: SortKey; children: React.ReactNode; align?: string }) {
    const active = sort.key === k
    return (
      <th style={align ? { textAlign: align as never } : undefined}>
        <button className="table__sort" onClick={() => toggleSort(k)}>
          {children}
          {active && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={11} />}
        </button>
      </th>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Employees"
        subtitle="Manage active staff, onboard new hires, and update employment records."
        actions={
          <>
            <Button variant="secondary" icon="download">Export CSV</Button>
            <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>Add employee</Button>
          </>
        }
      />

      <Panel
        title={
          <Segmented
            value={status}
            onChange={setStatus}
            items={[
              { value: 'all',        label: 'All',        count: counts.all },
              { value: 'active',     label: 'Active',     count: counts.active },
              { value: 'inactive',   label: 'Inactive',   count: counts.inactive },
              { value: 'terminated', label: 'Terminated', count: counts.terminated },
            ]}
          />
        }
        actions={
          <div className="row gap-2">
            <div className="toolbar__search" style={{ width: 240 }}>
              <Icon name="search" size={14} />
              <input placeholder="Search by name, email, role…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="select" style={{ width: 180, height: 32, fontSize: 'var(--fs-13)' }} value={dept} onChange={e => setDept(e.target.value)}>
              <option value="all">All departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <Button variant="ghost" size="sm" icon="filter">More filters</Button>
          </div>
        }
        foot={
          <>
            <span>Showing <b className="tabnum">{filtered.length}</b> of <b className="tabnum">{employees.length}</b> employees</span>
            <div className="row gap-2">
              <Button variant="ghost" size="sm" icon="arrowLeft" disabled>Previous</Button>
              <Button variant="ghost" size="sm" iconRight="arrowRight" disabled>Next</Button>
            </div>
          </>
        }
      >
        {loading ? (
          <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</tbody></table>
        ) : error ? (
          <ErrorState desc={error} action={<Button variant="secondary" onClick={load}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="users" title="No employees match your filters" desc="Try clearing the search or switching to a different status tab." action={<Button variant="secondary" onClick={() => { setQuery(''); setDept('all'); setStatus('all') }}>Reset filters</Button>} />
        ) : (
          <table className="table table--clickable">
            <thead>
              <tr>
                <SortTh k="full_name">Name</SortTh>
                <SortTh k="department">Department</SortTh>
                <SortTh k="position">Position</SortTh>
                <SortTh k="base_salary" align="right">Base salary</SortTh>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} onClick={() => navigate(`/employees/${e.id}`)}>
                  <td>
                    <div className="table__cell-primary">
                      <Avatar name={e.full_name} size="md" />
                      <div className="table__cell-stack">
                        <span className="table__cell-name">{e.full_name}</span>
                        <span className="table__cell-sub">{e.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-sec">{e.department ?? '—'}</td>
                  <td className="text-sec">{e.position ?? '—'}</td>
                  <td style={{ textAlign: 'right' }} className="tabnum">{fmtCurrency(e.base_salary)}</td>
                  <td><StatusBadge status={e.employment_status} /></td>
                  <td onClick={ev => ev.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon="more" className="table__action" aria-label="More" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <CreateEmployeeModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

interface CreateForm {
  full_name: string; email: string; phone: string
  department: string; position: string; start_date: string
  employment_status: string; base_salary: string
}

function CreateEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<CreateForm>({
    full_name: '', email: '', phone: '', department: 'Engineering',
    position: '', start_date: '', employment_status: 'active', base_salary: '',
  })
  const [errors, setErrors] = useState<Partial<CreateForm>>({})

  function set(k: keyof CreateForm, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function submit() {
    const e: Partial<CreateForm> = {}
    if (!form.full_name) e.full_name = 'Required'
    if (!form.email) e.email = 'Required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.position) e.position = 'Required'
    if (!form.start_date) e.start_date = 'Required'
    setErrors(e)
    if (Object.keys(e).length === 0) onClose()
  }

  return (
    <Modal
      open={open}
      title="Add new employee"
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={submit}>Create employee</Button>
        </>
      }
    >
      <div className="grid grid--2">
        <Field label="Full name" required error={errors.full_name} htmlFor="fn">
          <Input id="fn" placeholder="e.g. Mehmet Demir" value={form.full_name} onChange={e => set('full_name', e.target.value)} error={errors.full_name} />
        </Field>
        <Field label="Work email" required error={errors.email} htmlFor="em">
          <Input id="em" type="email" placeholder="name@acme.co" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} />
        </Field>
        <Field label="Phone" hint="Include country code" htmlFor="ph">
          <Input id="ph" placeholder="+90 5XX XXX XXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Department" required htmlFor="dep">
          <Select id="dep" value={form.department} onChange={e => set('department', e.target.value)}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Position" required error={errors.position} htmlFor="pos">
          <Input id="pos" placeholder="e.g. Backend Engineer" value={form.position} onChange={e => set('position', e.target.value)} error={errors.position} />
        </Field>
        <Field label="Start date" required error={errors.start_date} htmlFor="sd">
          <Input id="sd" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} error={errors.start_date} />
        </Field>
        <Field label="Employment status" required htmlFor="es">
          <Select id="es" value={form.employment_status} onChange={e => set('employment_status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </Select>
        </Field>
        <Field label="Base salary (annual)" hint="Gross figure" htmlFor="sal">
          <Input id="sal" addon="USD" type="number" placeholder="0" value={form.base_salary} onChange={e => set('base_salary', e.target.value)} />
        </Field>
      </div>
      <div className="alert alert--info" style={{ marginTop: 'var(--sp-5)' }}>
        <Icon name="info" size={14} />
        <div>A Supabase Auth account is not created here. Use the "Invite via email" flow from People Ops to provision login.</div>
      </div>
    </Modal>
  )
}

// keep Textarea in scope for future use
void Textarea
void Badge
