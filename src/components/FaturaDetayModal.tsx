'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText, CalendarDays, User, Tag, ChevronDown, Share2, Printer,
  Bell, Clock, Download, Mail, Truck, Copy, RefreshCw, CornerUpLeft,
  ArrowRightLeft, Send, Ban, Archive, Trash2, X, Check
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  id: string
  name: string
  quantity: number
  unit: string
  price: number
  taxRate: number
  discount?: number
}

interface FaturaDetayModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  record: any
}

export default function FaturaDetayModal({ isOpen, onClose, onEdit, onDelete, record }: FaturaDetayModalProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showTahsilatModal, setShowTahsilatModal] = useState(false)
  const [tahsilatData, setTahsilatData] = useState({
    tip: 'nakit',
    tarih: new Date().toISOString().split('T')[0],
    hesap: 'Kasa Hesabı',
    meblag: '',
    aciklama: ''
  })

  // Handle escape to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (record && !showTahsilatModal) {
      const items = record.lineItems || []
      const sTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0) || Number(record.toplamTutar) || 0
      const tTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price * (item.taxRate / 100)), 0) || Number(record.toplamKdv) || 0
      const gTotal = sTotal + tTotal
      
      setTahsilatData(prev => ({
        ...prev,
        meblag: gTotal.toString()
      }))
    }
  }, [record, showTahsilatModal])

  if (!isOpen || !record) return null

  const lineItems: LineItem[] = record.lineItems || []
  const discount = Number(record.indirim_tutari || record.indirimTutari) || 0
  const subTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0) || (Number(record.toplamTutar) + discount - Number(record.toplamKdv)) || 0
  const grossTotal = subTotal - discount
  // Use stored tax total if available, otherwise calculate from gross total
  const taxTotal = (record.toplamKdv !== undefined && record.toplamKdv !== null) 
    ? Number(record.toplamKdv) 
    : lineItems.reduce((sum, item) => sum + (item.quantity * item.price * (item.taxRate / 100)), 0) || (grossTotal * 0.10)
  const grandTotal = grossTotal + taxTotal

  // Format date correctly
  const formattedDate = new Date(record.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const currencySymbol = record.doviz === 'USD' ? '$' : record.doviz === 'EUR' ? '€' : '₺'

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-[#f0f2f5] rounded shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        
        {/* LEFT MAIN AREA */}
        <div className="flex-1 bg-white flex flex-col overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-50 rounded flex items-center justify-center border border-sky-100">
                <FileText className="w-6 h-6 text-sky-500" />
              </div>
              <h1 className="text-2xl text-gray-800 font-medium">{record.kayitIsmi || 'İsimsiz Kayıt'}</h1>
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={onEdit}
                className="px-4 py-2 border border-gray-200 text-gray-600 font-medium text-sm rounded-l hover:bg-gray-50 transition-colors"
              >
                DÜZENLE
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-2 py-2 border border-l-0 border-gray-200 text-gray-600 rounded-r hover:bg-gray-50 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 shadow-lg rounded z-50 py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3">
                      <Copy className="w-4 h-4 text-gray-400" /> KOPYASINI OLUŞTUR
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-gray-400" /> OTOMATİK TEKRARLA
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100 mt-1 pt-2">
                      <CornerUpLeft className="w-4 h-4 text-gray-400" /> İADE OLUŞTUR
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3">
                      <ArrowRightLeft className="w-4 h-4 text-gray-400" /> MAHSUPLAŞTIR
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3">
                      <Send className="w-4 h-4 text-gray-400" /> VİRMAN YAP
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100 mt-1 pt-2">
                      <Ban className="w-4 h-4 text-gray-400" /> İPTAL ET
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100 mt-1 pt-2">
                      <Archive className="w-4 h-4 text-gray-400" /> FATURAYI ARŞİVLE
                    </button>
                    <button 
                      onClick={() => { setShowDropdown(false); onDelete(); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" /> FATURAYI SİL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-6 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <span className="text-[11px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                {record.gelirKategorisi === 'Kategorisiz' ? 'KATEGORİSİZ' : record.gelirKategorisi}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ml-auto">
              <span className="text-[11px] font-bold text-gray-400 uppercase border border-dashed border-gray-300 px-2 py-0.5 rounded-full">
                {record.etiket === 'Etiketsiz' ? 'ETİKETSİZ' : record.etiket}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* MÜŞTERİ BİLGİLERİ */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">MÜŞTERİ BİLGİLERİ</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0">Alıcı:</span>
                <span className="text-sm text-gray-800 font-medium">{record.musteri || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0">Fatura Adresi:</span>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {(() => {
                    const aciklama = record.aciklama || ''
                    const adresMatch = aciklama.match(/Teslimat Adresi:\s*(.+?)(\n|$)/)
                    return adresMatch ? adresMatch[1].trim() : (record.musteri || '-')
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* SİPARİŞ BİLGİLERİ */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">SİPARİŞ BİLGİLERİ</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-24 flex-shrink-0">Sipariş Tarihi:</span>
                <span className="text-sm text-gray-800">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-24 flex-shrink-0">Paket No:</span>
                <span className="text-sm text-gray-800 font-mono">{record.islemNo || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-24 flex-shrink-0">Sipariş No:</span>
                <span className="text-sm text-gray-800 font-mono">{record.fisNo || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-24 flex-shrink-0">Teslim Edildi:</span>
                <span className="text-sm text-gray-800">{record.teslimTarihi || 'Bekliyor'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-24 flex-shrink-0">Vade Gün:</span>
                <span className="text-sm text-gray-800">
                  {record.vadeTarihi 
                    ? `${Math.ceil((new Date(record.vadeTarihi).getTime() - new Date().getTime()) / (1000*60*60*24))} gün`
                    : '28 gün (teslimden sonra)'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex-1 p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200">
                  <th className="text-left pb-3 font-semibold">HİZMET/ÜRÜN</th>
                  <th className="text-left pb-3 font-semibold">MİKTAR</th>
                  <th className="text-right pb-3 font-semibold">BR. FİYAT</th>
                  <th className="text-right pb-3 font-semibold text-rose-500">İSKONTO</th>
                  <th className="text-right pb-3 font-semibold">VERGİ</th>
                  <th className="text-right pb-3 font-semibold">TOPLAM</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-gray-100">
                    <td className="py-4 text-gray-800">{item.name || '-'}</td>
                    <td className="py-4 text-gray-500">{item.quantity} <span className="text-xs">{item.unit}</span></td>
                    <td className="py-4 text-gray-800 text-right">{formatCurrency(item.price)}{currencySymbol}</td>
                    <td className="py-4 text-rose-500 text-right font-bold">-{formatCurrency(item.discount || 0)}{currencySymbol}</td>
                    <td className="py-4 text-gray-500 text-right font-medium text-xs">KDV %{item.taxRate}</td>
                    <td className="py-4 text-gray-800 text-right font-bold">
                        {formatCurrency(((item.price * item.quantity) - (item.discount || 0)) * (1 + item.taxRate / 100))}{currencySymbol}
                    </td>
                  </tr>
                )) : (
                  <tr className="border-b border-gray-100">
                    <td className="py-4 text-gray-800">Genel Hizmet/Ürün</td>
                    <td className="py-4 text-gray-500">1 <span className="text-xs">Adet</span></td>
                    <td className="py-4 text-gray-800 text-right">{formatCurrency(subTotal)}{currencySymbol}</td>
                    <td className="py-4 text-gray-500 text-right font-medium text-xs">KDV %{record.kdvOrani || 0}</td>
                    <td className="py-4 text-gray-800 text-right font-medium">{formatCurrency(grandTotal)}{currencySymbol}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr className="border-t-2 border-gray-100">
                    <td colSpan={4} className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOP. İND.</td>
                    <td className="py-3 text-right text-gray-600 font-bold">{formatCurrency(discount)}{currencySymbol}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-6 pr-0">
              <div className="w-72">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">ARA TOPLAM</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(subTotal)}<span className="text-xs">{currencySymbol}</span></span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">SATIR İNDİRİMİ</span>
                      <span className="text-gray-800 font-medium">{formatCurrency(discount)}<span className="text-xs">{currencySymbol}</span></span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">TOPLAM KDV</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(taxTotal)}<span className="text-xs">{currencySymbol}</span></span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">GENEL TOPLAM</span>
                  <span className="text-sky-500 font-bold text-lg">{formatCurrency(grandTotal)}<span className="text-sm font-medium">{currencySymbol}</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">KALAN</span>
              <span className="text-gray-800 font-medium text-lg">{formatCurrency(grandTotal)}<span className="text-sm">{currencySymbol}</span></span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-[#f8f9fa] border-l border-gray-200 p-4 space-y-4 flex flex-col overflow-y-auto">
          
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#5c5553] hover:bg-[#4a4442] text-white py-2.5 rounded text-xs font-bold tracking-wide transition-colors">
              <Share2 className="w-4 h-4" /> PAYLAŞ
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#5c5553] hover:bg-[#4a4442] text-white py-2.5 rounded text-xs font-bold tracking-wide transition-colors">
              <Printer className="w-4 h-4" /> YAZDIR
            </button>
          </div>

          <div className="bg-[#edeceb] rounded p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">KALAN</span>
              <span className="text-xl font-bold text-gray-800">{formatCurrency(grandTotal)}<span className="text-sm">{currencySymbol}</span></span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2.5 bg-[#e3e1df] rounded text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span>7 gün sonra tahsil edilecek</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>

              <div 
                className="flex items-center justify-between p-2.5 border border-[#d5d3d1] rounded text-sm text-gray-700 hover:bg-[#e3e1df] cursor-pointer transition-colors"
                onClick={() => setShowReminderModal(true)}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Müşteri hatırlatma ekle</span>
                </div>
                <div className="w-3 h-3 border border-gray-400 rounded-sm"></div>
              </div>

              <div className="flex items-center justify-between p-2.5 border border-[#d5d3d1] rounded text-sm text-gray-700 hover:bg-[#e3e1df] cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span>Tahsilat talep et</span>
                </div>
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button 
              onClick={() => setShowTahsilatModal(true)}
              className="w-full bg-[#1db5cf] hover:bg-[#18a2b9] text-white font-bold text-xs tracking-wide py-3 rounded transition-colors uppercase"
            >
              TAHSİLAT EKLE
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#edeceb] rounded">
            <Truck className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-700">Stok çıkışı faturayla yapıldı</span>
          </div>

          <div className="bg-[#edeceb] rounded p-4 flex-1">
            <h3 className="text-sm text-gray-800 mb-3">Fatura Geçmişi</h3>
            <div className="flex gap-2 mb-4">
              <button className="px-3 py-1 bg-white text-gray-600 text-[11px] rounded shadow-sm">Tümü</button>
              <button className="px-3 py-1 text-gray-500 text-[11px] hover:bg-gray-200 rounded transition-colors">Mesajlar</button>
              <button className="px-3 py-1 text-gray-500 text-[11px] hover:bg-gray-200 rounded transition-colors">Notlar</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center mt-1 flex-shrink-0">
                  <FileText className="w-3 h-3 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-800">Fatura oluşturuldu.</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formattedDate} - {new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} / {record.musteri || 'Sistem'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Müşteri Hatırlatma Ayarları Modal (Nested) */}
        {showReminderModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/20" onClick={() => setShowReminderModal(false)}>
            <div className="bg-white w-full max-w-lg rounded shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg text-gray-700 font-medium">Müşteri Hatırlatma Ayarları</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Vade tarihlerinde <strong>{record.musteri}</strong> isimli müşterinize faturalarının ödemesi geldiğini sizin adınıza hatırlatmamızı ister misiniz?
                </p>
                
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <label className="flex-1 flex items-center gap-2 p-3 border-r border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="hatirlatma" className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">Hayır</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 bg-blue-50/30">
                    <input type="radio" name="hatirlatma" defaultChecked className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">Evet</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-32">HATIRLATILACAKLAR</span>
                  <input type="text" value="E-posta" readOnly className="flex-1 p-2.5 border border-gray-300 rounded text-sm text-gray-500 bg-gray-50 focus:outline-none" />
                </div>
              </div>

              <div className="px-6 py-5 bg-gray-50 border-t border-b border-gray-200 flex items-start justify-between">
                <div className="flex gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      Müşteri Ekranı açık <div className="w-3.5 h-3.5 bg-gray-300 text-white rounded-full flex items-center justify-center text-[9px] font-bold">?</div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                      Müşteri Ekranı'na kimin giriş yetkisi olduğunu müşterinin detay sayfasından düzenleyebilirsiniz.
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-500 shadow-sm hover:bg-gray-50">
                  <Share2 className="w-3 h-3" /> ÖRNEK E-POSTA
                </button>
              </div>

              <div className="p-4 bg-white flex justify-end gap-2 border-t border-gray-100">
                <button onClick={() => setShowReminderModal(false)} className="px-5 py-2 text-sm font-bold text-gray-500 border border-gray-300 rounded hover:bg-gray-50">VAZGEÇ</button>
                <button onClick={() => setShowReminderModal(false)} className="px-6 py-2 text-sm font-bold text-white bg-[#5c5553] hover:bg-[#4a4442] rounded">KAYDET</button>
              </div>
            </div>
          </div>
        )}

        {/* Tahsilat Ekle Modal (Nested) */}
        {showTahsilatModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/20" onClick={() => setShowTahsilatModal(false)}>
            <div className="bg-[#f8f9fa] w-full max-w-[360px] rounded shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-6 py-4 bg-[#f8f9fa] border-b border-gray-200">
                <Download className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg text-gray-700 font-medium">Tahsilat Ekle</h2>
              </div>
              
              <div className="p-6 space-y-5 bg-[#f8f9fa]">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tahsilatTip" 
                      checked={tahsilatData.tip === 'nakit'}
                      onChange={() => setTahsilatData({...tahsilatData, tip: 'nakit'})}
                      className="w-4 h-4 text-blue-500" 
                    />
                    <span className="text-xs font-bold text-[#6A5E5B] uppercase tracking-wide">NAKİT TAHSİLAT</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tahsilatTip" 
                      checked={tahsilatData.tip === 'cek'}
                      onChange={() => setTahsilatData({...tahsilatData, tip: 'cek'})}
                      className="w-4 h-4 text-blue-500" 
                    />
                    <span className="text-xs font-bold text-[#6A5E5B] uppercase tracking-wide">ÇEK TAHSİLAT</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-20">TARİH *</span>
                  <input 
                    type="date" 
                    value={tahsilatData.tarih}
                    onChange={(e) => setTahsilatData({...tahsilatData, tarih: e.target.value})}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white" 
                  />
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-20">HESAP *</span>
                  <select 
                    value={tahsilatData.hesap}
                    onChange={(e) => setTahsilatData({...tahsilatData, hesap: e.target.value})}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white cursor-pointer"
                  >
                    <option value="Kasa Hesabı">{currencySymbol} - Kasa Hesabı</option>
                    <option value="Banka Hesabı">{currencySymbol} - Banka Hesabı</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-20">MEBLAĞ *</span>
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={tahsilatData.meblag}
                      onChange={(e) => setTahsilatData({...tahsilatData, meblag: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{currencySymbol}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-20">AÇIKLAMA</span>
                  <input 
                    type="text" 
                    value={tahsilatData.aciklama}
                    onChange={(e) => setTahsilatData({...tahsilatData, aciklama: e.target.value})}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white" 
                  />
                </div>
              </div>

              <div className="p-5 bg-[#f8f9fa] flex items-center justify-between gap-3">
                <button onClick={() => setShowTahsilatModal(false)} className="px-5 py-2 text-sm font-bold text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 flex-1">VAZGEÇ</button>
                <button 
                  onClick={() => {
                    // Logic to save Tahsilat would go here
                    setShowTahsilatModal(false);
                    onClose(); // Optional: close detail modal after success
                  }} 
                  className="px-5 py-2 text-sm font-bold text-white bg-[#1db5cf] hover:bg-[#18a2b9] rounded flex-1 uppercase"
                >
                  TAHSİLAT EKLE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
