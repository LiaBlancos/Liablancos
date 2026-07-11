'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  Receipt, 
  Filter, 
  Search, 
  ChevronDown, 
  CheckCircle2, 
  Trash2, 
  Pencil, 
  Download, 
  TrendingUp, 
  Wallet, 
  Clock, 
  Plus,
  Calendar,
  X,
  FileText
} from 'lucide-react'
import HizliFisModal from '@/components/HizliFisModal'
import DetayliFisModal from '@/components/DetayliFisModal'
import DigerGiderModal from '@/components/DigerGiderModal'
import CategoryTag from '@/components/CategoryTag'
import { GIDER_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import { formatCurrency, normalizeTurkish } from '@/lib/utils'
import { 
  getExpenses, 
  saveExpense, 
  deleteExpense as apiDeleteExpense, 
  bulkDeleteExpenses, 
  bulkUpdateExpenseStatus 
} from '@/lib/actions'
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

export default function GiderListesiPage() {
  const [records, setRecords] = useState<GiderKaydi[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'staff'>('all')
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterCurrency, setFilterCurrency] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  // Edit Modals state
  const [isHizliOpen, setIsHizliOpen] = useState(false)
  const [isDetayliOpen, setIsDetayliOpen] = useState(false)
  const [isDigerOpen, setIsDigerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GiderKaydi | null>(null)

  // Sort State
  const [sortField, setSortField] = useState<'tarih' | 'toplamTutar' | 'tedarikci' | 'kayitIsmi'>('tarih')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const data = await getExpenses()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Gider kayıtları yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Dashboard stats calculator
  const stats = useMemo(() => {
    let total = 0
    let paid = 0
    let pending = 0
    let staff = 0

    records.forEach(r => {
      const tutar = Number(r.toplamTutar) || 0
      total += tutar
      const d = r.odemeDurumu ? r.odemeDurumu.toLowerCase() : ''
      if (d === 'odendi' || d === 'ödendi') {
        paid += tutar
      } else if (d === 'odenecek' || d === 'ödenecek') {
        pending += tutar
      } else if (d === 'calisan' || d === 'çalışan cebinden ödedi') {
        staff += tutar
      }
    })

    return { total, paid, pending, staff }
  }, [records])

  // Sorting Handler
  const handleSort = (field: 'tarih' | 'toplamTutar' | 'tedarikci' | 'kayitIsmi') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Apply filters & search to records list
  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        // Tab Filters
        const status = r.odemeDurumu ? r.odemeDurumu.toLowerCase() : ''
        if (activeTab === 'paid' && status !== 'odendi' && status !== 'ödendi') return false
        if (activeTab === 'pending' && status !== 'odenecek' && status !== 'ödenecek') return false
        if (activeTab === 'staff' && status !== 'calisan' && status !== 'çalışan cebinden ödedi') return false

        // Search Query
        const searchStr = `${r.kayitIsmi || ''} ${r.tedarikci || ''} ${r.fisNo || ''} ${r.aciklama || ''}`.toLowerCase()
        if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) return false

        // Advanced Filters
        if (filterCategory && r.giderKategorisi !== filterCategory) return false
        if (filterTag && r.etiket !== filterTag) return false
        if (filterCurrency && r.doviz !== filterCurrency) return false
        if (filterDateStart && r.tarih < filterDateStart) return false
        if (filterDateEnd && r.tarih > filterDateEnd) return false

        return true
      })
      .sort((a, b) => {
        let fieldA: any = a[sortField]
        let fieldB: any = b[sortField]

        if (sortField === 'toplamTutar') {
          fieldA = Number(fieldA) || 0
          fieldB = Number(fieldB) || 0
        } else {
          fieldA = String(fieldA || '').toLowerCase()
          fieldB = String(fieldB || '').toLowerCase()
        }

        if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1
        if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
  }, [
    records, 
    activeTab, 
    searchQuery, 
    filterCategory, 
    filterTag, 
    filterCurrency, 
    filterDateStart, 
    filterDateEnd,
    sortField,
    sortDirection
  ])

  // Multi selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRecords.map(r => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Seçili ${selectedIds.length} gider kaydını silmek istediğinize emin misiniz?`)) {
      const toastId = toast.loading('Kayıtlar siliniyor...')
      try {
        const result = await bulkDeleteExpenses(selectedIds)
        if (result.success) {
          toast.success('Seçilen tüm giderler başarıyla silindi.', { id: toastId })
          setSelectedIds([])
          fetchExpenses()
        }
      } catch (err: any) {
        toast.error('Hata: ' + err.message, { id: toastId })
      }
    }
  }

  const handleBulkStatusChange = async (status: 'odendi' | 'odenecek' | 'calisan') => {
    if (selectedIds.length === 0) return
    const statusLabel = 
      status === 'odendi' ? 'Ödendi' : status === 'odenecek' ? 'Ödenecek' : 'Çalışan Cebinden'
    
    const toastId = toast.loading(`Ödeme durumu "${statusLabel}" olarak güncelleniyor...`)
    try {
      const result = await bulkUpdateExpenseStatus(selectedIds, status)
      if (result.success) {
        toast.success(`Seçili ${selectedIds.length} giderin durumu güncellendi.`, { id: toastId })
        setSelectedIds([])
        fetchExpenses()
      }
    } catch (err: any) {
      toast.error('Hata: ' + err.message, { id: toastId })
    }
  }

  // Export filtered records to Excel file
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.info('Dışa aktarılacak veri bulunamadı.')
      return
    }

    const dataToExport = filteredRecords.map((r, idx) => {
      const tutar = Number(r.toplamTutar) || 0
      const kdvOrani = r.kdvOrani || 0
      const kdvTutar = Number(r.toplamKdv) || (kdvOrani > 0 ? tutar * kdvOrani / (100 + kdvOrani) : 0)
      const odemeLabel = 
        r.odemeDurumu === 'odendi' ? 'Ödendi' : r.odemeDurumu === 'odenecek' ? 'Ödenecek' : r.odemeDurumu === 'calisan' ? 'Çalışan Cebinden Ödedi' : r.odemeDurumu

      return {
        'Sıra': idx + 1,
        'Kayıt İsmi': r.kayitIsmi || '',
        'Tedarikçi': r.tedarikci || '',
        'Tarih': r.tarih || '',
        'Fiş/Fatura No': r.fisNo || '',
        'KDV Oranı (%)': kdvOrani,
        'KDV Tutarı': kdvTutar.toFixed(2),
        'Toplam Tutar': tutar.toFixed(2),
        'Döviz': r.doviz || 'TRY',
        'Ödeme Durumu': odemeLabel,
        'Gider Kategorisi': r.giderKategorisi || '',
        'Etiket': r.etiket || '',
        'İşlem No': r.islemNo || '',
        'Açıklama': r.aciklama || ''
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gider Raporu')
    XLSX.writeFile(workbook, `Gider_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Gider listesi Excel formatında indirildi.')
  }

  // Edit / Delete single record
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
    if (confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) {
      const toastId = toast.loading('Gider siliniyor...')
      try {
        const result = await apiDeleteExpense(id)
        if (result.success) {
          toast.success('Gider başarıyla silindi.', { id: toastId })
          fetchExpenses()
        }
      } catch (err: any) {
        toast.error('Hata: ' + err.message, { id: toastId })
      }
    }
  }

  const handleSave = async (data: any) => {
    try {
      const result = await saveExpense({
        ...data,
        id: editingRecord?.id
      })
      if (result.success) {
        toast.success(editingRecord ? 'Kayıt güncellendi.' : 'Yeni gider eklendi.')
        fetchExpenses()
        setIsHizliOpen(false)
        setIsDetayliOpen(false)
        setIsDigerOpen(false)
        setEditingRecord(null)
        return { success: true }
      }
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
      throw error
    }
  }

  const handleBulkSave = async (dataList: any[]) => {
    // Required by DigerGiderModal but not used directly for list imports here
    toast.success(`${dataList.length} kayıt işlendi.`)
    fetchExpenses()
  }

  const getOdemeBadge = (durum: string) => {
    const d = durum ? durum.toLowerCase() : ''
    if (d === 'odendi' || d === 'ödendi') {
      return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">Ödendi</span>
    }
    if (d === 'odenecek' || d === 'ödenecek') {
      return <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">Ödenecek</span>
    }
    if (d === 'calisan' || d === 'çalışan cebinden ödedi') {
      return <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">Çalışan Ödedi</span>
    }
    return <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{durum}</span>
  }

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'USD': return '$'
      case 'EUR': return '€'
      default: return '₺'
    }
  }

  const clearFilters = () => {
    setFilterCategory('')
    setFilterTag('')
    setFilterCurrency('')
    setFilterDateStart('')
    setFilterDateEnd('')
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterCategory) count++
    if (filterTag) count++
    if (filterCurrency) count++
    if (filterDateStart) count++
    if (filterDateEnd) count++
    return count
  }, [filterCategory, filterTag, filterCurrency, filterDateStart, filterDateEnd])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gider Listesi</h1>
            <p className="text-slate-500 text-sm">Tüm giderlerinizi listeleyin, arayın ve toplu işlemlerle yönetin.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHizliOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[13px] tracking-wide transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            HIZLI GİDER EKLE
          </button>
        </div>
      </div>

      {/* DASHBOARD SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOPLAM GİDER', value: stats.total, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'ÖDENEN GİDERLER', value: stats.paid, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'BEKLEYEN ÖDEMELER', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'PERSONEL HARCAMALARI', value: stats.staff, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(stat.value)} ₺</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'TÜMÜ' },
          { id: 'pending', label: 'ÖDENECEKLER' },
          { id: 'paid', label: 'ÖDENENLER' },
          { id: 'staff', label: 'PERSONEL HARC.' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any)
              setSelectedIds([]) // Reset selections on tab change
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar & Filters */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex w-full lg:w-auto flex-1 items-center gap-0">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-[10px] rounded-l-xl border border-r-0 font-bold text-[13px] tracking-wide transition-colors whitespace-nowrap ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-4 h-4 opacity-70" />
              FİLTRELE {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Fatura No, Tedarikçi, İsim veya Açıklama ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-[10px] bg-slate-50 border border-slate-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 mr-2 animate-fade-in">
                <span className="text-xs font-bold text-slate-500 px-2">Seçili ({selectedIds.length}):</span>
                <button
                  onClick={() => handleBulkStatusChange('odendi')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors"
                >
                  Ödendi Yap
                </button>
                <button
                  onClick={() => handleBulkStatusChange('odenecek')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition-colors"
                >
                  Ödenecek Yap
                </button>
                <button
                  onClick={() => handleBulkStatusChange('calisan')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                >
                  Personel Yap
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl font-bold text-[13px] tracking-wide transition-colors"
            >
              <Download className="w-4 h-4" />
              EXCEL İNDİR
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-slide-down">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Gider Kategorisi</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                {GIDER_KATEGORILERI.map((cat) => (
                  <option key={cat.text} value={cat.text}>{cat.text}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Etiket</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                {ETIKETLER.map((tag) => (
                  <option key={tag.text} value={tag.text}>{tag.text}</option>
                ))}
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Döviz</label>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Date Range End & Reset */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Bitiş Tarihi</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  onClick={clearFilters}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-colors"
                  title="Filtreleri Temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Records List / Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Kayıtlar yükleniyor...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Receipt className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Gösterilecek Gider Bulunmadı</h2>
            <p className="text-slate-500 max-w-sm">
              {searchQuery || activeFiltersCount > 0 
                ? 'Belirttiğiniz kriterlere uygun gider kaydı bulunamadı. Lütfen filtrelerinizi kontrol edin.'
                : 'Sistemde henüz hiç gider kaydı bulunmuyor. Yeni gider eklemek için sağ üstteki butonu kullanabilirsiniz.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#e8e7e5] border-b border-gray-300 text-[11px] font-bold text-gray-600 uppercase tracking-wider items-center">
            <div className="col-span-1 flex justify-center">
              <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
              />
            </div>
            <div 
              className="col-span-3 cursor-pointer hover:text-slate-950 flex items-center gap-1 select-none"
              onClick={() => handleSort('kayitIsmi')}
            >
              GİDER İSMİ / TEDARİKÇİ
              {sortField === 'kayitIsmi' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
            </div>
            <div className="col-span-2 select-none">
              KATEGORİ / ETİKET
            </div>
            <div className="col-span-2 select-none">
              FİŞ/FATURA NO
            </div>
            <div 
              className="col-span-2 cursor-pointer hover:text-slate-950 flex items-center gap-1 select-none"
              onClick={() => handleSort('tarih')}
            >
              TARİH
              {sortField === 'tarih' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
            </div>
            <div className="col-span-2 text-right cursor-pointer hover:text-slate-950 flex items-center justify-end gap-1 select-none"
              onClick={() => handleSort('toplamTutar')}
            >
              TUTAR
              {sortField === 'toplamTutar' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
            </div>
          </div>

          {/* Records List */}
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record, index) => {
              const tutar = Number(record.toplamTutar) || 0
              const kdvOrani = record.kdvOrani || 0
              const kdvTutar = Number(record.toplamKdv) || (kdvOrani > 0 ? tutar * kdvOrani / (100 + kdvOrani) : 0)
              
              const d = new Date(record.tarih)
              const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
              const isSelected = selectedIds.includes(record.id)

              return (
                <div
                  key={record.id}
                  onClick={() => handleEdit(record)}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 bg-white hover:bg-slate-50/50 transition-colors group items-center cursor-pointer border-b border-gray-100 ${
                    isSelected ? 'bg-indigo-50/20' : ''
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(record.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Kayıt İsmi & Tedarikçi */}
                  <div className="col-span-3">
                    <p className="text-[15px] font-medium text-gray-800 uppercase tracking-tight truncate">
                      {record.kayitIsmi || 'İsimsiz Kayıt'}
                    </p>
                    <p className="text-[13px] text-gray-400 mt-0.5 truncate">{record.tedarikci || '-'}</p>
                  </div>

                  {/* Kategori & Etiket */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1 items-start">
                      {record.giderKategorisi && record.giderKategorisi !== 'Kategorisiz' ? (
                        <CategoryTag 
                          text={record.giderKategorisi} 
                          color={GIDER_KATEGORILERI.find(c => c.text === record.giderKategorisi)?.color || 'gray'} 
                        />
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider">KATEGORİSİZ</span>
                      )}
                      {record.etiket && record.etiket !== 'Etiketsiz' && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded">
                          {record.etiket}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fiş Fatura No */}
                  <div className="col-span-2">
                    <span className="text-sm font-mono text-slate-700 tracking-tight">
                      {record.fisNo || 'NO BELİRTİLMEMİŞ'}
                    </span>
                    {record.islemNo && (
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider">
                        İŞLEM: {record.islemNo}
                      </p>
                    )}
                  </div>

                  {/* Tarih */}
                  <div className="col-span-2">
                    <p className="text-[14px] text-gray-800">{dateStr}</p>
                    {getOdemeBadge(record.odemeDurumu)}
                  </div>

                  {/* Tutar & Actions */}
                  <div className="col-span-2 text-right relative flex flex-col items-end justify-center">
                    <div className="text-[16px] font-black text-slate-900 tracking-tight">
                      {formatCurrency(tutar)} {getCurrencySymbol(record.doviz)}
                    </div>
                    {kdvTutar > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                        KDV: {formatCurrency(kdvTutar)}{getCurrencySymbol(record.doviz)} (%{kdvOrani})
                      </p>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white pl-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
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
        </div>
      )}

      {/* EDITING MODALS */}
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