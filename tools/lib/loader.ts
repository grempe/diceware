import {
  basename,
  join,
  resolve,
} from 'https://deno.land/std@0.224.0/path/mod.ts'
import type { ListData } from '../checks/types.ts'

const DICE_KEY_RE = /^[1-6]+$/

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isDiceKeyedObject(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj)
  if (keys.length === 0) return false
  // Sample first 10 keys for discovery heuristic
  const sample = keys.slice(0, 10)
  return sample.every((k) => DICE_KEY_RE.test(k))
}

export async function loadList(filePath: string): Promise<ListData> {
  const absPath = resolve(Deno.cwd(), filePath)
  const fileName = basename(absPath)
  const fileUrl = new URL(`file://${absPath}`)
  const mod = await import(fileUrl.href)

  let metadata: ListData['metadata'] | undefined
  let wordMap: Record<string, string> | undefined
  let exportName: string | undefined

  for (const [key, value] of Object.entries(mod)) {
    if (key === 'metadata' && isPlainObject(value)) {
      metadata = value as ListData['metadata']
      continue
    }
    if (key === 'default') continue
    if (isPlainObject(value) && isDiceKeyedObject(value)) {
      wordMap = value as Record<string, string>
      exportName = key
    }
  }

  if (!wordMap || !exportName) {
    throw new Error(`Could not find word list export in ${fileName}`)
  }

  const isSpecial = Object.keys(wordMap).every((k) => /^[1-6]{2}$/.test(k))

  return {
    filePath: absPath,
    fileName,
    exportName,
    wordMap,
    metadata,
    isSpecial,
  }
}

export async function discoverListFiles(listsDir: string): Promise<string[]> {
  const files: string[] = []
  for await (const entry of Deno.readDir(listsDir)) {
    if (
      entry.isFile &&
      entry.name.endsWith('.js') &&
      entry.name !== 'registry.js'
    ) {
      files.push(join(listsDir, entry.name))
    }
  }
  return files.sort()
}
