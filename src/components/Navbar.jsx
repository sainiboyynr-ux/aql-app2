export default function Navbar({ active, setActive, profile, onLogout }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'new',       label: 'New AQL',   icon: '＋' },
    { id: 'history',   label: 'History',   icon: '☰' },
  ]

  return (
    <>
      {/* Top bar */}
      <div style={styles.topbar}>
        <div>
          <div style={styles.topTitle}>
            {active === 'dashboard' ? 'Dashboard' : active === 'new' ? 'New Inspection' : 'Inspection History'}
          </div>
          <div style={styles.topSub}>Esme Consumer Pvt. Ltd.</div>
        </div>
        <div style={styles.userBox}>
          <div style={styles.userName}>{profile?.full_name || 'Inspector'}</div>
          <div style={styles.userRole}>{profile?.role === 'qa_manager' ? 'QA Manager' : 'QA Executive'}</div>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout} title="Sign out">⏻</button>
      </div>

      {/* Bottom nav */}
      <div style={styles.navbar}>
        {tabs.map(t => (
          <button
            key={t.id}
            style={{ ...styles.navBtn, ...(active === t.id ? styles.navActive : {}) }}
            onClick={() => setActive(t.id)}
          >
            <span style={styles.navIcon}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

const styles = {
  topbar:     { background: '#fff', borderBottom: '1px solid #EEF0F6', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  topTitle:   { fontSize: '15px', fontWeight: '600', color: '#1A1A2E' },
  topSub:     { fontSize: '11px', color: '#999' },
  userBox:    { flex: 1, textAlign: 'center' },
  userName:   { fontSize: '12px', fontWeight: '600', color: '#185FA5' },
  userRole:   { fontSize: '10px', color: '#999' },
  logoutBtn:  { background: 'none', border: 'none', fontSize: '18px', color: '#999', cursor: 'pointer', padding: '4px 8px' },
  navbar:     { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #EEF0F6', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', zIndex: 10 },
  navBtn:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 0 10px', border: 'none', background: 'transparent', fontSize: '10px', color: '#AAA', cursor: 'pointer' },
  navActive:  { color: '#185FA5', borderTop: '2px solid #185FA5' },
  navIcon:    { fontSize: '18px' },
}
