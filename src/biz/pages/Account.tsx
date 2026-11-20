import {
  ArrowLeft,
  Bell,
  Check,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Download,
  Globe,
  HelpCircle,
  ImagePlus,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Phone,
  QrCode,
  Rocket,
  Shield,
  Store,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react"

import { useEffect, useState, type ReactNode } from "react"

import { useNavigate } from "react-router"

import { useTheme, type ThemeMode } from "@/app/theme"

import { GoogleLogo, inputBase, PasswordField } from "@/components/flow/Fields"

import { IOSAlert } from "@/components/flow/IOSAlert"

import { Jimbot } from "@/components/mascot/Jimbot"

import { Button } from "@/components/ui/Button"

import { Segmented } from "@/components/ui/Segmented"

import { Sheet } from "@/components/ui/Sheet"

import { Toggle } from "@/components/ui/Toggle"

import { cn } from "@/lib/cn"

import { isGoogleOnlyAccount } from "@/lib/authFlow"

import { updatePassword } from "@/lib/passwordAuth"

import { supabase } from "@/lib/supabase"

import { formatPH } from "@/screens/signup/Signup"

import { shrink } from "@/screens/personalize/TravelerThemes"

import { longDate } from "../format"

import type { Staff } from "../seed"

import { useBiz, type Channel, type LangPref } from "../store"

import { Avatar, Card, Group, GroupRow, PageHeader, Pill } from "../ui"

import { updateBusiness } from "../db/businesses"

import { resolveBusinessImage, uploadBusinessAsset } from "../db/assets"
import { saveOwnerProfile } from "../db/ownerProfile"

export function SubPage({
  title,
  children,
  phase,
  actions,
}: {
  title: string
  children: ReactNode
  phase?: "MVP" | "P2" | "P3"
  actions?: ReactNode
}) {
  const { t } = useBiz()

  const navigate = useNavigate()

  return (
    <main>
      <div className="px-4 pt-4 md:px-8">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate("/biz/account")}
        >
          Account
        </Button>
      </div>
      <PageHeader
        className="pt-1 md:pt-2"
        title={title}
        phase={phase}
        actions={actions}
      />
      <div className="max-w-[980px] space-y-4 px-4 md:px-8">{children}</div>
      <span className="sr-only">{t("Account", "Account")}</span>
    </main>
  )
}

export function AccountHome() {
  const { d, t, lang, reset, signOut, status, verified } = useBiz()

  const navigate = useNavigate()

  const [out, setOut] = useState(false)

  return (
    <main>
      <PageHeader title="Account" phase="MVP" />
      <div className="max-w-[860px] space-y-6 px-4 md:px-8">
        <section className="flex items-center gap-4 rounded-[24px] bg-brown p-4 text-cream dark:bg-elevated">
          <Avatar name={d.profile.name || "B"} size={64} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] font-semibold leading-tight">
              {d.profile.name}
            </p>
            <p className="text-[15px] text-[#E8CDB9]">
              Owner · {d.business.name}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/biz/account/profile")}
          >
            {t("I-edit", "Edit")}
          </Button>
        </section>
        <Group title={t("Account", "Account")}>
          <GroupRow
            icon={<User size={19} />}
            color="#FF6A00"
            label="Profile"
            sub={t("Pangalan, email, mobile, password", "Name, email, mobile, password")}
            to="/biz/account/profile"
          />
        </Group>
        <Group title={t("Negosyo", "Business")}>
          <GroupRow
            icon={<Store size={19} />}
            color="#E07800"
            label={t("Public profile ng negosyo", "Business page profile")}
            sub={t(
              "Cover, detalye at contact na makikita ng biyahero",
              "Cover, details and contact shown to travelers",
            )}
            to="/biz/account/profile"
          />
          <GroupRow
            icon={<Store size={19} />}
            color="#6B3A22"
            label={t("Impormasyon ng Negosyo", "Backgrounds")}
            sub={t(
              "Basics, lokasyon, oras, menu, permit",
              "Basics, location, hours, menu, permits",
            )}
            to="/biz/stats/backgrounds"
          />
          <GroupRow
            icon={<Users size={19} />}
            color="#0B7F96"
            label={t(
              "Branch, staff at pahintulot",
              "Branches, staff and permissions",
            )}
            value={`${d.staff.length}`}
            to="/biz/account/team"
          />
          <GroupRow
            icon={<QrCode size={19} />}
            color="#3A1A0E"
            label={t("QR Check-in kit", "QR Check-in kit")}
            to="/biz/account/qr"
          />
        </Group>
        <Group title={t("Paglago at bayad", "Growth and billing")}>
          <GroupRow
            icon={<Tag size={19} />}
            color="#C84A00"
            label="Deals"
            value={
              !verified ? (
                <Pill>{t("Naka-lock", "Locked")}</Pill>
              ) : (
                `${d.deals.length}`
              )
            }
            to="/biz/account/deals"
          />
          <GroupRow
            icon={<Rocket size={19} />}
            color="#B26A00"
            label={t("Mga boost", "Boosts")}
            value={
              !verified ? <Pill>{t("Naka-lock", "Locked")}</Pill> : undefined
            }
            to="/biz/account/boost"
          />
          <GroupRow
            icon={<CalendarCheck size={19} />}
            color="#1B8A3A"
            label={t("Reservation at pila", "Reservations and queue")}
            value={
              !verified ? (
                <Pill>{t("Naka-lock", "Locked")}</Pill>
              ) : (
                `${d.requests.filter((r) => r.status === "new").length} ${t("bago", "new")}`
              )
            }
            to="/biz/account/reservations"
          />
          <GroupRow
            icon={<CreditCard size={19} />}
            color="#5B3CC4"
            label={t("Plan at bayad", "Plan and billing")}
            value="Free"
            to="/biz/account/billing"
          />
        </Group>
        <Group title={t("App", "App")}>
          <GroupRow
            icon={<Globe size={19} />}
            color="#0B7F96"
            label={t("Mga Preference", "Preferences")}
            sub={t(
              "Wika, itsura, notification, privacy",
              "Language, appearance, notifications, privacy",
            )}
            value={lang === "en" ? "English" : "Tagalog"}
            to="/biz/account/preferences"
          />
          <GroupRow
            icon={<HelpCircle size={19} />}
            color="#C84A00"
            label={t("Tulong at suporta", "Help and support")}
            to="/biz/account/help"
          />
          <GroupRow
            icon={<LogOut size={19} />}
            color="#D32F2F"
            label={t("Mag-sign out", "Sign out")}
            danger
            onClick={() => setOut(true)}
          />
        </Group>
        <p className="text-center text-[13px] text-fg-2">
          Bitinary Business · {status} ·{" "}
          <button
            className="underline"
            onClick={() => (reset(), navigate("/biz/welcome"))}
          >
            {t("I-reset ang demo", "Reset demo")}
          </button>
        </p>
      </div>
      <IOSAlert
        open={out}
        title={t("Mag-sign out?", "Sign out?")}
        actions={[
          { label: t("Kanselahin", "Cancel"), onClick: () => setOut(false) },

          {
            label: t("Mag-sign out", "Sign out"),

            destructive: true,

            bold: true,

            onClick: async () => {
              const result = await signOut()

              if (!result.error) navigate("/welcome", { replace: true })
            },
          },
        ]}
      />
    </main>
  )
}

export function ProfilePage() {
  const { d, set, t, lang, showToast, retryLoad } = useBiz()

  const [p, setP] = useState(d.profile)

  const [profileSaving, setProfileSaving] = useState(false)

  const [profileError, setProfileError] = useState<string | null>(null)

  const [businessDraft, setBusinessDraft] = useState(() => ({
    name: d.business.name,

    type: d.business.type ?? "",

    price: d.business.price ?? "",

    address: d.business.address,

    city: d.business.city,

    contactName: d.business.contactName,

    mobile: d.business.mobile,

    about: d.business.about,

    specialties: d.business.specialties.join(", "),

    website: d.business.links.website,
  }))

  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [businessSaving, setBusinessSaving] = useState(false)

  const [businessError, setBusinessError] = useState<string | null>(null)

  const [pw, setPw] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")

  const [newPassword, setNewPassword] = useState("")

  const [confirmPassword, setConfirmPassword] = useState("")

  const [requiresCurrentPassword, setRequiresCurrentPassword] = useState(true)

  const [passwordBusy, setPasswordBusy] = useState(false)

  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!pw) return

    let active = true

    void supabase.auth

      .getUser()

      .then(({ data, error }) => {
        if (!active) return

        if (error) {
          setPasswordError(error.message)

          return
        }

        setRequiresCurrentPassword(
          !isGoogleOnlyAccount(data.user?.app_metadata?.providers),
        )
      })

      .catch((error: unknown) => {
        if (active)
          setPasswordError(
            error instanceof Error
              ? error.message
              : "Could not load account security settings.",
          )
      })

    return () => {
      active = false
    }
  }, [pw])

  const closePasswordSheet = () => {
    setPw(false)

    setCurrentPassword("")

    setNewPassword("")

    setConfirmPassword("")

    setPasswordError(null)

    setPasswordSuccess(null)
  }

  useEffect(() => {
    setP(d.profile)
  }, [d.profile])

  useEffect(() => {
    setBusinessDraft({
      name: d.business.name,

      type: d.business.type ?? "",

      price: d.business.price ?? "",

      address: d.business.address,

      city: d.business.city,

      contactName: d.business.contactName,

      mobile: d.business.mobile,

      about: d.business.about,

      specialties: d.business.specialties.join(", "),

      website: d.business.links.website,
    })

    setCoverFile(null)
    setLogoFile(null)

    let active = true
    const resolvePreview = async (
      path: string | undefined,
      setPreview: (value: string | null) => void,
      label: "cover" | "logo",
    ) => {
      if (!path) {
        setPreview(null)
        return
      }
      try {
        setPreview(await resolveBusinessImage(path))
      } catch (error) {
        if (!active) return
        setPreview(null)
        setBusinessError(
          error instanceof Error
            ? error.message
            : t(
                `Hindi ma-preview ang ${label}. Maaari kang pumili ng bago.`,
                `The ${label} could not be previewed. You can choose a new one.`,
              ),
        )
      }
    }

    void resolvePreview(d.business.cover, setCoverPreview, "cover")
    void resolvePreview(d.business.logo, setLogoPreview, "logo")

    return () => {
      active = false
    }
  }, [d.business, t])

  const saveOwnerDetails = async () => {
    setProfileSaving(true)
    setProfileError(null)
    try {
      const result = await saveOwnerProfile({
        name: p.name.trim(),
        nickname: p.nickname.trim(),
        mobile: p.mobile.trim(),
      })
      if (result.error || !result.data)
        throw new Error(result.error ?? "Could not save your profile.")

      set((current) => ({
        ...current,
        profile: { ...current.profile, ...result.data },
      }))
      showToast({
        text: t("Na-save ang profile mo.", "Your profile was saved."),
      })
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : t("Hindi na-save ang profile mo.", "Could not save your profile."),
      )
    } finally {
      setProfileSaving(false)
    }
  }

  const saveBusinessProfile = async () => {
    if (!d.business.id) return

    setBusinessSaving(true)

    setBusinessError(null)

    try {
      let cover = d.business.cover ?? null
      let logo = d.business.logo ?? null

      if (coverFile) {
        const compressed = await shrink(coverFile, 1200)

        const response = await fetch(compressed)

        if (!response.ok)
          throw new Error(
            t(
              "Hindi maihanda ang cover photo.",
              "Could not prepare the cover photo.",
            ),
          )

        cover = await uploadBusinessAsset(
          d.business.id,
          await response.blob(),
          "image",
        )
      }

      if (logoFile) {
        const compressed = await shrink(logoFile, 600)
        const response = await fetch(compressed)
        if (!response.ok)
          throw new Error(
            t("Hindi maihanda ang logo.", "Could not prepare the logo."),
          )
        logo = await uploadBusinessAsset(
          d.business.id,
          await response.blob(),
          "image",
        )
      }

      const result = await updateBusiness(d.business.id, {
        name: businessDraft.name.trim(),

        business_type: businessDraft.type.trim() || null,

        price_range: businessDraft.price.trim() || null,

        address: businessDraft.address.trim(),

        city: businessDraft.city.trim(),

        contact_name: businessDraft.contactName.trim(),

        mobile: businessDraft.mobile.trim(),

        about: businessDraft.about.trim(),

        specialties: businessDraft.specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        logo_url: logo,

        cover_url: cover,

        links: { ...d.business.links, website: businessDraft.website.trim() },
      })

      if (result.error) throw new Error(result.error)

      setCoverFile(null)
      setLogoFile(null)

      retryLoad()

      showToast({
        text: t(
          "Na-update ang profile ng negosyo.",
          "Business profile updated.",
        ),
      })
    } catch (error) {
      setBusinessError(
        error instanceof Error
          ? error.message
          : t("Hindi na-save ang profile.", "Could not save the profile."),
      )
    } finally {
      setBusinessSaving(false)
    }
  }

  useEffect(() => {
    if (!coverPreview?.startsWith("blob:")) return

    return () => URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  useEffect(() => {
    if (!logoPreview?.startsWith("blob:")) return

    return () => URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  return (
    <SubPage title="Profile" phase="MVP">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {([
            ["name", t("Pangalan ng owner", "Owner name")],

            ["nickname", t("Palayaw", "Nickname")],

            ["email", "Email"],

            ["mobile", "Mobile (+63)"],
          ] as const)

            .map(([k, l]) => (
              <label key={k} className="block">
                <span className="mb-1.5 block font-display text-[14px] font-medium">
                  {l}
                </span>
                <input
                  value={k === "mobile" ? formatPH(p.mobile) : p[k]}
                  readOnly={k === "email"}
                  onChange={(e) =>
                    setP({
                      ...p,
                      [k]:
                        k === "mobile"
                          ? e.target.value.replace(/\D/g, "").slice(0, 10)
                          : e.target.value,
                    })
                  }
                  className={cn(
                    inputBase,
                    "border-line",
                    k === "email" && "cursor-not-allowed bg-sunken",
                  )}
                />
              </label>
            ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            disabled={
              profileSaving || JSON.stringify(p) === JSON.stringify(d.profile)
            }
            onClick={() => void saveOwnerDetails()}
          >
            {profileSaving ? t("Sine-save…", "Saving…") : t("I-save", "Save")}
          </Button>
        </div>
        {profileError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {profileError}
          </p>
        )}
      </Card>
      <Card
        title={t("Public profile ng negosyo", "Business page profile")}
        icon={<Store size={20} />}
      >
        {d.business.id ? (
          <div className="space-y-4">
            <p className="text-sm text-fg-2">
              {t(
                "Ang impormasyong ito ang makikita ng mga biyahero sa Shop Details page mo.",
                "This information appears to travelers on your Shop Details page.",
              )}
            </p>
            <label className="block">
              <span className="mb-1.5 block font-display text-sm font-medium">
                {t("Profile picture o logo", "Profile picture or logo")}
              </span>
              <div className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-[24px] bg-sunken ring-1 ring-line dark:bg-elevated">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs text-link">
                    <ImagePlus size={20} />
                    {t("Pumili ng logo", "Choose a logo")}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      setLogoFile(file)
                      setLogoPreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </div>
              <span className="mt-1 block text-xs text-fg-2">
                {t(
                  "Ipinapakita ito sa icon ng negosyo at profile page.",
                  "Shown as your business icon and on the public profile.",
                )}
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-display text-sm font-medium">
                {t("Cover photo", "Cover photo")}
              </span>
              <div className="relative flex aspect-[16/7] cursor-pointer items-center justify-center overflow-hidden rounded-[18px] bg-sunken dark:bg-elevated">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex items-center gap-2 text-sm text-link">
                    <ImagePlus size={18} />{" "}
                    {t("Pumili ng cover photo", "Choose a cover photo")}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                      setCoverFile(file)

                      setCoverPreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </div>
              <span className="mt-1 block text-xs text-fg-2">
                {t(
                  "Ipinapakita ito sa itaas ng Shop Details page.",
                  "Shown at the top of the Shop Details page.",
                )}
              </span>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              {([
                ["name", t("Pangalan ng negosyo", "Business name")],

                ["type", t("Uri o kategorya", "Type or category")],

                ["price", t("Price range", "Price range")],

                ["city", t("Lungsod", "City")],

                ["address", t("Address", "Address")],

                ["contactName", t("Contact person", "Contact person")],

                ["mobile", t("Contact number", "Contact number")],

                ["website", "Website"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block font-display text-sm font-medium">
                    {label}
                  </span>
                  <input
                    value={businessDraft[key]}
                    onChange={(event) =>
                      setBusinessDraft((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className={cn(inputBase, "border-line")}
                  />
                </label>
              ))}
              <label className="block md:col-span-2">
                <span className="mb-1.5 block font-display text-sm font-medium">
                  {t(
                    "Mga specialty (paghiwalayin ng kuwit)",
                    "Specialties (comma-separated)",
                  )}
                </span>
                <input
                  value={businessDraft.specialties}
                  onChange={(event) =>
                    setBusinessDraft((current) => ({
                      ...current,
                      specialties: event.target.value,
                    }))
                  }
                  className={cn(inputBase, "border-line")}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block font-display text-sm font-medium">
                  {t("Tungkol sa negosyo", "About the business")}
                </span>
                <textarea
                  value={businessDraft.about}
                  onChange={(event) =>
                    setBusinessDraft((current) => ({
                      ...current,
                      about: event.target.value,
                    }))
                  }
                  rows={4}
                  className={cn(inputBase, "h-auto min-h-24 border-line py-3")}
                />
              </label>
            </div>
            {businessError && (
              <p role="alert" className="text-sm text-danger">
                {businessError}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                disabled={businessSaving}
                onClick={() => void saveBusinessProfile()}
              >
                {businessSaving
                  ? t("Sine-save…", "Saving…")
                  : t("I-save ang public profile", "Save business profile")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-2">
            {t(
              "Kumpletuhin muna ang setup ng negosyo bago mag-edit ng public profile.",
              "Complete business setup before editing its public profile.",
            )}
          </p>
        )}
      </Card>
      <Group>
        <GroupRow
          icon={<GoogleLogo size={18} />}
          color="#FFFFFF"
          label="Google"
          sub={
            d.profile.google
              ? d.profile.google
              : t("Hindi pa konektado", "Not connected")
          }
          trailing={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                set((x) => ({
                  ...x,
                  profile: {
                    ...x.profile,
                    google: x.profile.google
                      ? undefined
                      : "business@example.com",
                  },
                }))
              }
            >
              {d.profile.google
                ? t("Idiskonekta", "Disconnect")
                : t("Ikonekta", "Connect")}
            </Button>
          }
        />
        <GroupRow
          icon={<KeyRound size={19} />}
          color="#6B3A22"
          label={t("Palitan ang password", "Change password")}
          onClick={() => setPw(true)}
        />
      </Group>
      <Sheet
        open={pw}
        onClose={closePasswordSheet}
        title={t("Palitan ang password", "Change password")}
      >
        <div className="space-y-3">
          {requiresCurrentPassword ? (
            <PasswordField
              label={t("Kasalukuyang password", "Current password")}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          ) : (
            <p className="text-caption text-fg-2">
              {t(
                "Naka-sign in ka gamit ang Google. Magtakda ng password para makapag-sign in ka rin gamit ang email.",
                "You are signed in with Google. Set a password to also sign in with email.",
              )}
            </p>
          )}
          <PasswordField
            label={t("Bagong password", "New password")}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <PasswordField
            label={t("Kumpirmahin ang password", "Confirm password")}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {passwordError && (
            <p role="alert" className="text-caption text-danger">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p role="status" className="text-caption text-fg-2">
              {passwordSuccess}
            </p>
          )}
          <Button
            block
            size="lg"
            disabled={
              passwordBusy ||
              newPassword.length < 8 ||
              newPassword !== confirmPassword ||
              (requiresCurrentPassword && !currentPassword)
            }
            onClick={async () => {
              setPasswordBusy(true)

              setPasswordError(null)

              try {
                const result = await updatePassword(
                  newPassword,
                  requiresCurrentPassword ? currentPassword : undefined,
                )

                if (result.error) {
                  setPasswordError(result.error)

                  return
                }

                setPasswordSuccess(
                  t("Napalitan ang password", "Password changed"),
                )

                setCurrentPassword("")

                setNewPassword("")

                setConfirmPassword("")

                showToast({
                  text: t("Napalitan ang password", "Password changed"),
                })
              } catch (updateError: unknown) {
                setPasswordError(
                  updateError instanceof Error
                    ? updateError.message
                    : "Could not update the password.",
                )
              } finally {
                setPasswordBusy(false)
              }
            }}
          >
            {passwordBusy ? t("Sine-save…", "Saving…") : t("I-save", "Save")}
          </Button>
        </div>
      </Sheet>
    </SubPage>
  )
}

const roleLabel = (r: Staff["role"]) =>
  r === "owner" ? "Owner" : r === "manager" ? "Manager" : "Staff"

export function TeamPage() {
  const { d, set, t, showToast } = useBiz()

  const [invite, setInvite] = useState(false)

  const [role, setRole] = useState<Staff["role"]>("staff")

  const [branchSheet, setBranchSheet] = useState(false)

  const [bn, setBn] = useState({ name: "", area: "" })

  const link = `https://biz.bitinary.ph/join/${d.qrToken.toLowerCase()}-${role}`

  const perms: [string, boolean, boolean, boolean][] = [
    [t("Mabilis na Update", "Quick Update"), true, true, true],

    [t("Posts at sagot", "Posts and replies"), true, true, false],

    [t("Impormasyon ng Negosyo", "Backgrounds"), true, true, false],

    [t("Deals at boosts", "Deals and boosts"), true, true, false],

    [t("Bayad at permit", "Billing and permits"), true, false, false],

    [t("Staff at branch", "Staff and branches"), true, false, false],
  ]

  return (
    <SubPage
      title={t(
        "Branch, staff at pahintulot",
        "Branches, staff and permissions",
      )}
      phase="MVP"
    >
      <Card
        title={t("Mga branch", "Branches")}
        phase="P3"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setBranchSheet(true)}
          >
            {t("Magdagdag", "Add")}
          </Button>
        }
      >
        <ul className="divide-y divide-line">
          {d.branches.map((b) => (
            <li key={b.id} className="flex min-h-14 items-center gap-3">
              <Store size={20} className="text-link" />
              <span className="flex-1">
                <span className="block font-display text-[16px] font-semibold">
                  {b.name}
                </span>
                <span className="text-[14px] text-fg-2">{b.area}</span>
              </span>
              {d.activeBranch === b.id && (
                <Pill tone="orange">{t("Aktibo", "Active")}</Pill>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card
        title="Staff"
        icon={<Users size={20} />}
        action={
          <Button
            size="sm"
            icon={<Link2 size={16} />}
            onClick={() => setInvite(true)}
          >
            {t("Mag-imbita", "Invite")}
          </Button>
        }
      >
        <ul className="divide-y divide-line">
          {d.staff.map((s) => (
            <li
              key={s.id}
              className="flex min-h-16 flex-wrap items-center gap-3 py-2"
            >
              <Avatar name={s.name} />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">
                  {s.name}
                </span>
                <span className="text-[14px] text-fg-2">
                  {s.email} · {d.branches.find((b) => b.id === s.branch)?.name}
                </span>
              </span>
              {s.status === "invited" && (
                <Pill tone="caution">{t("Inimbitahan", "Invited")}</Pill>
              )}
              {s.role === "owner" ? (
                <Pill tone="orange">Owner</Pill>
              ) : (
                <label className="relative">
                  <span className="sr-only">Role</span>
                  <select
                    value={s.role}
                    onChange={(e) =>
                      set((x) => ({
                        ...x,
                        staff: x.staff.map((y) =>
                          y.id === s.id
                            ? { ...y, role: e.target.value as Staff["role"] }
                            : y,
                        ),
                      }))
                    }
                    className="h-11 appearance-none rounded-full border border-line bg-bg pl-4 pr-9 font-display text-[14px] font-medium"
                  >
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  />
                </label>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card
        title={t("Mga pahintulot", "Permissions")}
        icon={<Shield size={20} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-fg-2">
                <th className="py-2 font-medium" />
                {(["owner", "manager", "staff"] as const).map((r) => (
                  <th key={r} className="py-2 text-center font-medium">
                    {roleLabel(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map(([l, a, b, c]) => (
                <tr key={l} className="border-b border-line last:border-0">
                  <td className="py-2.5">{l}</td>
                  {[a, b, c].map((v, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {v ? (
                        <Check
                          size={18}
                          className="mx-auto text-ok"
                          aria-label={t("Oo", "Yes")}
                        />
                      ) : (
                        <span className="text-fg-2">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Sheet
        open={invite}
        onClose={() => setInvite(false)}
        title={t("Mag-imbita sa pamamagitan ng link", "Invite by link")}
      >
        <p className="mb-2 font-display text-[14px] font-medium">Role</p>
        <Segmented<Staff["role"]>
          className="w-full"
          value={role}
          onChange={setRole}
          options={[
            { value: "manager", label: "Manager" },

            { value: "staff", label: "Staff" },
          ]}
        />
        <p className="mt-4 break-all rounded-[14px] bg-sunken p-3 font-mono text-[14px] dark:bg-elevated">
          {link}
        </p>
        <p className="mt-2 text-[14px] text-fg-2">
          {t(
            "Mag-e-expire ang link sa loob ng 7 araw.",
            "The link expires in 7 days.",
          )}
        </p>
        <Button
          block
          size="lg"
          className="mt-4"
          icon={<Link2 size={18} />}
          onClick={() => (
            navigator.clipboard?.writeText(link).catch(() => {}),
            setInvite(false),
            showToast({ text: t("Nakopya ang link", "Link copied") })
          )}
        >
          {t("Kopyahin ang link", "Copy link")}
        </Button>
      </Sheet>
      <Sheet
        open={branchSheet}
        onClose={() => setBranchSheet(false)}
        title={t("Bagong branch", "New branch")}
      >
        <div className="space-y-3">
          <input
            value={bn.name}
            onChange={(e) => setBn({ ...bn, name: e.target.value })}
            placeholder={t("Pangalan ng branch", "Branch name")}
            aria-label={t("Pangalan ng branch", "Branch name")}
            className={cn(inputBase, "border-line")}
          />
          <input
            value={bn.area}
            onChange={(e) => setBn({ ...bn, area: e.target.value })}
            placeholder={t("Lungsod", "City")}
            aria-label={t("Lungsod", "City")}
            className={cn(inputBase, "border-line")}
          />
          <Button
            block
            size="lg"
            disabled={!bn.name.trim()}
            onClick={() => (
              set((x) => ({
                ...x,
                branches: [
                  ...x.branches,
                  {
                    id: `br${Date.now()}`,
                    name: bn.name.trim(),
                    area: bn.area.trim(),
                  },
                ],
              })),
              setBranchSheet(false),
              setBn({ name: "", area: "" })
            )}
          >
            {t("Idagdag", "Add")}
          </Button>
        </div>
      </Sheet>
    </SubPage>
  )
}

export function BillingPage() {
  const { t, lang, showToast } = useBiz()

  const [plan, setPlan] = useState<"free" | "plus">("free")

  const invoices = [
    {
      id: "INV-2026-0012",
      amount: 500,
      what: t("Boost: Reel ng kare-kare", "Boost: kare-kare reel"),
      at: Date.now() - 9 * 864e5,
    },

    {
      id: "INV-2026-0007",
      amount: 300,
      what: t("Boost: Halo-halo post", "Boost: Halo-halo post"),
      at: Date.now() - 32 * 864e5,
    },
  ]

  return (
    <SubPage title={t("Plan at bayad", "Plan and billing")} phase="P2">
      <div className="grid gap-3 md:grid-cols-2">
        {([
          [
            "free",
            "Free",
            "₱0",
            [
              t("Profile, Quick Update, posts", "Profile, Quick Update, posts"),
              t("Basic stats", "Basic stats"),
            ],
          ],

          [
            "plus",
            "Plus",
            "₱499",
            [
              t(
                "Analitika at lingguhang report",
                "Analytics and weekly report",
              ),
              t("Hanggang 3 branch", "Up to 3 branches"),
              t("Priority na suporta", "Priority support"),
            ],
          ],
        ] as const)

          .map(([k, n, p, feats]) => (
            <button
              key={k}
              onClick={() => setPlan(k)}
              aria-pressed={plan === k}
              className={cn(
                "rounded-[20px] border-2 bg-surface p-5 text-left shadow-card",
                plan === k ? "border-primary" : "border-transparent",
              )}
            >
              <p className="font-display text-[20px] font-bold">{n}</p>
              <p className="font-display text-[28px] font-bold">
                {p}
                <span className="text-[15px] font-medium text-fg-2">
                  /{t("buwan", "month")}
                </span>
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-fg-2">
                {feats.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </button>
          ))}
      </div>
      <Card
        title={t("Paraan ng pagbayad", "Payment methods")}
        icon={<CreditCard size={20} />}
      >
        <ul className="divide-y divide-line">
          {[
            ["GCash", "0917 ••• 4500", true],

            ["Maya", t("Hindi pa naka-link", "Not linked"), false],

            ["Visa", "•••• 4242", false],
          ].map(([n, s, def]) => (
            <li key={n as string} className="flex min-h-14 items-center gap-3">
              <span className="flex h-10 w-14 items-center justify-center rounded-[10px] bg-sunken font-display text-[13px] font-bold dark:bg-elevated">
                {n as string}
              </span>
              <span className="flex-1 text-[15px] text-fg-2">
                {s as string}
              </span>
              {def && <Pill tone="ok">Default</Pill>}
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="mt-3"
          onClick={() =>
            showToast({
              text: t("Idagdag ang paraan ng pagbayad", "Add a payment method"),
              expression: "pointing",
            })
          }
        >
          {t("Magdagdag", "Add method")}
        </Button>
      </Card>
      <Card title={t("Mga invoice", "Invoices")}>
        <table className="w-full text-left text-[15px]">
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <td className="py-3">
                  <span className="block font-semibold">{i.what}</span>
                  <span className="text-[13px] text-fg-2">
                    {i.id} · {longDate(i.at, lang)}
                  </span>
                </td>
                <td className="py-3 text-right font-display font-semibold">
                  ₱{i.amount}
                </td>
                <td className="py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t("I-download", "Download")}
                    icon={<Download size={16} />}
                  >
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </SubPage>
  )
}

export function PreferencesPage() {
  const { d, set, t, setLangPref, showToast } = useBiz()

  const { mode, setMode } = useTheme()

  const [del, setDel] = useState(false)

  const notif = d.prefs.notif

  const n = (k: keyof typeof notif, v: boolean) =>
    set((x) => ({
      ...x,
      prefs: { ...x.prefs, notif: { ...x.prefs.notif, [k]: v } },
    }))

  return (
    <SubPage title={t("Mga Preference", "Preferences")} phase="MVP">
      <Card title={t("Wika", "Language")} icon={<Globe size={20} />}>
        <Segmented<LangPref>
          className="w-full"
          label={t("Wika", "Language")}
          value={d.langPref ?? "en"}
          onChange={setLangPref}
          options={[
            { value: "en", label: "English" },

            { value: "tl", label: "Tagalog" },

            { value: "device", label: t("Sundin ang device", "Follow device") },
          ]}
        />
        <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-sunken p-3 dark:bg-elevated">
          <span className="flex-1 text-[15px]">
            {t(
              "Jimbot: sundin ang tina-type ko (Taglish)",
              "Jimbot: match what I type (Taglish)",
            )}
          </span>
          <Toggle
            label="Jimbot"
            checked={d.prefs.jimbotMatch}
            onChange={(v) =>
              set((x) => ({ ...x, prefs: { ...x.prefs, jimbotMatch: v } }))
            }
          />
        </div>
      </Card>
      <Card title={t("Itsura", "Appearance")} icon={<Moon size={20} />}>
        <Segmented<ThemeMode>
          className="w-full"
          label={t("Itsura", "Appearance")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "light", label: "Light" },

            { value: "dark", label: "Dark" },

            { value: "system", label: "System" },
          ]}
        />
      </Card>
      <Card title="Notifications" icon={<Bell size={20} />}>
        <ul className="divide-y divide-line">
          {([
            ["reviews", t("Bagong review", "New reviews")],

            ["comments", t("Bagong komento", "New comments")],

            ["reports", t("Update sa report", "Report updates")],

            ["weekly", t("Lingguhang report", "Weekly report")],

            ["deals", t("Deal at redemption", "Deals and redemptions")],
          ] as const)

            .map(([k, l]) => (
              <li
                key={k}
                className="flex min-h-14 items-center justify-between gap-3"
              >
                <span className="text-[16px]">{l}</span>
                <Toggle
                  label={l}
                  checked={notif[k]}
                  onChange={(v) => n(k, v)}
                />
              </li>
            ))}
        </ul>
        <p className="mb-2 mt-4 font-display text-[14px] font-medium">
          {t("Saan ipapadala ang report", "Report delivery channel")}
        </p>
        <Segmented<Channel>
          className="w-full"
          value={d.prefs.channel}
          onChange={(c) =>
            set((x) => ({ ...x, prefs: { ...x.prefs, channel: c } }))
          }
          options={[
            { value: "notif", label: "Notification" },

            { value: "messenger", label: "Messenger" },

            { value: "sms", label: "SMS" },
          ]}
        />
      </Card>
      <Card
        title={t("Data at privacy", "Data and privacy")}
        icon={<Shield size={20} />}
      >
        <p className="text-[15px] text-fg-2">
          {t(
            "Sumusunod kami sa Data Privacy Act of 2012 (RA 10173).",
            "We follow the Data Privacy Act of 2012 (RA 10173).",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<Download size={17} />}
            onClick={() =>
              showToast({
                text: t(
                  "Ipapadala namin sa email mo ang kopya.",
                  "We'll email you a copy.",
                ),
                expression: "pointing",
              })
            }
          >
            {t("I-download ang data ko", "Download my data")}
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={17} />}
            onClick={() => setDel(true)}
          >
            {t("Burahin ang account", "Delete account")}
          </Button>
        </div>
      </Card>
      <IOSAlert
        open={del}
        title={t("Burahin ang account?", "Delete your account?")}
        message={t(
          "Matatanggal ang negosyo mo sa Bitinary pagkatapos ng 30 araw. Puwede mo pang kanselahin sa panahong iyon.",
          "Your business will be removed from Bitinary after 30 days. You can cancel during that time.",
        )}
        actions={[
          { label: t("Kanselahin", "Cancel"), onClick: () => setDel(false) },

          {
            label: t("Burahin", "Delete"),
            destructive: true,
            bold: true,
            onClick: () => (
              setDel(false),
              showToast({
                text: t(
                  "Naka-iskedyul ang pagbura sa loob ng 30 araw.",
                  "Deletion scheduled in 30 days.",
                ),
                expression: "sleeping",
              })
            ),
          },
        ]}
      />
    </SubPage>
  )
}

export function HelpPage() {
  const { t, showToast } = useBiz()

  const [open, setOpen] = useState<number | null>(0)

  const faqs: [string, string][] = [
    [
      t("Gaano katagal ang verification?", "How long does verification take?"),
      t(
        "Karaniwang 1–2 araw ng trabaho pagkatapos ma-upload ang permit.",
        "Usually 1–2 business days after you upload your permit.",
      ),
    ],

    [
      t(
        "Puwede bang tanggalin ang negatibong review?",
        "Can I remove a negative review?",
      ),
      t(
        "Hindi tinatanggal ang negatibong review dahil lang negatibo ito. I-report lang kung lumalabag sa guidelines.",
        "Negative reviews are not removed just because they are negative. Report only if it breaks the guidelines.",
      ),
    ],

    [
      t("Paano gumagana ang Mga Dumating?", "How does Customers sent work?"),
      t(
        "Binibilang namin ang bawat deal na na-redeem sa QR o code sa counter mo.",
        "We count every deal redeemed with a QR or code at your counter.",
      ),
    ],

    [
      t("Libre ba ang Bitinary Business?", "Is Bitinary Business free?"),
      t(
        "Oo. Ang Plus at boosts ay opsyonal.",
        "Yes. Plus and boosts are optional.",
      ),
    ],
  ]

  return (
    <SubPage title={t("Tulong at suporta", "Help and support")} phase="MVP">
      <Card className="flex flex-wrap items-center gap-4 bg-primary">
        <Jimbot
          expression="waving"
          variant="standalone"
          size={90}
          className="-my-3"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[20px] font-bold text-white">
            {t(
              "Tulungan kami ng Bitinary team",
              "Get help from the Bitinary team",
            )}
          </p>
          <p className="text-[15px] font-semibold text-ink">
            {t(
              "Lunes hanggang Sabado, 8 AM–6 PM",
              "Monday to Saturday, 8 AM–6 PM",
            )}
          </p>
        </div>
        <Button
          variant="brown"
          onClick={() =>
            showToast({
              text: t(
                "Salamat! Makikipag-ugnayan ang team sa loob ng 1 oras.",
                "Thanks! The team will reach out within 1 hour.",
              ),
            })
          }
        >
          {t("Humingi ng tulong", "Request help")}
        </Button>
      </Card>
      <Group>
        <GroupRow
          icon={<Phone size={19} />}
          color="#1B8A3A"
          label={t("Tumawag", "Call")}
          value="(02) 8888 2468"
          onClick={() => (location.href = "tel:0288882468")}
        />
        <GroupRow
          icon={<MessageCircle size={19} />}
          color="#0B7F96"
          label="Messenger"
          value="m.me/bitinarybiz"
        />
        <GroupRow
          icon={<Mail size={19} />}
          color="#C84A00"
          label="Email"
          value="biz@bitinary.ph"
          onClick={() => (location.href = "mailto:biz@bitinary.ph")}
        />
      </Group>
      <Card title="FAQs">
        <ul className="divide-y divide-line">
          {faqs.map(([q, a], i) => (
            <li key={q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
              >
                <span className="flex-1 font-display text-[16px] font-medium">
                  {q}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "shrink-0 text-link transition-transform",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && <p className="pb-3 text-[15px] text-fg-2">{a}</p>}
            </li>
          ))}
        </ul>
      </Card>
    </SubPage>
  )
}
