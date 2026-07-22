import { useState, useRef } from 'react'
import { useBreakpoint } from '../hooks/useIsMobile'
import {
  User, Mail, Phone, MapPin, Link2,
  Globe, Award, Save, Camera, Briefcase,
  GraduationCap, Trophy, GitBranch, CheckCircle2,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

// ── Initial Data ───────────────────────────────────────────────────
const INIT_PROFILE = {
  name:     'Alex Johnson',
  degree:   'B.Tech Computer Science',
  email:    'alex.j@email.com',
  phone:    '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  github:   'github.com/alexj',
  linkedin: 'linkedin.com/in/alexj',
  website:  'alexjohnson.dev',
}

const EDUCATION = {
  degree:  'Bachelor of Technology',
  field:   'Computer Science & Engineering',
  school:  'XYZ University',
  period:  '2022 – 2026',
  gpa:     '8.5/10',
}

const EXPERIENCE = [
  {
    id: '1',
    role:    'Software Engineer Intern',
    company: 'Tech Corp Inc.',
    period:  'Jun 2025 – Aug 2025',
    color:   '#EC4899',
  },
]

const ACHIEVEMENTS = [
  { id: 1, icon: Trophy, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', title: 'LeetCode Knight',         sub: '450+ Problems' },
  { id: 2, icon: Trophy, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', title: 'Hackathon Winner',        sub: 'Regional 2025' },
  { id: 3, icon: Award,  color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',  title: 'Open Source Contributor', sub: '50+ PRs' },
  { id: 4, icon: Award,  color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  title: 'Interview Expert',        sub: '20+ Mock Interviews' },
]

// ── Input Field ────────────────────────────────────────────────────
const Field = ({ icon: Icon, value, onChange, placeholder, type = 'text' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '10px',
    background: 'var(--background)',
    border: '1px solid var(--border)',
    transition: 'border-color 0.15s',
  }}
    onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <Icon size={15} style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        fontSize: '13px', color: 'var(--foreground)', fontFamily: 'inherit',
      }}
    />
  </div>
)

// ── Section Card ───────────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <div style={{
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
  }}>
    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
      {title}
    </p>
    {children}
  </div>
)

// ── Main Profile ───────────────────────────────────────────────────
const Profile = () => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const { user, updateUser } = useAuthStore()

  const [profile, setProfile] = useState(() => ({
    ...INIT_PROFILE,
    name: user?.name || INIT_PROFILE.name,
    email: user?.email || INIT_PROFILE.email,
    degree: user?.branch ? `B.Tech ${user.branch}` : INIT_PROFILE.degree,
  }))

  const [isDirty, setIsDirty] = useState(false)
  const [toast, setToast] = useState('')
  const nameInputRef = useRef(null)
  const avatarInputRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const update = (field) => (value) => {
    setProfile(p => ({ ...p, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    updateUser({
      name: profile.name,
      email: profile.email,
      branch: profile.degree.replace('B.Tech ', ''),
    })
    setIsDirty(false)
    showToast('Profile updated successfully!')
  }

  const handleCancel = () => {
    setProfile({
      ...INIT_PROFILE,
      name: user?.name || INIT_PROFILE.name,
      email: user?.email || INIT_PROFILE.email,
      degree: user?.branch ? `B.Tech ${user.branch}` : INIT_PROFILE.degree,
    })
    setIsDirty(false)
    showToast('Changes discarded')
  }

  return (
    <div className="fade-up" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Subtitle ── */}
      <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
        Manage your personal information and preferences
      </p>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── LEFT: Avatar card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Avatar + name */}
          <div style={{
            background: 'var(--background-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            {/* Avatar circle */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={40} color="#fff" />
              </div>
              {/* Hidden file input for avatar upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Avatar upload would be handled here when backend is ready
                    console.log('Avatar selected:', file.name)
                  }
                  e.target.value = ''
                }}
              />
              {/* Camera overlay */}
              <button type="button" onClick={() => avatarInputRef.current?.click()} style={{
                position: 'absolute', bottom: -4, right: -4,
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'var(--primary)', border: '2px solid var(--background-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Camera size={16} color="#fff" />
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                {profile.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                {profile.degree}
              </p>
            </div>

            <button type="button" onClick={() => {
              nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              setTimeout(() => nameInputRef.current?.querySelector('input')?.focus(), 400)
            }} style={{
              width: '100%', padding: '9px', borderRadius: '10px',
              background: 'var(--primary)', color: '#fff',
              border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >
              Edit Profile
            </button>
          </div>

          {/* Social Links */}
          <div style={{
            background: 'var(--background-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>
              Social Links
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: GitBranch, field: 'github',   placeholder: 'github.com/username' },
                { icon: Link2,  field: 'linkedin', placeholder: 'linkedin.com/in/username' },
                { icon: Globe,     field: 'website',  placeholder: 'yourwebsite.com' },
              ].map(({ icon: Icon, field, placeholder }) => (
                <div key={field} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '10px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  transition: 'border-color 0.15s',
                }}>
                  <Icon size={14} style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={profile[field]}
                    onChange={e => update(field)(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '12px', color: 'var(--foreground)', fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Personal Information */}
          <SectionCard title="Personal Information">
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--foreground-muted)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div ref={nameInputRef}>
                  <Field icon={User}   value={profile.name}     onChange={update('name')}     placeholder="Your full name" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--foreground-muted)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <Field icon={Mail}   value={profile.email}    onChange={update('email')}    placeholder="your@email.com" type="email" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--foreground-muted)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <Field icon={Phone}  value={profile.phone}    onChange={update('phone')}    placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--foreground-muted)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Location
                </label>
                <Field icon={MapPin} value={profile.location} onChange={update('location')} placeholder="City, Country" />
              </div>
            </div>
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education">
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '16px', borderRadius: '12px',
              background: 'var(--background)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '3px' }}>
                  {EDUCATION.degree}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', marginBottom: '3px' }}>
                  {EDUCATION.field}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--foreground-subtle)' }}>
                  {EDUCATION.school} • {EDUCATION.period} • GPA: {EDUCATION.gpa}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Experience */}
          <SectionCard title="Experience">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {EXPERIENCE.map(exp => (
                <div key={exp.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '16px', borderRadius: '12px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(236,72,153,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Briefcase size={18} style={{ color: exp.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '3px' }}>
                      {exp.role}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', marginBottom: '3px' }}>
                      {exp.company}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--foreground-subtle)' }}>
                      {exp.period}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Achievements */}
          <SectionCard title="Achievements">
            <div style={{ display: 'grid', gridTemplateColumns: (isMobile || isTablet) ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {ACHIEVEMENTS.map(({ id, icon: Icon, color, bg, title, sub }) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                      {title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            padding: '10px 24px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--foreground)', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--background-hover)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none',
            background: isDirty ? 'var(--primary)' : 'rgba(124,58,237,0.4)',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: isDirty ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
          onMouseEnter={e => { if (isDirty) e.currentTarget.style.background = '#6d28d9' }}
          onMouseLeave={e => { if (isDirty) e.currentTarget.style.background = 'var(--primary)' }}
        >
          <Save size={14} /> Save Changes
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

export default Profile