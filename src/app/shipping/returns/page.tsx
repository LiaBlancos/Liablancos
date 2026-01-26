import { getExtendedTrendyolReturns } from '@/lib/actions'
import ReturnsContent from '@/components/ReturnsContent'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function ReturnsPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams
    const page = parseInt(resolvedParams.page || '0')
    const pageSize = 50

    // Fetch returned and undelivered orders (extended history)
    const result = await getExtendedTrendyolReturns(page, pageSize)

    return (
        <ReturnsContent
            orders={result.orders || []}
            totalElements={result.totalElements || 0}
            totalPages={result.totalPages || 0}
            currentPage={page}
            pageSize={pageSize}
            error={result.error}
        />
    )
}
