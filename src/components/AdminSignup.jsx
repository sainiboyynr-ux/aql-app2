import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminSignup({ onBack }) {
  const [step, setStep]       = useState(1) // 1=form, 2=check email
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    company_name: '', company_country: '', phone: '',
  })

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!form.company_name.trim()) { setError('Company name is required.'); return }

    setLoading(true)
    try {
      // 1. Create Supabase auth user — role=company_admin, standard email confirmation
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, role: 'company_admin' },
          emailRedirectTo: `${window.location.origin}`,
        },
      })
      if (authErr) throw new Error(authErr.message)

      const userId = authData?.user?.id
      if (!userId) throw new Error('Could not create account. Please try again.')

      // 2. Create the company immediately, linked to this admin
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .insert([{
          name:          form.company_name,
          country:       form.company_country,
          contact_email: form.email,
          contact_phone: form.phone,
          is_active:     true,
        }])
        .select().single()
      if (compErr) throw new Error(compErr.message)

      // 3. Link company to the new admin's profile
      //    (works once the profile row exists via the DB trigger;
      //     if the session isn't confirmed yet this silently no-ops
      //     and CompanySetup will handle it after email confirmation)
      await supabase.from('profiles').update({
        company_id: company.id,
        emp_id:     'ADMIN001',
      }).eq('id', userId)

      setStep(2)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (step === 2) return (
    <div style={s.wrap}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📧</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#7B2D8B', marginBottom: '8px' }}>
            Check Your Inbox!
          </div>
          <div style={{ fontSize: '13px', color: '#6B5878', lineHeight: '1.7', marginBottom: '20px' }}>
            We've sent a confirmation link to<br /><strong>{form.email}</strong><br /><br />
            Click the link in that email to activate your account, then come back and log in.
          </div>
          <div style={s.pillRow}>
            <span style={s.pill}>✅ Account Created</span>
            <span style={{ ...s.pill, background: '#FEF3E2', color: '#7A4A00' }}>📧 Confirm Email</span>
          </div>
          <button style={s.backBtn} onClick={onBack}>← Back to Login</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.card}>
        <div style={s.header}>
          <button style={s.backLink} onClick={onBack}>← Back</button>
          <div style={s.logoRing}><span style={{ fontSize: '22px' }}>🏢</span></div>
          <div style={s.brandName}>Company Registration</div>
          <div style={s.brandSub}>Create your Admin account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.sectionLabel}>👤 Your Details</div>
          <div style={s.group}>
            <label style={s.label}>Full Name *</label>
            <input style={s.input} placeholder="e.g. Rahul Sharma" value={form.full_name}
              onChange={e => setF('full_name', e.target.value)} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Work Email *</label>
            <input style={s.input} type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setF('email', e.target.value)} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Phone Number</label>
            <input style={s.input} placeholder="+91 XXXXX XXXXX" value={form.phone}
              onChange={e => setF('phone', e.target.value)} />
          </div>
          <div style={s.row2}>
            <div style={s.group}>
              <label style={s.label}>Password *</label>
              <input style={s.input} type="password" placeholder="Min 8 chars" value={form.password}
                onChange={e => setF('password', e.target.value)} required />
            </div>
            <div style={s.group}>
              <label style={s.label}>Confirm Password *</label>
              <input style={s.input} type="password" placeholder="Repeat" value={form.confirm_password}
                onChange={e => setF('confirm_password', e.target.value)} required />
            </div>
          </div>

          <div style={s.sectionLabel}>🏢 Company Details</div>
          <div style={s.group}>
            <label style={s.label}>Company Name *</label>
            <input style={s.input} placeholder="e.g. Glamour Cosmetics Pvt. Ltd." value={form.company_name}
              onChange={e => setF('company_name', e.target.value)} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Country</label>
            <input style={s.input} placeholder="e.g. India" value={form.company_country}
              onChange={e => setF('company_country', e.target.value)} />
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Creating Account…' : '🚀 Create Admin Account'}
          </button>
        </form>

        <div style={s.note}>
          You'll receive a confirmation email — click the link there to activate your account.
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)', padding: '20px', position: 'relative', overflow: 'hidden' },
  blob1:       { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: '-100px', left: '-100px', pointerEvents: 'none' },
  blob2:       { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: '-80px', right: '-80px', pointerEvents: 'none' },
  card:        { background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1, maxHeight: '92vh', overflowY: 'auto' },
  header:      { textAlign: 'center', marginBottom: '20px' },
  backLink:    { background: 'none', border: 'none', color: '#7B2D8B', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'block', marginBottom: '12px' },
  logoRing:    { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 8px 20px rgba(123,45,139,0.3)' },
  brandName:   { fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  brandSub:    { fontSize: '11px', color: '#6B5878', marginTop: '2px' },
  sectionLabel:{ fontSize: '11px', fontWeight: '800', color: '#7B2D8B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px', padding: '6px 10px', background: '#F3E8F7', borderRadius: '6px', borderLeft: '3px solid #7B2D8B' },
  group:       { marginBottom: '12px' },
  row2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  label:       { display: 'block', fontSize: '10px', fontWeight: '700', color: '#6B5878', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:       { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1.5px solid #EDE4F0', borderRadius: '9px', outline: 'none', boxSizing: 'border-box', color: '#1E0A2E', background: '#FAF7FC' },
  error:       { background: '#FDEDF1', color: '#8C1F38', fontSize: '12px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #F4A7BC' },
  btn:         { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(123,45,139,0.35)', marginTop: '4px' },
  note:        { fontSize: '11px', color: '#A494B0', textAlign: 'center', marginTop: '14px', lineHeight: '1.6' },
  pillRow:     { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  pill:        { fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px', background: '#E6F4EC', color: '#1A6B3A' },
  backBtn:     { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
}
