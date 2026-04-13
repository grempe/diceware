// Entropy and crack time calculations using native BigInt.
// See: http://world.std.com/~reinhold/dicewarefaq.html#calculatingentropy

// Each diceware word is chosen uniformly from 7,776 possibilities (6^5 dice
// rolls), contributing log2(7776) ≈ 12.92 bits of entropy.  Each special
// character is chosen from 36 possibilities (6^2 dice rolls), contributing
// log2(36) ≈ 5.17 bits.  These constants are used for the UI entropy display;
// the exact keyspace for crack-time estimation is computed separately via
// BigInt exponentiation to avoid floating-point rounding.
export const ENTROPY_PER_WORD = Math.log2(7776) // ~12.92 bits
export const ENTROPY_PER_SYMBOL = Math.log2(36) // ~5.17 bits
export const ENTROPY_PER_CAP = 1 // 1 bit per random capitalization

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

// Divide two BigInts and return a Number.  When both operands are small enough
// for exact double-precision representation, a simple Number conversion suffices.
// For larger values, we split into integer and remainder parts to preserve as
// much precision as possible — the slight loss is acceptable since the result
// is only used for human-readable crack-time display.
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

// Attacker tiers with estimated guesses per second.  These represent
// order-of-magnitude capabilities for offline brute-force attacks:
//   Consumer GPU   — a single high-end GPU (e.g. RTX 4090) running Hashcat
//   Professional   — a dedicated hash-cracking cluster or cloud burst
//   Nation-state   — theoretical upper bound for a well-funded adversary
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

// Expected crack time assuming the attacker tries keys uniformly at random.
// On average, half the keyspace must be searched before finding the correct key.
function crackTimeYears(halfKeySpace, guessesPerSec) {
  const seconds = bigDivToNumber(halfKeySpace, guessesPerSec)
  return seconds / (365.25 * 24 * 3600)
}

// Calculate crack times for all attacker tiers.
// The keyspace is computed exactly via BigInt exponentiation:
//   7776^words × 36^symbols × 2^caps
// This avoids the precision loss that would come from rounding fractional entropy
// bits (e.g. 77.55) to an integer before computing 2^n.
export function calcAllTiers(wordCount, symbolCount, capsCount = 0) {
  const keySpace =
    7776n ** BigInt(wordCount) *
    36n ** BigInt(symbolCount) *
    2n ** BigInt(capsCount)
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
