# Diceware Passphrase Generator

A [Diceware](http://world.std.com/~reinhold/diceware.html) passphrase generator,
implemented in JavaScript, that uses the [Cryptographically Secure Pseudo
Random Number Generator](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) (CSPRNG) in your browser as its source of entropy instead
of rolling physical dice.

## Hosted Version

[https://www.rempe.us/diceware/](https://www.rempe.us/diceware/)

## Important Features

* [Open source code](https://github.com/grempe/diceware)
* All random number generation is done in your browser using [window.crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues)
* Realtime analysis of the probable security level of your passphrase
* The page and all of its assets are served from `www.rempe.us`, an [A+ rated TLS connection](https://www.ssllabs.com/ssltest/analyze.html?d=www.rempe.us&latest)
* [100% of CSS/JS page asset links](https://sritest.io/#report/e0d1efa0-cc91-46d9-9450-8669cfe3bfe2) have [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) hashes
* The application is simple static HTML, JavaScript, and CSS
* The app can be cloned locally and run completely offline
* The Git repository is [signed with my public code signing key](https://www.rempe.us/keys/)
* There are no communications back to any server, for any reason
* All page assets are served from the same origin server. No third-party dependencies
* No logging
* No analytics
* Fronted by Github and Cloudflare CDN

Its the closest thing to rolling your own dice. Oh, and you can do that too
if you like and just plug in the results to lookup your passphrases faster.

## Using It

Just choose a language and click a button for the number of words you want to
generate. Click the button again and you'll get a new passphrase. Each click of
a word button rolls a set of five virtual dice for **each** word. Words are
chosen from the standard Diceware word lists and the die roll numbers are shown
next to each word.

## Security

If you are security conscious you are of course encouraged to download
the [source code](https://github.com/grempe/diceware) for this app. All recent Git
commits are [signed with my public code signing key](https://www.rempe.us/keys/) to
ensure the integrity of the code. Once downloaded you can freely inspect and
run it in any modern web browser locally by simply opening the `index.html` file
in the root of the repository. Feel free to run it without a network
connection to satisfy that this application sends and receives nothing from
any upstream server once loaded.

If you want to be extra secure, run it offline, roll your own physical dice
(five for each word), and plug the rolls into the UI and just use this tool
to help look up the words faster (in any of the supported languages).

If you want to be *REALLY REALLY* secure. Roll the dice with a flashlight under
a black hood in a darkened room with a printout of the Diceware word list.
No computers needed! (Not really kidding)

## Thanks

This implementation was inspired by the very nicely done [https://github.com/yesiamben/diceware](https://github.com/yesiamben/diceware).
I took the opportunity to update a number of security aspects and the updated
the user interface a bit.
