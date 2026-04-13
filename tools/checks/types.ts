/** Severity levels matching output tiers */
export type Severity = 'FAIL' | 'WARN' | 'INFO'

/** Result of a single check */
export interface CheckResult {
  id: string
  name: string
  severity: Severity
  passed: boolean
  message: string
  details?: string[]
}

/** The parsed contents of a list file */
export interface ListData {
  filePath: string
  fileName: string
  exportName: string
  wordMap: Record<string, string>
  metadata?: {
    name?: string
    source?: string
    author?: string
    license?: string
  }
  isSpecial: boolean
}

/** Verification summary written to list metadata */
export interface VerificationMeta {
  date: string
  grade: string
  passed: number
  total: number
  report: string
}

/** Check function signature */
export type CheckFn = (data: ListData) => CheckResult | CheckResult[]
