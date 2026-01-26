import ProfitCalculator from '@/components/ProfitCalculator'
import { Calculator, Percent } from 'lucide-react'

export default function ProfitCalculatorPage() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                        <Percent className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">Ürün Fiyatlandırma</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Kâr odaklı akıllı fiyat hesaplama aracı</p>
                    </div>
                </div>
            </div>

            {/* Calculator Component */}
            <ProfitCalculator />
        </div>
    )
}
