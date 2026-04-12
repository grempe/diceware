// Verify CSPRNG is available at module load time.
if (
  typeof crypto === 'undefined' ||
  typeof crypto.getRandomValues !== 'function'
) {
  throw new Error(
    'This browser does not support crypto.getRandomValues(). A modern browser is required.',
  )
}

// Cryptographically secure random integer in [0, count).
// Uses rejection sampling to avoid modulo bias.
// See: https://www.reddit.com/r/crypto/comments/4xe21s/
export function secureRandom(count) {
  const rand = new Uint32Array(1)
  const skip = 0x7fffffff - (0x7fffffff % count)

  if (((count - 1) & count) === 0) {
    crypto.getRandomValues(rand)
    return rand[0] & (count - 1)
  }

  let result
  do {
    crypto.getRandomValues(rand)
    result = rand[0] & 0x7fffffff
  } while (result >= skip)

  return result % count
}
