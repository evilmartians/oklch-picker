import { buildForCSS } from '../../lib/colors.ts'
import { current, randomColor } from '../../stores/current.ts'
import { primerColor, submitEntry, submitting } from '../../stores/contest.ts'

const THRESHOLD = 100

let main = document.querySelector<HTMLElement>('.main')!

let expand = main.querySelector<HTMLButtonElement>('.main_expand')!

let mobile = window.matchMedia('(max-width:830px)')

let startY = 0

// Start expanded on mobile for contest
let isExpanded = expand.ariaExpanded === 'true' || mobile.matches

function changeExpanded(shouldExpand = false): void {
  if (shouldExpand === isExpanded) return

  isExpanded = shouldExpand
  expand.ariaExpanded = String(isExpanded)
  document.body.classList.toggle('is-main-collapsed', !isExpanded)
}

function onTouchStart(event: TouchEvent): void {
  startY = event.touches[0].clientY
}

function onTouchMove(event: TouchEvent): void {
  event.preventDefault()
  let endY = event.changedTouches[0].clientY
  let diff = endY - startY
  let allowPositive = isExpanded && diff > 0
  let allowNegative = !isExpanded && diff < 0

  if (allowPositive || allowNegative) {
    main.style.setProperty('--touch-diff', `${diff}px`)
  }
}

function onTouchEnd(event: TouchEvent): void {
  let endY = event.changedTouches[0].clientY
  let diff = startY - endY

  main.style.removeProperty('--touch-diff')

  if (Math.abs(diff) > THRESHOLD) {
    changeExpanded(diff > 0)
  }
}

function onScroll(): void {
  changeExpanded(false)
}

function init(): void {
  if (mobile.matches) {
    // Removed scroll collapse - keep panel visible for contest use
    // window.addEventListener('scroll', onScroll, { once: true })
    main.addEventListener('touchstart', onTouchStart)
    main.addEventListener('touchmove', onTouchMove)
    main.addEventListener('touchend', onTouchEnd)
  } else {
    // window.removeEventListener('scroll', onScroll)
    main.removeEventListener('touchstart', onTouchStart)
    main.removeEventListener('touchmove', onTouchMove)
    main.removeEventListener('touchend', onTouchEnd)
  }
}

init()
mobile.addEventListener('change', init)

// Ensure panel starts expanded on mobile
if (mobile.matches) {
  changeExpanded(true)
}

expand.addEventListener('click', () => {
  changeExpanded(!isExpanded)
})

let nameInput = document.querySelector<HTMLInputElement>('#contest-name')
let contactInput = document.querySelector<HTMLInputElement>('#contest-contact')
let submitBtn = document.querySelector<HTMLButtonElement>('#contest-submit-bottom')
let successDiv = document.querySelector<HTMLDivElement>('#contest-success-msg')
let submittedInfo = document.querySelector<HTMLDivElement>('#contest-submitted-info')
let contestFormWrapper = document.querySelector<HTMLDivElement>('.contest-form-wrapper')
let resetBtn = document.querySelector<HTMLButtonElement>('#reset-contest')

function updateButtonColor(): void {
  try {
    if (submitBtn) {
      let color = current.get()
      let colorCSS = buildForCSS(color.l, color.c, color.h, 1)
      submitBtn.style.setProperty('--current-color', colorCSS)
    }
  } catch (e) {
    console.error('Error updating button color:', e)
  }
}

current.subscribe(() => {
  updateButtonColor()
})

// Check for saved state first, then set color
let hasRestoredColor = false
try {
  let savedState = sessionStorage.getItem('savedFormState')
  if (savedState) {
    let state = JSON.parse(savedState)
    // Only restore if saved within last 5 minutes (prevents stale data)
    if (Date.now() - state.timestamp < 5 * 60 * 1000) {
      if (nameInput && state.name) nameInput.value = state.name
      if (contactInput && state.contact) contactInput.value = state.contact
      // Restore color if present
      if (state.color) {
        current.set(state.color)
        primerColor.set(state.color)
        hasRestoredColor = true
      }
    }
    // Clear the saved state after restoring
    sessionStorage.removeItem('savedFormState')
  }
} catch (e) {
  console.error('Error restoring form state:', e)
}

// Only set random color if we didn't restore a saved color
if (!hasRestoredColor) {
  let initialColor = randomColor()
  current.set(initialColor)
  primerColor.set(initialColor)
}

updateButtonColor()

// Start with form visible

if (submitBtn) {
  let originalButtonText = submitBtn.textContent || 'Submit Guess'

  submitBtn.addEventListener('click', async () => {
    try {
      let name = nameInput?.value.trim() || ''
      let contact = contactInput?.value.trim() || ''

      if (!name || !contact) {
        alert('Please fill in both your name and contact info')
        return
      }

      let guessedColorValue = current.get()
      let primerColorValue = primerColor.get()

      if (!primerColorValue) {
        primerColorValue = guessedColorValue
      }

      // Show loading state
      submitBtn.disabled = true
      submitBtn.textContent = 'Submitting...'

      let success = await submitEntry(
        name,
        guessedColorValue,
        contact,
        primerColorValue
      )

      // Reset button state
      submitBtn.disabled = false
      submitBtn.textContent = originalButtonText

      if (!success) {
        alert('There was an error submitting your entry. Please try again.')
        return
      }

      if (submittedInfo) {
        submittedInfo.innerHTML = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Your color:</strong> OKLCH(${guessedColorValue.l.toFixed(2)} ${guessedColorValue.c.toFixed(3)} ${guessedColorValue.h.toFixed(1)})</p>
        <p style="margin-top: 12px; font-style: italic;">Returning to form in 3 seconds...</p>
      `
      }

      contestFormWrapper?.classList.add('is-hidden')
      successDiv?.classList.add('is-visible')
      submitBtn?.classList.add('is-hidden')

      // Clear the form inputs
      if (nameInput) nameInput.value = ''
      if (contactInput) contactInput.value = ''

      // After 3 seconds, hide success, show form, and set random color
      setTimeout(() => {
        // Generate new random color for next person
        let newRandomColor = randomColor()
        current.set(newRandomColor)
        primerColor.set(newRandomColor)

        contestFormWrapper?.classList.remove('is-hidden')
        successDiv?.classList.remove('is-visible')
        submitBtn?.classList.remove('is-hidden')
      }, 3000)
    } catch (e) {
      console.error('Error submitting entry:', e)
      submitBtn.disabled = false
      submitBtn.textContent = originalButtonText
      alert('There was an error submitting your entry. Please try again.')
    }
  })
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    contestFormWrapper?.classList.remove('is-hidden')
    successDiv?.classList.remove('is-visible')
    submitBtn?.classList.remove('is-hidden')
  })
}

let hiddenStyle = document.createElement('style')
hiddenStyle.textContent = '.is-hidden { display: none !important; }'
document.head.appendChild(hiddenStyle)
