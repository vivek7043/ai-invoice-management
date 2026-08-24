import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, Building2, User as UserIcon, Upload, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(() => searchParams.get('tab') !== 'signup')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Login Form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  // Signup / Owner Registration Form state
  const [signupName, setSignupName] = useState('')
  const [signupCompanyName, setSignupCompanyName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [signupError, setSignupError] = useState('')
  const [signupSubmitting, setSignupSubmitting] = useState(false)

  const navigate = useNavigate()
  const { user, login } = useAuth()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.')
      return
    }

    setLoginSubmitting(true)
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        setLoginError(data.message || 'Invalid email or password.')
        return
      }

      login(data.user, data.company, data.token, rememberMe)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login Error:', err)
      setLoginError('Unable to connect to backend server.')
    } finally {
      setLoginSubmitting(false)
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSignupError('')

    if (!signupName.trim()) {
      setSignupError('Owner full name is required.')
      return
    }
    if (!signupCompanyName.trim()) {
      setSignupError('Company name is required.')
      return
    }
    if (!signupEmail.trim()) {
      setSignupError('Email address is required.')
      return
    }
    if (!signupPassword) {
      setSignupError('Password is required.')
      return
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.')
      return
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.')
      return
    }

    setSignupSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', signupName.trim())
      formData.append('fullName', signupName.trim())
      formData.append('companyName', signupCompanyName.trim())
      formData.append('email', signupEmail.trim().toLowerCase())
      formData.append('password', signupPassword)
      formData.append('confirmPassword', signupConfirmPassword)
      if (imageFile) {
        formData.append('profileImage', imageFile)
      }

      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        setSignupError(data.message || 'Failed to register Owner account.')
        return
      }

      login(data.user, data.company, data.token, true)
      navigate('/dashboard')
    } catch (err) {
      console.error('Signup Error:', err)
      setSignupError('Unable to connect to backend server.')
    } finally {
      setSignupSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden p-8 sm:p-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            AI Invoice Management
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Secure Multi-Tenant Platform for Business Owners
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-8 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setLoginError(''); setSignupError('') }}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Owner Login
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setLoginError(''); setSignupError('') }}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              !isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Owner & Company
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Business Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate('/forgot-password')
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
              >
                Forgot Password?
              </button>

            </div>


            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loginSubmitting ? 'Authenticating...' : 'Sign In as Owner'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        ) : (
          /* SIGNUP / REGISTER OWNER FORM */
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {signupError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                {signupError}
              </div>
            )}

            {/* Profile / Logo Upload */}
            <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/60 p-3 rounded-2xl">
              <div className="relative w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Logo / Profile Image (Optional)
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={signupCompanyName}
                    onChange={(e) => setSignupCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Business Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/50">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Registering automatically assigns role <strong className="text-white">OWNER</strong> with dedicated company workspace.</span>
            </div>

            <button
              type="submit"
              disabled={signupSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {signupSubmitting ? 'Creating Company & Account...' : 'Register Company & Owner Account'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
