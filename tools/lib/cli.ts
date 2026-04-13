export interface CliArgs {
  files: string[]
  tiers: number[]
  json: boolean
  verbose: boolean
  noColor: boolean
  write: boolean
  help: boolean
}

const HELP_TEXT = `
Diceware Word List Verifier

USAGE:
  deno run --allow-read tools/verify-lists.ts [OPTIONS] [FILE...]

OPTIONS:
  --help, -h       Show this help
  --tier=1,2       Which tiers to run (default: 1,2)
  --all-tiers      Run all tiers including expensive Tier 3
  --write          Run all tiers, write verification metadata to list
                   files and text reports to reports/
  --json           Output as JSON
  --verbose, -v    Show details for passing checks too
  --no-color       Disable color output

ARGUMENTS:
  FILE...          Specific list files to check
                   (default: all lists/*.js except registry.js)

EXAMPLES:
  deno run --allow-read tools/verify-lists.ts
  deno run --allow-read tools/verify-lists.ts lists/eff.js
  deno run --allow-read tools/verify-lists.ts --all-tiers
  deno run --allow-read tools/verify-lists.ts --tier=1 lists/special.js
`.trim()

export function printHelp(): void {
  console.log(HELP_TEXT)
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    files: [],
    tiers: [1, 2],
    json: false,
    verbose: false,
    noColor: false,
    write: false,
    help: false,
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true
    } else if (arg === '--json') {
      result.json = true
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true
    } else if (arg === '--no-color') {
      result.noColor = true
    } else if (arg === '--write') {
      result.write = true
      result.tiers = [1, 2, 3]
    } else if (arg === '--all-tiers') {
      result.tiers = [1, 2, 3]
    } else if (arg.startsWith('--tier=')) {
      const tierStr = arg.slice('--tier='.length)
      result.tiers = tierStr
        .split(',')
        .map((t) => Number.parseInt(t.trim(), 10))
        .filter((t) => t >= 1 && t <= 3)
      if (result.tiers.length === 0) {
        result.tiers = [1, 2]
      }
    } else if (!arg.startsWith('-')) {
      result.files.push(arg)
    }
  }

  // Respect NO_COLOR env convention
  if (Deno.env.get('NO_COLOR') !== undefined) {
    result.noColor = true
  }

  return result
}
