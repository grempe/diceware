import {
  calcAllTiers,
  ENTROPY_PER_CAP,
  ENTROPY_PER_SYMBOL,
  ENTROPY_PER_WORD,
  formatCrackValue,
  formatSpeed,
} from './entropy.js'

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => document.querySelectorAll(sel)

// Passphrase format functions
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const formatters = {
  spaces: (words) => words.map((w) => w.word).join(' '),
  hyphens: (words) => words.map((w) => w.word).join('-'),
  PascalCase: (words) => words.map((w) => capitalize(w.word)).join(''),
  camelCase: (words) =>
    words.map((w, i) => (i === 0 ? w.word : capitalize(w.word))).join(''),
  snake_case: (words) => words.map((w) => w.word).join('_'),
  dots: (words) => words.map((w) => w.word).join('.'),
}

let currentFormat = 'spaces'

export function displayMetadata(meta) {
  const el = $('#listMetadata')
  if (!el) return
  if (!meta) {
    el.hidden = true
    return
  }
  el.replaceChildren()

  const items = []
  if (meta.source) {
    try {
      const link = document.createElement('a')
      link.href = meta.source
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = new URL(meta.source).hostname
      items.push(link)
    } catch {
      // invalid URL, skip
    }
  }
  for (const text of [meta.author, meta.license, meta.note]) {
    if (text) items.push(document.createTextNode(text))
  }

  if (items.length === 0) {
    el.hidden = true
    return
  }
  el.hidden = false
  items.forEach((item, i) => {
    if (i > 0) el.append(' · ')
    el.append(item)
  })
}

export function resetUI(currentList) {
  const titleEl = $('#listTitleHeader span')
  if (titleEl) titleEl.textContent = currentList

  const tokenContainer = $('#wordTokens')
  if (tokenContainer) tokenContainer.replaceChildren()

  const display = $('#passphraseDisplay')
  if (display) display.hidden = true

  const statsContainer = $('#statsContainer')
  if (statsContainer) statsContainer.hidden = true

  window.location.hash = currentList
}

let onRemoveToken = null

export function setRemoveTokenHandler(handler) {
  onRemoveToken = handler
}

export function renderPassphrase(wordList) {
  // Render word tokens
  const tokenContainer = $('#wordTokens')
  tokenContainer.replaceChildren()

  for (let i = 0; i < wordList.length; i++) {
    const item = wordList[i]
    const token = document.createElement('a')
    token.href = '#'
    token.className = 'word-token'
    token.setAttribute('aria-label', `Remove: ${item.word}`)
    const wordSpan = document.createElement('span')
    wordSpan.className = 'word-text'
    wordSpan.textContent = item.word
    const rollSpan = document.createElement('span')
    rollSpan.className = 'word-roll'
    rollSpan.textContent = item.wordNum
    token.append(wordSpan, rollSpan)
    token.addEventListener('click', (e) => {
      e.preventDefault()
      if (onRemoveToken) onRemoveToken(i)
    })
    tokenContainer.appendChild(token)
  }

  // Render formatted output
  const formatter = formatters[currentFormat] ?? formatters.spaces
  $('#passphraseText').textContent = formatter(wordList)

  const display = $('#passphraseDisplay')
  if (display) display.hidden = wordList.length === 0
}

export function displayWords(words, wordList, totalEntropy) {
  for (const obj of words) {
    totalEntropy += obj.entropy
    wordList.push({ word: obj.word, wordNum: obj.wordNum, caps: 0 })
  }

  renderPassphrase(wordList)
  return totalEntropy
}

export function setupFormatSelector(getWordList) {
  for (const link of $$('.format-link[data-format]')) {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      for (const l of $$('.format-link[data-format]'))
        l.classList.remove('active')
      link.classList.add('active')

      currentFormat = link.dataset.format
      const formatter = formatters[currentFormat] ?? formatters.spaces
      $('#passphraseText').textContent = formatter(getWordList())
    })
  }
}

function bestTimeUnit(years) {
  if (years < 1 / 365 / 24 / 60)
    return { value: years * 365 * 24 * 3600, unit: 'seconds' }
  if (years < 1 / 365 / 24)
    return { value: years * 365 * 24 * 60, unit: 'minutes' }
  if (years < 1 / 365) return { value: years * 365 * 24, unit: 'hours' }
  if (years < 1) return { value: years * 365, unit: 'days' }
  if (years < 1000) return { value: years, unit: 'years' }
  if (years < 1_000_000_000) return { value: years / 1000, unit: 'millennia' }
  return { value: years / 13_798_000_000, unit: 'x age of universe' }
}

function formatBestTime(years) {
  const { value, unit } = bestTimeUnit(years)
  if (value < 0.01) return `< 0.01 ${unit}`
  if (value >= 1) return `~${formatCrackValue(value, 0)} ${unit}`
  return `~${formatCrackValue(value, 2)} ${unit}`
}

export function displayStats(wordList, totalEntropy) {
  const wordCount = wordList.filter((w) => w.wordNum.length === 5).length
  const symbolCount = wordList.filter((w) => w.wordNum.length === 2).length
  const capsCount = wordList.reduce((sum, w) => sum + (w.caps || 0), 0)

  // Entropy card
  const breakdown = $('#entropyBreakdown')
  breakdown.replaceChildren()

  if (wordCount > 0) {
    const wordBits = (wordCount * ENTROPY_PER_WORD).toFixed(2)
    breakdown.append(
      `${wordCount} word${wordCount !== 1 ? 's' : ''} \u00d7 ${ENTROPY_PER_WORD.toFixed(2)} = ${wordBits} bits`,
    )
  }
  if (symbolCount > 0) {
    if (wordCount > 0) breakdown.append(document.createElement('br'))
    const symBits = (symbolCount * ENTROPY_PER_SYMBOL).toFixed(2)
    breakdown.append(
      `${symbolCount} symbol${symbolCount !== 1 ? 's' : ''} \u00d7 ${ENTROPY_PER_SYMBOL.toFixed(2)} = ${symBits} bits`,
    )
  }
  if (capsCount > 0) {
    if (wordCount > 0 || symbolCount > 0)
      breakdown.append(document.createElement('br'))
    const capBits = (capsCount * ENTROPY_PER_CAP).toFixed(2)
    breakdown.append(
      `${capsCount} cap${capsCount !== 1 ? 's' : ''} \u00d7 ${ENTROPY_PER_CAP.toFixed(2)} = ${capBits} bits`,
    )
  }
  breakdown.append(document.createElement('br'))
  const total = document.createElement('strong')
  total.textContent = `Total: ${totalEntropy.toFixed(2)} bits`
  breakdown.append(total)

  // Crack time card — pass counts for exact BigInt keyspace calculation
  const { tiers } = calcAllTiers(wordCount, symbolCount, capsCount)
  const tbody = $('#crackTimeTiers')
  tbody.replaceChildren()

  for (const tier of tiers) {
    const tr = document.createElement('tr')
    const td1 = document.createElement('td')
    td1.textContent = tier.label
    const td2 = document.createElement('td')
    td2.textContent = `${formatSpeed(tier.guessesPerSec)}/sec`
    const td3 = document.createElement('td')
    td3.textContent = formatBestTime(tier.years)
    tr.append(td1, td2, td3)
    tbody.appendChild(tr)
  }

  const statsContainer = $('#statsContainer')
  if (statsContainer) statsContainer.hidden = false
}

export function setupCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-button')
    if (!btn) return
    const targetSel = btn.dataset.clipboardTarget
    const text = document.querySelector(targetSel)?.textContent
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      const original = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(() => {
        btn.textContent = original
      }, 1500)
    } catch {
      // Clipboard API may fail in non-secure contexts
    }
  })
}
