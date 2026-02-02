import { getFinanceOrders, getFinanceStats, getFinanceUploadLogs } from '@/lib/actions'
import FinancePaymentsContent from '@/components/FinancePaymentsContent'

export const dynamic = 'force-dynamic'

export default async function OdemelerPage() {
    console.log('[Finance Page] Fetching data...')
    const [orders, stats, uploadLogs] = await Promise.all([
        getFinanceOrders(),
        getFinanceStats(),
        getFinanceUploadLogs()
    ])
    console.log('[Finance Page] Data fetched:', {
        ordersCount: orders?.length,
        stats,
        logsCount: uploadLogs?.length
    })

    return (
        <FinancePaymentsContent
            initialOrders={orders || []}
            stats={stats || {
                paidCount: 0,
                unpaidCount: 0,
                overdueCount: 0,
                paidAmount: 0,
                unpaidAmount: 0
            }}
            uploadLogs={uploadLogs || []}
        />
    )
}
