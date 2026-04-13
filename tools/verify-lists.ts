#!/usr/bin/env -S deno run --allow-read --allow-env

import { ensureDir } from 'https://deno.land/std@0.224.0/fs/mod.ts'
import {
  basename,
  join,
  resolve,
} from 'https://deno.land/std@0.224.0/path/mod.ts'
import { runCriticalChecks } from './checks/critical.ts'
import { runInfoChecks } from './checks/info.ts'
import { runWarningChecks } from './checks/warnings.ts'
import { parseArgs, printHelp } from './lib/cli.ts'
import { discoverListFiles, loadList } from './lib/loader.ts'
import { writeListFile } from './lib/metadata-writer.ts'
import { computeGrade, Reporter } from './lib/reporter.ts'

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

// Track loaded list data for --write mode
const listDataMap = new Map<
  string,
  {
    filePath: string
    exportName: string
    metadata: Record<string, unknown>
    wordMap: Record<string, string>
  }
>()

for (const file of files) {
  try {
    const data = await loadList(file)
    const results = [
      ...runCriticalChecks(data),
      ...(args.tiers.includes(2) ? runWarningChecks(data) : []),
      ...(args.tiers.includes(3) ? runInfoChecks(data) : []),
    ]
    reporter.reportList(data, results)
    if (args.write && data.metadata) {
      listDataMap.set(data.fileName, {
        filePath: data.filePath,
        exportName: data.exportName,
        metadata: data.metadata as Record<string, unknown>,
        wordMap: data.wordMap,
      })
    }
  } catch (err) {
    console.error(
      `\nERROR loading ${file}: ${err instanceof Error ? err.message : err}`,
    )
  }
}

reporter.printSummary()

// Write verification metadata and reports
if (args.write) {
  const projectRoot = resolve(new URL('.', import.meta.url).pathname, '..')
  const reportsDir = join(projectRoot, 'reports')
  await ensureDir(reportsDir)

  const date = new Date().toISOString().slice(0, 10)
  let written = 0

  for (const report of reporter.getReports()) {
    const listData = listDataMap.get(report.file)
    if (!listData) continue

    const passed = report.checks.filter((ch) => ch.passed).length
    const total = report.checks.length
    const grade = computeGrade(report.checks)

    const reportFileName = `${basename(report.file, '.js')}.txt`
    const reportPath = `reports/${reportFileName}`

    // Write text report
    const textReport = reporter.generateTextReport(report, date)
    await Deno.writeTextFile(join(reportsDir, reportFileName), textReport)

    // Write verification metadata to list file
    const verification = {
      date,
      grade,
      passed,
      total,
      report: reportPath,
    }
    await writeListFile(
      listData.filePath,
      listData.exportName,
      listData.metadata,
      listData.wordMap,
      verification,
    )
    written++
  }

  console.log(`\nWrote ${written} reports to ${reportsDir}`)
}

Deno.exit(reporter.hasFailures() ? 1 : 0)
