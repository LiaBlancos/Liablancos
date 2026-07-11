'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  FileSignature, Users, FileText, CalendarDays, DollarSign, Percent,
  CreditCard, Clock, Camera, Tag, FolderOpen, UserCheck, Search,
  ChevronDown, Upload, X, Trash2, Building2, Hash
} from 'lucide-react'

interface GelirEkleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<any>
  initialData?: any
}

import { GELIR_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import CategoryTag from '@/components/CategoryTag'
import { formatCurrency } from '@/lib/utils'

const MOCK_CUSTOMERS = ['Migros', 'BİM', 'A101', 'Metro', 'Trendyol Express', 'Kargo Şirketi', 'Ofis Malzemeleri AŞ']
const MOCK_BANKS = ['Ziraat Bankası', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi', 'Halkbank']
const MOCK_EMPLOYEES = ['Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir']

const today = new Date().toISOString().split('T')[0]

export default function GelirEkleModal({ isOpen, onClose, onSave, initialData }: GelirEkleModalProps) {
  const kayitRef = useRef<HTMLInputElement>(null)

  const defaultForm = {
    kayitIsmi: '', musteri: '', tarih: today,
    toplamTutar: '', doviz: 'TRY',
    toplamKdv: '', kdvOrani: 20,
    tahsilatDurumu: 'tahsil_edilecek' as 'tahsil_edilecek' | 'tahsil_edildi' | 'calisan',
    tahsilTarihi: today, bankaHesabi: '', tahsilEdenCalisan: '',
    gelirKategorisi: 'Kategorisiz', etiket: 'Etiketsiz', fisNo: ''
  }

  const [formData, setFormData] = useState(defaultForm)

  const [customerQuery, setCustomerQuery] = useState('')
  const [showCustomers, setShowCustomers] = useState(false)
  const [showCurrency, setShowCurrency] = useState(false)
  const [showFisNo, setShowFisNo] = useState(false)
  const [showFisMenu, setShowFisMenu] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [showEtiketDropdown, setShowEtiketDropdown] = useState(false)
  const [etiketQuery, setEtiketQuery] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...defaultForm, ...initialData })
        setCustomerQuery(initialData.musteri || '')
        setShowFisNo(!!initialData.fisNo)
      } else {
        setFormData(defaultForm)
        setCustomerQuery('')
        setFile(null)
        setFilePreview('')
        setShowFisNo(false)
      }
      setTimeout(() => kayitRef.current?.focus(), 100)
    }
  }, [isOpen, initialData])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  const updateForm = useCallback((key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  // KDV auto-calc when tutar or oran changes
  useEffect(() => {
    if (formData.toplamTutar && formData.kdvOrani > 0) {
      const tutarStr = String(formData.toplamTutar).replace(/\./g, '').replace(',', '.')
      const tutar = parseFloat(tutarStr) || 0
      const kdv = (tutar * formData.kdvOrani) / (100 + formData.kdvOrani)
      setFormData(prev => ({ ...prev, toplamKdv: kdv.toFixed(2).replace('.', ',') }))
    }
  }, [formData.toplamTutar, formData.kdvOrani])

  const filteredCustomers = MOCK_CUSTOMERS.filter(s =>
    s.toLowerCase().includes(customerQuery.toLowerCase()) && customerQuery.length > 0
  )

  const handleFile = (f: File) => {
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setFilePreview('')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = () => {
    const payload = { ...formData, dosya: file?.name || null }
    console.log('Form JSON:', JSON.stringify(payload, null, 2))
    onSave?.(payload)
    onClose()
  }

  if (!isOpen) return null

  const currencies = [
    { code: 'TRY', label: 'TL', icon: '₺' },
    { code: 'USD', label: 'USD', icon: '$' },
    { code: 'EUR', label: 'EUR', icon: '€' },
  ]
  const currentCurrency = currencies.find(c => c.code === formData.doviz) || currencies[0]

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-[#F5F0EB] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto ring-1 ring-black/5 animate-scale-in" onClick={e => e.stopPropagation()}>

        {/* TOP BAR: Kayıt İsmi + Buttons */}
        <div className="flex items-center gap-4 px-6 py-4 bg-[#F5F0EB] border-b border-[#E0D6CC]">
          <div className="flex items-center gap-3 flex-1">
            <FileSignature className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
            <span className="text-sm font-bold text-[#6A5E5B] tracking-wide whitespace-nowrap uppercase">Kayıt İsmi</span>
            <input ref={kayitRef} type="text" tabIndex={1} value={formData.kayitIsmi} onChange={e => updateForm('kayitIsmi', e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-[#6A5E5B] bg-white border border-[#D5CCBE] hover:bg-[#EDE7DF] rounded-lg transition-colors">VAZGEÇ</button>
            <div className="flex">
              <button onClick={handleSubmit} className="px-6 py-2.5 text-sm font-bold text-white bg-[#4A4240] hover:bg-[#3A3230] rounded-l-lg transition-colors">KAYDET</button>
              <button className="px-2 py-2.5 text-white bg-[#4A4240] hover:bg-[#3A3230] rounded-r-lg border-l border-[#5A5250] transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-col lg:flex-row">

          {/* LEFT COLUMN */}
          <div className="flex-1 divide-y divide-[#E0D6CC]">

            {/* TEDARİKÇİ */}
            <div className="flex items-center gap-4 px-6 py-4">
              <Users className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Müşteri / Kaynak</span>
              <div className="flex-1 relative">
                <input type="text" tabIndex={2} value={customerQuery}
                  onChange={e => { setCustomerQuery(e.target.value); updateForm('musteri', e.target.value); setShowCustomers(true) }}
                  onFocus={() => setShowCustomers(true)} onBlur={() => setTimeout(() => setShowCustomers(false), 200)}
                  className="w-full px-4 py-2.5 pr-10 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]" />
                <Search className="w-4 h-4 text-[#A89B8C] absolute right-3 top-1/2 -translate-y-1/2" />
                {showCustomers && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5CCBE] rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredCustomers.map(s => (
                      <button key={s} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0EB] text-slate-700"
                        onMouseDown={() => { setCustomerQuery(s); updateForm('musteri', s); setShowCustomers(false) }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-4 px-6 py-3">
              <div className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs text-[#A89B8C] italic">Kayıtlı bir tedarikçi seçebilir veya yeni bir tedarikçi ismi yazabilirsiniz.</span>
            </div>

            {/* TEDARİKÇİ BİLGİLERİ */}
            <div className="flex items-center gap-4 px-6 py-4">
              <FileText className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Müşteri / Kaynak Bilgileri</span>
              <span className="text-sm text-[#A89B8C]">&mdash;</span>
            </div>

            {/* FİŞ/FATURA TARİHİ */}
            <div className="flex items-center gap-4 px-6 py-4">
              <CalendarDays className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Fiş/Fatura Tarihi</span>
              <div className="flex items-center gap-2 flex-1">
                <input type="date" tabIndex={3} value={formData.tarih} 
                  onChange={e => updateForm('tarih', e.target.value)}
                  onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A] cursor-pointer" />
                {!showFisNo && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowFisMenu(!showFisMenu)}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-[#D5CCBE] rounded-lg text-[#8B7E6A] hover:bg-[#EDE7DF] transition-colors text-lg font-bold"
                    >
                      +
                    </button>
                    {showFisMenu && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#D5CCBE] rounded-lg shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => { setShowFisNo(true); setShowFisMenu(false); }}
                          className="w-full text-left px-4 py-3 text-[13px] hover:bg-[#F5F0EB] text-[#6A5E5B] font-bold tracking-wide transition-colors"
                        >
                          FİŞ/FATURA NUMARASI EKLE
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CONDITIONAL: Fiş/Fatura Numarası */}
            {showFisNo && (
              <div className="flex items-center gap-4 px-6 py-4 animate-fade-in border-t border-[#E0D6CC] bg-[#FAF7F3]/50">
                <Hash className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Fiş/Fatura Numarası</span>
                <div className="flex items-center gap-2 flex-1">
                  <input type="text" tabIndex={3} value={formData.fisNo} onChange={e => updateForm('fisNo', e.target.value)}
                    placeholder="Takip edilmiyor"
                    className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]" />
                  <button 
                    onClick={() => { setShowFisNo(false); updateForm('fisNo', ''); }}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-[#D5CCBE] rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TOPLAM TUTAR */}
            <div className="flex items-center gap-4 px-6 py-4">
              <DollarSign className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase leading-tight">
                Toplam Tutar<br /><span className="text-[11px] font-medium text-[#A89B8C] normal-case">(Vergiler Dahil)</span>
              </span>
              <div className="flex items-center gap-2 flex-1">
                <input type="text" tabIndex={4} inputMode="decimal" value={formData.toplamTutar}
                  onChange={e => { const v = e.target.value.replace(/[^0-9.,]/g, ''); updateForm('toplamTutar', v) }}
                  onBlur={e => updateForm('toplamTutar', formatCurrency(e.target.value))}
                  placeholder="0,00"
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]" />
                <span className="text-[#8B7E6A] font-bold text-sm">{currentCurrency.icon}</span>
              </div>
            </div>

            {/* DÖVİZ DEĞİŞTİR */}
            <div className="flex items-center gap-4 px-6 py-3">
              <div className="w-5 h-5 flex-shrink-0" />
              <div className="w-44 flex-shrink-0" />
              <div className="relative">
                <button onClick={() => setShowCurrency(!showCurrency)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D5CCBE] rounded-lg text-xs font-bold text-[#6A5E5B] hover:bg-[#EDE7DF] transition-colors uppercase tracking-wide">
                  <DollarSign className="w-3.5 h-3.5" /> Döviz Değiştir
                </button>
                {showCurrency && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#D5CCBE] rounded-lg shadow-lg z-10">
                    {currencies.map(c => (
                      <button key={c.code} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0EB] text-slate-700 whitespace-nowrap"
                        onClick={() => { updateForm('doviz', c.code); setShowCurrency(false) }}>
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TOPLAM KDV */}
            <div className="flex items-center gap-4 px-6 py-4">
              <Percent className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Toplam KDV</span>
              <div className="flex items-center gap-2 flex-1">
                <input type="text" tabIndex={5} inputMode="decimal" value={formData.toplamKdv}
                  onChange={e => { const v = e.target.value.replace(/[^0-9.,]/g, ''); updateForm('toplamKdv', v) }}
                  onBlur={e => updateForm('toplamKdv', formatCurrency(e.target.value))}
                  placeholder="0,00"
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]" />
                <select tabIndex={6} value={formData.kdvOrani} onChange={e => updateForm('kdvOrani', Number(e.target.value))}
                  className="px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-semibold text-[#6A5E5B] focus:outline-none cursor-pointer">
                  <option value={20}>%20</option><option value={10}>%10</option><option value={1}>%1</option><option value={0}>%0</option>
                </select>
              </div>
            </div>

            {/* ÖDEME DURUMU */}
            <div className="flex items-center gap-4 px-6 py-4">
              <CreditCard className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Tahsilat Durumu</span>
              <div className="flex items-center gap-6 flex-1 flex-wrap">
                {(['tahsil_edilecek', 'tahsil_edildi', 'calisan'] as const).map(val => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input type="radio" name="odeme" tabIndex={7} value={val} checked={formData.tahsilatDurumu === val}
                      onChange={e => updateForm('tahsilatDurumu', e.target.value)}
                      className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                    {val === 'tahsil_edilecek' ? 'Tahsil Edilecek' : val === 'tahsil_edildi' ? 'Tahsil Edildi' : 'Çalışan Cebinden Ödedi'}
                  </label>
                ))}
              </div>
            </div>

            {/* CONDITIONAL: Tahsil Edilecek -> Tarih */}
            {formData.tahsilatDurumu === 'tahsil_edilecek' && (
              <div className="flex items-center gap-4 px-6 py-4 animate-fade-in bg-[#FAF7F3]">
                <Clock className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Tahsil Edileceği Tarih</span>
                <input type="date" tabIndex={8} value={formData.tahsilTarihi} 
                  onChange={e => updateForm('tahsilTarihi', e.target.value)}
                  onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A] cursor-pointer" />
              </div>
            )}

            {/* CONDITIONAL: Tahsil Edildi -> Banka */}
            {formData.tahsilatDurumu === 'tahsil_edildi' && (
              <div className="flex items-center gap-4 px-6 py-4 animate-fade-in bg-[#FAF7F3]">
                <Building2 className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Hangi Hesaba?</span>
                <select tabIndex={8} value={formData.bankaHesabi} onChange={e => updateForm('bankaHesabi', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 cursor-pointer">
                  <option value="">Hesap Seçin</option>
                  {MOCK_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            {/* CONDITIONAL: Çalışan -> Employee */}
            {formData.tahsilatDurumu === 'calisan' && (
              <div className="flex items-center gap-4 px-6 py-4 animate-fade-in bg-[#FAF7F3]">
                <UserCheck className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Hangi Çalışan?</span>
                <select tabIndex={8} value={formData.tahsilEdenCalisan} onChange={e => updateForm('tahsilEdenCalisan', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 cursor-pointer">
                  <option value="">Çalışan Seçin</option>
                  {MOCK_EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}

            {/* FİŞ/FATURA GÖRSELİ */}
            <div className="flex items-start gap-4 px-6 py-4">
              <Camera className="w-5 h-5 text-[#8B7E6A] flex-shrink-0 mt-1" />
              <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase mt-1">Fiş/Fatura Görseli</span>
              <div className="flex-1">
                {!file ? (
                  <div onDragOver={e => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-[#8B7E6A] bg-[#EDE7DF]' : 'border-[#D5CCBE] bg-white hover:bg-[#FAF7F3]'}`}>
                    <Upload className="w-6 h-6 text-[#A89B8C]" />
                    <span className="text-xs text-[#A89B8C] font-medium">Sürükle-bırak veya tıklayın</span>
                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-white border border-[#D5CCBE] rounded-xl">
                    {filePreview && <img src={filePreview} alt="preview" className="w-14 h-14 object-cover rounded-lg" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-[#A89B8C]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => { setFile(null); setFilePreview('') }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-72 bg-[#EDE7DF] border-l border-[#E0D6CC] p-5 space-y-6">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-4 h-4 text-[#8B7E6A]" />
                <span className="text-sm font-bold text-[#6A5E5B] uppercase tracking-wide">Gelir Kategorisi</span>
              </div>
              <div 
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowEtiketDropdown(false); }}
                className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-[#6A5E5B] font-semibold cursor-pointer flex justify-between items-center"
              >
                {formData.gelirKategorisi === 'Kategorisiz' ? (
                   <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-slate-200/50 text-slate-500 border-slate-300">
                     KATEGORİSİZ
                   </span>
                ) : (
                  <CategoryTag 
                    text={formData.gelirKategorisi} 
                    color={GELIR_KATEGORILERI.find(c => c.text === formData.gelirKategorisi)?.color || 'gray'} 
                  />
                )}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5CCBE] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ara" 
                        value={categoryQuery}
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 text-sm border-2 border-emerald-400 rounded focus:outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                    <div 
                      onClick={() => { updateForm('gelirKategorisi', 'Kategorisiz'); setShowCategoryDropdown(false); }}
                      className="px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded"
                    >
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-slate-200/50 text-slate-500 border-slate-300">
                        KATEGORİSİZ
                      </span>
                    </div>
                    {GELIR_KATEGORILERI.filter(c => c.text.toLowerCase().includes(categoryQuery.toLowerCase())).map(c => (
                      <div 
                        key={c.text} 
                        onClick={() => { updateForm('gelirKategorisi', c.text); setShowCategoryDropdown(false); }}
                        className="px-2 py-1 hover:bg-slate-50 cursor-pointer rounded"
                      >
                        <CategoryTag text={c.text} color={c.color} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed">gelirlerin kategorilere göre dağılımını gelirler raporunda takip edebilirsiniz.</p>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-[#8B7E6A]" />
                <span className="text-sm font-bold text-[#6A5E5B] uppercase tracking-wide">Etiketler</span>
              </div>
              <div 
                onClick={() => { setShowEtiketDropdown(!showEtiketDropdown); setShowCategoryDropdown(false); }}
                className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-[#6A5E5B] font-semibold cursor-pointer flex justify-between items-center"
              >
                {formData.etiket === 'Etiketsiz' ? (
                   <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-white text-slate-800 border-slate-300">
                     ETİKETSİZ
                   </span>
                ) : (
                  <CategoryTag 
                    text={formData.etiket} 
                    color={ETIKETLER.find(e => e.text === formData.etiket)?.color || 'gray'} 
                  />
                )}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {showEtiketDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5CCBE] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Etiketler..." 
                        value={etiketQuery}
                        onChange={(e) => setEtiketQuery(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-400"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                    {ETIKETLER.filter(e => e.text.toLowerCase().includes(etiketQuery.toLowerCase())).map(e => (
                      <div 
                        key={e.text} 
                        onClick={() => { updateForm('etiket', e.text); setShowEtiketDropdown(false); }}
                        className="px-2 py-1 hover:bg-slate-50 cursor-pointer rounded"
                      >
                        <CategoryTag text={e.text} color={e.color} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed">Etiketler Gelir Gider Raporunda etiket bazında karlılığını görmenizi sağlar.</p>
            </div>

            <div className="bg-[#E5DDD3] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-[#8B7E6A]" />
                <span className="text-xs font-bold text-[#6A5E5B] uppercase tracking-wide">Tahsilatı Yapanı Takip Et</span>
              </div>
              <p className="text-[11px] text-[#8B7E6A] leading-relaxed">
                Çalışanlar bölümünden çalışanlarınızı ekleyerek ceplerinden yaptıkları tahsilatları ve geri ödeme tarihlerini takip edebilirsiniz.
              </p>
              <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed italic">
                Kendi inisiyatifi ile tahsilat yapan çalışanın gelirler raporunda takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
