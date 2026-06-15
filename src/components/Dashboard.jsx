import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard({ profile, onStartNew, onOpenDraft }) {
  const [stats, setStats]   = useState({ total: 0, submitted: 0, accepted: 0, rejected: 0, hold: 0 })
  const [drafts, setDrafts] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setDrafts(data.filter(i => i.status === 'draft'))
      setRecent(data.filter(i => i.status === 'submitted').slice(0, 5))
      setStats({
        total:     data.length,
        submitted: data.filter(i => i.status === 'submitted').length,
        accepted:  data.filter(i => i.overall_decision === 'ACCEPT').length,
        rejected:  data.filter(i => i.overall_decision === 'REJECT').length,
        hold:      data.filter(i => i.overall_decision === 'HOLD').length,
      })
    }
    setLoading(false)
  }

  const decBadge = (dec) => {
    const map = { ACCEPT: { bg: '#EAF3DE', color: '#27500A' }, REJECT: { bg: '#FCEBEB', color: '#791F1F' }, HOLD: { bg: '#FAEEDA', color: '#633806' } }
    const s = map[dec] || { bg: '#F1EFE8', color: '#5F5E5A' }
    return <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{dec}</span>
  }

  if (loading) return <div style={styles.loading}>Loading…</div>

  return (
    <div style={styles.wrap}>
      {/* Stats */}
      <div style={styles.statGrid}>
        {[
          { label: 'Total', value: stats.total, color: '#185FA5' },
          { label: 'Submitted', value: stats.submitted, color: '#185FA5' },
          { label: 'Accepted', value: stats.accepted, color: '#27500A' },
          { label: 'Rejected', value: stats.rejected, color: '#791F1F' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Start new */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Start AQL Inspection</div>
        <div style={styles.cardSub}>ISO 2859-1 · Critical 0% · Major 1% · Minor 4%</div>
        <button style={styles.btnPrimary} onClick={onStartNew}>Begin New Session</button>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Saved Drafts</div>
          {drafts.map(d => (
            <div key={d.id} style={styles.listRow} onClick={() => onOpenDraft(d.id)}>
              <div>
                <div style={styles.listProd}>{d.product_name || 'Untitled'}</div>
                <div style={styles.listMeta}>Batch: {d.batch_no || '—'} · {new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
              </div>
              <span style={{ ...styles.badge, background: '#F1EFE8', color: '#5F5E5A' }}>DRAFT</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent submitted */}
      {recent.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Recent Submissions</div>
          {recent.map(r => (
            <div key={r.id} style={styles.listRow}>
              <div>
                <div style={styles.listProd}>{r.product_name}</div>
                <div style={styles.listMeta}>Batch: {r.batch_no} · {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              {decBadge(r.overall_decision)}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: '80px' }} />
    </div>
  )
}

const styles = {
  wrap:       { padding: '12px', overflowY: 'auto' },
  loading:    { padding: '40px', textAlign: 'center', color: '#999' },
  statGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' },
  statCard:   { background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #EEF0F6' },
  statLabel:  { fontSize: '11px', color: '#999', marginBottom: '4px' },
  statVal:    { fontSize: '26px', fontWeight: '700' },
  card:       { background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #EEF0F6', marginBottom: '12px' },
  cardTitle:  { fontSize: '14px', fontWeight: '600', color: '#1A1A2E', marginBottom: '4px' },
  cardSub:    { fontSize: '12px', color: '#999', marginBottom: '14px' },
  btnPrimary: { width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  listRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F4F6FB', cursor: 'pointer' },
  listProd:   { fontSize: '13px', fontWeight: '500', color: '#1A1A2E' },
  listMeta:   { fontSize: '11px', color: '#999', marginTop: '2px' },
  badge:      { fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em' },
}
