# Diceware Passphrase Generator

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

A [Diceware](http://world.std.com/~reinhold/diceware.html) passphrase generator,
implemented in JavaScript, that uses the
[Cryptographically Secure Pseudo Random Number Generator](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator)
(CSPRNG) in your browser as its source of entropy instead of rolling physical dice.

## Hosted Version

[https://www.rempe.us/diceware/](https://www.rempe.us/diceware/)

## Important Features

* All random number generation is done in your browser using [window.crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues)
* Single page JavaScript application with no communication back to a server
* Can be run locally from a Git clone, with all dependencies baked in
* Git tags and commits are [signed with my public code signing key](https://www.rempe.us/keys/)
* Can be run without a network connection. No logging or analytics
* All assets are served from `www.rempe.us`, an [A+ rated TLS website](https://www.ssllabs.com/ssltest/analyze.html?d=www.rempe.us&latest)
* All [CSS/JS](https://sritest.io/#report/e0d1efa0-cc91-46d9-9450-8669cfe3bfe2) have [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) hashes
* Realtime estimate of the security level of your generated passphrase
* Support for many language specific word lists

It may just be the closest thing to rolling your own dice. You can do that too
of course, and just use this app as a quick way to lookup your passphrase
in the word lists.

## Using It

Just choose a language and click a button corresponding to the number of
words you want to generate. You'll get a new passphrase with each click.
Each generation rolls a set of five virtual dice for **each** word. Words are
chosen from the included Diceware word lists. The die roll numbers are shown
next to each word.

## Security

If you are security conscious you are of course encouraged to download
the [source code](https://github.com/grempe/diceware) for this app and run it
locally. Due to the security methods in use such as Subresource Integrity, you'll
need to serve the application from a small local web server and not from a `file:///` URL.

## Running offline
Start a tiny Python web server many operating systems come with Python pre-installed.

### Python2
```
cd diceware
python -m SimpleHTTPServer 8080
```
### Python3
```
cd diceware
python3 -m http.server 8080
```
Now you can disconnect your device from your Wi-Fi connection or Ethernet cable and visit http://localhost:8080 on your browser!  
Another good option is to install `caddy` from [https://caddyserver.com/](https://caddyserver.com/) and run that command in this directory.

### Tin Foil Hat Version
If you want to be *REALLY REALLY* secure. Roll the dice with a flashlight under
a black hood with a printout of the Diceware word list. No computers needed!

*Not really kidding*

### Installation Security : Signed Git Commits

Most, if not all, of the commits and tags in the repository for this code are
signed with my PGP/GPG code signing key. I have uploaded my code signing public
keys to GitHub and you can now verify those signatures with the GitHub UI.
See [this list of commits](https://github.com/grempe/diceware/commits/master)
and look for the `Verified` tag next to each commit. You can click on that tag
for additional information.

You can also clone the repository and verify the signatures locally using your
own GnuPG installation. You can find my certificates and read about how to conduct
this verification at [https://www.rempe.us/keys/](https://www.rempe.us/keys/).

### Contributing

Bug reports and pull requests are welcome on GitHub
at [https://github.com/grempe/diceware](https://github.com/grempe/diceware). This
project is intended to be a safe, welcoming space for collaboration, and contributors
are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

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
