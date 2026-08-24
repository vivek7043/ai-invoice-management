import React, { useState, useEffect } from 'react'
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  Search,
  ArrowUpDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import VendorDetailModal, { VendorDetail } from '../components/VendorDetailModal'

interface VendorSummary {
  totalVendors: number
  totalInvoices: number
  totalVendorSpend: number
  pendingVendorAmount: number
  overdueVendorAmount: number
}

interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export default function Vendors() {
  const [summary, setSummary] = useState<VendorSummary>({
    totalVendors: 0,
    totalInvoices: 0,
    totalVendorSpend: 0,
    pendingVendorAmount: 0,
    overdueVendorAmount: 0,
  })

  const [vendors, setVendors] = useState<VendorDetail[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  })

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('totalAmount')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVendor, setSelectedVendor] = useState<VendorDetail | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [search, sortBy, sortOrder, page])

  const fetchVendors = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const queryParams = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: '10',
      })

      const response = await fetch(`${API_BASE_URL}/api/vendors?${queryParams.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSummary(data.summary || {})
        setVendors(data.vendors || [])
        setPagination(data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 })
      } else {
        setError(data.message || 'Failed to load vendors')
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err)
      setError('Network error: Unable to connect to vendor service')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">Vendors</h1>
          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
            Manage your vendors, track total spend, pending dues, and vendor invoices dynamically from MongoDB.
          </p>
        </div>
        <button
          onClick={fetchVendors}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172033] dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 hover:bg-[#eef2f7] dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* 1. Vendor Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="card p-4 flex items-center gap-3 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Total Vendors</span>
            <span className="text-xl font-bold text-[#172033] dark:text-white mt-0.5 block">{summary.totalVendors || 0}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Total Invoices</span>
            <span className="text-xl font-bold text-[#172033] dark:text-white mt-0.5 block">{summary.totalInvoices || 0}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Total Vendor Spend</span>
            <span className="text-xl font-bold text-[#172033] dark:text-white mt-0.5 block">{formatCurrency(summary.totalVendorSpend)}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Pending Dues</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{formatCurrency(summary.pendingVendorAmount)}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 col-span-2 lg:col-span-1 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Overdue Dues</span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">{formatCurrency(summary.overdueVendorAmount)}</span>
          </div>
        </div>
      </div>

      {/* 2. Controls: Search Bar & Sorting */}
      <div className="card p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94a3b8] dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search vendors..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#d7dee8] dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-[#172033] dark:text-white placeholder-[#94a3b8] dark:placeholder-slate-500 bg-[#f8fafc] dark:bg-slate-800 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#64748b] dark:text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#94a3b8]" /> Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(1)
            }}
            className="text-xs bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="totalAmount">Total Spend (High to Low)</option>
            <option value="vendorName">Vendor Name (A - Z)</option>
            <option value="invoiceCount">Invoice Count</option>
            <option value="lastInvoiceDate">Last Invoice Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 text-xs font-bold border border-[#d7dee8] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#eef2f7] dark:hover:bg-slate-700 rounded-xl text-[#172033] dark:text-slate-200 transition-all shadow-sm"
            title="Toggle sort order"
          >
            {sortOrder === 'asc' ? 'ASC' : 'DESC'}
          </button>
        </div>
      </div>

      {/* 3. Vendor Table Container */}
      <div className="card overflow-hidden border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#64748b] dark:text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading vendor directory...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-xs font-semibold">{error}</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-[#64748b] dark:text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-[#172033] dark:text-slate-200 text-sm">
              {search.trim() ? 'No vendors match your search.' : 'No vendors found.'}
            </p>
            <p className="text-xs text-[#94a3b8]">
              {search.trim()
                ? 'Try searching with a different vendor or company name.'
                : 'Upload your first invoice to automatically discover vendors.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eef2f7] dark:bg-slate-800/80 border-b border-[#e3e8f0] dark:border-slate-700/80 text-[#64748b] dark:text-slate-400 uppercase font-semibold">
                  <th className="p-3.5">Vendor Name</th>
                  <th className="p-3.5 text-center">Invoices</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5 text-right">Paid Amount</th>
                  <th className="p-3.5 text-right">Pending Amount</th>
                  <th className="p-3.5 text-right">Overdue Amount</th>
                  <th className="p-3.5 text-center">Last Invoice</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8f0]/60 dark:divide-slate-800/80 font-medium text-[#172033] dark:text-slate-200 bg-white dark:bg-transparent">
                {vendors.map((v) => {
                  const formattedLastDate = formatDate(v.lastInvoiceDate)

                  return (
                    <tr key={v.id || v.vendorName} className="hover:bg-[#f1f5f9] dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#172033] dark:text-white text-xs">{v.vendorName}</div>
                        {v.vendorLegalName && (
                          <div className="text-[11px] text-[#94a3b8] font-normal">{v.vendorLegalName}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-semibold text-[#172033] dark:text-slate-300">
                        {v.invoiceCount || 0}
                      </td>

                      <td className="p-3.5 text-right font-bold text-[#172033] dark:text-white">
                        {formatCurrency(v.totalAmount)}
                      </td>

                      <td className="p-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(v.paidAmount)}
                      </td>

                      <td className="p-3.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(v.pendingAmount)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(v.overdueAmount)}
                      </td>

                      <td className="p-3.5 text-center text-[#64748b] dark:text-slate-400 whitespace-nowrap">
                        {formattedLastDate ? formattedLastDate : <span className="text-[#94a3b8]">—</span>}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          Active
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedVendor(v)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && vendors.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#e3e8f0] dark:border-slate-800/80 bg-[#f8fafc] dark:bg-slate-800/50 text-xs text-[#64748b] dark:text-slate-400">
            <div>
              Showing <span className="font-bold text-[#172033] dark:text-white">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="font-bold text-[#172033] dark:text-white">{Math.min(page * 10, pagination.totalCount)}</span> of{' '}
              <span className="font-bold text-[#172033] dark:text-white">{pagination.totalCount}</span> vendors
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#d7dee8] dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#eef2f7] dark:hover:bg-slate-700 disabled:opacity-40 text-[#172033] dark:text-slate-200 font-semibold transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-[#172033] dark:text-slate-200">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#d7dee8] dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#eef2f7] dark:hover:bg-slate-700 disabled:opacity-40 text-[#172033] dark:text-slate-200 font-semibold transition-all"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      )}
    </div>
  )
}
