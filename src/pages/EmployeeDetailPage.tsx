import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  getEmployeeById,
  getEmployees,
  updateEmployee,
  setEmployeeStatus,
  type EmployeeDetail,
  type EmployeeListItem,
  type EmploymentStatus,
} from '../features/employees/employeeService'
import { useAuth } from '../features/auth/useAuth'
import { getProfileById, getProfilesByRole, updateProfileRole, type UserRole } from '../features/auth/profileService'
import {
  getLeaveRequestsForEmployee,
  createLeaveRequest,
  type LeaveRequest,
} from '../features/leave/leaveRequestService'
import { getDevicesForEmployee, returnDevice, type DeviceWithAssignee } from '../features/devices/deviceService'
import { getDocumentsForEmployee, getSignedUrl, DOCUMENT_TYPE_LABELS, type Document } from '../features/documents/documentService'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Tabs } from '../components/ui/Tabs'
import { DetailField } from '../components/ui/DetailField'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../components/ui/Field'

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

function tenure(startDate: string | null) {
  if (!startDate) return '—'
  const years = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
  return `${years} yıl`
}

function calcTotalDays(start: string, end: string): number {
  if (!start || !end) return 0
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return 0
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1
}

// ─── Edit Employee Modal ─────────────────────────────────────────────────────

const DEPARTMENTS = ['Mühendislik', 'Ürün', 'Tasarım', 'Satış', 'Pazarlama', 'İnsan Kaynakları', 'Finans']

const LEAVE_TYPE_LABELS: Record<LeaveRequest['leave_type'], string> = {
  annual: 'Yıllık izin',
  unpaid: 'Ücretsiz izin',
  sick: 'Hastalık izni',
  other: 'Diğer',
}

interface EditForm {
  full_name: string; phone: string; department: string
  position: string; start_date: string; manager_id: string
  employment_status: EmploymentStatus; base_salary: string; role: UserRole
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

function EditEmployeeModal({
  employee,
  open,
  onClose,
  onSaved,
  managerOptions,
  currentRole,
  onRoleSaved,
}: {
  employee: EmployeeDetail
  open: boolean
  onClose: () => void
  onSaved: (updated: EmployeeDetail) => void
  managerOptions: EmployeeListItem[]
  currentRole: UserRole | null
  onRoleSaved: (role: UserRole) => void
}) {
  const [form, setForm] = useState<EditForm>({
    full_name: employee.full_name,
    phone: employee.phone ?? '',
    department: employee.department ?? 'Mühendislik',
    position: employee.position ?? '',
    start_date: employee.start_date ?? '',
    manager_id: employee.manager_id ?? '',
    employment_status: employee.employment_status as EmploymentStatus,
    base_salary: String(employee.base_salary),
    role: currentRole ?? 'employee',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({})

  function set(k: keyof EditForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  async function submit() {
    const nextErrors: Partial<Record<keyof EditForm, string>> = {}
    const parsedSalary = parseSalaryInput(form.base_salary)

    if (!form.full_name.trim()) nextErrors.full_name = 'Zorunlu'
    if (parsedSalary === null) nextErrors.base_salary = 'Geçerli bir maaş tutarı girin'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || parsedSalary === null) return

    try {
      setSaving(true)
      setSaveError(null)
      const updated = await updateEmployee(employee.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        department: form.department,
        position: form.position.trim() || undefined,
        start_date: form.start_date || undefined,
        manager_id: form.manager_id || null,
        employment_status: form.employment_status,
        base_salary: parsedSalary,
      })
      if (employee.profile_id && currentRole && form.role !== currentRole) {
        await updateProfileRole(employee.profile_id, form.role)
        onRoleSaved(form.role)
      }
      onSaved(updated)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Değişiklikler kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Çalışan profilini düzenle"
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button variant="primary" icon="check" onClick={submit} disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </>
      }
    >
      <div className="grid grid--2">
        <Field label="Ad Soyad" required htmlFor="ef-fn">
          <Input id="ef-fn" value={form.full_name} onChange={e => set('full_name', e.target.value)} error={errors.full_name} />
        </Field>
        <Field label="Telefon" hint="Ülke kodu ile" htmlFor="ef-ph">
          <Input id="ef-ph" placeholder="+90 5XX XXX XXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Departman" htmlFor="ef-dep">
          <Select id="ef-dep" value={form.department} onChange={e => set('department', e.target.value)}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Pozisyon" htmlFor="ef-pos">
          <Input id="ef-pos" value={form.position} onChange={e => set('position', e.target.value)} />
        </Field>
        <Field label="Yöneticisi" htmlFor="ef-manager">
          <Select id="ef-manager" value={form.manager_id} onChange={e => set('manager_id', e.target.value)}>
            <option value="">Yönetici atanmamış</option>
            {managerOptions.map(m => (
              <option key={m.id} value={m.id}>{m.full_name} - {m.department ?? 'Departman yok'}</option>
            ))}
          </Select>
        </Field>
        <Field label="Sistem rolü" hint={!employee.profile_id ? 'Önce Supabase Auth kullanıcısı ve profiles kaydı oluşturun.' : undefined} htmlFor="ef-role">
          <Select
            id="ef-role"
            value={form.role}
            disabled={!employee.profile_id || !currentRole}
            onChange={e => set('role', e.target.value as UserRole)}
          >
            <option value="employee">Çalışan</option>
            <option value="manager">Yönetici</option>
            <option value="admin_hr">İK</option>
          </Select>
        </Field>
        <Field label="Başlangıç tarihi" htmlFor="ef-sd">
          <Input id="ef-sd" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </Field>
        <Field label="Çalışma durumu" htmlFor="ef-es">
          <Select id="ef-es" value={form.employment_status} onChange={e => set('employment_status', e.target.value as EmploymentStatus)}>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="terminated">Ayrıldı</option>
          </Select>
        </Field>
        <Field label="Baz maaş (aylık brüt)" error={errors.base_salary} htmlFor="ef-sal">
          <Input
            id="ef-sal"
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
    </Modal>
  )
}

// ─── New Leave Request Modal ──────────────────────────────────────────────────

interface LeaveForm {
  leave_type: LeaveRequest['leave_type']
  start_date: string
  end_date: string
  reason: string
}

function NewLeaveModal({
  employeeId,
  open,
  onClose,
  onCreated,
}: {
  employeeId: string
  open: boolean
  onClose: () => void
  onCreated: (lr: LeaveRequest) => void
}) {
  const [form, setForm] = useState<LeaveForm>({
    leave_type: 'annual', start_date: '', end_date: '', reason: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveForm, string>>>({})

  function set(k: keyof LeaveForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const totalDays = calcTotalDays(form.start_date, form.end_date)

  async function submit() {
    const e: Partial<Record<keyof LeaveForm, string>> = {}
    if (!form.start_date) e.start_date = 'Zorunlu'
    if (!form.end_date) e.end_date = 'Zorunlu'
    else if (form.end_date < form.start_date) e.end_date = 'Bitiş tarihi başlangıç tarihinden sonra olmalı'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    try {
      setSaving(true)
      setSaveError(null)
      const lr = await createLeaveRequest({
        employee_id: employeeId,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: totalDays,
        reason: form.reason.trim() || undefined,
      })
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' })
      onCreated(lr)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'İzin talebi gönderilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Yeni izin talebi"
      onClose={onClose}
      width={480}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button variant="primary" icon="check" onClick={submit} disabled={saving}>
            {saving ? 'Gönderiliyor…' : 'Talebi gönder'}
          </Button>
        </>
      }
    >
      <div className="col gap-4">
        <Field label="İzin türü" required htmlFor="lf-type">
          <Select id="lf-type" value={form.leave_type} onChange={e => set('leave_type', e.target.value as LeaveForm['leave_type'])}>
            <option value="annual">Yıllık izin</option>
            <option value="unpaid">Ücretsiz izin</option>
            <option value="sick">Hastalık izni</option>
            <option value="other">Diğer</option>
          </Select>
        </Field>
        <div className="grid grid--2">
          <Field label="Başlangıç tarihi" required error={errors.start_date} htmlFor="lf-sd">
            <Input id="lf-sd" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} error={errors.start_date} />
          </Field>
          <Field label="Bitiş tarihi" required error={errors.end_date} htmlFor="lf-ed">
            <Input id="lf-ed" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} error={errors.end_date} />
          </Field>
        </div>
        {totalDays > 0 && (
          <div className="alert alert--info">
            <Icon name="calendar" size={14} />
            <div>Toplam {totalDays} gün</div>
          </div>
        )}
        <Field label="Gerekçe (isteğe bağlı)" htmlFor="lf-reason">
          <Textarea id="lf-reason" placeholder="İzin için kısa bir gerekçe yazın…" value={form.reason} onChange={e => set('reason', e.target.value)} />
        </Field>
      </div>
      {saveError && (
        <div className="alert alert--danger" style={{ marginTop: 'var(--sp-4)' }}>
          <Icon name="alert" size={14} />
          <div>{saveError}</div>
        </div>
      )}
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const role = profile?.role ?? 'employee'
  const isAdminHr = role === 'admin_hr'
  const isManager = role === 'manager'
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'overview'

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [employeeRole, setEmployeeRole] = useState<UserRole | null>(null)
  const [managerProfileIds, setManagerProfileIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [devices, setDevices] = useState<DeviceWithAssignee[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [returningDeviceId, setReturningDeviceId] = useState<string | null>(null)
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    void (async () => {
      try {
        setLoading(true)
        const [emp, allEmployees, lv, dv, dc, managers] = await Promise.all([
          getEmployeeById(id),
          getEmployees().catch(() => []),
          getLeaveRequestsForEmployee(id).catch(() => []),
          getDevicesForEmployee(id).catch(() => []),
          getDocumentsForEmployee(id).catch(() => []),
          getProfilesByRole('manager').catch(() => []),
        ])
        if (!mounted) return
        setEmployee(emp)
        setEmployees(allEmployees)
        setManagerProfileIds(managers.map(m => m.id))
        if (emp?.profile_id) {
          const profile = await getProfileById(emp.profile_id).catch(() => null)
          if (mounted) setEmployeeRole(profile?.role ?? null)
        } else {
          setEmployeeRole(null)
        }
        setLeaves(lv)
        setDevices(dv)
        setDocuments(dc)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Çalışan bilgisi yüklenemedi.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  async function handleStatusChange(status: EmploymentStatus) {
    if (!employee) return
    try {
      setStatusSaving(true)
      await setEmployeeStatus(employee.id, status)
      setEmployee(e => e ? { ...e, employment_status: status } : e)
    } finally {
      setStatusSaving(false)
    }
  }

  async function handleReturnDevice(device: DeviceWithAssignee) {
    if (!device.assignment_id) return
    try {
      setReturningDeviceId(device.id)
      await returnDevice(device.id, device.assignment_id)
      setDevices(prev => prev.filter(d => d.id !== device.id))
    } finally {
      setReturningDeviceId(null)
    }
  }

  async function handleDownloadDoc(doc: Document) {
    try {
      setDownloadingDocId(doc.id)
      const url = await getSignedUrl(doc.storage_bucket, doc.storage_path, 60)
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.click()
    } finally {
      setDownloadingDocId(null)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState desc={error} action={<Button onClick={() => navigate('/employees')}>Çalışanlara dön</Button>} />
  if (!employee) return (
    <EmptyState icon="users" title="Çalışan bulunamadı" desc="Kayıt silinmiş olabilir veya bağlantı hatalı olabilir." action={<Button variant="primary" onClick={() => navigate('/employees')}>Çalışan listesine dön</Button>} />
  )

  function setTab(t: string) { setSearchParams({ tab: t }, { replace: true }) }
  const manager = employee.manager_id ? employees.find(e => e.id === employee.manager_id) : null
  const managerIdSet = new Set(managerProfileIds)
  const managerOptions = employees.filter(e =>
    e.id !== employee.id
    && e.employment_status === 'active'
    && Boolean(e.profile_id)
    && managerIdSet.has(e.profile_id as string),
  )

  return (
    <>
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => navigate('/employees')}>
          {isManager ? 'Takımım' : 'Tüm çalışanlar'}
        </Button>
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
            {isAdminHr && <Button variant="secondary" icon="edit" onClick={() => setEditOpen(true)}>Profili düzenle</Button>}
            <Button variant="ghost" size="sm" icon="more" aria-label="Daha fazla" />
          </div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'overview',  label: 'Genel bakış' },
          { id: 'leave',     label: 'İzinler',     count: leaves.length },
          { id: 'devices',   label: 'Cihazlar',   count: devices.length },
          { id: 'documents', label: 'Dokümanlar', count: documents.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid grid--12-8" style={{ alignItems: 'start' }}>
          <Panel title="İstihdam bilgileri" padded>
            <div className="detail-grid">
              <DetailField label="Ad Soyad"          value={employee.full_name} />
              <DetailField label="İş e-postası"      value={employee.email} mono />
              <DetailField label="Telefon"           value={employee.phone ?? undefined} mono />
              <DetailField label="Departman"         value={employee.department ?? undefined} />
              <DetailField label="Pozisyon"          value={employee.position ?? undefined} />
              <DetailField label="Yöneticisi"        value={manager?.full_name ?? undefined} />
              <DetailField label="Sistem rolü"       value={employeeRole ?? 'Giriş profili yok'} />
              <DetailField label="Başlangıç tarihi"  value={fmtDate(employee.start_date)} mono />
              <DetailField label="Çalışma durumu"    value={<StatusBadge status={employee.employment_status} />} />
              <DetailField label="Baz maaş"          value={fmtCurrency(employee.base_salary)} mono />
              <DetailField label="Çalışan ID"        value={employee.id} mono muted />
            </div>
          </Panel>

          <div className="col gap-4">
            <Panel title="Özet" padded>
              <div className="col gap-3">
                <div className="row row--between"><span className="text-ter">Kıdem</span><span className="tabnum">{tenure(employee.start_date)}</span></div>
                <div className="row row--between"><span className="text-ter">Cihazlar</span><span className="tabnum">{devices.length}</span></div>
                <div className="row row--between"><span className="text-ter">Dokümanlar</span><span className="tabnum">{documents.length}</span></div>
                <div className="row row--between"><span className="text-ter">İzin talepleri</span><span className="tabnum">{leaves.length}</span></div>
              </div>
            </Panel>
            <Panel title="Hızlı işlemler" padded>
              <div className="col gap-2">
                {isAdminHr && (
                  <Button variant="secondary" icon="wallet" block onClick={() => navigate(`/salary-calculation?employee_id=${employee.id}`)}>
                    Maaş hesapla
                  </Button>
                )}

                {(isAdminHr || isManager) && (
                  <Button variant="secondary" icon="laptop" block onClick={() => setTab('devices')}>
                    Cihaz ata
                  </Button>
                )}

                {isAdminHr && (
                  employee.employment_status === 'active' ? (
                    <Button
                      variant="danger"
                      icon="x"
                      block
                      disabled={statusSaving}
                      onClick={() => handleStatusChange('inactive')}
                    >
                      {statusSaving ? 'Kaydediliyor…' : 'Pasif olarak işaretle'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      icon="check"
                      block
                      disabled={statusSaving}
                      onClick={() => handleStatusChange('active')}
                    >
                      {statusSaving ? 'Kaydediliyor…' : 'Aktif olarak işaretle'}
                    </Button>
                  )
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <Panel
          title="İzin geçmişi"
          actions={
            <Button variant="primary" size="sm" icon="plus" onClick={() => setLeaveOpen(true)}>
              Yeni talep
            </Button>
          }
        >
          {leaves.length === 0
            ? <EmptyState icon="calendar" title="Henüz izin kaydı yok" desc="Bu çalışanın kullandığı veya talep ettiği izinler burada görünür." />
            : (
              <table className="table">
                <thead><tr><th>Tür</th><th>Tarihler</th><th style={{ textAlign: 'right' }}>Gün</th><th>Durum</th><th>Gerekçe</th></tr></thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id}>
                      <td><Badge tone="neutral" dot={false}>{LEAVE_TYPE_LABELS[l.leave_type]}</Badge></td>
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
        <Panel
          title="Atanmış cihazlar"
          actions={<Button variant="primary" size="sm" icon="plus" onClick={() => navigate('/devices')}>Cihaz ata</Button>}
        >
          {devices.length === 0
            ? <EmptyState icon="laptop" title="Atanmış cihaz yok" desc="Bu çalışana laptop, monitör veya telefon gibi cihazlar atanabilir." />
            : (
              <table className="table">
                <thead><tr><th>Cihaz</th><th>Tür</th><th>Seri</th><th>Durum</th><th></th></tr></thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.id}>
                      <td className="table__cell-name">{d.name}</td>
                      <td className="text-sec">{d.device_type}</td>
                      <td className="mono text-sec">{d.serial_number}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={returningDeviceId === d.id || !d.assignment_id}
                          onClick={() => handleReturnDevice(d)}
                        >
                          {returningDeviceId === d.id ? 'İşleniyor…' : 'İade al'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Panel>
      )}

      {tab === 'documents' && (
        <Panel title="Dokümanlar" actions={<Button variant="primary" size="sm" icon="upload" onClick={() => navigate('/documents')}>Yükle</Button>}>
          {documents.length === 0
            ? <EmptyState icon="document" title="Henüz doküman yüklenmedi" desc="Sözleşme, kimlik ve İK formları yüklendikten sonra burada görünür." />
            : (
              <table className="table">
                <thead><tr><th>Dosya</th><th>Tür</th><th>Yüklenme tarihi</th><th></th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td><div className="row gap-2"><Icon name="paperclip" size={14} className="text-ter" /><span className="mono">{d.file_name}</span></div></td>
                      <td><Badge tone="info" dot={false}>{DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type}</Badge></td>
                      <td className="text-sec">{fmtDate(d.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="download"
                          disabled={downloadingDocId === d.id}
                          onClick={() => handleDownloadDoc(d)}
                        >
                          {downloadingDocId === d.id ? '…' : 'İndir'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Panel>
      )}

      {editOpen && (
        <EditEmployeeModal
          employee={employee}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={updated => { setEmployee(updated); setEditOpen(false) }}
          managerOptions={managerOptions}
          currentRole={employeeRole}
          onRoleSaved={setEmployeeRole}
        />
      )}

      <NewLeaveModal
        employeeId={employee.id}
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onCreated={lr => {
          setLeaves(prev => [lr, ...prev])
          setLeaveOpen(false)
          setTab('leave')
        }}
      />
    </>
  )
}
