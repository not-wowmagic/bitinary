import type { JimbotAction } from '@/data/chat'

export function JimbotActions({ actions, onAction }: { actions: JimbotAction[]; onAction?: (a: JimbotAction) => void }) {
  if (!actions.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <button
          key={`${a.type}-${i}`}
          type="button"
          onClick={() => onAction?.(a)}
          className="rounded-full border border-line px-3 py-1.5 text-sm text-fg-2 transition-colors hover:bg-sunken"
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
