import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getSample, calcDecision, DEFECT_TYPES } from '../utils/aqlCalculator'
import { generatePDF } from '../utils/pdfReport'

export default function InspectionForm({ inspectionId, profile, onClose }) {
  const [form, setForm]     = useState({ product_name: '', sku: '', batch_no: '', batch_size: '', mfd_date: '', exp_date: '', remarks: '' })
  const [counts, setCounts] = useState({ critical: {}, major: {}, minor: {} })
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [readonly, setReadonly] = useState(false)
  const [existingId, setExistingId] = useState(inspectionId || null)

  const sample = form.batch_size ? getSample(Number(form.batch_size)) : null
  const result = sample ? calcDecision(counts, sample.n) : null

  useEffect(() => {
    if (inspectionId) loadExisting(inspectionId)
  }, [inspectionId])

  async function loadExisting(id) {
    const { data } = await supabase.from('inspections').select('*').eq('id', id).single()
    if (data) {
      setForm({
        product_name: data.product_name || '',
        sku:          data.sku || '',
        batch_no:     data.batch_no || '',
        batch_size:   data.batch_size || '',
        mfd_date:     data.mfd_date || '',
        exp_date:     data.exp_date || '',
        remarks:      data.remarks || '',
      })
      setCounts(data.defect_counts || { critical: {}, major: {}, minor: {} })
      if (data.status === 'submitted') setReadonly(true)
    }
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function changeCount(cat, idx, delta) {
    setCounts(prev => ({
      ...prev,
      [cat]: { ...prev[cat], [idx]: Math.max(0, (prev[cat][idx] || 0) + delta) },
    }))
  }

  async function saveDraft() {
    if (!form.product_name && !form.batch_no) { alert('Please enter at least a Product Name or Batch Number.'); return }
    setSaving(true)
    const payload = {
      ...form,
      batch_size:    form.batch_size ? Number(form.batch_size) : null,
      defect_counts: counts,
      status:        'draft',
      created_by:    profile.id,
      updated_at:    new Date().toISOString(),
    }
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
    else alert('Draft saved successfully.')
  }

  async function submitReport() {
    if (!form.product_name || !form.batch_no || !form.batch_size) {
      alert('Please fill in Product Name, Batch Number and Batch Size before submitting.')
      return
    }
    if (!window.confirm(`Submit this inspection?\n\nDecision: ${result?.decision || '—'}\n\nThis cannot be undone.`)) return

    setSubmitting(true)
    const info = getSample(Number(form.batch_size))
    const res  = calcDecision(counts, info.n)

    const payload = {
      ...form,
      batch_size:           Number(form.batch_size),
      sample_size:          info.n,
      sample_letter:        info.code,
      defect_counts:        counts,
      overall_decision:     res.decision,
      defect_pct_critical:  res.crit,
      defect_pct_major:     parseFloat(res.majPct.toFixed(4)),
      defect_pct_minor:     parseFloat(res.minPct.toFixed(4)),
      status:               'submitted',
      submitted_at:         new Date().toISOString(),
      created_by:           profile.id,
      updated_at:           new Date().toISOString(),
    }

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
    alert(`Inspection submitted!\n\nDecision: ${res.decision}`)
    if (submittedData) generatePDF(submittedData, profile.full_name)
  }

  const decStyle = result ? {
    ACCEPT: { bg: '#EAF3DE', border: '#C0DD97', label: '#3B6D11', val: '#27500A' },
    REJECT: { bg: '#FCEBEB', border: '#F7C1C1', label: '#A32D2D', val: '#791F1F' },
    HOLD:   { bg: '#FAEEDA', border: '#FAC775', label: '#854F0B', val: '#633806' },
  }[result.decision] : null

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onClose}>← Back</button>
        <div style={styles.headerTitle}>{readonly ? 'Inspection Report' : 'AQL Inspection'}</div>
        <span style={{ ...styles.badge, background: readonly ? '#EAF3DE' : '#F1EFE8', color: readonly ? '#27500A' : '#5F5E5A' }}>
          {readonly ? 'SUBMITTED' : 'DRAFT'}
        </span>
      </div>

      <div style={styles.body}>
        {/* Batch details */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Batch Details</div>
          <div style={styles.row2}>
            <div style={styles.group}>
              <label style={styles.label}>Product Name *</label>
              <input style={styles.input} value={form.product_name} onChange={e => setField('product_name', e.target.value)} placeholder="e.g. Moisturiser 50ml" readOnly={readonly} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>SKU / Code</label>
              <input style={styles.input} value={form.sku} onChange={e => setField('sku', e.target.value)} placeholder="SKU-XXXX" readOnly={readonly} />
            </div>
          </div>
          <div style={styles.row2}>
            <div style={styles.group}>
              <label style={styles.label}>Batch Number *</label>
              <input style={styles.input} value={form.batch_no} onChange={e => setField('batch_no', e.target.value)} placeholder="BN-XXXXX" readOnly={readonly} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Batch Size (units) *</label>
              <input style={styles.input} type="number" value={form.batch_size} onChange={e => setField('batch_size', e.target.value)} placeholder="e.g. 5000" readOnly={readonly} />
            </div>
          </div>

          {sample && (
            <div style={styles.sampleBanner}>
              📋 ISO 2859-1 Level II · Letter <strong>{sample.code}</strong> · Sample size: <strong>{sample.n} units</strong>
            </div>
          )}

          <div style={styles.row2}>
            <div style={styles.group}>
              <label style={styles.label}>Mfg. Date</label>
              <input style={styles.input} type="date" value={form.mfd_date} onChange={e => setField('mfd_date', e.target.value)} readOnly={readonly} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Expiry Date</label>
              <input style={styles.input} type="date" value={form.exp_date} onChange={e => setField('exp_date', e.target.value)} readOnly={readonly} />
            </div>
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Inspector</label>
            <input style={{ ...styles.input, background: '#F7F8FC', color: '#666' }} value={`${profile?.full_name || ''} (${profile?.emp_id || ''})`} readOnly />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Remarks</label>
            <textarea style={{ ...styles.input, height: '64px', resize: 'vertical' }} value={form.remarks} onChange={e => setField('remarks', e.target.value)} placeholder="Any additional observations…" readOnly={readonly} />
          </div>
        </div>

        {/* Defect counters */}
        {Object.entries(DEFECT_TYPES).map(([cat, types]) => (
          <div key={cat} style={styles.section}>
            <div style={styles.sectionTitle}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)} Defects
              <span style={styles.aqlTag}>
                {cat === 'critical' ? ' (AQL = 0% — Zero Tolerance)' : cat === 'major' ? ' (AQL ≤ 1%)' : ' (AQL ≤ 4%)'}
              </span>
            </div>
            {types.map((name, i) => (
              <div key={i} style={styles.defectRow}>
                <div style={styles.defectName}>{name}</div>
                <div style={styles.counter}>
                  {!readonly && <button style={styles.cBtn} onClick={() => changeCount(cat, i, -1)}>−</button>}
                  <span style={{ ...styles.cVal, color: (counts[cat][i] || 0) > 0 ? (cat === 'critical' ? '#A32D2D' : cat === 'major' ? '#854F0B' : '#185FA5') : '#1A1A2E' }}>
                    {counts[cat][i] || 0}
                  </span>
                  {!readonly && <button style={styles.cBtn} onClick={() => changeCount(cat, i, 1)}>＋</button>}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Decision */}
        {result && decStyle && (
          <div style={{ ...styles.decBanner, background: decStyle.bg, border: `1.5px solid ${decStyle.border}` }}>
            <div style={{ ...styles.decLabel, color: decStyle.label }}>Batch Disposition Decision</div>
            <div style={{ ...styles.decVal, color: decStyle.val }}>{result.decision}</div>
            <div style={styles.decStats}>
              <span style={{ color: result.crit > 0 ? '#A32D2D' : '#666' }}>Critical: {result.crit} unit(s)</span>
              <span style={{ color: result.majPct > 1 ? '#A32D2D' : '#666' }}>Major: {result.majPct.toFixed(2)}% / 1%</span>
              <span style={{ color: result.minPct > 4 ? '#A32D2D' : '#666' }}>Minor: {result.minPct.toFixed(2)}% / 4%</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!readonly && (
          <div style={styles.actions}>
            <button style={styles.btnSecondary} onClick={saveDraft} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button style={{ ...styles.btnPrimary, opacity: !sample ? 0.5 : 1 }} onClick={submitReport} disabled={submitting || !sample}>
              {submitting ? 'Submitting…' : 'Submit & Download PDF'}
            </button>
          </div>
        )}

        {readonly && (
          <div style={styles.actions}>
            <button style={styles.btnPrimary} onClick={() => generatePDF({ ...form, batch_size: Number(form.batch_size), sample_size: sample?.n, sample_letter: sample?.code, defect_counts: counts, overall_decision: result?.decision, defect_pct_critical: result?.crit, defect_pct_major: result?.majPct, defect_pct_minor: result?.minPct, submitted_at: new Date().toISOString() }, profile?.full_name)}>
              ⬇ Download PDF Report
            </button>
          </div>
        )}

        <button style={styles.btnCancel} onClick={onClose}>← Back to Dashboard</button>
        <div style={{ height: '80px' }} />
      </div>
    </div>
  )
}

const styles = {
  wrap:         { position: 'fixed', inset: 0, background: '#F4F6FB', zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  header:       { background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EEF0F6', position: 'sticky', top: 0, zIndex: 10 },
  backBtn:      { background: 'none', border: 'none', color: '#185FA5', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
  headerTitle:  { fontSize: '14px', fontWeight: '600', color: '#1A1A2E' },
  badge:        { fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.05em' },
  body:         { padding: '12px', flex: 1 },
  section:      { background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', border: '1px solid #EEF0F6' },
  sectionTitle: { fontSize: '12px', fontWeight: '700', color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' },
  aqlTag:       { fontWeight: '400', color: '#999', textTransform: 'none', letterSpacing: 0 },
  row2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  group:        { marginBottom: '12px' },
  label:        { display: 'block', fontSize: '11px', fontWeight: '500', color: '#777', marginBottom: '4px' },
  input:        { width: '100%', padding: '9px 10px', fontSize: '13px', border: '1px solid #DDE2EC', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#1A1A2E', background: '#fff' },
  sampleBanner: { background: '#E6F1FB', border: '1px solid #BDD6F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#185FA5', marginBottom: '12px' },
  defectRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F4F6FB' },
  defectName:   { fontSize: '12px', color: '#333', flex: 1, paddingRight: '8px' },
  counter:      { display: 'flex', alignItems: 'center', gap: '8px' },
  cBtn:         { width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #DDE2EC', background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A2E', lineHeight: 1 },
  cVal:         { fontSize: '15px', fontWeight: '600', minWidth: '28px', textAlign: 'center' },
  decBanner:    { borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '12px' },
  decLabel:     { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' },
  decVal:       { fontSize: '28px', fontWeight: '800', marginBottom: '8px' },
  decStats:     { display: 'flex', justifyContent: 'space-around', fontSize: '11px', gap: '6px' },
  actions:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' },
  btnPrimary:   { padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { padding: '12px', background: '#fff', color: '#185FA5', border: '1.5px solid #185FA5', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnCancel:    { width: '100%', padding: '11px', background: 'transparent', color: '#999', border: '1px solid #DDE2EC', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '8px' },
}
