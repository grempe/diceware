import { secureRandom } from './crypto.js'
import { calcEntropy } from './entropy.js'
import {
  displayMetadata,
  displayStats,
  displayWords,
  renderPassphrase,
  resetUI,
  setRemoveTokenHandler,
  setupCopyButtons,
  setupFormatSelector,
} from './ui.js'
import {
  getAvailableListNames,
  getCurrentList,
  getCurrentListMetadata,
  lookupWord,
  setCurrentList,
} from './wordlist.js'

// Application state — wordList stores {word, wordNum} objects
let wordList = []
let totalEntropy = 0

function reset() {
  wordList = []
  totalEntropy = 0
  resetUI(getCurrentList())
  displayMetadata(getCurrentListMetadata())
  const select = document.querySelector('#languageSelect')
  if (select) select.value = getCurrentList()
}

// Generate words by simulating physical dice rolls with the CSPRNG.
// Each die face is secureRandom(6) → [0,5], then +1 → [1,6].
// Five rolls produce a 5-digit key ("11111"–"66666") covering all 6^5 = 7,776
// entries in a diceware word list.  Two rolls produce a 2-digit key ("11"–"66")
// covering all 6^2 = 36 special characters.  Because each roll is an independent
// uniform draw, the combined key is uniform over the full list — each word or
// symbol is equally likely, contributing exactly log2(7776) ≈ 12.92 or
// log2(36) ≈ 5.17 bits of entropy.
function getWords(numWords = 1, numRollsPerWord = 5) {
  const words = []
  for (let i = 0; i < numWords; i++) {
    const rolls = []
    for (let j = 0; j < numRollsPerWord; j++) {
      rolls.push(secureRandom(6) + 1)
    }
    const result = lookupWord(rolls.join(''))
    if (result) words.push(result)
  }
  return words
}

// Load list from URL hash on startup
function initFromHash() {
  const listName = window.location.hash.slice(1)
  const available = getAvailableListNames()
  if (available.includes(listName)) {
    setCurrentList(listName)
  }
  reset()
}

// Language selection
document.querySelector('#languageSelect')?.addEventListener('change', (e) => {
  setCurrentList(e.target.value)
  reset()
})

// Fisher-Yates (Knuth) shuffle using the CSPRNG.
// On each iteration, element i is swapped with a uniformly random element from
// [0, i].  secureRandom(i + 1) returns [0, i] — exactly the range Fisher-Yates
// requires.  The do-while loop guarantees the visible order actually changes;
// the Set-size guard above it prevents an infinite loop when every word is the
// same (since no permutation can change the display in that case).
// Shuffling does not alter entropy — word *selection* is what provides entropy,
// not word *ordering*.
document.querySelector('#shuffleButton')?.addEventListener('click', () => {
  if (wordList.length < 2) return
  if (new Set(wordList.map((w) => w.word)).size < 2) return
  const original = wordList.map((w) => w.word).join(' ')
  do {
    for (let i = wordList.length - 1; i > 0; i--) {
      const j = secureRandom(i + 1)
      ;[wordList[i], wordList[j]] = [wordList[j], wordList[i]]
    }
  } while (wordList.map((w) => w.word).join(' ') === original)
  renderPassphrase(wordList)
})

// Word generation buttons (event delegation)
document.querySelector('#generateButtons')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-words]')
  if (!btn) return

  const numWords = parseInt(btn.dataset.words, 10)
  const numRolls = parseInt(btn.dataset.rolls, 10)
  const shouldReset = parseInt(btn.dataset.reset, 10) === 1

  if (shouldReset) reset()

  const words = getWords(numWords, numRolls)
  totalEntropy = displayWords(words, wordList, totalEntropy)
  displayStats(wordList, totalEntropy)
})

// Manual die roll form
document
  .querySelector('#addFiveDieRollWordForm')
  ?.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = document.querySelector('#addFiveDieRollWord')
    const value = input.value.trim()

    if (/^[1-6]{2}$/.test(value) || /^[1-6]{5}$/.test(value)) {
      const result = lookupWord(value)
      if (result) {
        totalEntropy = displayWords([result], wordList, totalEntropy)
        displayStats(wordList, totalEntropy)
      }
    }

    input.value = ''
  })

// Hash change support
window.addEventListener('hashchange', () => {
  const listName = window.location.hash.slice(1)
  if (getAvailableListNames().includes(listName)) {
    setCurrentList(listName)
    reset()
  }
})

// Remove token handler

setRemoveTokenHandler((index) => {
  const removed = wordList.splice(index, 1)[0]
  const isSymbol = removed.wordNum.length === 2
  totalEntropy -= calcEntropy(isSymbol)
  if (totalEntropy < 0) totalEntropy = 0

  renderPassphrase(wordList)
  if (wordList.length > 0) {
    displayStats(wordList, totalEntropy)
  } else {
    const statsContainer = document.querySelector('#statsContainer')
    if (statsContainer) statsContainer.hidden = true
  }
})

// Initialize
setupCopyButtons()
setupFormatSelector(() => wordList)
initFromHash()

// Set copyright year
for (const el of document.querySelectorAll('.current-year')) {
  el.textContent = new Date().getFullYear()
}
