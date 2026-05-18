import { useState, useEffect } from 'react'
import {
  Code2, Brain, Target, Flame, ArrowRight, Zap,
  Search, Loader2, Sparkles, BookOpen, Mic, RefreshCw,
  Upload, Download, FileText, Check, CheckCircle, Info, Sliders, Briefcase
} from 'lucide-react'
import api from '../services/api'

// Lucide icon mapping based on backend recommendations
const ICON_MAPPING = {
  Code2: Code2,
  BookOpen: BookOpen,
  Mic: Mic,
  Brain: Brain
}

const AVAILABLE_COMPANIES = ["Google", "Amazon", "Atlassian", "Razorpay", "Startups"]

const Dsa = () => {
  // Original profile states
  const [username, setUsername] = useState('Abhiraj_chandrawanshi')
  const [searchInput, setSearchInput] = useState('Abhiraj_chandrawanshi')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  // Active workspace states
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' or 'copilot'
  
  // Resume upload states
  const [resumeFile, setResumeFile] = useState(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [extractedSkills, setExtractedSkills] = useState(null)
  
  // Target company selection states
  const [selectedCompanies, setSelectedCompanies] = useState(["Google", "Amazon"])
  
  // Gap analysis states
  const [analyzingGaps, setAnalyzingGaps] = useState(false)
  const [gapAnalysisReport, setGapAnalysisReport] = useState(null)
  
  // Dynamic sheet generation states
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false)
  const [totalQuestions, setTotalQuestions] = useState(30)
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null)
  const [downloadingSheet, setDownloadingSheet] = useState(false)

  // Fetch initial profile on mount
  useEffect(() => {
    fetchProfile(username)
  }, [username])

  const fetchProfile = async (targetUsername) => {
    if (!targetUsername || targetUsername.trim() === '') return
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/dsa/profile/${targetUsername}`)
      setData(response.data)
      // Reset copilot stats on search username change
      setResumeFile(null)
      setExtractedSkills(null)
      setGapAnalysisReport(null)
      setGeneratedRoadmap(null)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to fetch LeetCode profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim() !== '') {
      setUsername(searchInput.trim())
    }
  }

  // Handle drag and drop resume PDF uploads
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      alert("Only PDF resume formats are supported.")
      return
    }
    setResumeFile(file)
    setUploadingResume(true)
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const response = await api.post('/dsa/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setExtractedSkills(response.data.extractedSkills)
    } catch (err) {
      console.error(err)
      alert("Failed to parse the uploaded resume. Please try again.")
      setResumeFile(null)
    } finally {
      setUploadingResume(false)
    }
  }

  const toggleCompanySelection = (company) => {
    if (selectedCompanies.includes(company)) {
      if (selectedCompanies.length > 1) {
        setSelectedCompanies(selectedCompanies.filter(c => c !== company))
      } else {
        alert("Please select at least one target company.")
      }
    } else {
      setSelectedCompanies([...selectedCompanies, company])
    }
  }

  // Trigger dynamic gap analysis logic
  const triggerGapAnalysis = async () => {
    if (!extractedSkills) {
      alert("Please upload your PDF resume first.")
      return
    }
    setAnalyzingGaps(true)
    try {
      const response = await api.post('/dsa/gap-analysis', {
        username: username,
        extractedSkills: extractedSkills,
        targetCompanies: selectedCompanies,
        focusIntensity: "immediate"
      })
      setGapAnalysisReport(response.data.analysis)
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('analysis-results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error(err)
      alert("Failed to conduct AI gap analysis. Please try again.")
    } finally {
      setAnalyzingGaps(false)
    }
  }

  // Generate dynamic question sheets based on weights
  const generateRoadmapSheet = async () => {
    if (!gapAnalysisReport) return
    setGeneratingRoadmap(true)
    try {
      const response = await api.post('/dsa/roadmap/generate', {
        username: username,
        dynamicTopicPriorities: gapAnalysisReport.dynamicTopicPriorities,
        totalQuestionsCount: totalQuestions,
        targetCompanies: selectedCompanies
      })
      setGeneratedRoadmap(response.data)
      setTimeout(() => {
        document.getElementById('prep-sheet-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error(err)
      alert("Failed to compile adaptive coding sheet. Please try again.")
    } finally {
      setGeneratingRoadmap(false)
    }
  }

  // Stream Excel Spreadsheet download using responseType blob
  const downloadExcelSheet = async () => {
    if (!generatedRoadmap) return
    setDownloadingSheet(true)
    try {
      const roadmapId = generatedRoadmap.roadmapId
      const response = await api.get(`/dsa/sheet/export/${roadmapId}`, {
        responseType: 'blob'
      })
      
      // Determine file extension (xlsx or csv) based on content type
      const isCsv = response.headers['content-type']?.includes('text/csv')
      const ext = isCsv ? 'csv' : 'xlsx'
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `StudentOS_Prep_Sheet_${roadmapId}.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("Failed to download spreadsheet. Please try again.")
    } finally {
      setDownloadingSheet(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Header & Search Row ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-semibold flex items-center gap-2">
            DSA Intelligence Engine <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Analyze LeetCode profiles to gauge placement readiness and unlock tailored curriculum tracks.
          </p>
        </div>

        {/* Username Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="LeetCode username..."
              className="w-full bg-[#0d1526] text-white text-xs pl-9 pr-4 py-2.5 rounded-lg border border-white/6 focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              'Analyze'
            )}
          </button>
        </form>
      </div>

      {/* ── Error Notification ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-xs font-medium">{error}</p>
          <button
            onClick={() => fetchProfile(username)}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* ── Main Loading State ── */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-xs">Analyzing LeetCode profile and compiling stats...</p>
        </div>
      )}

      {/* ── Loaded Dashboard ── */}
      {data && (
        <div className="space-y-6">
          {/* Top row: Profile details + placement readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* User details card */}
            <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5 flex items-center gap-4">
              <img
                src={data.avatar || "https://assets.leetcode.com/users/default_avatar.jpg"}
                alt={data.realName}
                className="w-16 h-16 rounded-xl border border-white/10 shrink-0"
                onError={(e) => {
                  e.target.src = "https://assets.leetcode.com/users/default_avatar.jpg"
                }}
              />
              <div className="min-w-0">
                <h3 className="text-white text-lg font-semibold truncate">{data.realName || data.username}</h3>
                <p className="text-slate-500 text-xs mt-0.5">@{data.username}</p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white/4 border border-white/6 px-2.5 py-1 rounded-md">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">LeetCode Rank</span>
                  <span className="text-indigo-400 text-xs font-bold">
                    {data.ranking ? data.ranking.toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall stats counters */}
            <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Total Solved</p>
                <p className="text-white text-2xl font-bold mt-1.5">{data.stats.all}</p>
                <p className="text-slate-600 text-[10px] mt-1">Problems</p>
              </div>
              <div className="border-l border-white/5">
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Easy solved</p>
                <p className="text-emerald-400 text-2xl font-bold mt-1.5">{data.stats.easy}</p>
                <p className="text-slate-600 text-[10px] mt-1">Benchmark: 150</p>
              </div>
              <div className="border-l border-white/5">
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Medium solved</p>
                <p className="text-amber-400 text-2xl font-bold mt-1.5">{data.stats.medium}</p>
                <p className="text-slate-600 text-[10px] mt-1">Benchmark: 200</p>
              </div>
            </div>

            {/* Placement readiness index */}
            <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Target size={15} className="text-emerald-400" />
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Placement Readiness</h4>
                </div>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Calculated based on solved difficulty balance. Aim for **70%+** readiness for core placements.
                </p>
              </div>

              {/* Glowing progress radial circle */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/5"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500 transition-all duration-1000"
                    strokeWidth="3.5"
                    strokeDasharray={`${data.placementReadiness}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-white text-xs font-bold">{data.placementReadiness}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-0.5">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`text-xs font-semibold px-4 py-2 rounded-t-lg transition-colors border-b-2 -mb-0.5 flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'text-indigo-400 border-indigo-500 bg-[#0d1526]/30'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <Code2 size={13} /> Curriculum Analytics
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`text-xs font-semibold px-4 py-2 rounded-t-lg transition-colors border-b-2 -mb-0.5 flex items-center gap-1.5 relative ${
                activeTab === 'copilot'
                  ? 'text-indigo-400 border-indigo-500 bg-[#0d1526]/30'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <Brain size={13} /> AI Placement Copilot Workspace
              <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </button>
          </div>

          {/* ── TAB 1: CURRICULUM ANALYTICS ── */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Topic Tracks Progress Card — 2/3 width */}
              <div className="lg:col-span-2 bg-[#0d1526] border border-white/6 rounded-xl p-5">
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                  <h2 className="text-white font-semibold text-sm">Curriculum Tag Analytics</h2>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">5 Core DSA Tracks</span>
                </div>

                <div className="space-y-5">
                  {data.topics.map((t) => {
                    const pct = Math.round((t.solved / t.total) * 100)
                    return (
                      <div key={t.topic} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">{t.topic} Track</span>
                          <span className="text-slate-500 font-medium">
                            {t.solved} <span className="text-slate-600 font-normal">/ {t.total} solved</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: t.color }}
                            />
                          </div>
                          <span className="text-slate-400 font-bold text-xs w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Recommendations Column — 1/3 width */}
              <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                    <Zap size={14} className="text-indigo-400 animate-pulse" />
                    <h2 className="text-white font-semibold text-sm">AI Recommendation Engine</h2>
                  </div>

                  <div className="space-y-3">
                    {data.recommendations.map((rec) => {
                      const Icon = ICON_MAPPING[rec.icon] || Brain
                      return (
                        <div
                          key={rec.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${rec.bg} ${rec.border} group transition-opacity`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${rec.bg} flex items-center justify-center shrink-0`}>
                            <Icon size={14} className={rec.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold leading-tight">{rec.title}</p>
                            <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">{rec.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: AI PLACEMENT COPILOT WORKSPACE ── */}
          {activeTab === 'copilot' && (
            <div className="space-y-6">
              {/* Input Control Area: Resume + Targets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Drag & Drop PDF Resume Uploader */}
                <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Briefcase size={14} className="text-indigo-400" /> Step 1: Upload Resume
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Upload your technical developer resume in PDF. Our system extracts your career domain, tech stack, and primary languages.
                    </p>
                  </div>

                  <div className="mt-4">
                    {uploadingResume ? (
                      <div className="border border-dashed border-indigo-500/30 bg-indigo-500/5 rounded-lg py-8 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="text-indigo-400 animate-spin" />
                        <p className="text-indigo-300 text-[11px] font-medium">Semantic AI parsing of PDF resume...</p>
                      </div>
                    ) : extractedSkills ? (
                      <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-lg p-3 flex items-start gap-3">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold flex items-center justify-between">
                            Resume Parsed Successfully! 
                            <button 
                              onClick={() => {
                                setResumeFile(null)
                                setExtractedSkills(null)
                              }}
                              className="text-[10px] text-slate-500 hover:text-slate-300"
                            >
                              Reset
                            </button>
                          </p>
                          <div className="mt-2 space-y-1.5 text-[11px]">
                            <p className="text-slate-400"><span className="text-slate-600 font-semibold uppercase">Domain:</span> {extractedSkills.careerDomain}</p>
                            <p className="text-slate-400 truncate"><span className="text-slate-600 font-semibold uppercase">Languages:</span> {extractedSkills.primaryLanguages.join(', ')}</p>
                            <p className="text-slate-400 truncate"><span className="text-slate-600 font-semibold uppercase">Stack:</span> {extractedSkills.techStack.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/1 rounded-lg py-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                        <Upload size={20} className="text-slate-400" />
                        <p className="text-slate-300 text-xs font-medium">Click or Drag PDF Resume</p>
                        <p className="text-slate-600 text-[10px]">PDF format only, max 5MB</p>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleResumeUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* 2. Target Company Chip Selector */}
                <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Target size={14} className="text-indigo-400" /> Step 2: Target Companies
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Select multiple target placements. The AI infers company-specific interview behaviors dynamically.
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COMPANIES.map(company => {
                        const isSelected = selectedCompanies.includes(company)
                        return (
                          <button
                            key={company}
                            onClick={() => toggleCompanySelection(company)}
                            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                                : 'bg-[#090f1d] border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'
                            }`}
                          >
                            {company} {isSelected && <Check size={11} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Trigger AI Gap Analysis Action */}
                  <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-end">
                    <button
                      onClick={triggerGapAnalysis}
                      disabled={analyzingGaps || !extractedSkills}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {analyzingGaps ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Conforming Gap Matrix...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Run AI Gap Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* ── GAP ANALYSIS REPORT INSIGHTS ROW ── */}
              {gapAnalysisReport && (
                <div id="analysis-results-section" className="bg-[#0d1526] border border-white/6 rounded-xl p-5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h2 className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Sparkles className="text-indigo-400 w-4 h-4 animate-pulse" /> AI Gap Analysis Report
                    </h2>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
                      <CheckCircle size={10} /> Multi-Criteria Fused Output
                    </span>
                  </div>

                  {/* Rationale Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#090f1d] border border-white/4 rounded-lg p-3">
                      <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Inferred Target Behaviors</h4>
                      <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">{gapAnalysisReport.inferredCompanyPatterns}</p>
                    </div>
                    <div className="bg-[#090f1d] border border-white/4 rounded-lg p-3">
                      <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Placement Readiness Audit</h4>
                      <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">{gapAnalysisReport.readinessAssessment}</p>
                    </div>
                  </div>

                  {/* Topic Weights Distribution Progress Indicators */}
                  <div>
                    <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-3">Calculated Dynamic Topic Priorities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {Object.entries(gapAnalysisReport.dynamicTopicPriorities).map(([topic, pct]) => {
                        // Matching bar color based on track names
                        const barColors = {
                          "Arrays": "bg-[#6366f1]",
                          "Trees": "bg-[#8b5cf6]",
                          "Graphs": "bg-[#ec4899]",
                          "DP": "bg-[#f59e0b]",
                          "Strings": "bg-[#10b981]"
                        }
                        const barColor = barColors[topic] || "bg-indigo-500"
                        return (
                          <div key={topic} className="bg-[#090f1d] border border-white/4 rounded-lg p-3 flex flex-col justify-between gap-3">
                            <span className="text-slate-400 text-[11px] font-semibold">{topic}</span>
                            <div className="space-y-1">
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-600 font-medium">Priority weight</span>
                                <span className="text-slate-300 font-bold">{pct}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Adaptive Sheet Allocation Parameters Panel */}
                  <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-xs flex items-center gap-1.5">
                        <Sliders size={13} className="text-indigo-400" /> Question Count:
                      </span>
                      <div className="inline-flex rounded-lg bg-white/4 p-0.5 border border-white/5">
                        {[15, 30, 45].map(cnt => (
                          <button
                            key={cnt}
                            onClick={() => setTotalQuestions(cnt)}
                            className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                              totalQuestions === cnt
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={generateRoadmapSheet}
                      disabled={generatingRoadmap}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0 self-end sm:self-auto"
                    >
                      {generatingRoadmap ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Compiling Sheet Pools...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Generate Adaptive Prep Sheet
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── ADAPTIVE PREPARATION SHEET SECTION ── */}
              {generatedRoadmap && (
                <div id="prep-sheet-section" className="bg-[#0d1526] border border-white/6 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3 gap-3">
                    <div>
                      <h2 className="text-white font-semibold text-sm flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-400" /> Personalized DSA Preparation Sheet
                      </h2>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Allocated exact target pools based on priorities: {
                          Object.entries(generatedRoadmap.topicDistribution).map(([t, count]) => `${count} ${t}`).join(', ')
                        }
                      </p>
                    </div>

                    {/* Download Excel Sheet button */}
                    <button
                      onClick={downloadExcelSheet}
                      disabled={downloadingSheet}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      {downloadingSheet ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Fetching Workbook...
                        </>
                      ) : (
                        <>
                          <Download size={13} /> Download Spreadsheet (Excel)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Interactive Table of Dynamic Problems */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 pl-3">Q. ID</th>
                          <th className="py-2.5">Problem Title</th>
                          <th className="py-2.5">Topic</th>
                          <th className="py-2.5">Difficulty</th>
                          <th className="py-2.5">Company Relevance</th>
                          <th className="py-2.5 pr-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/4">
                        {generatedRoadmap.questions.map((q) => {
                          // Diff colors
                          const diffColors = {
                            "Easy": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            "Hard": "bg-red-500/10 text-red-400 border-red-500/20"
                          }
                          const diffColor = diffColors[q.difficulty] || "text-slate-300"
                          return (
                            <tr key={q.questionId} className="text-xs hover:bg-white/1 transition-all">
                              <td className="py-3 pl-3 font-semibold text-slate-500">#{q.questionId}</td>
                              <td className="py-3 font-bold text-white max-w-[200px] truncate">{q.title}</td>
                              <td className="py-3 font-medium text-slate-400">{q.topic}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${diffColor}`}>
                                  {q.difficulty}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex flex-wrap gap-1">
                                  {q.companyTags.map(tag => (
                                    <span key={tag} className="bg-white/4 px-1.5 py-0.5 rounded-md text-[9px] text-slate-400 font-semibold border border-white/5">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 pr-3 text-right">
                                <a
                                  href={q.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-colors group"
                                >
                                  Solve <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                                </a>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dsa
