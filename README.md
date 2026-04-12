# Diceware Passphrase Generator

A [Diceware](http://world.std.com/~reinhold/diceware.html) passphrase generator,
implemented in JavaScript, that uses the
[Cryptographically Secure Pseudo Random Number Generator](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator)
(CSPRNG) in your browser as its source of entropy instead of rolling physical
dice.

## Hosted Version

<https://diceware.rempe.us>

## Features

- Zero runtime dependencies — all vanilla JavaScript ES modules
- All random number generation uses the browser's
  [`crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
- Single page application with no communication back to a server
- Can be run locally from a Git clone — no install or build step required
- Can be run without a network connection — no logging or analytics
- Automatic dark/light mode support
- Realtime estimate of the security level of your generated passphrase
- Crack time estimates for consumer, professional, and nation-state attackers
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
locally. You'll need to serve the application from a local HTTP server
(ES modules require this — `file://` URLs won't work).

A `Caddyfile` is included for use with [Caddy](https://caddyserver.com/).
Install Caddy and run:

```sh
cd diceware
caddy run
```

Then open <http://localhost:8080> in your browser.

Alternatively, use any static file server:

```sh
python3 -m http.server 8080
```

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
