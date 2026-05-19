import { useState, useRef } from 'react'
import {
  Plus, Search, Sparkles, Star, Trash2,
  Calendar, Tag, BookOpen, Upload,
} from 'lucide-react'

// ── Types / Mock Data ──────────────────────────────────────────────
const INIT_NOTES = [
  {
    id: '1',
    title: 'DBMS Normalization',
    content: 'AI-generated summary of database normalization concepts including 1NF, 2NF, and 3NF. Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.\n\n1NF: Eliminate repeating groups, ensure atomic values.\n2NF: Remove partial dependencies on the primary key.\n3NF: Remove transitive dependencies.\n\nBCNF is a stronger version of 3NF that handles certain anomalies that 3NF does not.',
    date: '2026-05-17',
    tags: ['DBMS', 'Important'],
    aiGenerated: true,
    starred: true,
  },
  {
    id: '2',
    title: 'Dynamic Programming Patterns',
    content: 'Common DP patterns: memoization, tabulation, state transition...\n\nTop-down (Memoization): Recursive approach with caching.\nBottom-up (Tabulation): Iterative approach building from base cases.\n\nCommon patterns:\n- 0/1 Knapsack\n- Unbounded Knapsack\n- Longest Common Subsequence\n- Matrix Chain Multiplication',
    date: '2026-05-16',
    tags: ['DSA', 'DP'],
    aiGenerated: false,
    starred: false,
  },
  {
    id: '3',
    title: 'OS Scheduling Algorithms',
    content: 'FCFS, SJF, Round Robin, Priority Scheduling...\n\nFCFS: First Come First Served — simple but can cause convoy effect.\nSJF: Shortest Job First — optimal average waiting time but requires knowing burst time.\nRound Robin: Time quantum based, good for time-sharing systems.\nPriority: Each process has priority, can cause starvation.',
    date: '2026-05-15',
    tags: ['OS', 'Exam'],
    aiGenerated: true,
    starred: true,
  },
]

// Tag color map
const TAG_COLORS = {
  DBMS:      { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  Important: { bg: 'rgba(236,72,153,0.12)', color: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  DSA:       { bg: 'rgba(6,182,212,0.12)',  color: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
  DP:        { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.25)' },
  OS:        { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Exam:      { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
}

const getTagStyle = (tag) => TAG_COLORS[tag] || {
  bg: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: 'rgba(124,58,237,0.2)',
}

const TagPill = ({ tag }) => {
  const s = getTagStyle(tag)
  return (
    <span style={{
      fontSize: '11px', fontWeight: 500,
      padding: '2px 8px', borderRadius: '6px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {tag}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────
const Notes = () => {
  const [notes,        setNotes]        = useState(INIT_NOTES)
  const [selectedId,   setSelectedId]   = useState(INIT_NOTES[0].id)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [editTitle,    setEditTitle]    = useState(INIT_NOTES[0].title)
  const [editContent,  setEditContent]  = useState(INIT_NOTES[0].content)
  const [isDirty,      setIsDirty]      = useState(false)
  const [isUploading,  setIsUploading]  = useState(false)

  // ── Hidden file input ref ──
  const fileInputRef = useRef(null)

  const selectedNote = notes.find(n => n.id === selectedId) || notes[0]

  // Filter notes by search
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Select a note
  const handleSelect = (note) => {
    setSelectedId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
    setIsDirty(false)
  }

  // ── NEW: Open file explorer on button click ──
  const handleNewNote = () => {
    fileInputRef.current?.click()
  }

  // ── NEW: Handle file selected from OS explorer ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result

      // Strip title from first line if it looks like a heading (# Title)
      const lines = content.split('\n')
      let title = file.name.replace(/\.[^/.]+$/, '') // default: filename without extension
      let body  = content

      if (lines[0]?.startsWith('# ')) {
        title = lines[0].replace(/^#\s+/, '').trim()
        body  = lines.slice(1).join('\n').trimStart()
      }

      const newNote = {
        id: Date.now().toString(),
        title,
        content: body,
        date: new Date().toISOString().split('T')[0],
        tags: [],
        aiGenerated: false,
        starred: false,
      }

      setNotes(prev => [newNote, ...prev])
      handleSelect(newNote)
      setIsUploading(false)
    }

    reader.onerror = () => {
      console.error('Failed to read file')
      setIsUploading(false)
    }

    // Read plain text files (.txt, .md, .js, .py, etc.)
    reader.readAsText(file)

    // Reset the input so the same file can be re-selected later
    e.target.value = ''
  }

  // Save
  const handleSave = () => {
    setNotes(notes.map(n =>
      n.id === selectedId ? { ...n, title: editTitle, content: editContent } : n
    ))
    setIsDirty(false)
  }

  // Cancel
  const handleCancel = () => {
    setEditTitle(selectedNote.title)
    setEditContent(selectedNote.content)
    setIsDirty(false)
  }

  // Toggle star
  const handleStar = () => {
    setNotes(notes.map(n =>
      n.id === selectedId ? { ...n, starred: !n.starred } : n
    ))
  }

  // Delete
  const handleDelete = () => {
    const remaining = notes.filter(n => n.id !== selectedId)
    setNotes(remaining)
    if (remaining.length > 0) handleSelect(remaining[0])
  }

  // AI Enhance
  const handleAIEnhance = () => {
    const enhanced = editContent + '\n\n✨ [AI Enhanced]\n• Key concepts identified and structured\n• Summary added for quick revision\n• Related topics linked for better understanding'
    setEditContent(enhanced)
    setIsDirty(true)
  }

  const card = {
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0', height: 'calc(100vh - 56px - 48px)' }}>

      {/* ── Hidden file input — accepts text/markdown/code files ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.text,.js,.ts,.py,.java,.c,.cpp,.cs,.go,.rs,.html,.css,.json,.yaml,.yml,.xml,.csv,.log"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            AI Notes
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
            Smart note-taking with AI assistance
          </p>
        </div>
        <button
          onClick={handleNewNote}
          disabled={isUploading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px',
            background: isUploading ? 'rgba(124,58,237,0.5)' : 'var(--primary)',
            color: '#fff',
            fontSize: '14px', fontWeight: 600, border: 'none', cursor: isUploading ? 'wait' : 'pointer',
            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!isUploading) { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
          onMouseLeave={e => { if (!isUploading) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'none' } }}
        >
          {isUploading ? <Upload size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
          {isUploading ? 'Loading...' : 'New Note'}
        </button>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', flex: 1, minHeight: 0 }}>

        {/* ── LEFT: Note list ── */}
        <div style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '0 12px', height: '40px', borderRadius: '10px',
            background: 'var(--background)',
            border: '1px solid var(--border)',
          }}>
            <Search size={14} style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: '13px', color: 'var(--foreground)', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Note cards */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}
               className="scrollbar-hide">
            {filtered.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <BookOpen size={28} style={{ color: 'var(--foreground-subtle)' }} />
                <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>No notes found</p>
              </div>
            ) : (
              filtered.map(note => {
                const isActive = note.id === selectedId
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelect(note)}
                    style={{
                      padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                      background: isActive ? 'rgba(124,58,237,0.1)' : 'var(--background)',
                      border: `1px solid ${isActive ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--background-hover)'
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--background)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>
                        {note.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                        {note.aiGenerated && <Sparkles size={13} style={{ color: '#EC4899' }} />}
                        {note.starred    && <Star     size={13} style={{ color: '#06B6D4', fill: '#06B6D4' }} />}
                      </div>
                    </div>

                    {/* Preview */}
                    <p style={{
                      fontSize: '12px', color: 'var(--foreground-muted)',
                      lineHeight: 1.5, marginBottom: '10px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {note.content}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {note.tags.slice(0, 2).map(tag => <TagPill key={tag} tag={tag} />)}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--foreground-subtle)', flexShrink: 0 }}>
                        {note.date}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor ── */}
        <div style={{ ...card, padding: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedNote ? (
            <>
              {/* Editor header */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: '16px', paddingBottom: '16px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Editable title */}
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => { setEditTitle(e.target.value); setIsDirty(true) }}
                    style={{
                      fontSize: '26px', fontWeight: 700, color: 'var(--foreground)',
                      background: 'transparent', border: 'none', outline: 'none',
                      width: '100%', fontFamily: 'inherit', letterSpacing: '-0.02em',
                      marginBottom: '10px',
                    }}
                    placeholder="Note title..."
                  />

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ color: 'var(--foreground-muted)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>
                        {selectedNote.date}
                      </span>
                    </div>
                    {selectedNote.tags.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={13} style={{ color: 'var(--foreground-muted)' }} />
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {selectedNote.tags.map(tag => <TagPill key={tag} tag={tag} />)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Star + Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={handleStar}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border)', background: 'var(--background)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(6,182,212,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <Star
                      size={16}
                      style={{
                        color: selectedNote.starred ? '#06B6D4' : 'var(--foreground-muted)',
                        fill: selectedNote.starred ? '#06B6D4' : 'none',
                      }}
                    />
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border)', background: 'var(--background)',
                      cursor: 'pointer', transition: 'all 0.15s', color: 'var(--foreground-muted)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground-muted)'; e.currentTarget.style.background = 'var(--background)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Content area */}
              <textarea
                value={editContent}
                onChange={e => { setEditContent(e.target.value); setIsDirty(true) }}
                placeholder="Start writing your notes..."
                className="scrollbar-hide"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  resize: 'none', fontSize: '15px', lineHeight: 1.7,
                  color: 'var(--foreground)', fontFamily: 'inherit',
                  minHeight: 0,
                }}
              />

              {/* Footer actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '16px', marginTop: '8px',
                borderTop: '1px solid var(--border)',
              }}>
                {/* AI Enhance */}
                <button
                  onClick={handleAIEnhance}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px', borderRadius: '10px', cursor: 'pointer',
                    background: 'rgba(236,72,153,0.1)',
                    border: '1px solid rgba(236,72,153,0.25)',
                    color: '#EC4899', fontSize: '13px', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,72,153,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(236,72,153,0.1)'}
                >
                  <Sparkles size={15} />
                  AI Enhance
                </button>

                {/* Cancel + Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '9px 20px', borderRadius: '10px', cursor: 'pointer',
                      background: 'var(--background)', color: 'var(--foreground)',
                      border: '1px solid var(--border)', fontSize: '13px', fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--background-hover)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--background)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '9px 20px', borderRadius: '10px', cursor: 'pointer',
                      background: isDirty ? 'var(--primary)' : 'rgba(124,58,237,0.4)',
                      color: '#fff', border: 'none',
                      fontSize: '13px', fontWeight: 600,
                      boxShadow: isDirty ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (isDirty) e.currentTarget.style.background = '#6d28d9' }}
                    onMouseLeave={e => { if (isDirty) e.currentTarget.style.background = 'var(--primary)' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <BookOpen size={40} style={{ color: 'var(--foreground-subtle)' }} />
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--foreground)' }}>No note selected</p>
              <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>Select a note or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notes