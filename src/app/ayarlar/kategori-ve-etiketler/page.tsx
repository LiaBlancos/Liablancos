'use client'

import React, { useState, useEffect } from 'react'
import { Folder, Tag, Plus, Zap, Trash2, X, CheckCircle2, Loader2 } from 'lucide-react'
import { GIDER_KATEGORILERI, ETIKETLER, SATIS_KATEGORILERI } from '@/lib/constants'
import CategoryTag from '@/components/CategoryTag'
import { getExpenseRules, saveExpenseRule, deleteExpenseRule } from '@/lib/actions'
import { toast } from 'sonner'

// Reusable Section Card Component
const CategorySection = ({ title, icon: Icon, children, onAdd }: { title: string, icon: any, children: React.ReactNode, onAdd?: () => void }) => {
  return (
    <div className="flex flex-col bg-[#FDFBF9] border border-slate-200/60 rounded-xl overflow-hidden shadow-sm h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-[#F5F0EB] border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <h2 className="text-[13px] font-bold text-slate-700">{title}</h2>
        </div>
      </div>
      <div className="p-4 flex-1">
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 bg-[#FDFBF9]">
        <button 
          onClick={onAdd}
          className="w-full px-4 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors bg-white flex items-center justify-center gap-2"
        >
          <Plus className="w-3 h-3" />
          YENİ EKLE
        </button>
      </div>
    </div>
  )
}

export default function KategoriVeEtiketlerPage() {
  const [rules, setRules] = useState<any[]>([])
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState({ keyword: '', category: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    const data = await getExpenseRules()
    setRules(data)
    setLoading(false)
  }

  const handleAddRule = async () => {
    if (!newRule.keyword || !newRule.category) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    setIsSaving(true)
    try {
      await saveExpenseRule(newRule.keyword, newRule.category)
      toast.success('Kural başarıyla eklendi')
      setNewRule({ keyword: '', category: '' })
      setIsRuleModalOpen(false)
      fetchRules()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return

    try {
      await deleteExpenseRule(id)
      toast.success('Kural silindi')
      fetchRules()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori ve Etiketler</h1>
          <p className="text-slate-500 text-sm mt-1">Tüm sistem kategorilerini ve etiketlerini buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* Akıllı Kategori Kuralları */}
        <div className="lg:col-span-2">
          <div className="flex flex-col bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-md h-full">
            <div className="flex items-center justify-between px-6 py-4 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-[15px] font-bold text-indigo-900">Otomatik Kategori Kuralları</h2>
                  <p className="text-[11px] text-indigo-600 font-medium">Excel yüklerken ismi otomatik eşleştirir</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRuleModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                YENİ KURAL EKLE
              </button>
            </div>
            
            <div className="p-6 flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-200 animate-spin mb-2" />
                  <p className="text-slate-400 text-xs">Kurallar yükleniyor...</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <Zap className="w-12 h-12 text-slate-100 mb-2" />
                  <p className="text-slate-400 text-sm italic">Henüz bir kural tanımlanmamış.</p>
                  <p className="text-slate-300 text-[11px] mt-1">Yeni kural ekleyerek Excel aktarımını hızlandırın.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-indigo-300 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">EĞER İSİMDE GEÇERSE:</span>
                        <span className="text-sm font-bold text-slate-800 tracking-tight">{rule.keyword}</span>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-medium text-slate-400">KATEGORİ:</span>
                          <CategoryTag 
                            text={rule.category} 
                            color={GIDER_KATEGORILERI.find(c => c.text === rule.category)?.color || 'gray'} 
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gider Kategorileri */}
        <CategorySection title="Gider Kategorileri" icon={Folder}>
          {GIDER_KATEGORILERI.map((item) => (
            <CategoryTag key={item.text} text={item.text} color={item.color} />
          ))}
        </CategorySection>

        {/* Satış Kategorileri */}
        <CategorySection title="Satış Kategorileri" icon={Folder}>
          {SATIS_KATEGORILERI.map((item) => (
            <CategoryTag key={item.text} text={item.text} color={item.color} />
          ))}
        </CategorySection>

        {/* Gelir ve Gider Etiketleri */}
        <CategorySection title="Gelir ve Gider Etiketleri" icon={Tag}>
          {ETIKETLER.map((item) => (
            <CategoryTag key={item.text} text={item.text} color={item.color} />
          ))}
        </CategorySection>
      </div>

      {/* Yeni Kural Modalı */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold">Yeni Akıllı Kural</h3>
              </div>
              <button onClick={() => setIsRuleModalOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Anahtar Kelime</label>
                <input 
                  type="text"
                  placeholder="Örn: Trendyol, Kira, Maaş..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  value={newRule.keyword}
                  onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Excel'deki isim veya açıklama bu kelimeyi içerdiğinde kural tetiklenir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Atanacak Kategori</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium appearance-none"
                  value={newRule.category}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                >
                  <option value="">Kategori Seçin...</option>
                  {GIDER_KATEGORILERI.map(cat => (
                    <option key={cat.text} value={cat.text}>{cat.text}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleAddRule}
                  disabled={isSaving}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      KURALI KAYDET
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
