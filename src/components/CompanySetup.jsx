import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CompanySetup({ profile, onComplete }) {
  const [form, setForm] = useState({
    name: '', address: '', country: '', contact_email: profile?.email || '',
    contact_phone: '', industry: 'Cosmetics',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Company name is required.'); return }
    setLoading(true)
    setError('')
    try {
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .insert([{ ...form, is_active: true }])
        .select().single()
      if (compErr) throw new Error(compErr.message)

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ company_id: company.id, emp_id: 'ADMIN001', updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      if (profErr) throw new Error(profErr.message)

      onComplete(company)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.icon}>🏢</div>
          <div style={s.title}>Set Up Your Company Profile</div>
          <div style={s.sub}>Your account is approved! Please complete your company details to get started.</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Company Name *</label>
            <input style={s.input} placeholder="e.g. Glamour Cosmetics Pvt. Ltd."
              value={form.name} onChange={e => setF('name', e.target.value)} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Industry</label>
            <select style={s.input} value={form.industry} onChange={e => setF('industry', e.target.value)}>
              <option>Cosmetics</option>
              <option>Personal Care</option>
              <option>Skincare</option>
              <option>Haircare</option>
              <option>Fragrance</option>
              <option>OTC Pharmaceuticals</option>
              <option>Other</option>
            </select>
          </div>
          <div style={s.group}>
            <label style={s.label}>Full Address</label>
            <textarea style={{ ...s.input, height: '64px', resize: 'vertical' }}
              placeholder="Factory / Office address…"
              value={form.address} onChange={e => setF('address', e.target.value)} />
          </div>
          <div style={s.row2}>
            <div style={s.group}>
              <label style={s.label}>Country</label>
              <input style={s.input} placeholder="India" value={form.country}
                onChange={e => setF('country', e.target.value)} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Contact Phone</label>
              <input style={s.input} placeholder="+91 XXXXX XXXXX" value={form.contact_phone}
                onChange={e => setF('contact_phone', e.target.value)} />
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Contact Email</label>
            <input style={s.input} type="email" value={form.contact_email}
              onChange={e => setF('contact_email', e.target.value)} />
          </div>

          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Setting up…' : '✅ Complete Setup & Enter Platform'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  wrap:   { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)', padding: '20px' },
  card:   { background: '#fff', borderRadius: '24px', padding: '32px 28px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', maxHeight: '92vh', overflowY: 'auto' },
  header: { textAlign: 'center', marginBottom: '24px' },
  icon:   { fontSize: '44px', marginBottom: '10px' },
  title:  { fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' },
  sub:    { fontSize: '12px', color: '#6B5878', lineHeight: '1.6' },
  group:  { marginBottom: '13px' },
  row2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  label:  { display: 'block', fontSize: '10px', fontWeight: '700', color: '#6B5878', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:  { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1.5px solid #EDE4F0', borderRadius: '9px', outline: 'none', boxSizing: 'border-box', color: '#1E0A2E', background: '#FAF7FC' },
  error:  { background: '#FDEDF1', color: '#8C1F38', fontSize: '12px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #F4A7BC' },
  btn:    { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(123,45,139,0.35)' },
}
