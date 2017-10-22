// Globals
// which diceware language list will be used to lookup words.
var currentList = 'eff'
// an array of objects representing the current random word list.
var wordList = []
// the running tally of total entropy in the wordList
var totalEntropy = new Big(0)

// Simple function to add commas to really large number strings
//  http://www.mredkj.com/javascript/nfbasic.html
function addCommas (nStr) {
  var x, x1, x2
  nStr += ''
  x = nStr.split('.')
  x1 = x[0]
  x2 = x.length > 1 ? '.' + x[1] : ''
  var rgx = /(\d+)(\d{3})/
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  }
  return x1 + x2
}

// See : https://www.reddit.com/r/crypto/comments/4xe21s/
//
// skip is to make result in this range:
// 0 ≤ result < n* count < 2^31
// (where n is the largest integer that satisfies this equation)
// This makes result % count evenly distributed.
//
// P.S. if (((count - 1) & count) === 0) {...} is optional and for
// when count is a nice binary number (2n). If this if statement is
// removed then it might have to loop a few times. So it saves a
// couple of micro seconds.
function secureRandom (count) {
  var cryptoObj = window.crypto || window.msCrypto
  var rand = new Uint32Array(1)
  var skip = 0x7fffffff - 0x7fffffff % count
  var result

  if (((count - 1) & count) === 0) {
	cryptoObj.getRandomValues(rand)
	return rand[0] & (count - 1)
  }

  do {
	cryptoObj.getRandomValues(rand)
	result = rand[0] & 0x7fffffff
  } while (result >= skip)

  return result % count
}

// Returns an array of objects of length numWords (default 1).
// Each object in the array represents a word and its index
// and is the result of numRollsPerWord die rolls (default 5).
function getWords (numWords, numRollsPerWord) {
  'use strict'

  var i,
      j,
      words,
      rollResults,
      rollResultsJoined

  words = []

  if (!numWords) { numWords = 1 }
  if (!numRollsPerWord) { numRollsPerWord = 5 }

  for (i = 0; i < numWords; i += 1) {
    rollResults = []

    for (j = 0; j < numRollsPerWord; j += 1) {
	  // roll a 6 sided die
      rollResults.push(secureRandom(6) + 1)
    }

    rollResultsJoined = rollResults.join('')
    words.push(getWordFromWordNum(rollResultsJoined)[0])
  }

  return words
}

// Polyfill : for Math.log2 which is part of ES6
// See : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2
Math.log2 = Math.log2 || function (x) {
  return Math.log(x) / Math.LN2
}

// See : http://world.std.com/~reinhold/dicewarefaq.html#calculatingentropy
function calcEntropyForWordOrSymbol (isSymbol) {
  var entropy

  if (!isSymbol) {
    // ~ 12.9 bit of entropy per Diceware word.
    entropy = new Big(Math.log2(7776))
  } else {
    // ~ 5.16 bits for special characters.
    entropy = new Big(Math.log2(36))
  }

  return entropy
}

function calcCrackTime (numWords, guessesPerSec) {
  var keySpace,
    halfKeySpace,
    seconds,
    minutes,
    hours,
    days,
    years,
    millenia,
    humanLifetimes,
    universeLifetimes,
    avgHumanLifespanInYears,
    ageOfUniverseInYears

  // https://en.wikipedia.org/wiki/Life_expectancy
  avgHumanLifespanInYears = new Big(67.2)

  // https://en.wikipedia.org/wiki/Age_of_the_universe
  ageOfUniverseInYears = new Big(13798000000)

  // https://xkcd.com/936/
  // https://security.stackexchange.com/questions/62832/is-the-oft-cited-xkcd-scheme-no-longer-good-advice/62881#62881
  // https://hashcat.net/forum/thread-2580.html
  keySpace = new Big(Math.pow(7776, numWords))

  // Divide the keySpace in half. On average it is expected that an
  // exhaustive search of only half the keySpace will result in success.
  halfKeySpace = keySpace.div(2)

  // "Assume that your adversary is capable of a trillion guesses per second" - Snowden
  // http://www.nytimes.com/2013/08/18/magazine/laura-poitras-snowden.html?pagewanted=all&_r=0
  if (!guessesPerSec) {
    guessesPerSec = new Big(1000000000000)
  } else {
    guessesPerSec = new Big(guessesPerSec)
  }

  seconds = halfKeySpace.div(guessesPerSec)
  minutes = seconds.div(60)
  hours = minutes.div(60)
  days = hours.div(24)
  years = days.div(365)
  millenia = years.div(1000)
  humanLifetimes = years.div(avgHumanLifespanInYears)
  universeLifetimes = years.div(ageOfUniverseInYears)

  // All values returned are of 'Big' type.
  // See : https://mikemcl.github.io/big.js/
  return {numWords: numWords, guessesPerSec: guessesPerSec, keySpace: keySpace, halfKeySpace: halfKeySpace, seconds: seconds, hours: hours, minutes: minutes, days: days, years: years, avgHumanLifespanInYears: avgHumanLifespanInYears, humanLifetimes: humanLifetimes, millenia: millenia, ageOfUniverseInYears: ageOfUniverseInYears, universeLifetimes: universeLifetimes}
}

// Lookup a word by its wordNum and return
// an Array with a single word object suitable for displayWords.
function getWordFromWordNum (wordNum) {
  if (wordNum.length === 5) {
    var word
    switch (currentList) {
      case 'alternative':
        word = alternative[wordNum]
        break
      case 'basque':
        word = basque[wordNum]
        break
      case 'catalan':
        word = catalan[wordNum]
        break
      case 'danish':
        word = danish[wordNum]
        break
      case 'diceware':
        word = diceware[wordNum]
        break
      case 'dutch':
        word = dutch[wordNum]
        break
      case 'esperanto':
        word = esperanto[wordNum]
        break
      case 'finnish':
        word = finnish[wordNum]
        break
      case 'french':
        word = french[wordNum]
        break
      case 'german':
        word = german[wordNum]
        break
      case 'hungarian':
        word = hungarian[wordNum]
        break
      case 'japanese':
        word = japanese[wordNum]
        break
      case 'maori':
        word = maori[wordNum]
        break
      case 'norwegian':
        word = norwegian[wordNum]
        break
      case 'polish':
        word = polish[wordNum]
        break
      case 'swedish':
        word = swedish[wordNum]
        break
      case 'spanish':
        word = spanish[wordNum]
        break
      default:
        word = eff[wordNum]
        break
    }
    return [{'word': word, 'wordNum': wordNum, 'entropy': calcEntropyForWordOrSymbol(false)}]
  } else if (wordNum.length === 2) {
    return [{'word': special[wordNum], 'wordNum': wordNum, 'entropy': calcEntropyForWordOrSymbol(true)}]
  }
}

// Takes an array of word objects and display them on the page.
function displayWords (words) {
  'use strict'

  // add the word to the global array of words
  $.each(words, function (index, obj) {
    var objEntropy = new Big(obj.entropy)
    totalEntropy = totalEntropy.plus(objEntropy)
    $('#totalEntropy').text(totalEntropy.toFixed(2))
    wordList.push(obj.word)
  })

  // add the word to the main display
  $.each(words, function (index, obj) {
    $('#diceWords').append('<li>' + obj.word + '<span class="text-muted">' + obj.wordNum + '</span></li>')
  })

  $('#diceWordsCopyableSpace').text(wordList.join(' '))
  $('#diceWordsCopyableDash').text(wordList.join('-'))
  $('#diceWordsCopyableContainer').slideDown()
}

function displayCrackTime (words) {
  $('#totalWords').text(words.length)

  // Display crack time results
  var crackTimeResults = calcCrackTime(words.length)

  $('#crackTimeResultsGuessesPerSecond').text(addCommas(crackTimeResults.guessesPerSec.toFixed(0)))
  $('#crackTimeResultsKeySpace').text(addCommas(crackTimeResults.keySpace.toFixed(0)))

  $('#crackTimeResultsSeconds').text(
    (crackTimeResults.seconds > 1) ? addCommas(crackTimeResults.seconds.toFixed(0)) : addCommas(crackTimeResults.seconds.toFixed(2))
  )

  $('#crackTimeResultsMinutes').text(
    (crackTimeResults.minutes > 1) ? addCommas(crackTimeResults.minutes.toFixed(0)) : addCommas(crackTimeResults.minutes.toFixed(2))
  )

  $('#crackTimeResultsHours').text(
    (crackTimeResults.hours > 1) ? addCommas(crackTimeResults.hours.toFixed(0)) : addCommas(crackTimeResults.hours.toFixed(2))
  )

  $('#crackTimeResultsDays').text(
    (crackTimeResults.days > 1) ? addCommas(crackTimeResults.days.toFixed(0)) : addCommas(crackTimeResults.days.toFixed(2))
  )

  $('#crackTimeResultsYears').text(
    (crackTimeResults.years > 1) ? addCommas(crackTimeResults.years.toFixed(0)) : addCommas(crackTimeResults.years.toFixed(4))
  )

  $('#crackTimeResultsHumanLifetimes').text(
    (crackTimeResults.humanLifetimes > 1) ? addCommas(crackTimeResults.humanLifetimes.toFixed(0)) : addCommas(crackTimeResults.humanLifetimes.toFixed(6))
  )

  $('#crackTimeResultsMillenia').text(
    (crackTimeResults.millenia > 1) ? addCommas(crackTimeResults.millenia.toFixed(0)) : addCommas(crackTimeResults.millenia.toFixed(7))
  )

  $('#crackTimeResultsUniverseLifetimes').text(
    (crackTimeResults.universeLifetimes > 1) ? addCommas(crackTimeResults.universeLifetimes.toFixed(0)) : addCommas(crackTimeResults.universeLifetimes.toFixed())
  )

  $('#entropyEstimateContainer').slideDown()
}

function resetUI () {
  wordList = []
  totalEntropy = new Big(0)
  $('#entropyEstimateContainer').hide()
  $('#listTitleHeader span').text(currentList)
  $('#diceWords').html('')
  $('#diceWordsCopyable').text('')
  $('#diceWordsCopyableContainer').hide()
  window.location.hash = currentList
}

$(document).ready(function () {
  'use strict'

  // Load any wordlist specified in the URL's hash.
  var listName = window.location.hash.substr(1)
  var nameLink = $("a.listSelectionLink[data-list='" + listName + "']")
  if (nameLink.length == 1) {
      currentList = listName
  } else {
      console.log("Wordlist not found: '", listName, "'")
      nameLink = $("a.listSelectionLink[data-list='" + currentList + "']")
  }
  nameLink.parent().addClass('active')
  // clear and reset everything on initial load.
  resetUI()

  // The nav links are used to select the current word list.
  $('.listSelectionLink').on('click', function (e) {
    currentList = $(this).data('list')
    // the active class gets applied to the parent <li> which
    // gets highlited if that was the last selected link.
    $('.listSelectionLink').parent().removeClass('active')
    $(this).parent().addClass('active')
    resetUI()
    // Propagation of the form submission resets the URL's hash.
    e.preventDefault()
  })

  // The nav links are used to select the current word list.
  $('.genWordsButton').on('click', function (e) {
    var numWords, numRolls, reset
    numWords = parseInt($(this).data('words'), 10)
    numRolls = parseInt($(this).data('rolls'), 10)
    reset = parseInt($(this).data('reset'), 10)
    e.preventDefault()
    if (reset === 1) {
      resetUI()
    }
    displayWords(getWords(numWords, numRolls))
    displayCrackTime(wordList)
  })

  // add a word from the output from analog die rolls e.g. 14352
  // can be either a five die roll for a full word, or a two die
  // roll for a symbol.
  // does not reset UI. Adds onto existing wordList
  $('#addFiveDieRollWordForm').on('submit', function (e) {
    var addFiveDieRollWord
    e.preventDefault()
    addFiveDieRollWord = $('#addFiveDieRollWord').val()
    if ((addFiveDieRollWord.match(/^[1-6]{2}$/) || addFiveDieRollWord.match(/^[1-6]{5}$/)) && (addFiveDieRollWord.length === 2 || addFiveDieRollWord.length === 5)) {
      displayWords(getWordFromWordNum(addFiveDieRollWord))
    }
    $('#addFiveDieRollWord').val('')
    displayCrackTime(wordList)
  })
})
