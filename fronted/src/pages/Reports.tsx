import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Download,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react'

interface SummaryData {
  totalInvoices: number
  totalExpense: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  currency: string
}

interface MonthlyTrendItem {
  month: string
  expense: number
  paid: number
}

interface TopVendorItem {
  vendor: string
  amount: number
  invoiceCount: number
}

interface StatusItem {
  name: string
  value: number
  percentage: number
  amount: number
  fill: string
}

export default function Reports() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const [reportType, setReportType] = useState('monthly')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() - 5, 1).toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const [summary, setSummary] = useState<SummaryData>({
    totalInvoices: 0,
    totalExpense: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    currency: 'INR',
  })

  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[]>([])
  const [topVendors, setTopVendors] = useState<TopVendorItem[]>([])
  const [statusDist, setStatusDist] = useState<StatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string>('')

  // Dynamic theme colors for charts
  const tickColor = isDark ? '#94A3B8' : '#64748B'
  const gridColor = isDark ? '#1E293B' : '#E3E8F0'
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF'
  const tooltipBorder = isDark ? '#334155' : '#E3E8F0'
  const tooltipText = isDark ? '#F8FAFC' : '#172033'

  const handleReportTypeChange = (type: string) => {
    setReportType(type)
    const now = new Date()

    if (type === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]
      const end = now.toISOString().split('T')[0]
      setStartDate(start)
      setEndDate(end)
    } else if (type === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      const end = now.toISOString().split('T')[0]
      setStartDate(start)
      setEndDate(end)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const queryParams = new URLSearchParams({
        reportType,
        startDate,
        endDate,
      })

      const response = await fetch(`${API_BASE_URL}/api/reports/data?${queryParams.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSummary(data.summary || {})
        setMonthlyTrend(data.monthlyTrend || [])
        setTopVendors(data.topVendors || [])
        setStatusDist(data.statusDistribution || [])
        setLastGenerated(`${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`)
      } else {
        setError(data.message || 'Failed to load report data')
      }
    } catch (err: any) {
      console.error('Error fetching report data:', err)
      setError('Network error: Unable to connect to report service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const formatCurrency = (amt?: number, curr?: string) => {
    if (amt === undefined || amt === null || isNaN(amt)) return '₹0'
    const symbol = curr === 'USD' ? '$' : '₹'
    return `${symbol}${amt.toLocaleString('en-IN')}`
  }

  const handleExportPDF = () => {
    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
    const queryParams = new URLSearchParams({ startDate, endDate })
    window.open(`${API_BASE_URL}/api/reports/export/pdf?${queryParams.toString()}`, '_blank')
  }

  const handleExportExcel = () => {
    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
    const queryParams = new URLSearchParams({ startDate, endDate })
    window.open(`${API_BASE_URL}/api/reports/export/excel?${queryParams.toString()}`, '_blank')
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent <= 0) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="#FFFFFF" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const hasData = summary.totalInvoices > 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">Reports</h1>
          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
            Analyze invoice expenses, vendor spending, and payment performance dynamically from MongoDB.
          </p>
        </div>
      </div>

      {/* 1. Report Filters */}
      <div className="card p-5 space-y-4 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-400 mb-1.5">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-[#d7dee8] dark:border-slate-700/80 rounded-xl bg-[#f8fafc] dark:bg-slate-800 text-[#172033] dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setReportType('custom')
              }}
              className="w-full px-3.5 py-2 text-xs border border-[#d7dee8] dark:border-slate-700/80 rounded-xl bg-[#f8fafc] dark:bg-slate-800 text-[#172033] dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-400 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setReportType('custom')
              }}
              className="w-full px-3.5 py-2 text-xs border border-[#d7dee8] dark:border-slate-700/80 rounded-xl bg-[#f8fafc] dark:bg-slate-800 text-[#172033] dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <button
          onClick={fetchReportData}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Generate Report
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#64748b] dark:text-slate-400 text-xs card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Analyzing invoice metrics for period...
        </div>
      ) : error ? (
        <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-xs font-semibold card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">{error}</div>
      ) : !hasData ? (
        <div className="p-12 text-center text-[#64748b] dark:text-slate-400 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm space-y-2">
          <Calendar className="w-8 h-8 text-[#94a3b8] dark:text-slate-600 mx-auto" />
          <p className="font-semibold text-[#172033] dark:text-slate-200 text-sm">No invoice data available for the selected period.</p>
          <p className="text-xs text-[#94a3b8]">Try choosing a broader date range or uploading new invoices.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Total Invoices</span>
                <span className="text-xl font-bold text-[#172033] dark:text-white mt-0.5 block">{summary.totalInvoices || 0}</span>
              </div>
            </div>

            <div className="p-4 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Total Expense</span>
                <span className="text-xl font-bold text-[#172033] dark:text-white mt-0.5 block">
                  {formatCurrency(summary.totalExpense, summary.currency)}
                </span>
              </div>
            </div>

            <div className="p-4 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Paid Amount</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {formatCurrency(summary.paidAmount, summary.currency)}
                </span>
              </div>
            </div>

            <div className="p-4 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] dark:text-slate-500 block">Pending / Overdue</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {formatCurrency(summary.pendingAmount + summary.overdueAmount, summary.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Expense Trend */}
            <div className="card p-5 space-y-4 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
              <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider">Monthly Expense Trend</h3>
              {monthlyTrend.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-xs text-[#94a3b8]">
                  No monthly trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="month" stroke={tickColor} fontSize={11} />
                    <YAxis stroke={tickColor} fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val), summary.currency)}
                      contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText, fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="expense" name="Total Expense" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} />
                    <Line type="monotone" dataKey="paid" name="Paid Amount" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Vendors by Expense */}
            <div className="card p-5 space-y-4 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
              <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider">Top Vendors by Expense</h3>
              {topVendors.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-xs text-[#94a3b8]">
                  No vendor data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topVendors} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="vendor" stroke={tickColor} fontSize={11} angle={-25} textAnchor="end" interval={0} />
                    <YAxis stroke={tickColor} fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val), summary.currency)}
                      contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText, fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" name="Vendor Spend" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Status Distribution and Export Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Status Distribution */}
            <div className="card p-5 space-y-4 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
              <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider">Invoice Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} invoices`, 'Count']}
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText, fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-xs pt-2 border-t border-[#e3e8f0] dark:border-slate-800">
                {statusDist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-[#64748b] dark:text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#94a3b8] dark:text-slate-500 font-mono">({item.value})</span>
                      <span className="font-bold text-[#172033] dark:text-slate-200">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Section */}
            <div className="lg:col-span-2 card p-5 space-y-4 flex flex-col justify-between border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider">Export Report</h3>
                <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
                  Download the generated invoice report in your preferred document or spreadsheet format.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export PDF Report
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel / CSV
                </button>
              </div>

              <div className="pt-3 border-t border-[#e3e8f0] dark:border-slate-800 flex items-center justify-between text-[11px] text-[#94a3b8] dark:text-slate-500">
                <span>Last generated: {lastGenerated || 'Just now'}</span>
                <span className="font-medium text-[#64748b] dark:text-slate-400">Period: {startDate} to {endDate}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
