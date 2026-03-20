'use client'

import { useState, useTransition } from 'react'
import { Contact } from '@/types'
import { addTransactionContact, removeTransactionContact } from '@/lib/actions/transactions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserPlus, X, Search, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Role slot definitions ────────────────────────────────────────────────────

type ContactTypeName = 'client' | 'lender' | 'realtor' | 'contractor'

interface RoleSlot {
  role: string
  label: string
  allowedTypes: ContactTypeName[]
}

const SELLER_SLOTS: RoleSlot[] = [
  { role: 'seller',           label: 'Seller',           allowedTypes: ['client'] },
  { role: 'buyers_agent',     label: "Buyer's Agent",    allowedTypes: ['realtor'] },
  { role: 'closing_attorney', label: 'Closing Attorney', allowedTypes: ['realtor', 'contractor', 'lender', 'client'] },
]

const BUYER_SLOTS: RoleSlot[] = [
  { role: 'buyer',            label: 'Buyer',            allowedTypes: ['client'] },
  { role: 'lender',           label: 'Lender',           allowedTypes: ['lender'] },
  { role: 'closing_attorney', label: 'Closing Attorney', allowedTypes: ['realtor', 'contractor', 'lender', 'client'] },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransactionContact {
  id: string
  role: string
  contact: Contact
}

interface Props {
  transactionId: string
  transactionType: 'buyer' | 'seller'
  transactionContacts: TransactionContact[]
  allContacts: Contact[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TransactionContacts({
  transactionId,
  transactionType,
  transactionContacts,
  allContacts,
}: Props) {
  const slots = transactionType === 'seller' ? SELLER_SLOTS : BUYER_SLOTS

  const [pickerSlot, setPickerSlot] = useState<RoleSlot | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // Map role → current TransactionContact for quick lookup
  const byRole = Object.fromEntries(
    transactionContacts.map((tc) => [tc.role, tc])
  )

  // Contacts already linked (any role) — can't link the same contact twice
  const linkedContactIds = new Set(transactionContacts.map((tc) => tc.contact.id))

  function openPicker(slot: RoleSlot) {
    setSearch('')
    setPickerSlot(slot)
  }

  function handleSelect(contact: Contact) {
    if (!pickerSlot) return
    setPickerSlot(null)

    startTransition(async () => {
      try {
        await addTransactionContact(transactionId, contact.id, pickerSlot.role)
        toast.success(`${contact.first_name} ${contact.last_name} linked as ${pickerSlot.label}`)
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleRemove(tc: TransactionContact) {
    startTransition(async () => {
      try {
        await removeTransactionContact(tc.id, transactionId)
        toast.success('Contact removed')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  // Contacts visible in the picker: match allowed types + not already linked
  const pickerContacts = pickerSlot
    ? allContacts.filter(
        (c) =>
          pickerSlot.allowedTypes.includes(c.type as ContactTypeName) &&
          !linkedContactIds.has(c.id)
      )
    : []

  const filteredContacts = search.trim()
    ? pickerContacts.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q)
        )
      })
    : pickerContacts

  return (
    <>
      <div className="bg-white rounded-lg border p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Contacts</h2>

        <div className="space-y-3">
          {slots.map((slot) => {
            const tc = byRole[slot.role]
            const contact = tc?.contact

            return (
              <div
                key={slot.role}
                className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0"
              >
                {/* Role label */}
                <div className="w-36 shrink-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {slot.label}
                  </p>
                </div>

                {/* Contact info or empty state */}
                {contact ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.first_name} {contact.last_name}
                      {contact.company && (
                        <span className="ml-1.5 text-gray-400 font-normal">· {contact.company}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {contact.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="h-3 w-3" /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" /> {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-gray-400 italic">Not assigned</div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={isPending}
                    onClick={() => openPicker(slot)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {contact ? 'Change' : 'Select'}
                  </Button>
                  {contact && (
                    <button
                      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => handleRemove(tc)}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contact picker dialog */}
      <Dialog open={!!pickerSlot} onOpenChange={(open) => !open && setPickerSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Select {pickerSlot?.label}
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Contact list */}
          <div className="max-h-72 overflow-y-auto -mx-1 space-y-0.5">
            {filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                {pickerContacts.length === 0
                  ? `No ${pickerSlot?.allowedTypes.join(' / ')} contacts in your CRM yet`
                  : 'No contacts match your search'}
              </div>
            ) : (
              filteredContacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-50',
                    'transition-colors flex items-start justify-between gap-4'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {[c.company, c.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={cn(
                    'shrink-0 text-xs rounded-full px-2 py-0.5 capitalize mt-0.5',
                    c.type === 'client'     && 'bg-blue-50 text-blue-600',
                    c.type === 'lender'     && 'bg-green-50 text-green-600',
                    c.type === 'realtor'    && 'bg-purple-50 text-purple-600',
                    c.type === 'contractor' && 'bg-orange-50 text-orange-600',
                  )}>
                    {c.type}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
