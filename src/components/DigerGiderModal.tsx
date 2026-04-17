'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, CheckCircle2, DollarSign, Calendar, FileText, Upload, Landmark, Megaphone, FileSpreadsheet, Loader2 } from 'lucide-react'
import { GIDER_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

interface DigerGiderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

type ViewMode = 'selection' | 'form' | 'excel'

export default function DigerGiderModal({ isOpen, onClose, onSave, initialData }: DigerGiderModalProps) {
  const [view, setView] = useState<ViewMode>('selection')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    kayitIsmi: '',
    tedarikci: '',
    tarih: new Date().toISOString().split('T')[0],
    toplamTutar: '',
    doviz: 'TL',
    odemeDurumu: 'odendi',
    giderKategorisi: 'Genel Giderler',
    etiket: 'Diğer',
    toplamKdv: '0',
    kdvOrani: 0
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        toplamTutar: initialData.toplamTutar.toString().replace('.', ','),
        toplamKdv: initialData.toplamKdv?.toString().replace('.', ',') || '0'
      })
      setView('form')
    } else {
      resetForm()
      setView('selection')
    }
  }, [initialData, isOpen])

  const resetForm = () => {
    setFormData({
      kayitIsmi: '',
      tedarikci: '',
      tarih: new Date().toISOString().split('T')[0],
      toplamTutar: '',
      doviz: 'TL',
      odemeDurumu: 'odendi',
      giderKategorisi: 'Genel Giderler',
      etiket: 'Diğer',
      toplamKdv: '0',
      kdvOrani: 0
    })
  }

  if (!isOpen) return null

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        if (data.length === 0) {
          toast.error('Excel dosyası boş veya geçersiz formatta.')
          return
        }

        // Process each row
        let successCount = 0
        for (const row of (data as any[])) {
          // Flexible mapping
          const record = {
            kayitIsmi: row['Açıklama'] || row['Gider İsmi'] || row['Açiklama'] || 'Excel Kaydı',
            tedarikci: row['Tedarikçi'] || row['Banka'] || '',
            tarih: row['Tarih'] ? new Date(row['Tarih']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            toplamTutar: row['Tutar'] || row['Toplam Tutar'] || '0',
            doviz: row['Döviz'] || 'TL',
            odemeDurumu: 'odendi',
            giderKategorisi: row['Kategori'] || 'Genel Giderler',
            etiket: 'Excel Aktarımı'
          }
          await onSave(record)
          successCount++
        }
        toast.success(`${successCount} adet gider başarıyla aktarıldı.`)
        onClose()
      } catch (err) {
        console.error('Excel parse error:', err)
        toast.error('Excel okunurken bir hata oluştu. Lütfen formatı kontrol edin.')
      } finally {
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSelection = (type: 'bank' | 'ad') => {
    resetForm()
    if (type === 'bank') {
      setFormData(prev => ({ ...prev, kayitIsmi: 'Banka İşlem Ücreti', giderKategorisi: 'Banka Giderleri', etiket: 'Banka' }))
    } else {
      setFormData(prev => ({ ...prev, kayitIsmi: 'Reklam Gideri', giderKategorisi: 'Reklam Giderleri', etiket: 'Reklam' }))
    }
    setView('form')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleCurrencyBlur = (field: 'toplamTutar' | 'toplamKdv') => {
    const value = formData[field]
    if (value) {
      setFormData(prev => ({ ...prev, [field]: formatCurrency(value) }))
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#8B7E6A] p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              {view === 'selection' ? 'Gider Türü Seçin' : 'Gider Detayları'}
            </h3>
            <p className="text-[#F5F0EB]/80 text-xs mt-1 font-medium">LiaBlancos Premium Muhasebe Yönetimi</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {view === 'selection' ? (
          <div className="p-8 grid grid-cols-1 gap-4">
            {/* Bank Excel Option */}
            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, giderKategorisi: 'Banka Giderleri', etiket: 'Banka' }))
                fileInputRef.current?.click()
              }}
              disabled={loading}
              className="group flex items-center gap-5 p-6 rounded-2xl bg-slate-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Landmark className="w-7 h-7" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Banka Giderleri (Excel)</h4>
                <p className="text-slate-500 text-sm mt-0.5">Banka ekstrelerini toplu olarak içeri aktarın</p>
              </div>
              <Upload className="w-5 h-5 text-slate-300 ml-auto" />
            </button>

            {/* Ad Excel Option */}
            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, giderKategorisi: 'Reklam Giderleri', etiket: 'Reklam' }))
                fileInputRef.current?.click()
              }}
              disabled={loading}
              className="group flex items-center gap-5 p-6 rounded-2xl bg-slate-50 hover:bg-orange-50 border-2 border-transparent hover:border-orange-200 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Megaphone className="w-7 h-7" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Reklam Giderleri (Excel)</h4>
                <p className="text-slate-500 text-sm mt-0.5">Reklam harcamalarını toplu olarak içeri aktarın</p>
              </div>
              <Upload className="w-5 h-5 text-slate-300 ml-auto" />
            </button>

            <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />

            <div className="pt-4 border-t border-slate-100 mt-2">
              <button 
                onClick={() => setView('form')}
                className="w-full py-4 text-slate-400 font-bold text-sm hover:text-[#8B7E6A] transition-colors"
              >
                + MANUEL GİDER KAYDI EKLE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kayıt İsmi */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gider Açıklaması</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="text"
                    placeholder="Gider açıklaması yazın..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#8B7E6A]/20 transition-all placeholder:text-slate-400 font-medium"
                    value={formData.kayitIsmi}
                    onChange={e => setFormData({ ...formData, kayitIsmi: e.target.value })}
                  />
                </div>
              </div>

              {/* Toplam Tutar */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Toplam Tutar</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="text"
                    placeholder="0,00"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#8B7E6A]/20 transition-all"
                    value={formData.toplamTutar}
                    onChange={e => setFormData({ ...formData, toplamTutar: e.target.value })}
                    onBlur={() => handleCurrencyBlur('toplamTutar')}
                  />
                </div>
              </div>

              {/* Tarih */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tarih</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="date"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#8B7E6A]/20 transition-all font-medium"
                    value={formData.tarih}
                    onChange={e => setFormData({ ...formData, tarih: e.target.value })}
                  />
                </div>
              </div>

              {/* Ödeme Durumu */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ödeme Durumu</label>
                <select
                  className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#8B7E6A]/20 transition-all font-medium appearance-none"
                  value={formData.odemeDurumu}
                  onChange={e => setFormData({ ...formData, odemeDurumu: e.target.value })}
                >
                  <option value="odendi">Ödendi</option>
                  <option value="odenecek">Ödenecek</option>
                  <option value="calisan">Çalışan Ödedi</option>
                </select>
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gider Kategorisi</label>
                <select
                  className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#8B7E6A]/20 transition-all font-medium appearance-none"
                  value={formData.giderKategorisi}
                  onChange={e => setFormData({ ...formData, giderKategorisi: e.target.value })}
                >
                  {GIDER_KATEGORILERI.map(cat => (
                    <option key={cat.text} value={cat.text}>{cat.text}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView('selection')}
                className="flex-1 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all border-2 border-slate-100 text-slate-400 hover:bg-slate-50"
              >
                GERİ DÖN
              </button>
              <button
                type="submit"
                className="flex-[2] bg-[#8B7E6A] hover:bg-[#7A6D59] text-white py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#8B7E6A]/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {initialData ? 'DEĞİŞİKLİKLERİ KAYDET' : 'GİDERİ KAYDET'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
