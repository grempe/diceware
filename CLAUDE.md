# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Diceware passphrase generator — a single-page static web app that generates cryptographically secure passphrases using the browser's `crypto.getRandomValues()` CSPRNG. Hosted at https://diceware.rempe.us.

## Prerequisites

Development tools are managed by [mise](https://mise.jdx.dev/) and defined in `.tool-versions`. Install all dependencies with:

```sh
mise install
```

This provides Node.js, Deno, Caddy, and [Task](https://taskfile.dev/).

## Running Locally

No build step. Serve the directory with:

```sh
task serve
```

Then open http://localhost:8080. A local HTTP server is required (ES modules don't work over `file://`).

## Commands

All tasks are defined in `Taskfile.yml`. Run `task` to list them.

- `task serve` — start local dev server on http://localhost:8080
- `task lint` — check linting and formatting
- `task lint-fix` — auto-fix lint and format issues
- `task format` — format all files
- `task verify` — run all verification tiers, update list metadata and generate reports
- `task verify -- lists/eff.js` — verify a specific list file (with writes)
- `task verify-check` — quick read-only verification (tiers 1+2, no writes)
- `task precommit` — run all precommit checks (lint + full verification)
- `task install` — install npm dependencies (runs automatically as a dependency of lint tasks)

## Architecture

Zero runtime dependencies. The only external CSS is Pico CSS v2 (vendored locally). All JavaScript is vanilla ES modules.

### Module Structure

- **`js/main.js`** — Entry point. Application state, event listeners, initialization
- **`js/crypto.js`** — `secureRandom()` CSPRNG using rejection sampling
- **`js/entropy.js`** — Entropy calculation, crack time math (native `BigInt`), attacker tier definitions
- **`js/wordlist.js`** — Word lookup via registry, list state management
- **`js/ui.js`** — DOM updates, clipboard (`navigator.clipboard`), crack time display

### Word Lists

- **`lists/registry.js`** — Import hub mapping list IDs to word maps (replaces switch statement)
- **`lists/*.js`** — ES modules exporting `const` objects with 7776 entries keyed by 5-digit die rolls
- **`lists/special.js`** — 36 special characters keyed by 2-digit die rolls

### HTML/CSS

- **`index.html`** — Semantic HTML with Pico CSS classless styling. FAQ uses native `<details>` elements
- **`css/pico.classless.min.css`** — Vendored Pico CSS v2 (do not edit)
- **`css/app.css`** — Minimal custom styles on top of Pico

## Key Design Decisions

- **No server communication** — everything runs client-side with no analytics or logging
- **Zero runtime dependencies** — all JS is vanilla, CSS is vendored Pico only
- **Auditable** — users can clone and inspect all code for trust
- **Offline-capable** — works without network after initial load
- **Word list registry** — `lists[currentList][wordNum]` replaces 21-case switch statement
- **URL hash** — reflects active word list, supports direct linking

## Code Style

- Linting and formatting via [Biome](https://biomejs.dev/) — run `task lint` to check, `task lint-fix` to auto-fix
- 2-space indent, single quotes, semicolons as needed
