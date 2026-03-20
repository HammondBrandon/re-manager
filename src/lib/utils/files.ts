export type FileCategory = 'contracts' | 'inspection' | 'photos' | 'legal' | 'other'

export const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'contracts', label: 'Contracts' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'photos', label: 'Photos' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
]

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
