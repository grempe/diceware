import type { CheckResult, ListData } from './types.ts'

function generateExpectedKeys(digitCount: number): Set<string> {
  const keys = new Set<string>()
  const digits = ['1', '2', '3', '4', '5', '6']

  function recurse(prefix: string, depth: number): void {
    if (depth === digitCount) {
      keys.add(prefix)
      return
    }
    for (const d of digits) {
      recurse(prefix + d, depth + 1)
    }
  }

  recurse('', 0)
  return keys
}

function checkWordCount(data: ListData): CheckResult {
  const expected = data.isSpecial ? 36 : 7776
  const actual = Object.keys(data.wordMap).length
  return {
    id: 'word-count',
    name: 'Word count',
    severity: 'FAIL',
    passed: actual === expected,
    message: `${actual} entries (expected ${expected})`,
  }
}

function checkKeyFormat(data: ListData): CheckResult {
  const pattern = data.isSpecial ? /^[1-6]{2}$/ : /^[1-6]{5}$/
  const keys = Object.keys(data.wordMap)
  const invalid = keys.filter((k) => !pattern.test(k))
  const patternStr = data.isSpecial ? '^[1-6]{2}$' : '^[1-6]{5}$'

  return {
    id: 'key-format',
    name: 'Key format',
    severity: 'FAIL',
    passed: invalid.length === 0,
    message:
      invalid.length === 0
        ? `all ${keys.length} keys match ${patternStr}`
        : `${invalid.length} invalid key${invalid.length !== 1 ? 's' : ''} found`,
    details:
      invalid.length > 0
        ? invalid.slice(0, 10).map((k) => `"${k}" -> "${data.wordMap[k]}"`)
        : undefined,
  }
}

function checkKeyCompleteness(data: ListData): CheckResult {
  const digitCount = data.isSpecial ? 2 : 5
  const expected = generateExpectedKeys(digitCount)
  const actual = new Set(Object.keys(data.wordMap))
  const missing: string[] = []

  for (const key of expected) {
    if (!actual.has(key)) {
      missing.push(key)
    }
  }

  return {
    id: 'key-completeness',
    name: 'Key completeness',
    severity: 'FAIL',
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? `all ${expected.size} expected keys present`
        : `${missing.length} missing key${missing.length !== 1 ? 's' : ''}`,
    details:
      missing.length > 0
        ? missing.slice(0, 10).map((k) => `missing: "${k}"`)
        : undefined,
  }
}

function checkNoDuplicateKeys(data: ListData): CheckResult {
  // JS objects inherently deduplicate keys, so if count matches expected
  // and all expected keys are present, there are no duplicates.
  // This check is explicit for completeness.
  const expected = data.isSpecial ? 36 : 7776
  const actual = Object.keys(data.wordMap).length
  return {
    id: 'no-duplicate-keys',
    name: 'No duplicate keys',
    severity: 'FAIL',
    passed: actual === expected,
    message:
      actual === expected
        ? `${actual} unique keys`
        : `expected ${expected} unique keys, got ${actual}`,
  }
}

function checkNoDuplicateWords(data: ListData): CheckResult {
  const wordToKeys = new Map<string, string[]>()
  for (const [key, word] of Object.entries(data.wordMap)) {
    const existing = wordToKeys.get(word)
    if (existing) {
      existing.push(key)
    } else {
      wordToKeys.set(word, [key])
    }
  }

  const duplicates: [string, string[]][] = []
  for (const [word, keys] of wordToKeys) {
    if (keys.length > 1) {
      duplicates.push([word, keys])
    }
  }

  return {
    id: 'no-duplicate-words',
    name: 'No duplicate words',
    severity: 'FAIL',
    passed: duplicates.length === 0,
    message:
      duplicates.length === 0
        ? 'all words are unique'
        : `${duplicates.length} duplicate word${duplicates.length !== 1 ? 's' : ''} found`,
    details:
      duplicates.length > 0
        ? duplicates
            .slice(0, 10)
            .map(
              ([word, keys]) => `"${word}" appears at keys: ${keys.join(', ')}`,
            )
        : undefined,
  }
}

function checkNoEmptyWords(data: ListData): CheckResult {
  const empty: string[] = []
  for (const [key, word] of Object.entries(data.wordMap)) {
    if (word.length === 0 || word.trim().length === 0) {
      empty.push(key)
    }
  }

  return {
    id: 'no-empty-words',
    name: 'No empty words',
    severity: 'FAIL',
    passed: empty.length === 0,
    message:
      empty.length === 0
        ? 'no empty words'
        : `${empty.length} empty word${empty.length !== 1 ? 's' : ''} found`,
    details:
      empty.length > 0
        ? empty
            .slice(0, 10)
            .map(
              (k) =>
                `key "${k}" has ${data.wordMap[k].length === 0 ? 'empty string' : 'whitespace-only'} value`,
            )
        : undefined,
  }
}

function checkNoControlCharacters(data: ListData): CheckResult {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally matching control chars
  const controlRe = /[\x00-\x1f\x7f-\x9f]/
  const problems: [string, string, string][] = []

  for (const [key, word] of Object.entries(data.wordMap)) {
    if (controlRe.test(word)) {
      const chars = [...word]
        .filter((ch) => controlRe.test(ch))
        .map(
          (ch) =>
            `U+${(ch.codePointAt(0) ?? 0).toString(16).padStart(4, '0').toUpperCase()}`,
        )
      problems.push([key, word, chars.join(', ')])
    }
  }

  return {
    id: 'no-control-chars',
    name: 'No control characters',
    severity: 'FAIL',
    passed: problems.length === 0,
    message:
      problems.length === 0
        ? 'no control characters found'
        : `${problems.length} word${problems.length !== 1 ? 's' : ''} contain control characters`,
    details:
      problems.length > 0
        ? problems
            .slice(0, 10)
            .map(
              ([key, word, chars]) =>
                `key "${key}": "${word}" contains ${chars}`,
            )
        : undefined,
  }
}

function checkValidEncoding(data: ListData): CheckResult {
  const replacementChar = '\uFFFD'
  const problems: string[] = []

  for (const [key, word] of Object.entries(data.wordMap)) {
    if (word.includes(replacementChar)) {
      problems.push(key)
    }
  }

  return {
    id: 'valid-encoding',
    name: 'Valid UTF-8 encoding',
    severity: 'FAIL',
    passed: problems.length === 0,
    message:
      problems.length === 0
        ? 'no encoding issues detected'
        : `${problems.length} word${problems.length !== 1 ? 's' : ''} contain replacement character U+FFFD`,
    details:
      problems.length > 0
        ? problems.slice(0, 10).map((k) => `key "${k}": "${data.wordMap[k]}"`)
        : undefined,
  }
}

export function runCriticalChecks(data: ListData): CheckResult[] {
  return [
    checkWordCount(data),
    checkKeyFormat(data),
    checkKeyCompleteness(data),
    checkNoDuplicateKeys(data),
    checkNoDuplicateWords(data),
    checkNoEmptyWords(data),
    checkNoControlCharacters(data),
    checkValidEncoding(data),
  ]
}
