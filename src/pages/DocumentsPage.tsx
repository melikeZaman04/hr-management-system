import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDocuments, getDocumentsForEmployee, uploadEmployeeDocument, getSignedUrl,
  deleteDocument,
  DOCUMENT_TYPE_LABELS,
  type Document,
} from '../features/documents/documentService'
import { getEmployees, getEmployeeForAuth, type EmployeeListItem } from '../features/employees/employeeService'
import { useAuth } from '../features/auth/useAuth'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Field, Select } from '../components/ui/Field'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'
import { downloadCsv } from '../lib/exportCsv'

const UPLOADABLE_TYPES = Object.entries(DOCUMENT_TYPE_LABELS).filter(
  ([k]) => k !== 'device_invoice' && k !== 'assignment_document',
) as [Document['document_type'], string][]

const MAX_FILE_BYTES = 10 * 1024 * 1024  // 10 MB

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })

export function DocumentsPage() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const role = profile?.role ?? 'employee'
  const isEmployee = role === 'employee'

  const [documents, setDocuments] = useState<Document[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [empF, setEmpF] = useState('all')
  const [typeF, setTypeF] = useState('all')

  // Upload panel state
  const [uploadEmp, setUploadEmp] = useState('')
  const [uploadType, setUploadTür] = useState<Document['document_type']>('employee_document')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Download state: docId -> 'loading' | 'error'
  const [downloadState, setDownloadState] = useState<Record<string, 'loading' | 'error'>>({})
  const [deleteState, setDeleteState] = useState<Record<string, 'loading' | 'error'>>({})

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (isEmployee) {
        const emp = await getEmployeeForAuth({ profileId: profile?.id ?? null, email: user?.email ?? null })
        setCurrentEmployee(emp)
        setEmployees(emp ? [emp] : [])
        setEmpF(emp?.id ?? 'all')
        setUploadEmp(emp?.id ?? '')
        setDocuments(emp ? await getDocumentsForEmployee(emp.id) : [])
        return
      }

      const [docs, emps] = await Promise.all([getDocuments(), getEmployees()])
      setDocuments(docs)
      setEmployees(emps)
      setCurrentEmployee(null)
      setUploadEmp(current => current || emps[0]?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dokümanlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [isEmployee, profile, user])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  const empMap = new Map(employees.map(e => [e.id, e]))

  const filtered = documents.filter(d => {
    if (!isEmployee && empF !== 'all' && d.employee_id !== empF) return false
    if (typeF !== 'all' && d.document_type !== typeF) return false
    return true
  })

  const docTypes = [...new Set(documents.map(d => d.document_type))]


  function validateAndSetFile(file: File | null) {
    setUploadError(null)
    if (!file) { setUploadFile(null); return }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('Dosya çok büyük. En fazla 10 MB yükleyebilirsiniz.')
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(ext)) {
      setUploadError('Desteklenmeyen dosya türü. PDF, JPG, PNG, DOC veya DOCX kullanın.')
      return
    }
    setUploadFile(file)
  }

  function validateFileForUpload(file: File | null): { ok: true, file: File } | { ok: false } {
    setUploadError(null)
    if (!file) return { ok: false }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('Dosya çok büyük. En fazla 10 MB yükleyebilirsiniz.')
      return { ok: false }
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(ext)) {
      setUploadError('Desteklenmeyen dosya türü. PDF, JPG, PNG, DOC veya DOCX kullanın.')
      return { ok: false }
    }
    return { ok: true, file }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    validateAndSetFile(e.dataTransfer.files[0] ?? null)
  }

  async function handleEmployeeQuickUpload(file: File | null) {
    const v = validateFileForUpload(file)
    if (!v.ok) return
    if (!currentEmployee) {
      setUploadError('Çalışan kaydı bulunamadı. Doküman yüklemek için hesabınız employees kaydıyla eşleşmeli.')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)
      const doc = await uploadEmployeeDocument({
        file: v.file,
        employeeId: currentEmployee.id,
        documentType: uploadType,
        uploadedByProfileId: profile?.id ?? null,
      })
      setDocuments(prev => [doc, ...prev])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükleme başarısız.')
    } finally {
      setUploading(false)
    }
  }


  async function handleUpload() {
    if (!uploadFile) { setUploadError('Önce bir dosya seçin.'); return }
    if (!uploadEmp) { setUploadError('Bir çalışan seçin.'); return }

    try {
      setUploading(true)
      setUploadError(null)
      const doc = await uploadEmployeeDocument({
        file: uploadFile,
        employeeId: uploadEmp,
        documentType: uploadType,
        uploadedByProfileId: profile?.id ?? null,
      })
      setDocuments(prev => [doc, ...prev])
      setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükleme başarısız.')
    } finally {
      setUploading(false)
    }
  }


  async function handleDownload(doc: Document) {
    setDownloadState(s => ({ ...s, [doc.id]: 'loading' }))
    try {
      const url = await getSignedUrl(doc.storage_bucket, doc.storage_path, 60)
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.click()
      setDownloadState(s => { const n = { ...s }; delete n[doc.id]; return n })
    } catch {
      setDownloadState(s => ({ ...s, [doc.id]: 'error' }))
    }
  }

  async function handleDelete(doc: Document) {
    const ok = window.confirm(`"${doc.file_name}" dokümanını silmek istiyor musunuz? Bu işlem geri alınamaz.`)
    if (!ok) return

    setDeleteState(s => ({ ...s, [doc.id]: 'loading' }))
    try {
      await deleteDocument(doc)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      setDeleteState(s => { const n = { ...s }; delete n[doc.id]; return n })
    } catch {
      setDeleteState(s => ({ ...s, [doc.id]: 'error' }))
    }
  }

  function exportDocuments() {
    downloadCsv(
      'dokumanlar.csv',
      ['Dosya', 'Tür', 'Çalışan', 'Bucket', 'Storage Path', 'Yüklenme Tarihi'],
      filtered.map(d => {
        const emp = d.employee_id ? empMap.get(d.employee_id) : null
        return [
          d.file_name,
          DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type,
          emp?.full_name ?? '',
          d.storage_bucket,
          d.storage_path,
          d.created_at,
        ]
      }),
    )
  }


  return (
    <>
      <PageHeader
        eyebrow="Kayıtlar"
        title={isEmployee ? 'Dokümanlarım' : 'Dokümanlar'}
        subtitle={isEmployee
          ? 'Yüklediğiniz dokümanları görüntüleyin ve indirin.'
          : 'İK dokümanlarını yükleyin, görüntüleyin ve indirin.'}
        actions={isEmployee ? (
          <Button
            variant="primary"
            icon="upload"
            disabled={!currentEmployee || uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Doküman yükle
          </Button>
        ) : (
          <>
            <Button variant="secondary" icon="download" onClick={exportDocuments} disabled={filtered.length === 0}>CSV dışa aktar</Button>
            <Button variant="primary" icon="upload" onClick={() => fileInputRef.current?.click()}>
              Doküman yükle
            </Button>
          </>
        )}
      />

      {isEmployee && !currentEmployee && (
        <div className="alert alert--warning" style={{ marginBottom: 'var(--sp-6)' }}>
          <Icon name="alert" size={14} />
          <div>
            Bu hesap henüz bir çalışan kaydına bağlı değil. Dokümanlarınızı görebilmek için
            Supabase Auth kullanıcısı ile employees kaydındaki <strong>profile_id</strong> veya e-posta eşleşmeli.
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0] ?? null
          if (isEmployee) { void handleEmployeeQuickUpload(file); return }
          validateAndSetFile(file)
        }}
      />

      {isEmployee ? (
        <>
          <Panel
            title="Yeni doküman yükle"
            padded
            style={{ marginBottom: 'var(--sp-6)' } as React.CSSProperties}
          >
            <div className="grid grid--2">
              <Field label="Doküman türü" required htmlFor="employee-upload-type">
                <Select id="employee-upload-type" value={uploadType} onChange={e => setUploadTür(e.target.value as Document['document_type'])}>
                  {UPLOADABLE_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Dosya" htmlFor="employee-upload-file">
                <Button
                  id="employee-upload-file"
                  variant="primary"
                  icon="upload"
                  disabled={!currentEmployee || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Yükleniyor...' : 'Dosya seç'}
                </Button>
              </Field>
            </div>
            {uploadError && (
              <div className="alert alert--danger" style={{ marginTop: 'var(--sp-4)' }}>
                <Icon name="alert" size={14} />
                <div>{uploadError}</div>
              </div>
            )}
          </Panel>

          <Panel
            title={`${filtered.length} doküman`}
            actions={
              <div className="row gap-2">
                <select className="select" style={{ width: 180, height: 32, fontSize: 'var(--fs-13)' }}
                  value={typeF} onChange={e => setTypeF(e.target.value)}>
                  <option value="all">Tüm türler</option>
                  {docTypes.map(t => <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t] ?? t}</option>)}
                </select>
              </div>
            }
          >
            {loading ? (
              <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
            ) : error ? (
              <ErrorState desc={error} action={<Button onClick={load}>Tekrar dene</Button>} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="document"
                title="Henüz doküman yok"
                desc="Henüz yüklediğiniz bir doküman bulunmuyor."
              />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Dosya</th>
                    <th>Tür</th>
                    <th>Çalışan</th>
                    <th>Yüklendi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const emp = d.employee_id ? empMap.get(d.employee_id) : null
                    const dlState = downloadState[d.id]
                    const delState = deleteState[d.id]
                    return (
                      <tr key={d.id}>
                        <td>
                          <div className="table__cell-primary">
                            <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
                              <Icon name="paperclip" size={14} />
                            </div>
                            <div className="table__cell-stack">
                              <span className="table__cell-name mono" style={{ fontSize: 'var(--fs-13)' }}>{d.file_name}</span>
                              <span className="table__cell-sub">{fmtDate(d.created_at)}</span>
                            </div>
                          </div>
                        </td>
                        <td><Badge tone="info" dot={false}>{DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type}</Badge></td>
                        <td>
                          {emp ? (
                            <button className="row gap-2" onClick={() => navigate(`/employees/${emp.id}`)} style={{ cursor: 'pointer' }}>
                              <Avatar name={emp.full_name} size="sm" />
                              <span>{emp.full_name}</span>
                            </button>
                          ) : <span className="text-ter">-</span>}
                        </td>
                        <td className="text-sec">{fmtDate(d.created_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="download"
                              aria-label="İndir"
                              disabled={dlState === 'loading'}
                              onClick={() => handleDownload(d)}
                            >
                              {dlState === 'loading' ? '...' : dlState === 'error' ? 'Hata' : ''}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon="trash"
                              aria-label="Sil"
                              disabled={delState === 'loading'}
                              onClick={() => handleDelete(d)}
                            >
                              {delState === 'loading' ? '...' : delState === 'error' ? 'Hata' : ''}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      ) : (
        <div className="grid grid--12-8" style={{ alignItems: 'start' }}>

          <Panel
            title={`${filtered.length} doküman`}
            actions={
              <div className="row gap-2">
                <select className="select" style={{ width: 200, height: 32, fontSize: 'var(--fs-13)' }}
                  value={empF} onChange={e => setEmpF(e.target.value)}>
                  <option value="all">Tüm çalışanlar</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
                <select className="select" style={{ width: 180, height: 32, fontSize: 'var(--fs-13)' }}
                  value={typeF} onChange={e => setTypeF(e.target.value)}>
                  <option value="all">Tüm türler</option>
                  {docTypes.map(t => <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t] ?? t}</option>)}
                </select>
              </div>
            }
          >
            {loading ? (
              <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
            ) : error ? (
              <ErrorState desc={error} action={<Button onClick={load}>Tekrar dene</Button>} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="document"
                title="Henüz doküman yok"
                desc="İlk dokümanı eklemek için yükleme panelini kullanın."
                action={<Button variant="primary" icon="upload" onClick={() => fileInputRef.current?.click()}>Doküman yükle</Button>}
              />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Dosya</th>
                    <th>Tür</th>
                    <th>Çalışan</th>
                    <th>Yüklendi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const emp = d.employee_id ? empMap.get(d.employee_id) : null
                    const dlState = downloadState[d.id]
                    const delState = deleteState[d.id]
                    return (
                      <tr key={d.id}>
                        <td>
                          <div className="table__cell-primary">
                            <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
                              <Icon name="paperclip" size={14} />
                            </div>
                            <div className="table__cell-stack">
                              <span className="table__cell-name mono" style={{ fontSize: 'var(--fs-13)' }}>{d.file_name}</span>
                              <span className="table__cell-sub">{fmtDate(d.created_at)}</span>
                            </div>
                          </div>
                        </td>
                        <td><Badge tone="info" dot={false}>{DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type}</Badge></td>
                        <td>
                          {emp ? (
                            <button className="row gap-2" onClick={() => navigate(`/employees/${emp.id}`)} style={{ cursor: 'pointer' }}>
                              <Avatar name={emp.full_name} size="sm" />
                              <span>{emp.full_name}</span>
                            </button>
                          ) : <span className="text-ter">-</span>}
                        </td>
                        <td className="text-sec">{fmtDate(d.created_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="download"
                              aria-label="İndir"
                              disabled={dlState === 'loading'}
                              onClick={() => handleDownload(d)}
                            >
                              {dlState === 'loading' ? '...' : dlState === 'error' ? 'Hata' : ''}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon="trash"
                              aria-label="Sil"
                              disabled={delState === 'loading'}
                              onClick={() => handleDelete(d)}
                            >
                              {delState === 'loading' ? '...' : delState === 'error' ? 'Hata' : ''}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Panel>

          <div className="col gap-4">
            <Panel title="Yeni doküman yükle" padded>

              {/* Drop zone */}
              <div
                className={`uploader${dragOver ? ' uploader--active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Icon name="upload" size={20} />
                {uploadFile ? (
                  <>
                    <div className="uploader__title">{uploadFile.name}</div>
                    <div className="uploader__sub">{(uploadFile.size / 1024).toFixed(0)} KB - değiştirmek için tıklayın</div>
                  </>
                ) : (
                  <>
                    <div className="uploader__title">Dosyayı buraya sürükleyin veya seçmek için tıklayın</div>
                    <div className="uploader__sub">PDF, JPG, PNG, DOC. En fazla 10 MB</div>
                  </>
                )}
              </div>

              <div className="col gap-3" style={{ marginTop: 'var(--sp-4)' }}>
                <Field label="Doküman türü" required htmlFor="utype">
                  <Select id="utype" value={uploadType} onChange={e => setUploadTür(e.target.value as Document['document_type'])}>
                    {UPLOADABLE_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </Select>
                </Field>
                <Field label="Çalışan" required htmlFor="uemp">
                  <Select id="uemp" value={uploadEmp} onChange={e => setUploadEmp(e.target.value)}>
                    <option value="" disabled>Çalışan seç...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </Select>
                </Field>

                {uploadError && (
                  <div className="alert alert--danger">
                    <Icon name="alert" size={14} />
                    <div>{uploadError}</div>
                  </div>
                )}

                <Button
                  variant="primary"
                  block
                  icon="upload"
                  disabled={uploading || !uploadFile}
                  onClick={handleUpload}
                >
                  {uploading ? 'Yükleniyor...' : 'Yükle'}
                </Button>
                <div className="text-ter" style={{ fontSize: 'var(--fs-12)' }}>
                  Dosyalar Supabase Storage içinde saklanır. RLS politikaları her dokümanı kimin görebileceğini kontrol eder.
                </div>
              </div>
            </Panel>

            <Panel title="Depolama" padded>
              <div className="col gap-3">
                <div className="row row--between">
                  <span className="text-ter">Toplam doküman</span>
                  <span className="tabnum">{documents.length}</span>
                </div>
                <div className="row row--between text-ter" style={{ fontSize: 'var(--fs-12)' }}>
                  <span>Bucket: employee-documents</span>
                  <span>Özel</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}


