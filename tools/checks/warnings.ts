import type { CheckResult, ListData } from './types.ts'

function checkCaseInsensitiveDuplicates(data: ListData): CheckResult {
  const normalized = new Map<string, string[]>()
  for (const [key, word] of Object.entries(data.wordMap)) {
    const lower = word.toLowerCase()
    const existing = normalized.get(lower)
    if (existing) {
      existing.push(`${key}:"${word}"`)
    } else {
      normalized.set(lower, [`${key}:"${word}"`])
    }
  }

  const dupes: [string, string[]][] = []
  for (const [lower, entries] of normalized) {
    if (entries.length > 1) {
      dupes.push([lower, entries])
    }
  }

  return {
    id: 'case-insensitive-dupes',
    name: 'Case-insensitive duplicates',
    severity: 'WARN',
    passed: dupes.length === 0,
    message:
      dupes.length === 0
        ? 'none found'
        : `${dupes.length} group${dupes.length !== 1 ? 's' : ''} of case-insensitive duplicates`,
    details:
      dupes.length > 0
        ? dupes
            .slice(0, 10)
            .map(([lower, entries]) => `"${lower}": ${entries.join(', ')}`)
        : undefined,
  }
}

function checkUnicodeNormalizationDuplicates(data: ListData): CheckResult {
  const forms: Array<'NFC' | 'NFKD'> = ['NFC', 'NFKD']
  const allDupes: string[] = []

  for (const form of forms) {
    const normalized = new Map<string, string[]>()
    for (const [key, word] of Object.entries(data.wordMap)) {
      const norm = word.normalize(form)
      const existing = normalized.get(norm)
      if (existing) {
        existing.push(`${key}:"${word}"`)
      } else {
        normalized.set(norm, [`${key}:"${word}"`])
      }
    }

    for (const [, entries] of normalized) {
      if (entries.length > 1) {
        allDupes.push(`${form}: ${entries.join(', ')}`)
      }
    }
  }

  return {
    id: 'unicode-norm-dupes',
    name: 'Unicode normalization duplicates',
    severity: 'WARN',
    passed: allDupes.length === 0,
    message:
      allDupes.length === 0
        ? 'none found (NFC, NFKD)'
        : `${allDupes.length} collision${allDupes.length !== 1 ? 's' : ''} found`,
    details: allDupes.length > 0 ? allDupes.slice(0, 10) : undefined,
  }
}

function checkPrefixFree(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'prefix-free',
      name: 'Prefix-free',
      severity: 'WARN',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  const words = Object.values(data.wordMap).slice().sort()
  const prefixPairs: string[] = []

  for (let i = 0; i < words.length - 1; i++) {
    if (words[i + 1].startsWith(words[i])) {
      prefixPairs.push(`"${words[i]}" is a prefix of "${words[i + 1]}"`)
    }
  }

  return {
    id: 'prefix-free',
    name: 'Prefix-free',
    severity: 'WARN',
    passed: prefixPairs.length === 0,
    message:
      prefixPairs.length === 0
        ? 'no prefix pairs found'
        : `${prefixPairs.length} prefix pair${prefixPairs.length !== 1 ? 's' : ''} found`,
    details:
      prefixPairs.length > 0
        ? [
            ...prefixPairs.slice(0, 5),
            ...(prefixPairs.length > 5
              ? [`... (${prefixPairs.length - 5} more)`]
              : []),
          ]
        : undefined,
  }
}

function checkEditDistanceOne(data: ListData): CheckResult {
  if (data.isSpecial) {
    return {
      id: 'edit-distance-1',
      name: 'Edit distance-1 pairs',
      severity: 'WARN',
      passed: true,
      message: 'skipped (special list)',
    }
  }

  // Neighborhood generation approach: for each word, generate all
  // 1-edit-distance neighbors and check set membership. O(n*L*A).
  const wordSet = new Set(Object.values(data.wordMap))
  const charset = new Set<string>()
  for (const word of wordSet) {
    for (const ch of word) {
      charset.add(ch)
    }
  }
  const chars = [...charset]

  const pairs: string[] = []
  const seen = new Set<string>()

  for (const word of wordSet) {
    // Deletions
    for (let i = 0; i < word.length; i++) {
      const neighbor = word.slice(0, i) + word.slice(i + 1)
      if (wordSet.has(neighbor) && !seen.has(`${neighbor}|${word}`)) {
        pairs.push(`"${word}" <-> "${neighbor}"`)
        seen.add(`${word}|${neighbor}`)
      }
    }

    // Substitutions
    for (let i = 0; i < word.length; i++) {
      for (const ch of chars) {
        if (ch === word[i]) continue
        const neighbor = word.slice(0, i) + ch + word.slice(i + 1)
        if (wordSet.has(neighbor) && !seen.has(`${neighbor}|${word}`)) {
          pairs.push(`"${word}" <-> "${neighbor}"`)
          seen.add(`${word}|${neighbor}`)
        }
      }
    }

    // Stop early if we have many pairs — no need to enumerate them all
    if (pairs.length > 200) break
  }

  return {
    id: 'edit-distance-1',
    name: 'Edit distance-1 pairs',
    severity: 'WARN',
    passed: pairs.length === 0,
    message:
      pairs.length === 0
        ? 'no distance-1 pairs found'
        : `${pairs.length}${pairs.length > 200 ? '+' : ''} distance-1 pair${pairs.length !== 1 ? 's' : ''} found`,
    details:
      pairs.length > 0
        ? [
            ...pairs.slice(0, 10),
            ...(pairs.length > 10 ? [`... (${pairs.length - 10} more)`] : []),
          ]
        : undefined,
  }
}

function checkWhitespace(data: ListData): CheckResult {
  const leading: string[] = []
  const trailing: string[] = []
  const tabs: string[] = []
  const internal: string[] = []

  for (const [key, word] of Object.entries(data.wordMap)) {
    if (word !== word.trimStart()) leading.push(`${key}:"${word}"`)
    if (word !== word.trimEnd()) trailing.push(`${key}:"${word}"`)
    if (word.includes('\t')) tabs.push(`${key}:"${word}"`)
    // Internal whitespace (spaces within the word, excluding leading/trailing)
    const trimmed = word.trim()
    if (/\s/.test(trimmed) && trimmed.includes(' ')) {
      internal.push(`${key}:"${word}"`)
    }
  }

  const problems = leading.length + trailing.length + tabs.length
  const details: string[] = []
  if (leading.length > 0)
    details.push(
      `leading whitespace: ${leading.slice(0, 3).join(', ')}${leading.length > 3 ? ` ... (${leading.length} total)` : ''}`,
    )
  if (trailing.length > 0)
    details.push(
      `trailing whitespace: ${trailing.slice(0, 3).join(', ')}${trailing.length > 3 ? ` ... (${trailing.length} total)` : ''}`,
    )
  if (tabs.length > 0)
    details.push(
      `tab characters: ${tabs.slice(0, 3).join(', ')}${tabs.length > 3 ? ` ... (${tabs.length} total)` : ''}`,
    )
  if (internal.length > 0)
    details.push(
      `internal spaces (info): ${internal.slice(0, 3).join(', ')}${internal.length > 3 ? ` ... (${internal.length} total)` : ''}`,
    )

  return {
    id: 'whitespace',
    name: 'Whitespace',
    severity: 'WARN',
    passed: problems === 0,
    message:
      problems === 0
        ? 'clean'
        : `${problems} whitespace issue${problems !== 1 ? 's' : ''} found`,
    details: details.length > 0 ? details : undefined,
  }
}

function checkWordLengthStats(data: ListData): CheckResult {
  const words = Object.values(data.wordMap)
  const lengths = words.map((w) => w.length).sort((a, b) => a - b)
  const min = lengths[0]
  const max = lengths[lengths.length - 1]
  const mean = lengths.reduce((s, l) => s + l, 0) / lengths.length
  const median =
    lengths.length % 2 === 0
      ? (lengths[lengths.length / 2 - 1] + lengths[lengths.length / 2]) / 2
      : lengths[Math.floor(lengths.length / 2)]

  const entropy = Math.log2(words.length)
  const efficiency = entropy / mean

  // Above brute-force line check: shortest word should have enough chars
  // that brute-forcing character-by-character is harder than guessing the word.
  // For the charset used in this list, check if min_length * log2(charset_size) >= entropy
  const charset = new Set<string>()
  for (const word of words) {
    for (const ch of word) charset.add(ch)
  }
  const charsetBits = Math.log2(charset.size)
  const bruteForceEntropy = min * charsetBits
  const aboveBruteForceLine = bruteForceEntropy >= entropy

  const details = [
    `min=${min} max=${max} mean=${mean.toFixed(2)} median=${median}`,
    `entropy: ${entropy.toFixed(2)} bits/word, efficiency: ${efficiency.toFixed(2)} bits/char`,
    `charset: ${charset.size} unique chars, brute-force line: ${aboveBruteForceLine ? 'above' : `BELOW (${min} chars * ${charsetBits.toFixed(1)} bits = ${bruteForceEntropy.toFixed(1)} < ${entropy.toFixed(1)})`}`,
  ]

  return {
    id: 'word-length-stats',
    name: 'Word length',
    severity: 'WARN',
    passed: aboveBruteForceLine,
    message: `min=${min} max=${max} mean=${mean.toFixed(1)} median=${median}`,
    details,
  }
}

function checkKeySortedOrder(data: ListData): CheckResult {
  const keys = Object.keys(data.wordMap)
  const outOfOrder: string[] = []

  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] > keys[i + 1]) {
      outOfOrder.push(
        `${keys[i]}:"${data.wordMap[keys[i]]}" > ${keys[i + 1]}:"${data.wordMap[keys[i + 1]]}"`,
      )
    }
  }

  return {
    id: 'key-sorted-order',
    name: 'Key sorted order',
    severity: 'WARN',
    passed: outOfOrder.length === 0,
    message:
      outOfOrder.length === 0
        ? 'die roll keys are in ascending order'
        : `${outOfOrder.length} out-of-order key${outOfOrder.length !== 1 ? 's' : ''}`,
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
    severity: 'WARN',
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

function checkCharacterSet(data: ListData): CheckResult {
  const words = Object.values(data.wordMap)
  const charset = new Set<string>()
  for (const word of words) {
    for (const ch of word) charset.add(ch)
  }

  // Detect zero-width and invisible characters
  const invisible = [...charset].filter((ch) => {
    const cp = ch.codePointAt(0) ?? 0
    return (
      cp === 0x200b || // zero-width space
      cp === 0x200c || // zero-width non-joiner
      cp === 0x200d || // zero-width joiner
      cp === 0xfeff || // BOM
      cp === 0x00a0 // non-breaking space
    )
  })

  // Detect scripts used
  const scripts: string[] = []
  const joined = [...charset].join('')
  if (/\p{Script=Latin}/u.test(joined)) scripts.push('Latin')
  if (/\p{Script=Cyrillic}/u.test(joined)) scripts.push('Cyrillic')
  if (/\p{Script=Greek}/u.test(joined)) scripts.push('Greek')
  if (/\p{Script=Han}/u.test(joined)) scripts.push('Han')
  if (/\p{Script=Hiragana}/u.test(joined)) scripts.push('Hiragana')
  if (/\p{Script=Katakana}/u.test(joined)) scripts.push('Katakana')
  if (/\p{Script=Arabic}/u.test(joined)) scripts.push('Arabic')
  if (/\p{Script=Hebrew}/u.test(joined)) scripts.push('Hebrew')

  const details: string[] = [
    `${charset.size} unique characters`,
    `scripts: ${scripts.length > 0 ? scripts.join(', ') : 'none detected'}`,
  ]

  if (invisible.length > 0) {
    details.push(
      `invisible characters found: ${invisible.map((ch) => `U+${(ch.codePointAt(0) ?? 0).toString(16).padStart(4, '0').toUpperCase()}`).join(', ')}`,
    )
  }

  return {
    id: 'character-set',
    name: 'Character set',
    severity: 'WARN',
    passed: invisible.length === 0,
    message: `${charset.size} unique chars, script${scripts.length !== 1 ? 's' : ''}: ${scripts.join(', ') || 'unknown'}`,
    details,
  }
}

function checkMetadata(data: ListData): CheckResult[] {
  const results: CheckResult[] = []

  if (!data.metadata) {
    results.push({
      id: 'metadata-exists',
      name: 'Metadata export',
      severity: 'WARN',
      passed: false,
      message: 'no metadata export found',
    })
    return results
  }

  results.push({
    id: 'metadata-exists',
    name: 'Metadata export',
    severity: 'WARN',
    passed: true,
    message: 'present',
  })

  if (!data.metadata.name || data.metadata.name.trim().length === 0) {
    results.push({
      id: 'metadata-name',
      name: 'Metadata name',
      severity: 'WARN',
      passed: false,
      message: 'metadata.name is missing or empty',
    })
  }

  if (!data.metadata.source) {
    results.push({
      id: 'metadata-source',
      name: 'Metadata source',
      severity: 'INFO',
      passed: true,
      message: 'metadata.source not specified',
    })
  }

  if (!data.metadata.author) {
    results.push({
      id: 'metadata-author',
      name: 'Metadata author',
      severity: 'INFO',
      passed: true,
      message: 'metadata.author not specified',
    })
  }

  return results
}

export function runWarningChecks(data: ListData): CheckResult[] {
  return [
    checkCaseInsensitiveDuplicates(data),
    checkUnicodeNormalizationDuplicates(data),
    checkPrefixFree(data),
    checkEditDistanceOne(data),
    checkWhitespace(data),
    checkWordLengthStats(data),
    checkKeySortedOrder(data),
    checkWordSortedOrder(data),
    checkCharacterSet(data),
    ...checkMetadata(data),
  ]
}
