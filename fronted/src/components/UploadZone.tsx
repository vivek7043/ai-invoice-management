import React, { useRef, useState } from 'react'

export default function UploadZone(){
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFiles(files: FileList | null){
    if (!files || files.length === 0) return
    const f = files[0]

    if (f.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      setOcrStatus(null)
      return
    }

    setFileName(f.name)
    setProgress(0)
    setError(null)
    setOcrStatus('Uploading...')

    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    const formData = new FormData()
    formData.append('file', f)

    try {
      const response = await fetch('http://localhost:5000/api/invoices/upload', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed')
      }

      setProgress(100)
      setOcrStatus(`Uploaded: ${data.fileName}`)
    } catch (err) {
      setProgress(0)
      setOcrStatus('Upload failed')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div
      className="p-8 card border-dashed border-2 border-[#e3e8f0] dark:border-slate-700 bg-white dark:bg-slate-900/80 text-center cursor-pointer hover:border-primary transition-all rounded-2xl shadow-sm"
      onClick={() => inputRef.current?.click()}
      onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={e => onFiles(e.target.files)} />
      <div className="text-[#172033] dark:text-slate-300 font-semibold text-xs">
        Drag & drop PDF here or <span className="text-primary font-bold">click to upload</span>
      </div>
      {fileName && (
        <div className="mt-3 text-xs font-semibold text-[#172033] dark:text-slate-200">
          Selected: <span className="font-mono text-primary">{fileName}</span>
        </div>
      )}
      <div className="mt-3 text-xs text-[#94a3b8] dark:text-slate-500">
        Multi-page digital & scanned invoice OCR powered by Tesseract & PDF parser.
      </div>
      {error && <div className="mt-3 text-xs font-bold text-rose-500">{error}</div>}
      <div className="mt-5 max-w-md mx-auto">
        <div className="w-full bg-[#f8fafc] dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-[#d7dee8] dark:border-slate-700">
          <div style={{ width: `${progress}%` }} className="h-full bg-primary transition-all duration-300 rounded-full"></div>
        </div>
        <div className="text-xs font-semibold text-[#64748b] dark:text-slate-400 mt-2">OCR: {ocrStatus ?? 'Ready'}</div>
      </div>
    </div>
  )
}
