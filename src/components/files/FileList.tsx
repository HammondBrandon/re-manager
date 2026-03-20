'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteFile, getSignedUrl } from '@/lib/actions/files'
import { formatBytes, FILE_CATEGORIES } from '@/lib/utils/files'
import { formatDate } from '@/lib/utils/dates'
import { FileUpload } from './FileUpload'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, FileText, Image, FileArchive, Download } from 'lucide-react'

type FileRow = {
  id: string
  name: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  folder: string | null
  created_at: string
  uploader: { full_name: string } | null
}

interface Props {
  files: FileRow[]
  transactionId: string
  showTransaction?: false
}

function fileIcon(mime: string | null) {
  if (!mime) return <FileText className="h-4 w-4 text-gray-400" />
  if (mime.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />
  if (mime === 'application/pdf') return <FileText className="h-4 w-4 text-red-400" />
  if (mime.includes('zip') || mime.includes('archive')) return <FileArchive className="h-4 w-4 text-amber-400" />
  return <FileText className="h-4 w-4 text-gray-400" />
}

const ALL_FOLDERS = [
  { value: 'all', label: 'All' },
  ...FILE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
]

export function FileList({ files, transactionId }: Props) {
  const [folderFilter, setFolderFilter] = useState('all')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = folderFilter === 'all'
    ? files
    : files.filter((f) => f.folder === folderFilter)

  async function handleDownload(storagePath: string, name: string) {
    try {
      const url = await getSignedUrl(storagePath)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.target = '_blank'
      a.click()
    } catch {
      toast.error('Could not generate download link')
    }
  }

  async function handleDelete(fileId: string, storagePath: string) {
    if (!confirm('Delete this file?')) return
    startTransition(async () => {
      try {
        await deleteFile(fileId, storagePath, transactionId)
        toast.success('File deleted')
        router.refresh()
      } catch {
        toast.error('Failed to delete file')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tabs value={folderFilter} onValueChange={(v) => v && setFolderFilter(v)}>
          <TabsList>
            {ALL_FOLDERS.map((f) => {
              const count = f.value === 'all'
                ? files.length
                : files.filter((file) => file.folder === f.value).length
              return (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
        <FileUpload transactionId={transactionId} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-400">
                  No files uploaded yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {fileIcon(file.mime_type)}
                      <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 capitalize">
                    {file.folder ?? 'other'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatBytes(file.size_bytes)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {file.uploader?.full_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(file.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file.storage_path, file.name)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(file.id, file.storage_path)}
                          disabled={isPending}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
