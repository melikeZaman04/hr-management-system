import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments, type Document } from '../features/documents/documentService'
import { getEmployees, type EmployeeListItem } from '../features/employees/employeeService'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { Field, Select } from '../components/ui/Field'
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui/State'

const DOC_TYPES = ['Contract', 'ID', 'Tax form', 'Certificate', 'Other']

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [empF, setEmpF] = useState('all')
  const [typeF, setTypeF] = useState('all')
  const [uploadEmp, setUploadEmp] = useState('')
  const [uploadType, setUploadType] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [docs, emps] = await Promise.all([getDocuments(), getEmployees()])
      setDocuments(docs)
      setEmployees(emps)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  const empMap = new Map(employees.map(e => [e.id, e]))

  const filtered = documents.filter(d => {
    if (empF !== 'all' && d.employee_id !== empF) return false
    if (typeF !== 'all' && d.document_type !== typeF) return false
    return true
  })

  const docTypes = [...new Set(documents.map(d => d.document_type))]

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Documents"
        subtitle="Upload, browse, and download HR documents for the team."
        actions={<Button variant="primary" icon="upload">Upload document</Button>}
      />

      <div className="grid grid--12-8" style={{ alignItems: 'start' }}>
        <Panel
          title={`${filtered.length} ${filtered.length === 1 ? 'document' : 'documents'}`}
          actions={
            <div className="row gap-2">
              <select
                className="select"
                style={{ width: 200, height: 32, fontSize: 'var(--fs-13)' }}
                value={empF}
                onChange={e => setEmpF(e.target.value)}
              >
                <option value="all">All employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
              <select
                className="select"
                style={{ width: 160, height: 32, fontSize: 'var(--fs-13)' }}
                value={typeF}
                onChange={e => setTypeF(e.target.value)}
              >
                <option value="all">All types</option>
                {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          }
        >
          {loading ? (
            <table className="table"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
          ) : error ? (
            <ErrorState desc={error} action={<Button onClick={load}>Retry</Button>} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="document"
              title="No documents yet"
              desc="Drag a file into the upload area, or use the button to add the first document."
              action={<Button variant="primary" icon="upload">Upload document</Button>}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Employee</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const emp = empMap.get(d.employee_id)
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="table__cell-primary">
                          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
                            <Icon name="paperclip" size={14} />
                          </div>
                          <div className="table__cell-stack">
                            <span className="table__cell-name mono" style={{ fontSize: 'var(--fs-13)' }}>{d.file_name}</span>
                            {d.uploaded_by && <span className="table__cell-sub">Uploaded by {d.uploaded_by}</span>}
                          </div>
                        </div>
                      </td>
                      <td><Badge tone="info" dot={false}>{d.document_type}</Badge></td>
                      <td>
                        {emp ? (
                          <button className="row gap-2" onClick={() => navigate(`/employees/${emp.id}`)} style={{ cursor: 'pointer' }}>
                            <Avatar name={emp.full_name} size="sm" />
                            <span>{emp.full_name}</span>
                          </button>
                        ) : <span className="text-ter">—</span>}
                      </td>
                      <td className="text-sec tabnum">{d.size ?? '—'}</td>
                      <td className="text-sec">{fmtDate(d.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="sm" icon="download" aria-label="Download" />
                          <Button variant="ghost" size="sm" icon="more" aria-label="More" />
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
          <Panel title="Upload new document" padded>
            <div className="uploader">
              <Icon name="upload" size={20} />
              <div className="uploader__title">Drag a file here, or click to browse</div>
              <div className="uploader__sub">PDF, JPG, PNG up to 10 MB</div>
            </div>
            <div className="col gap-3" style={{ marginTop: 'var(--sp-4)' }}>
              <Field label="Document type" required htmlFor="utype">
                <Select id="utype" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                  <option value="" disabled>Select type…</option>
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Employee" required htmlFor="uemp">
                <Select id="uemp" value={uploadEmp} onChange={e => setUploadEmp(e.target.value)}>
                  <option value="" disabled>Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </Select>
              </Field>
              <Button variant="primary" block icon="upload">Upload</Button>
              <div className="text-ter" style={{ fontSize: 'var(--fs-12)' }}>
                Files are stored in Supabase Storage. RLS policies enforce who can view each document.
              </div>
            </div>
          </Panel>

          <Panel title="Storage" padded>
            <div className="col gap-3">
              <div className="row row--between">
                <span className="text-ter">Used</span>
                <span className="tabnum">3.4 GB <span className="text-ter">/ 50 GB</span></span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '6.8%', height: '100%', background: 'var(--accent)' }} />
              </div>
              <div className="row row--between text-ter" style={{ fontSize: 'var(--fs-12)' }}>
                <span>{documents.length} documents</span>
                <span>23.5 MB this month</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
