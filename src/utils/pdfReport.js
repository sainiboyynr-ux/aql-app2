import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DEFECT_TYPES } from './aqlCalculator'

const PAGE_H = 297   // A4 height in mm
const MARGIN = 14
const FOOTER_ZONE = 16 // reserved space at bottom for footer line

export function generatePDF(inspection, inspectorName) {
  const doc = new jsPDF()
  const dec = inspection.overall_decision || 'HOLD'
  const decColor =
    dec === 'ACCEPT' ? [26, 107, 58]  :
    dec === 'REJECT' ? [140, 31, 56]  :
    [122, 74, 0]

  // ── Header ──────────────────────────────────────────────
  function drawHeader() {
    doc.setFillColor(123, 45, 139)
    doc.rect(0, 0, 210, 34, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15).setFont('helvetica', 'bold')
    doc.text('ESME CONSUMER PVT. LTD.', 105, 13, { align: 'center' })
    doc.setFontSize(10).setFont('helvetica', 'normal')
    doc.text('Finished Goods AQL Inspection Report', 105, 21, { align: 'center' })
    doc.text('Ref: ESME-QA-SOP-22-F-02  |  ISO 2859-1 General Inspection Level II', 105, 28, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }
  drawHeader()

  // ── Batch details table ──────────────────────────────────
  autoTable(doc, {
    startY: 40,
    margin: { bottom: FOOTER_ZONE },
    head: [['Batch Details', '', '', '']],
    body: [
      ['Product Name', inspection.product_name || '—', 'SKU / Product Code', inspection.sku || '—'],
      ['Batch Number', inspection.batch_no || '—', 'Batch Size (units)', (inspection.batch_size || 0).toLocaleString()],
      ['Mfg. Date', inspection.mfd_date || '—', 'Expiry Date', inspection.exp_date || '—'],
      ['ISO Sample Letter', inspection.sample_letter || '—', 'Sample Size (units)', inspection.sample_size || '—'],
      ['Inspector Name', inspectorName || '—', 'Date of Inspection', inspection.submitted_at ? new Date(inspection.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
      ['Remarks', inspection.remarks || '—', '', ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: [123, 45, 139], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 46, fillColor: [247, 240, 250] },
      2: { fontStyle: 'bold', cellWidth: 46, fillColor: [247, 240, 250] },
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
    startY: doc.lastAutoTable.finalY + 6,
    margin: { bottom: FOOTER_ZONE },
    head: [['Category', 'Defect Description', 'Count', 'AQL Limit', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [123, 45, 139], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 88 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: 'center' },
    },
    didParseCell(data) {
      if (data.column.index === 0) {
        if (data.cell.raw === 'CRITICAL') data.cell.styles.textColor = [140, 31, 56]
        if (data.cell.raw === 'MAJOR')    data.cell.styles.textColor = [122, 74, 0]
        if (data.cell.raw === 'MINOR')    data.cell.styles.textColor = [15, 123, 108]
      }
      if (data.column.index === 4 && data.cell.raw === 'FAIL') {
        data.cell.styles.textColor = [140, 31, 56]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawPage() {
      // Redraw header band on every new page the table spills onto
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) drawHeader()
    },
  })

  // ── Decision block — check space, add page if needed ────
  const DECISION_BLOCK_H = 34
  const SIGNATURE_BLOCK_H = 34
  const neededHeight = DECISION_BLOCK_H + SIGNATURE_BLOCK_H + 10

  let y = doc.lastAutoTable.finalY + 8

  if (y + neededHeight > PAGE_H - FOOTER_ZONE) {
    doc.addPage()
    drawHeader()
    y = 42
  }

  // Decision banner
  doc.setDrawColor(...decColor)
  doc.setLineWidth(1.5)
  doc.rect(MARGIN, y, 182, DECISION_BLOCK_H)
  doc.setFillColor(...decColor)
  doc.rect(MARGIN, y, 182, 11, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10).setFont('helvetica', 'bold')
  doc.text('BATCH DISPOSITION DECISION', 105, y + 7.5, { align: 'center' })

  doc.setTextColor(...decColor)
  doc.setFontSize(19).setFont('helvetica', 'bold')
  doc.text(dec, 105, y + 24, { align: 'center' })

  doc.setTextColor(90, 90, 90)
  doc.setFontSize(7.5).setFont('helvetica', 'normal')
  const pctLine = `Critical: ${inspection.defect_pct_critical ?? 0} unit(s)   |   Major: ${Number(inspection.defect_pct_major ?? 0).toFixed(2)}% (limit 1%)   |   Minor: ${Number(inspection.defect_pct_minor ?? 0).toFixed(2)}% (limit 4%)`
  doc.text(pctLine, 105, y + 31, { align: 'center' })

  // ── Signature block ───────────────────────────────────────
  const sigY = y + DECISION_BLOCK_H + 16
  doc.setTextColor(0)
  doc.setFontSize(9).setFont('helvetica', 'normal')

  doc.text('Inspector Signature:', MARGIN, sigY)
  doc.line(MARGIN + 36, sigY, MARGIN + 86, sigY)
  doc.text('QA Manager Signature:', 110, sigY)
  doc.line(110 + 38, sigY, 196, sigY)

  doc.text(`Name: ${inspectorName || '_______________'}`, MARGIN, sigY + 9)
  doc.text('Name: ___________________________', 110, sigY + 9)

  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, MARGIN, sigY + 18)
  doc.text('Date: ____________________________', 110, sigY + 18)

  // ── Footer on every page ─────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, PAGE_H - 13, 210 - MARGIN, PAGE_H - 13)
    doc.setFontSize(7).setTextColor(150)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `ESME-QA-SOP-22-F-02  |  Generated: ${new Date().toLocaleString('en-IN')}  |  Page ${i} of ${pageCount}`,
      105, PAGE_H - 8, { align: 'center' }
    )
  }

  const filename = `AQL_${inspection.batch_no || 'UNKNOWN'}_${(inspection.product_name || 'product').replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
