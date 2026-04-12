// Word list registry — maps list IDs to their word maps and metadata.

import { alternative, metadata as alternativeMeta } from './alternative.js'
import { basque, metadata as basqueMeta } from './basque.js'
import { catalan, metadata as catalanMeta } from './catalan.js'
import { czech, metadata as czechMeta } from './czech.js'
import { danish, metadata as danishMeta } from './danish.js'
import { diceware, metadata as dicewareMeta } from './diceware.js'
import { dutch, metadata as dutchMeta } from './dutch.js'
import { eff, metadata as effMeta } from './eff.js'
import { esperanto, metadata as esperantoMeta } from './esperanto.js'
import { finnish, metadata as finnishMeta } from './finnish.js'
import { french, metadata as frenchMeta } from './french.js'
import { german_dereko, metadata as germanDerekoMeta } from './german-dereko.js'
import { german, metadata as germanTenneMeta } from './german-tenne.js'
import { hungarian, metadata as hungarianMeta } from './hungarian.js'
import { italian, metadata as italianMeta } from './italian.js'
import { japanese, metadata as japaneseMeta } from './japanese.js'
import { maori, metadata as maoriMeta } from './maori.js'
import { norwegian, metadata as norwegianMeta } from './norwegian.js'
import { polish, metadata as polishMeta } from './polish.js'
import { russian, metadata as russianMeta } from './russian.js'
import { spanish, metadata as spanishMeta } from './spanish.js'
import { special } from './special.js'
import { swedish, metadata as swedishMeta } from './swedish.js'

export const lists = {
  eff,
  diceware,
  alternative,
  basque,
  catalan,
  czech,
  danish,
  dutch,
  esperanto,
  finnish,
  french,
  'german-dereko': german_dereko,
  'german-tenne': german,
  hungarian,
  italian,
  japanese,
  maori,
  norwegian,
  polish,
  russian,
  spanish,
  swedish,
}

export const listMetadata = {
  eff: effMeta,
  diceware: dicewareMeta,
  alternative: alternativeMeta,
  basque: basqueMeta,
  catalan: catalanMeta,
  czech: czechMeta,
  danish: danishMeta,
  dutch: dutchMeta,
  esperanto: esperantoMeta,
  finnish: finnishMeta,
  french: frenchMeta,
  'german-dereko': germanDerekoMeta,
  'german-tenne': germanTenneMeta,
  hungarian: hungarianMeta,
  italian: italianMeta,
  japanese: japaneseMeta,
  maori: maoriMeta,
  norwegian: norwegianMeta,
  polish: polishMeta,
  russian: russianMeta,
  spanish: spanishMeta,
  swedish: swedishMeta,
}

export { special }
