import React, { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'

interface ChartSectionProps {
  revenueData?: { month: string; label?: string; revenue: number; amount?: number; count?: number }[]
  statusData?: { name: string; value: number; count?: number; fill?: string }[]
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444']

function formatIndianCurrency(val: number): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0'
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatAxisCurrency(val: number): string {
  if (val === 0) return '₹0'
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
  return `₹${val}`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const amount = Number(data.revenue ?? data.amount ?? 0)
    const count = data.count ?? 1
    const monthLabel = data.label || data.month || 'Month'

    return (
      <div className="p-3 bg-white dark:bg-slate-900 border border-[#e3e8f0] dark:border-slate-700/80 rounded-xl shadow-xl space-y-1 font-medium text-xs">
        <div className="font-bold text-[#172033] dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800">
          {monthLabel}
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          {count} {count === 1 ? 'invoice' : 'invoices'}
        </div>
        <div className="text-sm font-bold text-primary">
          {formatIndianCurrency(amount)}
        </div>
      </div>
    )
  }
  return null
}

export default function ChartSection({ revenueData, statusData }: ChartSectionProps) {
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

  // Dynamic Theme Colors
  const tickColor = isDark ? '#94A3B8' : '#64748B'
  const axisColor = isDark ? '#334155' : '#E2E8F0'
  const gridColor = isDark ? '#1E293B' : '#F1F5F9'

  // Clean revenue data (only actual data)
  const validRevenue = Array.isArray(revenueData)
    ? revenueData.filter((r) => r && r.month && !isNaN(Number(r.revenue ?? r.amount)))
    : []

  // Clean status data (only actual data)
  const validStatus = Array.isArray(statusData)
    ? statusData.map((s) => ({
        name: s.name,
        value: Number(s.value ?? s.count ?? 0),
        fill: s.fill,
      }))
    : []

  const totalStatusCount = validStatus.reduce((acc, curr) => acc + curr.value, 0)
  const activeSlices = validStatus.filter((s) => s.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Revenue Chart Container */}
      <div className="lg:col-span-2 p-5 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider">
              Monthly Revenue Trend
            </h3>
            <p className="text-[11px] text-[#64748b] dark:text-slate-400 mt-0.5">
              Processed invoice value aggregated by month
            </p>
          </div>
        </div>

        {validRevenue.length === 0 ? (
          /* ZERO DATA STATE */
          <div className="flex flex-col items-center justify-center h-[220px] text-center space-y-2 border border-dashed border-[#d7dee8] dark:border-slate-800 rounded-xl p-6 bg-[#f8fafc]/50 dark:bg-slate-900/20">
            <BarChart3 className="w-8 h-8 text-[#94a3b8] dark:text-slate-600" />
            <p className="text-xs font-bold text-[#172033] dark:text-slate-200">
              No invoice data available for the selected period.
            </p>
            <p className="text-[11px] text-[#94a3b8] dark:text-slate-500 max-w-sm">
              Upload invoices to automatically populate monthly revenue trends from database records.
            </p>
          </div>
        ) : validRevenue.length === 1 ? (
          /* SINGLE MONTH CASE: Render Column / Bar Chart */
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={validRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="month"
                tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: axisColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisCurrency}
                domain={[0, (dataMax: number) => Math.max(dataMax * 1.25, 1000)]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                fill="#2563EB"
                radius={[8, 8, 0, 0]}
                maxBarSize={64}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* MULTIPLE MONTHS CASE: Render Area Chart with Gradient */
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={validRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="month"
                tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: axisColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisCurrency}
                domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 1000)]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: '#2563EB', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, stroke: '#60A5FA', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Invoice Status Distribution Container */}
      <div className="p-5 card border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider mb-0.5">
            Invoice Status
          </h3>
          <p className="text-[11px] text-[#64748b] dark:text-slate-400 mb-2">
            Distribution of processed invoices
          </p>

          {totalStatusCount === 0 ? (
            /* ZERO DATA STATE FOR STATUS */
            <div className="flex flex-col items-center justify-center h-[180px] text-center space-y-2 border border-dashed border-[#d7dee8] dark:border-slate-800 rounded-xl p-4 bg-[#f8fafc]/50 dark:bg-slate-900/20">
              <PieChartIcon className="w-7 h-7 text-[#94a3b8] dark:text-slate-600" />
              <p className="text-xs font-bold text-[#172033] dark:text-slate-200">
                No invoice status data available.
              </p>
            </div>
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={175}>
                <PieChart>
                  <Pie
                    data={activeSlices}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))
                      const pctVal = Math.round((percent || 0) * 100)
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#ffffff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{ fontSize: 11, fontWeight: 800 }}
                        >
                          {pctVal > 5 ? `${pctVal}%` : ''}
                        </text>
                      )
                    }}
                  >
                    {activeSlices.map((entry, index) => {
                      const colorIndex = validStatus.findIndex((s) => s.name === entry.name)
                      const fill = entry.fill || COLORS[colorIndex >= 0 ? colorIndex % COLORS.length : index % COLORS.length]
                      return <Cell key={index} fill={fill} />
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center donut text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-[#172033] dark:text-white leading-none">
                  {totalStatusCount}
                </span>
                <span className="text-[10px] font-semibold text-[#64748b] dark:text-slate-400 uppercase tracking-tight mt-0.5">
                  Total
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {validStatus.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 border-t border-[#e3e8f0] dark:border-slate-800 text-xs font-semibold">
            {validStatus.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[#172033] dark:text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.fill || COLORS[index % COLORS.length] }}
                />
                <span className="whitespace-nowrap text-xs">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
