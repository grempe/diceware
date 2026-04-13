// Word list registry — maps list IDs to their word maps and metadata.
// Only the default list (EFF) and special characters are loaded eagerly.
// All other lists are loaded on demand via dynamic import().

import { eff, metadata as effMeta } from './eff.js'
import { special } from './special.js'

// Lazy loaders for each list — dynamic import() is cached by the browser
const listLoaders = {
  eff: null,
  diceware: () => import('./diceware.js'),
  alternative: () => import('./alternative.js'),
  basque: () => import('./basque.js'),
  catalan: () => import('./catalan.js'),
  czech: () => import('./czech.js'),
  danish: () => import('./danish.js'),
  dutch: () => import('./dutch.js'),
  esperanto: () => import('./esperanto.js'),
  finnish: () => import('./finnish.js'),
  french: () => import('./french.js'),
  'german-dereko': () => import('./german-dereko.js'),
  'german-tenne': () => import('./german-tenne.js'),
  hungarian: () => import('./hungarian.js'),
  italian: () => import('./italian.js'),
  japanese: () => import('./japanese.js'),
  maori: () => import('./maori.js'),
  norwegian: () => import('./norwegian.js'),
  polish: () => import('./polish.js'),
  russian: () => import('./russian.js'),
  spanish: () => import('./spanish.js'),
  swedish: () => import('./swedish.js'),
}

const lists = { eff }
const listMetadata = { eff: effMeta }

export const availableListNames = Object.keys(listLoaders)

export async function loadList(id) {
  if (lists[id]) return
  const loader = listLoaders[id]
  if (!loader) return
  const mod = await loader()
  const wordListKey = Object.keys(mod).find((k) => k !== 'metadata')
  lists[id] = mod[wordListKey]
  listMetadata[id] = mod.metadata
}

export function getList(id) {
  return lists[id]
}

export function getListMetadata(id) {
  return listMetadata[id]
}

export { special }
