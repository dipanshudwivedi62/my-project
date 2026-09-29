import type { Kit, Rgb } from '@/lib/kits'

const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.9

export type DecodedImage = { dataUrl: string; pixels: Uint8ClampedArray; width: number; height: number }

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not supported in this browser')
  return { canvas, ctx }
}

/** Normalises a photo into the exact JPEG bytes that become the sealed evidence image. */
export async function fileToEvidenceImage(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const { canvas, ctx } = createCanvas(width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return decodeDataUrl(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
}

/** Analysis always runs on the decoded evidence JPEG so anyone can reproduce it from the sealed file. */
export async function decodeDataUrl(dataUrl: string): Promise<DecodedImage> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const { ctx } = createCanvas(image.naturalWidth, image.naturalHeight)
  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight)
  return { dataUrl, pixels: data, width: image.naturalWidth, height: image.naturalHeight }
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256OfDataUrl(dataUrl: string) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return toHex(await crypto.subtle.digest('SHA-256', bytes))
}

export async function sha256OfFile(file: File) {
  return toHex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))
}

function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEMO_WIDTH = 1200
const DEMO_HEIGHT = 900

export const DEMO_ROIS = {
  white: { x: 360 / DEMO_WIDTH, y: 430 / DEMO_HEIGHT },
  reaction: { x: 800 / DEMO_WIDTH, y: 430 / DEMO_HEIGHT },
  size: 0.1,
}

/** Renders a synthetic reference-card photo under a warm light cast to demo calibration. */
export async function generateDemoSample(kit: Kit, positive: boolean): Promise<DecodedImage> {
  const { canvas, ctx } = createCanvas(DEMO_WIDTH, DEMO_HEIGHT)
  const cast: Rgb = [1, 0.92, 0.8]
  const tint = (rgb: Rgb) =>
    `rgb(${Math.round(rgb[0] * cast[0])}, ${Math.round(rgb[1] * cast[1])}, ${Math.round(rgb[2] * cast[2])})`

  ctx.fillStyle = tint([70, 74, 82])
  ctx.fillRect(0, 0, DEMO_WIDTH, DEMO_HEIGHT)

  ctx.fillStyle = tint([226, 226, 222])
  ctx.beginPath()
  ctx.roundRect(150, 160, 900, 580, 28)
  ctx.fill()

  ctx.fillStyle = tint([40, 40, 44])
  ctx.font = '600 30px sans-serif'
  ctx.fillText('FIELDTRACE REFERENCE CARD', 200, 230)
  ctx.font = '400 22px sans-serif'
  ctx.fillText(kit.name.toUpperCase(), 200, 266)

  ctx.fillStyle = tint([250, 250, 250])
  ctx.fillRect(260, 330, 200, 200)
  ctx.strokeStyle = tint([120, 120, 120])
  ctx.lineWidth = 2
  ctx.strokeRect(260, 330, 200, 200)
  ctx.fillStyle = tint([40, 40, 44])
  ctx.fillText('WHITE REF', 300, 572)

  ctx.fillStyle = tint([200, 200, 200])
  ctx.beginPath()
  ctx.arc(800, 430, 130, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = tint(positive ? kit.positives[0].rgb : kit.negative.rgb)
  ctx.beginPath()
  ctx.arc(800, 430, 110, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = tint([40, 40, 44])
  ctx.fillText('SAMPLE WELL', 730, 600)

  const image = ctx.getImageData(0, 0, DEMO_WIDTH, DEMO_HEIGHT)
  const random = seededRandom(positive ? 7 : 11)
  for (let i = 0; i < image.data.length; i += 4) {
    const noise = (random() - 0.5) * 10
    image.data[i] += noise
    image.data[i + 1] += noise
    image.data[i + 2] += noise
  }
  ctx.putImageData(image, 0, 0)
  return decodeDataUrl(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
}
