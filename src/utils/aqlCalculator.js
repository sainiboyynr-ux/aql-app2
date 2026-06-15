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

// Defect types relevant to cosmetics finished goods
export const DEFECT_TYPES = {
  critical: [
    'Contamination / microbial growth',
    'Wrong product / mislabelled',
    'Harmful foreign matter (glass, metal)',
    'Primary seal breach / leakage',
    'Wrong fragrance / off-odour',
    'Incorrect active ingredient concentration',
  ],
  major: [
    'Leaking / broken closure',
    'Wrong shade or colour (foundation, lipstick, eyeshadow)',
    'Incorrect net weight / fill volume',
    'Label missing or major misprint',
    'Cap / pump not functioning',
    'Phase separation / texture defect',
    'Batch number / expiry missing on unit',
  ],
  minor: [
    'Minor cosmetic dent on tube or bottle',
    'Slight label offset (< 3 mm)',
    'Print smudge on carton or shipper',
    'Minor surface scratch on cap',
    'Quantity short in shipper (< 2 units)',
    'Loose shrink wrap',
  ],
}
