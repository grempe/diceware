# Diceware Passphrase Generator

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

A [Diceware](http://world.std.com/~reinhold/diceware.html) passphrase generator,
implemented in JavaScript, that uses the
[Cryptographically Secure Pseudo Random Number Generator](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator)
(CSPRNG) in your browser as its source of entropy instead of rolling physical dice.

## Maori Version

Custom designed for the Maori language only.

## Using It

Click a button corresponding to the number of kupu you want to generate. You'll 
get a new passphrase with each click. Each generation rolls a set of five virtual 
dice for **each** kupu. Kupu are chosen from the included Diceware kupu lists. 
The die roll numbers are shown next to each word.

## Legal

### Copyright

(c) 2016 Glenn Rempe <[glenn@rempe.us](mailto:glenn@rempe.us)> ([https://www.rempe.us/](https://www.rempe.us/))

### License

The gem is available as open source under the terms of
the [MIT License](http://opensource.org/licenses/MIT).

### Warranty

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied. See the LICENSE.txt file for the
specific language governing permissions and limitations under
the License.

## Thanks

This implementation was inspired by the very nicely done [https://github.com/yesiamben/diceware](https://github.com/yesiamben/diceware).
I took the opportunity to upgrade some security aspects and the UI.
