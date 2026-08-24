import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import ChartSection from '../components/ChartSection'
import InvoiceCard from '../components/InvoiceCard'

interface DashboardData {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyRevenue: { month: string; revenue: number; amount?: number }[]
  invoiceStatusDistribution: { name: string; value: number; count?: number }[]
  recentInvoices: any[]
}

export default function Dashboard(){
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardMetrics() {
      setLoading(true)
      setError(null)
      try {
        const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })

        const resJson = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(resJson.message || 'Failed to load dashboard metrics')
        }

        if (resJson.data) {
          setData(resJson.data)
        } else {
          setData(resJson)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Error connecting to backend server')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardMetrics()
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <div className="card p-4 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Invoices" value={loading ? '...' : (data?.totalInvoices ?? 0)} />
        <StatCard title="Paid Invoices" value={loading ? '...' : (data?.paidInvoices ?? 0)} />
        <StatCard title="Pending Invoices" value={loading ? '...' : (data?.pendingInvoices ?? 0)} />
        <StatCard title="Overdue Invoices" value={loading ? '...' : (data?.overdueInvoices ?? 0)} />
      </div>

      <ChartSection
        revenueData={data?.monthlyRevenue}
        statusData={data?.invoiceStatusDistribution}
      />

      <div>
        <div className="text-lg font-semibold mb-3">Recent Invoices</div>
        {loading && (
          <div className="card p-6 text-center text-slate-500 text-sm">
            Loading recent invoices...
          </div>
        )}
        {!loading && (!data?.recentInvoices || data.recentInvoices.length === 0) && (
          <div className="card p-6 text-center text-slate-500 text-sm">
            No recent invoices found in database.
          </div>
        )}
        {!loading && data?.recentInvoices && data.recentInvoices.length > 0 && (
          <div className="grid gap-3">
            {data.recentInvoices.map((inv, idx) => (
              <InvoiceCard key={inv.id || idx} invoice={inv} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
