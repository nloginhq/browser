const svgLock = `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 30 30" width="15px" height="15px">
    <g id="surface77641906">
        <path style=" stroke:none;fill-rule:nonzero;fill:rgb(255,255,0%);fill-opacity:1;" d="M 15 0.796875 C 10.632812 0.796875 7.066406 4.363281 7.066406 8.730469 L 7.066406 10.996094 L 4.800781 10.996094 C 3.546875 10.996094 2.535156 12.011719 2.535156 13.265625 L 2.535156 26.863281 C 2.535156 28.117188 3.546875 29.132812 4.800781 29.132812 L 25.199219 29.132812 C 26.453125 29.132812 27.464844 28.117188 27.464844 26.863281 L 27.464844 13.265625 C 27.464844 12.011719 26.453125 10.996094 25.199219 10.996094 L 22.933594 10.996094 L 22.933594 8.730469 C 22.933594 4.503906 19.574219 1.101562 15.402344 0.878906 C 15.273438 0.828125 15.136719 0.800781 15 0.796875 Z M 15 3.066406 C 18.144531 3.066406 20.667969 5.585938 20.667969 8.730469 L 20.667969 10.996094 L 9.332031 10.996094 L 9.332031 8.730469 C 9.332031 5.585938 11.855469 3.066406 15 3.066406 Z M 15 3.066406 "/>
    </g>
  </svg>   
`

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.query === 'fill') {
    username = request.cred.username
    if (username === '') {
      // try the email instead
      username = request.cred.email
    }
    password = request.cred.password
    fillAndLogin()
  }
})

function createUnlockButton() {
  var button = document.createElement('button')
  button.style.backgroundColor = 'rgb(243, 84, 0)'
  button.style.color = 'black'
  button.style.position = 'fixed'
  button.style.top = '-50px'
  button.style.left = '0'
  button.style.border = 'none'
  button.style.padding = '15px 32px'
  button.style.textAlign = 'center'
  button.style.textDecoration = 'none'
  button.style.display = 'flex'
  button.style.alignItems = 'center'
  button.style.justifyContent = 'center'
  button.style.fontSize = '16px'
  button.style.margin = '4px 2px'
  button.style.cursor = 'pointer'
  button.style.borderRadius = '12px'
  button.style.opacity = '0'
  button.style.transition = 'all 1s ease'

  button.onmouseover = buttonMouseOver
  button.onmouseout = buttonMouseOut

  return button
}

function buttonMouseOver(this: any) {
  let lock = this.querySelector('.lock svg') as HTMLElement
  if (lock) {
    lock.style.animation = 'jiggle 0.5s'
    lock.style.fill = 'rgb(243, 84, 0)'
  }
  this.style.backgroundColor = 'black'
  this.style.color = 'rgb(243, 84, 0)'
}

function buttonMouseOut(this: any) {
  let lock = this.querySelector('.lock svg') as HTMLElement
  if (lock) {
    lock.style.animation = ''
    lock.style.fill = 'black' // Reset SVG color
  }
  this.style.backgroundColor = 'rgb(243, 84, 0)'
  this.style.color = 'black'
}

let username = ''
let password = ''
let usernameInput: HTMLInputElement | null = null
let passwordInput: HTMLInputElement | null = null

function setInputValue(input: HTMLInputElement, value: string) {
  input.value = value
  var event = new Event('input', { bubbles: true })
  input.dispatchEvent(event)
}

function fillAndLogin() {
  if (usernameInput) {
    setInputValue(usernameInput, username)
  }
  if (passwordInput) {
    setInputValue(passwordInput, password)
  }
  // TODO: submit form
}

function findPasswordInputs() {
  var forms = document.getElementsByTagName('form')
  for (var i = 0; i < forms.length; i++) {
    var inputs = forms[i].getElementsByTagName('input')
    for (var j = 0; j < inputs.length; j++) {
      let currentInput = inputs[j]
      if (
        currentInput.type.toLowerCase() === 'text' ||
        currentInput.type.toLowerCase() === 'email'
      ) {
        usernameInput = currentInput
      } else if (inputs[j].type.toLowerCase() === 'password') {
        chrome.runtime.sendMessage({ query: window.location.hostname }, function (response) {
          var button = createUnlockButton()
          // determine the platform and set the key combo
          let keyCombo: string
          if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
            keyCombo = 'Ctrl+Command+K'
          } else {
            keyCombo = 'Alt+Shift+K'
          }
          button.innerHTML = `<div class="lock">${svgLock} Unlock nlogin with ${keyCombo}</div>`

          if (response.unlocked) {
            if (response.credential == '') {
              // TODO
              button.innerHTML = `<div class="lock">${svgLock} Create an account with nlogin</div>`
            } else {
              username = response.credential.email
              password = response.credential.password

              passwordInput = currentInput

              button.innerHTML = `<div class="lock">${svgLock} Click to fill</div>`
              button.onclick = fillAndLogin
            }
          }
          document.body.appendChild(button)

          // animate in after a short delay
          setTimeout(function () {
            button.style.top = '0'
            button.style.opacity = '1'
          }, 100)

          // animate out after 10 seconds
          setTimeout(function () {
            button.style.top = '-50px'
            button.style.opacity = '0'
          }, 10000)
        })
        // only find the first password input
        return
      }
    }
  }
}

var style = document.createElement('style')
style.innerHTML = `
  @keyframes jiggle {
      0% { transform: rotate(0deg); }
      20% { transform: rotate(-10deg); }
      40% { transform: rotate(10deg); }
      60% { transform: rotate(-10deg); }
      80% { transform: rotate(10deg); }
      100% { transform: rotate(0deg); }
  }  
`

document.head.appendChild(style)

// Start the script by looking for password inputs
findPasswordInputs()

export {}
