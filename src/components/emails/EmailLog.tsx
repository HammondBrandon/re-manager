'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils/dates'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronRight, Mail } from 'lucide-react'

type EmailLogRow = {
  id: string
  to_email: string
  to_name: string | null
  subject: string
  body: string
  template_used: string | null
  sent_at: string
  sender: { full_name: string } | null
}

interface Props {
  emails: EmailLogRow[]
}

export function EmailLog({ emails }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (emails.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">No emails sent yet</p>
    )
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-6" />
            <TableHead>To</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Sent By</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <>
              <TableRow
                key={email.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
              >
                <TableCell className="text-gray-400">
                  {expandedId === email.id
                    ? <ChevronDown className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <div>
                      {email.to_name && (
                        <p className="text-sm font-medium">{email.to_name}</p>
                      )}
                      <p className="text-xs text-gray-500">{email.to_email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{email.subject}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {email.sender?.full_name ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(email.sent_at)}
                </TableCell>
              </TableRow>
              {expandedId === email.id && (
                <TableRow key={`${email.id}-body`}>
                  <TableCell />
                  <TableCell colSpan={4} className="bg-gray-50 pb-4 pt-2">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {email.body}
                    </pre>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
