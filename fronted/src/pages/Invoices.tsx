import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'
import DataTable from '../components/DataTable'

function exportCsv(rows: any[]) {
  if (!rows || rows.length === 0) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k]).replace(/"/g,'""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'invoices.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function Invoices(){
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true)
      setError(null)
      try {
        const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/api/invoices`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load invoices from server')
        }

        const rawList = Array.isArray(data.invoices) ? data.invoices : (Array.isArray(data) ? data : [])
        setInvoices(rawList)
      } catch (err) {
        console.error('Failed to fetch invoices:', err)
        setError(err instanceof Error ? err.message : 'Error connecting to backend server')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const columns = ['Invoice Number', 'Vendor', 'Amount', 'Status', 'Due Date', 'Actions']

  const data = invoices.map(i => {
    let formattedAmount = '—'
    if (i.amount !== null && i.amount !== undefined && !isNaN(Number(i.amount))) {
      formattedAmount = `₹${Number(i.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return {
      _id: i._id,
      'invoice number': i.invoiceNumber || '—',
      vendor: i.vendorName || '—',
      amount: formattedAmount,
      status: i.status || 'PENDING',
      'due date': i.dueDate ? i.dueDate : '—',
      actions: 'View',
    }
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">Invoices</h1>
          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
            View, search, filter, and track all processed invoice records.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCsv(data)}
            disabled={data.length === 0}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-[#64748b] dark:text-slate-400 text-xs border border-[#e3e8f0] dark:border-slate-800/80">
          Loading invoices from database...
        </div>
      )}

      {error && (
        <div className="card p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800/40">
          {error}
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="card p-12 text-center text-[#64748b] dark:text-slate-400 text-xs border border-[#e3e8f0] dark:border-slate-800/80">
          No invoices found in database. Upload an invoice to get started.
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => row._id && navigate(`/invoices/${row._id}`)}
        />
      )}
    </div>
  )
}
