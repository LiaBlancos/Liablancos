'use client'

import React, { useState } from 'react'
import { PlusSquare, Filter, Search, ChevronDown, Receipt, FileText, X, CheckCircle2, Trash2, Pencil, Copy, RotateCcw, TrendingUp, Wallet, Clock, Ban } from 'lucide-react'
import YeniFaturaModal from '@/components/YeniFaturaModal'
import FaturaDetayModal from '@/components/FaturaDetayModal'
import CategoryTag from '@/components/CategoryTag'
import { GELIR_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import { formatCurrency, normalizeTurkish } from '@/lib/utils'

import { getIncomes, saveIncome, deleteIncome as apiDeleteIncome, bulkSaveIncomes, bulkDeleteIncomes, bulkUpdateIncomeStatus, getExpenseRules } from '@/lib/actions'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface GelirKaydi {
  id: string
  kayitIsmi: string
  musteri: string
  tarih: string
  toplamTutar: string | number
  doviz: string
  toplamKdv: string | number
  kdvOrani: number
  tahsilatDurumu: string
  vadeTarihi?: string
  gelirKategorisi: string
  etiket: string
  fisNo?: string
  dosya?: string | null
  lineItems?: any[]
  stokTakipli?: boolean
  islemNo?: string
  aciklama?: string
  teslimatAdresi?: string
  siparisBilgileri?: string
  indirimTutari?: number
  createdAt: string
}

export default function GelirKaydiPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFaturaOpen, setIsFaturaOpen] = useState(false)
  const [isDetayOpen, setIsDetayOpen] = useState(false)
  const [records, setRecords] = useState<GelirKaydi[]>([])
  const [selectedRecord, setSelectedRecord] = useState<GelirKaydi | null>(null)
  const [editingRecord, setEditingRecord] = useState<GelirKaydi | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'returned'>('all')

  // Load from Supabase on mount
  React.useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const data = await getIncomes()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Kayıtlar yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      const result = await saveIncome({
        ...data,
        id: editingRecord?.id
      })
      if (result.success) {
        toast.success(editingRecord ? 'Kayıt güncellendi' : 'Yeni kayıt eklendi')
        fetchExpenses()
        setIsFaturaOpen(false)
        setEditingRecord(null)
        return { success: true }
      }
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
      throw error // Hatayı fırlat ki Modal bunu anlasın
    }
  }

  const handleEdit = (record: GelirKaydi) => {
    setEditingRecord(record)
    if (record.lineItems && record.lineItems.length > 0) {
      setIsFaturaOpen(true)
    } else {
      setIsFaturaOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      try {
        const result = await apiDeleteIncome(id)
        if (result.success) {
          toast.success('Kayıt silindi')
          fetchExpenses()
        }
      } catch (error: any) {
        toast.error('Silme hatası: ' + error.message)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Seçili ${selectedIds.length} kaydı silmek istediğinize emin misiniz?`)) {
      const toastId = toast.loading('Siliniyor...')
      try {
        const result = await bulkDeleteIncomes(selectedIds)
        if (result.success) {
          toast.success('Seçili kayıtlar silindi', { id: toastId })
          setSelectedIds([])
          fetchExpenses()
        }
      } catch (error: any) {
        toast.error('Silme hatası: ' + error.message, { id: toastId })
      }
    }
  }

  const handleBulkReturn = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Seçili ${selectedIds.length} kaydı iade olarak işaretlemek istediğinize emin misiniz?`)) {
      const toastId = toast.loading('Güncelleniyor...')
      try {
        const result = await bulkUpdateIncomeStatus(selectedIds, 'İade Edildi')
        if (result.success) {
          toast.success('Seçili kayıtlar iade edildi', { id: toastId })
          setSelectedIds([])
          fetchExpenses()
        }
      } catch (error: any) {
        toast.error('Hata: ' + error.message, { id: toastId })
      }
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRecords.map(r => r.id))
    }
  }

  // --- SİPARİŞ FATURA (EXCEL) İşleyicisi ---
  const handleSiparisExcel = async (file: File) => {
    const toastId = toast.loading('Excel dosyası okunuyor...')
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      // First, read all rows as raw arrays to find the header row
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      // Scan for the header row (contains "Paket" or "Sipariş" or "Siparis")
      let headerRowIdx = -1
      for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
        const row = rawRows[i]
        if (!row || !Array.isArray(row)) continue
        const joined = row.map((c: any) => String(c || '')).join('|').toLowerCase()
        if (joined.includes('paket') || joined.includes('sipari') || joined.includes('ürün') || joined.includes('urun')) {
          headerRowIdx = i
          break
        }
      }

      if (headerRowIdx === -1) {
        toast.error('Excel\'de başlık satırı bulunamadı. "Paket No", "Sipariş Numarası" gibi sütunlar olmalı.', { id: toastId, duration: 8000 })
        return
      }

      // Re-parse with the correct header row
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: headerRowIdx })

      if (rows.length === 0) {
        toast.error('Excel dosyası boş veya okunamadı.', { id: toastId })
        return
      }

      // Normalize Turkish chars for matching
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
      const allCols = Object.keys(sample)
      console.log('Excel sütunları:', allCols)

      const colPaketNo = findCol(sample, ['Paket No', 'PaketNo', 'paketno', 'Paket'])
      const colSiparisTarihi = findCol(sample, ['Sipariş Tarihi', 'SiparisTarihi', 'Siparis Tarihi', 'Tarih'])
      const colTeslimatAdresi = findCol(sample, ['Teslimat Adresi', 'TeslimatAdresi', 'Adres', 'Teslimat'])
      const colSiparisNo = findCol(sample, ['Sipariş Numarası', 'SiparisNumarasi', 'Siparis No', 'SiparisNo', 'Siparis Numarasi'])
      const colAlici = findCol(sample, ['Alıcı', 'Alici', 'Müşteri', 'Musteri', 'Alıcı Adı'])
      const colUrunAdi = findCol(sample, ['Ürün Adı', 'UrunAdi', 'Urun Adi', 'Ürün'])
      const colAdet = findCol(sample, ['Adet', 'Miktar', 'Qty'])
      const colFaturalanacakTutar = findCol(sample, ['Faturalanacak Tutar', 'FaturalanacakTutar', 'Ödenecek Tutar', 'OdenecekTutar'])
      const colBirimFiyat = findCol(sample, ['Birim Fiyat', 'BirimFiyat', 'Birim Fiyatı', 'Fiyat'])
      const colIndirim = findCol(sample, ['İndirim Tutarı', 'IndirimTutari', 'İndirim', 'Indirim'])

      if (!colPaketNo && !colSiparisNo) {
        toast.error(`Sütun bulunamadı. Excel sütunları: ${allCols.join(', ')}`, { id: toastId, duration: 10000 })
        return
      }

      // Group rows by Paket No (one invoice per package)
      const grouped: Record<string, any[]> = {}
      for (const row of rows) {
        const key = String(row[colPaketNo!] || row[colSiparisNo!] || 'unknown')
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(row)
      }

      const invoices: any[] = []

      for (const [paketNo, items] of Object.entries(grouped)) {
        const firstRow = items[0]
        const siparisNo = colSiparisNo ? String(firstRow[colSiparisNo] || '') : ''
        const teslimatAdresi = colTeslimatAdresi ? String(firstRow[colTeslimatAdresi] || '') : ''

        // Parse siparis tarihi
        let siparisTarihi = new Date().toISOString().split('T')[0]
        if (colSiparisTarihi && firstRow[colSiparisTarihi]) {
          const raw = firstRow[colSiparisTarihi]
          if (typeof raw === 'number') {
            const d = XLSX.SSF.parse_date_code(raw)
            siparisTarihi = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
          } else {
            const parsed = new Date(raw)
            if (!isNaN(parsed.getTime())) {
              siparisTarihi = parsed.toISOString().split('T')[0]
            }
          }
        }

        // Build line items
        let toplamIndirim = 0
        const lineItems = items.map((item, idx) => {
          const adet = colAdet ? (Number(item[colAdet]) || 1) : 1
          const indirim = colIndirim ? (Number(item[colIndirim]) || 0) : 0
          
          // Trendyol Calculation:
          // 1. Matrah = Faturalanacak Tutar / 1.10
          // 2. Birim Fiyat = (Matrah + Indirim) / Adet
          let kdvHaricBirimFiyat = 0
          if (colFaturalanacakTutar) {
            const faturalanacakTutar = Number(item[colFaturalanacakTutar]) || 0
            const netTutar = faturalanacakTutar / 1.10
            kdvHaricBirimFiyat = (netTutar + indirim) / adet
          } else {
            const kdvDahilBirimFiyat = colBirimFiyat ? (Number(item[colBirimFiyat]) || 0) : 0
            kdvHaricBirimFiyat = kdvDahilBirimFiyat / 1.10
          }
          
          toplamIndirim += indirim

          return {
            id: `${paketNo}_${idx}`,
            name: colUrunAdi ? String(item[colUrunAdi] || 'Ürün') : 'Ürün',
            quantity: adet,
            unit: 'Adet',
            price: kdvHaricBirimFiyat,
            taxRate: 10,
            discount: indirim
          }
        })

        // Calculate totals based on tax-exclusive prices
        const araToplam = lineItems.reduce((sum, li) => sum + (li.quantity * li.price), 0)
        // User request: Discount from Excel is treated as a net/direct amount (no KDV division)
        const kdvHaricIndirim = toplamIndirim
        const brutToplam = araToplam - kdvHaricIndirim
        const kdvToplam = brutToplam * 0.10
        const genelToplam = brutToplam + kdvToplam

        const kayitIsmi = 'Trendyol Sipariş'

        // Get customer name from Alıcı column, fallback to 'Trendyol Müşterisi'
        const musteriIsmi = colAlici ? String(firstRow[colAlici] || 'Trendyol Müşterisi') : 'Trendyol Müşterisi'

        invoices.push({
          kayitIsmi,
          musteri: musteriIsmi,
          tarih: siparisTarihi,
          toplamTutar: genelToplam.toFixed(2),
          doviz: 'TRY',
          toplamKdv: kdvToplam.toFixed(2),
          kdvOrani: 10,
          tahsilatDurumu: 'tahsil_edilecek',
          vadeTarihi: null,
          gelirKategorisi: 'Kategorisiz',
          etiket: 'Etiketsiz',
          fisNo: siparisNo,
          lineItems,
          stokTakipli: true,
          islemNo: paketNo,
          indirimTutari: kdvHaricIndirim,
          aciklama: `Sipariş Bilgileri: ${paketNo} - ${siparisNo} / ${siparisTarihi}\nAlıcı: ${musteriIsmi}\nTeslimat Adresi: ${teslimatAdresi}\nSatır İndirimi: ${toplamIndirim.toFixed(2)}₺\nBrüt Toplam: ${brutToplam.toFixed(2)}₺`
        })
      }

      if (invoices.length === 0) {
        toast.error('Geçerli fatura verisi bulunamadı.', { id: toastId })
        return
      }

      toast.loading(`${invoices.length} fatura kaydediliyor...`, { id: toastId })
      await bulkSaveIncomes(invoices)

      toast.success(`${invoices.length} sipariş faturası başarıyla kaydedildi!`, { id: toastId })
      fetchExpenses()
    } catch (error: any) {
      console.error('Sipariş Excel hatası:', error)
      toast.error('Excel işlenirken hata: ' + error.message, { id: toastId })
    }
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.kayitIsmi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.musteri.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (r.fisNo && r.fisNo.toLowerCase().includes(searchQuery.toLowerCase()))

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'paid') return matchesSearch && (r.tahsilatDurumu === 'tahsil_edildi' || r.tahsilatDurumu === 'Tahsil Edildi')
    if (activeTab === 'pending') return matchesSearch && r.tahsilatDurumu === 'tahsil_edilecek'
    if (activeTab === 'returned') return matchesSearch && r.tahsilatDurumu === 'İade Edildi'
    
    return matchesSearch
  })

  const getOdemeBadge = (durum: string) => {
    switch (durum) {
      case 'odendi': return <span className="text-xs font-bold text-emerald-700">Ödendi</span>
      case 'odenecek': return <span className="text-xs font-bold text-amber-600">Ödenecek</span>
      case 'calisan': return <span className="text-xs font-bold text-blue-600">Çalışan Ödedi</span>
      default: return null
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Gelir Kaydı</h1>
          <p className="text-slate-500 text-sm">Gelirlerinizi hızlıca sisteme işleyin.</p>
        </div>
      </div>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOPLAM CİRO', value: records.reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'TAHSİL EDİLEN', value: records.filter(r => r.tahsilatDurumu === 'tahsil_edildi' || r.tahsilatDurumu === 'Tahsil Edildi').reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'BEKLEYEN', value: records.filter(r => r.tahsilatDurumu === 'tahsil_edilecek').reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'İADELER', value: records.filter(r => r.tahsilatDurumu === 'İade Edildi').reduce((sum, r) => sum + (Number(r.toplamTutar) || 0), 0), icon: Ban, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(stat.value)}₺</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'TÜMÜ', icon: Receipt },
          { id: 'pending', label: 'BEKLEYENLER', icon: Clock },
          { id: 'paid', label: 'TAHSİL EDİLENLER', icon: CheckCircle2 },
          { id: 'returned', label: 'İADELER', icon: RotateCcw },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex w-full sm:w-auto flex-1 items-center gap-0">
          <button className="flex items-center gap-2 px-5 py-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-l-xl border border-r-0 border-slate-200 font-bold text-[13px] tracking-wide transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4 opacity-70" />
            FİLTRELE
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-[10px] bg-slate-50 border border-slate-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={handleBulkReturn}
                className="flex items-center gap-2 px-4 py-[10px] bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 font-bold text-[13px] tracking-wide transition-all animate-fade-in"
              >
                <RotateCcw className="w-4 h-4" />
                İADE ET ({selectedIds.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 font-bold text-[13px] tracking-wide transition-all animate-fade-in"
              >
                <Trash2 className="w-4 h-4" />
                SİL ({selectedIds.length})
              </button>
            </>
          )}
          <button
            onClick={() => setIsFaturaOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#6A5E5B] hover:bg-[#5A4E4B] text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors"
          >
            YENİ FATURA OLUŞTUR
          </button>
          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors cursor-pointer shadow-sm">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                toast.success('Trendyol Ödeme Exceli okundu. (Yapım aşamasında)');
              }
            }} />
            TRENDYOL ÖDEME EXCELİ
          </label>
          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors shadow-sm cursor-pointer">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleSiparisExcel(e.target.files[0])
                e.target.value = '' // Reset input
              }
            }} />
            SİPARİŞ FATURA (EXCEL)
          </label>
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
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Gelirleri Eklemek Çok Kolay</h2>
            <p className="text-slate-500 max-w-sm">
              Yukarıdaki butonları kullanarak yeni fiş ve faturalarınızı girebilirsiniz. Eklediğiniz kayıtlar burada listelenecektir.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#e8e7e5] border-b border-gray-300 text-[11px] font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-1 flex justify-center">
              <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
              />
            </div>
            <div className="col-span-3">FATURA İSMİ</div>
            <div className="col-span-2">FATURA NO</div>
            <div className="col-span-2 flex items-center gap-1 text-[#2dbda8]">
              DÜZENLEME TARİHİ
              <span className="text-xs">↓</span>
            </div>
            <div className="col-span-2">VADE TARİHİ</div>
            <div className="col-span-2 text-right">KALAN MEBLAĞ</div>
          </div>

          {/* Records */}
          {filteredRecords.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              Aramanızla eşleşen kayıt bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRecords.map((record, index) => {
                let tutar = 0
                if (typeof record.toplamTutar === 'number') {
                  tutar = record.toplamTutar
                } else if (typeof record.toplamTutar === 'string') {
                  // If it has a comma, it's likely Turkish format "1.234,56"
                  if (record.toplamTutar.includes(',')) {
                    tutar = parseFloat(record.toplamTutar.replace(/\./g, '').replace(',', '.'))
                  } else {
                    // It's likely a DB decimal format "1234.56"
                    tutar = parseFloat(record.toplamTutar)
                  }
                }
                
                const kdvOrani = record.kdvOrani || 0
                const kdvTutar = kdvOrani > 0 ? tutar * kdvOrani / (100 + kdvOrani) : 0

                const currencySymbol = record.doviz === 'USD' ? '$' : record.doviz === 'EUR' ? '€' : '₺'
                const d = new Date(record.tarih)
                const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

                let vadeDateStr = ''
                let vadeDiffStr = ''
                if (record.tahsilatDurumu === 'tahsil_edilecek' && record.vadeTarihi) {
                  const vd = new Date(record.vadeTarihi)
                  vadeDateStr = vd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                  const diffTime = vd.getTime() - new Date().getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  vadeDiffStr = `(${diffDays} gün sonra)`
                }

                const isPaid = record.tahsilatDurumu === 'tahsil_edildi' || record.tahsilatDurumu === 'Tahsil Edildi'
                const kalanStr = isPaid ? 'Tahsil edildi' : formatCurrency(tutar)

                return (
                <div
                  key={record.id}
                  onClick={() => {
                    setSelectedRecord(record)
                    setIsDetayOpen(true)
                  }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 bg-white hover:bg-slate-50/50 transition-colors group items-center animate-fade-in cursor-pointer border-b border-gray-100"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Icon & Checkbox */}
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, record.id])
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== record.id))
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Kayıt İsmi */}
                  <div className="col-span-3">
                    <p className="text-[15px] font-medium text-gray-800">{record.kayitIsmi || 'İsimsiz Kayıt'}</p>
                    <p className="text-[13px] text-gray-400 mt-1">{record.musteri || '-'}</p>
                  </div>

                  {/* Fatura No */}
                  <div className="col-span-2">
                    <div 
                      className="group/copy flex items-center gap-2 cursor-copy"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (record.fisNo) {
                          navigator.clipboard.writeText(record.fisNo)
                          toast.success('Fatura numarası kopyalandı')
                        }
                      }}
                    >
                      <p className="text-sm text-gray-800">{record.fisNo || '—'}</p>
                      {record.fisNo && <Copy className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                    </div>
                  </div>

                  {/* Düzenleme Tarihi */}
                  <div className="col-span-2">
                    <p className="text-[14px] text-gray-800">{dateStr}</p>
                    <p className="text-[12px] text-gray-400 mt-1">Satış Faturası</p>
                  </div>

                  {/* Vade Tarihi */}
                  <div className="col-span-2">
                    {vadeDateStr ? (
                      <>
                        <p className="text-[14px] text-gray-800">{vadeDateStr}</p>
                        <p className="text-[12px] text-gray-500 mt-1">{vadeDiffStr}</p>
                      </>
                    ) : (
                      <p className="text-[14px] text-gray-800">—</p>
                    )}
                  </div>

                  {/* Kalan Meblağ */}
                  <div className="col-span-2 text-right relative group flex flex-col items-end justify-center">
                    <div className={`text-[15px] font-bold ${isPaid ? 'text-gray-400' : 'text-gray-800'}`}>
                      {kalanStr}
                      {!isPaid && <span className="text-xs ml-0.5">{currencySymbol}</span>}
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1">
                      Genel Toplam {formatCurrency(tutar)}<span className="text-[10px]">{currencySymbol}</span>
                    </p>

                    {/* Hover Actions */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white pl-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(record)
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(record.id)
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* YENİ FATURA MODAL */}
      <YeniFaturaModal 
        isOpen={isFaturaOpen} 
        onClose={() => { setIsFaturaOpen(false); setEditingRecord(null); }} 
        onSave={handleSave} 
        initialData={editingRecord}
      />

      {/* FATURA DETAY MODAL */}
      <FaturaDetayModal
        isOpen={isDetayOpen}
        onClose={() => { setIsDetayOpen(false); setSelectedRecord(null); }}
        record={selectedRecord}
        onEdit={() => {
          setIsDetayOpen(false)
          setEditingRecord(selectedRecord)
          setIsFaturaOpen(true)
        }}
        onDelete={() => {
          if (selectedRecord) {
            handleDelete(selectedRecord.id)
            setIsDetayOpen(false)
            setSelectedRecord(null)
          }
        }}
      />
    </div>
  )
}
