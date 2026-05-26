import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, createEmployee, type EmployeeListItem, type EmploymentStatus } from '../features/employees/employeeService'
import { useAuth } from '../features/auth/useAuth'
import { getProfilesByRole } from '../features/auth/profileService'
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
import { downloadCsv } from '../lib/exportCsv'

const DEPARTMENTS = ['Mühendislik', 'Ürün', 'Tasarım', 'Satış', 'Pazarlama', 'İnsan Kaynakları', 'Finans']

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

type SortKey = keyof EmployeeListItem
type SortDir = 'asc' | 'desc'

function SortTh({
  sort,
  sortKey,
  children,
  align,
  onToggle,
}: {
  sort: { key: SortKey; dir: SortDir }
  sortKey: SortKey
  children: ReactNode
  align?: 'left' | 'right' | 'center'
  onToggle: (key: SortKey) => void
}) {
  const active = sort.key === sortKey
  return (
    <th style={align ? { textAlign: align } : undefined}>
      <button className="table__sort" onClick={() => onToggle(sortKey)}>
        {children}
        {active && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={11} />}
      </button>
    </th>
  )
}

export function EmployeesPage() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const role = profile?.role ?? 'employee'
  const isAdminHr = role === 'admin_hr'
  const isManager = role === 'manager'
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [managerProfileIds, setManagerProfileIds] = useState<string[]>([])
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
      const [emps, managers] = await Promise.all([
        getEmployees(),
        getProfilesByRole('manager').catch(() => []),
      ])
      setEmployees(emps)
      setManagerProfileIds(managers.map(m => m.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Çalışanlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const currentEmployee = employees.find(e => e.profile_id === profile?.id)
    ?? employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase())
    ?? null

  const visibleEmployees = role === 'manager' && currentEmployee
    ? employees.filter(e => e.manager_id === currentEmployee.id)
    : employees

  const isTeamEmpty = isManager && Boolean(currentEmployee) && visibleEmployees.length === 0

  const managerIdSet = new Set(managerProfileIds)
  const managerOptions = employees.filter(e =>
    e.employment_status === 'active'
    && Boolean(e.profile_id)
    && managerIdSet.has(e.profile_id as string),
  )

  const filtered = visibleEmployees.filter(e => {
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
    all: visibleEmployees.length,
    active: visibleEmployees.filter(e => e.employment_status === 'active').length,
    inactive: visibleEmployees.filter(e => e.employment_status === 'inactive').length,
    terminated: visibleEmployees.filter(e => e.employment_status === 'terminated').length,
  }

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  function exportEmployees() {
    downloadCsv(
      'calisanlar.csv',
      ['Ad Soyad', 'E-posta', 'Departman', 'Pozisyon', 'Baz Maaş', 'Durum'],
      filtered.map(e => [
        e.full_name,
        e.email,
        e.department ?? '',
        e.position ?? '',
        e.base_salary,
        e.employment_status,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="İnsan Kaynakları"
        title="Çalışanlar"
        subtitle="Aktif çalışanları yönetin, yeni kayıtları oluşturun ve istihdam bilgilerini güncelleyin."
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={exportEmployees}>CSV dışa aktar</Button>
            {isAdminHr && <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>Çalışan ekle</Button>}
          </>
        }
      />

      <Panel
        title={
          <Segmented
            value={status}
            onChange={setStatus}
            items={[
              { value: 'all',        label: 'Tümü',        count: counts.all },
              { value: 'active',     label: 'Aktif',       count: counts.active },
              { value: 'inactive',   label: 'Pasif',       count: counts.inactive },
              { value: 'terminated', label: 'Ayrıldı',     count: counts.terminated },
            ]}
          />
        }
        actions={
          <div className="row gap-2">
            <div className="toolbar__search" style={{ width: 240 }}>
              <Icon name="search" size={14} />
              <input placeholder="Ad, e-posta veya pozisyona göre ara..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="select" style={{ width: 180, height: 32, fontSize: 'var(--fs-13)' }} value={dept} onChange={e => setDept(e.target.value)}>
              <option value="all">Tüm departmanlar</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <Button variant="ghost" size="sm" icon="filter">Daha fazla filtre</Button>
          </div>
        }
        foot={
          <>
            <span><b className="tabnum">{visibleEmployees.length}</b> çalışandan <b className="tabnum">{filtered.length}</b> kayıt gösteriliyor</span>
            <div className="row gap-2">
              <Button variant="ghost" size="sm" icon="arrowLeft" disabled>Önceki</Button>
              <Button variant="ghost" size="sm" iconRight="arrowRight" disabled>Sonraki</Button>
            </div>
          </>
        }
      >
        {loading ? (
          <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</tbody></table>
        ) : error ? (
          <ErrorState desc={error} action={<Button variant="secondary" onClick={load}>Tekrar dene</Button>} />
        ) : filtered.length === 0 ? (
          isTeamEmpty
            ? <EmptyState icon="users" title="Takımınızda çalışan yok" desc="Takımınıza henüz çalışan atanmamış. Çalışan atama işlemi Admin/HR tarafından yapılır: Çalışanlar sayfasından ilgili çalışanı açıp 'Yöneticisi' alanından takım yöneticisini seçin." action={<Button variant="secondary" onClick={() => navigate('/dashboard')}>Takım özetine dön</Button>} />
            : <EmptyState icon="users" title="Filtrelere uygun çalışan bulunamadı" desc="Aramayı temizlemeyi veya farklı bir durum sekmesine geçmeyi deneyin." action={<Button variant="secondary" onClick={() => { setQuery(''); setDept('all'); setStatus('all') }}>Filtreleri sıfırla</Button>} />
        ) : (
          <table className="table table--clickable">
            <thead>
              <tr>
                <SortTh sort={sort} sortKey="full_name" onToggle={toggleSort}>Ad Soyad</SortTh>
                <SortTh sort={sort} sortKey="department" onToggle={toggleSort}>Departman</SortTh>
                <SortTh sort={sort} sortKey="position" onToggle={toggleSort}>Pozisyon</SortTh>
                <SortTh sort={sort} sortKey="base_salary" align="right" onToggle={toggleSort}>Baz maaş</SortTh>
                <th>Durum</th>
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
                  <td className="text-sec">{e.department ?? '-'}</td>
                  <td className="text-sec">{e.position ?? '-'}</td>
                  <td style={{ textAlign: 'right' }} className="tabnum">{fmtCurrency(e.base_salary)}</td>
                  <td><StatusBadge status={e.employment_status} /></td>
                  <td onClick={ev => ev.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon="more" className="table__action" aria-label="Daha fazla" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); void load() }}
        managerOptions={managerOptions}
      />
    </>
  )
}

interface CreateForm {
  full_name: string; email: string; phone: string
  department: string; position: string; start_date: string; manager_id: string
  employment_status: EmploymentStatus; base_salary: string
}

const EMPTY_FORM: CreateForm = {
  full_name: '', email: '', phone: '', department: DEPARTMENTS[0],
  position: '', start_date: '', manager_id: '', employment_status: 'active', base_salary: '',
}

function parseSalaryInput(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  if (!normalized) return 0

  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function CreateEmployeeModal({
  open,
  onClose,
  onCreated,
  managerOptions,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  managerOptions: EmployeeListItem[]
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function set(k: keyof CreateForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  async function submit() {
    const e: Partial<Record<keyof CreateForm, string>> = {}
    if (!form.full_name.trim()) e.full_name = 'Zorunlu'
    if (!form.email.trim()) e.email = 'Zorunlu'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Geçersiz e-posta'
    if (!form.position.trim()) e.position = 'Zorunlu'
    if (!form.start_date) e.start_date = 'Zorunlu'
    const parsedSalary = parseSalaryInput(form.base_salary)
    if (parsedSalary === null) e.base_salary = 'Geçerli bir maaş tutarı girin'
    setErrors(e)
    if (Object.keys(e).length > 0 || parsedSalary === null) return

    try {
      setSaving(true)
      setSaveError(null)
      await createEmployee({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        department: form.department,
        position: form.position.trim(),
        start_date: form.start_date,
        manager_id: form.manager_id || null,
        employment_status: form.employment_status,
        base_salary: parsedSalary,
      })
      setForm(EMPTY_FORM)
      onCreated()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Çalışan oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Yeni çalışan ekle"
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button variant="primary" icon="check" onClick={submit} disabled={saving}>
            {saving ? 'Oluşturuluyor...' : 'Çalışan oluştur'}
          </Button>
        </>
      }
    >
      <div className="grid grid--2">
        <Field label="Ad Soyad" required error={errors.full_name} htmlFor="fn">
          <Input id="fn" placeholder="Örn. Mehmet Demir" value={form.full_name} onChange={e => set('full_name', e.target.value)} error={errors.full_name} />
        </Field>
        <Field label="İş e-postası" required error={errors.email} htmlFor="em">
          <Input id="em" type="email" placeholder="name@acme.co" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} />
        </Field>
        <Field label="Telefon" hint="Ülke kodu ile girin" htmlFor="ph">
          <Input id="ph" placeholder="+90 5XX XXX XXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Departman" required htmlFor="dep">
          <Select id="dep" value={form.department} onChange={e => set('department', e.target.value)}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Pozisyon" required error={errors.position} htmlFor="pos">
          <Input id="pos" placeholder="Örn. Backend Geliştirici" value={form.position} onChange={e => set('position', e.target.value)} error={errors.position} />
        </Field>
        <Field label="Yöneticisi" htmlFor="mgr">
          <Select id="mgr" value={form.manager_id} onChange={e => set('manager_id', e.target.value)}>
            <option value="">Yönetici atanmamış</option>
            {managerOptions.map(m => <option key={m.id} value={m.id}>{m.full_name} - {m.department ?? 'Departman yok'}</option>)}
          </Select>
        </Field>
        <Field label="Başlangıç tarihi" required error={errors.start_date} htmlFor="sd">
          <Input id="sd" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} error={errors.start_date} />
        </Field>
        <Field label="Çalışma durumu" required htmlFor="es">
          <Select id="es" value={form.employment_status} onChange={e => set('employment_status', e.target.value as EmploymentStatus)}>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="terminated">Ayrıldı</option>
          </Select>
        </Field>
        <Field label="Baz maaş (aylık brüt)" error={errors.base_salary} htmlFor="sal">
          <Input
            id="sal"
            addon="TRY"
            inputMode="decimal"
            placeholder="Örn. 50000 veya 50.000"
            value={form.base_salary}
            onChange={e => set('base_salary', e.target.value)}
            error={errors.base_salary}
          />
        </Field>
      </div>
      {saveError && (
        <div className="alert alert--danger" style={{ marginTop: 'var(--sp-4)' }}>
          <Icon name="alert" size={14} />
          <div>{saveError}</div>
        </div>
      )}
      <div className="alert alert--info" style={{ marginTop: 'var(--sp-4)' }}>
        <Icon name="info" size={14} />
        <div>Burada Supabase Auth hesabı oluşturulmaz. Giriş vereceğimiz kullanıcıları Supabase Authentication üzerinden davet ediyoruz.</div>
      </div>
    </Modal>
  )
}

void Textarea
void Badge
