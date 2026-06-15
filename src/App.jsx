import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import InspectionForm from './components/InspectionForm'
import History from './components/History'

export default function App() {
  const { user, profile, loading, login, logout } = useAuth()
  const [activeTab, setActiveTab]   = useState('dashboard')
  const [formOpen, setFormOpen]     = useState(false)
  const [editingId, setEditingId]   = useState(null)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FB', color: '#185FA5', fontSize: '16px', fontWeight: '600' }}>
      Loading ESME AQL…
    </div>
  )

  if (!user) return <Login onLogin={login} />

  function openNew() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openDraft(id) {
    setEditingId(id)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setActiveTab('dashboard')
  }

  return (
    <div style={{ background: '#F4F6FB', minHeight: '100vh' }}>
      <Navbar active={activeTab} setActive={setActiveTab} profile={profile} onLogout={logout} />

      <div style={{ paddingTop: '56px', paddingBottom: '64px', minHeight: '100vh' }}>
        {activeTab === 'dashboard' && (
          <Dashboard profile={profile} onStartNew={openNew} onOpenDraft={openDraft} />
        )}
        {activeTab === 'new' && (
          <Dashboard profile={profile} onStartNew={openNew} onOpenDraft={openDraft} />
        )}
        {activeTab === 'history' && (
          <History profile={profile} />
        )}
      </div>

      {formOpen && (
        <InspectionForm
          inspectionId={editingId}
          profile={profile}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
