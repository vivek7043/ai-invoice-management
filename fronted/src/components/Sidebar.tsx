import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Building2,
  Bot,
  BarChart3,
  Bell,
  ShieldAlert,
  Settings as SettingsIcon,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/upload', label: 'Upload Invoice', icon: Upload },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/ai', label: 'AI Assistant', icon: Bot },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const loc = useLocation()

  return (
    <aside className="w-64 bg-[#eef2f7] dark:bg-slate-900 border-r border-[#e3e8f0] dark:border-slate-800/80 h-screen p-4 sticky top-0 flex flex-col justify-between transition-colors duration-200 shadow-sm z-40">
      <div>
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-base shadow-sm">
            AI
          </div>
          <div className="font-bold text-lg text-[#172033] dark:text-white tracking-tight">Invoice Pro</div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              loc.pathname === item.to || (item.to !== '/dashboard' && loc.pathname.startsWith(item.to))

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/30 font-bold'
                    : 'text-[#64748b] dark:text-slate-300 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/60 hover:text-[#172033] dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-[#94a3b8] dark:text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="px-3 py-3 border-t border-[#e3e8f0] dark:border-slate-800/80 text-[11px] text-[#94a3b8] dark:text-slate-500 font-medium">
        © 2026 AI Invoice System
      </div>
    </aside>
  )
}
