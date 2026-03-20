import { getAllFiles } from '@/lib/actions/files'
import { formatBytes, FILE_CATEGORIES } from '@/lib/utils/files'
import { formatDate } from '@/lib/utils/dates'
import Link from 'next/link'
import { FileText, Image, FileArchive, FolderOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fileIcon(mime: string | null) {
  if (!mime) return <FileText className="h-4 w-4 text-gray-400" />
  if (mime.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />
  if (mime === 'application/pdf') return <FileText className="h-4 w-4 text-red-400" />
  if (mime.includes('zip') || mime.includes('archive')) return <FileArchive className="h-4 w-4 text-amber-400" />
  return <FileText className="h-4 w-4 text-gray-400" />
}

export default async function FilesPage() {
  const files = await getAllFiles()

  // Group by transaction
  const byTransaction = files.reduce<Record<string, typeof files>>((acc, f) => {
    const key = f.transaction?.id ?? '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  const totalSize = files.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Files</h1>
          <p className="mt-1 text-sm text-gray-500">
            {files.length} file{files.length !== 1 ? 's' : ''} · {formatBytes(totalSize)} total
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="rounded-lg border bg-white py-16 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No files uploaded yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload files from a transaction page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byTransaction).map(([txId, txFiles]) => {
            const tx = txFiles[0].transaction
            const label = tx?.property_address ?? 'Unlinked Files'
            const href = tx ? `/transactions/${txId}` : null

            return (
              <div key={txId} className="rounded-lg border bg-white">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    {href ? (
                      <Link href={href} className="text-sm font-semibold hover:underline text-blue-600">
                        {label}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">{label}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{txFiles.length} file{txFiles.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Group by folder within transaction */}
                {FILE_CATEGORIES.map((cat) => {
                  const catFiles = txFiles.filter((f) => f.folder === cat.value)
                  if (catFiles.length === 0) return null
                  return (
                    <div key={cat.value}>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {cat.label}
                        </span>
                      </div>
                      <div className="divide-y">
                        {catFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {fileIcon(file.mime_type)}
                              <span className="text-sm truncate max-w-xs">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-gray-400 shrink-0 ml-4">
                              <span>{formatBytes(file.size_bytes)}</span>
                              <span>{file.uploader?.full_name ?? '—'}</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Files with folder = 'other' or null */}
                {(() => {
                  const otherFiles = txFiles.filter(
                    (f) => !f.folder || f.folder === 'other'
                  )
                  if (otherFiles.length === 0) return null
                  return (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Other</span>
                      </div>
                      <div className="divide-y">
                        {otherFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {fileIcon(file.mime_type)}
                              <span className="text-sm truncate max-w-xs">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-gray-400 shrink-0 ml-4">
                              <span>{formatBytes(file.size_bytes)}</span>
                              <span>{file.uploader?.full_name ?? '—'}</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
