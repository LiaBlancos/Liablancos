'use client';
import { Receipt } from 'lucide-react';
export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Receipt className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gider Listesi</h1>
          <p className="text-slate-500 text-sm">Tüm giderlerinizi listeleyin ve yönetin.</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Receipt className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Gider Listesi Modülü</h2>
          <p className="text-slate-500 max-w-sm">Bu bölüm şu anda yapım aşamasındadır.</p>
        </div>
      </div>
    </div>
  );
}