import type { VerificationMeta } from '../checks/types.ts'

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function serializeValue(value: unknown, indent: number): string {
  const pad = ' '.repeat(indent)
  if (typeof value === 'string') {
    return `'${escapeString(value)}'`
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    const lines = entries.map(
      ([k, v]) => `${pad}  ${k}: ${serializeValue(v, indent + 2)},`,
    )
    return `{\n${lines.join('\n')}\n${pad}}`
  }
  return String(value)
}

function serializeMetadata(meta: Record<string, unknown>): string {
  const entries = Object.entries(meta)
  const lines = entries.map(([k, v]) => `  ${k}: ${serializeValue(v, 2)},`)
  return `export const metadata = {\n${lines.join('\n')}\n}`
}

function serializeWordMap(
  exportName: string,
  wordMap: Record<string, string>,
): string {
  const entries = Object.entries(wordMap)
  const lines = entries.map(([k, v]) => `  ${k}: '${escapeString(v)}',`)
  return `export const ${exportName} = {\n${lines.join('\n')}\n}`
}

export async function writeListFile(
  filePath: string,
  exportName: string,
  existingMeta: Record<string, unknown>,
  wordMap: Record<string, string>,
  verification: VerificationMeta,
): Promise<void> {
  const meta: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(existingMeta)) {
    if (key === 'verification') continue
    meta[key] = value
  }
  meta.verification = verification

  const parts = [
    serializeMetadata(meta),
    '',
    serializeWordMap(exportName, wordMap),
    '',
  ]
  await Deno.writeTextFile(filePath, parts.join('\n'))
}
