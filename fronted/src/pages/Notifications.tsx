import React from 'react'
import NotificationPanel from '../components/NotificationPanel'

export default function NotificationsPage(){
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">Notifications</h2>
        <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
          Real-time updates regarding due dates, overdue payments, and system events
        </p>
      </div>
      <NotificationPanel />
    </div>
  )
}
