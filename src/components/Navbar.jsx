export default function Navbar({ active, setActive, profile, onLogout }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'new',       label: 'New AQL',   icon: '＋' },
    { id: 'history',   label: 'History',   icon: '☰' },
  ]

  const titles = { dashboard: 'Dashboard', new: 'New Inspection', history: 'Inspection History' }

  return (
    <>
      {/* Top bar */}
      <div style={s.topbar}>
        <div style={s.brandBlock}>
          <div style={s.brandDot} />
          <div>
            <div style={s.topTitle}>{titles[active]}</div>
            <div style={s.topSub}>Esme Consumer Pvt. Ltd.</div>
          </div>
        </div>
        <div style={s.userChip}>
          <div style={s.avatar}>
            {(profile?.full_name || 'Q').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={s.userName}>{profile?.full_name || 'Inspector'}</div>
            <div style={s.userRole}>{profile?.role === 'qa_manager' ? '🔑 QA Manager' : '🔬 QA Executive'}</div>
          </div>
          <button style={s.logoutBtn} onClick={onLogout} title="Sign out">⏻</button>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={s.navbar}>
        {tabs.map(t => (
          <button
            key={t.id}
            style={{ ...s.navBtn, ...(active === t.id ? s.navActive : {}) }}
            onClick={() => setActive(t.id)}
          >
            <span style={{ ...s.navIcon, ...(active === t.id ? s.navIconActive : {}) }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

const s = {
  topbar:      { background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 100%)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 12px rgba(45,8,69,0.3)' },
  brandBlock:  { display: 'flex', alignItems: 'center', gap: '10px' },
  brandDot:    { width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #F9A8D4, #C084D0)', flexShrink: 0 },
  topTitle:    { fontSize: '14px', fontWeight: '700', color: '#fff' },
  topSub:      { fontSize: '10px', color: 'rgba(255,255,255,0.55)' },
  userChip:    { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar:      { width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #F9A8D4, #C0395A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 },
  userName:    { fontSize: '11px', fontWeight: '600', color: '#fff' },
  userRole:    { fontSize: '9px', color: 'rgba(255,255,255,0.6)' },
  logoutBtn:   { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', fontSize: '14px', color: '#fff', cursor: 'pointer', padding: '4px 6px', marginLeft: '4px' },
  navbar:      { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #EDE4F0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', zIndex: 10, boxShadow: '0 -4px 20px rgba(123,45,139,0.08)' },
  navBtn:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 0 10px', border: 'none', background: 'transparent', fontSize: '10px', color: '#A494B0', cursor: 'pointer', fontWeight: '500', transition: 'color 0.15s' },
  navActive:   { color: '#7B2D8B' },
  navIcon:     { fontSize: '18px', transition: 'transform 0.15s' },
  navIconActive:{ transform: 'scale(1.15)' },
}
