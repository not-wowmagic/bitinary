import {
  Camera,
  ImagePlus,
  LocateFixed,
  Megaphone,
  Sparkles,
} from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import {
  useAccount,
  type Consent,
  type Profile,
  type TravelerPrefs,
  type TravelerThemeId,
} from "@/app/account"
import { useStore } from "@/app/store"
import { useLang } from "@/app/i18n"
import {
  ChoiceChip,
  ChoiceRow,
  SelectCard,
  TextField,
} from "@/components/flow/Fields"
import { IOSAlert } from "@/components/flow/IOSAlert"
import { Jimbot } from "@/components/mascot/Jimbot"
import { PHLocationPicker } from "@/components/onboarding/BizWidgets"
import { JimbotTip, Question } from "@/components/onboarding/Kit"
import { ThemeScreen } from "@/components/onboarding/Templates"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Segmented"
import { Sheet } from "@/components/ui/Sheet"
import { Toggle } from "@/components/ui/Toggle"
import {
  ageOpts,
  companionOpts,
  dietOpts,
  foodOpts,
  frequencyOpts,
  interestOpts,
  lastTripOpts,
  needOpts,
  nextTripOpts,
  paceOpts,
  transportOpts,
  travelerThemes,
  type Opt,
} from "@/data/themes"
import { cn } from "@/lib/cn"
import { getForcedState } from "@/lib/forced"
import { peso } from "@/lib/format"

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

function Chips({
  opts,
  value,
  onChange,
  single,
}: {
  opts: Opt[]
  value: string[] | string | undefined
  onChange: (v: string) => void
  single?: boolean
}) {
  const { lang } = useLang()
  const has = (id: string) =>
    Array.isArray(value) ? value.includes(id) : value === id
  return (
    <div
      className="flex flex-wrap gap-2"
      role={single ? "radiogroup" : "group"}
    >
      {opts.map((o) => {
        const I = o.icon
        return (
          <ChoiceChip
            key={o.id}
            multi={!single}
            selected={has(o.id)}
            onClick={() => onChange(o.id)}
            icon={I ? <I size={18} /> : undefined}
          >
            {o[lang]}
          </ChoiceChip>
        )
      })}
    </div>
  )
}

export function PesoSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  suffix: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="rounded-[20px] bg-surface p-4 shadow-card dark:bg-elevated/50">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[14px] font-medium text-fg-2">
          {label}
        </span>
        <span className="font-display text-[28px] font-bold leading-none text-fg">
          {peso(value)}
          <span className="ml-1 text-[14px] font-medium text-fg-2">
            {suffix}
          </span>
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-3 w-full cursor-pointer appearance-none rounded-full accent-[var(--c-primary)] [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(43,19,10,.35)]"
        style={{
          background: `linear-gradient(to right, var(--c-primary) ${pct}%, var(--c-sunken) ${pct}%)`,
        }}
      />
      <div className="mt-1.5 flex justify-between text-[12px] text-fg-2">
        <span>{peso(min)}</span>
        <span>{peso(max)}+</span>
      </div>
    </div>
  )
}

type FormProps = {
  id: TravelerThemeId
  embedded?: boolean
  onDone: (status: "done" | "skipped") => void
  onBack: () => void
}

/** Renders one traveler theme (max 3 questions) inside the shared ThemeScreen template. */
export function TravelerThemeForm({ id, embedded, onDone, onBack }: FormProps) {
  const { prefs, setPrefs, profile, setProfile, consent, setConsent } =
    useAccount()
  const { updateProfile } = useAccount()
  const { showToast } = useStore()
  const { lang, t } = useLang()
  const def = travelerThemes.find((x) => x.id === id)!
  const [p, setP] = useState<TravelerPrefs>(prefs)
  const [pr, setPr] = useState<Profile>(profile)
  const [c, setC] = useState<Consent>(consent)
  const forced = getForcedState()
  const [locSheet, setLocSheet] = useState(forced === "location")
  const [sysAlert, setSysAlert] = useState(forced === "system")
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<TravelerPrefs>) =>
    setP((x) => ({ ...x, ...patch }))

  const save = async () => {
    const status = { ...p.status, [id]: "done" as const }
    const preferenceResult = await setPrefs({
      ...p,
      status,
      lastTripAt:
        id === "trip" && p.lastTrip !== prefs.lastTrip
          ? new Date().toISOString()
          : p.lastTripAt,
    })
    if (preferenceResult.error) return
    if (id === "about") {
      const result = await updateProfile(pr)
      if (result.error) {
        showToast({ text: result.error, expression: "unsure" })
        return
      }
    }
    if (id === "about") setProfile(pr)
    if (id === "privacy") {
      const consentResult = await setConsent(c)
      if (consentResult.error) return
    }
    onDone("done")
  }
  const skip = async () => {
    const result = await setPrefs((x) => ({
      ...x,
      status: {
        ...x.status,
        [id]: x.status[id] === "done" ? "done" : "skipped",
      },
    }))
    if (result.error) return
    onDone("skipped")
  }

  let body: ReactNode = null
  let canSave = true
  switch (id) {
    case "trip":
      canSave = !!(p.lastTrip || p.frequency || p.nextTrip)
      body = (
        <>
          <Question
            n={1}
            title={t(
              "Kailan ang huling biyahe mo?",
              "When was your last trip?",
            )}
          >
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {lastTripOpts.map((o) => (
                <ChoiceRow
                  key={o.id}
                  selected={p.lastTrip === o.id}
                  onClick={() => set({ lastTrip: o.id })}
                >
                  {o[lang]}
                </ChoiceRow>
              ))}
            </div>
          </Question>
          <Question
            n={2}
            title={t(
              "Gaano ka kadalas mag-travel o kumain sa labas?",
              "How often do you travel or eat out?",
            )}
          >
            <Chips
              single
              opts={frequencyOpts}
              value={p.frequency}
              onChange={(v) => set({ frequency: v })}
            />
          </Question>
          <Question
            n={3}
            title={t(
              "Kailan ang susunod mong biyahe?",
              "When is your next trip?",
            )}
          >
            <Chips
              single
              opts={nextTripOpts}
              value={p.nextTrip}
              onChange={(v) => set({ nextTrip: v })}
            />
          </Question>
        </>
      )
      break
    case "budget":
      body = (
        <>
          <Question n={1} title={t("Budget bawat araw", "Budget per day")}>
            <PesoSlider
              label={t("Bawat araw", "Per day")}
              suffix={t("/araw", "/day")}
              value={p.dailyBudget}
              min={300}
              max={10000}
              step={100}
              onChange={(v) => set({ dailyBudget: v })}
            />
          </Question>
          <Question n={2} title={t("Budget bawat kain", "Budget per meal")}>
            <PesoSlider
              label={t("Bawat kain", "Per meal")}
              suffix={t("/kain", "/meal")}
              value={p.mealBudget}
              min={50}
              max={1500}
              step={10}
              onChange={(v) => set({ mealBudget: v })}
            />
          </Question>
          <Question
            n={3}
            title={t("Flexible ba ang budget mo?", "Is your budget flexible?")}
          >
            <label className="flex items-center justify-between gap-3 rounded-[20px] bg-surface p-4 shadow-card dark:bg-elevated/50">
              <span>
                <span className="block font-display text-[16px] font-semibold">
                  Flexible
                </span>
                <span className="text-[14px] text-fg-2">
                  {t(
                    "Ipapakita rin ni Jimbot ang lugar na medyo lampas sa budget.",
                    "Jimbot may also show places slightly over budget.",
                  )}
                </span>
              </span>
              <Toggle
                label="Flexible"
                checked={p.flexible}
                onChange={(v) => set({ flexible: v })}
              />
            </label>
          </Question>
        </>
      )
      break
    case "food":
      canSave = p.foods.length > 0 || p.diet.length > 0
      body = (
        <>
          <Question
            n={1}
            title={t("Paboritong pagkain", "Favorite food types")}
            hint={t("Pumili ng kahit ilan.", "Pick as many as you like.")}
          >
            <Chips
              opts={foodOpts}
              value={p.foods}
              onChange={(v) => set({ foods: toggle(p.foods, v) })}
            />
          </Question>
          <Question
            n={2}
            title={t(
              "May paghihigpit sa pagkain?",
              "Any dietary restrictions?",
            )}
            tag="optional"
          >
            <Chips
              opts={dietOpts}
              value={p.diet}
              onChange={(v) => set({ diet: toggle(p.diet, v) })}
            />
          </Question>
          {p.diet.includes("allergy") && (
            <Question
              n={3}
              title={t("Ano ang allergy mo?", "What are you allergic to?")}
            >
              <TextField
                label={t("Allergy", "Allergy")}
                placeholder={t("hal. hipon, mani", "e.g. shrimp, peanuts")}
                value={p.allergy ?? ""}
                onChange={(e) => set({ allergy: e.target.value })}
              />
            </Question>
          )}
        </>
      )
      break
    case "interests":
      canSave = p.interests.length > 0
      body = (
        <Question
          n={1}
          title={t(
            "Ano ang gusto mo sa biyahe?",
            "What do you enjoy on trips?",
          )}
          hint={t(
            "Mas marami, mas tama ang suhestiyon.",
            "The more you pick, the better the tips.",
          )}
        >
          <Chips
            opts={interestOpts}
            value={p.interests}
            onChange={(v) => set({ interests: toggle(p.interests, v) })}
          />
        </Question>
      )
      break
    case "companions":
      canSave = p.companions.length > 0 || p.transport.length > 0 || !!p.pace
      body = (
        <>
          <Question
            n={1}
            title={t(
              "Sino ang kasama mo kadalasan?",
              "Who do you usually travel with?",
            )}
          >
            <Chips
              opts={companionOpts}
              value={p.companions}
              onChange={(v) => set({ companions: toggle(p.companions, v) })}
            />
          </Question>
          <Question
            n={2}
            title={t("Paano ka bumibiyahe?", "How do you get around?")}
          >
            <Chips
              opts={transportOpts}
              value={p.transport}
              onChange={(v) => set({ transport: toggle(p.transport, v) })}
            />
          </Question>
          <Question
            n={3}
            title={t("Anong bilis ng lakad?", "What pace do you like?")}
          >
            <Segmented
              className="w-full"
              value={p.pace ?? ""}
              onChange={(v) => set({ pace: v })}
              options={paceOpts.map((o) => ({ value: o.id, label: o[lang] }))}
            />
          </Question>
        </>
      )
      break
    case "needs":
      canSave = p.needs.length > 0
      body = (
        <Question
          n={1}
          title={t("Alin ang kailangan mo?", "Which do you need?")}
          tag="optional"
        >
          <div className="space-y-2.5">
            {needOpts.map((o) => {
              const I = o.icon!
              return (
                <SelectCard
                  key={o.id}
                  multi
                  selected={p.needs.includes(o.id)}
                  onClick={() => set({ needs: toggle(p.needs, o.id) })}
                  icon={<I size={24} />}
                  title={o[lang]}
                />
              )
            })}
          </div>
        </Question>
      )
      break
    case "about":
      canSave = true
      body = (
        <>
          <Question n={1} title={t("Pangalan", "Name")}>
            <div className="space-y-2">
              <TextField
                label={t("Buong pangalan", "Full name")}
                placeholder={t("hal. Zaldy Malig", "e.g. Alex Reyes")}
                value={pr.name}
                onChange={(e) => setPr((x) => ({ ...x, name: e.target.value }))}
              />
              <TextField
                label={t("Palayaw", "Nickname")}
                placeholder={t(
                  "Paano ka tatawagin?",
                  "What should we call you?",
                )}
                value={pr.nickname}
                onChange={(e) =>
                  setPr((x) => ({ ...x, nickname: e.target.value }))
                }
              />
            </div>
          </Question>
          <Question n={2} title={t("Edad", "Age range")} tag="optional">
            <Chips
              single
              opts={ageOpts}
              value={pr.ageRange}
              onChange={(v) => setPr((x) => ({ ...x, ageRange: v }))}
            />
          </Question>
          <Question
            n={3}
            title={t("Lungsod o probinsya", "City or province")}
            tag="optional"
          >
            <PHLocationPicker
              value={pr.city ?? ""}
              onChange={(city) => setPr((x) => ({ ...x, city }))}
            />
          </Question>
          <Question
            n={4}
            title={t("Larawan sa profile", "Profile photo")}
            tag="optional"
          >
            <div className="flex items-center gap-4">
              {pr.avatar ? (
                <img
                  src={pr.avatar}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/30"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sunken font-display text-[26px] font-bold text-fg-2 dark:bg-elevated">
                  {(pr.name || "B")[0]}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ImagePlus size={16} />}
                  onClick={() => fileRef.current?.click()}
                >
                  {t("Pumili ng larawan", "Choose a photo")}
                </Button>
                {pr.avatar && (
                  <button
                    onClick={() => setPr((x) => ({ ...x, avatar: undefined }))}
                    className="text-left font-display text-[13px] font-medium text-link"
                  >
                    {t("Tanggalin", "Remove")}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) setPr((x) => ({ ...x, avatar: "" }))
                  if (f) {
                    const url = await shrink(f, 320)
                    setPr((x) => ({ ...x, avatar: url }))
                  }
                }}
              />
            </div>
          </Question>
        </>
      )
      break
    case "privacy":
      body = (
        <>
          <Question n={1} title={t("Lokasyon", "Location")}>
            <PermRow
              icon={<LocateFixed size={22} />}
              title={t("Habang ginagamit ang app", "While using the app")}
              body={t(
                'Para sa "malapit sa akin" at check-in. Hindi kailanman sa background.',
                'For "near me" and check-ins. Never in the background.',
              )}
              checked={c.location}
              onChange={(v) =>
                v
                  ? setLocSheet(true)
                  : setC((x) => ({
                      ...x,
                      location: false,
                      locationPermission: undefined,
                    }))
              }
            />
          </Question>
          <Question
            n={2}
            title={t("Mga suhestiyon at promo", "Suggestions and promos")}
          >
            <div className="space-y-2">
              <PermRow
                icon={<Sparkles size={22} />}
                title={t("Personalization", "Personalization")}
                body={t(
                  "Gamitin ang mga sagot mo para sa Home at kay Jimbot.",
                  "Use your answers for Home and Jimbot.",
                )}
                checked={c.personalization}
                onChange={(v) => setC((x) => ({ ...x, personalization: v }))}
              />
              <PermRow
                icon={<Megaphone size={22} />}
                title={t("Mga promo at deals", "Promos and deals")}
                body={t("Naka-off bilang default.", "Off by default.")}
                checked={c.marketing}
                onChange={(v) => setC((x) => ({ ...x, marketing: v }))}
              />
            </div>
          </Question>
          <Question n={3} title={t("Mga larawan", "Photos")}>
            <PermRow
              icon={<Camera size={22} />}
              title={t(
                "Ibahagi ang Moments sa publiko",
                "Share Moments publicly",
              )}
              body={t(
                "Pribado ang mga larawan mo bilang default.",
                "Your photos are private by default.",
              )}
              checked={c.momentsShare}
              onChange={(v) => setC((x) => ({ ...x, momentsShare: v }))}
            />
          </Question>
          <Sheet open={locSheet} onClose={() => setLocSheet(false)}>
            <div className="flex flex-col items-center text-center">
              <Jimbot expression="pointing" variant="standalone" size={150} />
              <h2 className="mt-2 text-h2">
                {t(
                  "Puwede ko bang malaman kung nasaan ka?",
                  "Can I know where you are?",
                )}
              </h2>
              <p className="mt-2 max-w-[340px] text-body text-fg-2">
                {t(
                  'Para maipakita ko ang kainan na malapit sa iyo at masabi ko kung "Nandito ka na!". Habang bukas lang ang app.',
                  'So I can show food spots near you and tell you "You\'re here!". Only while the app is open.',
                )}
              </p>
              <Button
                block
                size="lg"
                className="mt-5"
                onClick={() => (setLocSheet(false), setSysAlert(true))}
              >
                {t("Payagan habang ginagamit", "Allow while using the app")}
              </Button>
              <Button
                block
                variant="ghost"
                className="mt-1"
                onClick={() => setLocSheet(false)}
              >
                {t("Hindi muna", "Not now")}
              </Button>
            </div>
          </Sheet>
          <IOSAlert
            open={sysAlert}
            title={t(
              'Payagan ang "Bitinary" na gamitin ang lokasyon mo?',
              'Allow "Bitinary" to use your location?',
            )}
            message={t(
              "Para makita ang kainan at pasyalan na malapit sa iyo.",
              "To find food and places near you.",
            )}
            stacked
            actions={[
              {
                label: t("Payagan Habang Ginagamit", "Allow While Using App"),
                bold: true,
                onClick: () => (
                  setSysAlert(false),
                  setC((x) => ({
                    ...x,
                    location: true,
                    locationPermission: "while",
                  }))
                ),
              },
              {
                label: t("Huwag Payagan", "Don't Allow"),
                onClick: () => (
                  setSysAlert(false),
                  setC((x) => ({
                    ...x,
                    location: false,
                    locationPermission: "deny",
                  }))
                ),
              },
            ]}
          />
        </>
      )
      break
  }

  return (
    <ThemeScreen
      title={def[lang]}
      intro={lang === "en" ? def.introEn : def.introTl}
      pose={id === "privacy" ? "pointing" : "idea"}
      tag={def.optional ? "optional" : undefined}
      embedded={embedded}
      onBack={onBack}
      onSkip={skip}
      onSave={save}
      saveDisabled={!canSave}
      saveLabel={t("Tapos na", "Done")}
      banner={
        id === "trip" ? (
          <JimbotTip>
            {t(
              "Alam mo ba? Kapag sinabi mo ang huling biyahe mo, mas sariwa ang mga suhestiyon ko.",
              "Did you know? Telling me your last trip keeps my tips fresh.",
            )}
          </JimbotTip>
        ) : id === "privacy" ? (
          <JimbotTip pose="pointing">
            {t(
              "Puwede mong baguhin ang lahat ng ito anumang oras sa Account › Mga Preference.",
              "You can change all of this anytime in Account › Preferences.",
            )}
          </JimbotTip>
        ) : undefined
      }
    >
      {body}
    </ThemeScreen>
  )
}

function PermRow({
  icon,
  title,
  body,
  checked,
  onChange,
}: {
  icon: ReactNode
  title: string
  body: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] bg-surface p-3.5 shadow-card dark:bg-elevated/50",
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-sunken text-link dark:bg-elevated">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold leading-tight">
          {title}
        </span>
        <span className="text-[13px] leading-snug text-fg-2">{body}</span>
      </span>
      <Toggle label={title} checked={checked} onChange={onChange} />
    </div>
  )
}

/** Downscale an image file to a JPEG data URL. */
export function shrink(file: File, max = 900): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const cv = document.createElement("canvas")
      cv.width = Math.round(img.width * k)
      cv.height = Math.round(img.height * k)
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height)
      resolve(cv.toDataURL("image/jpeg", 0.78))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}
