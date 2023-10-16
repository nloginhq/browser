import { UnencryptedCredential } from '../service/client'

let localKey: CryptoKey | undefined // used for login and data key decryption
let dataKey: CryptoKey | undefined // used to encrypt and decrypt data
let auth = '' // the auth token, gets sent in a cookie also
let authExpiry = new Date() // the expiry date of the auth token
let mainEmail = '' // the user's main email
let credentials: UnencryptedCredential[] = [] // List of user's credentials

async function unlocked(): Promise<boolean> {
  if (authExpiry !== undefined) {
    if (new Date() < new Date(authExpiry)) {
      // auth still valid
      return true
    }
  }
  return false
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.query == 'getStoredAccount') {
    sendResponse({
      localKey,
      dataKey,
      auth,
      authExpiry,
      mainEmail,
    })
  }
  if (request.query == 'setStoredAccount') {
    localKey = request.localKey
    dataKey = request.dataKey
    auth = request.auth
    if (request.authExpiry !== undefined) {
      authExpiry = new Date(request.authExpiry)
    }
    dataKey = request.dataKey
    mainEmail = request.mainEmail
    return true
  }
  if (request.query == 'setStoredCredentials') {
    if (request.creds !== undefined) {
      credentials = request.creds
    }
    return true
  }
  if (request.query === 'fill') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { query: 'fill', cred: request.cred })
      }
    })
  }
  // check if unlocked and return if there are creds for website
  unlocked().then((authn) => {
    if (authn) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0].url || ''
        if (tab !== '') {
          var url = new URL(tab)
          var hostnameParts = url.hostname.split('.')
          var mainPart =
            hostnameParts.length > 2 ? hostnameParts[hostnameParts.length - 2] : url.hostname
          const matchingCredentials: UnencryptedCredential[] = credentials.filter((cred) =>
            cred.uri.includes(mainPart),
          )
          const match = matchingCredentials.length > 0 ? matchingCredentials[0] : null
          sendResponse({
            unlocked: true,
            credential: match,
          })
        }
      })
    } else {
      sendResponse({
        unlocked: false,
      })
    }
  })
  return true // indicates that sendResponse will be called asynchronously
})

export {}
