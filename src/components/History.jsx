import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { generatePDF } from '../utils/pdfReport'

export default function History({ profile, company }) {
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
      .eq('company_id', company?.id || '00000000-0000-0000-0000-000000000000')
      .order('submitted_at', { ascending: false })
    if (data) setRecords(data)
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? records : records.filter(r => r.overall_decision === filter)

  const FILTERS = [
    { id: 'ALL',    label: 'All',      icon: '📋', activeColor: '#7B2D8B' },
    { id: 'ACCEPT', label: 'Accepted', icon: '✅', activeColor: '#1A6B3A' },
    { id: 'HOLD',   label: 'Hold',     icon: '⚠️', activeColor: '#7A4A00' },
    { id: 'REJECT', label: 'Rejected', icon: '❌', activeColor: '#8C1F38' },
  ]

  const DEC_CONFIG = {
    ACCEPT: { bg: '#E6F4EC', color: '#1A6B3A', border: '#A8D9B8', icon: '✅' },
    REJECT: { bg: '#FDEDF1', color: '#8C1F38', border: '#F4A7BC', icon: '❌' },
    HOLD:   { bg: '#FEF3E2', color: '#7A4A00', border: '#F5C97A', icon: '⚠️' },
  }

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
      <div style={{ color: '#A494B0', fontSize: '13px' }}>Loading history…</div>
    </div>
  )

  return (
    <div style={s.wrap}>
      {/* Header banner */}
      <div style={s.banner}>
        <div style={s.bannerGlow} />
        <div style={s.bannerText}>
          <div style={s.bannerTitle}>Inspection History</div>
          <div style={s.bannerSub}>{records.length} total submissions</div>
        </div>
        <div style={s.bannerIcon}>📊</div>
      </div>

      {/* Filter tabs */}
      <div style={s.filterRow}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            style={{
              ...s.filterBtn,
              ...(filter === f.id ? { background: f.activeColor, color: '#fff', border: `1px solid ${f.activeColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } : {}),
            }}
            onClick={() => setFilter(f.id)}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔍</div>
          <div style={s.emptyText}>No {filter === 'ALL' ? '' : filter.toLowerCase()} inspections found</div>
        </div>
      ) : (
        filtered.map(r => {
          const cfg = DEC_CONFIG[r.overall_decision] || DEC_CONFIG['HOLD']
          return (
            <div key={r.id} style={s.card}>
              {/* Top row */}
              <div style={s.cardTop}>
                <div style={{ ...s.decIcon, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.prodName}>{r.product_name}</div>
                  <div style={s.batchMeta}>Batch: {r.batch_no}</div>
                </div>
                <span style={{ ...s.badge, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {r.overall_decision}
                </span>
              </div>

              {/* Stats row */}
              <div style={s.statsGrid}>
                <div style={s.statBox}>
                  <div style={s.statBoxLabel}>Batch Size</div>
                  <div style={s.statBoxVal}>{Number(r.batch_size).toLocaleString()}</div>
                </div>
                <div style={s.statBox}>
                  <div style={s.statBoxLabel}>Sample ({r.sample_letter})</div>
                  <div style={s.statBoxVal}>{r.sample_size}</div>
                </div>
                <div style={{ ...s.statBox, background: r.defect_pct_major > 1 ? '#FDEDF1' : '#E6F4EC' }}>
                  <div style={s.statBoxLabel}>Major %</div>
                  <div style={{ ...s.statBoxVal, color: r.defect_pct_major > 1 ? '#8C1F38' : '#1A6B3A' }}>
                    {Number(r.defect_pct_major).toFixed(2)}%
                  </div>
                </div>
                <div style={{ ...s.statBox, background: r.defect_pct_minor > 4 ? '#FDEDF1' : '#E6F4EC' }}>
                  <div style={s.statBoxLabel}>Minor %</div>
                  <div style={{ ...s.statBoxVal, color: r.defect_pct_minor > 4 ? '#8C1F38' : '#1A6B3A' }}>
                    {Number(r.defect_pct_minor).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={s.cardFooter}>
                <div style={s.inspector}>
                  👤 {r.profiles?.full_name || 'Unknown'} · {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <button style={s.pdfBtn} onClick={() => generatePDF(r, r.profiles?.full_name || profile?.full_name)}>
                  ⬇ PDF
                </button>
              </div>
            </div>
          )
        })
      )}

      <div style={{ height: '80px' }} />
    </div>
  )
}

const s = {
  wrap:         { padding: '12px', overflowY: 'auto' },
  banner:       { background: 'linear-gradient(135deg, #0F7B6C, #14B8A6)', borderRadius: '16px', padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,123,108,0.3)' },
  bannerGlow:   { position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: '-30px', right: '60px', pointerEvents: 'none' },
  bannerText:   { zIndex: 1 },
  bannerTitle:  { fontSize: '16px', fontWeight: '700', color: '#fff' },
  bannerSub:    { fontSize: '11px', color: 'rgba(255,255,255,0.7)' },
  bannerIcon:   { fontSize: '32px', zIndex: 1 },
  filterRow:    { display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' },
  filterBtn:    { padding: '7px 14px', borderRadius: '20px', border: '1px solid #EDE4F0', background: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: '#6B5878', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  empty:        { textAlign: 'center', padding: '60px 20px' },
  emptyIcon:    { fontSize: '40px', marginBottom: '12px' },
  emptyText:    { fontSize: '13px', color: '#A494B0' },
  card:         { background: '#fff', borderRadius: '14px', border: '1px solid #EDE4F0', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(123,45,139,0.06)' },
  cardTop:      { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  decIcon:      { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
  prodName:     { fontSize: '13px', fontWeight: '700', color: '#1E0A2E' },
  batchMeta:    { fontSize: '11px', color: '#A494B0', marginTop: '1px' },
  badge:        { fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '12px' },
  statBox:      { background: '#FAF7FC', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' },
  statBoxLabel: { fontSize: '9px', color: '#A494B0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' },
  statBoxVal:   { fontSize: '13px', fontWeight: '700', color: '#1E0A2E' },
  cardFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #FAF7FC', paddingTop: '10px' },
  inspector:    { fontSize: '11px', color: '#A494B0' },
  pdfBtn:       { padding: '7px 16px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(123,45,139,0.3)' },
}
