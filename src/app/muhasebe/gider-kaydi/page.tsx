'use client'

import React, { useState } from 'react'
import { PlusSquare, Filter, Search, ChevronDown, Receipt, FileText, X, CheckCircle2, Trash2, Pencil } from 'lucide-react'
import HizliFisModal from '@/components/HizliFisModal'
import DetayliFisModal from '@/components/DetayliFisModal'
import CategoryTag from '@/components/CategoryTag'
import { GIDER_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import { formatCurrency, normalizeTurkish } from '@/lib/utils'
import DigerGiderModal from '@/components/DigerGiderModal'

import { getExpenses, saveExpense, deleteExpense as apiDeleteExpense, bulkSaveExpenses, getExpenseRules } from '@/lib/actions'
import { toast } from 'sonner'

import * as XLSX from 'xlsx'

interface GiderKaydi {
  id: string
  kayitIsmi: string
  tedarikci: string
  tarih: string
  toplamTutar: string | number
  doviz: string
  toplamKdv: string | number
  kdvOrani: number
  odemeDurumu: string
  giderKategorisi: string
  etiket: string
  fisNo?: string
  dosya?: string | null
  lineItems?: any[]
  stokTakipli?: boolean
  islemNo?: string
  aciklama?: string
  createdAt: string
}

export default function GiderKaydiPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isHizliOpen, setIsHizliOpen] = useState(false)
  const [isDetayliOpen, setIsDetayliOpen] = useState(false)
  const [isDigerOpen, setIsDigerOpen] = useState(false)
  const [records, setRecords] = useState<GiderKaydi[]>([])
  const [editingRecord, setEditingRecord] = useState<GiderKaydi | null>(null)
  const [loading, setLoading] = useState(true)

  // Load from Supabase on mount
  React.useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const data = await getExpenses()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Kayıtlar yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Dashboard Stats
  const stats = React.useMemo(() => {
    const total = records.reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0)
    const paid = records.filter(r => r.odemeDurumu === 'odendi' || r.odemeDurumu === 'Ödendi').reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0)
    const pending = records.filter(r => r.odemeDurumu === 'odenecek' || r.odemeDurumu === 'Ödenecek').reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0)
    const staff = records.filter(r => r.odemeDurumu === 'calisan' || r.odemeDurumu === 'Çalışan Cebinden Ödedi').reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0)
    return { total, paid, pending, staff }
  }, [records])

  const handleSiparisExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('Excel işleniyor...')
    try {
      const data = await file.arrayBuffer()
      // Fix for "Bad uncompressed size" error: wrap buffer in Uint8Array
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (rows.length === 0) {
        toast.error('Excel dosyası boş görünüyor.', { id: toastId })
        return
      }

      const normTR = (s: string) => s.toLowerCase()
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
        .replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/Ç/g, 'c')
        .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ö/g, 'o')
        .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')

      const findCol = (row: any, keywords: string[]) => {
        return Object.keys(row).find(k =>
          keywords.some(kw => normTR(k).includes(normTR(kw)))
        )
      }

      const sample = rows[0]
      const allCols = Object.keys(sample as object)

      // Column mapping
      const colPaketNo = findCol(sample, ['Paket No', 'PaketNo', 'paketno', 'Paket'])
      const colSiparisTarihi = findCol(sample, ['Sipariş Tarihi', 'SiparisTarihi', 'Siparis Tarihi', 'Tarih'])
      const colAlici = findCol(sample, ['Alıcı', 'Alici', 'Müşteri', 'Musteri', 'Tedarikçi', 'Tedarikci'])
      const colUrunAdi = findCol(sample, ['Ürün Adı', 'UrunAdi', 'Urun Adi', 'Ürün', 'Açıklama', 'Aciklama'])
      const colAdet = findCol(sample, ['Adet', 'Miktar', 'Qty'])
      const colFaturalanacakTutar = findCol(sample, ['Faturalanacak Tutar', 'FaturalanacakTutar', 'Ödenecek Tutar', 'OdenecekTutar', 'Toplam Tutar', 'Tutar'])
      const colIndirim = findCol(sample, ['İndirim Tutarı', 'IndirimTutari', 'İndirim', 'Indirim'])

      // Group by unique ID (package or order no)
      const grouped: Record<string, any[]> = {}
      for (const row of rows) {
        const key = String(row[colPaketNo!] || row[Object.keys(row)[0]] || 'unknown')
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(row)
      }

      const expenses: any[] = []
      for (const [islemNo, items] of Object.entries(grouped)) {
        if (islemNo === 'unknown') continue

        let toplamIndirim = 0
        const firstRow = items[0]

        const lineItems = items.map((item, idx) => {
          const adet = colAdet ? (Number(item[colAdet]) || 1) : 1
          const indirim = colIndirim ? (Number(item[colIndirim]) || 0) : 0
          const faturalanacakTutar = colFaturalanacakTutar ? (Number(item[colFaturalanacakTutar]) || 0) : 0
          
          // Logic: Matrah = Total / 1.10, Price = (Matrah + Indirim) / Qty
          const netTutar = faturalanacakTutar / 1.10
          const kdvHaricBirimFiyat = (netTutar + indirim) / adet
          
          toplamIndirim += indirim

          return {
            id: `${islemNo}_${idx}`,
            name: colUrunAdi ? String(item[colUrunAdi] || 'Gider Kalemi') : 'Gider Kalemi',
            quantity: adet,
            unit: 'Adet',
            price: kdvHaricBirimFiyat,
            taxRate: 10,
            discount: indirim
          }
        })

        const araToplam = lineItems.reduce((sum, li) => sum + (li.quantity * li.price), 0)
        const brutToplam = araToplam - toplamIndirim
        const kdvToplam = brutToplam * 0.10
        const genelToplam = brutToplam + kdvToplam

        expenses.push({
          kayitIsmi: 'Trendyol Gider Aktarımı',
          tedarikci: colAlici ? String(firstRow[colAlici] || 'Trendyol') : 'Trendyol',
          tarih: new Date().toISOString().split('T')[0],
          toplamTutar: genelToplam.toFixed(2),
          doviz: 'TRY',
          toplamKdv: kdvToplam.toFixed(2),
          kdvOrani: 10,
          odemeDurumu: 'odenecek',
          giderKategorisi: 'Kategorisiz',
          etiket: 'Etiketsiz',
          fisNo: islemNo,
          lineItems,
          stokTakipli: false,
          islemNo: islemNo,
          indirimTutari: toplamIndirim,
          aciklama: `Trendyol Excel Aktarımı\nİşlem No: ${islemNo}\nMatrah: ${brutToplam.toFixed(2)}₺\nKDV: ${kdvToplam.toFixed(2)}₺`
        })
      }

      if (expenses.length > 0) {
        toast.loading(`${expenses.length} gider kaydediliyor...`, { id: toastId })
        await bulkSaveExpenses(expenses)
        toast.success(`${expenses.length} gider kaydı başarıyla oluşturuldu!`, { id: toastId })
        fetchExpenses()
      } else {
        toast.error('Aktarılacak geçerli veri bulunamadı.', { id: toastId })
      }
    } catch (err: any) {
      console.error('Excel Hata:', err)
      toast.error('Excel işlenirken hata: ' + err.message, { id: toastId })
    }
  }

  const handleSave = async (data: any) => {
    try {
      const result = await saveExpense({
        ...data,
        id: editingRecord?.id
      })
      if (result.success) {
        toast.success(editingRecord ? 'Kayıt güncellendi' : 'Yeni kayıt eklendi')
        fetchExpenses()
        setIsHizliOpen(false)
        setIsDetayliOpen(false)
        setIsDigerOpen(false)
        setEditingRecord(null)
        return { success: true }
      }
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
      throw error // Hatayı fırlat ki Modal bunu anlasın
    }
  }

  const handleBulkSave = async (dataList: any[]) => {
    try {
      const result = await bulkSaveExpenses(dataList)
      if (result.success) {
        toast.success(`${dataList.length} kayıt işlendi`)
        fetchExpenses()
        setIsDigerOpen(false)
        return { success: true }
      }
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
      throw error
    }
  }

  const handleApplyRules = async () => {
    setLoading(true)
    try {
      const rules = await getExpenseRules()
      if (!rules || rules.length === 0) {
        toast.info('Henüz tanımlanmış bir kural yok.')
        setLoading(false)
        return
      }

      let updatedCount = 0
      const updatedRecords = []

      for (const record of records) {
        const rawStr = `${record.kayitIsmi || ''} ${record.tedarikci || ''} ${record.aciklama || ''}`
        const searchStr = normalizeTurkish(rawStr)
        
        for (const rule of rules) {
          const normalizedKeyword = normalizeTurkish(rule.keyword)
          const isMatch = searchStr.includes(normalizedKeyword)
          
          if (isMatch) {
            const hasCategoryChange = record.giderKategorisi !== rule.category
            const hasKdvChange = rule.kdv_orani && record.kdvOrani !== rule.kdv_orani

            if (hasCategoryChange || hasKdvChange) {
              const updatedData: any = { ...record }
              if (hasCategoryChange) updatedData.giderKategorisi = rule.category
              
              if (hasKdvChange) {
                const tutar = typeof record.toplamTutar === 'string' 
                  ? parseFloat(record.toplamTutar.replace(/\./g, '').replace(',', '.')) 
                  : Number(record.toplamTutar) || 0
                
                updatedData.kdvOrani = rule.kdv_orani
                updatedData.toplamKdv = (tutar * rule.kdv_orani / (100 + rule.kdv_orani)).toFixed(2)
              }
              
              updatedRecords.push(updatedData)
              updatedCount++
            }
            break
          }
        }
      }

      if (updatedCount > 0) {
        for (const rec of updatedRecords) {
          await saveExpense(rec)
        }
        toast.success(`${updatedCount} adet kayıt kurallara göre güncellendi.`)
        fetchExpenses()
      } else {
        toast.info('Kurallarla eşleşen yeni bir kategori değişikliği bulunamadı.')
      }
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: GiderKaydi) => {
    setEditingRecord(record)
    if (record.lineItems && record.lineItems.length > 0) {
      setIsDetayliOpen(true)
    } else if (!record.fisNo && !record.dosya) {
      setIsDigerOpen(true)
    } else {
      setIsHizliOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      try {
        const result = await apiDeleteExpense(id)
        if (result.success) {
          toast.success('Kayıt silindi')
          fetchExpenses()
        }
      } catch (error: any) {
        toast.error('Silme hatası: ' + error.message)
      }
    }
  }

  const filteredRecords = records.filter(r =>
    r.kayitIsmi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tedarikci.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.fisNo && r.fisNo.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getOdemeBadge = (durum: string) => {
    const d = durum.toLowerCase()
    if (d === 'odendi') return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Ödendi</span>
    if (d === 'odenecek') return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Ödenecek</span>
    if (d === 'calisan') return <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Çalışan Ödedi</span>
    return null
  }

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'USD': return '$'
      case 'EUR': return '€'
      default: return '₺'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <PlusSquare className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gider Kaydı</h1>
          <p className="text-slate-500 text-sm">Giderlerinizi hızlıca sisteme işleyin.</p>
        </div>
      </div>

      {/* DASHBOARD SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'TOPLAM GİDER', val: stats.total, color: 'indigo' },
          { label: 'ÖDENENLER', val: stats.paid, color: 'emerald' },
          { label: 'BEKLEYEN ÖDEMELER', val: stats.pending, color: 'amber' },
          { label: 'PERSONEL HARC.', val: stats.staff, color: 'blue' }
        ].map(card => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.color}-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{card.label}</p>
            <p className={`text-2xl font-black text-${card.color}-600 tracking-tight`}>{formatCurrency(card.val)} ₺</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex w-full xl:w-auto flex-1 items-center gap-0">
          <button className="flex items-center gap-2 px-5 py-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-l-xl border border-r-0 border-slate-200 font-bold text-[13px] tracking-wide transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4 opacity-70" />
            FİLTRELE
          </button>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Fatura No, Tedarikçi veya İsim ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-[10px] bg-slate-50 border border-slate-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors cursor-pointer shadow-lg shadow-emerald-600/20">
            <Receipt className="w-4 h-4" />
            TRENDYOL EXCELİ YÜKLE
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleSiparisExcel} />
          </label>
          <button
            onClick={() => setIsHizliOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#6A5E5B] hover:bg-[#5A4E4B] text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors"
          >
            HIZLI FİŞ/FATURA
          </button>
          <button
            onClick={() => setIsDetayliOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#6A5E5B] hover:bg-[#5A4E4B] text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors"
          >
            DETAYLI FİŞ/FATURA
          </button>
          <button
            onClick={handleApplyRules}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors shadow-lg shadow-indigo-600/20"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            KURALLARI UYGULA
          </button>
        </div>
      </div>

      {/* Records List or Empty State */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Kayıtlar yükleniyor...</p>
        </div>
      ) : filteredRecords.length === 0 && searchQuery === '' && records.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Receipt className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Giderleri Eklemek Çok Kolay</h2>
            <p className="text-slate-500 max-w-sm">
              Yukarıdaki butonları kullanarak yeni fiş ve faturalarınızı girebilirsiniz. Eklediğiniz kayıtlar burada listelenecektir.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200/60 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-3">Kayıt / Tedarikçi</div>
            <div className="col-span-2">Tarih / No</div>
            <div className="col-span-3 text-center">KDV</div>
            <div className="col-span-3 text-right">Tutar</div>
          </div>

          {/* Records */}
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record, index) => {
              const tutar = Number(record.toplamTutar) || 0
              const kdvOrani = record.kdvOrani || 0
              const kdvTutar = Number(record.toplamKdv) || (kdvOrani > 0 ? tutar * kdvOrani / (100 + kdvOrani) : 0)

              return (
              <div key={record.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group items-center animate-fade-in">
                <div className="col-span-1 flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Receipt className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight">{record.kayitIsmi || 'İsimsiz Kayıt'}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{record.tedarikci}</span>
                    {record.giderKategorisi && record.giderKategorisi !== 'Kategorisiz' && (
                      <CategoryTag text={record.giderKategorisi} color={GIDER_KATEGORILERI.find(c => c.text === record.giderKategorisi)?.color || 'gray'} />
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-slate-600 font-medium">
                    {new Date(record.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-widest">{record.fisNo || 'NO BELİRTİLMEMİŞ'}</p>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-slate-400 tracking-tighter uppercase">ORAN</span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">% {kdvOrani}</span>
                    </div>
                    {kdvTutar > 0 && (
                      <div className="flex flex-col items-start border-l border-slate-200 pl-3">
                        <span className="text-[9px] font-black text-emerald-500 tracking-tighter uppercase">KDV TUTARI</span>
                        <span className="text-sm font-bold text-emerald-700">{formatCurrency(kdvTutar)} ₺</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-3 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    {getOdemeBadge(record.odemeDurumu)}
                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                      <button onClick={() => handleEdit(record)} className="p-1.5 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-900 tracking-tight">
                    {formatCurrency(record.toplamTutar)} {getCurrencySymbol(record.doviz)}
                  </p>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      <HizliFisModal 
        isOpen={isHizliOpen} 
        onClose={() => { setIsHizliOpen(false); setEditingRecord(null); }} 
        onSave={handleSave} 
        initialData={editingRecord}
      />

      <DigerGiderModal
        isOpen={isDigerOpen}
        onClose={() => { setIsDigerOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
        onBulkSave={handleBulkSave}
        initialData={editingRecord}
        existingRecords={records}
      />

      <DetayliFisModal
        isOpen={isDetayliOpen}
        onClose={() => { setIsDetayliOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
        initialData={editingRecord}
      />
    </div>
  )
}
