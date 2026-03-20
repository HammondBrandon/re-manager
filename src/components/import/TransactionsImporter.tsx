'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { importTransactions, ImportTransactionRow } from '@/lib/actions/import'

const COLUMNS = [
  'type', 'property_address', 'stage',
  'purchase_price', 'closing_date', 'under_contract_date',
  'due_diligence_days', 'mls_number', 'notes',
]

const SAMPLE_ROWS = [
  'buyer,"123 Main St, Carrollton GA 30117",home_search,350000,2026-05-30,,,10,',
  'seller,"456 Oak Lane, Bremen GA 30110",under_contract,285000,2026-04-15,2026-01-28,10,10621773,',
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

function parseCSV(text: string): ImportTransactionRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map((h) => h.trim())
  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
      return row as ImportTransactionRow
    })
    .filter((row) => row.property_address)
}

function downloadTemplate() {
  const header = [
    '# type: buyer or seller',
    '# stage (buyer): pre_approval | buyers_agreement | home_search | under_contract | closed',
    '# stage (seller): listing_agreement_signed | listing_photos_video | live_on_market | under_contract | closed',
    '# dates: YYYY-MM-DD format',
    '# purchase_price: number only (no $ or commas)',
  ].join('\n')
  const csv = [COLUMNS.join(','), ...SAMPLE_ROWS].join('\n')
  const blob = new Blob([header + '\n' + csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

type ImportResult = { succeeded: number; failed: number; errors: string[] }

export function TransactionsImporter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportTransactionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string)
        .split('\n')
        .filter((l) => !l.startsWith('#'))
        .join('\n')
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
      const res = await importTransactions(rows)
      setResult(res)
      if (res.succeeded > 0) toast.success(`Imported ${res.succeeded} transaction${res.succeeded !== 1 ? 's' : ''}`)
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
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">How to import your active transactions:</p>
        <ol className="list-decimal ml-4 space-y-1">
          <li>Download the template CSV — it includes stage values as a reference comment</li>
          <li>Fill in one row per transaction (note: comments starting with <code className="bg-amber-100 px-1 rounded">#</code> are ignored)</li>
          <li>Addresses with commas must be wrapped in quotes: <code className="bg-amber-100 px-1 rounded">"123 Main St, City GA"</code></li>
          <li>After import, open each transaction to link contacts and assign a transaction manager</li>
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
            Import {rows.length} Transactions
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
          <p className="text-sm text-gray-500">{rows.length} rows parsed — preview:</p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Address', 'Type', 'Stage', 'Price', 'Closing Date'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium max-w-xs truncate">{row.property_address}</td>
                    <td className="px-3 py-2 text-gray-500 capitalize">{row.type}</td>
                    <td className="px-3 py-2 text-gray-500">{row.stage || '(default)'}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {row.purchase_price ? `$${Number(row.purchase_price).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{row.closing_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
