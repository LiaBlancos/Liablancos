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

      console.log(`[KURAL] ${rules.length} kural bulundu, ${records.length} kayıt kontrol ediliyor...`)
      rules.forEach((r: any) => console.log(`[KURAL] Keyword: "${r.keyword}" → Kategori: "${r.category}"`))

      let updatedCount = 0
      const updatedRecords = []

      for (const record of records) {
        const rawStr = `${record.kayitIsmi || ''} ${record.tedarikci || ''} ${record.aciklama || ''}`
        const searchStr = normalizeTurkish(rawStr)
        
        for (const rule of rules) {
          const normalizedKeyword = normalizeTurkish(rule.keyword)
          const isMatch = searchStr.includes(normalizedKeyword)
          
          if (isMatch) {
            console.log(`[KURAL] ✓ EŞLEŞME: "${rawStr}" içinde "${rule.keyword}" bulundu. Mevcut kategori: "${record.giderKategorisi}" → Yeni: "${rule.category}", KDV: %${rule.kdv_orani || 0}`)
            
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
            } else {
              console.log(`[KURAL] ⚠ Zaten aynı kategori ve KDV'de, güncelleme gerekmiyor.`)
            }
            break // İlk eşleşen kuralı uygula
          }
        }
      }

      if (updatedCount > 0) {
        // saveExpense uses UPDATE when id exists, unlike bulkSaveExpenses which uses ignoreDuplicates
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
    r.tedarikci.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-slate-900">Gider Kaydı</h1>
          <p className="text-slate-500 text-sm">Giderlerinizi hızlıca sisteme işleyin.</p>
        </div>
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
            title="Tüm kayıtları tanımladığınız akıllı kurallara göre otomatik kategorize eder."
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            KURALLARI UYGULA
          </button>
          <button
            onClick={() => setIsDigerOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#8B7E6A] hover:bg-[#7A6D59] text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors border-2 border-white/10 shadow-lg"
          >
            DİĞER GİDER KAYITLARI
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
            <div className="col-span-3">Kayıt İsmi</div>
            <div className="col-span-2">Tarih</div>
            <div className="col-span-3 text-center">KDV</div>
            <div className="col-span-3 text-right">Tutar</div>
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

                return (
                <div
                  key={record.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group items-center animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Icon */}
                  <div className="col-span-1 flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-[#F5F0EB] flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-[#8B7E6A]" />
                    </div>
                  </div>

                  {/* Kayıt İsmi + Tags */}
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-800 truncate">{record.kayitIsmi || 'İsimsiz Kayıt'}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {record.giderKategorisi && record.giderKategorisi !== 'Kategorisiz' && (
                        <CategoryTag 
                          text={record.giderKategorisi} 
                          color={GIDER_KATEGORILERI.find(c => c.text === record.giderKategorisi)?.color || 'gray'} 
                        />
                      )}
                      {record.etiket && record.etiket !== 'Etiketsiz' && (
                        <CategoryTag 
                          text={record.etiket} 
                          color={ETIKETLER.find(e => e.text === record.etiket)?.color || 'gray'} 
                        />
                      )}
                      {record.tedarikci && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-slate-400">
                          {record.tedarikci}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tarih */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">
                      {new Date(record.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Fiş / Fatura</p>
                  </div>

                  {/* KDV Oranı + Hesaplama */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={kdvOrani}
                        onChange={async (e) => {
                          const newRate = Number(e.target.value)
                          const newKdv = newRate > 0 ? tutar * newRate / (100 + newRate) : 0
                          try {
                            await saveExpense({
                              ...record,
                              kdvOrani: newRate,
                              toplamKdv: newKdv.toFixed(2)
                            })
                            fetchExpenses()
                          } catch (err: any) {
                            toast.error('KDV güncellenemedi: ' + err.message)
                          }
                        }}
                        className="w-[72px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all appearance-none cursor-pointer hover:border-slate-300"
                      >
                        <option value={0}>%0</option>
                        <option value={1}>%1</option>
                        <option value={10}>%10</option>
                        <option value={20}>%20</option>
                      </select>
                      {kdvOrani > 0 && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">KDV</span>
                          <span className="text-xs font-bold text-emerald-700">{formatCurrency(kdvTutar)} ₺</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tutar + Ödeme Durumu */}
                  <div className="col-span-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {getOdemeBadge(record.odemeDurumu)}
                      <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 text-slate-300 hover:text-indigo-500 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1 text-slate-300 hover:text-red-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {formatCurrency(record.toplamTutar)} {getCurrencySymbol(record.doviz)}
                    </p>
                    {kdvOrani > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        KDV Hariç: {formatCurrency(tutar - kdvTutar)} {getCurrencySymbol(record.doviz)}
                      </p>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* HIZLI FİŞ MODAL */}
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

      {/* DETAYLI FİŞ MODAL */}
      <DetayliFisModal
        isOpen={isDetayliOpen}
        onClose={() => { setIsDetayliOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
        initialData={editingRecord}
      />
    </div>
  )
}
