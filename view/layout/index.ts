import { adminLogin } from '../../lib/contest-api.ts'
import { toggleVisibility } from '../../lib/dom.ts'
import { loadServerEntries, showAdminPanel } from '../../stores/contest.ts'
import { show3d } from '../../stores/settings.ts'
import { url } from '../../stores/url.ts'
import { current } from '../../stores/current.ts'

let layout = document.querySelector<HTMLDivElement>('.layout')!
let card3d = document.querySelector<HTMLDivElement>('.layout_3d')!

show3d.subscribe(enabled => {
  card3d.classList.toggle('is-shown', enabled)
})

url.subscribe(value => {
  toggleVisibility(layout, value !== '3d')
})

// Admin button password protection with custom modal
let adminButton = document.querySelector<HTMLButtonElement>('#admin-button')
let passwordModal = document.querySelector<HTMLDivElement>('#password-modal')
let emailInput = document.querySelector<HTMLInputElement>('#email-input')
let passwordInput = document.querySelector<HTMLInputElement>('#password-input')
let passwordSubmit = document.querySelector<HTMLButtonElement>('#password-submit')
let passwordCancel = document.querySelector<HTMLButtonElement>('#password-cancel')
let passwordOverlay = document.querySelector<HTMLDivElement>('.password-overlay')

function showPasswordModal(): void {
  passwordModal?.classList.add('is-visible')
  emailInput?.focus()
  if (emailInput) emailInput.value = ''
  if (passwordInput) passwordInput.value = ''
}

function hidePasswordModal(): void {
  passwordModal?.classList.remove('is-visible')
  if (emailInput) emailInput.value = ''
  if (passwordInput) passwordInput.value = ''
}

async function checkPassword(): Promise<void> {
  let email = emailInput?.value || ''
  let password = passwordInput?.value || ''

  if (!email || !password) {
    alert('Please enter both email and password')
    return
  }

  // Disable button while logging in
  if (passwordSubmit) {
    passwordSubmit.disabled = true
    passwordSubmit.textContent = 'Logging in...'
  }

  let result = await adminLogin(email, password)

  if (passwordSubmit) {
    passwordSubmit.disabled = false
    passwordSubmit.textContent = 'Login'
  }

  if (result.success) {
    hidePasswordModal()
    showAdminPanel.set(true)
    // Load entries from server after successful login
    loadServerEntries()
  } else {
    alert(result.error || 'Login failed')
    passwordInput?.focus()
  }
}

if (adminButton) {
  adminButton.addEventListener('click', showPasswordModal)
}

passwordSubmit?.addEventListener('click', checkPassword)
passwordCancel?.addEventListener('click', hidePasswordModal)
passwordOverlay?.addEventListener('click', hidePasswordModal)

emailInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    passwordInput?.focus()
  } else if (e.key === 'Escape') {
    hidePasswordModal()
  }
})

passwordInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    checkPassword()
  } else if (e.key === 'Escape') {
    hidePasswordModal()
  }
})

// See Past button - navigate to pantone colors page
let seePastBtn = document.querySelector<HTMLButtonElement>('#see-past-btn')
if (seePastBtn) {
  seePastBtn.addEventListener('click', () => {
    // Save current state to sessionStorage before navigation
    try {
      let nameInput = document.querySelector<HTMLInputElement>('#contest-name')
      let contactInput = document.querySelector<HTMLInputElement>('#contest-contact')
      let currentColor = current.get()

      sessionStorage.setItem('savedFormState', JSON.stringify({
        name: nameInput?.value || '',
        contact: contactInput?.value || '',
        color: currentColor,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.error('Error saving form state:', e)
    }

    window.location.href = '/reports/pantone-colors-of-the-year.html'
  })
}

