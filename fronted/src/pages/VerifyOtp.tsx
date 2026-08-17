import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react'

export default function VerifyOtp() {
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Resend cooldown timer (60 seconds)
  const [cooldown, setCooldown] = useState(60)
  const [resending, setResending] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit numerical OTP.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: cleanOtp }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Invalid or expired OTP code.')
        return
      }

      // Navigate to reset password page with secure token
      navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.resetToken)}`)
    } catch (err) {
      console.error('Verify OTP Error:', err)
      setError('Unable to connect to backend server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0 || resending) return

    setError('')
    setSuccessMsg('')
    setResending(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP code.')
        return
      }

      setSuccessMsg('A new 6-digit OTP code has been sent to your email.')
      setCooldown(60)
    } catch (err) {
      console.error('Resend OTP Error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-8 sm:p-10">
        <Link
          to="/forgot-password"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Email</span>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Verify OTP
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Enter the 6-digit verification code sent to:
          </p>
          <p className="text-sm font-semibold text-indigo-300 mt-1 truncate">
            {email || 'user@example.com'}
          </p>
        </div>

        <form onSubmit={handleVerifySubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 text-center">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full py-3.5 px-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 text-center mt-2">Code expires in 5 minutes</p>
          </div>

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Verify OTP'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0 || resending}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  )
}
