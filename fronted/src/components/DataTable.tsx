import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'

interface DataTableProps {
  columns: string[]
  data: Array<Record<string, any>>
  onRowClick?: (row: Record<string, any>) => void
}

export default function DataTable({ columns, data, onRowClick }: DataTableProps) {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const rowsPerPage = 7

  const filtered = data.filter((row) => {
    const matchesSearch = Object.values(row).some((val) =>
      String(val).toLowerCase().includes(filter.toLowerCase())
    )
    const matchesStatus =
      statusFilter === 'ALL' ||
      (row.status && String(row.status).toUpperCase() === statusFilter)
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <div className="card overflow-hidden border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
      {/* Controls Bar */}
      <div className="p-4 border-b border-[#e3e8f0] dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] dark:text-slate-500" />
          <input
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPage(1)
            }}
            placeholder="Filter table records..."
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700/80 rounded-xl text-xs text-[#172033] dark:text-white placeholder-[#94a3b8] dark:placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#94a3b8] dark:text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700/80 rounded-xl text-xs text-[#172033] dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#eef2f7] dark:bg-slate-800/80 border-b border-[#e3e8f0] dark:border-slate-700 text-[#64748b] dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-5 py-3.5 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8f0]/60 dark:divide-slate-800/80 bg-white dark:bg-transparent font-medium text-[#172033] dark:text-slate-200">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-[#94a3b8] dark:text-slate-500">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row._id || row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer hover:bg-[#f1f5f9] dark:hover:bg-slate-800/60' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const key = col.toLowerCase()
                    const val = row[key] !== undefined ? row[key] : row[col]

                    // Status Badge Styling
                    if (key === 'status' && val) {
                      const st = String(val).toUpperCase()
                      return (
                        <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                          {st === 'PAID' && (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                              PAID
                            </span>
                          )}
                          {st === 'PENDING' && (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/40">
                              PENDING
                            </span>
                          )}
                          {st === 'OVERDUE' && (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800/40">
                              OVERDUE
                            </span>
                          )}
                        </td>
                      )
                    }

                    // Actions Button
                    if (key === 'actions') {
                      return (
                        <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRowClick && onRowClick(row)
                            }}
                            className="px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold transition-all"
                          >
                            View
                          </button>
                        </td>
                      )
                    }

                    return (
                      <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                        {val !== null && val !== undefined ? String(val) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-[#f8fafc] dark:bg-slate-800/50 border-t border-[#e3e8f0] dark:border-slate-700 flex items-center justify-between text-xs text-[#64748b] dark:text-slate-400 font-medium">
        <span>
          Showing {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to{' '}
          {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} entries
        </span>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 border border-[#d7dee8] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-[#eef2f7] dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 font-bold text-[#172033] dark:text-white">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 border border-[#d7dee8] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-[#eef2f7] dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
