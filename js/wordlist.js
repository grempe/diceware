// Word lookup and list management.
import { listMetadata, lists, special } from '../lists/registry.js'
import { calcEntropy } from './entropy.js'

let currentList = 'eff'

export function setCurrentList(name) {
  if (name in lists) {
    currentList = name
  }
}

export function getCurrentList() {
  return currentList
}

export function getCurrentListMetadata() {
  return listMetadata[currentList]
}

export function getAvailableListNames() {
  return Object.keys(lists)
}

export function lookupWord(wordNum) {
  if (wordNum.length === 5) {
    const word = lists[currentList]?.[wordNum] ?? lists.eff[wordNum]
    return { word, wordNum, entropy: calcEntropy(false) }
  }
  if (wordNum.length === 2) {
    return { word: special[wordNum], wordNum, entropy: calcEntropy(true) }
  }
  return null
}
