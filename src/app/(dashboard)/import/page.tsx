import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ContactsImporter } from '@/components/import/ContactsImporter'
import { TransactionsImporter } from '@/components/import/TransactionsImporter'

export const dynamic = 'force-dynamic'

export default function ImportPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Import Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          Migrate your existing contacts and transactions from Google Sheets
        </p>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contacts">SOI Contacts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-base font-semibold mb-1">Import Contacts</h2>
            <p className="text-sm text-gray-500 mb-6">
              Import your Sphere of Influence list. All fields from the SOI sheet are supported.
            </p>
            <ContactsImporter />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-base font-semibold mb-1">Import Transactions</h2>
            <p className="text-sm text-gray-500 mb-6">
              Import your active transactions. After import, open each transaction to link contacts and assign a manager.
            </p>
            <TransactionsImporter />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
