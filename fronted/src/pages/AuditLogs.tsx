import React, { useEffect, useState } from 'react'
import { Download, Search, ChevronLeft, ChevronRight, ShieldAlert, FileSpreadsheet } from 'lucide-react'

export interface AuditLogItem {
  _id: string
  userId?: string
  userName: string
  action: string
  entityType: string
  entityId?: string
  description: string
  metadata?: Record<string, any>
  createdAt: string
}

function formatLogTime(dateString: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 30) return `${diffDay} days ago`

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchAuditLogs = async (currentPage: number, search: string) => {
    setLoading(true)
    setError(null)
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const url = `${API_BASE_URL}/api/audit-logs?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`
      
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      
      const data = await res.json()
      if (res.ok && data.success) {
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      } else {
        setError(data.message || 'Failed to fetch audit logs')
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError('Unable to connect to audit log service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs(page, searchQuery)
  }, [page, searchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const handleExportCsv = () => {
    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const exportUrl = `${API_BASE_URL}/api/audit-logs/export?search=${encodeURIComponent(searchQuery)}`
    
    const link = document.createElement('a')
    link.href = exportUrl
    link.setAttribute('download', 'audit_logs.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">Audit Logs</h2>
          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
            Real-time security and historical action trail stored in MongoDB
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Controls Bar: Search & Items Count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search table..."
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
          />
        </div>
        <div className="text-xs text-[#64748b] dark:text-slate-400 font-semibold">
          {total} {total === 1 ? 'result' : 'results'}
        </div>
      </div>

      {/* Data Table Container */}
      <div className="card overflow-hidden border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#64748b] dark:text-slate-400 text-xs">Loading audit logs...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-xs font-semibold">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-[#94a3b8] dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-[#172033] dark:text-slate-300 text-xs">
              {searchQuery.trim() ? 'No matching audit logs found.' : 'No audit logs found.'}
            </p>
            <p className="text-xs text-[#94a3b8]">
              {searchQuery.trim()
                ? 'Try refining your search term.'
                : 'System actions like invoice uploads, edits, and exports will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172033] dark:text-slate-300 border-collapse">
              <thead className="bg-[#eef2f7] dark:bg-slate-800/80 text-xs font-semibold text-[#64748b] dark:text-slate-400 uppercase border-b border-[#e3e8f0] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8f0]/60 dark:divide-slate-800 bg-white dark:bg-transparent font-medium">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#f1f5f9] dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-[#64748b] dark:text-slate-400">
                      {formatLogTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#172033] dark:text-slate-100">
                      {log.description || log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <span className="px-2.5 py-1 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 text-[#172033] dark:text-slate-300 rounded-lg font-semibold text-[11px]">
                        {log.userName || 'System'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 bg-[#f8fafc] dark:bg-slate-800/50 border-t border-[#e3e8f0] dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-[#64748b] dark:text-slate-400 font-medium">
            Page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-[#eef2f7] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-[#eef2f7] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
