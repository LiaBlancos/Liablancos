'use client'

import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useState } from 'react'
import { Camera, X, Scan } from 'lucide-react'

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void
    onScanFailure?: (error: any) => void
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure }: BarcodeScannerProps) {
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null

        if (isScanning) {
            setTimeout(() => {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    false
                )

                scanner.render(
                    (decodedText) => {
                        setScanResult(decodedText)
                        onScanSuccess(decodedText)
                        scanner?.clear()
                        setIsScanning(false)
                    },
                    (error) => {
                        if (onScanFailure) onScanFailure(error)
                    }
                )
            }, 100)
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error))
            }
        }
    }, [isScanning, onScanSuccess, onScanFailure])

    return (
        <div className="w-full">
            {!isScanning && (
                <div className="space-y-4">
                    {scanResult && (
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[2rem] animate-scale-in">
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1.5 px-1">Son Taranan</p>
                            <p className="text-2xl font-mono font-black text-emerald-900 tracking-wider bg-white/50 py-3 px-4 rounded-2xl border border-emerald-100/50 shadow-inner">{scanResult}</p>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setScanResult(null)
                            setIsScanning(true)
                        }}
                        className="group w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold py-10 px-6 rounded-[2.5rem] transition-all shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-1 active:scale-95"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10 backdrop-blur-md">
                            <Camera className="w-10 h-10" />
                        </div>
                        <div className="text-center">
                            <span className="text-xl font-black block mb-1">Kamerayı Başlat</span>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Barkodu okutmak için dokunun</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Scanner Modal */}
            {isScanning && (
                <div className="fixed inset-0 z-[100] bg-black sm:bg-slate-950/95 sm:backdrop-blur-xl flex items-center justify-center sm:p-6 animate-fade-in sm:lg:pl-72">
                    <div className="bg-white w-full h-full sm:h-auto sm:max-w-md sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-scale-in">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6 sm:p-8 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                    <Scan className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">Barkod Tara</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Kamerayı görsele tutun</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsScanning(false)}
                                className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                            >
                                <X className="w-7 h-7 text-slate-300" />
                            </button>
                        </div>

                        {/* Scanner Area */}
                        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                            <div id="reader" className="w-full h-full" />

                            {/* Scanning Guide Overlay */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-[2rem] relative">
                                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />

                                    {/* Scanning Line Animation */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[1.8rem]">
                                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan-line shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                                    </div>
                                </div>
                                <p className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Tarama Yapılıyor...</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-zinc-50 border-t border-zinc-100 shrink-0">
                            <p className="text-center text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
                                Barkod otomatik olarak algılanacaktır
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
