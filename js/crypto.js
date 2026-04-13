// Fail fast if the browser lacks a cryptographically secure PRNG.
// Without this check, the app could silently fall back to weak randomness
// (or crash mid-generation), producing passphrases the user trusts but shouldn't.
if (
  typeof crypto === 'undefined' ||
  typeof crypto.getRandomValues !== 'function'
) {
  throw new Error(
    'This browser does not support crypto.getRandomValues(). A modern browser is required.',
  )
}

// Return a uniformly distributed random integer in [0, count).
//
// Naively, one might compute `crypto.getRandomValues(...)[0] % count`, but when
// the CSPRNG range (2^32) is not evenly divisible by `count`, the lower residues
// appear slightly more often — this is "modulo bias." For count = 6 the bias is
// tiny (~10^-10), but rejection sampling eliminates it entirely at negligible cost.
//
// Algorithm:
//   1. Mask each sample to 31 bits (0x7fffffff = 2^31 - 1).  JavaScript's
//      bitwise operators convert operands to *signed* 32-bit integers; keeping
//      only 31 bits guarantees the value is non-negative, avoiding subtle bugs
//      in the `>=` comparison and `%` operation that follow.
//   2. Compute `skip`, the largest multiple of `count` ≤ 0x7fffffff.  Values
//      in [0, skip) map uniformly to [0, count) via the modulo operator because
//      the accepted range is an exact multiple of `count`.
//   3. Reject (re-sample) any value ≥ skip.  For count = 6, only 2 of 2^31
//      values are rejected (probability ≈ 9.3 × 10^-10), so the loop almost
//      always completes on the first iteration.
//
// A fast path handles power-of-two counts: bitmask extraction from the full
// 32-bit sample is always unbiased because 2^32 is evenly divisible by any
// smaller power of two, so no rejection is needed.
//
// Reference: https://www.reddit.com/r/crypto/comments/4xe21s/
export function secureRandom(count) {
  const rand = new Uint32Array(1)

  // Largest multiple of `count` that fits in 31 bits.
  // Only used by the non-power-of-two path below.
  const skip = 0x7fffffff - (0x7fffffff % count)

  // Fast path: when count is a power of two, (count-1) has all lower bits set,
  // so a bitwise AND extracts exactly log2(count) random bits — always uniform.
  if (((count - 1) & count) === 0) {
    crypto.getRandomValues(rand)
    return rand[0] & (count - 1)
  }

  // General path: rejection sampling to eliminate modulo bias.
  let result
  do {
    crypto.getRandomValues(rand)
    result = rand[0] & 0x7fffffff // mask to 31 bits (non-negative)
  } while (result >= skip) // reject the biased tail

  return result % count
}
