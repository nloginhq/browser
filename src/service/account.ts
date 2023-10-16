import { baseURL } from './constants'
import { cryptoSvc } from './crypto'
import { browser } from 'webextension-polyfill-ts'

export interface LoginResponse {
  bearer: string
  expires: string
  encryptedDataKey: string
  premium: boolean
}

export class Account {
  localKey: CryptoKey | undefined // used for login and data key decryption
  dataKey: CryptoKey | undefined // used to encrypt and decrypt data
  auth = '' // the auth token, gets sent in a cookie also
  premium = false // whether the user is a premium user
  authExpiry = new Date() // the expiry date of the auth token
  mainEmail = '' // the user's main email

  constructor() {
    this.initialize()
  }

  async initialize() {
    try {
      // read cached account info from background memory
      const stored = await chrome.runtime.sendMessage({ query: 'getStoredAccount' })
      this.auth = stored.auth
      this.mainEmail = stored.mainEmail
      if (stored.authExpiry !== undefined) {
        this.authExpiry = new Date(stored.authExpiry)
      }
      if (stored.dataKey !== undefined) {
        this.dataKey = await cryptoSvc.base64StringToKey(stored.dataKey)
      }
    } catch (error) {
      console.error('Failed to initialize account:', error)
    }
  }

  delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  // login derives a private key from the presented information and authenticate the user
  async login(password: string, email: string) {
    await this.delay(300) // this delay forces the loading to render before the long key operations

    this.localKey = await cryptoSvc.derivePBKDFKey(password, email) // SHA-512 PBKDF2 key
    const b64LocalKey = await cryptoSvc.keyToBase64String(this.localKey)
    const hashedLocalKey = await cryptoSvc.hash(b64LocalKey, password)

    try {
      let resp = await fetch(baseURL + '/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          hashedLocalKey,
        }),
      })

      if (!resp.ok) {
        throw await resp.json()
      }

      let session = (await resp.json()) as LoginResponse
      this.auth = session.bearer
      this.authExpiry = new Date(session.expires)
      this.mainEmail = email
      this.premium = session.premium
      let decrypted = await cryptoSvc.aesDecrypt(this.localKey, session.encryptedDataKey)
      this.dataKey = await cryptoSvc.base64StringToKey(decrypted)
      // set auth info in cached background memory
      chrome.runtime.sendMessage({
        query: 'setStoredAccount',
        auth: this.auth,
        authExpiry: session.expires,
        mainEmail: this.mainEmail,
        dataKey: decrypted,
      })
      browser.storage.local.set({
        mainEmail: this.mainEmail,
      })
    } catch (e: any) {
      console.log('failed to login: ' + e)
      throw e
    }
  }
}

export const accountSvc = new Account()
