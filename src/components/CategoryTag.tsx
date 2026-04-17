import React from 'react'

export type TagColor = 'blue' | 'red' | 'orange' | 'purple' | 'yellow' | 'green' | 'cyan' | 'gray'

export const colorMap: Record<TagColor, string> = {
  blue: 'border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-50',
  red: 'border-red-300 text-red-600 bg-red-50/50 hover:bg-red-50',
  orange: 'border-orange-300 text-orange-600 bg-orange-50/50 hover:bg-orange-50',
  purple: 'border-purple-300 text-purple-600 bg-purple-50/50 hover:bg-purple-50',
  yellow: 'border-amber-300 text-amber-600 bg-amber-50/50 hover:bg-amber-50',
  green: 'border-emerald-300 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50',
  cyan: 'border-cyan-300 text-cyan-600 bg-cyan-50/50 hover:bg-cyan-50',
  gray: 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100',
}

interface CategoryTagProps {
  text: string
  color?: TagColor
  className?: string
  onClick?: () => void
}

export default function CategoryTag({ text, color = 'gray', className = '', onClick }: CategoryTagProps) {
  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border transition-colors ${colorMap[color]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {text}
    </span>
  )
}
