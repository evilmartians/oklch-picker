// AES-256-GCM encryption using Web Crypto API

export interface EncryptedData {
  ciphertext: string // base64
  iv: string // base64
  salt: string // base64
}

// Derive a key from password using PBKDF2
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  let encoder = new TextEncoder()
  let passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Convert Uint8Array to base64
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

// Convert base64 to Uint8Array
function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

// Encrypt plaintext with password
export async function encrypt(
  plaintext: string,
  password: string
): Promise<EncryptedData> {
  let salt = crypto.getRandomValues(new Uint8Array(16))
  let iv = crypto.getRandomValues(new Uint8Array(12))
  let key = await deriveKey(password, salt)

  let encoder = new TextEncoder()
  let encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(plaintext)
  )

  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
    salt: toBase64(salt)
  }
}

// Decrypt ciphertext with password
export async function decrypt(
  data: EncryptedData,
  password: string
): Promise<string> {
  let salt = fromBase64(data.salt)
  let iv = fromBase64(data.iv)
  let ciphertext = fromBase64(data.ciphertext)

  let key = await deriveKey(password, salt)

  let decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  )

  return new TextDecoder().decode(decrypted)
}

// Encrypt multiple fields with same salt (different IVs per field)
export async function encryptFields(
  fields: Record<string, string>,
  password: string
): Promise<{ encrypted: Record<string, string>; iv: string; salt: string }> {
  let salt = crypto.getRandomValues(new Uint8Array(16))
  let key = await deriveKey(password, salt)
  let encoder = new TextEncoder()
  let encrypted: Record<string, string> = {}

  // Use a counter for unique IVs per field
  let counter = 0
  for (let [field, value] of Object.entries(fields)) {
    // Generate unique IV by combining random bytes with counter
    let iv = crypto.getRandomValues(new Uint8Array(12))
    // XOR last 4 bytes with counter for uniqueness
    let counterBytes = new Uint8Array(4)
    new DataView(counterBytes.buffer).setUint32(0, counter++, true)
    for (let i = 0; i < 4; i++) {
      iv[8 + i] ^= counterBytes[i]
    }

    let encryptedValue = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encoder.encode(value)
    )

    // Store IV with ciphertext (prepended)
    let combined = new Uint8Array(iv.length + encryptedValue.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedValue), iv.length)
    encrypted[field] = toBase64(combined)
  }

  return {
    encrypted,
    iv: '', // IVs are embedded in each field
    salt: toBase64(salt)
  }
}

// Decrypt a field that has IV prepended
export async function decryptField(
  encryptedWithIv: string,
  salt: string,
  password: string
): Promise<string> {
  let combined = fromBase64(encryptedWithIv)
  let iv = combined.slice(0, 12)
  let ciphertext = combined.slice(12)
  let saltBytes = fromBase64(salt)

  let key = await deriveKey(password, saltBytes)

  let decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  )

  return new TextDecoder().decode(decrypted)
}
