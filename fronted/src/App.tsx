import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import UploadInvoice from './pages/UploadInvoice'
import Vendors from './pages/Vendors'
import AIAssistant from './pages/AIAssistant'
import NotificationsPage from './pages/Notifications'
import AuditLogs from './pages/AuditLogs'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import InvoiceDetails from './pages/InvoiceDetails'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOtp from './pages/VerifyOtp'
import ResetPassword from './pages/ResetPassword'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { AuthProvider, useAuth } from './context/AuthContext'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppContent() {
  const { user, loading } = useAuth()
  const isAuthenticated = !!user

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {isAuthenticated && <Sidebar />}
      <div className={isAuthenticated ? "flex-1 min-h-screen bg-pagebg dark:bg-slate-900" : "w-full min-h-screen bg-pagebg dark:bg-slate-900"}>
        {isAuthenticated && <Navbar />}
        <main className={isAuthenticated ? "p-6" : ""}>
          <div className={isAuthenticated ? "max-w-7xl mx-auto" : ""}>
            <Routes>
              <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
              <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetails /></PrivateRoute>} />
              <Route path="/upload" element={<PrivateRoute><UploadInvoice /></PrivateRoute>} />
              <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/ai" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
              <Route path="/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

function AppShell() {
  return <AppContent />
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
