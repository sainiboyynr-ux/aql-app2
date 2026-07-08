import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function TeamManager({ profile, company }) {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ full_name: '', email: '', emp_id: '', role: 'qa_executive', password: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true })
    if (data) setMembers(data)
    setLoading(false)
  }

  async function addMember(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { full_name: form.full_name, role: form.role } },
      })
      if (authErr) throw new Error(authErr.message)
      const userId = authData?.user?.id
      if (!userId) throw new Error('Could not create user.')

      // Assign to company
      await supabase.from('profiles').update({
        company_id: company.id,
        full_name:  form.full_name,
        emp_id:     form.emp_id,
        role:       form.role,
        status:     'active',
      }).eq('id', userId)

      setSuccess(`✅ ${form.full_name} added successfully.`)
      setForm({ full_name: '', email: '', emp_id: '', role: 'qa_executive', password: '' })
      setShowAdd(false)
      fetchMembers()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function toggleStatus(member) {
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    await supabase.from('profiles').update({ status: newStatus }).eq('id', member.id)
    fetchMembers()
  }

  const ROLE_CONFIG = {
    company_admin: { label: 'Company Admin', color: '#7B2D8B', bg: '#F3E8F7' },
    qa_manager:    { label: 'QA Manager',    color: '#0F7B6C', bg: '#E0F4F1' },
    qa_executive:  { label: 'QA Executive',  color: '#185FA5', bg: '#E6F1FB' },
    demo:          { label: 'Demo',          color: '#666',    bg: '#F5F5F5' },
  }

  return (
    <div style={s.wrap}>
      {/* Company banner */}
      <div style={s.banner}>
        <div style={s.bannerGlow} />
        <div>
          <div style={s.bannerTitle}>👥 Team Management</div>
          <div style={s.bannerSub}>{company?.name}</div>
        </div>
        <button style={s.addBtn} onClick={() => { setShowAdd(!showAdd); setError(''); setSuccess('') }}>
          {showAdd ? '✕ Cancel' : '＋ Add Member'}
        </button>
      </div>

      {success && <div style={s.successBanner}>{success}</div>}

      {/* Add member form */}
      {showAdd && (
        <div style={s.card}>
          <div style={s.cardTitle}>➕ Add Team Member</div>
          <form onSubmit={addMember}>
            <div style={s.row2}>
              <div style={s.group}>
                <label style={s.label}>Full Name *</label>
                <input style={s.input} placeholder="e.g. Priya Sharma" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div style={s.group}>
                <label style={s.label}>Employee ID</label>
                <input style={s.input} placeholder="EMP001" value={form.emp_id}
                  onChange={e => setForm(f => ({ ...f, emp_id: e.target.value }))} />
              </div>
            </div>
            <div style={s.group}>
              <label style={s.label}>Work Email *</label>
              <input style={s.input} type="email" placeholder="priya@company.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div style={s.row2}>
              <div style={s.group}>
                <label style={s.label}>Role *</label>
                <select style={s.input} value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="qa_executive">QA Executive</option>
                  <option value="qa_manager">QA Manager</option>
                </select>
              </div>
              <div style={s.group}>
                <label style={s.label}>Temporary Password *</label>
                <input style={s.input} type="password" placeholder="Min 8 chars" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
            </div>
            {error && <div style={s.error}>{error}</div>}
            <button style={s.btn} type="submit" disabled={saving}>
              {saving ? 'Adding…' : '✅ Add to Team'}
            </button>
          </form>
        </div>
      )}

      {/* Team list */}
      <div style={s.card}>
        <div style={s.cardTitle}>Current Team ({members.length})</div>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#A494B0' }}>Loading…</div>
        ) : members.map(m => {
          const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.qa_executive
          const isMe = m.id === profile.id
          return (
            <div key={m.id} style={s.memberRow}>
              <div style={{ ...s.avatar, background: `linear-gradient(135deg, ${rc.color}88, ${rc.color})` }}>
                {(m.full_name || m.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.memberName}>{m.full_name || '—'} {isMe && <span style={s.youTag}>You</span>}</div>
                <div style={s.memberEmail}>{m.email || '—'} · {m.emp_id || 'No ID'}</div>
              </div>
              <div style={s.memberRight}>
                <span style={{ ...s.roleBadge, background: rc.bg, color: rc.color }}>{rc.label}</span>
                {!isMe && (
                  <button style={{ ...s.statusBtn, background: m.status === 'active' ? '#FDEDF1' : '#E6F4EC', color: m.status === 'active' ? '#8C1F38' : '#1A6B3A' }}
                    onClick={() => toggleStatus(m)}>
                    {m.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Role guide */}
      <div style={s.card}>
        <div style={s.cardTitle}>📋 Role Permissions</div>
        {[
          { role: 'QA Executive', perms: 'Create inspections, save drafts, submit reports, download PDF' },
          { role: 'QA Manager',   perms: 'All QA Executive permissions + view all team inspections, approve/reject submissions' },
          { role: 'Company Admin',perms: 'All permissions + manage team members, edit company profile' },
        ].map(r => (
          <div key={r.role} style={s.permRow}>
            <div style={s.permRole}>{r.role}</div>
            <div style={s.permDesc}>{r.perms}</div>
          </div>
        ))}
      </div>

      <div style={{ height: '80px' }} />
    </div>
  )
}

const s = {
  wrap:         { padding: '12px', overflowY: 'auto' },
  banner:       { background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', borderRadius: '16px', padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(123,45,139,0.3)' },
  bannerGlow:   { position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', top: '-30px', right: '80px', pointerEvents: 'none' },
  bannerTitle:  { fontSize: '15px', fontWeight: '700', color: '#fff' },
  bannerSub:    { fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' },
  addBtn:       { padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  successBanner:{ background: '#E6F4EC', color: '#1A6B3A', padding: '10px 16px', borderRadius: '10px', marginBottom: '12px', fontSize: '13px', fontWeight: '600', border: '1px solid #A8D9B8' },
  card:         { background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', border: '1px solid #EDE4F0', boxShadow: '0 2px 10px rgba(123,45,139,0.06)' },
  cardTitle:    { fontSize: '13px', fontWeight: '700', color: '#1E0A2E', marginBottom: '14px' },
  row2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  group:        { marginBottom: '12px' },
  label:        { display: 'block', fontSize: '10px', fontWeight: '700', color: '#6B5878', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:        { width: '100%', padding: '9px 11px', fontSize: '13px', border: '1.5px solid #EDE4F0', borderRadius: '9px', outline: 'none', boxSizing: 'border-box', color: '#1E0A2E', background: '#FAF7FC' },
  error:        { background: '#FDEDF1', color: '#8C1F38', fontSize: '12px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #F4A7BC' },
  btn:          { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  memberRow:    { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #FAF7FC' },
  avatar:       { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff', flexShrink: 0 },
  memberName:   { fontSize: '13px', fontWeight: '600', color: '#1E0A2E', display: 'flex', alignItems: 'center', gap: '6px' },
  memberEmail:  { fontSize: '11px', color: '#A494B0', marginTop: '1px' },
  memberRight:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  roleBadge:    { fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' },
  statusBtn:    { fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  youTag:       { fontSize: '9px', background: '#F3E8F7', color: '#7B2D8B', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' },
  permRow:      { padding: '8px 0', borderBottom: '1px solid #FAF7FC' },
  permRole:     { fontSize: '12px', fontWeight: '700', color: '#7B2D8B', marginBottom: '2px' },
  permDesc:     { fontSize: '11px', color: '#6B5878', lineHeight: '1.5' },
}
