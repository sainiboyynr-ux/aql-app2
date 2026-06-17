import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import InspectionForm from './components/InspectionForm'
import History from './components/History'

export default function App() {
  const { user, profile, loading, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [formOpen, setFormOpen]   = useState(false)
  const [editingId, setEditingId] = useState(null)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 50%, #C0395A 100%)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✦</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '3px' }}>ESME</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>Loading QA Portal…</div>
    </div>
  )

  if (!user) return <Login onLogin={login} />

  function openNew() { setEditingId(null); setFormOpen(true) }
  function openDraft(id) { setEditingId(id); setFormOpen(true) }
  function closeForm() { setFormOpen(false); setEditingId(null); setActiveTab('dashboard') }

  return (
    <div style={{ background: '#FAF7FC', minHeight: '100vh' }}>
      <Navbar active={activeTab} setActive={setActiveTab} profile={profile} onLogout={logout} />
      <div style={{ paddingTop: '56px', paddingBottom: '64px', minHeight: '100vh' }}>
        {(activeTab === 'dashboard' || activeTab === 'new') && (
          <Dashboard profile={profile} onStartNew={openNew} onOpenDraft={openDraft} />
        )}
        {activeTab === 'history' && <History profile={profile} />}
      </div>
      {formOpen && (
        <InspectionForm inspectionId={editingId} profile={profile} onClose={closeForm} />
      )}
    </div>
  )
}
