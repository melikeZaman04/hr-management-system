import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { getLeaveRequestsForEmployee, type LeaveRequest } from '../features/leave/leaveRequestService'
import { getDevicesForEmployee, type DeviceWithAssignee } from '../features/devices/deviceService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Tabs } from '../components/ui/Tabs'
import { DetailField } from '../components/ui/DetailField'
import { EmptyState, LoadingState } from '../components/ui/State'

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

const LEAVE_TYPE_LABELS: Record<LeaveRequest['leave_type'], string> = {
  annual: 'Yıllık izin',
  unpaid: 'Ücretsiz izin',
  sick: 'Hastalık izni',
  other: 'Diğer',
}

// Finds the employees row that belongs to the logged-in user via profile_id.
// Falls back to email match if profile_id is not yet linked.
function findMyEmployee(
  employees: EmployeeListItem[],
  profileId: string | undefined,
  email: string | undefined,
) {
  if (profileId) {
    const byProfile = employees.find((e) => e.profile_id === profileId)
    if (byProfile) return byProfile
  }
  if (email) {
    return employees.find((e) => e.email?.toLowerCase() === email.toLowerCase()) ?? null
  }
  return null
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const [employee, setEmployee] = useState<EmployeeListItem | null>(null)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [devices, setDevices] = useState<DeviceWithAssignee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        const emps = await getEmployees()
        const me = findMyEmployee(emps, profile?.id, user?.email)
        setEmployee(me)
        if (me) {
          const [lv, dv] = await Promise.all([
            getLeaveRequestsForEmployee(me.id).catch(() => []),
            getDevicesForEmployee(me.id).catch(() => []),
          ])
          setLeaves(lv)
          setDevices(dv)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [profile?.id, user?.email])

  if (loading) return <LoadingState />

  const displayName = profile?.full_name ?? user?.email ?? 'Ben'

  return (
    <>
      <PageHeader
        eyebrow="Hesap"
        title="Profilim"
        subtitle="Çalışma bilgilerinizi ve size ait hareketleri görüntüleyin."
        actions={
          <Button variant="secondary" icon="mail" onClick={() => window.location.href = `mailto:${user?.email}`}>
            İK ile iletişime geç
          </Button>
        }
      />

      {!employee ? (
        <Panel padded>
          <EmptyState
            icon="users"
            title="Bağlı çalışan kaydı yok"
            desc="Giriş hesabınız henüz bir çalışan kaydına bağlanmamış. İK yöneticinizle iletişime geçin."
          />
        </Panel>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 'var(--sp-6)' }}>
            <div className="panel__body" style={{ display: 'flex', gap: 'var(--sp-5)', alignItems: 'center', padding: 'var(--sp-6)' }}>
              <Avatar name={displayName} size="xl" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row gap-3" style={{ marginBottom: 6 }}>
                  <h2 style={{ fontSize: 'var(--fs-24)', letterSpacing: '-0.02em' }}>{employee.full_name}</h2>
                  <StatusBadge status={employee.employment_status} />
                </div>
                <div className="row gap-4 text-sec" style={{ fontSize: 'var(--fs-13)', flexWrap: 'wrap' }}>
                  {employee.position && <span className="row gap-2"><Icon name="briefcase" size={13} />{employee.position}</span>}
                  {employee.department && <span className="row gap-2"><Icon name="building" size={13} />{employee.department}</span>}
                  <span className="row gap-2"><Icon name="mail" size={13} />{employee.email}</span>
                </div>
              </div>
            </div>
          </div>

          <Tabs
            active={tab}
            onChange={setTab}
            items={[
              { id: 'overview', label: 'Genel Bakış' },
              { id: 'leave',    label: 'İzinlerim',   count: leaves.length },
              { id: 'devices',  label: 'Cihazlarım', count: devices.length },
            ]}
          />

          {tab === 'overview' && (
            <div className="grid grid--12-8" style={{ alignItems: 'start' }}>
              <Panel title="Çalışma bilgileri" padded>
                <div className="detail-grid">
                  <DetailField label="Ad Soyad"         value={employee.full_name} />
                  <DetailField label="İş e-postası"        value={employee.email} mono />
                  <DetailField label="Departman"        value={employee.department ?? undefined} />
                  <DetailField label="Pozisyon"          value={employee.position ?? undefined} />
                  <DetailField label="Çalışma durumu" value={<StatusBadge status={employee.employment_status} />} />
                  <DetailField label="Baz maaş"       value={fmtCurrency(employee.base_salary)} mono />
                </div>
              </Panel>
              <Panel title="Özet" padded>
                <div className="col gap-3">
                  <div className="row row--between"><span className="text-ter">Cihazlar</span><span className="tabnum">{devices.length}</span></div>
                  <div className="row row--between"><span className="text-ter">İzin talepleri</span><span className="tabnum">{leaves.length}</span></div>
                  <div className="row row--between">
                    <span className="text-ter">Bekleyen izin</span>
                    <span className="tabnum">{leaves.filter(l => l.status === 'pending').length}</span>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {tab === 'leave' && (
            <Panel
              title="İzin taleplerim"
              actions={<Button variant="primary" size="sm" icon="plus" onClick={() => navigate('/leave-requests')}>Yeni talep</Button>}
            >
              {leaves.length === 0 ? (
                <EmptyState icon="calendar" title="İzin talebi yok" desc="İzin geçmişiniz burada görünecek." />
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Tür</th><th>Tarihler</th><th style={{ textAlign: 'right' }}>Gün</th><th>Durum</th><th>Gerekçe</th></tr>
                  </thead>
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
            <Panel title="Cihazlarım">
              {devices.length === 0 ? (
                <EmptyState icon="laptop" title="Atanmış cihaz yok" desc="Size atanan cihazlar burada görünecek." />
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Cihaz</th><th>Tür</th><th>Seri numarası</th><th>Durum</th></tr>
                  </thead>
                  <tbody>
                    {devices.map(d => (
                      <tr key={d.id}>
                        <td className="table__cell-name">{d.name}</td>
                        <td className="text-sec">{d.device_type}</td>
                        <td className="mono text-sec">{d.serial_number}</td>
                        <td><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          )}
        </>
      )}
    </>
  )
}



