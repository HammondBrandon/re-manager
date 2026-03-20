'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { uploadFile } from '@/lib/actions/files'
import { FILE_CATEGORIES, type FileCategory } from '@/lib/utils/files'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Upload, Paperclip } from 'lucide-react'

interface Props {
  transactionId: string
}

export function FileUpload({ transactionId }: Props) {
  const [open, setOpen] = useState(false)
  const [folder, setFolder] = useState<FileCategory>('other')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) { toast.error('Please select a file'); return }

    const formData = new FormData()
    formData.set('file', selectedFile)
    formData.set('folder', folder)

    startTransition(async () => {
      try {
        await uploadFile(transactionId, formData)
        toast.success('File uploaded')
        setOpen(false)
        setSelectedFile(null)
        setFolder('other')
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Upload className="mr-1.5 h-4 w-4" /> Upload File
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                defaultValue={folder}
                onValueChange={(v) => v && setFolder(v as FileCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>File</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                <Paperclip className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {selectedFile ? selectedFile.name : 'Click to select a file (max 50 MB)'}
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !selectedFile}>
                {isPending ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
