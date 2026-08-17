import React from 'react'
import { X, Building2, Mail, Phone, MapPin, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export interface VendorInvoice {
  _id?: string
  invoiceNumber: string
  invoiceDate?: string
  dueDate?: string
  amount?: number
  status?: string
  fileName?: string
}

export interface VendorDetail {
  id?: string
  vendorName: string
  vendorLegalName?: string
  email?: string
  phone?: string
  address?: string
  GSTIN?: string
  invoiceCount?: number
  totalAmount?: number
  paidAmount?: number
  pendingAmount?: number
  overdueAmount?: number
  status?: string
  invoices?: VendorInvoice[]
}

interface Props {
  vendor: VendorDetail | null
  onClose: () => void
}

export default function VendorDetailModal({ vendor, onClose }: Props) {
  if (!vendor) return null

  const formatCurrency = (amt?: number) => {
    if (amt === undefined || amt === null || isNaN(amt)) return '₹0'
    return `₹${amt.toLocaleString('en-IN')}`
  }

  const formatDate = (dStr?: string) => {
    if (!dStr) return null
    try {
      const dt = new Date(dStr)
      if (isNaN(dt.getTime())) return null
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return null
    }
  }

  const invoices = vendor.invoices || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#e3e8f0] dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#e3e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172033] dark:text-white tracking-tight">{vendor.vendorName}</h2>
              {vendor.vendorLegalName && (
                <p className="text-xs text-[#64748b] dark:text-slate-400 font-medium mt-0.5">{vendor.vendorLegalName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] dark:text-slate-500 hover:text-[#172033] dark:hover:text-slate-200 hover:bg-[#eef2f7] dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#172033] dark:text-slate-300">
          {/* Metadata Contact Grid */}
          {(vendor.email || vendor.phone || vendor.address || vendor.GSTIN) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-[#f8fafc] dark:bg-slate-800/50 border border-[#d7dee8] dark:border-slate-700/60 rounded-xl">
              {vendor.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#94a3b8] dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Email</span>
                    <span className="font-semibold text-[#172033] dark:text-slate-200 text-xs break-all">{vendor.email}</span>
                  </div>
                </div>
              )}

              {vendor.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#94a3b8] dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Phone</span>
                    <span className="font-semibold text-[#172033] dark:text-slate-200 text-xs">{vendor.phone}</span>
                  </div>
                </div>
              )}

              {vendor.GSTIN && (
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-[#94a3b8] dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">GSTIN / Tax ID</span>
                    <span className="font-semibold text-[#172033] dark:text-slate-200 text-xs font-mono">{vendor.GSTIN}</span>
                  </div>
                </div>
              )}

              {vendor.address && (
                <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
                  <MapPin className="w-4 h-4 text-[#94a3b8] dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Address</span>
                    <span className="font-semibold text-[#172033] dark:text-slate-200 text-xs line-clamp-2">{vendor.address}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vendor Financial Summary */}
          <div>
            <h3 className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase tracking-wider mb-3">Vendor Financial Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 bg-[#f8fafc] dark:bg-slate-800/50 border border-[#d7dee8] dark:border-slate-700/60 rounded-xl">
                <span className="text-xs text-[#64748b] dark:text-slate-400 font-medium block">Total Invoices</span>
                <span className="text-lg font-bold text-[#172033] dark:text-white mt-0.5 block">{vendor.invoiceCount || 0}</span>
              </div>
              <div className="p-3.5 bg-[#f8fafc] dark:bg-slate-800/50 border border-[#d7dee8] dark:border-slate-700/60 rounded-xl">
                <span className="text-xs text-[#64748b] dark:text-slate-400 font-medium block">Total Spend</span>
                <span className="text-lg font-bold text-[#172033] dark:text-white mt-0.5 block">{formatCurrency(vendor.totalAmount)}</span>
              </div>
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl">
                <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium block">Paid Amount</span>
                <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mt-0.5 block">{formatCurrency(vendor.paidAmount)}</span>
              </div>
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 rounded-xl">
                <span className="text-xs text-amber-800 dark:text-amber-400 font-medium block">Pending Amount</span>
                <span className="text-lg font-bold text-amber-800 dark:text-amber-400 mt-0.5 block">{formatCurrency(vendor.pendingAmount)}</span>
              </div>
              <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-xs text-rose-800 dark:text-rose-400 font-medium block">Overdue Amount</span>
                <span className="text-lg font-bold text-rose-800 dark:text-rose-400 mt-0.5 block">{formatCurrency(vendor.overdueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Vendor Invoices Table */}
          <div>
            <h3 className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase tracking-wider mb-3">
              Invoices for {vendor.vendorName} ({invoices.length})
            </h3>

            {invoices.length === 0 ? (
              <div className="p-6 text-center text-[#64748b] dark:text-slate-400 bg-[#f8fafc] dark:bg-slate-800/40 rounded-xl border border-[#d7dee8] dark:border-slate-700/60">
                No invoices found for this vendor.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#e3e8f0] dark:border-slate-700/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#eef2f7] dark:bg-slate-800/80 border-b border-[#e3e8f0] dark:border-slate-700 text-[#64748b] dark:text-slate-400 uppercase font-semibold">
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Invoice Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e8f0]/60 dark:divide-slate-800 font-medium text-[#172033] dark:text-slate-200 bg-white dark:bg-transparent">
                    {invoices.map((inv, idx) => {
                      const st = (inv.status || 'PENDING').toUpperCase()
                      const formattedInvDate = formatDate(inv.invoiceDate)
                      const formattedDueDate = formatDate(inv.dueDate)

                      return (
                        <tr key={inv._id || idx} className="hover:bg-[#f1f5f9] dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-semibold text-[#172033] dark:text-white font-mono">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-3 text-[#64748b] dark:text-slate-400">
                            {formattedInvDate ? formattedInvDate : <span className="text-[#94a3b8]">—</span>}
                          </td>
                          <td className="p-3 text-[#64748b] dark:text-slate-400">
                            {formattedDueDate ? formattedDueDate : <span className="text-[#94a3b8]">—</span>}
                          </td>
                          <td className="p-3 text-right font-bold text-[#172033] dark:text-white">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="p-3 text-center">
                            {st === 'PAID' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-3 h-3" /> Paid
                              </span>
                            )}
                            {st === 'OVERDUE' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                                <AlertTriangle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                            {st === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e3e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#172033] dark:bg-slate-700 hover:bg-[#172033]/90 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
