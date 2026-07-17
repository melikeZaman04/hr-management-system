import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import {
  calcSalary, saveSalaryRecord, getSalaryRecords, getApprovedUnpaidLeaveDaysForPeriod,
  type SalaryRecord,
} from '../features/salary/salaryService'
import { useAuth } from '../features/auth/useAuth'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Field, Input, Select } from '../components/ui/Field'
import { EmptyState, SkeletonRow } from '../components/ui/State'
import { downloadCsv } from '../lib/exportCsv'

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })

export function SalaryCalculationPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()

  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [empId, setEmpId] = useState(searchParams.get('employee_id') ?? '')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [unpaidDays, setUnpaidDays] = useState(0)
  const [unpaidDaysLoading, setUnpaidDaysLoading] = useState(false)
  const [unpaidDaysError, setUnpaidDaysError] = useState<string | null>(null)
  const [overtimeHours, setOvertimeHours] = useState(0)
  const [overtimeRateOverride, setOvertimeRateOverride] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const unpaidFetchSeq = useRef(0)

  const empMap = new Map(employees.map(e => [e.id, e]))

  useEffect(() => {
    void getEmployees().then(emps => {
      setEmployees(emps)
      setEmpId(cur => cur || emps[0]?.id || '')
    }).catch(() => null)

    void getSalaryRecords().then(r => {
      setRecords(r)
      setRecordsLoading(false)
    }).catch(() => setRecordsLoading(false))
  }, [])

  const emp = employees.find(e => e.id === empId)
  const base = emp?.base_salary ?? 0
  const hourlyPreview = calcSalary(base, unpaidDays).hourly
  const overtimeHourlyRate = overtimeRateOverride.trim()
    ? Math.max(0, Number(overtimeRateOverride))
    : hourlyPreview
  const { monthlyBase, daily, hourly, overtimeAmount, deduction, total } = calcSalary(
    base,
    unpaidDays,
    overtimeHours,
    overtimeHourlyRate,
  )

  const activeEmployees = employees.filter(e => e.employment_status === 'active')

  const loadApprovedUnpaidDays = useCallback(async () => {
    const seq = unpaidFetchSeq.current + 1
    unpaidFetchSeq.current = seq

    if (!empId) {
      setUnpaidDays(0)
      setUnpaidDaysError(null)
      setUnpaidDaysLoading(false)
      return
    }

    setUnpaidDaysLoading(true)
    setUnpaidDaysError(null)

    try {
      const days = await getApprovedUnpaidLeaveDaysForPeriod(empId, month, year)
      if (unpaidFetchSeq.current === seq) setUnpaidDays(days)
    } catch (err) {
      if (unpaidFetchSeq.current === seq) {
        setUnpaidDays(0)
        setUnpaidDaysError(err instanceof Error ? err.message : 'Ücretsiz izin günleri alınamadı.')
      }
    } finally {
      if (unpaidFetchSeq.current === seq) setUnpaidDaysLoading(false)
    }
  }, [empId, month, year])

  useEffect(() => {
    void Promise.resolve().then(loadApprovedUnpaidDays)
  }, [loadApprovedUnpaidDays])

  async function handleSave() {
    if (!empId) return
    try {
      setSaving(true)
      setSaveError(null)
      const record = await saveSalaryRecord({
        employee_id: empId,
        month,
        year,
        base_salary: base,
        unpaid_leave_days: unpaidDays,
        deduction_amount: deduction,
        overtime_hours: overtimeHours,
        overtime_hourly_rate: overtimeHourlyRate,
        overtime_amount: overtimeAmount,
        calculated_salary: total,
        calculated_by: profile?.id ?? null,
      })
      setRecords(prev => [{
        ...record,
        overtime_hours: overtimeHours,
        overtime_hourly_rate: overtimeHourlyRate,
        overtime_amount: overtimeAmount,
      }, ...prev])
      setLastSaved(new Date().toISOString())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Hesaplama kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  function exportSalaryRecords() {
    downloadCsv(
      'maas-hesaplamalari.csv',
      ['Çalışan', 'Dönem', 'Baz Maaş', 'Ücretsiz Gün', 'Kesinti', 'Mesai Saati', 'Mesai Tutarı', 'Hesaplanan Maaş'],
      records.map(r => {
        const e = empMap.get(r.employee_id)
        return [
          e?.full_name ?? r.employee_id,
          `${MONTHS[r.month - 1]} ${r.year}`,
          r.base_salary,
          r.unpaid_leave_days,
          r.deduction_amount,
          r.overtime_hours ?? 0,
          r.overtime_amount ?? 0,
          r.calculated_salary,
        ]
      }),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Bordro"
        title="Maaş hesaplama"
        subtitle="Ücretsiz izin sonrası aylık maaş tahminini hesaplayın. Bu ekran iç kullanım içindir, resmi bordro belgesi değildir."
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={exportSalaryRecords} disabled={records.length === 0}>CSV dışa aktar</Button>
            <Button
              variant="primary"
              icon="check"
              disabled={saving || !empId}
              onClick={handleSave}
            >
              {saving ? 'Kaydediliyor...' : 'Hesaplamayı kaydet'}
            </Button>
          </>
        }
      />

      <div className="alert alert--info" style={{ marginBottom: 'var(--sp-6)' }}>
        <Icon name="info" size={14} />
        <div>Bu modül iç tahmin içindir. Nihai bordro işlemi muhasebe sisteminde tamamlanır.</div>
      </div>

      {saveError && (
        <div className="alert alert--danger" style={{ marginBottom: 'var(--sp-4)' }}>
          <Icon name="alert" size={14} />
          <div>{saveError}</div>
        </div>
      )}

      {unpaidDaysError && (
        <div className="alert alert--danger" style={{ marginBottom: 'var(--sp-4)' }}>
          <Icon name="alert" size={14} />
          <div>{unpaidDaysError}</div>
        </div>
      )}

      <div className="calc">
        <div className="calc__head">
          <div className="row gap-3">
            <Icon name="wallet" size={14} className="text-ter" />
            <strong style={{ fontSize: 'var(--fs-14)' }}>Dönem</strong>
            <Badge tone="info" dot={false}>{MONTHS[month - 1]} {year}</Badge>
          </div>
          <div className="text-ter" style={{ fontSize: 'var(--fs-12)' }}>
            {lastSaved ? `Son kayıt: ${fmtDate(lastSaved)}` : 'Henüz kaydedilmedi'}
          </div>
        </div>

        <div className="calc__body">
          <div className="calc__inputs">
            <Field label="Çalışan" required htmlFor="emp">
              <Select id="emp" value={empId} onChange={e => setEmpId(e.target.value)}>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid--2">
              <Field label="Ay" required htmlFor="mo">
                <Select id="mo" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </Select>
              </Field>
              <Field label="Yıl" required htmlFor="yr">
                <Select id="yr" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Baz maaş" hint="Çalışan kaydından alınır" htmlFor="base">
              <Input id="base" addon="TRY" value={base.toLocaleString('tr-TR')} readOnly />
            </Field>

            <Field
              label="Ücretsiz izin günü"
              hint={unpaidDaysLoading ? 'Onaylı ücretsiz izinler okunuyor' : 'Onaylı ücretsiz izin taleplerinden otomatik hesaplanır'}
              htmlFor="days"
            >
              <Input
                id="days"
                addon="days"
                type="number"
                min="0"
                value={unpaidDays}
                readOnly
              />
            </Field>

            <div className="grid grid--2">
              <Field label="Mesai saati" htmlFor="ot-hours">
                <Input
                  id="ot-hours"
                  addon="saat"
                  type="number"
                  min="0"
                  step="0.5"
                  value={overtimeHours}
                  onChange={e => setOvertimeHours(Math.max(0, Number(e.target.value)))}
                />
              </Field>
              <Field label="Saatlik mesai ücreti" hint={`Varsayılan: ${fmtCurrency(hourly)}`} htmlFor="ot-rate">
                <Input
                  id="ot-rate"
                  addon="TRY"
                  type="number"
                  min="0"
                  placeholder={String(hourly)}
                  value={overtimeRateOverride}
                  onChange={e => setOvertimeRateOverride(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="calc__summary">
            {emp ? (
              <div className="row gap-3">
                <Avatar name={emp.full_name} size="md" />
                <div className="col">
                  <strong>{emp.full_name}</strong>
                  <span className="text-ter" style={{ fontSize: 'var(--fs-12)' }}>{emp.position} · {emp.department}</span>
                </div>
              </div>
            ) : (
              <div className="text-ter">Bir çalışan seçin</div>
            )}
            <div className="calc__divider" />
            <div className="calc__row">
              <span className="calc__row-label">Baz maaş</span>
              <span className="calc__row-value">{fmtCurrency(base)}</span>
            </div>
            <div className="calc__row">
              <span className="calc__row-label">Maaş dönemi ({MONTHS[month - 1]})</span>
              <span className="calc__row-value">{fmtCurrency(monthlyBase)}</span>
            </div>
            <div className="calc__row">
              <span className="calc__row-label">Yaklaşık günlük ücret</span>
              <span className="calc__row-value">{fmtCurrency(daily)}</span>
            </div>
            <div className="calc__row">
              <span className="calc__row-label">Yaklaşık saatlik ücret</span>
              <span className="calc__row-value">{fmtCurrency(overtimeHourlyRate)}</span>
            </div>
            <div className="calc__row">
              <span className="calc__row-label">Ücretsiz izin kesintisi ({unpaidDays} gün)</span>
              <span className="calc__row-value" style={{ color: deduction ? 'var(--status-danger-fg)' : undefined }}>
                {deduction ? `-${fmtCurrency(deduction)}` : '-'}
              </span>
            </div>
            <div className="calc__row">
              <span className="calc__row-label">Mesai ek ödemesi ({overtimeHours} saat)</span>
              <span className="calc__row-value" style={{ color: overtimeAmount ? 'var(--status-success-fg)' : undefined }}>
                {overtimeAmount ? `+${fmtCurrency(overtimeAmount)}` : '-'}
              </span>
            </div>
            <div className="calc__divider" />
            <div className="calc__total">
              <span className="calc__total-l">Hesaplanan maaş</span>
              <span className="calc__total-v">{fmtCurrency(total)}</span>
            </div>
            <div className="calc__note">
              Hesaplama ayı 30 gün ve iş günü 7,5 saat kabul eder. Resmi bordro çıktısı değildir; muhasebe sisteminizle doğrulayın.
            </div>
          </div>
        </div>
      </div>

      {/* Son hesaplamalar */}
      <Panel
        title="Son hesaplamalar"
        style={{ marginTop: 'var(--sp-6)' } as React.CSSProperties}
      >
        {recordsLoading ? (
          <table className="table"><tbody>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}</tbody></table>
        ) : records.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Henüz kayıtlı hesaplama yok"
            desc="Kaydedilen hesaplamalar burada görünür. Bu tahmini kaydetmek için yukarıdaki butonu kullanın."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Çalışan</th>
                <th>Dönem</th>
                <th style={{ textAlign: 'right' }}>Baz maaş</th>
                <th style={{ textAlign: 'right' }}>Ücretsiz gün</th>
                <th style={{ textAlign: 'right' }}>Kesinti</th>
                <th style={{ textAlign: 'right' }}>Mesai</th>
                <th style={{ textAlign: 'right' }}>Mesai tutarı</th>
                <th style={{ textAlign: 'right' }}>Hesaplanan maaş</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map(r => {
                const e = empMap.get(r.employee_id)
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="table__cell-stack">
                        <span className="table__cell-name">{e?.full_name ?? r.employee_id}</span>
                        <span className="table__cell-sub">{e?.department}</span>
                      </div>
                    </td>
                    <td className="text-sec">{MONTHS[r.month - 1]} {r.year}</td>
                    <td style={{ textAlign: 'right' }} className="tabnum">{fmtCurrency(r.base_salary)}</td>
                    <td style={{ textAlign: 'right' }} className="tabnum">{r.unpaid_leave_days}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: r.deduction_amount ? 'var(--status-danger-fg)' : undefined,
                      }}
                      className="tabnum"
                    >
                      {r.deduction_amount ? `-${fmtCurrency(r.deduction_amount)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="tabnum">{r.overtime_hours ?? 0}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: r.overtime_amount ? 'var(--status-success-fg)' : undefined,
                      }}
                      className="tabnum"
                    >
                      {r.overtime_amount ? `+${fmtCurrency(r.overtime_amount)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="tabnum">
                      <strong>{fmtCurrency(r.calculated_salary)}</strong>
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


