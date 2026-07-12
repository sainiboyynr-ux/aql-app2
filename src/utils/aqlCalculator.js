// ISO 2859-1 General Inspection Level II — Single Sampling
const ISO2859 = [
  { max: 150,      code: 'F', n: 20   },
  { max: 280,      code: 'G', n: 32   },
  { max: 500,      code: 'H', n: 50   },
  { max: 1200,     code: 'J', n: 80   },
  { max: 3200,     code: 'K', n: 125  },
  { max: 10000,    code: 'L', n: 200  },
  { max: 35000,    code: 'M', n: 315  },
  { max: 150000,   code: 'N', n: 500  },
  { max: 500000,   code: 'P', n: 800  },
  { max: Infinity, code: 'Q', n: 1250 },
]

export function getSample(batchSize) {
  return ISO2859.find(r => Number(batchSize) <= r.max) || ISO2859[ISO2859.length - 1]
}

export function calcDecision(defectCounts, sampleSize) {
  const crit = Object.values(defectCounts?.critical || {}).reduce((a, b) => a + b, 0)
  const maj  = Object.values(defectCounts?.major   || {}).reduce((a, b) => a + b, 0)
  const min  = Object.values(defectCounts?.minor   || {}).reduce((a, b) => a + b, 0)
  const majPct = sampleSize ? (maj / sampleSize) * 100 : 0
  const minPct = sampleSize ? (min / sampleSize) * 100 : 0

  let decision = 'ACCEPT'
  if (crit > 0)                       decision = 'REJECT'
  else if (majPct > 1 || minPct > 4)  decision = 'HOLD'

  return { decision, crit, maj, min, majPct, minPct }
}

// Defect types — Cosmetics Finished Goods AQL Inspection (BSAQL-QA-SOP-22-F-02)
export const DEFECT_TYPES = {
  critical: [
    'Print Defect in mandatory text — Site address, Brand Name, Logo, Mfg. Lic. No., Consumer Care details, Net Weight not legible',
    'Batch Coding / MRP / USP defect on primary pack — Misprint, wrong batch coding, smudged, illegible or double coded / over-printed batch',
    'Weight outside agreed tolerance limits — Average weight less / more than specified regulatory limits post stamping',
    'Foreign matter in product, Separation or Sedimentation — Hair, thread, metal contamination (other than black particles), layer separation or particle sedimentation in bulk',
    'Colour, Shade, Texture and Fragrance not matching with Standard — Short packaging / empty container',
  ],
  major: [
    'Fitment and functioning of component — Cap, seal, brush, pump functioning and tightness',
    'Locking Defects, Improper cutting and pasting, Wet and dirty cartons',
    'Scratches, Torn label, Off-centre label and Glue issue — Scratches visible from 1-metre distance, torn label, off-centre label, label not pasted properly',
    'Open pack, Breakage, Damaged and Loose fitment, Leakage — Open mono-carton, compact powder breakage, damaged / loose fitments in mono-carton or shipper',
    'Finishing issues, Pin holes, Sweating in lipstick bullets',
    'Crushed / Wrinkled / Dirty tube or container, Crimping issue, Burning mark in blister — Distorted pack / crushed tube edges visible from 1 mt, burning mark',
  ],
  minor: [
    'Poor application of BOPP tape on shipper flaps — Poor alignment of tape and partially open flaps due to loose application',
    'Coding shifting, Panel shifting — Coding or panel shifting (NMT 2 mm) to be allowed',
    'Scuffed pack — Distinctly visible scuff marks on container',
    'Outer Box Flap open without tear — Poor fibre tear on opening of outer flaps',
  ],
}
