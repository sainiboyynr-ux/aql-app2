import { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await onLogin(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      {/* Decorative blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoRing}>
            <div style={s.logoInner}>✦</div>
          </div>
          <div style={s.brandName}>ESME</div>
          <div style={s.brandSub}>Quality Assurance Portal</div>
          <div style={s.sopTag}>ESME-QA-SOP-22-F-02 · ISO 2859-1</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Work Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@esme.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={s.divider}><span>Finished Goods AQL Inspection</span></div>

        <div style={s.pillRow}>
          <span style={s.pill}>Critical 0%</span>
          <span style={{ ...s.pill, background: '#FEF3E2', color: '#7A4A00' }}>Major 1%</span>
          <span style={{ ...s.pill, background: '#E0F4F1', color: '#0F7B6C' }}>Minor 4%</span>
        </div>

        <div style={s.hint}>Contact your QA Manager for login credentials</div>
      </div>
    </div>
  )
}

const s = {
  wrap:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)', padding: '20px', position: 'relative', overflow: 'hidden' },
  blob1:     { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: '-100px', left: '-100px', pointerEvents: 'none' },
  blob2:     { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: '-80px', right: '-80px', pointerEvents: 'none' },
  card:      { background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '36px 32px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1 },
  logoArea:  { textAlign: 'center', marginBottom: '28px' },
  logoRing:  { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(123,45,139,0.35)' },
  logoInner: { fontSize: '28px', color: '#fff' },
  brandName: { fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '3px' },
  brandSub:  { fontSize: '13px', color: '#6B5878', fontWeight: '500', marginTop: '2px' },
  sopTag:    { display: 'inline-block', marginTop: '8px', fontSize: '10px', background: '#F3E8F7', color: '#7B2D8B', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', letterSpacing: '0.04em' },
  group:     { marginBottom: '16px' },
  label:     { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B5878', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:     { width: '100%', padding: '11px 14px', fontSize: '14px', border: '1.5px solid #EDE4F0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', color: '#1E0A2E', background: '#FAF7FC', transition: 'border-color 0.2s' },
  error:     { background: '#FDEDF1', color: '#8C1F38', fontSize: '13px', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #F4A7BC' },
  btn:       { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '4px', letterSpacing: '0.03em', boxShadow: '0 4px 16px rgba(123,45,139,0.35)' },
  divider:   { textAlign: 'center', margin: '20px 0 14px', fontSize: '11px', color: '#A494B0', position: 'relative' },
  pillRow:   { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' },
  pill:      { fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: '#FDEDF1', color: '#8C1F38', letterSpacing: '0.04em' },
  hint:      { textAlign: 'center', fontSize: '11px', color: '#A494B0' },
}
