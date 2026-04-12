// Entropy and crack time calculations using native BigInt.
// See: http://world.std.com/~reinhold/dicewarefaq.html#calculatingentropy

export const ENTROPY_PER_WORD = Math.log2(7776) // ~12.92 bits
export const ENTROPY_PER_SYMBOL = Math.log2(36) // ~5.16 bits

export function calcEntropy(isSymbol) {
  return isSymbol ? ENTROPY_PER_SYMBOL : ENTROPY_PER_WORD
}

const fmt = new Intl.NumberFormat()

export function formatNumber(n, decimals) {
  if (typeof n === 'bigint') {
    return fmt.format(n)
  }
  if (decimals !== undefined) {
    const fixed = n.toFixed(decimals)
    const [intPart, decPart] = fixed.split('.')
    const formatted = fmt.format(BigInt(intPart.replace('-', '')))
    const sign = n < 0 ? '-' : ''
    return decPart ? `${sign}${formatted}.${decPart}` : `${sign}${formatted}`
  }
  return fmt.format(n)
}

// Divide two BigInts and return a Number (precision loss acceptable for display).
function bigDivToNumber(a, b) {
  if (a > Number.MAX_SAFE_INTEGER || b > Number.MAX_SAFE_INTEGER) {
    const intPart = a / b
    const remainder = a - intPart * b
    return Number(intPart) + Number(remainder) / Number(b)
  }
  return Number(a) / Number(b)
}

// Format large speeds with human-readable suffixes.
export function formatSpeed(guessesPerSec) {
  const n = Number(guessesPerSec)
  if (n >= 1e15) return `${(n / 1e15).toFixed(0)}Q`
  if (n >= 1e12) return `${(n / 1e12).toFixed(0)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(0)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`
  return fmt.format(n)
}

// Attacker tiers with estimated guesses per second.
const ATTACK_TIERS = [
  {
    id: 'consumer',
    label: 'Consumer GPU',
    guessesPerSec: 350_000_000_000n, // 350 billion
  },
  {
    id: 'professional',
    label: 'Professional',
    guessesPerSec: 1_000_000_000_000n, // 1 trillion
  },
  {
    id: 'nation-state',
    label: 'Nation-state',
    guessesPerSec: 1_000_000_000_000_000n, // 1 quadrillion
  },
]

// Calculate crack time given a pre-computed keyspace half.
function crackTimeYears(halfKeySpace, guessesPerSec) {
  const seconds = bigDivToNumber(halfKeySpace, guessesPerSec)
  return seconds / (365.25 * 24 * 3600)
}

// Calculate crack times for all attacker tiers from total entropy bits.
// Correctly handles mixed words + symbols.
export function calcAllTiers(totalEntropyBits) {
  const keySpace = 2n ** BigInt(Math.round(totalEntropyBits))
  const halfKeySpace = keySpace / 2n
  return {
    keySpace,
    tiers: ATTACK_TIERS.map((tier) => ({
      ...tier,
      keySpace,
      years: crackTimeYears(halfKeySpace, tier.guessesPerSec),
    })),
  }
}

export function formatCrackValue(value, smallDecimals) {
  if (value > 1) {
    return formatNumber(Math.floor(value))
  }
  return formatNumber(value, smallDecimals)
}
