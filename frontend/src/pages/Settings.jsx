import { useState } from 'react'
import {
  Palette, Bell, Shield, Globe,
  Moon, Sun, Zap, Lock, Database,
  BookOpen, Mic, Trophy, CheckCircle,
  Save, CheckCircle2,
} from 'lucide-react'
import useUIStore from '../store/uiStore'

/* ── shared styles ─────────────────────────────────────────────────────────── */
const sectionStyle = {
  background: 'var(--background-card, #1A1229)',
  border: '1px solid var(--border, rgba(124,58,237,0.2))',
  borderRadius: 16, overflow: 'hidden', marginBottom: 16,
}
const rowStyle = (last) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: last ? 'none' : '1px solid var(--border, rgba(124,58,237,0.1))',
  flexWrap: 'wrap', gap: 10,
})

/* ── toggle ────────────────────────────────────────────────────────────────── */
const Toggle = ({ on, onChange, ariaLabel }) => (
  <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={ariaLabel} style={{
    width: 44, height: 24, borderRadius: 999, flexShrink: 0,
    background: on ? '#7C3AED' : 'rgba(255,255,255,0.1)',
    border: 'none', cursor: 'pointer', position: 'relative',
    transition: 'background 0.2s',
    boxShadow: on ? '0 0 0 3px rgba(124,58,237,0.2)' : 'none',
  }}>
    <span style={{
      position: 'absolute', top: 3, left: on ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    }} />
  </button>
)

/* ── icon box ──────────────────────────────────────────────────────────────── */
const IconBox = ({ icon: Icon, color }) => (
  <div style={{
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    background: color + '22',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Icon size={16} style={{ color }} />
  </div>
)

/* ── row left side ─────────────────────────────────────────────────────────── */
const RowLeft = ({ icon, color, title, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    {icon && <IconBox icon={icon} color={color} />}
    <div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground, #F8FAFC)', margin: 0 }}>{title}</p>
      {desc && <p style={{ fontSize: 12, color: 'var(--foreground-muted, #94A3B8)', margin: '2px 0 0' }}>{desc}</p>}
    </div>
  </div>
)

/* ── ghost / primary action btn ───────────────────────────────────────────── */
const Btn = ({ label, onClick, primary }) => (
  <button type="button" onClick={onClick} style={{
    padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', flexShrink: 0,
    background: primary ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.07)',
    color: primary ? '#fff' : 'var(--foreground, #F8FAFC)',
    transition: 'opacity 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  >{label}</button>
)

/* ── section header ────────────────────────────────────────────────────────── */
const SHead = ({ icon: Icon, iconBg, iconColor, title, desc }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--border, rgba(124,58,237,0.12))',
  }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} style={{ color: iconColor }} />
    </div>
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground, #F8FAFC)', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: 'var(--foreground-muted, #94A3B8)', margin: '2px 0 0' }}>{desc}</p>
    </div>
  </div>
)

/* ── main ──────────────────────────────────────────────────────────────────── */
export default function Settings() {
  const { theme, toggleTheme } = useUIStore()
  const isDark = theme === 'dark'

  const [saved,            setSaved]            = useState(false)
  const [toast,            setToast]            = useState('')
  const [animations,       setAnimations]       = useState(true)
  const [studyReminders,   setStudyReminders]   = useState(true)
  const [interviewAlerts,  setInterviewAlerts]  = useState(true)
  const [achievements,     setAchievements]     = useState(false)
  const [dailyDigest,      setDailyDigest]      = useState(false)
  const [twoFactor,        setTwoFactor]        = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleSave = () => {
    setSaved(true)
    showToast('Settings saved successfully!')
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="fade-up" style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground, #F8FAFC)', margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--foreground-muted, #94A3B8)', margin: 0 }}>Manage your app preferences and configurations</p>
      </div>

      {/* ── APPEARANCE ── */}
      <div style={sectionStyle}>
        <SHead icon={Palette} iconBg="rgba(124,58,237,0.15)" iconColor="#7C3AED" title="Appearance" desc="Customize the look and feel" />

        {/* Theme row — wired to real toggleTheme */}
        <div style={rowStyle(false)}>
          <RowLeft icon={isDark ? Moon : Sun} color="#7C3AED" title="Theme" desc={`Currently using ${isDark ? 'dark' : 'light'} mode`} />
          <Btn label={`Toggle to ${isDark ? 'Light' : 'Dark'}`} onClick={toggleTheme} primary />
        </div>

        {/* Animations */}
        <div style={rowStyle(true)}>
          <RowLeft icon={Zap} color="#F59E0B" title="Animations" desc="Enable smooth transitions" />
          <Toggle on={animations} onChange={(val) => { setAnimations(val); showToast(`Animations ${val ? 'enabled' : 'disabled'}`) }} ariaLabel="Toggle Animations" />
        </div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      <div style={sectionStyle}>
        <SHead icon={Bell} iconBg="rgba(236,72,153,0.15)" iconColor="#EC4899" title="Notifications" desc="Manage notification preferences" />

        {[
          { icon: BookOpen,     color: '#7C3AED', title: 'Study Reminders',    desc: 'Get notified about scheduled study sessions',  val: studyReminders,   set: setStudyReminders },
          { icon: Mic,          color: '#06B6D4', title: 'Interview Alerts',   desc: 'Reminders for upcoming mock interviews',        val: interviewAlerts,  set: setInterviewAlerts },
          { icon: Trophy,       color: '#F59E0B', title: 'Achievement Unlocks',desc: 'Celebrate when you earn new badges',            val: achievements,     set: setAchievements },
          { icon: CheckCircle,  color: '#22C55E', title: 'Daily Digest',       desc: 'Receive a summary of your daily progress',      val: dailyDigest,      set: setDailyDigest },
        ].map(({ icon, color, title, desc, val, set }, i, arr) => (
          <div key={title} style={rowStyle(i === arr.length - 1)}>
            <RowLeft icon={icon} color={color} title={title} desc={desc} />
            <Toggle on={val} onChange={(newVal) => { set(newVal); showToast(`${title} ${newVal ? 'enabled' : 'disabled'}`) }} ariaLabel={`Toggle ${title}`} />
          </div>
        ))}
      </div>

      {/* ── PRIVACY & SECURITY ── */}
      <div style={sectionStyle}>
        <SHead icon={Shield} iconBg="rgba(6,182,212,0.15)" iconColor="#06B6D4" title="Privacy & Security" desc="Control your data and security settings" />

        <div style={rowStyle(false)}>
          <RowLeft icon={Lock} color="#7C3AED" title="Change Password" desc="Last changed 3 months ago" />
          <Btn label="Update" onClick={() => showToast('Password reset link sent to your registered email!')} />
        </div>
        <div style={rowStyle(false)}>
          <RowLeft icon={Database} color="#EC4899" title="Data Export" desc="Download all your data" />
          <Btn label="Export" onClick={() => showToast('Data compilation started. Export file download will begin shortly.')} />
        </div>
        <div style={rowStyle(true)}>
          <RowLeft icon={Shield} color="#06B6D4" title="Two-Factor Authentication" desc="Add an extra layer of security" />
          <Toggle on={twoFactor} onChange={(val) => { setTwoFactor(val); showToast(`Two-Factor Authentication ${val ? 'enabled' : 'disabled'}`) }} ariaLabel="Toggle Two-Factor Authentication" />
        </div>
      </div>

      {/* ── LANGUAGE & REGION ── */}
      <div style={sectionStyle}>
        <SHead icon={Globe} iconBg="rgba(34,197,94,0.15)" iconColor="#22C55E" title="Language & Region" desc="Set your preferred language and timezone" />

        <div style={rowStyle(false)}>
          <RowLeft title="Language" desc="English (US)" />
          <Btn label="Change" onClick={() => showToast('Language selection modal under development.')} />
        </div>
        <div style={rowStyle(true)}>
          <RowLeft title="Timezone" desc="Pacific Time (PT)" />
          <Btn label="Change" onClick={() => showToast('Timezone selection modal under development.')} />
        </div>
      </div>

      {/* save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
        <button type="button" onClick={handleSave} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 28px', borderRadius: 11, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', border: 'none',
          background: saved ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
          color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.35)', transition: 'background 0.3s',
        }}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save All Changes</>}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--background-card)',
          border: '1px solid var(--primary)',
          color: 'var(--foreground)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeUp 0.2s ease-out'
        }}>
          <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast}</span>
        </div>
      )}

    </div>
  )
}