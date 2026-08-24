import React, { useEffect, useState, useMemo } from 'react'
import { Search, Moon, Sun, LogOut, X, Bell, User as UserIcon, Building2, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { invoices, vendors, stats } from '../mock/data'

type SearchStat = {
  label: string
  value: number
}

type SearchResults = {
  invoices: typeof invoices
  vendors: typeof vendors
  stats: SearchStat[]
}

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const navigate = useNavigate()
  const { user, company, logout, getAuthHeaders } = useAuth()

  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const savedTheme = localStorage.getItem('theme')
    const legacyDark = localStorage.getItem('theme-dark')
    if (savedTheme === 'light') return false
    if (savedTheme === 'dark') return true
    if (legacyDark) return true
    return true // Default to Dark Mode for new users & authenticated sessions
  })


  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setUnreadNotifCount(data.unreadCount || 0)
        }
      } catch (err) {
        console.error('Error fetching unread notifications count:', err)
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const searchResults = useMemo<SearchResults>(() => {
    if (!query.trim()) return { invoices: [], vendors: [], stats: [] }

    const lowerQuery = query.toLowerCase()

    const matchedInvoices = invoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(lowerQuery) ||
        inv.vendor.toLowerCase().includes(lowerQuery) ||
        inv.status.toLowerCase().includes(lowerQuery)
    )

    const matchedVendors = vendors.filter(
      (v) => v.name.toLowerCase().includes(lowerQuery) || v.id.toLowerCase().includes(lowerQuery)
    )

    const matchedStats: SearchStat[] = []
    const statsLabels: SearchStat[] = [
      { label: 'Total Invoices', value: stats.total },
      { label: 'Paid', value: stats.paid },
      { label: 'Pending', value: stats.pending },
      { label: 'Overdue', value: stats.overdue },
    ]
    statsLabels.forEach((stat) => {
      if (stat.label.toLowerCase().includes(lowerQuery)) {
        matchedStats.push(stat)
      }
    })

    return { invoices: matchedInvoices, vendors: matchedVendors, stats: matchedStats }
  }, [query])

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      localStorage.removeItem('theme-dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      localStorage.removeItem('theme-dark')
    }
  }, [dark])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleResultClick(type: string, id: string) {
    if (type === 'invoice') {
      navigate(`/invoices/${id}`)
    } else if (type === 'vendor') {
      navigate(`/vendors/${id}`)
    }
    setQuery('')
    setShowResults(false)
  }

  const ownerName = user?.fullName || user?.name || 'Owner'
  const companyName = company?.companyName || 'My Company'
  const profileImg = user?.profileImagePath || user?.profileImage
  const companyLogo = company?.companyLogoPath || company?.logo

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-[#e3e8f0] dark:border-slate-800/80 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 shadow-sm">
      {/* 1. LEFT SIDE — COMPANY BRANDING (No Logo Image, Only DB Company Name + Subtitle) */}
      <div className="flex items-center shrink-0 min-w-0 pr-2">
        <div className="flex flex-col text-left justify-center">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#172033] dark:text-white leading-tight truncate max-w-[180px] sm:max-w-[260px] md:max-w-[320px]">
            {companyName}
          </h1>
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
            AI Invoice Portal
          </span>
        </div>
      </div>

      {/* 2. CENTER — SEARCH BAR */}
      <div className="hidden md:flex flex-1 items-center justify-center max-w-md w-full mx-4 lg:mx-8">
        <div className="relative w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-[#d7dee8] dark:border-slate-700/60 rounded-xl px-3.5 py-2 flex items-center gap-2.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all shadow-inner">
          <Search size={16} className="text-[#94a3b8] dark:text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => query && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search invoices, vendors..."
            className="bg-transparent outline-none text-xs text-[#172033] dark:text-white placeholder-[#94a3b8] dark:placeholder-slate-400 w-full font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setShowResults(false)
              }}
              className="p-1 hover:bg-[#eef2f7] dark:hover:bg-slate-700 text-[#94a3b8] dark:text-slate-400 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-[#e3e8f0] dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {Object.keys(searchResults).every(
                (key) => searchResults[key as keyof typeof searchResults].length === 0
              ) ? (
                <div className="p-3 text-xs text-[#64748b] dark:text-slate-400">No results found</div>
              ) : (
                <>
                  {searchResults.invoices.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-[#64748b] dark:text-slate-400 bg-[#eef2f7] dark:bg-slate-900 border-b border-[#e3e8f0] dark:border-slate-700/50">
                        Invoices
                      </div>
                      {searchResults.invoices.map((inv) => (
                        <button
                          key={inv.id}
                          onClick={() => handleResultClick('invoice', inv.id)}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#f1f5f9] dark:hover:bg-slate-700/50 border-b border-[#e3e8f0] dark:border-slate-700/50 last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-semibold text-[#172033] dark:text-white">{inv.id}</div>
                              <div className="text-[11px] text-[#64748b] dark:text-slate-400">{inv.vendor}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-[#172033] dark:text-white">₹{inv.amount}</div>
                              <div
                                className={`text-[11px] font-semibold ${
                                  inv.status === 'Paid'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : inv.status === 'Pending'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {inv.status}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.vendors.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-[#64748b] dark:text-slate-400 bg-[#eef2f7] dark:bg-slate-900 border-b border-[#e3e8f0] dark:border-slate-700/50">
                        Vendors
                      </div>
                      {searchResults.vendors.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleResultClick('vendor', v.id)}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#f1f5f9] dark:hover:bg-slate-700/50 border-b border-[#e3e8f0] dark:border-slate-700/50 last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-semibold text-[#172033] dark:text-white">{v.name}</div>
                              <div className="text-[11px] text-[#64748b] dark:text-slate-400">{v.invoices} invoices</div>
                            </div>
                            <div className="text-right text-xs font-semibold text-[#172033] dark:text-white">₹{v.total}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3 & 4. RIGHT SIDE — CONTROLS & USER PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Theme Toggle */}
        <button
          title="Toggle theme"
          onClick={() => setDark((d) => !d)}
          className="p-2 sm:p-2.5 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700/60 hover:bg-[#eef2f7] dark:hover:bg-slate-700 text-[#64748b] dark:text-slate-300 transition-colors shadow-sm"
        >
          {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[#172033]" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          title="Notifications"
          className="p-2 sm:p-2.5 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700/60 hover:bg-[#eef2f7] dark:hover:bg-slate-700 text-[#64748b] dark:text-slate-300 relative transition-colors shadow-sm"
        >
          <Bell size={18} />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
              {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#e3e8f0] dark:border-slate-800 cursor-pointer group"
        >
          {profileImg ? (
            <img
              src={profileImg.startsWith('http') ? profileImg : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')}${profileImg.startsWith('/') ? '' : '/'}${profileImg}`}
              alt={ownerName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-indigo-500/30 shadow-sm group-hover:border-indigo-500 transition-colors"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/30 flex items-center justify-center font-bold text-sm shadow-sm group-hover:border-indigo-500 transition-colors">
              {ownerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs sm:text-sm font-bold text-[#172033] dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {ownerName}
            </div>
            <div className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold leading-none mt-0.5">
              Owner
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 sm:p-2.5 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#64748b] dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-sm ml-1"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
