import React, { useState, useRef, useEffect } from 'react'

type Msg = { from: 'user' | 'bot'; text: string }

const STORAGE_KEY = 'ai_assistant_chat_history'
const DEFAULT_WELCOME_MSG: Msg = {
  from: 'bot',
  text: 'Hi! I am your AI Invoice Assistant. Ask me any question about your invoices, payments, vendors, or amounts.',
}

function cleanResponseText(text: string): string {
  if (!text) return ''
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function ChatWindow() {
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load chat history from sessionStorage:', e)
    }
    return [DEFAULT_WELCOME_MSG]
  })

  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs))
    } catch (e) {
      console.error('Failed to save chat history to sessionStorage:', e)
    }
  }, [msgs])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  function handleClearChat() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to remove chat history from sessionStorage:', e)
    }
    setMsgs([DEFAULT_WELCOME_MSG])
    setValue('')
  }

  async function send(questionText: string) {
    const trimmed = questionText.trim()
    if (!trimmed || loading) return

    const userMsg: Msg = { from: 'user', text: trimmed }
    setMsgs((prev) => [...prev, userMsg])
    setValue('')
    setLoading(true)

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/ai-assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          question: trimmed,
          conversationHistory: msgs,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.answer) {
        setMsgs((prev) => [...prev, { from: 'bot', text: cleanResponseText(data.answer) }])
      } else {
        const errorText = data.message || 'Sorry, I could not process your request.'
        setMsgs((prev) => [...prev, { from: 'bot', text: cleanResponseText(errorText) }])
      }
    } catch (err: any) {
      setMsgs((prev) => [
        ...prev,
        { from: 'bot', text: 'Network error: Unable to connect to AI Assistant service.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'What is my total pending amount?',
    'Show pending invoices',
    'Show overdue invoices',
    'What is my total overdue amount?',
    'Which invoice has the highest amount?',
    'Which invoice has the lowest amount?',
    'Show my latest invoices',
    'Show my top vendors',
  ]

  return (
    <div className="card p-5 min-h-[540px] h-[580px] flex flex-col justify-between shadow-sm border border-[#e3e8f0] dark:border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#e3e8f0] dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-xs text-[#172033] dark:text-white">AI Assistant</span>
        </div>
        <button
          onClick={handleClearChat}
          disabled={loading}
          className="text-xs px-2.5 py-1 text-[#64748b] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-[#d7dee8] dark:border-slate-700/80 transition-colors disabled:opacity-50 font-semibold"
          title="Clear session chat history"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-auto text-xs space-y-3 pr-2">
        {msgs.map((m, i) => (
          <div key={i} className={`${m.from === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed text-xs shadow-sm whitespace-pre-wrap ${
                m.from === 'user'
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-[#f8fafc] dark:bg-slate-800/80 text-[#172033] dark:text-slate-200 border border-[#d7dee8] dark:border-slate-700/60 font-medium'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <div className="inline-block px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/80 text-[#64748b] dark:text-slate-400 text-xs animate-pulse border border-[#d7dee8] dark:border-slate-700/60 font-medium">
              AI is analyzing your invoices...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Inputs & Suggestions */}
      <div className="mt-3 pt-3 border-t border-[#e3e8f0] dark:border-slate-800">
        <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-24 overflow-y-auto pr-1">
          {suggestions.map((s) => (
            <button
              key={s}
              disabled={loading}
              onClick={() => send(s)}
              className="text-[11px] px-3 py-1 bg-[#f8fafc] dark:bg-slate-800 hover:bg-[#eef2f7] dark:hover:bg-slate-700 text-[#64748b] dark:text-slate-300 hover:text-primary dark:hover:text-primary border border-[#d7dee8] dark:border-slate-700/60 rounded-full transition-colors disabled:opacity-50 text-left font-medium"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(value)
          }}
          className="flex gap-2"
        >
          <input
            value={value}
            disabled={loading}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-[#f8fafc] dark:bg-slate-800/80 border border-[#d7dee8] dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-[#172033] dark:text-white outline-none focus:ring-2 focus:ring-primary/50 placeholder-[#94a3b8] dark:placeholder-slate-500 transition-all font-medium"
            placeholder="Ask anything about your invoices..."
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
