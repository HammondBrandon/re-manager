import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTransaction } from '@/lib/actions/transactions'
import { getFiles } from '@/lib/actions/files'
import { getEmailLogs } from '@/lib/actions/emails'
import { StageManager } from '@/components/transactions/StageManager'
import { FileList } from '@/components/files/FileList'
import { EmailComposer } from '@/components/emails/EmailComposer'
import { EmailLog } from '@/components/emails/EmailLog'
import { formatDate } from '@/lib/utils/dates'
import { getStageLabel, getSubPhaseLabel } from '@/lib/utils/transactions'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, MapPin, FileText } from 'lucide-react'
import { DeleteTransactionButton } from '@/components/transactions/DeleteTransactionButton'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { id } = await params

  let transaction
  try {
    transaction = await getTransaction(id)
  } catch {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  const [files, emailLogs] = await Promise.all([
    getFiles(id),
    getEmailLogs(id),
  ])

  const isBuyer = transaction.type === 'buyer'

  // Contacts with email for the composer
  const emailableContacts = (transaction.transaction_contacts ?? [])
    .map((tc: { contact: { first_name: string; last_name: string; email: string | null } }) => tc.contact)
    .filter((c: { email: string | null }) => c.email)

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/transactions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Transactions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>

          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
            )}>
              {isBuyer ? 'Buyer' : 'Seller'}
            </span>
            <span className="text-sm text-gray-500">
              {getStageLabel(transaction.type, transaction.stage)}
              {transaction.under_contract_sub_phase && (
                <> · {getSubPhaseLabel(transaction.under_contract_sub_phase)}</>
              )}
            </span>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            {transaction.property_address}
          </h1>
        </div>
        <DeleteTransactionButton id={transaction.id} address={transaction.property_address} />
      </div>

      {/* Stage Manager */}
      <div className="bg-white rounded-lg border p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Stage</h2>
        <StageManager
          transactionId={transaction.id}
          type={transaction.type}
          currentStage={transaction.stage}
          currentSubPhase={transaction.under_contract_sub_phase}
        />
      </div>

      {/* Key Dates */}
      <div className="bg-white rounded-lg border p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Key Dates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Under Contract</p>
            <p className="text-sm font-medium">{formatDate(transaction.under_contract_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              Due Diligence End <span className="text-gray-300">({transaction.due_diligence_days}d)</span>
            </p>
            <p className="text-sm font-medium">{formatDate(transaction.due_diligence_end_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Closing Date</p>
            <p className="text-sm font-medium">{formatDate(transaction.closing_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Transaction Manager</p>
            <p className="text-sm font-medium">
              {transaction.transaction_manager?.full_name ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Type-specific details */}
      {isBuyer && transaction.buyer_details && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Buyer Preferences</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {transaction.buyer_details.desired_locations?.length > 0 && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-xs text-gray-400 mb-1">Desired Locations</p>
                <div className="flex flex-wrap gap-1">
                  {transaction.buyer_details.desired_locations.map((l: string) => (
                    <span key={l} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{l}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Bedrooms</p>
              <p className="font-medium">
                {transaction.buyer_details.min_bedrooms ?? '—'} – {transaction.buyer_details.max_bedrooms ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Min Baths</p>
              <p className="font-medium">{transaction.buyer_details.min_bathrooms ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Max Sqft</p>
              <p className="font-medium">
                {transaction.buyer_details.max_sqft
                  ? transaction.buyer_details.max_sqft.toLocaleString()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Max Price</p>
              <p className="font-medium">
                {transaction.buyer_details.max_price
                  ? `$${transaction.buyer_details.max_price.toLocaleString()}`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isBuyer && transaction.seller_details && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Listing Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Listing Price</p>
              <p className="font-medium">
                {transaction.seller_details.listing_price
                  ? `$${transaction.seller_details.listing_price.toLocaleString()}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">MLS Number</p>
              <p className="font-medium">{transaction.seller_details.mls_number ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Days on Market</p>
              <p className="font-medium">{transaction.seller_details.days_on_market ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Photos Uploaded</p>
              <p className="font-medium">{transaction.seller_details.listing_photos_uploaded ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Video Uploaded</p>
              <p className="font-medium">{transaction.seller_details.listing_video_uploaded ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {transaction.notes && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Notes
          </h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{transaction.notes}</p>
        </div>
      )}

      {/* Contacts */}
      {transaction.transaction_contacts?.length > 0 && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Associated Contacts</h2>
          <div className="space-y-2">
            {transaction.transaction_contacts.map((tc: {
              id: string
              role: string
              contact: { first_name: string; last_name: string; email: string | null; phone: string | null }
            }) => (
              <div key={tc.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">
                    {tc.contact.first_name} {tc.contact.last_name}
                  </span>
                  <span className="ml-2 text-gray-400 capitalize">{tc.role.replace('_', ' ')}</span>
                </div>
                <div className="text-gray-500 flex gap-4">
                  {tc.contact.email && <span>{tc.contact.email}</span>}
                  {tc.contact.phone && <span>{tc.contact.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Files</h2>
        <FileList files={files} transactionId={id} />
      </div>

      {/* Email */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Email Log</h2>
          <EmailComposer
            transactionId={id}
            agentName={profile?.full_name ?? 'Your Agent'}
            contacts={emailableContacts}
          />
        </div>
        <EmailLog emails={emailLogs} />
      </div>
    </div>
  )
}
