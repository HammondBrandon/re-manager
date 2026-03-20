'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { importContacts, ImportContactRow } from '@/lib/actions/import'

const COLUMNS = [
  'type', 'client_rating', 'source',
  'first_name', 'last_name',
  'email', 'phone', 'second_email', 'second_phone',
  'birthday', 'anniversary',
  'spouse_first_name', 'spouse_last_name', 'spouse_email', 'spouse_phone',
  'address', 'city', 'state', 'zip',
  'notes',
]

const SAMPLE_ROWS = [
  'client,A+,Facebook,Tracy,Wright,gagirlsmom3@gmail.com,770-301-1938,,,,,,,,,1981 Steadman Rd,Tallapoosa,GA,30176,',
  'client,A,SOI,Briana,Johnson,nicolebriana142@gmail.com,469-766-8249,,,,,,,,,185 Bartlett Cir,Bowdon,GA,30108,',
]

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current)
  return result
}

function parseCSV(text: string): ImportContactRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map((h) => h.trim())
  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
      return row as ImportContactRow
    })
    .filter((row) => row.first_name || row.last_name)
}

function downloadTemplate() {
  const csv = [COLUMNS.join(','), ...SAMPLE_ROWS].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contacts_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

type ImportResult = { succeeded: number; failed: number; errors: string[] }

export function ContactsImporter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportContactRow[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      setResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (rows.length === 0) return
    setLoading(true)
    try {
      const res = await importContacts(rows)
      setResult(res)
      if (res.succeeded > 0) toast.success(`Imported ${res.succeeded} contact${res.succeeded !== 1 ? 's' : ''}`)
      if (res.failed > 0) toast.error(`${res.failed} row${res.failed !== 1 ? 's' : ''} failed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">How to import your SOI contacts:</p>
        <ol className="list-decimal ml-4 space-y-1">
          <li>Download the template CSV below</li>
          <li>Fill in your contacts (one per row) — type must be: <code className="bg-blue-100 px-1 rounded">client</code>, <code className="bg-blue-100 px-1 rounded">lender</code>, <code className="bg-blue-100 px-1 rounded">realtor</code>, or <code className="bg-blue-100 px-1 rounded">contractor</code></li>
          <li>For couples, use first_name for primary contact and spouse_first_name for their partner</li>
          <li>Dates must be in <code className="bg-blue-100 px-1 rounded">YYYY-MM-DD</code> format</li>
          <li>Upload your filled CSV and click Import</li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {rows.length > 0 ? `${rows.length} rows loaded — change file` : 'Upload CSV'}
        </Button>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        {rows.length > 0 && !result && (
          <Button onClick={handleImport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {rows.length} Contacts
          </Button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <CheckCircle className="h-4 w-4" />
              {result.succeeded} imported
            </span>
            {result.failed > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <XCircle className="h-4 w-4" />
                {result.failed} failed
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <ul className="text-sm text-red-600 space-y-0.5">
              {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && !result && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{rows.length} rows parsed — preview (first 5):</p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Type', 'Rating', 'Email', 'Phone', 'City', 'Source'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{row.first_name} {row.last_name}</td>
                    <td className="px-3 py-2 text-gray-500">{row.type || 'client'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.client_rating || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.email || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.phone || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.city || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.source || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 5 && (
            <p className="text-xs text-gray-400">…and {rows.length - 5} more rows</p>
          )}
        </div>
      )}
    </div>
  )
}
