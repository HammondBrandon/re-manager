'use client'

import { useState } from 'react'
import { Contact, ContactType } from '@/types'
import { ContactForm } from './ContactForm'
import { deleteContact } from '@/lib/actions/contacts'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'

const TYPE_LABELS: Record<ContactType, string> = {
  client: 'Client',
  lender: 'Lender',
  realtor: 'Realtor',
  contractor: 'Contractor',
}

const TYPE_COLORS: Record<ContactType, string> = {
  client: 'bg-blue-100 text-blue-700',
  lender: 'bg-green-100 text-green-700',
  realtor: 'bg-purple-100 text-purple-700',
  contractor: 'bg-orange-100 text-orange-700',
}

const RATING_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A': 'bg-green-100 text-green-700',
  'B': 'bg-yellow-100 text-yellow-700',
  'C': 'bg-gray-100 text-gray-600',
}

interface Props {
  contacts: Contact[]
}

export function ContactList({ contacts }: Props) {
  const [activeTab, setActiveTab] = useState<ContactType | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | undefined>()

  const filtered =
    activeTab === 'all' ? contacts : contacts.filter((c) => c.type === activeTab)

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    try {
      await deleteContact(id)
      toast.success('Contact deleted')
    } catch {
      toast.error('Failed to delete contact')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContactType | 'all')}>
          <TabsList>
            <TabsTrigger value="all">All ({contacts.length})</TabsTrigger>
            {(['client', 'lender', 'realtor', 'contractor'] as ContactType[]).map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TYPE_LABELS[tab]} ({contacts.filter((c) => c.type === tab).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => { setEditing(undefined); setFormOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Contact
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-400">
                  No contacts yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.first_name} {contact.last_name}
                    {contact.spouse_first_name && (
                      <span className="ml-1 text-xs text-gray-400">
                        & {contact.spouse_first_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[contact.type]}`}>
                      {TYPE_LABELS[contact.type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {contact.client_rating ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${RATING_COLORS[contact.client_rating] ?? ''}`}>
                        {contact.client_rating}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">{contact.email ?? '—'}</TableCell>
                  <TableCell className="text-gray-500">{contact.phone ?? '—'}</TableCell>
                  <TableCell className="text-gray-500">{contact.city ?? '—'}</TableCell>
                  <TableCell className="text-gray-500">{contact.source ?? '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(contact); setFormOpen(true) }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(contact.id)}
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

      <ContactForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(undefined) }}
        contact={editing}
      />
    </div>
  )
}
