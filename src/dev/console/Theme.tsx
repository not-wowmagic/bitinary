import { Check, Monitor, RotateCcw, Save, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BODY_FONTS, DISPLAY_FONTS, PRESETS, contrast, defaultTheme, useConsole, validHex, type ThemeConfig } from '@/app/console'
import { useStore } from '@/app/store'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'
import { Badge, Field, PageHead, Panel, field } from './ui'

const INK = '#2b130a'
const lightFields: { k: keyof ThemeConfig['light']; label: string; hint: string }[] = [
  { k: 'primary', label: 'Primary', hint: 'Buttons, active tabs, highlights' },
  { k: 'bg', label: 'Background', hint: 'Page background' },
  { k: 'surface', label: 'Cards', hint: 'Cards and sheets' },
  { k: 'fg', label: 'Text', hint: 'Main text color' },
  { k: 'link', label: 'Links', hint: 'Links and small accents' },
  { k: 'brown', label: 'Brand dark', hint: 'Sidebars and dark buttons' },
]
const darkFields = lightFields.filter((f) => f.k !== 'brown') as { k: keyof ThemeConfig['dark']; label: string; hint: string }[]

/** Loads every selectable font once so the pickers can show real samples. */
function useFontSamples() {
  useEffect(() => {
    const id = 'bitinary-font-samples'
    if (document.getElementById(id)) return
    const l = document.createElement('link')
    l.id = id
    l.rel = 'stylesheet'
    l.href = `https://fonts.googleapis.com/css2?${[...DISPLAY_FONTS, ...BODY_FONTS].map((f) => `family=${f.replace(/ /g, '+')}:wght@400;600;700`).join('&')}&display=swap`
    document.head.appendChild(l)
  }, [])
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const ok = validHex(text)
  return (
    <div className="flex items-center gap-3">
      <input type="color" aria-label={`${label} color`} value={ok ? text : value} onChange={(e) => (setText(e.target.value), onChange(e.target.value))} className="h-11 w-11 shrink-0 cursor-pointer rounded-[12px] border border-line bg-transparent p-1" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-medium leading-tight">{label}</p>
        <p className="truncate text-[12px] text-fg-2">{hint}</p>
      </div>
      <input aria-label={`${label} hex`} value={text} onChange={(e) => (setText(e.target.value), validHex(e.target.value) && onChange(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`))} className={cn(field, 'h-10 w-[104px] font-mono text-[13px] uppercase', !ok && 'border-danger')} />
    </div>
  )
}

function Ratio({ label, a, b, large }: { label: string; a: string; b: string; large?: boolean }) {
  const r = contrast(a, b)
  const pass = r >= (large ? 3 : 4.5)
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-[10px] font-display text-[14px] font-bold" style={{ background: b, color: a }}>
        Aa
      </span>
      <span className="min-w-0 flex-1 text-[14px]">{label}</span>
      <span className="font-mono text-[13px]">{r.toFixed(1)}:1</span>
      {pass ? (
        <Badge tone="ok">
          <Check size={12} /> Pass
        </Badge>
      ) : (
        <Badge tone="caution">
          <TriangleAlert size={12} /> Low
        </Badge>
      )}
    </li>
  )
}

export function ThemePage() {
  useFontSamples()
  const { c, update } = useConsole()
  const { showToast } = useStore()
  const [draft, setDraftState] = useState<ThemeConfig>(() => c.themeDraft ?? c.theme)
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [target, setTarget] = useState<'app' | 'biz'>('app')
  const [presetName, setPresetName] = useState('')
  const setDraft = (t: ThemeConfig) => {
    setDraftState(t)
    update((x) => ({ ...x, themeDraft: t }))
  }
  const patch = (p: Partial<ThemeConfig>) => setDraft({ ...draft, ...p, preset: p.preset ?? 'custom' })
  const dirty = JSON.stringify(draft) !== JSON.stringify(c.theme)
  const apply = () => {
    update((x) => ({ ...x, theme: draft, themeDraft: undefined }), { area: 'Theme', action: `Applied theme "${PRESETS.find((p) => p.preset === draft.preset)?.name ?? c.savedPresets.find((p) => p.preset === draft.preset)?.name ?? 'Custom'}"` })
    showToast({ text: 'Theme applied to the app.', expression: 'celebrating' })
  }
  const all = [...PRESETS, ...c.savedPresets]
  const pal = mode === 'light' ? draft.light : draft.dark
  const previewSrc = `${import.meta.env.BASE_URL}${target === 'app' ? '' : 'biz/stats'}?embed=1&themePreview=1&theme=${mode}`

  return (
    <>
      <PageHead
        title="Theme"
        sub="Colors, fonts and corners for the traveler app and Bitinary Business."
        actions={
          <>
            <Button variant="ghost" icon={<RotateCcw size={17} />} onClick={() => setDraft({ ...defaultTheme })}>
              Reset to Bitinary
            </Button>
            <Button icon={<Check size={17} />} disabled={!dirty} onClick={apply}>
              Apply to app
            </Button>
          </>
        }
      />
      {dirty && <p className="-mt-2 mb-4 inline-flex rounded-full bg-caution-bg px-3 py-1 text-[13px] font-semibold text-caution">You have unapplied changes. They’ll appear in the app after you select “Apply to app.”</p>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:items-start">
        <div className="space-y-4">
          <Panel title="Presets">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {all.map((p) => (
                <div key={p.preset + p.name} className="relative">
                  <button onClick={() => setDraft({ ...p })} aria-pressed={draft.preset === p.preset} className={cn('w-full rounded-[16px] border-2 p-3 text-left', draft.preset === p.preset ? 'border-primary' : 'border-line')}>
                    <span className="flex gap-1">
                      {[p.light.primary, p.light.bg, p.light.fg, p.dark.bg, p.dark.primary].map((col, i) => (
                        <span key={i} className="h-6 w-6 rounded-full border border-black/10" style={{ background: col }} />
                      ))}
                    </span>
                    <span className="mt-2 block font-display text-[14px] font-semibold" style={{ fontFamily: `'${p.fontDisplay}'` }}>
                      {p.name}
                    </span>
                    <span className="block text-[12px] text-fg-2">
                      {p.fontDisplay} · {p.corners}
                    </span>
                  </button>
                  {c.savedPresets.some((s) => s.preset === p.preset) && (
                    <button onClick={() => update((x) => ({ ...x, savedPresets: x.savedPresets.filter((s) => s.preset !== p.preset) }), { area: 'Theme', action: `Deleted preset "${p.name}"` })} aria-label={`Delete preset ${p.name}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-fg-2 hover:bg-danger-bg hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Name this theme, e.g. Kain Pinoy Week" aria-label="Preset name" className={field} />
              <Button
                variant="secondary"
                icon={<Save size={17} />}
                disabled={!presetName.trim()}
                onClick={() => {
                  const preset = `p${Date.now()}`
                  update((x) => ({ ...x, savedPresets: [...x.savedPresets, { ...draft, preset, name: presetName.trim() }] }), { area: 'Theme', action: `Saved preset "${presetName.trim()}"` })
                  setDraft({ ...draft, preset })
                  setPresetName('')
                }}
              >
                Save preset
              </Button>
            </div>
          </Panel>

          <Panel title="Colors" action={<Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />}>
            <div className="grid gap-3 md:grid-cols-2">
              {mode === 'light'
                ? lightFields.map((f) => <ColorField key={f.k} label={f.label} hint={f.hint} value={draft.light[f.k]} onChange={(v) => patch({ light: { ...draft.light, [f.k]: v } })} />)
                : darkFields.map((f) => <ColorField key={f.k} label={f.label} hint={f.hint} value={draft.dark[f.k]} onChange={(v) => patch({ dark: { ...draft.dark, [f.k]: v } })} />)}
            </div>
            <ul className="mt-5 space-y-2 border-t border-line pt-4">
              <Ratio label="Text on background" a={pal.fg} b={pal.bg} />
              <Ratio label="Text on cards" a={pal.fg} b={pal.surface} />
              <Ratio label="Button text on primary" a={INK} b={pal.primary} large />
              <Ratio label="Links on cards" a={pal.link} b={pal.surface} />
            </ul>
            <p className="mt-3 text-[13px] text-fg-2">Low contrast is a warning, not a block. Aim for 4.5:1 for body text.</p>
          </Panel>

          <Panel title="Fonts and corners">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Headings" htmlFor="font-display">
                <select id="font-display" value={draft.fontDisplay} onChange={(e) => patch({ fontDisplay: e.target.value })} className={field} style={{ fontFamily: `'${draft.fontDisplay}'` }}>
                  {DISPLAY_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[24px] font-bold leading-tight" style={{ fontFamily: `'${draft.fontDisplay}'` }}>
                  Tara, biyahe tayo!
                </p>
              </Field>
              <Field label="Body text" htmlFor="font-body">
                <select id="font-body" value={draft.fontBody} onChange={(e) => patch({ fontBody: e.target.value })} className={field} style={{ fontFamily: `'${draft.fontBody}'` }}>
                  {BODY_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[15px]" style={{ fontFamily: `'${draft.fontBody}'` }}>
                  Planuhin ang kainan at pasyalan na pasok sa budget, kasama si Jimbot. ₱150–₱350
                </p>
              </Field>
              <Field label="Corners" className="md:col-span-2" hint="Changes cards and sheets. Buttons stay pill-shaped.">
                <Segmented
                  className="w-full"
                  label="Corners"
                  value={draft.corners}
                  onChange={(corners) => patch({ corners })}
                  options={[
                    { value: 'sharp', label: 'Sharp' },
                    { value: 'default', label: 'Default' },
                    { value: 'round', label: 'Round' },
                  ]}
                />
              </Field>
            </div>
          </Panel>
          <p className="flex items-start gap-2 text-[13px] text-fg-2">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-link" />
            A few decorative colors are fixed inside components (for example the light text on dark sidebars), so some details keep the original Bitinary look.
          </p>
        </div>

        <div className="xl:sticky xl:top-24">
          <Panel
            title="Live preview"
            sub="Shows your unsaved changes"
            action={<Segmented label="Preview" value={target} onChange={setTarget} options={[{ value: 'app', label: 'Traveler app' }, { value: 'biz', label: 'Business' }]} />}
          >
            <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border-[6px] border-brown bg-bg shadow-float dark:border-elevated">
              <iframe key={previewSrc} src={previewSrc} title="Theme preview" className="h-[680px] w-full" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-fg-2">
              <Monitor size={14} /> {mode === 'light' ? 'Light' : 'Dark'} mode · switch with the Colors toggle
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}
