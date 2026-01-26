'use client'

import { useState, useEffect } from 'react'
import { Settings, Link as LinkIcon, Key, Bell, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { getSettings, updateSettings } from '@/lib/actions'

export default function SettingsPage() {
    const [sellerId, setSellerId] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [apiSecret, setApiSecret] = useState('')
    const [delayThreshold, setDelayThreshold] = useState('3')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        const settings = await getSettings()
        setSellerId(settings.find(s => s.key === 'trendyol_seller_id')?.value || '')
        setApiKey(settings.find(s => s.key === 'trendyol_api_key')?.value || '')
        setApiSecret(settings.find(s => s.key === 'trendyol_api_secret')?.value || '')
        setDelayThreshold(settings.find(s => s.key === 'shipping_delay_threshold')?.value || '3')
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)
        try {
            await updateSettings('trendyol_seller_id', sellerId)
            await updateSettings('trendyol_api_key', apiKey)
            await updateSettings('trendyol_api_secret', apiSecret)
            await updateSettings('shipping_delay_threshold', delayThreshold)
            setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Ayarlar kaydedilirken bir hata oluştu.' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Ayarlar</h1>
                        <p className="text-zinc-500 text-sm">Sistem ve entegrasyon ayarları</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Kaydet
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* Settings Cards */}
            <div className="space-y-4">
                {/* Trendyol Integration */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
                    <div className="p-8 border-b border-zinc-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100/50">
                                    <LinkIcon className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-xl">Trendyol Entegrasyonu</h3>
                                    <p className="text-sm text-zinc-500">API bağlantısı yapılandırın</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Aktif
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Satıcı ID (Supplier ID)</label>
                            <input
                                type="text"
                                value={sellerId}
                                onChange={(e) => setSellerId(e.target.value)}
                                placeholder="Örn: 123456"
                                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">API Secret</label>
                                <input
                                    type="password"
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Kargo Gecikme Sınırı (Gün)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={delayThreshold}
                                    onChange={(e) => setDelayThreshold(e.target.value)}
                                    placeholder="Örn: 3"
                                    className="w-32 px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                />
                                <p className="text-sm text-zinc-500 font-medium">Bu süreyi aşan paketler "Gecikenler" listesine düşer.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-md p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                            <Key className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 text-xl">Sistem Bilgisi</h3>
                            <p className="text-sm text-zinc-500">Uygulama detayları</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                            <span className="text-zinc-500 font-medium">Versiyon</span>
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">2.1.0 Trendyol Edition</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                            <span className="text-zinc-500 font-medium">Veritabanı</span>
                            <span className="font-bold text-zinc-900 text-sm">Supabase Real-time</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-zinc-500 font-medium">Framework</span>
                            <span className="font-bold text-zinc-900 text-sm">Next.js 14 App Router</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
