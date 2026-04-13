import type { CheckResult, Severity } from '../checks/types.ts'

export function computeGrade(checks: CheckResult[]): string {
  // Any structural (Tier 1) failure is an automatic F
  const hasStructuralFailure = checks.some(
    (ch) => ch.severity === 'FAIL' && !ch.passed,
  )
  if (hasStructuralFailure) return 'F'

  const total = checks.length
  if (total === 0) return 'A'
  const passed = checks.filter((ch) => ch.passed).length
  const pct = (passed / total) * 100

  if (pct >= 90) return 'A'
  if (pct >= 75) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 45) return 'D'
  return 'F'
}

interface ReporterOptions {
  json: boolean
  verbose: boolean
  noColor: boolean
}

interface ListReport {
  file: string
  listName: string
  exportName: string
  isSpecial: boolean
  checks: CheckResult[]
}

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function c(color: keyof typeof COLORS, text: string, noColor: boolean): string {
  if (noColor) return text
  return `${COLORS[color]}${text}${COLORS.reset}`
}

function severityColor(severity: Severity): keyof typeof COLORS {
  switch (severity) {
    case 'FAIL':
      return 'red'
    case 'WARN':
      return 'yellow'
    case 'INFO':
      return 'cyan'
  }
}

function severityLabel(
  severity: Severity,
  passed: boolean,
  noColor: boolean,
): string {
  if (passed && severity !== 'INFO') {
    return c('green', 'PASS', noColor)
  }
  const color = severityColor(severity)
  return c(color, severity, noColor)
}

export class Reporter {
  private reports: ListReport[] = []
  private opts: ReporterOptions

  constructor(opts: ReporterOptions) {
    this.opts = opts
  }

  reportList(data: ListData, checks: CheckResult[]): void {
    const report: ListReport = {
      file: data.fileName,
      listName: data.metadata?.name ?? data.exportName,
      exportName: data.exportName,
      isSpecial: data.isSpecial,
      checks,
    }
    this.reports.push(report)

    if (!this.opts.json) {
      this.printListReport(report)
    }
  }

  private printListReport(report: ListReport): void {
    const nc = this.opts.noColor
    console.log(
      `\n${c('bold', `=== ${report.file}`, nc)} (${report.listName}) ===\n`,
    )

    for (const check of report.checks) {
      const show =
        !check.passed || this.opts.verbose || check.severity === 'INFO'
      if (!show && check.passed) {
        // In non-verbose mode, still show PASS lines but skip details
        const label = severityLabel(check.severity, check.passed, nc)
        console.log(`  ${label}  ${check.name}: ${check.message}`)
        continue
      }

      const label = severityLabel(check.severity, check.passed, nc)
      console.log(`  ${label}  ${check.name}: ${check.message}`)

      if (
        check.details &&
        check.details.length > 0 &&
        (!check.passed || this.opts.verbose || check.severity === 'INFO')
      ) {
        for (const detail of check.details) {
          console.log(`${c('dim', `            ${detail}`, nc)}`)
        }
      }
    }
  }

  printSummary(): void {
    if (this.opts.json) {
      this.printJsonOutput()
      return
    }

    const nc = this.opts.noColor
    const total = this.reports.length
    let passed = 0
    let warned = 0
    let failed = 0

    for (const report of this.reports) {
      const hasFail = report.checks.some(
        (ch) => ch.severity === 'FAIL' && !ch.passed,
      )
      const hasWarn = report.checks.some(
        (ch) => ch.severity === 'WARN' && !ch.passed,
      )
      if (hasFail) failed++
      else if (hasWarn) warned++
      else passed++
    }

    console.log(`\n${'─'.repeat(40)}`)
    console.log(
      `${c('bold', `SUMMARY: ${total} list${total !== 1 ? 's' : ''} checked`, nc)}`,
    )
    console.log(
      `  ${c('green', `PASS: ${passed}`, nc)}    ${c('yellow', `WARN: ${warned}`, nc)}    ${c('red', `FAIL: ${failed}`, nc)}`,
    )
  }

  private printJsonOutput(): void {
    const output = {
      results: this.reports,
      summary: {
        totalLists: this.reports.length,
        passed: 0,
        warned: 0,
        failed: 0,
      },
    }

    for (const report of this.reports) {
      const hasFail = report.checks.some(
        (ch) => ch.severity === 'FAIL' && !ch.passed,
      )
      const hasWarn = report.checks.some(
        (ch) => ch.severity === 'WARN' && !ch.passed,
      )
      if (hasFail) output.summary.failed++
      else if (hasWarn) output.summary.warned++
      else output.summary.passed++
    }

    console.log(JSON.stringify(output, null, 2))
  }

  hasFailures(): boolean {
    return this.reports.some((r) =>
      r.checks.some((ch) => ch.severity === 'FAIL' && !ch.passed),
    )
  }

  getReports(): ListReport[] {
    return this.reports
  }

  generateTextReport(report: ListReport, date: string): string {
    const lines: string[] = []

    const totalPassed = report.checks.filter((ch) => ch.passed).length
    const totalChecks = report.checks.length
    const grade = computeGrade(report.checks)

    lines.push(`Verification Report: ${report.listName}`)
    lines.push(`File: ${report.file}`)
    lines.push(`Date: ${date}`)
    lines.push(`Grade: ${grade} (${totalPassed}/${totalChecks} passed)`)
    lines.push('')

    const tierGroups: Array<{
      label: string
      severities: Severity[]
    }> = [
      { label: 'STRUCTURAL', severities: ['FAIL'] },
      { label: 'QUALITY', severities: ['WARN'] },
      { label: 'ANALYSIS', severities: ['INFO'] },
    ]

    for (const group of tierGroups) {
      const checks = report.checks.filter((ch) =>
        group.severities.includes(ch.severity),
      )
      if (checks.length === 0) continue

      const groupPassed = checks.filter((ch) => ch.passed).length
      lines.push(`${group.label} (${groupPassed}/${checks.length})`)
      for (const check of checks) {
        const label = check.passed ? 'PASS' : 'FAIL'
        lines.push(`  ${label}  ${check.name}: ${check.message}`)
        if (check.details && check.details.length > 0 && !check.passed) {
          for (const detail of check.details) {
            lines.push(`          ${detail}`)
          }
        }
      }
      lines.push('')
    }

    return lines.join('\n')
  }
}
