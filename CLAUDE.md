# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Diceware passphrase generator — a single-page static web app that generates cryptographically secure passphrases using the browser's `window.crypto.getRandomValues()` CSPRNG. Hosted at https://diceware.rempe.us.

## Running Locally

No build step. Serve the directory with Caddy:

```sh
caddy run
```

Then open http://localhost:8080.

## Architecture

This is a vanilla JavaScript app with no build system, no bundler, and no framework. Dependencies (Bootstrap 3, jQuery, big.js, clipboard.js) are committed in `node_modules/` and loaded directly via `<script>` tags in `index.html`.

- **`index.html`** — Single HTML page containing all UI markup and `<script>` tags that load word lists and libraries
- **`index.js`** — All application logic: CSPRNG dice rolling (`secureRandom`), word lookup (`getWords`, `getWordFromWordNum`), entropy calculation (`calcEntropyForWordOrSymbol`, `calcCrackTime`), and jQuery DOM manipulation
- **`lists/`** — Diceware word lists for ~20 languages. Each is a standalone JS file that defines a global variable (e.g., `var eff = {...}`). Most have a `-min.js` minified variant
- **`css/app.css`** — Minimal custom styles on top of Bootstrap 3

## Key Design Decisions

- **No server communication** — everything runs client-side with no analytics or logging
- **`node_modules/` is committed** — intentional, so the app can run offline with no install step
- **Word list selection** — controlled by the `currentList` global and a `switch` statement in `getWordFromWordNum()`. The URL hash fragment reflects the active list

## Code Style

- JavaScript follows [Standard Style](https://github.com/feross/standard) (no semicolons, 2-space indent for most files, but `.editorconfig` specifies 4-space for `.js` files)
- LF line endings, trailing whitespace trimmed, final newline inserted
