'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, DollarSign, Calendar, Tag, FileText, User } from 'lucide-react'
import { GIDER_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

interface DigerGiderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

export default function DigerGiderModal({ isOpen, onClose, onSave, initialData }: DigerGiderModalProps) {
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
    } else {
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
  }, [initialData, isOpen])

  if (!isOpen) return null

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
        <div className="bg-[#6A5E5B] p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Diğer Gider Kaydı</h3>
            <p className="text-[#F5F0EB]/80 text-xs mt-1 font-medium">Fiş veya fatura gerektirmeyen genel giderler</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

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
                  placeholder="Örn: Ofis Kirası, Personel Maaşı vb."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#6A5E5B]/20 transition-all placeholder:text-slate-400 font-medium"
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#6A5E5B]/20 transition-all"
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#6A5E5B]/20 transition-all font-medium"
                  value={formData.tarih}
                  onChange={e => setFormData({ ...formData, tarih: e.target.value })}
                />
              </div>
            </div>

            {/* Ödeme Durumu */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ödeme Durumu</label>
              <select
                className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#6A5E5B]/20 transition-all font-medium appearance-none"
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
                className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#6A5E5B]/20 transition-all font-medium appearance-none"
                value={formData.giderKategorisi}
                onChange={e => setFormData({ ...formData, giderKategorisi: e.target.value })}
              >
                {GIDER_KATEGORILERI.map(cat => (
                  <option key={cat.text} value={cat.text}>{cat.text}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#6A5E5B] hover:bg-[#5A4E4B] text-white py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#6A5E5B]/20 flex items-center justify-center gap-2 mt-4"
          >
            <CheckCircle2 className="w-5 h-5" />
            {initialData ? 'DEĞİŞİKLİKLERİ KAYDET' : 'GİDER KAYDINI TAMAMLA'}
          </button>
        </form>
      </div>
    </div>
  )
}
