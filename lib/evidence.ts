import {
  createHash,
  createPrivateKey,
  createPublicKey,
  hkdfSync,
  randomBytes,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto'

const ED25519_PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex')
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

let cachedKeys: { privateKey: KeyObject; publicKey: string } | null = null

function signingSecret() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') return 'fieldtrace-development-only-secret'
  throw new Error('BETTER_AUTH_SECRET is required to sign evidence records')
}

/** Deterministic Ed25519 key pair derived from the server secret via HKDF. */
export function getSigningKeys() {
  if (cachedKeys) return cachedKeys
  const seed = Buffer.from(
    hkdfSync('sha256', signingSecret(), 'fieldtrace-evidence', 'ed25519-signing-key/v1', 32),
  )
  const privateKey = createPrivateKey({
    key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8',
  })
  const publicKey = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).toString('base64')
  cachedKeys = { privateKey, publicKey }
  return cachedKeys
}

export function sha256Hex(data: Buffer | string) {
  return createHash('sha256').update(data).digest('hex')
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`
}

export function signRecord(recordJson: string) {
  return sign(null, Buffer.from(recordJson), getSigningKeys().privateKey).toString('base64')
}

export function verifyRecordSignature(recordJson: string, signature: string, publicKey: string) {
  try {
    const key = createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' })
    return verify(null, Buffer.from(recordJson), key, Buffer.from(signature, 'base64'))
  } catch {
    return false
  }
}

export function keyFingerprint(publicKey: string) {
  return (
    sha256Hex(Buffer.from(publicKey, 'base64'))
      .slice(0, 16)
      .toUpperCase()
      .match(/.{4}/g)
      ?.join(':') ?? ''
  )
}

export function parseImageDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) return null
  return { mime: match[1], bytes: Buffer.from(match[2], 'base64') }
}

export function createTestId(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '')
  const suffix = Array.from(randomBytes(6), (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('')
  return `FT-${day}-${suffix}`
}
