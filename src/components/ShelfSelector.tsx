'use client'

import { Shelf } from '@/types'
import { MapPin, Check } from 'lucide-react'

interface ShelfSelectorProps {
    shelves: Shelf[]
    selectedShelfId?: string | null
    onSelectShelf: (shelfId: string) => void
}

export default function ShelfSelector({ shelves, selectedShelfId, onSelectShelf }: ShelfSelectorProps) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {shelves.map(shelf => {
                const isSelected = shelf.id === selectedShelfId
                return (
                    <button
                        key={shelf.id}
                        onClick={() => onSelectShelf(shelf.id)}
                        className={`relative p-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${isSelected
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                    >
                        {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-indigo-600" />
                            </div>
                        )}
                        <MapPin className={`w-4 h-4 mx-auto mb-1 ${isSelected ? 'text-indigo-200' : 'text-zinc-400'}`} />
                        {shelf.code}
                    </button>
                )
            })}
            {shelves.length === 0 && (
                <p className="col-span-full text-center text-zinc-500 py-4">Raf bulunamadı</p>
            )}
        </div>
    )
}
