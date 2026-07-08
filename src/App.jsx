import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import InspectionForm from './components/InspectionForm'
import History from './components/History'
import TeamManager from './components/TeamManager'
import CompanySetup from './components/CompanySetup'
import PendingApproval from './components/PendingApproval'

export default function App() {
  const { user, profile, company, loading, login, logout, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [formOpen, setFormOpen]   = useState(false)
  const [editingId, setEditingId] = useState(null)

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✦</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '3px' }}>ESME</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>Loading AQL Platform…</div>
    </div>
  )

  // ── Not logged in ────────────────────────────────────────
  if (!user) return <Login onLogin={login} />

  // ── Pending approval ─────────────────────────────────────
  if (profile?.status === 'pending_approval') {
    return <PendingApproval profile={profile} onLogout={logout} />
  }

  // ── Suspended ────────────────────────────────────────────
  if (profile?.status === 'suspended') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845, #C0395A)', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚫</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#8C1F38', marginBottom: '8px' }}>Account Suspended</div>
        <div style={{ fontSize: '13px', color: '#6B5878', marginBottom: '20px', lineHeight: '1.6' }}>
          Your account has been suspended. Please contact the administrator at <a href="mailto:sainiboyynr@zohomail.in" style={{ color: '#7B2D8B' }}>sainiboyynr@zohomail.in</a>
        </div>
        <button style={{ width: '100%', padding: '12px', background: '#EDE4F0', color: '#6B5878', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }} onClick={logout}>Sign Out</button>
      </div>
    </div>
  )

  // ── Company admin approved but no company yet ─────────────
  if (profile?.role === 'company_admin' && !company) {
    return <CompanySetup profile={profile} onComplete={() => refreshProfile()} />
  }

  // ── Main app ─────────────────────────────────────────────
  function openNew()    { setEditingId(null); setFormOpen(true) }
  function openDraft(id){ setEditingId(id);   setFormOpen(true) }
  function closeForm()  { setFormOpen(false); setEditingId(null); setActiveTab('dashboard') }

  const isAdmin = profile?.role === 'company_admin' || profile?.role === 'platform_admin'

  return (
    <div style={{ background: '#FAF7FC', minHeight: '100vh' }}>
      <Navbar active={activeTab} setActive={setActiveTab} profile={profile} company={company} onLogout={logout} />

      <div style={{ paddingTop: '56px', paddingBottom: '64px', minHeight: '100vh' }}>
        {(activeTab === 'dashboard' || activeTab === 'new') && (
          <Dashboard profile={profile} company={company} onStartNew={openNew} onOpenDraft={openDraft} />
        )}
        {activeTab === 'history' && <History profile={profile} company={company} />}
        {activeTab === 'team' && isAdmin && <TeamManager profile={profile} company={company} />}
      </div>

      {formOpen && (
        <InspectionForm inspectionId={editingId} profile={profile} company={company} onClose={closeForm} />
      )}
    </div>
  )
}
