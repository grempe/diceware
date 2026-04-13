import type { CheckResult, ListData, Severity } from '../checks/types.ts'

export function computeGrade(checks: CheckResult[]): string {
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

const TIER_GROUPS: Array<{ label: string; severities: Severity[] }> = [
  { label: 'STRUCTURAL', severities: ['FAIL'] },
  { label: 'QUALITY', severities: ['WARN'] },
  { label: 'ANALYSIS', severities: ['INFO'] },
]

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

function gradeColor(grade: string): keyof typeof COLORS {
  if (grade === 'A') return 'green'
  if (grade === 'B') return 'cyan'
  if (grade === 'F') return 'red'
  return 'yellow'
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
    const totalPassed = report.checks.filter((ch) => ch.passed).length
    const totalChecks = report.checks.length
    const grade = computeGrade(report.checks)

    console.log(
      `\n${c('bold', `=== ${report.file}`, nc)} (${report.listName}) — Grade: ${c(gradeColor(grade), grade, nc)} (${totalPassed}/${totalChecks} passed) ===\n`,
    )

    for (const group of TIER_GROUPS) {
      const checks = report.checks.filter((ch) =>
        group.severities.includes(ch.severity),
      )
      if (checks.length === 0) continue

      const groupPassed = checks.filter((ch) => ch.passed).length
      console.log(
        `  ${c('bold', `${group.label}`, nc)} (${groupPassed}/${checks.length})`,
      )

      for (const check of checks) {
        const passed = check.passed
        const label = passed ? c('green', 'PASS', nc) : c('red', 'FAIL', nc)
        console.log(`    ${label}  ${check.name}: ${check.message}`)

        if (
          check.details &&
          check.details.length > 0 &&
          (!passed || this.opts.verbose)
        ) {
          for (const detail of check.details) {
            console.log(`${c('dim', `              ${detail}`, nc)}`)
          }
        }
      }
      console.log('')
    }
  }

  printSummary(): void {
    if (this.opts.json) {
      this.printJsonOutput()
      return
    }

    const nc = this.opts.noColor
    const total = this.reports.length

    console.log(`${'─'.repeat(40)}`)
    console.log(
      `${c('bold', `SUMMARY: ${total} list${total !== 1 ? 's' : ''} checked`, nc)}`,
    )

    const gradeOrder = { A: 0, B: 1, C: 2, D: 3, F: 4 }
    const sorted = this.reports
      .map((report) => ({
        report,
        grade: computeGrade(report.checks),
        passed: report.checks.filter((ch) => ch.passed).length,
        total: report.checks.length,
      }))
      .sort((a, b) => {
        const g =
          (gradeOrder[a.grade as keyof typeof gradeOrder] ?? 5) -
          (gradeOrder[b.grade as keyof typeof gradeOrder] ?? 5)
        if (g !== 0) return g
        return a.report.listName.localeCompare(b.report.listName)
      })

    for (const { report, grade, passed, total } of sorted) {
      console.log(
        `  ${c(gradeColor(grade), grade, nc)}  ${report.listName} (${passed}/${total})`,
      )
    }
  }

  private printJsonOutput(): void {
    const output = {
      results: this.reports.map((report) => ({
        ...report,
        grade: computeGrade(report.checks),
        passed: report.checks.filter((ch) => ch.passed).length,
        total: report.checks.length,
      })),
      summary: {
        totalLists: this.reports.length,
        grades: {} as Record<string, number>,
      },
    }

    for (const report of this.reports) {
      const grade = computeGrade(report.checks)
      output.summary.grades[grade] = (output.summary.grades[grade] ?? 0) + 1
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

    for (const group of TIER_GROUPS) {
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
