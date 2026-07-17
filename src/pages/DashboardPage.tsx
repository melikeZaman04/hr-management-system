import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { StatCard } from '../components/ui/StatCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Icon } from '../components/ui/Icon'
import { getEmployees, getActiveEmployeeCount } from '../features/employees/employeeService'
import { getDevicesForEmployee, getAssignedDeviceCount } from '../features/devices/deviceService'
import { getDocumentsForEmployee, getDocumentCount } from '../features/documents/documentService'
import { getLeaveRequestsForEmployee } from '../features/leave/leaveRequestService'

export function DashboardPage() {
  const { user, profile } = useAuth()
  const role = profile?.role ?? 'employee'
  const isEmployee = role === 'employee'
  const [activeEmployees, setActiveEmployees] = useState<number | null>(null)
  const [assignedDevices, setAssignedDevices] = useState<number | null>(null)
  const [documentCount, setDocumentCount] = useState<number | null>(null)

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [myLeaveCount, setMyLeaveCount] = useState<number | null>(null)
  const [myPendingLeaveCount, setMyPendingLeaveCount] = useState<number | null>(null)
  const [myDeviceCount, setMyDeviceCount] = useState<number | null>(null)
  const [myDocumentCount, setMyDocumentCount] = useState<number | null>(null)

  const firstName = profile?.full_name?.split(' ')[0]
    ?? (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'merhaba'

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const emps = await getEmployees().catch(() => [])
        if (!mounted) return

        const current = emps.find(e => e.profile_id === profile?.id)
          ?? emps.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase())
          ?? null

        setCurrentEmployeeId(current?.id ?? null)

        if (role === 'manager' && current) {
          const team = emps.filter(e => e.manager_id === current.id)
          setActiveEmployees(team.filter(e => e.employment_status === 'active').length)
        }

        if (isEmployee) {
          if (!current) {
            setMyLeaveCount(null)
            setMyPendingLeaveCount(null)
            setMyDeviceCount(null)
            setMyDocumentCount(null)
            return
          }
          const [leaves, devices, docs] = await Promise.all([
            getLeaveRequestsForEmployee(current.id).catch(() => []),
            getDevicesForEmployee(current.id).catch(() => []),
            getDocumentsForEmployee(current.id).catch(() => []),
          ])
          if (!mounted) return
          setMyLeaveCount(leaves.length)
          setMyPendingLeaveCount(leaves.filter(l => l.status === 'pending').length)
          setMyDeviceCount(devices.length)
          setMyDocumentCount(docs.length)
          return
        }

        if (role !== 'manager') {
          void getActiveEmployeeCount().then((n) => { if (mounted) setActiveEmployees(n) }).catch(() => null)
        }
        void getAssignedDeviceCount().then((n) => { if (mounted) setAssignedDevices(n) }).catch(() => null)
        void getDocumentCount().then((n) => { if (mounted) setDocumentCount(n) }).catch(() => null)
      } catch {
        // ignore dashboard metrics errors
      }
    })()
    return () => { mounted = false }
  }, [profile?.id, role, user?.email, isEmployee])

  const activityItems = isEmployee
    ? [
        myPendingLeaveCount !== null
          ? `Beklemede ${myPendingLeaveCount} izin talebin var`
          : 'İzin taleplerin yükleniyor',
        myDeviceCount !== null
          ? `${myDeviceCount} cihaz sana atanmış`
          : 'Cihazların yükleniyor',
        myDocumentCount !== null
          ? `${myDocumentCount} dokümanın kayıtlı`
          : 'Dokümanların yükleniyor',
      ]
    : [
        assignedDevices !== null
          ? `${assignedDevices} cihaz aktif olarak atanmış`
          : 'Cihaz sayısı yükleniyor',
        documentCount !== null
          ? `${documentCount} doküman sistemde kayıtlı`
          : 'Doküman sayısı yükleniyor',
      ]

  return (
    <>
      <PageHeader
        eyebrow="Çalışma Alanı"
        title={`Günaydın, ${firstName}`}
        subtitle={isEmployee ? 'Bugün senin için özet burada.' : 'Bugün ekibin için bekleyen işlemler burada.'}
      />

      {isEmployee && !currentEmployeeId && (
        <div className="alert alert--warning" style={{ marginBottom: 'var(--sp-6)' }}>
          <Icon name="alert" size={14} />
          <div>
            Bu hesap henüz bir çalışan kaydına bağlı değil. İzin, cihaz ve doküman özetini görebilmek için
            Supabase Auth kullanıcısı ile employees kaydındaki <strong>profile_id</strong> veya e-posta eşleşmeli.
          </div>
        </div>
      )}

      <div className="grid grid--3" style={{ marginBottom: 'var(--sp-6)' }}>
        {isEmployee ? (
          <>
            <StatCard
              label="İzin taleplerim"
              value={myLeaveCount !== null ? String(myLeaveCount) : '—'}
              icon="calendar"
              delta={myPendingLeaveCount !== null ? `Beklemede: ${myPendingLeaveCount}` : undefined}
              deltaDir={myPendingLeaveCount !== null && myPendingLeaveCount > 0 ? 'down' : undefined}
            />
            <StatCard
              label="Cihazlarım"
              value={myDeviceCount !== null ? String(myDeviceCount) : '—'}
              icon="laptop"
            />
            <StatCard
              label="Dokümanlarım"
              value={myDocumentCount !== null ? String(myDocumentCount) : '—'}
              icon="document"
            />
          </>
        ) : (
          <>
            <StatCard label="Aktif çalışan" value={activeEmployees !== null ? String(activeEmployees) : '—'} icon="users" delta="+3 bu ay" deltaDir="up" sparkline="M0,18 L10,16 L20,17 L30,12 L40,13 L50,9 L60,10 L70,7 L80,5" />
            <StatCard label="Atanmış cihaz" value={assignedDevices !== null ? String(assignedDevices) : '—'} icon="laptop" delta="+1 bu hafta" deltaDir="up" sparkline="M0,14 L10,13 L20,12 L30,11 L40,11 L50,10 L60,8 L70,8 L80,7" />
            <StatCard label="Kayıtlı doküman" value={documentCount !== null ? String(documentCount) : '—'} icon="document" delta="Bu ay 6 ekleme" deltaDir="up" sparkline="M0,16 L10,14 L20,15 L30,12 L40,13 L50,10 L60,11 L70,9 L80,8" />
          </>
        )}
      </div>

      <Panel title={<><Icon name="sparkle" size={14} /><span>Son aktiviteler</span></>} padded>
        <div className="col gap-3">
          {activityItems.map((item) => (
            <div key={item} className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <Icon name="check" size={14} className="text-ter" />
              <span className="text-sec" style={{ fontSize: 'var(--fs-13)', lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
