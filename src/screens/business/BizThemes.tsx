import {
  CalendarDays,
  FileUp,
  Globe,
  ImagePlus,
  Music2,
  Paperclip,
  Store,
  TriangleAlert,
  X,
} from "lucide-react"
import { useMemo, useRef, useState, type ReactNode } from "react"
import { Facebook, Instagram } from "@/components/icons/Brand"
import {
  useOptionalAccount,
  type BizThemeId,
  type BusinessProfile,
} from "@/app/account"
import { useLang } from "@/app/i18n"
import { useStore } from "@/app/store"
import {
  ChoiceChip,
  SelectCard,
  TextField,
  inputBase,
} from "@/components/flow/Fields"
import { IOSAlert } from "@/components/flow/IOSAlert"
import { Jimbot } from "@/components/mascot/Jimbot"
import {
  HoursPicker,
  MapPinDropper,
  MenuRows,
  PHLocationPicker,
  UseMyLocationButton,
} from "@/components/onboarding/BizWidgets"
import {
  JimbotTip,
  OfflineSaveBanner,
  PriceChips,
  Question,
} from "@/components/onboarding/Kit"
import { ThemeScreen } from "@/components/onboarding/Templates"
import { Button } from "@/components/ui/Button"
import { places } from "@/data/places"
import { DAYS } from "@/app/account"
import { findPHLocality } from "@/data/philippinesLocations"
import {
  bizTypeOpts,
  goalOpts,
  getBizThemesForType,
  getOfferingConfig,
  langOpts,
  normalizeBizType,
  normalizeMenuCategories,
  priceHint,
} from "@/data/themes"
import { cn } from "@/lib/cn"
import { getForcedState } from "@/lib/forced"
import { isGeoPoint } from "@/lib/geo"
import { useOnline } from "@/lib/useOnline"
import { validPH, formatPH, PhFlag } from "../signup/Signup"
import { shrink } from "../personalize/TravelerThemes"

type Errors = Record<string, string>

function validate(
  id: BizThemeId,
  b: BusinessProfile,
  t: (a: string, b: string) => string,
): Errors {
  const e: Errors = {}
  if (id === "basics") {
    if (b.name.trim().length < 2)
      e.name = t("Ilagay ang pangalan ng negosyo.", "Enter your business name.")
    if (!b.type)
      e.type = t("Pumili ng uri ng negosyo.", "Choose a business type.")
    if (!b.price) e.price = t("Pumili ng price range.", "Choose a price range.")
  }
  if (id === "location") {
    if (b.address.trim().length < 4)
      e.address = t("Ilagay ang street address.", "Enter the street address.")
    if (!findPHLocality(b.city))
      e.city = t(
        "Pumili ng lungsod o munisipalidad.",
        "Choose a city or municipality.",
      )
    if (!isGeoPoint(b.pin))
      e.pin = t("Ilagay ang pin sa mapa.", "Place the pin on the map.")
  }
  if (id === "hours") {
    if (DAYS.every((d) => b.hours[d].closed))
      e.hours = t(
        "Dapat bukas kahit isang araw.",
        "You must be open at least one day.",
      )
    const bad = DAYS.find(
      (d) =>
        !b.hours[d].closed &&
        !b.hours[d].allDay &&
        b.hours[d].open >= b.hours[d].close,
    )
    if (bad)
      e.hours = t(
        "May araw na mas maaga ang sarado kaysa bukas.",
        "One day closes before it opens.",
      )
  }
  if (id === "contact") {
    if (b.contactName.trim().length < 2)
      e.contactName = t(
        "Ilagay ang pangalan ng contact person.",
        "Enter the contact person name.",
      )
    if (!validPH(b.mobile))
      e.mobile = t(
        "Dapat 10 digit at nagsisimula sa 9.",
        "Must be 10 digits starting with 9.",
      )
  }
  if (id === "menu" && !normalizeBizType(b.type))
    e.type = t(
      "Piliin muna ang uri ng negosyo sa Business basics.",
      "Choose a business type in Business basics first.",
    )
  if (id === "menu")
    b.menu.forEach(
      (m) =>
        m.name &&
        !m.price &&
        (e[m.id] = t("Lagyan ng presyo.", "Add a price.")),
    )
  return e
}

export type BizFormCtx = {
  business: BusinessProfile
  setBusiness: (
    b: BusinessProfile | ((b: BusinessProfile) => BusinessProfile),
  ) => void
  showToast: (t: {
    text: string
    expression?: "celebrating" | "pointing" | "sleeping" | "idea"
  }) => void
}

export function BizThemeForm({
  id,
  embedded,
  onDone,
  onBack,
  ctx,
}: {
  id: BizThemeId
  embedded?: boolean
  onDone: (s: "done" | "skipped") => void
  onBack: () => void
  ctx?: BizFormCtx
}) {
  const acc = useOptionalAccount()
  const store = useStore()
  const business = ctx?.business ?? acc?.business
  const setBusiness = ctx?.setBusiness ?? acc?.setBusiness
  if (!business || !setBusiness)
    throw new Error("Business setup requires its data provider.")
  const showToast = ctx?.showToast ?? store.showToast
  const { lang, t } = useLang()
  const online = useOnline()
  const forced = getForcedState()
  const [b, setB] = useState<BusinessProfile>(() => business)
  const def = getBizThemesForType(b.type).find((x) => x.id === id)!
  const [errors, setErrors] = useState<Errors>(() =>
    forced === "error"
      ? validate(
          id,
          {
            ...business,
            name: "",
            type: undefined,
            price: undefined,
            address: "",
            city: "",
            pin: undefined,
            contactName: "",
            mobile: "",
          },
          t,
        )
      : {},
  )
  const [confirmLeave, setConfirmLeave] = useState(forced === "unsaved")
  const [dupDismissed, setDupDismissed] = useState(false)
  const [spec, setSpec] = useState("")
  const coverRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<BusinessProfile>) => {
    setB((x) => ({ ...x, ...patch }))
    setErrors((e) => {
      const n = { ...e }
      Object.keys(patch).forEach((k) => delete n[k])
      return n
    })
  }
  const dirty =
    JSON.stringify(b) !== JSON.stringify(business) || forced === "unsaved"
  const offering = getOfferingConfig(b.type)
  const businessType = normalizeBizType(b.type)

  const duplicate = useMemo(
    () =>
      forced === "duplicate" ||
      (!!b.name.trim() &&
        places.some(
          (p) => p.name.toLowerCase() === b.name.trim().toLowerCase(),
        )),
    [b.name, forced],
  )

  const save = () => {
    const e = validate(id, b, t)
    if (Object.keys(e).length) {
      setErrors(e)
      document
        .getElementById(`q-${Object.keys(e)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    const next = { ...b, status: { ...b.status, [id]: "done" as const } }
    if (id === "menu" && businessType)
      next.menu = normalizeMenuCategories(
        b.menu.filter((m) => m.name.trim()),
        businessType,
      )
    if (id === "verify" && b.verification.method)
      next.verification = { ...b.verification, status: "pending" }
    setBusiness(next)
    if (!online)
      showToast({
        text: t(
          "Naka-save sa device. Isi-sync pagbalik ng internet.",
          "Saved on this device. Will sync when online.",
        ),
        expression: "sleeping",
      })
    onDone("done")
  }
  const skip = () => {
    setBusiness((x) => ({
      ...x,
      status: {
        ...x.status,
        [id]: x.status[id] === "done" ? "done" : "skipped",
      },
    }))
    onDone("skipped")
  }
  const back = () => (dirty ? setConfirmLeave(true) : onBack())

  const dupBanner =
    duplicate && !dupDismissed && (id === "basics" || id === "location") ? (
      <div
        role="alert"
        className="rounded-[20px] border-2 border-caution/40 bg-caution-bg p-4 text-caution"
      >
        <p className="flex items-center gap-2 font-display text-[15px] font-semibold">
          <TriangleAlert size={18} />{" "}
          {t(
            "May katulad na negosyo sa lokasyong ito",
            "A similar business exists here",
          )}
        </p>
        <div className="mt-2 flex items-center gap-3 rounded-[14px] bg-surface p-2.5 text-fg dark:bg-elevated">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-bg">
            <Store size={20} />
          </span>
          <span className="min-w-0 flex-1 text-[14px]">
            <b className="block font-display">{b.name}</b>
            <span className="text-fg-2">
              {b.address || t("Lokasyon ng negosyo", "Business location")}
            </span>
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="brown"
            onClick={() =>
              showToast({
                text: t(
                  "Ipinadala ang claim request. Tatawagan ka ng team.",
                  "Claim request sent. The team will call you.",
                ),
                expression: "pointing",
              })
            }
          >
            {t("Akin ito, i-claim", "It's mine, claim it")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDupDismissed(true)}
          >
            {t("Iba ito, magpatuloy", "It's different, continue")}
          </Button>
        </div>
      </div>
    ) : null

  let body: ReactNode = null
  switch (id) {
    case "basics":
      body = (
        <>
          <Question
            id="q-name"
            n={1}
            title={t("Pangalan ng negosyo", "Business name")}
            tag="required"
            error={errors.name}
          >
            <input
              value={b.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder={t("hal. pangalan ng negosyo", "e.g. business name")}
              aria-label={t("Pangalan ng negosyo", "Business name")}
              className={cn(
                inputBase,
                errors.name ? "border-danger" : "border-line",
              )}
            />
          </Question>
          <Question
            id="q-type"
            n={2}
            title={t("Uri ng negosyo", "Type of business")}
            tag="required"
            error={errors.type}
          >
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {bizTypeOpts.map((o) => (
                <ChoiceChip
                  key={o.id}
                  multi={false}
                  selected={businessType === o.id}
                  onClick={() =>
                    set({
                      type: o.id,
                      menu: normalizeMenuCategories(b.menu, o.id),
                    })
                  }
                >
                  {o[lang]}
                </ChoiceChip>
              ))}
            </div>
          </Question>
          <Question
            id="q-price"
            n={3}
            title={t("Price range", "Price range")}
            tag="required"
            error={errors.price}
          >
            <PriceChips
              value={b.price}
              onChange={(v) => set({ price: v })}
              hints={Object.fromEntries(
                Object.entries(priceHint).map(([k, v]) => [
                  k,
                  v[lang === "en" ? 1 : 0],
                ]),
              )}
            />
          </Question>
        </>
      )
      break
    case "location":
      body = (
        <>
          <UseMyLocationButton
            onChange={(location) =>
              set({
                ...(location.address ? { address: location.address } : {}),
                ...(location.city ? { city: location.city } : {}),
                pin: location.pin,
              })
            }
          />
          <Question
            id="q-address"
            n={1}
            title={t("Street address", "Street address")}
            tag="required"
            error={errors.address}
          >
            <input
              value={b.address}
              onChange={(e) => set({ address: e.target.value })}
              autoComplete="street-address"
              placeholder={t(
                "hal. 123 pangunahing kalye",
                "e.g. 123 Main Street",
              )}
              aria-label={t("Street address", "Street address")}
              className={cn(
                inputBase,
                errors.address ? "border-danger" : "border-line",
              )}
            />
          </Question>
          <Question
            id="q-city"
            n={2}
            title={t("Lungsod o probinsya", "City or province")}
            tag="required"
            error={errors.city}
          >
            <PHLocationPicker
              value={b.city}
              onChange={(city) => set({ city, pin: undefined })}
              error={!!errors.city}
            />
          </Question>
          <Question
            id="q-pin"
            n={3}
            title={t("I-pin sa mapa", "Pin it on the map")}
            tag="required"
            hint={t(
              "I-drag ang pin sa mismong pintuan ng negosyo.",
              "Drag the pin to your exact entrance.",
            )}
            error={errors.pin}
          >
            <MapPinDropper
              value={b.pin}
              onChange={(pin) => set({ pin })}
              error={!!errors.pin}
              location={b.city}
            />
          </Question>
        </>
      )
      break
    case "hours":
      body = (
        <Question
          id="q-hours"
          n={1}
          title={t("Oras ng bukas, bawat araw", "Opening hours, day by day")}
          tag="required"
          error={errors.hours}
        >
          <HoursPicker value={b.hours} onChange={(hours) => set({ hours })} />
        </Question>
      )
      break
    case "contact":
      body = (
        <>
          <Question
            id="q-contactName"
            n={1}
            title={t("May-ari o contact person", "Owner or contact person")}
            tag="required"
            error={errors.contactName}
          >
            <input
              value={b.contactName}
              onChange={(e) => set({ contactName: e.target.value })}
              autoComplete="name"
              placeholder="Nena Santos"
              aria-label={t("Pangalan", "Name")}
              className={cn(
                inputBase,
                errors.contactName ? "border-danger" : "border-line",
              )}
            />
          </Question>
          <Question
            id="q-mobile"
            n={2}
            title={t("Mobile number", "Mobile number")}
            tag="required"
            error={errors.mobile}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 font-display text-[16px] font-medium">
                <PhFlag /> +63
              </span>
              <input
                value={formatPH(b.mobile)}
                onChange={(e) =>
                  set({
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                type="tel"
                inputMode="numeric"
                placeholder="917 123 4567"
                aria-label="Mobile"
                className={cn(
                  inputBase,
                  "pl-[92px]",
                  errors.mobile ? "border-danger" : "border-line",
                )}
              />
            </div>
          </Question>
          <Question n={3} title={t("Landline", "Landline")} tag="optional">
            <input
              value={b.landline}
              onChange={(e) => set({ landline: e.target.value })}
              type="tel"
              placeholder="(02) 8123 4567"
              aria-label="Landline"
              className={cn(inputBase, "border-line")}
            />
          </Question>
        </>
      )
      break
    case "menu":
      body = businessType ? (
        <div className="space-y-3">
          <p className="rounded-[14px] bg-primary/10 px-4 py-3 text-[14px] font-medium text-fg">
            {t(
              `Batay sa uri ng negosyo: ${bizTypeOpts.find((option) => option.id === businessType)?.tl ?? businessType}.`,
              `Based on business type: ${bizTypeOpts.find((option) => option.id === businessType)?.en ?? businessType}.`,
            )}
          </p>
          <Question
            n={1}
            title={offering.sectionTitle[lang]}
            hint={t(offering.sectionHint.tl, offering.sectionHint.en)}
          >
            <MenuRows
              items={
                b.menu.length
                  ? normalizeMenuCategories(b.menu, businessType)
                  : [
                      {
                        id: "m0",
                        name: "",
                        price: "",
                        category: offering.categories[0],
                      },
                    ]
              }
              onChange={(menu) => set({ menu })}
              categories={offering.categories}
              placeholder={offering.itemPlaceholder[lang]}
              addButtonLabel={offering.addButtonLabel[lang]}
              priceLabel={offering.priceLabel[lang]}
              errors={errors}
            />
          </Question>
        </div>
      ) : (
        <p
          role="alert"
          className="rounded-[16px] border border-caution/40 bg-caution-bg p-4 text-[15px] text-caution"
        >
          {t(
            "Piliin muna ang uri ng negosyo sa Business basics para maipakita ang tamang menu at presyo.",
            "Choose a business type in Business basics first to show the matching menu and prices.",
          )}
        </p>
      )
      break
    case "photos":
      body = (
        <>
          <Question n={1} title={t("Cover photo", "Cover photo")}>
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-line bg-sunken dark:bg-elevated"
            >
              {b.cover ? (
                <img
                  src={b.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-fg-2">
                  <Jimbot
                    expression="camera"
                    variant="standalone"
                    size={96}
                    animate={false}
                  />
                  <span className="font-display text-[14px] font-medium text-link">
                    {t("Pumili ng cover photo", "Choose a cover photo")}
                  </span>
                </span>
              )}
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) =>
                e.target.files?.[0] &&
                set({ cover: await shrink(e.target.files[0], 1200) })
              }
            />
          </Question>
          <Question
            n={2}
            title={t("Hanggang 6 na larawan", "Up to 6 photos")}
            hint={t(
              "Kung lalaktawan, gagamit kami ng default na larawan ni Jimbot.",
              "If you skip, we'll use a default Jimbot image.",
            )}
          >
            <div className="grid grid-cols-3 gap-2">
              {b.photos.map((p, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-[14px]"
                >
                  <img src={p} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() =>
                      set({ photos: b.photos.filter((_, j) => j !== i) })
                    }
                    aria-label={t("Tanggalin", "Remove")}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              {b.photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-line text-link"
                >
                  <ImagePlus size={22} />
                  <span className="text-[12px] font-semibold">
                    {b.photos.length}/6
                  </span>
                </button>
              )}
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(
                  0,
                  6 - b.photos.length,
                )
                const urls = await Promise.all(files.map((f) => shrink(f, 900)))
                set({ photos: [...b.photos, ...urls].slice(0, 6) })
              }}
            />
          </Question>
        </>
      )
      break
    case "about":
      body = (
        <>
          <Question
            n={1}
            title={t("Maikling paglalarawan", "Short description")}
          >
            <textarea
              value={b.about}
              maxLength={150}
              rows={3}
              onChange={(e) => set({ about: e.target.value })}
              placeholder={t(
                "hal. maikling paglalarawan ng negosyo",
                "e.g. short business description",
              )}
              aria-label={t("Paglalarawan", "Description")}
              className={cn(inputBase, "h-auto resize-none border-line py-3")}
            />
            <p
              className={cn(
                "mt-1 text-right text-[13px]",
                b.about.length >= 140
                  ? "font-semibold text-caution"
                  : "text-fg-2",
              )}
            >
              {b.about.length}/150
            </p>
          </Question>
          <Question n={2} title={t("Mga specialty", "Specialties")}>
            <div className="flex gap-2">
              <input
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  spec.trim() &&
                  (set({ specialties: [...b.specialties, spec.trim()] }),
                  setSpec(""))
                }
                placeholder={t("hal. Barako coffee", "e.g. Barako coffee")}
                aria-label={t("Specialty", "Specialty")}
                className={cn(inputBase, "border-line")}
              />
              <Button
                size="lg"
                variant="secondary"
                disabled={!spec.trim()}
                onClick={() => (
                  set({ specialties: [...b.specialties, spec.trim()] }),
                  setSpec("")
                )}
              >
                {t("Idagdag", "Add")}
              </Button>
            </div>
            {b.specialties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {b.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-9 items-center gap-1 rounded-full bg-primary/15 pl-3 pr-1 font-display text-[14px] font-medium"
                  >
                    {s}
                    <button
                      onClick={() =>
                        set({
                          specialties: b.specialties.filter((x) => x !== s),
                        })
                      }
                      aria-label={t("Tanggalin", "Remove")}
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Question>
          <Question
            n={3}
            title={t("Mga wikang sinasalita", "Languages spoken")}
          >
            <div className="flex flex-wrap gap-2">
              {langOpts.map((l) => (
                <ChoiceChip
                  key={l}
                  selected={b.languages.includes(l)}
                  onClick={() =>
                    set({
                      languages: b.languages.includes(l)
                        ? b.languages.filter((x) => x !== l)
                        : [...b.languages, l],
                    })
                  }
                >
                  {l}
                </ChoiceChip>
              ))}
            </div>
          </Question>
        </>
      )
      break
    case "online":
      body = (
        <Question
          n={1}
          title={t("Mga link", "Links")}
          hint={t(
            "I-type o i-paste ang link. Lahat ay opsyonal.",
            "Type or paste links. All optional.",
          )}
        >
          <div className="space-y-3">
            {([
              ["facebook", "Facebook", Facebook, "facebook.com/kapihan"],
              ["instagram", "Instagram", Instagram, "@kapihan"],
              ["tiktok", "TikTok", Music2, "@kapihan"],
              ["website", "Website", Globe, "kapihan.ph"],
            ] as const).map(([k, l, I, ph]) => (
              <TextField
                key={k}
                label={l}
                value={b.links[k]}
                placeholder={ph}
                onChange={(e) =>
                  set({ links: { ...b.links, [k]: e.target.value } })
                }
                prefix={<I size={18} className="text-link" />}
                prefixWidth={46}
              />
            ))}
          </div>
        </Question>
      )
      break
    case "goals":
      body = (
        <Question
          n={1}
          title={t("Pumili ng mga layunin", "Choose your goals")}
          hint={t(
            "Gagamitin ni Jimbot ito para sa mga mungkahi.",
            "Jimbot uses these for growth tips.",
          )}
        >
          <div className="space-y-2.5">
            {goalOpts.map((o) => (
              <SelectCard
                key={o.id}
                multi
                selected={b.goals.includes(o.id)}
                onClick={() =>
                  set({
                    goals: b.goals.includes(o.id)
                      ? b.goals.filter((x) => x !== o.id)
                      : [...b.goals, o.id],
                  })
                }
                icon={
                  <span className="font-display text-[18px] font-bold">
                    {goalOpts.indexOf(o) + 1}
                  </span>
                }
                title={o[lang]}
              />
            ))}
          </div>
        </Question>
      )
      break
    case "verify": {
      const v = b.verification
      const setV = (patch: Partial<BusinessProfile["verification"]>) =>
        set({ verification: { ...v, ...patch } })
      body = (
        <>
          <Question
            n={1}
            title={t("Paano ka magve-verify?", "How will you verify?")}
          >
            <div className="space-y-2.5">
              <SelectCard
                selected={v.method === "upload"}
                onClick={() => setV({ method: "upload" })}
                icon={<FileUp size={24} />}
                title={t("Mag-upload ng permit", "Upload a permit")}
                body={t(
                  "DTI o SEC, at Mayor’s permit",
                  "DTI or SEC, and Mayor's permit",
                )}
              />
              <SelectCard
                selected={v.method === "onsite"}
                onClick={() => setV({ method: "onsite" })}
                icon={<CalendarDays size={24} />}
                title={t(
                  "Mag-iskedyul ng on-site check",
                  "Schedule an on-site check",
                )}
                body={t("Bibisita ang team, libre", "The team visits, free")}
              />
            </div>
          </Question>
          {v.method === "upload" && (
            <Question n={2} title={t("Mga dokumento", "Documents")}>
              <div className="space-y-2">
                {[
                  t("DTI o SEC registration", "DTI or SEC registration"),
                  t("Mayor's permit", "Mayor's permit"),
                ].map((doc, i) => {
                  const f = v.files[i]
                  return (
                    <label
                      key={doc}
                      className="flex cursor-pointer items-center gap-3 rounded-[18px] border border-line bg-surface p-3 dark:bg-elevated/50"
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-[14px]",
                          f
                            ? "bg-ok-bg text-ok"
                            : "bg-sunken text-link dark:bg-elevated",
                        )}
                      >
                        <Paperclip size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15px] font-semibold">
                          {doc}
                        </span>
                        <span className="block truncate text-[13px] text-fg-2">
                          {f ??
                            t(
                              "PDF o larawan, hanggang 10 MB",
                              "PDF or photo, up to 10 MB",
                            )}
                        </span>
                      </span>
                      <span className="font-display text-[14px] font-medium text-link">
                        {f ? t("Palitan", "Replace") : t("Pumili", "Choose")}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          setV({
                            files: Object.assign([...v.files], {
                              [i]: e.target.files[0].name,
                            }),
                          })
                        }
                      />
                    </label>
                  )
                })}
              </div>
            </Question>
          )}
          {v.method === "onsite" && (
            <Question n={2} title={t("Pumili ng petsa", "Pick a date")}>
              <input
                type="date"
                value={v.onsiteDate ?? ""}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setV({ onsiteDate: e.target.value })}
                aria-label={t("Petsa", "Date")}
                className={cn(inputBase, "border-line")}
              />
            </Question>
          )}
          <JimbotTip>
            {t(
              "Habang sinusuri, live ka pa rin. Pagka-approve, makukuha mo ang Verified badge, deals, boosts at reservations.",
              "While we review, you stay live. Once approved you unlock the Verified badge, deals, boosts and reservations.",
            )}
          </JimbotTip>
        </>
      )
      break
    }
  }

  return (
    <>
      <ThemeScreen
        title={def[lang]}
        intro={lang === "en" ? def.introEn : def.introTl}
        pose={
          id === "location" ? "pointing" : id === "photos" ? "camera" : "idea"
        }
        tag={def.required ? "required" : "optional"}
        embedded={embedded}
        onBack={back}
        onSkip={def.required ? undefined : skip}
        onSave={save}
        saveLabel={
          dirty || !b.status[id] ? t("I-save", "Save") : t("Tapos na", "Done")
        }
        banner={
          (!online || dupBanner) && (
            <div className="space-y-3">
              {!online && <OfflineSaveBanner />}
              {dupBanner}
            </div>
          )
        }
      >
        {body}
        {Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="rounded-[16px] bg-danger-bg px-4 py-3 text-[14px] font-semibold text-danger"
          >
            {t(
              "May ilang kulang sa itaas. Naka-save pa rin ang mga na-type mo.",
              "A few things are missing above. Everything you typed is kept.",
            )}
          </p>
        )}
      </ThemeScreen>
      <IOSAlert
        open={confirmLeave}
        title={t("May hindi pa nase-save", "Unsaved changes")}
        message={t(
          "Gusto mo bang i-save ang mga binago mo bago umalis?",
          "Do you want to save your changes before leaving?",
        )}
        stacked
        actions={[
          {
            label: t("I-save", "Save"),
            bold: true,
            onClick: () => (setConfirmLeave(false), save()),
          },
          {
            label: t("Itapon ang binago", "Discard changes"),
            destructive: true,
            onClick: () => (setConfirmLeave(false), onBack()),
          },
          {
            label: t("Kanselahin", "Cancel"),
            onClick: () => setConfirmLeave(false),
          },
        ]}
      />
    </>
  )
}
