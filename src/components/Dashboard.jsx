import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard({ profile, company, onStartNew, onOpenDraft }) {
  const [stats, setStats]     = useState({ total: 0, submitted: 0, accepted: 0, rejected: 0 })
  const [drafts, setDrafts]   = useState([])
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (company?.id || profile?.role === 'demo') fetchData() }, [company])

  async function fetchData() {
    setLoading(true)
    let query = supabase.from('inspections').select('*').order('created_at', { ascending: false })
    if (company?.id) query = query.eq('company_id', company.id)
    const { data } = await query
    if (data) {
      setDrafts(data.filter(i => i.status === 'draft'))
      setRecent(data.filter(i => i.status === 'submitted').slice(0, 5))
      setStats({
        total:     data.length,
        submitted: data.filter(i => i.status === 'submitted').length,
        accepted:  data.filter(i => i.overall_decision === 'ACCEPT').length,
        rejected:  data.filter(i => i.overall_decision === 'REJECT').length,
      })
    }
    setLoading(false)
  }

  const STAT_CARDS = [
    { label: 'Total',     value: stats.total,     icon: '📋', grad: 'linear-gradient(135deg, #7B2D8B, #A855C7)' },
    { label: 'Submitted', value: stats.submitted,  icon: '📤', grad: 'linear-gradient(135deg, #0F7B6C, #14B8A6)' },
    { label: 'Accepted',  value: stats.accepted,   icon: '✅', grad: 'linear-gradient(135deg, #1A6B3A, #22C55E)' },
    { label: 'Rejected',  value: stats.rejected,   icon: '❌', grad: 'linear-gradient(135deg, #8C1F38, #C0395A)' },
  ]

  const decBadge = (dec) => {
    const map = {
      ACCEPT: { bg: '#E6F4EC', color: '#1A6B3A', border: '#A8D9B8' },
      REJECT: { bg: '#FDEDF1', color: '#8C1F38', border: '#F4A7BC' },
      HOLD:   { bg: '#FEF3E2', color: '#7A4A00', border: '#F5C97A' },
    }
    const m = map[dec] || { bg: '#F3E8F7', color: '#7B2D8B', border: '#C084D0' }
    return <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: m.bg, color: m.color, border: `1px solid ${m.border}`, letterSpacing: '0.04em' }}>{dec}</span>
  }

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>✦</div>
      <div style={{ color: '#A494B0', fontSize: '13px' }}>Loading…</div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.welcomeBanner}>
        <div style={s.welcomeGlow} />
        <div style={s.welcomeText}>
          <div style={s.welcomeHi}>Good day, {profile?.full_name?.split(' ')[0] || 'Inspector'} 👋</div>
          <div style={s.welcomeSub}>{company?.name || 'Demo Mode'}</div>
        </div>
        <div style={{ fontSize: '32px', zIndex: 1 }}>🔬</div>
      </div>

      <div style={s.statGrid}>
        {STAT_CARDS.map(c => (
          <div key={c.label} style={{ ...s.statCard, background: c.grad }}>
            <div style={s.statIcon}>{c.icon}</div>
            <div style={s.statVal}>{c.value}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={s.rulesStrip}>
        <div style={s.ruleItem}><span style={{ ...s.ruleDot, background: '#C0395A' }} /><span>Critical = 0%</span></div>
        <div style={s.ruleDivider} />
        <div style={s.ruleItem}><span style={{ ...s.ruleDot, background: '#B8860B' }} /><span>Major ≤ 1%</span></div>
        <div style={s.ruleDivider} />
        <div style={s.ruleItem}><span style={{ ...s.ruleDot, background: '#0F7B6C' }} /><span>Minor ≤ 4%</span></div>
      </div>

      <button style={s.bigBtn} onClick={onStartNew}>
        <span style={{ fontSize: '28px', color: '#fff', lineHeight: 1 }}>＋</span>
        <div>
          <div style={s.bigBtnTitle}>Begin New AQL Inspection</div>
          <div style={s.bigBtnSub}>ISO 2859-1 · Sample size auto-calculated</div>
        </div>
      </button>

      {drafts.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>📝 Saved Drafts</div>
            <div style={s.sectionCount}>{drafts.length}</div>
          </div>
          {drafts.map(d => (
            <div key={d.id} style={s.listRow} onClick={() => onOpenDraft(d.id)}>
              <div style={{ fontSize: '20px', flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={s.listProd}>{d.product_name || 'Untitled'}</div>
                <div style={s.listMeta}>Batch: {d.batch_no || '—'} · {new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: '#F3E8F7', color: '#7B2D8B', border: '1px solid #C084D0' }}>DRAFT</span>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}><div style={s.sectionTitle}>🕐 Recent Submissions</div></div>
          {recent.map(r => (
            <div key={r.id} style={s.listRow}>
              <div style={{ fontSize: '20px', flexShrink: 0 }}>📦</div>
              <div style={{ flex: 1 }}>
                <div style={s.listProd}>{r.product_name}</div>
                <div style={s.listMeta}>Batch: {r.batch_no} · {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
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

const s = {
  wrap:           { padding: '12px', overflowY: 'auto' },
  welcomeBanner:  { background: 'linear-gradient(135deg, #2D0845 0%, #7B2D8B 70%, #C0395A 100%)', borderRadius: '16px', padding: '18px 20px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(123,45,139,0.3)' },
  welcomeGlow:    { position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: '-50px', right: '-30px', pointerEvents: 'none' },
  welcomeText:    { zIndex: 1 },
  welcomeHi:      { fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '2px' },
  welcomeSub:     { fontSize: '11px', color: 'rgba(255,255,255,0.65)' },
  statGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' },
  statCard:       { borderRadius: '14px', padding: '14px 16px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' },
  statIcon:       { fontSize: '20px', marginBottom: '6px' },
  statVal:        { fontSize: '28px', fontWeight: '800', color: '#fff', lineHeight: 1 },
  statLabel:      { fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '4px', fontWeight: '500' },
  rulesStrip:     { background: '#fff', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', border: '1px solid #EDE4F0', boxShadow: '0 2px 8px rgba(123,45,139,0.06)' },
  ruleItem:       { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: '#1E0A2E' },
  ruleDot:        { width: '8px', height: '8px', borderRadius: '50%' },
  ruleDivider:    { width: '1px', height: '18px', background: '#EDE4F0' },
  bigBtn:         { width: '100%', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', border: 'none', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 6px 20px rgba(123,45,139,0.35)' },
  bigBtnTitle:    { fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '2px', textAlign: 'left' },
  bigBtnSub:      { fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'left' },
  section:        { background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', border: '1px solid #EDE4F0', boxShadow: '0 2px 8px rgba(123,45,139,0.06)' },
  sectionHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  sectionTitle:   { fontSize: '13px', fontWeight: '700', color: '#1E0A2E' },
  sectionCount:   { background: '#F3E8F7', color: '#7B2D8B', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' },
  listRow:        { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #FAF7FC', cursor: 'pointer' },
  listProd:       { fontSize: '13px', fontWeight: '600', color: '#1E0A2E' },
  listMeta:       { fontSize: '11px', color: '#A494B0', marginTop: '2px' },
}
