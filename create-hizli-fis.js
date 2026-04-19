const fs = require('fs');

const content = `'use client'

import React, { useState } from 'react';
import {
  PlusSquare, Filter, Search, ChevronDown, Receipt, FileText, X, CheckCircle2,
  FileSignature, Users, CalendarDays, DollarSign, Percent, CreditCard, Clock,
  Camera, Tag, FolderOpen, UserCheck, CircleDot
} from 'lucide-react';

export default function GiderKaydiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHizliOpen, setIsHizliOpen] = useState(false);
  const [isDetayliOpen, setIsDetayliOpen] = useState(false);
  const [odemeDurumu, setOdemeDurumu] = useState('odenecek');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <PlusSquare className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gider Kaydi</h1>
          <p className="text-slate-500 text-sm">Giderlerinizi hizlica sisteme isleyin.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex w-full sm:w-auto flex-1 items-center gap-0">
          <button className="flex items-center gap-2 px-5 py-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-l-xl border border-r-0 border-slate-200 font-bold text-[13px] tracking-wide transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4 opacity-70" />
            FILTRELE
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsHizliOpen(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-[#6A5E5B] hover:bg-[#5A4E4B] text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors"
          >
            HIZLI FIS/FATURA
          </button>
          <button
            onClick={() => setIsDetayliOpen(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-[#6A5E5B] hover:bg-[#5A4E4B] text-white rounded-xl font-bold text-[13px] tracking-wide transition-colors"
          >
            DETAYLI FIS/FATURA
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Receipt className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Giderleri Eklemek Cok Kolay</h2>
          <p className="text-slate-500 max-w-sm">
            Yukardaki butonlari kullanarak yeni fis ve faturalarinizi girebilirsiniz.
          </p>
        </div>
      </div>

      {/* ========== HIZLI FIS MODAL ========== */}
      {isHizliOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#F5F0EB] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden ring-1 ring-black/5">

            {/* ---- ROW: KAYIT ISMI + Actions ---- */}
            <div className="flex items-center gap-4 px-6 py-4 bg-[#F5F0EB] border-b border-[#E0D6CC]">
              <div className="flex items-center gap-3 flex-1">
                <FileSignature className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                <span className="text-sm font-bold text-[#6A5E5B] tracking-wide whitespace-nowrap uppercase">Kayit Ismi</span>
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsHizliOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-[#6A5E5B] bg-white border border-[#D5CCBE] hover:bg-[#EDE7DF] rounded-lg transition-colors"
                >
                  VAZGEC
                </button>
                <div className="flex">
                  <button className="px-6 py-2.5 text-sm font-bold text-white bg-[#4A4240] hover:bg-[#3A3230] rounded-l-lg transition-colors">
                    KAYDET
                  </button>
                  <button className="px-2 py-2.5 text-white bg-[#4A4240] hover:bg-[#3A3230] rounded-r-lg border-l border-[#5A5250] transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ---- BODY: Two columns ---- */}
            <div className="flex flex-col lg:flex-row">

              {/* ===== LEFT COLUMN (Form) ===== */}
              <div className="flex-1 divide-y divide-[#E0D6CC]">

                {/* TEDARIKCI */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <Users className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Tedarikci</span>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]"
                    />
                    <Search className="w-4 h-4 text-[#A89B8C] absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* TEDARIKCI BILGILERI (info row) */}
                <div className="flex items-start gap-4 px-6 py-3">
                  <div className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs text-[#A89B8C] italic">Kayitli bir tedarikci secebilir veya yeni bir tedarikci ismi yazabilirsiniz.</span>
                </div>

                {/* TEDARIKCI BILGILERI */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <FileText className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Tedarikci Bilgileri</span>
                  <span className="text-sm text-[#A89B8C]">&mdash;</span>
                </div>

                {/* FIS/FATURA TARIHI */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <CalendarDays className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Fis/Fatura Tarihi</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="date"
                      defaultValue="2026-04-16"
                      className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]"
                    />
                    <button className="w-9 h-9 flex items-center justify-center bg-white border border-[#D5CCBE] rounded-lg text-[#8B7E6A] hover:bg-[#EDE7DF] transition-colors text-lg font-bold">+</button>
                  </div>
                </div>

                {/* TOPLAM TUTAR */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <DollarSign className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase leading-tight">Toplam Tutar<br/><span className="text-[11px] font-medium text-[#A89B8C] normal-case">(Vergiler Dahil)</span></span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue="0,00"
                      className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]"
                    />
                    <span className="text-[#8B7E6A] font-bold text-sm">TL</span>
                  </div>
                </div>

                {/* DOVIZ DEGISTIR */}
                <div className="flex items-center gap-4 px-6 py-3">
                  <div className="w-5 h-5 flex-shrink-0" />
                  <div className="w-44 flex-shrink-0" />
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D5CCBE] rounded-lg text-xs font-bold text-[#6A5E5B] hover:bg-[#EDE7DF] transition-colors uppercase tracking-wide">
                    <DollarSign className="w-3.5 h-3.5" />
                    Doviz Degistir
                  </button>
                </div>

                {/* TOPLAM KDV */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <Percent className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Toplam KDV</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue="0,00"
                      className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]"
                    />
                    <select className="px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-semibold text-[#6A5E5B] focus:outline-none cursor-pointer">
                      <option>%20</option>
                      <option>%10</option>
                      <option>%1</option>
                      <option>%0</option>
                    </select>
                  </div>
                </div>

                {/* ODEME DURUMU */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <CreditCard className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Odeme Durumu</span>
                  <div className="flex items-center gap-6 flex-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input type="radio" name="odeme" value="odenecek" checked={odemeDurumu === 'odenecek'} onChange={(e) => setOdemeDurumu(e.target.value)} className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                      Odenecek
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input type="radio" name="odeme" value="odendi" checked={odemeDurumu === 'odendi'} onChange={(e) => setOdemeDurumu(e.target.value)} className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                      Odendi
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input type="radio" name="odeme" value="calisan" checked={odemeDurumu === 'calisan'} onChange={(e) => setOdemeDurumu(e.target.value)} className="w-4 h-4 text-[#6A5E5B] border-[#D5CCBE] focus:ring-[#8B7E6A]" />
                      Calisan Cebinden Odedi
                    </label>
                  </div>
                </div>

                {/* ODENECEGI TARIH */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <Clock className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Odenecegi Tarih</span>
                  <input
                    type="date"
                    defaultValue="2026-04-16"
                    className="flex-1 px-4 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7E6A]/30 focus:border-[#8B7E6A]"
                  />
                </div>

                {/* FIS/FATURA GORSELI */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <Camera className="w-5 h-5 text-[#8B7E6A] flex-shrink-0" />
                  <span className="text-sm font-bold text-[#6A5E5B] tracking-wide w-44 whitespace-nowrap uppercase">Fis/Fatura Gorseli</span>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm font-bold text-[#6A5E5B] hover:bg-[#EDE7DF] transition-colors uppercase tracking-wide">
                    Dosya Yukle
                  </button>
                </div>

              </div>

              {/* ===== RIGHT SIDEBAR ===== */}
              <div className="w-full lg:w-72 bg-[#EDE7DF] border-l border-[#E0D6CC] p-5 space-y-6">

                {/* GIDER KATEGORISI */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="w-4 h-4 text-[#8B7E6A]" />
                    <span className="text-sm font-bold text-[#6A5E5B] uppercase tracking-wide">Gider Kategorisi</span>
                  </div>
                  <select className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-[#6A5E5B] font-semibold focus:outline-none cursor-pointer uppercase tracking-wide">
                    <option>Kategorisiz</option>
                    <option>Kira</option>
                    <option>Elektrik</option>
                    <option>Su</option>
                    <option>Dogalgaz</option>
                    <option>Internet</option>
                    <option>Telefon</option>
                    <option>Ulasim</option>
                    <option>Yemek</option>
                    <option>Diger</option>
                  </select>
                  <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed">
                    Giderlerin kategorilere gore dagilimini giderler raporunda takip edebilirsiniz.
                  </p>
                </div>

                {/* ETIKETLER */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-[#8B7E6A]" />
                    <span className="text-sm font-bold text-[#6A5E5B] uppercase tracking-wide">Etiketler</span>
                  </div>
                  <select className="w-full px-3 py-2.5 bg-white border border-[#D5CCBE] rounded-lg text-sm text-[#6A5E5B] font-semibold focus:outline-none cursor-pointer uppercase tracking-wide">
                    <option>Etiketsiz</option>
                  </select>
                  <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed">
                    Etiketler Gelir Gider Raporunda etiket bazinda karliligini gormenizi saglar.
                  </p>
                </div>

                {/* HARCAMAYI YAPANI TAKIP ET */}
                <div className="bg-[#E5DDD3] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-[#8B7E6A]" />
                    <span className="text-xs font-bold text-[#6A5E5B] uppercase tracking-wide">Harcamayi Yapani Takip Et</span>
                  </div>
                  <p className="text-[11px] text-[#8B7E6A] leading-relaxed">
                    Calisanlar bolumunden calisanlarinizi ekleyerek ceplerinden yaptiklari harcamalari ve geri odeme tarihlerini takip edebilirsiniz.
                  </p>
                  <p className="text-[11px] text-[#A89B8C] mt-2 leading-relaxed italic">
                    Kendi insiyatifi ile harcama yapan calisanin giderler raporunda takip edebilirsiniz.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========== DETAYLI FIS MODAL (kept as before) ========== */}
      {isDetayliOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Detayli Fis / Fatura</h3>
              </div>
              <button onClick={() => setIsDetayliOpen(false)} className="p-2 -mr-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tedarikci / Cari Adi</label>
                <input type="text" placeholder="Firma veya Kisi Adi" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Belge Tipi</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option>E-Arsiv Fatura</option>
                  <option>E-Fatura</option>
                  <option>Perakende Satis Fisi</option>
                  <option>Gider Pusulasi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tarih</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="sm:col-span-2 grid grid-cols-3 gap-4 border-t border-slate-100 pt-5 mt-2">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">KDV Orani</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <option>%20</option>
                    <option>%10</option>
                    <option>%1</option>
                    <option>%0</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Toplam Tutar (TL)</label>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aciklama</label>
                <textarea rows={2} placeholder="Harcama detaylari..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"></textarea>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsDetayliOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">Iptal</button>
              <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm shadow-orange-600/20">
                <CheckCircle2 className="w-5 h-5" />
                Kaydet ve Klasore Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`;

fs.writeFileSync('src/app/muhasebe/gider-kaydi/page.tsx', content, 'utf8');
console.log('Hizli Fis modal updated successfully');
