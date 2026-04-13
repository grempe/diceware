import type { CheckResult, ListData } from './types.ts'

function checkEntropyAndEfficiency(data: ListData): CheckResult {
  const words = Object.values(data.wordMap)
  const entropy = Math.log2(words.length)
  const lengths = words.map((w) => w.length)
  const meanLen = lengths.reduce((s, l) => s + l, 0) / lengths.length
  const minLen = Math.min(...lengths)
  const efficiency = entropy / meanLen
  const assumedEfficiency = entropy / minLen

  return {
    id: 'entropy-efficiency',
    name: 'Entropy & efficiency',
    severity: 'INFO',
    passed: true,
    message: `${entropy.toFixed(2)} bits/word`,
    details: [
      `entropy per word: ${entropy.toFixed(2)} bits`,
      `efficiency (entropy / mean length): ${efficiency.toFixed(2)} bits/char`,
      `assumed efficiency (entropy / shortest word): ${assumedEfficiency.toFixed(2)} bits/char`,
    ],
  }
}

function checkNonWordEntries(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'non-word-entries',
      name: 'Non-word entries',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const allDigits: string[] = []
  const allSymbols: string[] = []
  const alphaRuns: string[] = [] // e.g. "abc", "xyz", "abcd"
  const numericRuns: string[] = [] // e.g. "123", "1000"
  const repeatedChars: string[] = [] // e.g. "aaa", "!!!"
  const singleChar: string[] = []
  const twoChar: string[] = []

  // Common alphabetical run patterns
  const ALPHA_RUNS = new Set([
    'abc',
    'abcd',
    'abcde',
    'abcdef',
    'xyz',
    'qwerty',
    'asdf',
    'zxcv',
  ])

  for (const [key, word] of Object.entries(data.wordMap)) {
    const entry = `${key}:"${word}"`

    if (word.length === 1) {
      singleChar.push(entry)
    } else if (word.length === 2 && /^\p{L}{2}$/u.test(word)) {
      twoChar.push(entry)
    }

    if (/^\d+$/.test(word)) {
      allDigits.push(entry)
    } else if (/^[^\p{L}\p{N}]+$/u.test(word)) {
      allSymbols.push(entry)
    }

    if (ALPHA_RUNS.has(word.toLowerCase())) {
      alphaRuns.push(entry)
    }

    // Numeric sequences and round numbers
    if (/^\d+$/.test(word)) {
      const n = Number.parseInt(word, 10)
      if (
        word === '0' ||
        (n >= 10 &&
          n <= 9999 &&
          (n % 10 === 0 || n % 100 === 0 || n % 1000 === 0))
      ) {
        numericRuns.push(entry)
      }
    }

    // All same character repeated: "aaa", "!!!", "###"
    if (word.length >= 2 && [...word].every((ch) => ch === word[0])) {
      repeatedChars.push(entry)
    }
  }

  const details: string[] = []
  const total =
    allDigits.length +
    allSymbols.length +
    alphaRuns.length +
    repeatedChars.length +
    singleChar.length

  if (singleChar.length > 0)
    details.push(
      `single characters (${singleChar.length}): ${singleChar.slice(0, 5).join(', ')}${singleChar.length > 5 ? ` ... (${singleChar.length} total)` : ''}`,
    )
  if (twoChar.length > 0)
    details.push(
      `two-letter entries (${twoChar.length}): ${twoChar.slice(0, 5).join(', ')}${twoChar.length > 5 ? ` ... (${twoChar.length} total)` : ''}`,
    )
  if (allDigits.length > 0)
    details.push(
      `all-digit entries (${allDigits.length}): ${allDigits.slice(0, 5).join(', ')}${allDigits.length > 5 ? ` ... (${allDigits.length} total)` : ''}`,
    )
  if (allSymbols.length > 0)
    details.push(
      `all-symbol entries (${allSymbols.length}): ${allSymbols.slice(0, 5).join(', ')}${allSymbols.length > 5 ? ` ... (${allSymbols.length} total)` : ''}`,
    )
  if (alphaRuns.length > 0)
    details.push(
      `alphabetical runs (${alphaRuns.length}): ${alphaRuns.join(', ')}`,
    )
  if (numericRuns.length > 0)
    details.push(
      `round/sequential numbers (${numericRuns.length}): ${numericRuns.slice(0, 5).join(', ')}${numericRuns.length > 5 ? ` ... (${numericRuns.length} total)` : ''}`,
    )
  if (repeatedChars.length > 0)
    details.push(
      `repeated characters (${repeatedChars.length}): ${repeatedChars.slice(0, 5).join(', ')}${repeatedChars.length > 5 ? ` ... (${repeatedChars.length} total)` : ''}`,
    )

  return {
    id: 'non-word-entries',
    name: 'Non-word entries',
    severity: 'INFO',
    passed: total === 0,
    message:
      total === 0
        ? 'no filler entries detected'
        : `${total} non-word/filler entries detected (replacement candidates)`,
    details: details.length > 0 ? details : undefined,
  }
}

const LONG_WORD_THRESHOLD = 9

function checkLongWords(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'long-words',
      name: 'Long words',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const long: string[] = []
  for (const [key, word] of Object.entries(data.wordMap)) {
    if (word.length > LONG_WORD_THRESHOLD) {
      long.push(`${key}:"${word}" (${word.length} chars)`)
    }
  }

  return {
    id: 'long-words',
    name: `Long words (>${LONG_WORD_THRESHOLD} chars)`,
    severity: 'INFO',
    passed: long.length === 0,
    message:
      long.length === 0
        ? `no words exceed ${LONG_WORD_THRESHOLD} characters`
        : `${long.length} word${long.length !== 1 ? 's' : ''} exceed ${LONG_WORD_THRESHOLD} characters (replacement candidates)`,
    details:
      long.length > 0
        ? [
            ...long.slice(0, 20),
            ...(long.length > 20 ? [`... (${long.length - 20} more)`] : []),
          ]
        : undefined,
  }
}

function checkWordSortedOrder(data: ListData): CheckResult {
  const entries = Object.entries(data.wordMap)
  const outOfOrder: string[] = []

  for (let i = 0; i < entries.length - 1; i++) {
    const [keyA, wordA] = entries[i]
    const [keyB, wordB] = entries[i + 1]
    if (wordA.localeCompare(wordB) > 0) {
      outOfOrder.push(`"${wordA}" (${keyA}) > "${wordB}" (${keyB})`)
    }
  }

  return {
    id: 'word-sorted-order',
    name: 'Word sorted order',
    severity: 'INFO',
    passed: outOfOrder.length === 0,
    message:
      outOfOrder.length === 0
        ? 'words are in alphabetical order by key'
        : `${outOfOrder.length} out-of-order word${outOfOrder.length !== 1 ? 's' : ''}`,
    details:
      outOfOrder.length > 0
        ? [
            ...outOfOrder.slice(0, 5),
            ...(outOfOrder.length > 5
              ? [`... (${outOfOrder.length - 5} more)`]
              : []),
          ]
        : undefined,
  }
}

function checkNormalizationConsistency(data: ListData): CheckResult {
  const forms: Array<'NFC' | 'NFD' | 'NFKC' | 'NFKD'> = [
    'NFC',
    'NFD',
    'NFKC',
    'NFKD',
  ]
  const words = Object.values(data.wordMap)
  const consistent: string[] = []

  for (const form of forms) {
    const allMatch = words.every((w) => w === w.normalize(form))
    if (allMatch) consistent.push(form)
  }

  return {
    id: 'normalization-consistency',
    name: 'Normalization consistency',
    severity: 'INFO',
    passed: true,
    message:
      consistent.length > 0
        ? `consistent with: ${consistent.join(', ')}`
        : 'not consistent with any standard normalization form',
    details:
      consistent.length === 0
        ? ['words change under all normalization forms (NFC, NFD, NFKC, NFKD)']
        : undefined,
  }
}

export function runInfoChecks(data: ListData): CheckResult[] {
  return [
    checkEntropyAndEfficiency(data),
    checkWordSortedOrder(data),
    checkNonWordEntries(data),
    checkLongWords(data),
    checkNormalizationConsistency(data),
  ]
}
