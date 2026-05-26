import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest, type LeaveRequest } from '../features/leave/leaveRequestService'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { useAuth } from '../features/auth/useAuth'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Tabs'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { downloadCsv } from '../lib/exportCsv'

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })

const LEAVE_TYPE_LABELS: Record<LeaveRequest['leave_type'], string> = {
  annual: 'Yıllık izin',
  unpaid: 'Ücretsiz izin',
  sick: 'Hastalık izni',
  other: 'Diğer',
}

export function LeaveRequestsPage() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusF = searchParams.get('status') ?? 'pending'
  const typeF = searchParams.get('type') ?? 'all'
  const role = profile?.role ?? 'employee'
  const canReviewRequests = role === 'manager'
  const canViewAllRequests = role === 'admin_hr'
  const canOpenEmployeeDetails = role === 'admin_hr' || role === 'manager'
  const isEmployeePortal = role === 'employee'

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)

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
      setError(e instanceof Error ? e.message : 'İzin talepleri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const empMap = new Map(employees.map(e => [e.id, e]))
  const currentEmployee = employees.find(e => e.profile_id === profile?.id)
    ?? employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase())
    ?? null
  const teamEmployeeIds = new Set(
    currentEmployee
      ? employees.filter(e => e.manager_id === currentEmployee.id).map(e => e.id)
      : [],
  )

  const visibleRequests = isEmployeePortal
    ? currentEmployee ? requests.filter(l => l.employee_id === currentEmployee.id) : []
    : role === 'manager'
      ? requests.filter(l => teamEmployeeIds.has(l.employee_id))
    : requests

  const filtered = visibleRequests.filter(l => {
    if (statusF !== 'all' && l.status !== statusF) return false
    if (typeF !== 'all' && l.leave_type !== typeF) return false
    return true
  })

  function reviewerLabel(l: LeaveRequest): string {
    if (!l.reviewed_by) return '—'
    const reviewerEmp = employees.find(e => e.profile_id === l.reviewed_by)
    return reviewerEmp?.full_name ?? 'Bilinmiyor'
  }

  function reviewedAtLabel(l: LeaveRequest): string {
    if (!l.reviewed_at) return '—'
    return fmtDate(l.reviewed_at)
  }

  function managerLabel(employeeId: string): string {
    const emp = empMap.get(employeeId)
    if (!emp?.manager_id) return '—'
    return empMap.get(emp.manager_id)?.full_name ?? 'Bilinmiyor'
  }

  const counts = {
    all: visibleRequests.length,
    pending:  visibleRequests.filter(l => l.status === 'pending').length,
    approved: visibleRequests.filter(l => l.status === 'approved').length,
    rejected: visibleRequests.filter(l => l.status === 'rejected').length,
  }

  function setDurum(s: string) { setSearchParams({ status: s, type: typeF }, { replace: true }) }
  function setType(t: string)   { setSearchParams({ status: statusF, type: t }, { replace: true }) }

  async function handleOnayla(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await approveLeaveRequest(id)
    setRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' as const } : l))
  }
  async function handleReddet(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await rejectLeaveRequest(id)
    setRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' as const } : l))
  }

  function exportLeaveRequests() {
    downloadCsv(
      'izin-talepleri.csv',
      ['Çalışan', 'Tür', 'Başlangıç', 'Bitiş', 'Gün', 'Durum', 'Gerekçe', 'Yönetici'],
      filtered.map(l => {
        const emp = empMap.get(l.employee_id)
        return [
          emp?.full_name ?? l.employee_id,
          LEAVE_TYPE_LABELS[l.leave_type],
          l.start_date,
          l.end_date,
          l.total_days,
          l.status,
          l.reason ?? '',
          managerLabel(l.employee_id),
        ]
      }),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="İzin Yönetimi"
        title="İzin talepleri"
        subtitle={role === 'manager'
          ? 'Bekleyen talepleri inceleyin ve ekip takvimini güncel tutun.'
          : role === 'admin_hr'
            ? 'İzin taleplerini görüntüleyin ve yöneticilerin kararlarını takip edin.'
            : 'Kendi izin taleplerinizi oluşturun ve durumunu takip edin.'}
        actions={
          <>
            {(canReviewRequests || canViewAllRequests) && <Button variant="secondary" icon="download" onClick={exportLeaveRequests}>Dışa aktar</Button>}
            <Button
              variant="primary"
              icon="plus"
              disabled={!currentEmployee}
              title={!currentEmployee ? 'İzin talebi için hesabınız bir çalışan kaydına bağlanmalı.' : undefined}
              onClick={() => setNewOpen(true)}
            >
              Yeni talep
            </Button>
          </>
        }
      />

      {!currentEmployee && (
        <div className="alert alert--warning" style={{ marginBottom: 'var(--sp-6)' }}>
          <Icon name="alert" size={14} />
          <div>
            Bu hesap henüz bir çalışan kaydına bağlanmamış. Kendi adına izin talebi oluşturabilmesi için
            Supabase Auth kullanıcısı ile employees kaydındaki <strong>profile_id</strong> veya e-posta eşleşmeli.
          </div>
        </div>
      )}

      <div className="grid grid--4" style={{ marginBottom: 'var(--sp-6)' }}>
        <StatCard label="Beklemede"              value={String(counts.pending)}  icon="inbox" />
        <StatCard label="Bu ay onaylanan"  value="-"                       icon="check" />
        <StatCard label="Bu ay reddedilen" value="-"                       icon="x" />
        <StatCard label="Planlanan gün"    value="-"                       icon="calendar" />
      </div>

      <Panel
        title={
          <Segmented
            value={statusF}
            onChange={setDurum}
            items={[
              { value: 'all',      label: 'Tümü',      count: counts.all },
              { value: 'pending',  label: 'Beklemede',  count: counts.pending },
              { value: 'approved', label: 'Onaylandı', count: counts.approved },
              { value: 'rejected', label: 'Reddedildi', count: counts.rejected },
            ]}
          />
        }
        actions={
          <div className="row gap-2">
            <select className="select" style={{ width: 160, height: 32, fontSize: 'var(--fs-13)' }} value={typeF} onChange={e => setType(e.target.value)}>
              <option value="all">Tüm türler</option>
              <option value="annual">Yıllık izin</option>
              <option value="unpaid">Ücretsiz izin</option>
              <option value="sick">Hastalık izni</option>
              <option value="other">Diğer</option>
            </select>
            <Button variant="ghost" size="sm" icon="filter">Daha fazla filtre</Button>
          </div>
        }
      >
        {loading ? (
          <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}</tbody></table>
        ) : error ? (
          <ErrorState desc={error} action={<Button onClick={load}>Tekrar dene</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Uygun izin talebi yok"
            desc={role === 'manager'
              ? 'Ekip üyeleri izin talebi oluşturduğunda burada inceleyebilirsiniz.'
              : role === 'admin_hr'
                ? 'Çalışanlar izin talebi oluşturduğunda burada görüntülenir.'
                : 'Yeni talep oluşturduğunuzda burada görünecek.'}
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Çalışan</th>
                <th>Tür</th>
                <th>Tarihler</th>
                <th style={{ textAlign: 'right' }}>Gün</th>
                <th>Gerekçe</th>
                <th>Gönderildi</th>
                <th>Durum</th>
                <th>Ekip lideri</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const emp = empMap.get(l.employee_id)
                return (
                  <tr key={l.id} onClick={() => canOpenEmployeeDetails && emp && navigate(`/employees/${emp.id}`)}>
                    <td>
                      <div className="table__cell-primary">
                        <Avatar name={emp?.full_name ?? ''} size="sm" />
                        <div className="table__cell-stack">
                          <span className="table__cell-name">{emp?.full_name ?? l.employee_id}</span>
                          <span className="table__cell-sub">{emp?.department ?? ''}</span>
                        </div>
                      </div>
                    </td>
                    <td><Badge tone="neutral" dot={false}>{LEAVE_TYPE_LABELS[l.leave_type]}</Badge></td>
                    <td className="mono text-sec">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                    <td style={{ textAlign: 'right' }} className="tabnum">{l.total_days}</td>
                    <td className="text-sec" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                    <td className="text-ter mono">{fmtDate(l.created_at)}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      <div className="table__cell-stack">
                        <span className="table__cell-name">{managerLabel(l.employee_id)}</span>
                        <span className="table__cell-sub mono text-ter">
                          {l.reviewed_by ? `${reviewerLabel(l)} · ${reviewedAtLabel(l)}` : 'Beklemede'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canReviewRequests && l.status === 'pending' ? (
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="secondary" size="sm" icon="check" onClick={e => handleOnayla(l.id, e)}>Onayla</Button>
                          <Button variant="danger" size="sm" icon="x" onClick={e => handleReddet(l.id, e)}>Reddet</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" icon="more" className="table__action" aria-label="Daha fazla" onClick={e => e.stopPropagation()} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>

      {newOpen && (
        <NewLeaveModal
          employees={employees}
          currentEmployeeId={currentEmployee?.id ?? ''}
          currentEmployeeName={currentEmployee?.full_name ?? user?.email ?? ''}
          canChooseEmployee={false}
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onCreated={lr => {
            setRequests(prev => [lr, ...prev])
            setNewOpen(false)
          }}
        />
      )}
    </>
  )
}


function calcTotalGün(start: string, end: string): number {
  if (!start || !end) return 0
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return 0
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1
}

interface LeaveForm {
  employee_id: string
  leave_type: LeaveRequest['leave_type']
  start_date: string
  end_date: string
  reason: string
}

function NewLeaveModal({
  employees,
  currentEmployeeId,
  currentEmployeeName,
  canChooseEmployee,
  open,
  onClose,
  onCreated,
}: {
  employees: EmployeeListItem[]
  currentEmployeeId: string
  currentEmployeeName: string
  canChooseEmployee: boolean
  open: boolean
  onClose: () => void
  onCreated: (lr: LeaveRequest) => void
}) {
  const activeEmployees = employees.filter(e => e.employment_status === 'active')
  const firstActiveEmployeeId = activeEmployees[0]?.id ?? ''
  const [form, setForm] = useState<LeaveForm>({
    employee_id: currentEmployeeId || firstActiveEmployeeId,
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveForm, string>>>({})

  function set(k: keyof LeaveForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const totalGün = calcTotalGün(form.start_date, form.end_date)

  async function submit() {
    const e: Partial<Record<keyof LeaveForm, string>> = {}
    if (!form.employee_id) e.employee_id = 'Zorunlu'
    if (!form.start_date) e.start_date = 'Zorunlu'
    if (!form.end_date) e.end_date = 'Zorunlu'
    else if (form.end_date < form.start_date) e.end_date = 'Bitiş tarihi başlangıç tarihinden sonra olmalı'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    try {
      setSaving(true)
      setSaveError(null)
      const lr = await createLeaveRequest({
        employee_id: form.employee_id,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: totalGün,
        reason: form.reason.trim() || undefined,
      })
      setForm({
        employee_id: canChooseEmployee ? firstActiveEmployeeId : currentEmployeeId,
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
      })
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
          <Button variant="primary" icon="check" onClick={submit} disabled={saving || !form.employee_id}>
            {saving ? 'Gönderiliyor...' : 'Talebi gönder'}
          </Button>
        </>
      }
    >
      <div className="col gap-4">
        {canChooseEmployee ? (
          <Field label="Çalışan" required error={errors.employee_id} htmlFor="nlr-emp">
            <Select id="nlr-emp" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
              {activeEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="alert alert--info">
            <Icon name="user" size={14} />
            <div>
              Talep <strong>{currentEmployeeName || 'kendi hesabınız'}</strong> adına oluşturulacak.
            </div>
          </div>
        )}
        <Field label="İzin türü" required htmlFor="nlr-type">
          <Select id="nlr-type" value={form.leave_type} onChange={e => set('leave_type', e.target.value as LeaveForm['leave_type'])}>
            <option value="annual">Yıllık izin</option>
            <option value="unpaid">Ücretsiz izin</option>
            <option value="sick">Hastalık izni</option>
            <option value="other">Diğer</option>
          </Select>
        </Field>
        <div className="grid grid--2">
          <Field label="Başlangıç tarihi" required error={errors.start_date} htmlFor="nlr-sd">
            <Input id="nlr-sd" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} error={errors.start_date} />
          </Field>
          <Field label="Bitiş tarihi" required error={errors.end_date} htmlFor="nlr-ed">
            <Input id="nlr-ed" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} error={errors.end_date} />
          </Field>
        </div>
        {totalGün > 0 && (
          <div className="alert alert--info">
            <Icon name="calendar" size={14} />
            <div>Toplam {totalGün} gün</div>
          </div>
        )}
        <Field label="Gerekçe (isteğe bağlı)" htmlFor="nlr-reason">
          <Textarea id="nlr-reason" placeholder="İzin için kısa bir gerekçe yazın..." value={form.reason} onChange={e => set('reason', e.target.value)} />
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

