import React, { useEffect, useState } from 'react'
import { User as UserIcon, Building2, ShieldCheck, Camera, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { updateUser, updateCompany } = useAuth()

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: 'OWNER',
    profileImage: '',
  })
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)

  // Company State
  const [company, setCompany] = useState({
    companyName: '',
    logo: '',
  })
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Security State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Feedback Toasts
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [companyMsg, setCompanyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [loading, setLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const headers = { Authorization: token ? `Bearer ${token}` : '' }

      try {
        const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
        
        const [profRes, compRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/settings/profile`, { headers }),
          fetch(`${API_BASE_URL}/api/settings/company`, { headers }),
        ])

        const [profData, compData] = await Promise.all([
          profRes.json().catch(() => ({})),
          compRes.json().catch(() => ({})),
        ])

        if (profRes.ok && profData.success) {
          const loadedProf = {
            name: profData.profile.name || '',
            email: profData.profile.email || '',
            role: profData.profile.role || 'OWNER',
            profileImage: profData.profile.profileImage || '',
          }
          setProfile(loadedProf)
          updateUser({
            name: loadedProf.name,
            email: loadedProf.email,
            profileImage: loadedProf.profileImage,
          })
        }

        if (compRes.ok && compData.success && compData.company) {
          const loadedComp = {
            companyName: compData.company.companyName || '',
            logo: compData.company.logo || '',
          }
          setCompany(loadedComp)
          updateCompany({
            companyName: loadedComp.companyName,
            logo: loadedComp.logo,
          })
        }
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Profile Image Selection
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfileImageFile(file)
      setProfilePreview(URL.createObjectURL(file))
    }
  }

  // Company Logo Selection
  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCompanyLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    const formData = new FormData()
    formData.append('name', profile.name)
    formData.append('email', profile.email)
    if (profileImageFile) {
      formData.append('profileImage', profileImageFile)
    }

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const res = await fetch(`${API_BASE_URL}/api/settings/profile`, {
        method: 'PUT',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setProfileMsg({ type: 'success', text: data.message || 'Profile updated successfully.' })
        const updatedImg = data.profile.profileImage || profile.profileImage
        setProfile((p) => ({ ...p, profileImage: updatedImg }))
        updateUser({
          name: data.profile.name || profile.name,
          email: data.profile.email || profile.email,
          profileImage: updatedImg,
        })
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to update profile.' })
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setProfileMsg({ type: 'error', text: 'Connection error. Failed to save profile.' })
    }
  }

  // Save Company Handler
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setCompanyMsg(null)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    const formData = new FormData()
    formData.append('companyName', company.companyName)
    if (companyLogoFile) {
      formData.append('companyLogo', companyLogoFile)
    }

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const res = await fetch(`${API_BASE_URL}/api/settings/company`, {
        method: 'PUT',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCompanyMsg({ type: 'success', text: data.message || 'Company settings updated successfully.' })
        const updatedLogo = data.company.logo || company.logo
        setCompany((c) => ({ ...c, logo: updatedLogo }))
        updateCompany({
          companyName: data.company.companyName || company.companyName,
          logo: updatedLogo,
        })
      } else {
        setCompanyMsg({ type: 'error', text: data.message || 'Failed to update company settings.' })
      }
    } catch (err) {
      console.error('Error saving company:', err)
      setCompanyMsg({ type: 'error', text: 'Connection error. Failed to save company settings.' })
    }
  }

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityMsg(null)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(passwords),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSecurityMsg({ type: 'success', text: data.message || 'Password changed successfully.' })
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setSecurityMsg({ type: 'error', text: data.message || 'Failed to change password.' })
      }
    } catch (err) {
      console.error('Error changing password:', err)
      setSecurityMsg({ type: 'error', text: 'Connection error. Failed to change password.' })
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#64748b] dark:text-slate-400 text-xs">Loading settings from database...</div>
  }

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
  const profileAvatarUrl = profilePreview || (profile.profileImage ? `${API_BASE_URL}${profile.profileImage.startsWith('/') ? '' : '/'}${profile.profileImage}` : null)
  const companyLogoUrl = logoPreview || (company.logo ? `${API_BASE_URL}${company.logo.startsWith('/') ? '' : '/'}${company.logo}` : null)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-[#172033] dark:text-white tracking-tight">Settings</h2>
        <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
          Manage your account profile, company information, and security configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Profile Settings */}
        <form onSubmit={handleSaveProfile} className="card p-6 space-y-4 shadow-sm border border-[#e3e8f0] dark:border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e3e8f0] dark:border-slate-800 pb-3">
              <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-[#172033] dark:text-white">Profile Settings</h3>
            </div>

            {/* Profile Photo */}
            <div className="flex items-center gap-4 py-2">
              <div className="w-14 h-14 rounded-full bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {profileAvatarUrl ? (
                  <img src={profileAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-7 h-7 text-[#94a3b8]" />
                )}
              </div>
              <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-[#f8fafc] dark:bg-slate-800 hover:bg-[#eef2f7] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 border border-[#d7dee8] dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
                <Camera className="w-3.5 h-3.5 text-[#64748b]" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
              </label>
            </div>

            {profileMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">Owner Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Owner Name"
                className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-[#94a3b8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email Address"
                className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-[#94a3b8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">Role</label>
              <input
                type="text"
                disabled
                value="OWNER"
                className="w-full px-3 py-2 bg-[#f8fafc]/60 dark:bg-slate-800/60 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#64748b] dark:text-slate-400 font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all mt-4">
            Save Profile
          </button>
        </form>

        {/* 2. Company Settings */}
        <form onSubmit={handleSaveCompany} className="card p-6 space-y-4 shadow-sm border border-[#e3e8f0] dark:border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e3e8f0] dark:border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-[#172033] dark:text-white">Company Settings</h3>
            </div>

            {/* Company Logo */}
            <div className="flex items-center gap-4 py-2">
              <div className="w-14 h-14 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt="Company Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-7 h-7 text-[#94a3b8]" />
                )}
              </div>
              <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-[#f8fafc] dark:bg-slate-800 hover:bg-[#eef2f7] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 border border-[#d7dee8] dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
                <Camera className="w-3.5 h-3.5 text-[#64748b]" />
                <span>Upload Logo</span>
                <input type="file" accept="image/*" onChange={handleCompanyLogoChange} className="hidden" />
              </label>
            </div>

            {companyMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                companyMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
              }`}>
                {companyMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{companyMsg.text}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">Company Name</label>
              <input
                type="text"
                value={company.companyName}
                onChange={(e) => setCompany((c) => ({ ...c, companyName: e.target.value }))}
                placeholder="Company Name"
                className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-[#94a3b8]"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all mt-4">
            Save Company
          </button>
        </form>

        {/* 3. Security Settings */}
        <form onSubmit={handleChangePassword} className="card p-6 space-y-4 shadow-sm border border-[#e3e8f0] dark:border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e3e8f0] dark:border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-[#172033] dark:text-white">Security Settings</h3>
            </div>

            {securityMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                securityMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
              }`}>
                {securityMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{securityMsg.text}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Current Password"
                className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-[#94a3b8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="New Password"
                className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-[#94a3b8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] dark:text-slate-300 block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm New Password"
                className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-slate-800 border border-[#d7dee8] dark:border-slate-700 rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-[#94a3b8]"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all mt-4">
            Change Password
          </button>
        </form>
      </div>
    </div>
  )
}