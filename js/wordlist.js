// Word lookup and list management.
import {
  availableListNames,
  getList,
  getListMetadata,
  loadList,
  special,
} from '../lists/registry.js'
import { calcEntropy } from './entropy.js'

let currentList = 'eff'

export async function setCurrentList(name) {
  if (availableListNames.includes(name)) {
    await loadList(name)
    currentList = name
  }
}

export function getCurrentList() {
  return currentList
}

export function getCurrentListMetadata() {
  return getListMetadata(currentList)
}

export function getAvailableListNames() {
  return availableListNames
}

export function lookupWord(wordNum) {
  if (wordNum.length === 5) {
    const word = getList(currentList)?.[wordNum] ?? getList('eff')[wordNum]
    return { word, wordNum, entropy: calcEntropy(false) }
  }
  if (wordNum.length === 2) {
    return { word: special[wordNum], wordNum, entropy: calcEntropy(true) }
  }
  return null
}
