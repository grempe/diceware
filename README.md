# Diceware Passphrase Generator

A [Diceware](http://world.std.com/~reinhold/diceware.html) passphrase generator,
implemented in JavaScript, that uses the
[Cryptographically Secure Pseudo Random Number Generator](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator)
(CSPRNG) in your browser as its source of entropy instead of rolling physical
dice.

## Hosted Version

<https://diceware.rempe.us>

## Features

- All random number generation is done in your browser using
  [`window.crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues)
- Single page JavaScript application with no communication back to a server
- Can be run locally from a Git clone, with all dependencies baked in
- Can be run without a network connection — no logging or analytics
- Realtime estimate of the security level of your generated passphrase
- Support for many language-specific word lists

It may just be the closest thing to rolling your own dice. You can do that too
of course, and just use this app as a quick way to look up your passphrase in
the word lists.

## Using It

Just choose a language and click a button corresponding to the number of words
you want to generate. You'll get a new passphrase with each click. Each
generation rolls a set of five virtual dice for **each** word. Words are chosen
from the included Diceware word lists. The die roll numbers are shown next to
each word.

## Running Locally

If you are security conscious you are encouraged to download the
[source code](https://github.com/grempe/diceware) for this app and run it
locally. You'll need to serve the application from a small local web server
and not from a `file:///` URL.

A `Caddyfile` is included for use with [Caddy](https://caddyserver.com/).
Install Caddy and run:

```sh
cd diceware
caddy run
```

Then open <http://localhost:8080> in your browser.

### Tin Foil Hat Version

If you want to be *really, really* secure, roll the dice with a flashlight
under a black hood with a printout of the Diceware word list. No computers
needed!

## Contributing

Bug reports and pull requests are welcome on GitHub at
<https://github.com/grempe/diceware>. This project is intended to be a safe,
welcoming space for collaboration, and contributors are expected to adhere to
the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## Legal

Copyright (c) 2016 Glenn Rempe (<glenn@rempe.us>)

Available as open source under the terms of the
[MIT License](http://opensource.org/licenses/MIT).

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the LICENSE file for
the specific language governing permissions and limitations under the License.

## Thanks

This implementation was inspired by the very nicely done
<https://github.com/yesiamben/diceware>.
I took the opportunity to upgrade some security aspects and the UI.
