import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scoreResponse } from './score.mjs'

const dir = dirname(fileURLToPath(import.meta.url))
const arg = process.argv[2]
const golden = JSON.parse(readFileSync(join(dir, 'golden.json'), 'utf8'))
const fixtures = JSON.parse(readFileSync(arg ?? join(dir, 'fixtures/sample-responses.json'), 'utf8'))
const byId = new Map(golden.cases.map((c) => [c.id, c]))
let bad = 0

for (const fx of fixtures) {
  const kase = byId.get(fx.caseId)
  if (!kase) { console.log(`FAIL ${fx.caseId}/${fx.label}: unknown case`); bad++; continue }
  const fails = scoreResponse(fx.response, kase, golden.verifiedIds)
  const verdict = fails.length ? 'fail' : 'pass'
  const ruleOk = !fx.failRule || fails.some((x) => x.rule === fx.failRule)
  const ok = verdict === fx.expect && ruleOk
  if (!ok) bad++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${fx.caseId}/${fx.label} => ${verdict}${fails.length ? ' [' + fails.map((x) => x.detail).join('; ') + ']' : ''}`)
}
const covered = new Set(fixtures.filter((f) => f.expect === 'pass').map((f) => f.caseId))
for (const c of golden.cases) if (!covered.has(c.id)) { console.log(`FAIL ${c.id}: no passing response`); bad++ }

console.log(`\n${golden.cases.length} cases, ${fixtures.length} responses, ${bad} problems`)
process.exit(bad ? 1 : 0)
