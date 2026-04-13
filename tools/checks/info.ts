import type { CheckResult, ListData } from './types.ts'

/**
 * Sardinas-Patterson algorithm for unique decodability.
 * A set of codewords is uniquely decodable if every concatenation
 * of codewords can be parsed in exactly one way.
 */
function checkUniquelyDecodable(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'uniquely-decodable',
      name: 'Uniquely decodable',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const C = new Set(Object.values(data.wordMap))

  // Compute dangling suffixes: for each pair (a, b) in C,
  // if a is a prefix of b, add the suffix b.slice(a.length).
  function danglings(setA: Set<string>, setB: Set<string>): Set<string> {
    const result = new Set<string>()
    for (const a of setA) {
      for (const b of setB) {
        if (b.length > a.length && b.startsWith(a)) {
          result.add(b.slice(a.length))
        }
        if (a.length > b.length && a.startsWith(b)) {
          result.add(a.slice(b.length))
        }
      }
    }
    return result
  }

  // Iterative Sardinas-Patterson
  const S = danglings(C, C)
  const maxIterations = 100 // Safety bound

  for (let i = 0; i < maxIterations; i++) {
    // If any dangling suffix is in C, not uniquely decodable
    for (const s of S) {
      if (C.has(s)) {
        return {
          id: 'uniquely-decodable',
          name: 'Uniquely decodable',
          severity: 'INFO',
          passed: false,
          message: 'NOT uniquely decodable (ambiguous concatenations exist)',
        }
      }
    }

    const S_next = danglings(S, C)

    // Check if S_next is a subset of S (fixed point)
    let isSubset = true
    for (const s of S_next) {
      if (!S.has(s)) {
        isSubset = false
        break
      }
    }

    if (isSubset) {
      return {
        id: 'uniquely-decodable',
        name: 'Uniquely decodable',
        severity: 'INFO',
        passed: true,
        message: 'yes (Sardinas-Patterson verified)',
      }
    }

    // Union S with S_next
    for (const s of S_next) {
      S.add(s)
    }
  }

  return {
    id: 'uniquely-decodable',
    name: 'Uniquely decodable',
    severity: 'INFO',
    passed: true,
    message: 'could not determine (iteration limit reached)',
  }
}

function checkSuffixFree(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'suffix-free',
      name: 'Suffix-free',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  // Reverse each word, sort, check adjacent pairs for prefix relationships
  const words = Object.values(data.wordMap)
  const reversed = words
    .map((w) => ({ original: w, rev: [...w].reverse().join('') }))
    .sort((a, b) => a.rev.localeCompare(b.rev))

  const suffixPairs: string[] = []
  for (let i = 0; i < reversed.length - 1; i++) {
    if (reversed[i + 1].rev.startsWith(reversed[i].rev)) {
      suffixPairs.push(
        `"${reversed[i].original}" is a suffix of "${reversed[i + 1].original}"`,
      )
    }
  }

  return {
    id: 'suffix-free',
    name: 'Suffix-free',
    severity: 'INFO',
    passed: suffixPairs.length === 0,
    message:
      suffixPairs.length === 0
        ? 'no suffix pairs found'
        : `${suffixPairs.length} suffix pair${suffixPairs.length !== 1 ? 's' : ''} found`,
    details:
      suffixPairs.length > 0
        ? [
            ...suffixPairs.slice(0, 5),
            ...(suffixPairs.length > 5
              ? [`... (${suffixPairs.length - 5} more)`]
              : []),
          ]
        : undefined,
  }
}

function checkCompoundWords(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'compound-words',
      name: 'Compound words',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const wordSet = new Set(Object.values(data.wordMap))
  const compounds: string[] = []

  for (const word of wordSet) {
    // Check if word = A + B where both A and B are in the list
    for (let i = 1; i < word.length; i++) {
      const prefix = word.slice(0, i)
      const suffix = word.slice(i)
      if (wordSet.has(prefix) && wordSet.has(suffix)) {
        compounds.push(`"${word}" = "${prefix}" + "${suffix}"`)
        break // Only report first decomposition per word
      }
    }
    if (compounds.length > 200) break
  }

  return {
    id: 'compound-words',
    name: 'Compound words',
    severity: 'INFO',
    passed: compounds.length === 0,
    message:
      compounds.length === 0
        ? 'no compound words found'
        : `${compounds.length}${compounds.length > 200 ? '+' : ''} compound word${compounds.length !== 1 ? 's' : ''} found`,
    details:
      compounds.length > 0
        ? [
            ...compounds.slice(0, 10),
            ...(compounds.length > 10
              ? [`... (${compounds.length - 10} more)`]
              : []),
          ]
        : undefined,
  }
}

function checkLongestSharedPrefix(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'longest-shared-prefix',
      name: 'Longest shared prefix',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const words = Object.values(data.wordMap).slice().sort()
  let maxLen = 0
  let maxPair: [string, string] = ['', '']

  for (let i = 0; i < words.length - 1; i++) {
    let j = 0
    while (
      j < words[i].length &&
      j < words[i + 1].length &&
      words[i][j] === words[i + 1][j]
    ) {
      j++
    }
    if (j > maxLen) {
      maxLen = j
      maxPair = [words[i], words[i + 1]]
    }
  }

  return {
    id: 'longest-shared-prefix',
    name: 'Longest shared prefix',
    severity: 'INFO',
    passed: true,
    message: `${maxLen} characters`,
    details: maxLen > 0 ? [`"${maxPair[0]}" / "${maxPair[1]}"`] : undefined,
  }
}

function checkUniquePrefixLength(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'unique-prefix-length',
      name: 'Unique prefix length',
      severity: 'INFO',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const words = Object.values(data.wordMap)
  const maxLen = Math.max(...words.map((w) => w.length))

  for (let k = 1; k <= maxLen; k++) {
    const prefixes = new Set<string>()
    let allUnique = true
    for (const word of words) {
      const prefix = word.slice(0, k)
      if (prefixes.has(prefix)) {
        allUnique = false
        break
      }
      prefixes.add(prefix)
    }
    if (allUnique) {
      return {
        id: 'unique-prefix-length',
        name: 'Unique prefix length',
        severity: 'INFO',
        passed: true,
        message: `${k} character${k !== 1 ? 's' : ''} needed to uniquely identify each word`,
      }
    }
  }

  return {
    id: 'unique-prefix-length',
    name: 'Unique prefix length',
    severity: 'INFO',
    passed: true,
    message: 'full word length needed (some words are prefixes of others)',
  }
}

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
    } else if (word.length === 2 && /^[a-zA-Z]{2}$/.test(word)) {
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

function checkSmartQuotes(data: ListData): CheckResult {
  const smartQuoteRe = /[\u2018\u2019\u201c\u201d]/
  const problems: string[] = []

  for (const [key, word] of Object.entries(data.wordMap)) {
    if (smartQuoteRe.test(word)) {
      const chars = [...word]
        .filter((ch) => smartQuoteRe.test(ch))
        .map(
          (ch) =>
            `U+${(ch.codePointAt(0) ?? 0).toString(16).padStart(4, '0').toUpperCase()}`,
        )
      problems.push(`${key}:"${word}" (${chars.join(', ')})`)
    }
  }

  return {
    id: 'smart-quotes',
    name: 'Smart/curly quotes',
    severity: 'INFO',
    passed: problems.length === 0,
    message:
      problems.length === 0
        ? 'none found'
        : `${problems.length} word${problems.length !== 1 ? 's' : ''} contain smart quotes`,
    details: problems.length > 0 ? problems.slice(0, 10) : undefined,
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
    checkUniquelyDecodable(data),
    checkSuffixFree(data),
    checkCompoundWords(data),
    checkLongestSharedPrefix(data),
    checkUniquePrefixLength(data),
    checkEntropyAndEfficiency(data),
    checkNonWordEntries(data),
    checkLongWords(data),
    checkSmartQuotes(data),
    checkNormalizationConsistency(data),
  ]
}
