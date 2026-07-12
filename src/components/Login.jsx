import { useState } from 'react'
import AdminSignup from './AdminSignup'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  if (showSignup) return <AdminSignup onBack={() => setShowSignup(false)} />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await onLogin(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  function fillDemo() { setEmail('demo@beautysureaql.com'); setPassword('Demo@1234') }

  return (
    <div style={s.wrap}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.card}>
        <div style={s.logoArea}>
          <div style={s.logoRing}><span style={{ fontSize: '28px' }}>✦</span></div>
          <div style={s.brandName}>BeautySureAQL</div>
          <div style={s.brandSub}>AQL Inspection Platform</div>
          <div style={s.sopTag}>ISO 2859-1 · BSAQL-QA-SOP-22-F-02</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Work Email</label>
            <input style={s.input} type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Demo account */}
        <div style={s.demoBox}>
          <div style={s.demoTitle}>🧪 Try Demo Account</div>
          <div style={s.demoSub}>Explore all features before signing up</div>
          <button style={s.demoBtn} onClick={fillDemo}>Fill Demo Credentials</button>
        </div>

        <div style={s.divider} />

        {/* Company signup */}
        <div style={s.signupBox}>
          <div style={s.signupTitle}>Want to use this for your company?</div>
          <div style={s.signupSub}>Register as a Company Admin — subject to approval</div>
          <button style={s.signupBtn} onClick={() => setShowSignup(true)}>
            Register Your Company →
          </button>
        </div>

        <div style={s.contact}>
          Questions? <a href="mailto:sainiboyynr@zohomail.in" style={s.link}>sainiboyynr@zohomail.in</a>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)', padding: '20px', position: 'relative', overflow: 'hidden' },
  blob1:      { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: '-100px', left: '-100px', pointerEvents: 'none' },
  blob2:      { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: '-80px', right: '-80px', pointerEvents: 'none' },
  card:       { background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '32px 28px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1 },
  logoArea:   { textAlign: 'center', marginBottom: '24px' },
  logoRing:   { width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 8px 24px rgba(123,45,139,0.35)', color: '#fff' },
  brandName:  { fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '3px' },
  brandSub:   { fontSize: '12px', color: '#6B5878', fontWeight: '500', marginTop: '2px' },
  sopTag:     { display: 'inline-block', marginTop: '6px', fontSize: '10px', background: '#F3E8F7', color: '#7B2D8B', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' },
  group:      { marginBottom: '14px' },
  label:      { display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B5878', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:      { width: '100%', padding: '11px 14px', fontSize: '14px', border: '1.5px solid #EDE4F0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', color: '#1E0A2E', background: '#FAF7FC' },
  error:      { background: '#FDEDF1', color: '#8C1F38', fontSize: '13px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #F4A7BC' },
  btn:        { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(123,45,139,0.35)' },
  demoBox:    { background: 'linear-gradient(135deg, #E0F4F1, #F3E8F7)', borderRadius: '12px', padding: '14px 16px', marginTop: '16px', textAlign: 'center', border: '1px solid #C084D0' },
  demoTitle:  { fontSize: '13px', fontWeight: '700', color: '#1E0A2E', marginBottom: '2px' },
  demoSub:    { fontSize: '11px', color: '#6B5878', marginBottom: '10px' },
  demoBtn:    { padding: '8px 20px', background: 'linear-gradient(135deg, #0F7B6C, #14B8A6)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  divider:    { height: '1px', background: '#EDE4F0', margin: '16px 0' },
  signupBox:  { background: '#FAF7FC', borderRadius: '12px', padding: '14px 16px', textAlign: 'center', border: '1px solid #EDE4F0' },
  signupTitle:{ fontSize: '13px', fontWeight: '700', color: '#1E0A2E', marginBottom: '2px' },
  signupSub:  { fontSize: '11px', color: '#6B5878', marginBottom: '10px' },
  signupBtn:  { padding: '9px 20px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  contact:    { textAlign: 'center', fontSize: '11px', color: '#A494B0', marginTop: '14px' },
  link:       { color: '#7B2D8B', textDecoration: 'none', fontWeight: '600' },
}
