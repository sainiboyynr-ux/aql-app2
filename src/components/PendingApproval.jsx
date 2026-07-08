export default function PendingApproval({ profile, onLogout }) {
  return (
    <div style={s.wrap}>
      <div style={s.blob1}/><div style={s.blob2}/>
      <div style={s.card}>
        <div style={{ fontSize: '52px', textAlign: 'center', marginBottom: '16px' }}>⏳</div>
        <div style={s.title}>Account Pending Approval</div>
        <div style={s.sub}>
          Hi <strong>{profile?.full_name || 'there'}</strong>, your Company Admin account is currently under review.
        </div>
        <div style={s.steps}>
          <div style={s.step}>
            <span style={{ ...s.stepDot, background: '#22C55E' }}>✓</span>
            <span>Account registered successfully</span>
          </div>
          <div style={s.step}>
            <span style={{ ...s.stepDot, background: '#D97706' }}>⏳</span>
            <span>Waiting for platform administrator approval</span>
          </div>
          <div style={{ ...s.step, opacity: 0.4 }}>
            <span style={{ ...s.stepDot, background: '#A494B0' }}>3</span>
            <span>Access granted — set up company profile</span>
          </div>
          <div style={{ ...s.step, opacity: 0.4 }}>
            <span style={{ ...s.stepDot, background: '#A494B0' }}>4</span>
            <span>Add team members and start inspections</span>
          </div>
        </div>
        <div style={s.infoBox}>
          <div style={s.infoTitle}>What happens next?</div>
          <div style={s.infoText}>
            The platform administrator will review your request and send an approval email to <strong>{profile?.email}</strong>. Approvals are typically completed within 24 hours.
          </div>
        </div>
        <div style={s.contact}>
          For urgent queries contact: <a href="mailto:sainiboyynr@zohomail.in" style={s.link}>sainiboyynr@zohomail.in</a>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  )
}

const s = {
  wrap:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)', padding: '20px', position: 'relative', overflow: 'hidden' },
  blob1:     { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: '-100px', left: '-100px', pointerEvents: 'none' },
  blob2:     { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: '-80px', right: '-80px', pointerEvents: 'none' },
  card:      { background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '36px 28px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', zIndex: 1, position: 'relative' },
  title:     { fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', marginBottom: '8px' },
  sub:       { fontSize: '13px', color: '#6B5878', textAlign: 'center', lineHeight: '1.6', marginBottom: '24px' },
  steps:     { marginBottom: '20px' },
  step:      { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', fontSize: '13px', color: '#1E0A2E', borderBottom: '1px solid #FAF7FC' },
  stepDot:   { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: '700', flexShrink: 0 },
  infoBox:   { background: '#F3E8F7', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #C084D0' },
  infoTitle: { fontSize: '12px', fontWeight: '700', color: '#7B2D8B', marginBottom: '6px' },
  infoText:  { fontSize: '12px', color: '#6B5878', lineHeight: '1.6' },
  contact:   { textAlign: 'center', fontSize: '11px', color: '#A494B0', marginBottom: '16px' },
  link:      { color: '#7B2D8B', fontWeight: '600', textDecoration: 'none' },
  logoutBtn: { width: '100%', padding: '12px', background: 'transparent', color: '#A494B0', border: '1px solid #EDE4F0', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' },
}
