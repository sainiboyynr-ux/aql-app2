import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getSample, calcDecision, DEFECT_TYPES } from '../utils/aqlCalculator'
import { generatePDF } from '../utils/pdfReport'

const CAT_CONFIG = {
  critical: { label: 'Critical Defects', aql: 'AQL = 0%  (Zero Tolerance)', color: '#C0395A', light: '#FDEDF1', border: '#F4A7BC', icon: '🚫' },
  major:    { label: 'Major Defects',    aql: 'AQL ≤ 1%',                   color: '#B8860B', light: '#FDF6E3', border: '#F5C97A', icon: '⚠️' },
  minor:    { label: 'Minor Defects',    aql: 'AQL ≤ 4%',                   color: '#0F7B6C', light: '#E0F4F1', border: '#6ECDC4', icon: '🔍' },
}

export default function InspectionForm({ inspectionId, profile, company, onClose }) {
  const [form, setForm]         = useState({ product_name: '', sku: '', batch_no: '', batch_size: '', mfd_date: '', exp_date: '', remarks: '' })
  const [counts, setCounts]     = useState({ critical: {}, major: {}, minor: {} })
  const [saving, setSaving]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [readonly, setReadonly] = useState(false)
  const [existingId, setExistingId] = useState(inspectionId || null)

  const sample = form.batch_size ? getSample(Number(form.batch_size)) : null
  const result = sample ? calcDecision(counts, sample.n) : null

  useEffect(() => { if (inspectionId) loadExisting(inspectionId) }, [inspectionId])

  async function loadExisting(id) {
    const { data } = await supabase.from('inspections').select('*').eq('id', id).single()
    if (data) {
      setForm({ product_name: data.product_name || '', sku: data.sku || '', batch_no: data.batch_no || '', batch_size: data.batch_size || '', mfd_date: data.mfd_date || '', exp_date: data.exp_date || '', remarks: data.remarks || '' })
      setCounts(data.defect_counts || { critical: {}, major: {}, minor: {} })
      if (data.status === 'submitted') setReadonly(true)
    }
  }

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function changeCount(cat, idx, delta) {
    setCounts(prev => ({ ...prev, [cat]: { ...prev[cat], [idx]: Math.max(0, (prev[cat][idx] || 0) + delta) } }))
  }

  async function saveDraft() {
    if (!form.product_name && !form.batch_no) { alert('Please enter at least a Product Name or Batch Number.'); return }
    setSaving(true)
    const payload = { ...form, batch_size: form.batch_size ? Number(form.batch_size) : null, defect_counts: counts, status: 'draft', created_by: profile.id, company_id: company?.id, updated_at: new Date().toISOString() }
    let error
    if (existingId) {
      ;({ error } = await supabase.from('inspections').update(payload).eq('id', existingId))
    } else {
      const { data, error: e } = await supabase.from('inspections').insert([payload]).select().single()
      error = e
      if (data) setExistingId(data.id)
    }
    setSaving(false)
    if (error) alert('Error saving draft: ' + error.message)
    else alert('✅ Draft saved successfully.')
  }

  async function submitReport() {
    if (!form.product_name || !form.batch_no || !form.batch_size) { alert('Please fill in Product Name, Batch Number and Batch Size before submitting.'); return }
    if (!window.confirm(`Submit this inspection?\n\nDecision: ${result?.decision || '—'}\n\nThis cannot be undone.`)) return
    setSubmitting(true)
    const info = getSample(Number(form.batch_size))
    const res  = calcDecision(counts, info.n)
    const payload = { ...form, batch_size: Number(form.batch_size), sample_size: info.n, sample_letter: info.code, defect_counts: counts, overall_decision: res.decision, defect_pct_critical: res.crit, defect_pct_major: parseFloat(res.majPct.toFixed(4)), defect_pct_minor: parseFloat(res.minPct.toFixed(4)), status: 'submitted', submitted_at: new Date().toISOString(), created_by: profile.id, company_id: company?.id, updated_at: new Date().toISOString() }
    let error, submittedData
    if (existingId) {
      const { data, error: e } = await supabase.from('inspections').update(payload).eq('id', existingId).select().single()
      error = e; submittedData = data
    } else {
      const { data, error: e } = await supabase.from('inspections').insert([payload]).select().single()
      error = e; submittedData = data
    }
    setSubmitting(false)
    if (error) { alert('Error submitting: ' + error.message); return }
    setReadonly(true)
    alert(`✅ Inspection submitted!\n\nDecision: ${res.decision}`)
    if (submittedData) generatePDF(submittedData, profile.full_name)
  }

  const DEC_STYLE = result ? {
    ACCEPT: { bg: 'linear-gradient(135deg, #1A6B3A, #22C55E)', text: '#fff', label: 'BATCH ACCEPTED ✅' },
    REJECT: { bg: 'linear-gradient(135deg, #8C1F38, #C0395A)', text: '#fff', label: 'BATCH REJECTED ❌' },
    HOLD:   { bg: 'linear-gradient(135deg, #7A4A00, #D97706)', text: '#fff', label: 'BATCH ON HOLD ⚠️' },
  }[result.decision] : null

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onClose}>← Back</button>
        <div style={s.headerCenter}>
          <div style={s.headerTitle}>{readonly ? 'Inspection Report' : 'AQL Inspection'}</div>
          <div style={s.headerSub}>ESME-QA-SOP-22-F-02</div>
        </div>
        <span style={{ ...s.badge, ...(readonly ? s.badgeSubmitted : s.badgeDraft) }}>
          {readonly ? 'SUBMITTED' : 'DRAFT'}
        </span>
      </div>

      <div style={s.body}>

        {/* Batch details card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardHeaderIcon}>📦</span>
            <span style={s.cardHeaderTitle}>Batch Details</span>
          </div>
          <div style={s.row2}>
            <div style={s.group}>
              <label style={s.label}>Product Name *</label>
              <input style={s.input} value={form.product_name} onChange={e => setField('product_name', e.target.value)} placeholder="e.g. Moisturiser 50ml" readOnly={readonly} />
            </div>
            <div style={s.group}>
              <label style={s.label}>SKU / Code</label>
              <input style={s.input} value={form.sku} onChange={e => setField('sku', e.target.value)} placeholder="SKU-XXXX" readOnly={readonly} />
            </div>
          </div>
          <div style={s.row2}>
            <div style={s.group}>
              <label style={s.label}>Batch Number *</label>
              <input style={s.input} value={form.batch_no} onChange={e => setField('batch_no', e.target.value)} placeholder="BN-XXXXX" readOnly={readonly} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Batch Size (units) *</label>
              <input style={s.input} type="number" value={form.batch_size} onChange={e => setField('batch_size', e.target.value)} placeholder="e.g. 5000" readOnly={readonly} />
            </div>
          </div>

          {sample && (
            <div style={s.samplePill}>
              <span style={s.sampleIcon}>📋</span>
              <span>ISO 2859-1 Level II · Letter <strong>{sample.code}</strong> · Sample size: <strong>{sample.n} units</strong></span>
            </div>
          )}

          <div style={s.row2}>
            <div style={s.group}>
              <label style={s.label}>Mfg. Date</label>
              <input style={s.input} type="date" value={form.mfd_date} onChange={e => setField('mfd_date', e.target.value)} readOnly={readonly} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Expiry Date</label>
              <input style={s.input} type="date" value={form.exp_date} onChange={e => setField('exp_date', e.target.value)} readOnly={readonly} />
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Inspector</label>
            <input style={{ ...s.input, ...s.inputReadonly }} value={`${profile?.full_name || ''} (${profile?.emp_id || ''})`} readOnly />
          </div>
          <div style={s.group}>
            <label style={s.label}>Remarks</label>
            <textarea style={{ ...s.input, height: '60px', resize: 'vertical' }} value={form.remarks} onChange={e => setField('remarks', e.target.value)} placeholder="Any additional observations…" readOnly={readonly} />
          </div>
        </div>

        {/* Defect counters */}
        {Object.entries(DEFECT_TYPES).map(([cat, types]) => {
          const cfg = CAT_CONFIG[cat]
          const catTotal = Object.values(counts[cat] || {}).reduce((a, b) => a + b, 0)
          return (
            <div key={cat} style={{ ...s.card, borderTop: `3px solid ${cfg.color}` }}>
              <div style={s.cardHeader}>
                <span style={s.cardHeaderIcon}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ ...s.cardHeaderTitle, color: cfg.color }}>{cfg.label}</div>
                  <div style={s.aqlTag}>{cfg.aql}</div>
                </div>
                {catTotal > 0 && (
                  <span style={{ ...s.countBadge, background: cfg.light, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {catTotal} found
                  </span>
                )}
              </div>
              {types.map((name, i) => {
                const count = counts[cat][i] || 0
                return (
                  <div key={i} style={{ ...s.defectRow, background: count > 0 ? cfg.light : 'transparent' }}>
                    <div style={s.defectName}>{name}</div>
                    <div style={s.counter}>
                      {!readonly && (
                        <button style={{ ...s.cBtn, borderColor: cfg.border }} onClick={() => changeCount(cat, i, -1)}>−</button>
                      )}
                      <span style={{ ...s.cVal, color: count > 0 ? cfg.color : '#A494B0', fontWeight: count > 0 ? '800' : '400' }}>
                        {count}
                      </span>
                      {!readonly && (
                        <button style={{ ...s.cBtn, borderColor: cfg.border, background: count > 0 ? cfg.color : '#fff', color: count > 0 ? '#fff' : '#1E0A2E' }} onClick={() => changeCount(cat, i, 1)}>＋</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Decision banner */}
        {result && DEC_STYLE && (
          <div style={{ ...s.decBanner, background: DEC_STYLE.bg }}>
            <div style={s.decLabel}>{DEC_STYLE.label}</div>
            <div style={s.decStats}>
              <div style={s.decStat}>
                <div style={s.decStatVal}>{result.crit}</div>
                <div style={s.decStatKey}>Critical units</div>
              </div>
              <div style={s.decStatDiv} />
              <div style={s.decStat}>
                <div style={{ ...s.decStatVal, color: result.majPct > 1 ? '#FFD700' : '#fff' }}>{result.majPct.toFixed(2)}%</div>
                <div style={s.decStatKey}>Major / 1% limit</div>
              </div>
              <div style={s.decStatDiv} />
              <div style={s.decStat}>
                <div style={{ ...s.decStatVal, color: result.minPct > 4 ? '#FFD700' : '#fff' }}>{result.minPct.toFixed(2)}%</div>
                <div style={s.decStatKey}>Minor / 4% limit</div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!readonly && (
          <div style={s.actions}>
            <button style={s.btnSave} onClick={saveDraft} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Draft'}
            </button>
            <button style={{ ...s.btnSubmit, opacity: !sample ? 0.5 : 1 }} onClick={submitReport} disabled={submitting || !sample}>
              {submitting ? 'Submitting…' : '✅ Submit & PDF'}
            </button>
          </div>
        )}

        {readonly && (
          <button style={s.btnPdf} onClick={() => generatePDF({ ...form, batch_size: Number(form.batch_size), sample_size: sample?.n, sample_letter: sample?.code, defect_counts: counts, overall_decision: result?.decision, defect_pct_critical: result?.crit, defect_pct_major: result?.majPct, defect_pct_minor: result?.minPct, submitted_at: new Date().toISOString() }, profile?.full_name)}>
            ⬇ Download PDF Report
          </button>
        )}

        <button style={s.btnBack} onClick={onClose}>← Back to Dashboard</button>
        <div style={{ height: '80px' }} />
      </div>
    </div>
  )
}

const s = {
  wrap:         { position: 'fixed', inset: 0, background: '#FAF7FC', zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  header:       { background: 'linear-gradient(135deg, #2D0845, #7B2D8B)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 12px rgba(45,8,69,0.3)' },
  backBtn:      { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '600', padding: '6px 10px', borderRadius: '8px' },
  headerCenter: { textAlign: 'center', flex: 1 },
  headerTitle:  { fontSize: '14px', fontWeight: '700', color: '#fff' },
  headerSub:    { fontSize: '10px', color: 'rgba(255,255,255,0.6)' },
  badge:        { fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.05em' },
  badgeDraft:   { background: 'rgba(255,255,255,0.2)', color: '#fff' },
  badgeSubmitted:{ background: '#22C55E', color: '#fff' },
  body:         { padding: '12px', flex: 1 },
  card:         { background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', border: '1px solid #EDE4F0', boxShadow: '0 2px 10px rgba(123,45,139,0.06)' },
  cardHeader:   { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  cardHeaderIcon:{ fontSize: '18px' },
  cardHeaderTitle:{ fontSize: '13px', fontWeight: '700', color: '#1E0A2E' },
  aqlTag:       { fontSize: '10px', color: '#A494B0', fontWeight: '500' },
  countBadge:   { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' },
  row2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  group:        { marginBottom: '12px' },
  label:        { display: 'block', fontSize: '10px', fontWeight: '700', color: '#6B5878', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:        { width: '100%', padding: '9px 11px', fontSize: '13px', border: '1.5px solid #EDE4F0', borderRadius: '9px', outline: 'none', boxSizing: 'border-box', color: '#1E0A2E', background: '#FAF7FC' },
  inputReadonly:{ background: '#F3E8F7', color: '#6B5878', border: '1.5px solid #EDE4F0' },
  samplePill:   { display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #F3E8F7, #FDEDF1)', border: '1px solid #C084D0', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#7B2D8B', marginBottom: '12px', fontWeight: '500' },
  sampleIcon:   { fontSize: '16px' },
  defectRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px', borderRadius: '8px', marginBottom: '4px', transition: 'background 0.15s' },
  defectName:   { fontSize: '12px', color: '#1E0A2E', flex: 1, paddingRight: '8px', lineHeight: '1.4' },
  counter:      { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  cBtn:         { width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #EDE4F0', background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E0A2E', lineHeight: 1, fontWeight: '500', transition: 'all 0.15s' },
  cVal:         { fontSize: '16px', minWidth: '28px', textAlign: 'center', transition: 'color 0.15s' },
  decBanner:    { borderRadius: '14px', padding: '18px', marginBottom: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' },
  decLabel:     { fontSize: '16px', fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: '14px', letterSpacing: '0.02em' },
  decStats:     { display: 'flex', justifyContent: 'space-around', alignItems: 'center' },
  decStat:      { textAlign: 'center' },
  decStatVal:   { fontSize: '20px', fontWeight: '800', color: '#fff' },
  decStatKey:   { fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' },
  decStatDiv:   { width: '1px', height: '36px', background: 'rgba(255,255,255,0.25)' },
  actions:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' },
  btnSave:      { padding: '13px', background: '#fff', color: '#7B2D8B', border: '2px solid #7B2D8B', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  btnSubmit:    { padding: '13px', background: 'linear-gradient(135deg, #7B2D8B, #C0395A)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(123,45,139,0.35)' },
  btnPdf:       { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #0F7B6C, #14B8A6)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 14px rgba(15,123,108,0.3)' },
  btnBack:      { width: '100%', padding: '11px', background: 'transparent', color: '#A494B0', border: '1px solid #EDE4F0', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '8px' },
}
