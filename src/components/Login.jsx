import { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await onLogin(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcon}>✔</div>
          <div style={styles.logoName}>ESME QA Portal</div>
          <div style={styles.logoSub}>AQL Inspection System · ESME-QA-SOP-22-F-02</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Work Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@esme.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.hint}>
          Contact your QA Manager to get login credentials.
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FB', padding: '20px' },
  card:     { background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logoBox:  { textAlign: 'center', marginBottom: '28px' },
  logoIcon: { width: '56px', height: '56px', background: '#E6F1FB', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '24px', color: '#185FA5' },
  logoName: { fontSize: '20px', fontWeight: '600', color: '#1A1A2E', marginBottom: '4px' },
  logoSub:  { fontSize: '12px', color: '#777', lineHeight: '1.5' },
  group:    { marginBottom: '16px' },
  label:    { display: 'block', fontSize: '12px', fontWeight: '500', color: '#555', marginBottom: '6px' },
  input:    { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #DDE2EC', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#1A1A2E' },
  error:    { background: '#FCEBEB', color: '#A32D2D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px' },
  btn:      { width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  hint:     { textAlign: 'center', fontSize: '11px', color: '#AAA', marginTop: '20px', lineHeight: '1.6' },
}
