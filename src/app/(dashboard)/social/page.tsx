import { getSocialPosts } from '@/lib/actions/social'
import { getTransactions } from '@/lib/actions/transactions'
import { SocialCalendar } from '@/components/social/SocialCalendar'
import { POST_STATUSES } from '@/lib/utils/social'

export const dynamic = 'force-dynamic'

export default async function SocialPage() {
  const [posts, transactions] = await Promise.all([
    getSocialPosts(),
    getTransactions(),
  ])

  const transactionList = transactions.map((t) => ({
    id: t.id,
    property_address: t.property_address,
  }))

  // Count by status for the summary bar
  const counts = POST_STATUSES.reduce((acc, s) => {
    acc[s.value] = posts.filter((p) => p.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Social Media</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and track social media posts
          </p>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {POST_STATUSES.map((s) => (
          <div key={s.value} className="rounded-lg border bg-white px-4 py-3 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{counts[s.value] ?? 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar — click a date to create, click an event to edit */}
      <SocialCalendar posts={posts} transactions={transactionList} />
    </div>
  )
}
