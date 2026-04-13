#!/usr/bin/env -S deno run --allow-read --allow-env

import { resolve } from 'https://deno.land/std@0.224.0/path/mod.ts'
import { runCriticalChecks } from './checks/critical.ts'
import { runInfoChecks } from './checks/info.ts'
import { runWarningChecks } from './checks/warnings.ts'
import { parseArgs, printHelp } from './lib/cli.ts'
import { discoverListFiles, loadList } from './lib/loader.ts'
import { Reporter } from './lib/reporter.ts'

const args = parseArgs(Deno.args)

if (args.help) {
  printHelp()
  Deno.exit(0)
}

// Determine which files to check
let files: string[]
if (args.files.length > 0) {
  files = args.files.map((f) => resolve(Deno.cwd(), f))
} else {
  const listsDir = resolve(new URL('.', import.meta.url).pathname, '../lists')
  files = await discoverListFiles(listsDir)
}

if (files.length === 0) {
  console.error('No list files found.')
  Deno.exit(1)
}

const reporter = new Reporter({
  json: args.json,
  verbose: args.verbose,
  noColor: args.noColor,
})

for (const file of files) {
  try {
    const data = await loadList(file)
    const results = [
      ...runCriticalChecks(data),
      ...(args.tiers.includes(2) ? runWarningChecks(data) : []),
      ...(args.tiers.includes(3) ? runInfoChecks(data) : []),
    ]
    reporter.reportList(data, results)
  } catch (err) {
    console.error(
      `\nERROR loading ${file}: ${err instanceof Error ? err.message : err}`,
    )
  }
}

reporter.printSummary()
Deno.exit(reporter.hasFailures() ? 1 : 0)
