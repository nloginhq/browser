export class GeneratePasswordOptions {
  length: number
  azUpperSet: boolean
  azLowerSet: boolean
  numsSet: boolean
  specialsSet: boolean
  minNums: number
  minSpecial: number

  azUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  azLower = 'abcdefghijklmnopqrstuvwxyz'
  nums = '0123456789'
  specials = '!@#$%^&*'

  constructor(
    length: number,
    azUpperSet: boolean,
    azLowerSet: boolean,
    numsSet: boolean,
    specialsSet: boolean,
    minNums: number,
    minSpecial: number,
  ) {
    this.length = length

    if (minNums + minSpecial > length) {
      throw 'length less than minimum numbers and specials'
    }

    this.azUpperSet = azUpperSet
    this.azLowerSet = azLowerSet
    this.numsSet = numsSet
    this.specialsSet = specialsSet
    this.minNums = minNums
    this.minSpecial = minSpecial
  }

  getCharacterSet(): string {
    let charSet = ''
    if (this.azUpperSet) {
      charSet += this.azUpper
    }
    if (this.azLowerSet) {
      charSet += this.azLower
    }
    if (this.numsSet) {
      charSet += this.nums
    }
    if (this.specialsSet) {
      charSet += this.specials
    }
    if (charSet === '') {
      throw 'password character set cannot be empty'
    }
    return charSet
  }
}

export class Crypto {
  async derivePBKDFKey(secret: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(secret)
    const saltBuffer = encoder.encode(salt)

    const importOptions = {
      name: 'PBKDF2',
    }

    const key = await window.crypto.subtle.importKey('raw', passwordBuffer, importOptions, false, [
      'deriveBits',
      'deriveKey',
    ])

    const deriveOptions = {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-512',
    }

    const derivedKey = await window.crypto.subtle.deriveKey(
      deriveOptions,
      key,
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    )

    return derivedKey
  }

  // createSymmetricKey creates a new encryption key that will be used to encrypt secrets
  async createSymmetricKey(): Promise<CryptoKey> {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    )
    return key
  }

  async keyToBase64String(key: CryptoKey): Promise<string> {
    const rawKey = await window.crypto.subtle.exportKey('raw', key)
    const uint8ArrayKey = new Uint8Array(rawKey)
    const b64Key = btoa(String.fromCharCode.apply(null, Array.from(uint8ArrayKey)))
    return b64Key
  }

  async base64StringToKey(b64Key: string): Promise<CryptoKey> {
    const uint8ArrayKey = Uint8Array.from(atob(b64Key), (c) => c.charCodeAt(0))

    const key = await window.crypto.subtle.importKey(
      'raw',
      uint8ArrayKey,
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    )

    return key
  }

  // aesEncrypt performs AES-256-CBC encryption on a given value using a secret key
  async aesEncrypt(key: CryptoKey, plainText: string): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(16))
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(plainText)
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv,
      },
      key,
      encodedData,
    )
    // Convert encryptedData and iv to Base64 format
    const encryptedDataB64 = btoa(
      String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedData))),
    )
    const ivB64 = btoa(String.fromCharCode.apply(null, Array.from(iv)))
    // Return combined Base64 string
    return `${encryptedDataB64}:${ivB64}`
  }

  // aesDecrypt decrypts a value which was encypted using AES-256-CBC given its secret key
  async aesDecrypt(key: CryptoKey, encryptedPayload: string): Promise<string> {
    const [encryptedDataB64, ivB64] = encryptedPayload.split(':')
    const encryptedData = Uint8Array.from(atob(encryptedDataB64), (c) => c.charCodeAt(0))
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0))
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv,
      },
      key,
      encryptedData,
    )
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  }

  // hash generates a one-way fixed-length string
  async hash(secret: string, salt: string): Promise<string> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(secret)
    const saltBuffer = encoder.encode(salt)

    const importOptions = {
      name: 'PBKDF2',
    }

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      importOptions,
      false,
      ['deriveBits'],
    )

    const deriveOptions = {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-512',
    }

    const derivedBits = await window.crypto.subtle.deriveBits(
      deriveOptions,
      baseKey,
      256, // Length in bits of the output
    )

    const derivedBitsUint8 = new Uint8Array(derivedBits)
    return btoa(String.fromCharCode(...Array.from(derivedBitsUint8)))
  }

  generatePassword(opts: GeneratePasswordOptions): string {
    // generate a crypto random password
    const charSet = opts.getCharacterSet()
    let pass = Array.from(window.crypto.getRandomValues(new Uint8Array(opts.length))).map(
      (x) => charSet[x % charSet.length],
    )

    // apply min nums and specials
    pass = this.insertRandomCharsFromSet(opts, pass)

    return pass.join('').toString()
  }

  // make sure the requires minimum number of special and numerical characters are set
  insertRandomCharsFromSet(opts: GeneratePasswordOptions, into: string[]): string[] {
    if (opts.minNums + opts.minSpecial > opts.length) {
      throw new Error('length less than minimum numbers and specials')
    }

    var insertIndexes = []
    while (insertIndexes.length < opts.minNums + opts.minSpecial) {
      let r = this.getRandomInt(0, into.length - 1)
      if (insertIndexes.indexOf(r) === -1) insertIndexes.push(r)
    }

    // store the current random insert index we are using
    let idx = 0

    // insert numerical characters
    for (var i = 0; i < opts.minNums; i++) {
      const randomChar = this.getRandomInt(0, opts.nums.length - 1)
      into[idx] = opts.nums.charAt(randomChar)
      idx++
    }

    // insert special characters
    for (var i = 0; i < opts.minSpecial; i++) {
      const randomChar = this.getRandomInt(0, opts.specials.length - 1)
      into[idx] = opts.specials.charAt(randomChar)
      idx++
    }

    return into
  }

  // getRandomInt tries to generate a number until it gets one that is in a multiple of the range.
  // It does this to ensure that all numbers within the range have an equal chance of being chosen, giving a uniform distribution of random numbers.
  getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)

    let range = max - min + 1
    let maxGeneratableNumber = Math.floor(0xffffffff / range) * range

    let array, random
    do {
      array = new Uint32Array(1)
      window.crypto.getRandomValues(array)
      random = array[0]
    } while (random >= maxGeneratableNumber)

    return (random % range) + min
  }
}

export const cryptoSvc = new Crypto()
