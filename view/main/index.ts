import { buildForCSS } from '../../lib/colors.ts'
import { current, randomColor } from '../../stores/current.ts'
import { clearCurrentEntry, primerColor, submitEntry, submitting } from '../../stores/contest.ts'

let nameInput = document.querySelector<HTMLInputElement>('#contest-name')
let contactInput = document.querySelector<HTMLInputElement>('#contest-contact')
let submitBtn = document.querySelector<HTMLButtonElement>('#contest-submit-bottom')
let contestFormWrapper = document.querySelector<HTMLDivElement>('.contest-form-wrapper')
let bottomButtons = document.querySelector<HTMLDivElement>('.bottom-buttons')

// Full-screen success modal elements
let successModal = document.querySelector<HTMLDivElement>('#success-modal')
let successDetails = document.querySelector<HTMLDivElement>('#success-details')
let successDismiss = document.querySelector<HTMLButtonElement>('#success-dismiss')

// Store submitted values for edit functionality
let lastSubmittedName = ''
let lastSubmittedContact = ''

function updateColors(): void {
  try {
    let color = current.get()
    let colorCSS = buildForCSS(color.l, color.c, color.h, 1)

    // Update page background
    document.body.style.setProperty('--current-color', colorCSS)

    // Update submit button
    if (submitBtn) {
      submitBtn.style.setProperty('--current-color', colorCSS)
    }

    // Update bottom buttons container for mobile
    if (bottomButtons) {
      bottomButtons.style.setProperty('--current-color', colorCSS)
    }
  } catch (e) {
    console.error('Error updating colors:', e)
  }
}

current.subscribe(() => {
  updateColors()
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

updateColors()

// Start with form visible

if (submitBtn) {
  let originalButtonHTML = submitBtn.innerHTML

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
      submitBtn.innerHTML = originalButtonHTML

      if (!success) {
        alert('There was an error submitting your entry. Please try again.')
        return
      }

      // Store values for potential edit
      lastSubmittedName = name
      lastSubmittedContact = contact

      // Show full-screen success modal with submitted color as background
      if (successModal && successDetails) {
        let colorCSS = buildForCSS(guessedColorValue.l, guessedColorValue.c, guessedColorValue.h, 1)
        successModal.style.setProperty('--submitted-color', colorCSS)
        successDetails.innerHTML = `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Contact:</strong> ${contact}</p>
        `
        successModal.classList.add('is-visible')
      }
    } catch (e) {
      console.error('Error submitting entry:', e)
      submitBtn.disabled = false
      submitBtn.innerHTML = originalButtonHTML
      alert('There was an error submitting your entry. Please try again.')
    }
  })
}

// Success modal button handlers
let successEdit = document.querySelector<HTMLButtonElement>('#success-edit')

if (successDismiss) {
  successDismiss.addEventListener('click', () => {
    // Clear form and generate new random color for next person
    if (nameInput) nameInput.value = ''
    if (contactInput) contactInput.value = ''
    lastSubmittedName = ''
    lastSubmittedContact = ''

    // Clear the entry ID so next submission creates a new entry
    clearCurrentEntry()

    let newRandomColor = randomColor()
    current.set(newRandomColor)
    primerColor.set(newRandomColor)

    // Hide the modal
    successModal?.classList.remove('is-visible')
  })
}

if (successEdit) {
  successEdit.addEventListener('click', () => {
    // Restore form values so they can edit and resubmit
    if (nameInput) nameInput.value = lastSubmittedName
    if (contactInput) contactInput.value = lastSubmittedContact

    // Close modal - color is already preserved
    successModal?.classList.remove('is-visible')
  })
}

let hiddenStyle = document.createElement('style')
hiddenStyle.textContent = '.is-hidden { display: none !important; }'
document.head.appendChild(hiddenStyle)
