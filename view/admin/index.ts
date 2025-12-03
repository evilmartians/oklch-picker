import { differenceEuclidean } from 'culori/fn'

import { getColorDescription } from '../../lib/color-names.ts'
import { build, buildForCSS } from '../../lib/colors.ts'
import { $, $$ } from '../../lib/dom.ts'
import { current } from '../../stores/current.ts'
import {
  contest,
  exportEntries,
  loadServerEntries,
  loadingEntries,
  resetContest,
  setPantoneColor,
  showAdminPanel
} from '../../stores/contest.ts'

let modal = $<HTMLDivElement>('#admin-modal')
let pantonePreview = $<HTMLDivElement>('#pantone-preview')
let pantoneInfo = $<HTMLDivElement>('#pantone-info')
let setPantoneBtn = $<HTMLButtonElement>('#set-pantone-button')
let entriesCount = $<HTMLSpanElement>('#entries-count')
let entriesContainer = $<HTMLDivElement>('#entries-container')
let exportBtn = $<HTMLButtonElement>('#export-entries')
let clearBtn = $<HTMLButtonElement>('#clear-all-data')
let closeBtn = $<HTMLButtonElement>('#admin-close')
let refreshBtn = $<HTMLButtonElement>('#refresh-entries')

console.log('Admin panel initialized:', {
  modal: !!modal,
  pantonePreview: !!pantonePreview,
  pantoneInfo: !!pantoneInfo,
  setPantoneBtn: !!setPantoneBtn,
  entriesCount: !!entriesCount,
  entriesContainer: !!entriesContainer,
  exportBtn: !!exportBtn,
  clearBtn: !!clearBtn,
  closeBtn: !!closeBtn
})

function updatePantoneDisplay(): void {
  let state = contest.get()
  if (state.pantoneColor) {
    let { pantoneColor } = state
    let { description, name } = getColorDescription(pantoneColor)
    if (pantonePreview) {
      pantonePreview.style.background = buildForCSS(
        pantoneColor.l,
        pantoneColor.c,
        pantoneColor.h,
        pantoneColor.alpha
      )
    }
    if (pantoneInfo) {
      pantoneInfo.innerHTML = `
        <strong>${name}</strong><br>
        ${description}<br>
        <small>OKLCH: ${pantoneColor.l.toFixed(2)} ${pantoneColor.c.toFixed(3)} ${pantoneColor.h.toFixed(1)}</small>
      `
    }
  } else {
    if (pantoneInfo) {
      pantoneInfo.textContent = 'Not set'
    }
    if (pantonePreview) {
      pantonePreview.style.background = 'transparent'
    }
  }
}

function calculateDeltaE(
  color1: { c: number; h: number; l: number },
  color2: { c: number; h: number; l: number }
): number {
  let diff = differenceEuclidean()(build(color1.l, color1.c, color1.h), build(color2.l, color2.c, color2.h))
  return diff ?? Infinity
}

function updateEntriesList(): void {
  let state = contest.get()
  let { entries, pantoneColor } = state

  if (entriesCount) {
    entriesCount.textContent = entries.length.toString()
  }

  if (!entriesContainer) return

  if (entries.length === 0) {
    entriesContainer.innerHTML = '<p class="no-entries">No entries yet</p>'
    return
  }

  let entriesWithScores = entries.map(entry => ({
    deltaE: pantoneColor ? calculateDeltaE(entry.guessedColor, pantoneColor) : null,
    entry
  }))

  entriesWithScores.sort((a, b) => {
    if (a.deltaE === null) return 1
    if (b.deltaE === null) return -1
    return a.deltaE - b.deltaE
  })

  let minDelta = entriesWithScores[0]?.deltaE

  entriesContainer.innerHTML = entriesWithScores
    .map(({ deltaE, entry }, index) => {
      let guessedColor = build(entry.guessedColor.l, entry.guessedColor.c, entry.guessedColor.h, entry.guessedColor.alpha)
      let primerColor = build(entry.primerColor.l, entry.primerColor.c, entry.primerColor.h, entry.primerColor.alpha)
      let { description: guessedDesc, name: guessedName } = getColorDescription(guessedColor)
      let { description: primerDesc, name: primerName } = getColorDescription(primerColor)
      let date = new Date(entry.timestamp).toLocaleString()
      let isWinner = pantoneColor && deltaE === minDelta && deltaE !== null

      return `
      <div class="entry-item ${isWinner ? 'entry-winner' : ''}">
        <div class="entry-colors">
          <div class="entry-color-preview" style="background: ${buildForCSS(entry.primerColor.l, entry.primerColor.c, entry.primerColor.h, entry.primerColor.alpha)}" title="Primer Color"></div>
          <div class="entry-color-preview" style="background: ${buildForCSS(entry.guessedColor.l, entry.guessedColor.c, entry.guessedColor.h, entry.guessedColor.alpha)}" title="Guessed Color"></div>
        </div>
        <div class="entry-details">
          <div class="entry-name">${index + 1}. ${entry.name}${isWinner ? ' 🏆 WINNER' : ''}</div>
          <div class="entry-info">
            <strong>Primer:</strong> ${primerName} - ${primerDesc}<br>
            OKLCH: ${entry.primerColor.l.toFixed(2)} ${entry.primerColor.c.toFixed(3)} ${entry.primerColor.h.toFixed(1)}<br>
            <strong>Guessed:</strong> ${guessedName} - ${guessedDesc}<br>
            OKLCH: ${entry.guessedColor.l.toFixed(2)} ${entry.guessedColor.c.toFixed(3)} ${entry.guessedColor.h.toFixed(1)}<br>
            ${entry.contact ? `<strong>Contact:</strong> ${entry.contact}<br>` : ''}
            Submitted: ${date}
          </div>
          ${deltaE !== null ? `<div class="entry-delta">Delta-E: ${deltaE.toFixed(4)}</div>` : ''}
        </div>
      </div>
    `
    })
    .join('')
}

showAdminPanel.subscribe(visible => {
  console.log('showAdminPanel changed:', visible, 'modal element:', modal)
  if (visible) {
    if (modal) {
      modal.classList.add('is-visible')
      console.log('Added is-visible class to modal')
    } else {
      console.error('Modal element not found!')
    }
    updatePantoneDisplay()
    updateEntriesList()
  } else {
    modal?.classList.remove('is-visible')
  }
})

contest.subscribe(() => {
  if (showAdminPanel.get()) {
    updatePantoneDisplay()
    updateEntriesList()
  }
})

setPantoneBtn?.addEventListener('click', () => {
  let color = current.get()
  setPantoneColor(color)
  updatePantoneDisplay()
  updateEntriesList()
})

exportBtn?.addEventListener('click', () => {
  let dataStr = exportEntries(false)
  let blob = new Blob([dataStr], { type: 'application/json' })
  let url = URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = `pantone-contest-entries-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
})

clearBtn?.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear ALL contest data? This cannot be undone!')) {
    resetContest()
    updateEntriesList()
  }
})

closeBtn?.addEventListener('click', () => {
  showAdminPanel.set(false)
})

refreshBtn?.addEventListener('click', async () => {
  if (refreshBtn) {
    refreshBtn.disabled = true
    refreshBtn.textContent = 'Loading...'
  }
  await loadServerEntries()
  if (refreshBtn) {
    refreshBtn.disabled = false
    refreshBtn.textContent = 'Refresh'
  }
})

// Update loading state
loadingEntries.subscribe(loading => {
  if (entriesContainer && loading) {
    entriesContainer.innerHTML = '<p class="no-entries">Loading entries...</p>'
  }
})

$$('.admin-overlay').forEach(overlay => {
  overlay.addEventListener('click', () => {
    showAdminPanel.set(false)
  })
})

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault()
    showAdminPanel.set(!showAdminPanel.get())
  }
})
