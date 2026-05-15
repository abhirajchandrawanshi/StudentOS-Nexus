import { useState, useRef, useEffect } from 'react'
import {
  Upload, FileText, MessageSquare, Send, Sparkles,
  CheckCircle2, AlertCircle, Loader2, X, BookOpen,
  Brain, Trash2, ChevronDown, Copy, Check
} from 'lucide-react'
import notesService from '../services/notesService'

// ─── Chat message component ──────────────────────────────────────
const ChatMessage = ({ message, isUser }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
        ${isUser
          ? 'bg-indigo-600'
          : 'bg-gradient-to-br from-purple-600 to-indigo-600'
        }`}
      >
        {isUser
          ? <MessageSquare size={14} className="text-white" />
          : <Sparkles size={14} className="text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-indigo-600 text-white rounded-tr-md'
          : 'bg-[#131d35] border border-white/8 text-slate-200 rounded-tl-md'
        }`}
      >
        <div className="whitespace-pre-wrap">{message}</div>

        {/* Copy button — AI messages only */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a2540] border border-white/10 rounded-md p-1 hover:bg-white/10"
            title="Copy response"
          >
            {copied
              ? <Check size={12} className="text-emerald-400" />
              : <Copy size={12} className="text-slate-400" />
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Uploaded file pill ──────────────────────────────────────────
const FilePill = ({ name, chunks, onRemove }) => (
  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 group">
    <FileText size={14} className="text-emerald-400 shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-emerald-300 text-xs font-medium truncate">{name}</p>
      <p className="text-emerald-500/60 text-[10px]">{chunks} chunks indexed</p>
    </div>
    <button
      onClick={onRemove}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500/40 hover:text-red-400"
    >
      <X size={12} />
    </button>
  </div>
)

// ─── Empty state ─────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/10 flex items-center justify-center mb-6">
      <Brain size={32} className="text-indigo-400" />
    </div>
    <h3 className="text-white text-lg font-semibold mb-2">
      AI-Powered Notes Assistant
    </h3>
    <p className="text-slate-500 text-sm max-w-md leading-relaxed">
      Upload your lecture PDFs and ask questions about them.
      The AI will find relevant content from your notes and generate detailed answers.
    </p>
    <div className="flex flex-wrap justify-center gap-2 mt-6">
      {['Explain this concept', 'Summarize chapter 3', 'Key points for exam'].map((s) => (
        <span
          key={s}
          className="text-xs text-slate-500 bg-white/4 border border-white/6 rounded-full px-3 py-1.5"
        >
          "{s}"
        </span>
      ))}
    </div>
  </div>
)

// ─── Main Notes Page ─────────────────────────────────────────────
const Notes = () => {
  // ── State ──
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // ── Refs ──
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // ── Auto-scroll on new message ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Upload handler ──
  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      setUploadError('Please upload a PDF file')
      setTimeout(() => setUploadError(null), 3000)
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const data = await notesService.uploadPdf(file)
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, chunks: data.total_chunks },
      ])
      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          isUser: false,
          text: `✅ **${file.name}** uploaded successfully!\n\n${data.total_chunks} chunks have been indexed. You can now ask me questions about this document.`,
        },
      ])
    } catch (err) {
      setUploadError(err?.response?.data?.detail || 'Upload failed — is the backend running?')
      setTimeout(() => setUploadError(null), 5000)
    } finally {
      setIsUploading(false)
    }
  }

  // ── Ask question handler ──
  const handleAsk = async (e) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || isAsking) return

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), isUser: true, text: q },
    ])
    setQuestion('')
    setIsAsking(true)

    try {
      const data = await notesService.askQuestion(q)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, isUser: false, text: data.answer },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          text: '❌ Failed to get an answer. Make sure the backend is running and you have uploaded at least one PDF.',
        },
      ])
    } finally {
      setIsAsking(false)
      inputRef.current?.focus()
    }
  }

  // ── Drag & Drop ──
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }
  const handleDragLeave = () => setDragActive(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleUpload(file)
  }

  // ── Remove file pill (UI only) ──
  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Clear chat ──
  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-96px)] flex gap-4">

      {/* ─────────────── LEFT PANEL — Upload & Files ─────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-4">

        {/* Upload Card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-[#0d1526] border rounded-xl p-5 transition-all duration-300
            ${dragActive
              ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
              : 'border-white/6 hover:border-white/10'
            }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Upload size={15} className="text-indigo-400" />
            <h2 className="text-white font-semibold text-sm">Upload Notes</h2>
          </div>

          {/* Drop zone */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-8 border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl flex flex-col items-center gap-3 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={24} className="text-indigo-400 animate-spin" />
                <span className="text-slate-400 text-xs">Processing PDF…</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-300 text-xs font-medium">
                    Drop PDF here or click to browse
                  </p>
                  <p className="text-slate-600 text-[10px] mt-1">
                    Supports lecture notes, textbooks, slides
                  </p>
                </div>
              </>
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              handleUpload(e.target.files[0])
              e.target.value = ''
            }}
          />

          {/* Upload error */}
          {uploadError && (
            <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{uploadError}</p>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-[#0d1526] border border-white/6 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-emerald-400" />
                <h3 className="text-white text-xs font-semibold">
                  Indexed Documents
                </h3>
              </div>
              <span className="text-slate-600 text-[10px]">
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {uploadedFiles.map((f, i) => (
                <FilePill
                  key={`${f.name}-${i}`}
                  name={f.name}
                  chunks={f.chunks}
                  onRemove={() => handleRemoveFile(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tips Card */}
        <div className="bg-[#0d1526] border border-white/6 rounded-xl p-4">
          <h3 className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-3">
            Quick Tips
          </h3>
          <div className="space-y-2.5">
            {[
              { emoji: '📄', text: 'Upload any PDF — lecture notes, textbooks, papers' },
              { emoji: '🧠', text: 'Ask specific questions for the best results' },
              { emoji: '📝', text: 'Try "Summarize..." or "Explain..." prompts' },
              { emoji: '🔍', text: 'The AI searches your notes to find answers' },
            ].map((tip) => (
              <div key={tip.text} className="flex items-start gap-2">
                <span className="text-xs mt-0.5">{tip.emoji}</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────── RIGHT PANEL — Chat ─────────────── */}
      <div className="flex-1 flex flex-col bg-[#0d1526] border border-white/6 rounded-xl overflow-hidden min-w-0">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-sm font-semibold">Notes AI</h2>
              <p className="text-slate-500 text-[11px]">
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''} loaded`
                  : 'Upload a PDF to get started'
                }
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/5"
              title="Clear chat"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg.text} isUser={msg.isUser} />
              ))}

              {/* Thinking indicator */}
              {isAsking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-[#131d35] border border-white/8 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-slate-500 text-xs">Searching your notes…</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleAsk} className="px-4 pb-4">
          <div className={`flex items-end gap-2 bg-[#0a1020] border rounded-xl px-3 py-2 transition-colors
            ${question ? 'border-indigo-500/30' : 'border-white/8'}`}
          >
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAsk(e)
                }
              }}
              placeholder={
                uploadedFiles.length > 0
                  ? 'Ask anything about your notes…'
                  : 'Upload a PDF first, then ask questions…'
              }
              rows={1}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 resize-none outline-none max-h-32 py-1.5 leading-relaxed"
              style={{ fieldSizing: 'content' }}
            />
            <button
              type="submit"
              disabled={!question.trim() || isAsking}
              className="shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white flex items-center justify-center transition-all disabled:cursor-not-allowed"
            >
              {isAsking
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />
              }
            </button>
          </div>
          <p className="text-slate-600 text-[10px] text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}

export default Notes