import { getTrendyolOrders } from '@/lib/actions'
import { Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import DeliveredTable from '@/components/DeliveredTable'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function DeliveredOrdersPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams
    const page = parseInt(resolvedParams.page || '0')
    const pageSize = 50

    // Fetch only delivered orders with pagination
    const result = await getTrendyolOrders('Delivered', page, pageSize)
    const orders = result.orders || []
    const error = result.error

    // Pagination Metadata
    const totalElements = result.totalElements || 0
    const totalPages = result.totalPages || 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">Teslim Edilenler</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Müşteriye ulaşan tamamlanmış paket geçmişi</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col items-center text-center space-y-3 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-rose-900">Bağlantı Hatası</h3>
                        <p className="text-sm text-rose-600 max-w-sm mx-auto">{error}</p>
                    </div>
                </div>
            )}

            {!error && orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-zinc-200">
                        <Package className="w-12 h-12 text-zinc-200" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Kayıt Bulunmuyor</h3>
                    <p className="text-zinc-500">Henüz teslim edilmiş bir paket bulunmamaktadır.</p>
                </div>
            )}

            {!error && orders.length > 0 && (
                <DeliveredTable
                    orders={orders}
                    totalElements={totalElements}
                    totalPages={totalPages}
                    currentPage={page}
                    pageSize={pageSize}
                />
            )}
        </div>
    )
}
