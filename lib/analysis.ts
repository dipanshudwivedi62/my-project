import type { Kit, Rgb } from '@/lib/kits'

export const ALGORITHM_VERSION = 'fieldtrace-colorimetric/1.0'

const MAX_MATCH_DELTA_E = 45
const POSITIVE_SCORE = 0.6
const NEGATIVE_SCORE = 0.4

export type TestResult = 'PRESUMPTIVE_POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE'
export type Lab = [number, number, number]

/** Centre point and square side length, normalised to image width/height. */
export type Roi = { x: number; y: number; size: number }

export type RegionStats = { mean: Rgb; std: number; clipped: number }

export type Measurements = {
  width: number
  height: number
  whiteRoi: Roi
  reactionRoi: Roi
  white: RegionStats
  reaction: RegionStats
  sharpness: number
  luminance: number
}

export type QualityCheck = {
  id: string
  label: string
  passed: boolean
  value: number
  detail: string
}

export type ReferenceMatch = {
  label: string
  kind: 'positive' | 'negative'
  rgb: Rgb
  deltaE: number
}

export type Analysis = {
  result: TestResult
  confidence: number
  calibrated: Rgb
  lab: Lab
  matches: ReferenceMatch[]
  bestMatch: string
  reasons: string[]
  quality: QualityCheck[]
}

export type StoredFeatures = Omit<Analysis, 'result' | 'confidence' | 'quality'> & {
  measurements: Measurements
}

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundRgb = (rgb: Rgb): Rgb => [round(rgb[0]), round(rgb[1]), round(rgb[2])]
const luma = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b

export function measureRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  roi: Roi,
): RegionStats {
  const half = Math.max(2, Math.round((roi.size * width) / 2))
  const cx = Math.round(roi.x * width)
  const cy = Math.round(roi.y * height)
  const x0 = clamp(cx - half, 0, width - 1)
  const x1 = clamp(cx + half, 0, width - 1)
  const y0 = clamp(cy - half, 0, height - 1)
  const y1 = clamp(cy + half, 0, height - 1)

  const sum = [0, 0, 0]
  const sumSq = [0, 0, 0]
  let clipped = 0
  let count = 0
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      sum[0] += r
      sum[1] += g
      sum[2] += b
      sumSq[0] += r * r
      sumSq[1] += g * g
      sumSq[2] += b * b
      if (r >= 250 || g >= 250 || b >= 250) clipped++
      count++
    }
  }
  const mean = sum.map((s) => s / count) as Rgb
  const std =
    sumSq.reduce((acc, sq, c) => acc + Math.sqrt(Math.max(0, sq / count - mean[c] ** 2)), 0) / 3
  return { mean, std, clipped: clipped / count }
}

/** Variance of the Laplacian on a downsampled greyscale grid — higher means sharper. */
export function measureSharpness(data: Uint8ClampedArray, width: number, height: number) {
  const step = Math.max(1, Math.floor(width / 320))
  const cols = Math.floor(width / step)
  const rows = Math.floor(height / step)
  const gray = new Float32Array(cols * rows)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * step * width + x * step) * 4
      gray[y * cols + x] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    }
  }
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const c = y * cols + x
      const lap = 4 * gray[c] - gray[c - 1] - gray[c + 1] - gray[c - cols] - gray[c + cols]
      sum += lap
      sumSq += lap * lap
      n++
    }
  }
  if (n === 0) return 0
  return sumSq / n - (sum / n) ** 2
}

export function measureLuminance(data: Uint8ClampedArray) {
  let total = 0
  let n = 0
  for (let i = 0; i < data.length; i += 64) {
    total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    n++
  }
  return n ? total / n : 0
}

export function collectMeasurements(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  whiteRoi: Roi,
  reactionRoi: Roi,
): Measurements {
  const white = measureRegion(data, width, height, whiteRoi)
  const reaction = measureRegion(data, width, height, reactionRoi)
  const roundStats = (s: RegionStats): RegionStats => ({
    mean: roundRgb(s.mean),
    std: round(s.std),
    clipped: round(s.clipped, 4),
  })
  const roundRoi = (r: Roi): Roi => ({ x: round(r.x, 4), y: round(r.y, 4), size: round(r.size, 4) })
  return {
    width,
    height,
    whiteRoi: roundRoi(whiteRoi),
    reactionRoi: roundRoi(reactionRoi),
    white: roundStats(white),
    reaction: roundStats(reaction),
    sharpness: round(measureSharpness(data, width, height)),
    luminance: round(measureLuminance(data)),
  }
}

/** Von Kries-style white balance: scale each channel so the reference patch reads neutral. */
export function whiteBalance(rgb: Rgb, white: Rgb): Rgb {
  return rgb.map((c, i) => clamp((c * 242) / Math.max(white[i], 1), 0, 255)) as Rgb
}

function srgbToLinear(c: number) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function rgbToLab(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map(srgbToLinear)
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function deltaE(a: Lab, b: Lab) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export function qualityChecks(m: Measurements): QualityCheck[] {
  const whiteLuma = luma(m.white.mean)
  const whiteMax = Math.max(...m.white.mean)
  const whiteChroma = whiteMax ? (whiteMax - Math.min(...m.white.mean)) / whiteMax : 1
  const aspect = m.height / m.width
  const distance = Math.hypot(
    m.whiteRoi.x - m.reactionRoi.x,
    (m.whiteRoi.y - m.reactionRoi.y) * aspect,
  )
  const minDistance = (m.whiteRoi.size + m.reactionRoi.size) / 2

  const focusOk = m.sharpness >= 12
  const exposureOk = m.luminance >= 45 && m.luminance <= 230
  const referenceOk = whiteLuma >= 140 && whiteChroma <= 0.3 && m.white.clipped <= 0.5
  const uniformOk = m.reaction.std <= 32
  const glareOk = m.reaction.clipped <= 0.1
  const placementOk = distance >= minDistance

  return [
    {
      id: 'focus',
      label: 'Focus',
      passed: focusOk,
      value: m.sharpness,
      detail: focusOk ? 'Image is sharp enough to read.' : 'Image looks blurred — hold steady and retake.',
    },
    {
      id: 'exposure',
      label: 'Exposure',
      passed: exposureOk,
      value: m.luminance,
      detail: exposureOk
        ? 'Scene brightness is within range.'
        : m.luminance < 45
          ? 'Image is too dark — add light or move closer.'
          : 'Image is overexposed — avoid direct light.',
    },
    {
      id: 'reference',
      label: 'White reference',
      passed: referenceOk,
      value: round(whiteLuma),
      detail: referenceOk
        ? 'Reference patch is bright and neutral enough to calibrate.'
        : 'Reference region is not a clean white patch — reposition it on the card.',
    },
    {
      id: 'uniformity',
      label: 'Sample uniformity',
      passed: uniformOk,
      value: m.reaction.std,
      detail: uniformOk
        ? 'Reaction region has a consistent colour.'
        : 'Reaction region is mixed — centre it inside the reagent well.',
    },
    {
      id: 'glare',
      label: 'Glare',
      passed: glareOk,
      value: round(m.reaction.clipped * 100, 1),
      detail: glareOk ? 'No significant glare on the sample.' : 'Glare detected on the sample — tilt the kit.',
    },
    {
      id: 'placement',
      label: 'Region placement',
      passed: placementOk,
      value: round(distance, 3),
      detail: placementOk
        ? 'Reference and reaction regions do not overlap.'
        : 'Reference and reaction regions overlap.',
    },
  ]
}

export function analyze(kit: Kit, m: Measurements): Analysis {
  const calibrated = roundRgb(whiteBalance(m.reaction.mean, m.white.mean))
  const lab = rgbToLab(calibrated)

  const references: Omit<ReferenceMatch, 'deltaE'>[] = [
    ...kit.positives.map((p) => ({ label: p.label, kind: 'positive' as const, rgb: p.rgb })),
    { label: kit.negative.label, kind: 'negative', rgb: kit.negative.rgb },
  ]
  const matches = references
    .map((ref) => ({ ...ref, deltaE: round(deltaE(lab, rgbToLab(ref.rgb))) }))
    .sort((a, b) => a.deltaE - b.deltaE)

  const bestPositive = Math.min(...matches.filter((m) => m.kind === 'positive').map((m) => m.deltaE))
  const negative = matches.find((m) => m.kind === 'negative')!.deltaE
  const best = matches[0]
  const score = negative / (bestPositive + negative || 1)

  const reasons: string[] = []
  let result: TestResult
  let confidence: number

  if (best.deltaE > MAX_MATCH_DELTA_E) {
    result = 'INCONCLUSIVE'
    confidence = clamp(1 - best.deltaE / 100, 0, 1)
    reasons.push(`Colour does not match any ${kit.name} reference (closest ΔE ${best.deltaE}).`)
  } else if (score >= POSITIVE_SCORE) {
    result = 'PRESUMPTIVE_POSITIVE'
    confidence = score
    reasons.push(`Closest to "${best.label}" (ΔE ${best.deltaE}).`)
  } else if (score <= NEGATIVE_SCORE) {
    result = 'NEGATIVE'
    confidence = 1 - score
    reasons.push(`Closest to "${best.label}" (ΔE ${best.deltaE}).`)
  } else {
    result = 'INCONCLUSIVE'
    confidence = Math.max(score, 1 - score)
    reasons.push('Colour sits between the positive and negative references.')
  }

  const quality = qualityChecks(m)
  const failed = quality.filter((q) => !q.passed)
  if (failed.length > 0) {
    result = 'INCONCLUSIVE'
    reasons.push(...failed.map((q) => `${q.label}: ${q.detail}`))
  }

  return {
    result,
    confidence: round(confidence, 3),
    calibrated,
    lab: [round(lab[0]), round(lab[1]), round(lab[2])],
    matches,
    bestMatch: best.label,
    reasons,
    quality,
  }
}

export const RESULT_LABELS: Record<TestResult, string> = {
  PRESUMPTIVE_POSITIVE: 'Presumptive positive',
  NEGATIVE: 'Negative',
  INCONCLUSIVE: 'Inconclusive',
}
