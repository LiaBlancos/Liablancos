'use client'

import { useState, useEffect } from 'react'
import { getCommissionTariffsData } from '@/lib/commission-actions'
import {
    Search,
    X,
    Filter,
    TrendingUp,
    Upload,
    FileText,
    CheckCircle2,
    AlertTriangle,
    RefreshCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ProductAnalysisTable from '@/components/ProductAnalysisTable'
import * as XLSX from 'xlsx'

export default function CommissionTariffsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [uploadStatus, setUploadStatus] = useState({
        commission: { name: '', loaded: false },
        advantage: { name: '', loaded: false },
        plus: { name: '', loaded: false }
    })
    const [excelData, setExcelData] = useState<any>({
        commission: [],
        advantage: [],
        plus: []
    })
    const [dates, setDates] = useState({
        start: '2026-02-03T08:00',
        end: '2026-02-10T07:59'
    })

    // --- PERSISTENCE: LOAD FROM LOCALSTORAGE ---
    useEffect(() => {
        const savedExcel = localStorage.getItem('campaign_excelData')
        const savedStatus = localStorage.getItem('campaign_uploadStatus')
        const savedDates = localStorage.getItem('campaign_dates')

        if (savedExcel) {
            try { setExcelData(JSON.parse(savedExcel)) } catch (e) { console.error('Data load error', e) }
        }
        if (savedStatus) {
            try { setUploadStatus(JSON.parse(savedStatus)) } catch (e) { console.error('Status load error', e) }
        }
        if (savedDates) {
            try { setDates(JSON.parse(savedDates)) } catch (e) { console.error('Dates load error', e) }
        }

        // After reading from localStorage, we can safely allow saving
        setIsInitialLoad(false)
    }, [])

    // --- PERSISTENCE: SAVE TO LOCALSTORAGE ---
    useEffect(() => {
        if (isInitialLoad) return
        if (excelData.commission.length || excelData.advantage.length || excelData.plus.length) {
            try { localStorage.setItem('campaign_excelData', JSON.stringify(excelData)) } catch (e) { console.warn('LocalStorage Quota Exceeded for data', e) }
        }
    }, [excelData, isInitialLoad])

    useEffect(() => {
        if (isInitialLoad) return
        localStorage.setItem('campaign_uploadStatus', JSON.stringify(uploadStatus))
    }, [uploadStatus, isInitialLoad])

    useEffect(() => {
        if (isInitialLoad) return
        localStorage.setItem('campaign_dates', JSON.stringify(dates))
    }, [dates, isInitialLoad])

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const result = await getCommissionTariffsData()
            if (result.success) {
                setProducts(result.products || [])
            }
            setLoading(false)
        }
        loadData()
    }, [])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'commission' | 'advantage' | 'plus') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const arrayBuffer = evt.target?.result as ArrayBuffer
                const u8 = new Uint8Array(arrayBuffer)
                let wb: XLSX.WorkBook | null = null;

                // --- STRATEGY 1: Pure Array (Standard XLSX) ---
                try {
                    wb = XLSX.read(u8, { type: 'array', cellDates: true, codepage: 1254 })
                } catch (e1) {
                    // Strategy 1 failed - proceed silently
                }

                // --- STRATEGY 2: Buffer/Binary String (Handle specific ZIP issues) ---
                if (!wb) {
                    try {
                        let binary = ""
                        const chunk = 8192
                        for (let i = 0; i < u8.length; i += chunk) {
                            binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)))
                        }
                        wb = XLSX.read(binary, { type: 'binary', codepage: 1254 })
                    } catch (e2) {
                        // Strategy 2 failed - proceed silently
                    }
                }

                // --- STRATEGY 3: HTML/XML fallback (Trendyol Pseudo-Excel) ---
                if (!wb) {
                    try {
                        // Sometimes files are just HTML or CSV with .xls/xlsx extension
                        const text = new TextDecoder("utf-8").decode(u8)
                        wb = XLSX.read(text, { type: 'string', codepage: 1254 })
                    } catch (e3) {
                        // Strategy 3 failed - proceed silently
                    }
                }

                // --- STRATEGY 4: Final attempt as Latin-1 (for old XLS exports) ---
                if (!wb) {
                    try {
                        const text = new TextDecoder("windows-1254").decode(u8)
                        wb = XLSX.read(text, { type: 'string', codepage: 1254 })
                    } catch (e4) {
                        // Strategy 4 failed - proceed silently
                    }
                }

                if (!wb || !wb.SheetNames.length) {
                    throw new Error('Dosya formatı anlaşılamadı veya dosya bozuk.')
                }

                const wsName = wb.SheetNames[0]
                const ws = wb.Sheets[wsName]
                // defval: "" is important to keep placeholders for empty cells
                const json = XLSX.utils.sheet_to_json(ws, { defval: "" })

                if (!Array.isArray(json) || json.length === 0) {
                    throw new Error('Dosya boş görünüyor veya veriler okunamadı (Sheet boş).')
                }

                setExcelData((prev: any) => ({ ...prev, [type]: json }))
                setUploadStatus((prev: any) => ({
                    ...prev,
                    [type]: { name: file.name, loaded: true }
                }))
            } catch (err: any) {
                console.error('Final Excel parsing error:', err)
                const isZipError = err.message?.includes('uncompressed size') || err.message?.includes('zip') || err.message?.includes('size')

                alert(
                    `❗ KRİTİK DOSYA OKUMA HATASI ("${file.name}")\n\n` +
                    `Teşhis: ${isZipError ? 'Trendyol ZIP Bozukluğu (Bad uncompressed size)' : (err.message || 'Bilinmeyen Hata')}\n\n` +
                    `Nedeni: Trendyol panellerinden indirilen bazı dosyalar, ZIP sıkıştırması hatalı veya standart dışı Excel (yalancı excel) formatında üretilmektedir. Sistemimiz 4 farklı okuma yöntemi denemesine rağmen başarılı olamadı.\n\n` +
                    `KESİN ÇÖZÜM (Sadece 10 saniye sürer):\n` +
                    `1. Yüklemeye çalıştığınız bu dosyayı bilgisayarınızdaki Excel programıyla açın.\n` +
                    `2. Sol üstteki "Dosya" menüsünden "Farklı Kaydet" tıklayın.\n` +
                    `3. Kayıt türünü mutlaka "Excel Çalışma Kitabı (.xlsx)" seçerek kaydedin.\n` +
                    `4. Yeni oluşturduğunuz (kaydettiğiniz) bu dosyayı buraya yükleyin.`
                )
            }
        }
        reader.onerror = () => alert('Dosya okunurken bir hata oluştu.')
        reader.readAsArrayBuffer(file)
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm)

        // If Excel files are loaded, we might want to filter or merge data here
        // For now, let's just use the basic search
        return matchesSearch
    })

    return (
        <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 space-y-8 animate-fade pb-20">
            {/* Wholesaler-Style Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-1 uppercase">Kampanya ve Kârlılık Analizi</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-zinc-500 text-sm font-medium">{products.length} ürün analiz ediliyor</p>
                            <span className="text-zinc-200">|</span>
                            <button
                                onClick={() => {
                                    if (confirm('Tüm yüklü Excel verileri ve kampanya ayarları silinecek. Emin misiniz?')) {
                                        // Selective Reset: Only remove campaign related keys
                                        Object.keys(localStorage)
                                            .filter(key => key.startsWith('campaign_'))
                                            .forEach(key => localStorage.removeItem(key))
                                        window.location.reload()
                                    }
                                }}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors"
                            >
                                Verileri Sıfırla
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 xl:flex-none justify-end">
                    <div className="relative w-full md:w-80 lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Ürün ismi veya barkod ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Excel Management Center */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { id: 'commission', label: 'Komisyon Tarifesi', color: 'indigo' },
                    { id: 'advantage', label: 'Avantajlı Etiketler', color: 'orange' },
                    { id: 'plus', label: 'Plus Komisyonu', color: 'rose' }
                ].map((area) => (
                    <div key={area.id} className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-xl shadow-zinc-200/20 relative group overflow-hidden">
                        <div className={cn(
                            "absolute top-0 left-0 w-2 h-full transition-all duration-500",
                            uploadStatus[area.id as keyof typeof uploadStatus].loaded ? `bg-${area.color}-500` : "bg-zinc-100 group-hover:bg-zinc-200"
                        )} />

                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                uploadStatus[area.id as keyof typeof uploadStatus].loaded ? `bg-${area.color}-50 bg-${area.color}-50 group-hover:scale-110` : "bg-zinc-50 group-hover:bg-zinc-100"
                            )}>
                                <FileText className={cn(
                                    "w-6 h-6 transition-colors",
                                    uploadStatus[area.id as keyof typeof uploadStatus].loaded ? `text-${area.color}-600` : "text-zinc-300"
                                )} />
                            </div>
                            {uploadStatus[area.id as keyof typeof uploadStatus].loaded ? (
                                <CheckCircle2 className={`w-5 h-5 text-${area.color}-500`} />
                            ) : (
                                <Upload className="w-5 h-5 text-zinc-200" />
                            )}
                        </div>

                        <h3 className="font-extrabold text-zinc-900 text-sm mb-1 uppercase tracking-tight">{area.label}</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase truncate">
                            {uploadStatus[area.id as keyof typeof uploadStatus].name || 'Dosya seçilmedi'}
                        </p>

                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            id={`upload-${area.id}`}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, area.id as any)}
                        />

                        {area.id === 'commission' && (
                            <div className="flex flex-col gap-2 mb-4 mt-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Kampanya Başlangıç</span>
                                    <input
                                        type="datetime-local"
                                        value={dates.start}
                                        onChange={(e) => setDates(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full bg-white border border-zinc-100 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    />
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Kampanya Bitiş</span>
                                    <input
                                        type="datetime-local"
                                        value={dates.end}
                                        onChange={(e) => setDates(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full bg-white border border-zinc-100 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    />
                                </div>
                            </div>
                        )}

                        <label
                            htmlFor={`upload-${area.id}`}
                            className={cn(
                                "mt-4 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer transition-all border block",
                                uploadStatus[area.id as keyof typeof uploadStatus].loaded
                                    ? `bg-${area.color}-50 text-${area.color}-600 border-${area.color}-100 hover:bg-${area.color}-100`
                                    : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
                            )}
                        >
                            {uploadStatus[area.id as keyof typeof uploadStatus].loaded ? 'Dosyayı Değiştir' : 'Excel Yükle'}
                        </label>
                    </div>
                ))}
            </div>

            {/* Campaign Validity Display Section */}
            {(uploadStatus.commission.loaded || uploadStatus.advantage.loaded || uploadStatus.plus.loaded) && (
                <div className="flex flex-col items-center justify-center py-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex flex-col items-center gap-1.5">
                        <h2 className="text-2xl md:text-3xl font-black text-orange-500 tracking-tighter uppercase">
                            {new Date(dates.start).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} - {new Date(dates.end).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <p className="text-sm font-black text-indigo-900 uppercase tracking-[0.3em] mb-1">
                            {filteredProducts.length} ÜRÜN ANALİZ EDİLİYOR
                        </p>
                        <div className="w-64 h-1.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/20" />
                    </div>
                </div>
            )}

            {/* Content Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-zinc-400 animate-pulse uppercase tracking-widest">Veriler Analiz Ediliyor...</p>
                </div>
            ) : (
                <ProductAnalysisTable products={filteredProducts} excelData={excelData} />
            )}
        </div>
    )
}
