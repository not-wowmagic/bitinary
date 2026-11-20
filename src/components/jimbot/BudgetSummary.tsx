import type { JimbotBudget } from '@/data/chat'
import { cn } from '@/lib/cn'

const peso = (n: number) => `₱${n.toLocaleString()}`

export function BudgetSummary({ budget }: { budget: JimbotBudget }) {
  const over = budget.limit != null && budget.total > budget.limit
  return (
    <section className="space-y-2 rounded-2xl border border-line bg-bg p-3 text-sm">
      {budget.lines.map((l, i) => (
        <div key={`${l.label}-${i}`} className="flex justify-between gap-3">
          <span className="min-w-0 truncate text-fg-2">{l.label}</span>
          <span>{peso(l.amount)}</span>
        </div>
      ))}
      <div className={cn('flex justify-between border-t border-line pt-2 font-semibold', over && 'text-danger')}>
        <span>{budget.isEstimate ? 'Total (estimate)' : 'Total'}</span>
        <span>{peso(budget.total)}{budget.limit != null && ` / ${peso(budget.limit)}`}</span>
      </div>
      {budget.perPerson != null && <p className="text-xs text-fg-2">{peso(budget.perPerson)} per person</p>}
    </section>
  )
}
