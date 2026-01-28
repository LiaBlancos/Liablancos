import { getPaymentStats, getShipmentPackages, getUnmatchedPayments } from '@/lib/actions'
import PaymentsContent from '@/components/PaymentsContent'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
    const stats = await getPaymentStats()
    const packages = await getShipmentPackages()
    const unmatched = await getUnmatchedPayments()

    return <PaymentsContent stats={stats} packages={packages} unmatched={unmatched} />
}
