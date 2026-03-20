import { getContacts } from '@/lib/actions/contacts'
import { ContactList } from '@/components/crm/ContactList'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const contacts = await getContacts()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">CRM</h1>
        <p className="mt-1 text-sm text-gray-500">Manage clients, lenders, realtors, and contractors</p>
      </div>
      <ContactList contacts={contacts} />
    </div>
  )
}
