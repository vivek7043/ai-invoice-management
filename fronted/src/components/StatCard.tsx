import React from 'react'

export default function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="card p-5 space-y-2 hover:shadow-md transition-all border border-[#e3e8f0] dark:border-slate-800/80">
      <div className="text-xs font-semibold text-[#64748b] dark:text-slate-400 tracking-wide uppercase">{title}</div>
      <div className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">{value}</div>
    </div>
  )
}
