'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  FileSignature, Users, FileText, CalendarDays, DollarSign,
  CreditCard, Clock, Camera, Tag, FolderOpen, UserCheck, Search,
  ChevronDown, Upload, X, Trash2, Building2, Hash, Box, Plus
} from 'lucide-react'

interface DetayliFisModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<any>
  initialData?: any
}

import { GIDER_KATEGORILERI, ETIKETLER } from '@/lib/constants'
import CategoryTag from '@/components/CategoryTag'
import { formatCurrency } from '@/lib/utils'

const MOCK_SUPPLIERS = ['Migros', 'BİM', 'A101', 'Metro', 'Trendyol Express', 'Kargo Şirketi', 'Ofis Malzemeleri AŞ']
const MOCK_BANKS = ['Ziraat Bankası', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi', 'Halkbank']
const MOCK_EMPLOYEES = ['Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir']

const today = new Date().toISOString().split('T')[0]

type LineItem = {
  id: string
  name: string
  quantity: number
  unit: string
  price: number
  taxRate: number
}

export default function DetayliFisModal({ isOpen, onClose, onSave, initialData }: DetayliFisModalProps) {
  const kayitRef = useRef<HTMLInputElement>(null)

  const defaultForm = {
    kayitIsmi: '', tedarikci: '', tarih: today,
    doviz: 'TRY',
    odemeDurumu: 'odenecek' as 'odenecek' | 'odendi' | 'calisan',
    odenecegiTarih: today, bankaHesabi: '', odeyenCalisan: '',
    giderKategorisi: 'Kategorisiz', etiket: 'Etiketsiz', fisNo: '',
    stokTakipli: true
  }

  const [formData, setFormData] = useState(defaultForm)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: '1', name: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20 }])

  const [supplierQuery, setSupplierQuery] = useState('')
  const [showSuppliers, setShowSuppliers] = useState(false)
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
        setSupplierQuery(initialData.tedarikci || '')
        setShowFisNo(!!initialData.fisNo)
        if (initialData.lineItems) setLineItems(initialData.lineItems)
      } else {
        setFormData(defaultForm)
        setSupplierQuery('')
        setFile(null)
        setFilePreview('')
        setShowFisNo(false)
        setLineItems([{ id: Date.now().toString(), name: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20 }])
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

  const updateForm = useCallback((key: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const filteredSuppliers = MOCK_SUPPLIERS.filter(s =>
    s.toLowerCase().includes(supplierQuery.toLowerCase()) && supplierQuery.length > 0
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

  const addLineItem = () => {
    setLineItems(prev => [...prev, { id: Date.now().toString(), name: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20 }])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  // Calculate totals
  const subTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const taxTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price * (item.taxRate / 100)), 0)
  const grandTotal = subTotal + taxTotal

  const handleSubmit = () => {
    const payload = { 
      ...formData, 
      dosya: file?.name || null,
      lineItems,
      toplamTutar: grandTotal.toFixed(2),
      toplamKdv: taxTotal.toFixed(2)
    }
    console.log('Detaylı Form JSON:', JSON.stringify(payload, null, 2))
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
      <div className="bg-[#F5F0EB] rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden ring-1 ring-black/5 animate-scale-in" onClick={e => e.stopPropagation()}>

        {/* TOP BAR: Kayıt İsmi + Buttons */}
        <div className="flex items-center gap-4 px-6 py-4 bg-[#F5F0EB] border-b border-[#E0D6CC] shrink-0">
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
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* LEFT COLUMN (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-white">
            <div className="divide-y divide-[#E0D6CC]">
              {/* TEDARİKÇİ */}
              <div className="flex items-center gap-4 px-6 py-4">
                <Users className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Tedarikçi</span>
                <div className="flex-1 relative">
                  <input type="text" tabIndex={2} value={supplierQuery}
                    onChange={e => { setSupplierQuery(e.target.value); updateForm('tedarikci', e.target.value); setShowSuppliers(true) }}
                    onFocus={() => setShowSuppliers(true)} onBlur={() => setTimeout(() => setShowSuppliers(false), 200)}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]" />
                  <Search className="w-4 h-4 text-[#A89B8C] absolute right-3 top-1/2 -translate-y-1/2" />
                  {showSuppliers && filteredSuppliers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5CCBE] rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredSuppliers.map(s => (
                        <button key={s} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0EB] text-slate-700"
                          onMouseDown={() => { setSupplierQuery(s); updateForm('tedarikci', s); setShowSuppliers(false) }}>{s}</button>
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
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Tedarikçi Bilgileri</span>
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

              {/* FİŞ/FATURA GÖRSELİ */}
              <div className="flex items-start gap-4 px-6 py-4">
                <Camera className="w-5 h-5 text-[#8B7E6A] flex-shrink-0 mt-1" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase mt-1">Fiş/Fatura Görseli</span>
                <div className="flex-1">
                  {!file ? (
                    <div onDragOver={e => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`flex items-center justify-center gap-2 p-3 border border-[#D5CCBE] rounded-xl cursor-pointer transition-colors w-fit pr-6 ${isDragging ? 'border-[#8B7E6A] bg-[#EDE7DF]' : 'bg-white hover:bg-[#FAF7F3]'}`}>
                      <Upload className="w-5 h-5 text-[#A89B8C]" />
                      <span className="text-sm font-bold text-[#6A5E5B]">DOSYA YÜKLE</span>
                      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white border border-[#D5CCBE] rounded-xl w-fit">
                      {filePreview && <img src={filePreview} alt="preview" className="w-10 h-10 object-cover rounded-lg" />}
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-[#A89B8C]">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => { setFile(null); setFilePreview('') }} className="px-3 py-1.5 text-xs font-bold text-[#6A5E5B] bg-[#EDE7DF] hover:bg-[#E0D6CC] rounded-lg transition-colors">DEĞİŞTİR</button>
                      <button onClick={() => { setFile(null); setFilePreview('') }} className="px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">SİL</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ÖDEME DURUMU */}
              <div className="flex items-center gap-4 px-6 py-4">
                <CreditCard className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Ödeme Durumu</span>
                <div className="flex items-center flex-1 rounded-lg border border-[#D5CCBE] overflow-hidden">
                  {(['odenecek', 'odendi', 'calisan'] as const).map((val, idx) => (
                    <label key={val} className={`flex-1 flex items-center gap-2 cursor-pointer text-sm text-slate-700 px-4 py-2.5 hover:bg-slate-50 transition-colors ${idx !== 0 ? 'border-l border-[#D5CCBE]' : ''}`}>
                      <input type="radio" name="odeme" tabIndex={7} value={val} checked={formData.odemeDurumu === val}
                        onChange={e => updateForm('odemeDurumu', e.target.value)}
                        className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                      {val === 'odenecek' ? 'Ödenecek' : val === 'odendi' ? 'Ödendi' : 'Çalışan Cebinden Ödedi'}
                    </label>
                  ))}
                </div>
              </div>

              {/* CONDITIONAL: Ödenecek -> Tarih */}
              {formData.odemeDurumu === 'odenecek' && (
                <div className="flex items-center gap-4 px-6 py-4 animate-fade-in bg-[#FAF7F3]">
                  <Clock className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Ödeneceği Tarih</span>
                  <input type="date" tabIndex={8} value={formData.odenecegiTarih} 
                    onChange={e => updateForm('odenecegiTarih', e.target.value)}
                    onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                    className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A] cursor-pointer" />
                </div>
              )}

              {/* CONDITIONAL: Ödendi -> Banka */}
              {formData.odemeDurumu === 'odendi' && (
                <div className="flex items-center gap-4 px-6 py-4 animate-fade-in bg-[#FAF7F3]">
                  <Building2 className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Hangi Hesaptan?</span>
                  <select tabIndex={8} value={formData.bankaHesabi} onChange={e => updateForm('bankaHesabi', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 cursor-pointer">
                    <option value="">Hesap Seçin</option>
                    {MOCK_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {/* CONDITIONAL: Çalışan -> Employee */}
              {formData.odemeDurumu === 'calisan' && (
                <div className="flex items-center gap-4 px-6 py-4 animate-fade-in bg-[#FAF7F3]">
                  <UserCheck className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Hangi Çalışan?</span>
                  <select tabIndex={8} value={formData.odeyenCalisan} onChange={e => updateForm('odeyenCalisan', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 cursor-pointer">
                    <option value="">Çalışan Seçin</option>
                    {MOCK_EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}

              {/* STOK TAKİBİ */}
              <div className="flex items-center gap-4 px-6 py-4">
                <Box className="w-5 h-5 text-[#8B7E6A] flex-shrink-0 mt-1 self-start" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase mt-1 self-start">Stok Takibi</span>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${formData.stokTakipli ? 'border-[#8B7E6A] bg-[#FAF7F3]' : 'border-[#D5CCBE] hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="radio" checked={formData.stokTakipli === true} onChange={() => updateForm('stokTakipli', true)}
                        className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                      <span className="text-sm font-bold text-[#6A5E5B] tracking-wide">STOK GİRİŞİ YAPILSIN</span>
                    </div>
                    <span className="text-[11px] text-[#A89B8C] pl-6 italic">Stok girişi faturayla yapılır. Daha sonra faturadan irsaliye oluşturulamaz ve faturayla irsaliye eşleştirilemez.</span>
                  </label>
                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${formData.stokTakipli === false ? 'border-[#8B7E6A] bg-[#FAF7F3]' : 'border-[#D5CCBE] hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="radio" checked={formData.stokTakipli === false} onChange={() => updateForm('stokTakipli', false)}
                        className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                      <span className="text-sm font-bold text-[#6A5E5B] tracking-wide">STOK GİRİŞİ YAPILMASIN</span>
                    </div>
                    <span className="text-[11px] text-[#A89B8C] pl-6 italic">Stok takibi gerektirmeyen hizmet/ürünler için kullanın. Daha sonra faturayla ilişkili irsaliye oluşturulabilir.</span>
                  </label>
                </div>
              </div>

              {/* LINE ITEMS TABLE */}
              <div className="bg-[#F8F5F2] mt-4">
                <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-[#E0D6CC] text-xs font-bold text-[#8B7E6A] uppercase tracking-wide">
                  <div className="col-span-5">HİZMET / ÜRÜN</div>
                  <div className="col-span-2">MİKTAR</div>
                  <div className="col-span-1">BİRİM</div>
                  <div className="col-span-2">BR. FİYAT</div>
                  <div className="col-span-1">VERGİ</div>
                  <div className="col-span-1 text-right">TOPLAM</div>
                </div>
                
                <div className="p-4 space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5 relative">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={e => updateLineItem(item.id, 'name', e.target.value)}
                          placeholder="Ürün/Hizmet Ara"
                          className="w-full pl-3 pr-10 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30"
                        />
                        <Search className="w-4 h-4 text-[#A89B8C] absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30"
                        />
                      </div>
                      <div className="col-span-1">
                        <select 
                          value={item.unit}
                          onChange={e => updateLineItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 cursor-pointer"
                        >
                          <option value="Adet">Adet</option>
                          <option value="Kg">Kg</option>
                          <option value="Lt">Lt</option>
                          <option value="M">M</option>
                          <option value="Paket">Paket</option>
                        </select>
                      </div>
                      <div className="col-span-2 relative">
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={item.price} 
                          onChange={e => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full pl-3 pr-6 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8B7E6A] font-bold">{currentCurrency.icon}</span>
                      </div>
                      <div className="col-span-1">
                        <select 
                          value={item.taxRate}
                          onChange={e => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value))}
                          className="w-full px-1 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-[11px] font-bold text-[#6A5E5B] focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 cursor-pointer"
                        >
                          <option value={20}>KDV %20</option>
                          <option value={10}>KDV %10</option>
                          <option value={1}>KDV %1</option>
                          <option value={0}>KDV %0</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <div className="text-sm font-semibold text-[#6A5E5B] min-w-[60px] text-right">
                          {formatCurrency((item.quantity * item.price) * (1 + item.taxRate / 100))}
                          <span className="text-[10px] ml-0.5">{currentCurrency.icon}</span>
                        </div>
                        {lineItems.length > 1 && (
                          <button 
                            onClick={() => removeLineItem(item.id)}
                            className="p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 rounded bg-red-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={addLineItem}
                    className="flex items-center gap-1.5 px-4 py-2 mt-2 bg-white border border-[#D5CCBE] rounded-lg text-xs font-bold text-[#6A5E5B] hover:bg-[#EDE7DF] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> YENİ SATIR EKLE
                  </button>
                </div>

                {/* TOTALS FOOTER */}
                <div className="bg-[#FAF7F3] border-t border-[#E0D6CC] p-6 flex flex-col items-end">
                  <div className="w-72 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-[#8B7E6A] tracking-wide">ARA TOPLAM</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(subTotal)}{currentCurrency.icon}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#E0D6CC]">
                      <span className="font-bold text-[#8B7E6A] tracking-wide">TOPLAM KDV</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(taxTotal)}{currentCurrency.icon}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg pt-1">
                      <span className="font-bold text-[#6A5E5B] tracking-wide">GENEL TOPLAM</span>
                      <span className="font-bold text-slate-800">{formatCurrency(grandTotal)}{currentCurrency.icon}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (Fixed Width) */}
          <div className="w-full lg:w-72 bg-[#EDE7DF] border-l border-[#E0D6CC] p-5 space-y-6 flex-shrink-0 overflow-y-auto custom-scrollbar">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-4 h-4 text-[#8B7E6A]" />
                <span className="text-sm font-bold text-[#6A5E5B] uppercase tracking-wide">Gider Kategorisi</span>
              </div>
              <div 
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowEtiketDropdown(false); }}
                className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-[#6A5E5B] font-semibold cursor-pointer flex justify-between items-center shadow-sm"
              >
                {formData.giderKategorisi === 'Kategorisiz' ? (
                   <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-slate-200/50 text-slate-500 border-slate-300">
                     KATEGORİSİZ
                   </span>
                ) : (
                  <CategoryTag 
                    text={formData.giderKategorisi} 
                    color={GIDER_KATEGORILERI.find(c => c.text === formData.giderKategorisi)?.color || 'gray'} 
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
                      onClick={() => { updateForm('giderKategorisi', 'Kategorisiz'); setShowCategoryDropdown(false); }}
                      className="px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded"
                    >
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-slate-200/50 text-slate-500 border-slate-300">
                        KATEGORİSİZ
                      </span>
                    </div>
                    {GIDER_KATEGORILERI.filter(c => c.text.toLowerCase().includes(categoryQuery.toLowerCase())).map(c => (
                      <div 
                        key={c.text} 
                        onClick={() => { updateForm('giderKategorisi', c.text); setShowCategoryDropdown(false); }}
                        className="px-2 py-1 hover:bg-slate-50 cursor-pointer rounded"
                      >
                        <CategoryTag text={c.text} color={c.color} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed">Giderlerin kategorilere göre dağılımını giderler raporunda takip edebilirsiniz.</p>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-[#8B7E6A]" />
                <span className="text-sm font-bold text-[#6A5E5B] uppercase tracking-wide">Etiketler</span>
              </div>
              <div 
                onClick={() => { setShowEtiketDropdown(!showEtiketDropdown); setShowCategoryDropdown(false); }}
                className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-[#6A5E5B] font-semibold cursor-pointer flex justify-between items-center shadow-sm"
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

            <div className="bg-[#E5DDD3] rounded-xl p-4 shadow-sm border border-[#D5CCBE]">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-[#8B7E6A]" />
                <span className="text-xs font-bold text-[#6A5E5B] uppercase tracking-wide">Harcamayı Yapanı Takip Et</span>
              </div>
              <p className="text-[11px] text-[#8B7E6A] leading-relaxed">
                Çalışanlar bölümünden çalışanlarınızı ekleyerek ceplerinden yaptıkları harcamaları ve geri ödeme tarihlerini takip edebilirsiniz.
              </p>
              <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed italic">
                Kendi inisiyatifi ile harcama yapan çalışanın giderler raporunda takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
