import React from 'react'
import { FileText } from 'lucide-react'

export default function InvoiceCard({ invoice }: { invoice: any }) {
  const displayInvoiceNumber = invoice.invoiceNumber || invoice.id || '—'
  const displayVendor = invoice.vendorName || invoice.vendor || '—'
  const displayAmount =
    invoice.amount !== null && invoice.amount !== undefined && !isNaN(Number(invoice.amount))
      ? `₹${Number(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—'

  const status = (invoice.status || 'PENDING').toUpperCase()
  let badgeClass = 'bg-[#f8fafc] text-[#64748b] dark:bg-slate-800 dark:text-slate-300'
  if (status === 'PAID') badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
  else if (status === 'PENDING') badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
  else if (status === 'OVERDUE') badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'

  return (
    <div className="card p-4 flex justify-between items-center hover:shadow-sm transition-all border border-[#e3e8f0] dark:border-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
          <FileText size={20} />
        </div>
        <div>
          <div className="font-bold text-[#172033] dark:text-white text-xs">{displayInvoiceNumber}</div>
          <div className="text-xs text-[#64748b] dark:text-slate-400">{displayVendor}</div>
        </div>
      </div>

      <div className="text-right space-y-1">
        <div className="font-bold text-[#172033] dark:text-white text-xs">{displayAmount}</div>
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
          {status}
        </span>
      </div>
    </div>
  )
}
