import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  CheckCheck,
  Trash2,
  MoreVertical,
} from 'lucide-react'

export interface NotificationItem {
  _id: string
  type: 'DUE_TOMORROW' | 'DUE_TODAY' | 'OVERDUE' | 'PAYMENT_RECEIVED' | 'NEW_INVOICE' | 'EXTRACTION_REVIEW_REQUIRED'
  invoiceId?: {
    _id: string
    invoiceNumber?: string
    vendorName?: string
    amount?: number
    status?: string
  } | string
  message: string
  isRead: boolean
  createdAt: string
}

function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now.getTime() - past.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 30) return `${diffDay}d ago`
  return past.toLocaleDateString()
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNotifications(data.notifications || [])
      } else {
        setError(data.message || 'Failed to load notifications')
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Unable to connect to notification service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    } finally {
      setActiveMenuId(null)
    }
  }

  const markAllRead = async () => {
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err)
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    } finally {
      setActiveMenuId(null)
    }
  }

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item._id)
    }

    if (item.invoiceId) {
      const invId = typeof item.invoiceId === 'object' ? item.invoiceId._id : item.invoiceId
      if (invId) {
        navigate(`/invoices/${invId}`)
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OVERDUE':
      case 'EXTRACTION_REVIEW_REQUIRED':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
      case 'DUE_TOMORROW':
      case 'DUE_TODAY':
        return <Clock className="w-5 h-5 text-amber-500 shrink-0" />
      case 'PAYMENT_RECEIVED':
      case 'NEW_INVOICE':
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
      default:
        return <FileText className="w-5 h-5 text-primary shrink-0" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="card p-5 space-y-4 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e3e8f0] dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-[#172033] dark:text-slate-300 uppercase tracking-wider">Recent Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800/40">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* List / Loading / Empty */}
      {loading ? (
        <div className="p-8 text-center text-[#64748b] dark:text-slate-400 text-xs">Loading notifications...</div>
      ) : error ? (
        <div className="p-8 text-center text-rose-500 text-xs">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-[#64748b] dark:text-slate-400 space-y-1">
          <Bell className="w-7 h-7 text-[#94a3b8] dark:text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-[#172033] dark:text-slate-200 text-xs">No new notifications.</p>
          <p className="text-xs text-[#94a3b8]">Notifications regarding upcoming due dates and invoice updates will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#e3e8f0]/60 dark:divide-slate-800/80">
          {notifications.map((n) => (
            <li
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-all ${
                n.isRead
                  ? 'hover:bg-[#f1f5f9] dark:hover:bg-slate-800/40 opacity-75'
                  : 'bg-[#f8fafc] dark:bg-slate-800/80 hover:bg-[#eef2f7] dark:hover:bg-slate-800 font-medium border border-[#d7dee8] dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-bold text-[#172033] dark:text-white' : 'text-[#64748b] dark:text-slate-300'}`}>
                    {n.message}
                  </p>
                  <span className="text-[11px] text-[#94a3b8] dark:text-slate-500 mt-1 block">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </div>

              {/* 3-Dot Action Menu */}
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setActiveMenuId(activeMenuId === n._id ? null : n._id)}
                  className="p-1 hover:bg-[#eef2f7] dark:hover:bg-slate-700 rounded-lg text-[#94a3b8] hover:text-[#172033] dark:hover:text-slate-200 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenuId === n._id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-[#e3e8f0] dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-32">
                    {!n.isRead && (
                      <button
                        onClick={(e) => markAsRead(n._id, e)}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#172033] dark:text-slate-200 hover:bg-[#f1f5f9] dark:hover:bg-slate-700/50 flex items-center gap-2"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(n._id, e)}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
