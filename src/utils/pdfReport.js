import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DEFECT_TYPES } from './aqlCalculator'

export function generatePDF(inspection, inspectorName) {
  const doc = new jsPDF()
  const dec = inspection.overall_decision || 'HOLD'
  const decColor =
    dec === 'ACCEPT' ? [39, 80, 10] :
    dec === 'REJECT' ? [121, 31, 31] :
    [99, 56, 6]

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, 210, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15).setFont('helvetica', 'bold')
  doc.text('ESME CONSUMER PVT. LTD.', 105, 13, { align: 'center' })
  doc.setFontSize(10).setFont('helvetica', 'normal')
  doc.text('Finished Goods AQL Inspection Report', 105, 21, { align: 'center' })
  doc.text('Ref: ESME-QA-SOP-22-F-02  |  ISO 2859-1 General Inspection Level II', 105, 28, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ── Batch details table ──────────────────────────────────
  autoTable(doc, {
    startY: 42,
    head: [['Batch Details', '', '', '']],
    body: [
      ['Product Name', inspection.product_name || '—', 'SKU / Product Code', inspection.sku || '—'],
      ['Batch Number', inspection.batch_no || '—', 'Batch Size (units)', (inspection.batch_size || '—').toLocaleString()],
      ['Mfg. Date', inspection.mfd_date || '—', 'Expiry Date', inspection.exp_date || '—'],
      ['ISO Sample Letter', inspection.sample_letter || '—', 'Sample Size (units)', inspection.sample_size || '—'],
      ['Inspector Name', inspectorName || '—', 'Date of Inspection', inspection.submitted_at ? new Date(inspection.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
      ['Remarks', inspection.remarks || '—', '', ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: [24, 95, 165], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 46, fillColor: [240, 244, 250] },
      2: { fontStyle: 'bold', cellWidth: 46, fillColor: [240, 244, 250] },
    },
  })

  // ── Defect log table ────────────────────────────────────
  const counts = inspection.defect_counts || {}
  const rows = []

  Object.entries(DEFECT_TYPES).forEach(([cat, types]) => {
    types.forEach((name, i) => {
      const count = (counts[cat] || {})[i] || 0
      rows.push([
        cat.toUpperCase(),
        name,
        count,
        cat === 'critical' ? '0 (Zero Tolerance)' :
        cat === 'major'    ? '≤ 1% of sample' :
        '≤ 4% of sample',
        count === 0 ? 'OK' : cat === 'critical' ? 'FAIL' : 'REVIEW',
      ])
    })
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Category', 'Defect Description', 'Count Found', 'AQL Limit', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [24, 95, 165], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 34 },
      4: { cellWidth: 20, halign: 'center' },
    },
    didParseCell(data) {
      if (data.column.index === 0) {
        if (data.cell.raw === 'CRITICAL') data.cell.styles.textColor = [163, 45, 45]
        if (data.cell.raw === 'MAJOR')    data.cell.styles.textColor = [133, 79, 11]
        if (data.cell.raw === 'MINOR')    data.cell.styles.textColor = [39, 80, 10]
      }
      if (data.column.index === 4 && data.cell.raw === 'FAIL') {
        data.cell.styles.textColor = [163, 45, 45]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ── Decision summary ─────────────────────────────────────
  const y = doc.lastAutoTable.finalY + 10
  doc.setDrawColor(...decColor)
  doc.setLineWidth(1.5)
  doc.rect(14, y, 182, 28)
  doc.setFillColor(...decColor)
  doc.rect(14, y, 182, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10).setFont('helvetica', 'bold')
  doc.text('BATCH DISPOSITION DECISION', 105, y + 7, { align: 'center' })
  doc.setTextColor(...decColor)
  doc.setFontSize(18).setFont('helvetica', 'bold')
  doc.text(dec, 105, y + 21, { align: 'center' })

  doc.setTextColor(80, 80, 80)
  doc.setFontSize(8).setFont('helvetica', 'normal')
  const pctLine = `Critical: ${inspection.defect_pct_critical ?? 0} unit(s)   |   Major: ${Number(inspection.defect_pct_major ?? 0).toFixed(2)}% (limit 1%)   |   Minor: ${Number(inspection.defect_pct_minor ?? 0).toFixed(2)}% (limit 4%)`
  doc.text(pctLine, 105, y + 33, { align: 'center' })

  // ── Signature block ───────────────────────────────────────
  const sigY = y + 45
  doc.setTextColor(0)
  doc.setFontSize(9).setFont('helvetica', 'normal')
  doc.text('Inspector Signature:', 14, sigY)
  doc.line(50, sigY, 100, sigY)
  doc.text('QA Manager Signature:', 110, sigY)
  doc.line(150, sigY, 196, sigY)
  doc.text(`Name: ${inspectorName || '_______________'}`, 14, sigY + 8)
  doc.text('Name: ___________________________', 110, sigY + 8)
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, sigY + 16)
  doc.text('Date: ____________________________', 110, sigY + 16)

  // ── Footer ────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7).setTextColor(150)
    doc.text(
      `ESME-QA-SOP-22-F-02  |  Generated: ${new Date().toLocaleString('en-IN')}  |  Page ${i} of ${pageCount}`,
      105, 290, { align: 'center' }
    )
  }

  const filename = `AQL_${inspection.batch_no || 'UNKNOWN'}_${(inspection.product_name || 'product').replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}