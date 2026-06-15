import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { generatePDF } from '../utils/pdfReport'

export default function History({ profile }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')

  useEffect(() => { fetchRecords() }, [])

  async function fetchRecords() {
    setLoading(true)
    const { data } = await supabase
      .from('inspections')
      .select('*, profiles(full_name, emp_id)')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
    if (data) setRecords(data)
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? records : records.filter(r => r.overall_decision === filter)

  const decBadge = (dec) => {
    const map = {
      ACCEPT: { bg: '#EAF3DE', color: '#27500A' },
      REJECT: { bg: '#FCEBEB', color: '#791F1F' },
      HOLD:   { bg: '#FAEEDA', color: '#633806' },
    }
    const s = map[dec] || { bg: '#EEE', color: '#555' }
    return <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{dec}</span>
  }

  if (loading) return <div style={styles.loading}>Loading history…</div>

  return (
    <div style={styles.wrap}>
      {/* Filter tabs */}
      <div style={styles.filterRow}>
        {['ALL', 'ACCEPT', 'HOLD', 'REJECT'].map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📋</div>
          <div>No {filter === 'ALL' ? '' : filter} inspections found</div>
        </div>
      ) : (
        filtered.map(r => (
          <div key={r.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.prodName}>{r.product_name}</div>
                <div style={styles.meta}>Batch: {r.batch_no} · Size: {Number(r.batch_size).toLocaleString()} units</div>
              </div>
              {decBadge(r.overall_decision)}
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Sample</span>
                <span style={styles.statVal}>{r.sample_size} ({r.sample_letter})</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Major %</span>
                <span style={{ ...styles.statVal, color: r.defect_pct_major > 1 ? '#A32D2D' : '#27500A' }}>
                  {Number(r.defect_pct_major).toFixed(2)}%
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Minor %</span>
                <span style={{ ...styles.statVal, color: r.defect_pct_minor > 4 ? '#A32D2D' : '#27500A' }}>
                  {Number(r.defect_pct_minor).toFixed(2)}%
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Critical</span>
                <span style={{ ...styles.statVal, color: r.defect_pct_critical > 0 ? '#A32D2D' : '#27500A' }}>
                  {r.defect_pct_critical}
                </span>
              </div>
            </div>

            <div style={styles.cardBottom}>
              <div style={styles.inspector}>
                👤 {r.profiles?.full_name || 'Unknown'} · {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <button
                style={styles.pdfBtn}
                onClick={() => generatePDF(r, r.profiles?.full_name || profile?.full_name)}
              >
                ⬇ PDF
              </button>
            </div>
          </div>
        ))
      )}
      <div style={{ height: '80px' }} />
    </div>
  )
}

const styles = {
  wrap:        { padding: '12px', overflowY: 'auto' },
  loading:     { padding: '40px', textAlign: 'center', color: '#999' },
  filterRow:   { display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' },
  filterBtn:   { padding: '6px 14px', borderRadius: '20px', border: '1px solid #DDE2EC', background: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#666', whiteSpace: 'nowrap' },
  filterActive:{ background: '#185FA5', color: '#fff', border: '1px solid #185FA5' },
  empty:       { textAlign: 'center', padding: '60px 20px', color: '#BBB', fontSize: '14px' },
  emptyIcon:   { fontSize: '36px', marginBottom: '10px' },
  card:        { background: '#fff', borderRadius: '12px', border: '1px solid #EEF0F6', padding: '14px 16px', marginBottom: '10px' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  prodName:    { fontSize: '14px', fontWeight: '600', color: '#1A1A2E', marginBottom: '2px' },
  meta:        { fontSize: '11px', color: '#999' },
  badge:       { fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', background: '#F7F8FC', borderRadius: '8px', padding: '10px', marginBottom: '10px' },
  statItem:    { display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' },
  statLabel:   { fontSize: '10px', color: '#999' },
  statVal:     { fontSize: '13px', fontWeight: '600', color: '#1A1A2E' },
  cardBottom:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  inspector:   { fontSize: '11px', color: '#999' },
  pdfBtn:      { padding: '6px 14px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
}
