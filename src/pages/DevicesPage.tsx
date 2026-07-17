import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDevices, getDevicesForEmployee, createDevice, assignDevice, returnDevice, updateDeviceStatus,
  type DeviceWithAssignee,
} from '../features/devices/deviceService'
import { getEmployees, getEmployeeForAuth, type EmployeeListItem } from '../features/employees/employeeService'
import { useAuth } from '../features/auth/useAuth'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Tabs'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Select } from '../components/ui/Field'
import { downloadCsv } from '../lib/exportCsv'
import anim from '../styles/animations.module.css'

const DEVICE_TYPES = ['Laptop', 'Monitör', 'Telefon', 'Tablet', 'Mouse', 'Klavye', 'Kulaklık', 'Diğer']
const DEVICE_ICON: Record<string, string> = { Telefon: 'phone', Monitör: 'cube', Monitor: 'cube', Mouse: 'cube' }

export function DevicesPage() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const role = profile?.role ?? 'employee'
  const isEmployee = role === 'employee'

  const [devices, setDevices] = useState<DeviceWithAssignee[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusF, setStatusF] = useState('all')
  const [query, setQuery] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<DeviceWithAssignee | null>(null)
  const [returnTarget, setReturnTarget] = useState<DeviceWithAssignee | null>(null)
  const [deviceActionId, setDeviceActionId] = useState<string | null>(null)
  const [deviceActionError, setDeviceActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (isEmployee) {
        const emp = await getEmployeeForAuth({ profileId: profile?.id ?? null, email: user?.email ?? null })
        setCurrentEmployee(emp)
        setEmployees([])
        if (!emp) {
          setDevices([])
          return
        }
        setDevices(await getDevicesForEmployee(emp.id))
        return
      }

      const [dv, emps] = await Promise.all([getDevices(), getEmployees()])
      setDevices(dv)
      setEmployees(emps)
      setCurrentEmployee(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cihazlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [isEmployee, profile, user])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  const empMap = new Map(employees.map(e => [e.id, e]))
  const currentEmployeeFromList = employees.find(e => e.profile_id === profile?.id)
    ?? employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase())
    ?? null
  const assignableEmployees = role === 'manager' && currentEmployeeFromList
    ? employees.filter(e => e.manager_id === currentEmployeeFromList.id && e.employment_status === 'active')
    : employees.filter(e => e.employment_status === 'active')

  const filtered = devices.filter(d => {
    if (!isEmployee && statusF !== 'all' && d.status !== statusF) return false
    if (query && !`${d.name} ${d.brand ?? ''} ${d.model ?? ''} ${d.serial_number ?? ''} ${d.device_type}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const counts = !isEmployee ? {
    all: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    assigned: devices.filter(d => d.status === 'assigned').length,
    returned: devices.filter(d => d.status === 'returned').length,
    broken: devices.filter(d => d.status === 'broken').length,
  } : null

  const availableDevices = !isEmployee ? devices.filter(d => d.status === 'available') : []

  function exportDevices() {
    if (isEmployee) return
    downloadCsv(
      'cihazlar.csv',
      ['Cihaz', 'Tür', 'Marka', 'Model', 'Seri Numarası', 'Lokasyon', 'Fatura / Not', 'Atanan Kişi', 'Durum', 'Atanma Tarihi'],
      filtered.map(d => {
        const owner = d.assignee_id ? empMap.get(d.assignee_id) : null
        return [
          d.name,
          d.device_type,
          d.brand ?? '',
          d.model ?? '',
          d.serial_number ?? '',
          d.location ?? '',
          d.notes ?? '',
          owner?.full_name ?? '',
          d.status,
          d.assigned_at ?? '',
        ]
      }),
    )
  }

  function appendDeviceNote(current: string | null, note: string) {
    return [current?.trim(), note].filter(Boolean).join('\n')
  }

  async function handleMarkBroken(device: DeviceWithAssignee) {
    try {
      setDeviceActionId(device.id)
      setDeviceActionError(null)
      const today = new Date().toISOString().slice(0, 10)
      await updateDeviceStatus(
        device.id,
        'broken',
        appendDeviceNote(device.notes, `[Arıza] ${today}: Cihaz arızalı olarak işaretlendi.`),
      )
      await load()
    } catch (err) {
      setDeviceActionError(err instanceof Error ? err.message : 'Cihaz arızalı olarak işaretlenemedi.')
    } finally {
      setDeviceActionId(null)
    }
  }

  async function handleRepairDevice(device: DeviceWithAssignee) {
    try {
      setDeviceActionId(device.id)
      setDeviceActionError(null)
      const nextStatus = device.assignee_id ? 'assigned' : 'available'
      const today = new Date().toISOString().slice(0, 10)
      await updateDeviceStatus(
        device.id,
        nextStatus,
        appendDeviceNote(device.notes, `[Tamir] ${today}: Cihaz tekrar kullanıma hazır.`),
      )
      await load()
    } catch (err) {
      setDeviceActionError(err instanceof Error ? err.message : 'Cihaz durumu güncellenemedi.')
    } finally {
      setDeviceActionId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={isEmployee ? 'Kaynaklar' : 'Envanter'}
        title={isEmployee ? 'Cihazlarım' : 'Cihaz envanteri'}
        subtitle={isEmployee
          ? 'Size atanmış cihazları burada görebilirsiniz.'
          : 'Cihazları envantere ekleyin, atanmamış cihazları görün ve çalışanlara zimmetleyin.'}
        actions={!isEmployee ? (
          <>
            <Button variant="secondary" icon="download" onClick={exportDevices}>Dışa aktar</Button>
            <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>Cihaz ekle</Button>
          </>
        ) : undefined}
      />

      {isEmployee && !currentEmployee && (
        <div className="alert alert--warning" style={{ marginBottom: 'var(--sp-6)' }}>
          <Icon name="alert" size={14} />
          <div>
            Bu hesap henüz bir çalışan kaydına bağlı değil. Cihazlarınızı görebilmek için
            Supabase Auth kullanıcısı ile employees kaydındaki <strong>profile_id</strong> veya e-posta eşleşmeli.
          </div>
        </div>
      )}

      {!isEmployee && counts && (
        <div className="grid grid--4" style={{ marginBottom: 'var(--sp-6)' }}>
          <StatCard label="Toplam cihaz" value={String(counts.all)} icon="cube" />
          <StatCard label="Atanmış" value={String(counts.assigned)} icon="laptop" />
          <StatCard label="Atanmamış" value={String(counts.available)} icon="check" />
          <StatCard label="Arızalı" value={String(counts.broken)} icon="alert" />
        </div>
      )}

      {deviceActionError && (
        <div className="alert alert--danger" style={{ marginBottom: 'var(--sp-4)' }}>
          <Icon name="alert" size={14} />
          <div>{deviceActionError}</div>
        </div>
      )}

      {!isEmployee && (
        <Panel
          title={
            <>
              <Icon name="clipboard" size={14} />
              <span>Atanmamış Cihazlar</span>
            </>
          }
          actions={<Button variant="ghost" size="sm" onClick={() => setStatusF('available')}>Tümünü gör</Button>}
          style={{ marginBottom: 'var(--sp-6)' } as React.CSSProperties}
        >
          {loading ? (
            <table className="table"><tbody>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
          ) : availableDevices.length === 0 ? (
            <EmptyState icon="laptop" title="Atanmamış cihaz yok" desc="Yeni cihaz ekleyin veya iade alınan cihazları atanmamış duruma getirin." action={<Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>Cihaz ekle</Button>} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cihaz</th>
                  <th>Lokasyon</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {availableDevices.slice(0, 5).map(d => (
                  <tr key={d.id} className={anim.hoverRow}>
                    <td>
                      <div className="table__cell-primary">
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
                          <Icon name={(DEVICE_ICON[d.device_type] ?? 'laptop') as never} size={14} />
                        </div>
                        <div className="table__cell-stack">
                          <span className="table__cell-name">{d.name}</span>
                          <span className="table__cell-sub">{[d.brand, d.model].filter(Boolean).join(' ') || d.device_type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sec">{d.location ?? '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="primary" size="sm" icon="arrowRight" onClick={() => setAssignTarget(d)}>Ata</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      <Panel
        title={isEmployee
          ? (
            <>
              <Icon name="laptop" size={14} />
              <span>Atanmış cihazlar</span>
            </>
          )
          : (
            <Segmented
              value={statusF}
              onChange={setStatusF}
              items={[
                { value: 'all', label: 'Tümü', count: counts?.all ?? 0 },
                { value: 'available', label: 'Atanmamış', count: counts?.available ?? 0 },
                { value: 'assigned', label: 'Atanmış', count: counts?.assigned ?? 0 },
                { value: 'returned', label: 'İade edildi', count: counts?.returned ?? 0 },
                { value: 'broken', label: 'Arızalı', count: counts?.broken ?? 0 },
              ]}
            />
          )}
        actions={
          <div className="toolbar__search" style={{ width: 240 }}>
            <Icon name="search" size={14} />
            <input placeholder="Ad, marka, model veya seri no ara..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        }
      >
        {loading ? (
          <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={isEmployee ? 6 : 7} />)}</tbody></table>
        ) : error ? (
          <ErrorState desc={error} action={<Button onClick={load}>Tekrar dene</Button>} />
        ) : filtered.length === 0 ? (
          isEmployee
            ? <EmptyState icon="laptop" title="Henüz atanmış cihaz yok" desc="Cihaz ataması yapıldığında burada görünecek." />
            : <EmptyState icon="laptop" title="Eşleşen cihaz yok" desc="Yukarıdaki filtreleri temizlemeyi deneyin." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Cihaz</th>
                <th>Tür</th>
                <th>Seri numarası</th>
                <th>Lokasyon</th>
                <th>Fatura / not</th>
                {!isEmployee && <th>Atanan kişi</th>}
                <th>Durum</th>
                {!isEmployee && <th style={{ width: 230 }}></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const owner = d.assignee_id ? empMap.get(d.assignee_id) : null
                return (
                  <tr key={d.id} className={anim.hoverRow}>
                    <td>
                      <div className="table__cell-primary">
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
                          <Icon name={(DEVICE_ICON[d.device_type] ?? 'laptop') as never} size={14} />
                        </div>
                        <div className="table__cell-stack">
                          <span className="table__cell-name">{d.name}</span>
                          <span className="table__cell-sub">{[d.brand, d.model].filter(Boolean).join(' ') || d.serial_number || d.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sec">{d.device_type}</td>
                    <td className="mono text-sec">{d.serial_number ?? '-'}</td>
                    <td className="text-sec">{d.location ?? '-'}</td>
                    <td className="text-sec" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.notes ?? '-'}
                    </td>
                    {!isEmployee && (
                      <td>
                        {owner ? (
                          <button className="row gap-2" onClick={() => navigate(`/employees/${owner.id}`)} style={{ cursor: 'pointer' }}>
                            <Avatar name={owner.full_name} size="sm" />
                            <span>{owner.full_name}</span>
                          </button>
                        ) : <span className="text-ter">-</span>}
                      </td>
                    )}
                    <td><StatusBadge status={d.status} /></td>
                    {!isEmployee && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                          {d.status === 'assigned' && (
                            <Button variant="secondary" size="sm" icon="arrowLeft" onClick={() => setReturnTarget(d)}>İade al</Button>
                          )}
                          {d.status === 'available' && (
                            <Button variant="primary" size="sm" icon="arrowRight" onClick={() => setAssignTarget(d)}>Ata</Button>
                          )}
                          {d.status === 'broken' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon="check"
                              disabled={deviceActionId === d.id}
                              onClick={() => handleRepairDevice(d)}
                            >
                              Tamir edildi
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              icon="alert"
                              disabled={deviceActionId === d.id}
                              onClick={() => handleMarkBroken(d)}
                            >
                              Arızalı
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>

      {!isEmployee && (
        <>
          {/* Cihaz ekle modal */}
          <AddDeviceModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onCreated={() => { setAddOpen(false); void load() }}
          />

          {/* Cihaz atama modal */}
          {assignTarget && (
            <AssignDeviceModal
              device={assignTarget}
              employees={assignableEmployees}
              open={!!assignTarget}
              onClose={() => setAssignTarget(null)}
              onAssigned={() => { setAssignTarget(null); void load() }}
              profileId={profile?.id}
            />
          )}

          {/* İade al device modal */}
          {returnTarget && (
            <ReturnDeviceModal
              device={returnTarget}
              assignee={returnTarget.assignee_id ? empMap.get(returnTarget.assignee_id) ?? null : null}
              open={!!returnTarget}
              onClose={() => setReturnTarget(null)}
              onReturned={() => { setReturnTarget(null); void load() }}
            />
          )}
        </>
      )}
    </>
  )
}


interface AddForm {
  name: string
  device_type: string
  brand: string
  model: string
  serial_number: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  location: string
  notes: string
}

const EMPTY_DEVICE_FORM: AddForm = {
  name: '',
  device_type: 'Laptop',
  brand: '',
  model: '',
  serial_number: '',
  invoice_number: '',
  invoice_date: '',
  invoice_amount: '',
  location: 'Merkez Ofis',
  notes: '',
}

function buildDeviceNotes(form: AddForm) {
  const invoiceParts = [
    form.invoice_number.trim() ? `No: ${form.invoice_number.trim()}` : '',
    form.invoice_date ? `Tarih: ${form.invoice_date}` : '',
    form.invoice_amount.trim() ? `Tutar: ${form.invoice_amount.trim()} TRY` : '',
  ].filter(Boolean)

  return [
    invoiceParts.length > 0 ? `Fatura - ${invoiceParts.join(' | ')}` : '',
    form.notes.trim(),
  ].filter(Boolean).join('\n')
}

function AddDeviceModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<AddForm>(EMPTY_DEVICE_FORM)
  const [errors, setErrors] = useState<Partial<AddForm>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function set(k: keyof AddForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  async function submit() {
    const e: Partial<AddForm> = {}
    if (!form.name.trim()) e.name = 'Zorunlu'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    try {
      setSaving(true)
      setSaveError(null)
      await createDevice({
        name: form.name,
        device_type: form.device_type,
        brand: form.brand || undefined,
        model: form.model || undefined,
        serial_number: form.serial_number || undefined,
        location: form.location || undefined,
        notes: buildDeviceNotes(form) || undefined,
      })
      setForm(EMPTY_DEVICE_FORM)
      onCreated()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Cihaz eklenemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title="Cihaz ekle" onClose={onClose} width={480}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button variant="primary" icon="check" onClick={submit} disabled={saving}>
            {saving ? 'Ekleniyor...' : 'Cihaz ekle'}
          </Button>
        </>
      }
    >
      <div className="grid grid--2">
        <Field label="Cihaz adı" required error={errors.name} htmlFor="ad-name">
          <Input id="ad-name" placeholder="Örn. MacBook Pro 14 - Burak" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
        </Field>
        <Field label="Cihaz türü" required htmlFor="ad-type">
          <Select id="ad-type" value={form.device_type} onChange={e => set('device_type', e.target.value)}>
            {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Marka" htmlFor="ad-brand">
          <Input id="ad-brand" placeholder="Örn. Apple" value={form.brand} onChange={e => set('brand', e.target.value)} />
        </Field>
        <Field label="Model" htmlFor="ad-model">
          <Input id="ad-model" placeholder="Örn. MacBook Pro 14 M3" value={form.model} onChange={e => set('model', e.target.value)} />
        </Field>
        <Field label="Seri numarası" hint="Bilinmiyorsa boş bırakın" htmlFor="ad-serial">
          <Input id="ad-serial" placeholder="SN123456" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
        </Field>
        <Field label="Fatura no" htmlFor="ad-invoice-no">
          <Input id="ad-invoice-no" placeholder="Örn. FTR-2026-001" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} />
        </Field>
        <Field label="Fatura tarihi" htmlFor="ad-invoice-date">
          <Input id="ad-invoice-date" type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
        </Field>
        <Field label="Fatura tutarı" htmlFor="ad-invoice-amount">
          <Input
            id="ad-invoice-amount"
            addon="TRY"
            type="number"
            min="0"
            placeholder="Örn. 45000"
            value={form.invoice_amount}
            onChange={e => set('invoice_amount', e.target.value)}
          />
        </Field>
        <Field label="Lokasyon" htmlFor="ad-location">
          <Input id="ad-location" placeholder="Örn. Merkez Ofis / Depo" value={form.location} onChange={e => set('location', e.target.value)} />
        </Field>
        <Field label="Notlar" htmlFor="ad-notes">
          <Input id="ad-notes" placeholder="Durum hakkında isteğe bağlı not..." value={form.notes} onChange={e => set('notes', e.target.value)} />
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


function AssignDeviceModal({
  device, employees, open, onClose, onAssigned, profileId,
}: {
  device: DeviceWithAssignee
  employees: EmployeeListItem[]
  open: boolean
  onClose: () => void
  onAssigned: () => void
  profileId?: string
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    if (!employeeId) return
    try {
      setSaving(true)
      setSaveError(null)
      await assignDevice(device.id, employeeId, profileId)
      onAssigned()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Cihaz atanamadı.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={`${device.name} cihazını ata`} onClose={onClose} width={400}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button variant="primary" icon="arrowRight" onClick={submit} disabled={saving || !employeeId}>
            {saving ? 'Atanıyor...' : 'Cihazı ata'}
          </Button>
        </>
      }
    >
      <div className="col gap-4">
        <div className="alert alert--info">
          <Icon name="laptop" size={14} />
          <div><strong>{device.name}</strong> ({device.device_type}) atanmış olarak işaretlenecek.</div>
        </div>
        <Field label="Atanacak kişi" required htmlFor="asgn-emp">
          {employees.length === 0 ? (
            <div className="text-ter">Aktif çalışan bulunmuyor.</div>
          ) : (
            <Select id="asgn-emp" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
            </Select>
          )}
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


function ReturnDeviceModal({
  device, assignee, open, onClose, onReturned,
}: {
  device: DeviceWithAssignee
  assignee: EmployeeListItem | null
  open: boolean
  onClose: () => void
  onReturned: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    if (!device.assignment_id) return
    try {
      setSaving(true)
      setSaveError(null)
      await returnDevice(device.id, device.assignment_id)
      onReturned()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Cihaz iade alınamadı.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title="Cihaz iadesi" onClose={onClose} width={400}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button variant="secondary" icon="arrowLeft" onClick={submit} disabled={saving}>
            {saving ? 'İşleniyor...' : 'İadeyi onayla'}
          </Button>
        </>
      }
    >
      <div className="col gap-4">
        <div className="alert alert--warning">
          <Icon name="alert" size={14} />
          <div>
            <strong>{device.name}</strong> atanmamış olarak işaretlenecek.
            {assignee && <> Şu anda atandığı kişi: <strong>{assignee.full_name}</strong>.</>}
          </div>
        </div>
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


