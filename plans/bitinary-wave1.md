# Bitinary — Wave 1 Plan (Design System + Traveler Prototype)

## Goal
Build "Bitinary", a mobile-first, responsive PWA prototype in the existing React 19 + Vite 8 + Tailwind v4 scaffold. Wave 1 delivers the full design system, the Jimbot mascot set, every **traveler** screen, the clickable prototype flow, Light/Dark/System theming, and a **Screen Index** gallery for reviewing screens in both modes side by side. All data is fictional, scripted Tagalog/Taglish sample data with no backend. The business side (section 7) is **Wave 2** and gets its own plan.

Success criteria
- Clickable flow works end to end: Onboarding > Home > Reels row > Reels Viewer > Shop Detail > Jimbot > Itinerary > Moments (Camera) > Capture > Mapa > Floating gallery.
- Every screen renders correctly in Light and Dark at 390 / 768 / 1280 px.
- Screen Index shows every screen and state in both modes, with MVP / Phase 2 / Phase 3 tags.
- WCAG AA contrast for text, 44px touch targets, safe-area insets respected.

## Jimbot reference (received)
Attachment `4587e1f6-824e-4191-b8bd-e651a387f41f`. Step 1: run `figma attachments get 4587e1f6-824e-4191-b8bd-e651a387f41f --dest src/assets/jimbot-reference.png` and use the returned path.

What the reference looks like: a flat two-tone mark with a vivid orange (~#F2620A) field and cream (~#FDEFD3) line art and fills. The fox body is the *same orange as the background* and is defined only by cream outlines.
- **Head:** wide, rounded-diamond cheeks. A large cream face mask covers the cheeks and muzzle, with orange running down the center of the brow to the nose.
- **Ears:** tall pointed ears with cream outlines and cream inner triangles, poking out above the hat.
- **Salakot:** a wide conical hat with a cream outline and woven lattice lines (concentric bands crossed by radial spokes), a small knob on top, and the brim curving down past the cheeks.
- **Eyes:** large round dark-orange (~#C2410C) circles with one white highlight dot each, set inside the cream mask.
- **Nose and mouth:** rounded dark-orange nose with a small cream oval highlight. Small "w" smile in dark orange.
- **Body:** cream chest bib. Two backpack straps with square buckles, and arms as cream outlined shapes.
- **Flag and bedroll:** a rolled bedroll/spiral on the right shoulder, holding a flagpole with a ball finial. The Philippine flag is outlined in cream, with the sun and three stars in the hoist triangle.

Implementation of the reference:
- Hand-redraw it as an inline SVG on a 256×256 viewBox, with stroke-based cream line art (`stroke-linecap/linejoin: round`). Colors map to tokens: orange #FF6A00, cream #FFF1E3, eye/nose #C84A00, eye highlight #FFFFFF.
- **The raster reference is not shipped as UI art.** It is used only as the tracing reference and as the source for the PWA app icons (it is already a square orange field). Export `public/icons/icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` (fox scaled to the 80% safe zone) from it with a small Node/`sharp` one-off script, or a canvas export if `sharp` is unavailable.
- Because the fox body equals the orange field, the SVG has **two presentation variants**:
  - `variant="badge"` (default for app icon, chat avatar, tab icon, onboarding hero, toasts): the fox sits on an orange circle or rounded square, exactly like the reference. It reads the same in Light and Dark.
  - `variant="standalone"` (empty states, loaders, and poses that need a full silhouette): the fox silhouette is filled orange #FF6A00 with cream inner lines, and gets a 3px #C84A00 outer contour so it separates from cream (light) and dark-brown (dark) backgrounds. The colors are identical in both modes.
  - On the orange Home header, always use `badge` with a cream ring (`ring-2 ring-[#FFF1E3]`) so it doesn't dissolve into the header.
- **Tab-bar icon:** a simplified 24px line-art fox head (ears, hat brim, mask outline, nose dot) at 1.75px stroke, in the same family as lucide. When active it is filled: an orange head with cream mask, inside the orange capsule using dark-brown strokes for contrast.

## Tech decisions
- **Routing:** `react-router` v7 (data-less `BrowserRouter`), for deep links and back navigation. Load the `make/react-router` skill before implementing.
- **Motion:** `motion` (framer-motion) for sheet slide-up, drag-to-snap bottom sheets, tap scale 0.97, polaroid developing, reel swipe, fox wave. Load `make/motion-context` first. Honor `prefers-reduced-motion`.
- **Icons:** `lucide-react` at `strokeWidth={1.75}`, size 24, wrapped in one `<Icon name active />` component. Active = filled (`fill="currentColor"` where the shape supports it). Custom SVGs in the same style for: polaroid camera, fox (tab icon), verified shield (filled variant), salakot. One registry: `src/components/icons/Icon.tsx`.
- **Fonts:** Google Fonts CSS2 `@import` in `src/index.css`: Poppins 500/600/700, Open Sans 400/600, Caveat 500 (handwritten polaroid captions). Mapped to Tailwind `--font-display`, `--font-body`, `--font-hand`.
- **Charts:** hand-built SVG (donut, bars, progress ring, sparkline). No chart library in Wave 1.
- **Photography:** load the `make/unsplash` skill and pick Philippines-relevant food and places (Intramuros, lechon, halo-halo, beaches, kapihan) for listings, banners, reels posters, and Moments samples. Store URLs in data files.
- **Reels video:** short royalty-free vertical MP4 sample URLs (muted, looping, `playsInline`) with poster images. Fall back to the poster when Data saver is on or the video fails.
- **Camera:** `getUserMedia` (`facingMode` user/environment) with a canvas capture. Falls back to a sample photo when permission is denied or unavailable, and shows the permission-state screen.
- **Map:** custom illustrated SVG map of the Intramuros/Manila area (streets, Pasig river, landmarks). Cream palette in Light, dark-brown in Dark. Pan, pinch-zoom and two-finger rotate through a small transform hook (pointer events). Pins and clusters are computed from zoom level, and the visible bounds filter the gallery.
- **PWA:** `public/manifest.webmanifest` (name, theme `#FF6A00`, background `#FFF1E3`, Jimbot icons 192/512/maskable as PNGs exported from the SVG) plus a small hand-written `public/sw.js` (cache-first app shell, registered in `main.tsx` in production only). The install banner uses `beforeinstallprompt`, and on iOS it shows "Share > Add to Home Screen" instructions. It is dismissible and remembered in localStorage.
- **No backend.** Per-device state (saved items, itinerary edits, Moments, theme, data saver, onboarding done) lives in localStorage through a small `usePersistentState` hook. Captured photos are stored as compressed data URLs (limit ~20).

## Design tokens (`src/index.css`)
CSS variables on `:root` (light) and `[data-theme="dark"]`, exposed with Tailwind v4 `@theme inline` as semantic utilities (`bg-bg`, `bg-surface`, `bg-elevated`, `text-fg`, `text-fg-2`, `text-link`, `bg-primary`, `text-on-primary`, `border-line`, `bg-ok-bg text-ok`, and so on).

| Token | Light | Dark |
|---|---|---|
| primary | #FF6A00 | #FF7A1A |
| on-primary (small text) | #2B130A | #2B130A |
| link / deep | #C84A00 | #FF9A4D |
| fg (headings/body) | #3A1A0E | #FFF1E3 |
| fg-2 (secondary) | #6B3A22 text, #B08A74 icons/borders | #D7B8A3 |
| bg | #FFF1E3 | #1A0D07 |
| surface (cards/sheets) | #FFFFFF | #2A150C |
| elevated | #FFFFFF + shadow | #3A1D10 |
| brown-strong / brown-mid | #3A1A0E / #6B3A22 | #3A1D10 / #6B3A22 |
| accent amber | #FFB400 | #FFB400 |
| ok / ok-bg | #1B8A3A / #E3F5E8 | #6FD38A / #12331C |
| danger / danger-bg | #D32F2F / #FDE8E8 | #FF8A80 / #3A1414 |
| caution / caution-bg | #B26A00 / #FFF0D6 | #FFC266 / #3A2608 |
| glass | rgba(255,255,255,.72) + blur 20 | rgba(42,21,12,.72) + blur 20 |

Notes
- Tan #B08A74 fails AA for body text on white, so it is used only for icons, borders and ≥18px text. Secondary body text uses #6B3A22.
- On orange: dark brown #2B130A text by default. White text only at ≥18px bold (large titles and banner headlines).
- Effects: `--shadow-card` (soft, light only), `--radius-card: 20px`, `--radius-sheet: 28px`. Dark mode uses elevation by color with no shadows.
- Type scale utilities: `text-title` 32/38 Poppins 600, `text-h2` 22/28 Poppins 600, `text-body` 16/24 Open Sans 400, `text-caption` 13/18 Open Sans. Buttons are Poppins 500.
- Global element defaults go inside `@layer base`.

Theme: `ThemeProvider` sets `data-theme` on `<html>` from `light | dark | system` (localStorage + `matchMedia`). A `?theme=` query param overrides it, for the Screen Index iframes. It also updates `<meta name="theme-color">`.

## File structure
```
src/
  main.tsx, App.tsx (router + providers), index.css (tokens, fonts)
  theme/ThemeProvider.tsx
  lib/ usePersistentState.ts, useOnline.ts, useInstallPrompt.ts, usePanZoom.ts, cn.ts, format.ts (₱, "Na-verify, 12 araw")
  data/ places.ts, promos.ts, reels.ts, itineraries.ts, chat.ts, moments.ts, searches.ts, mapAreas.ts
  components/
    mascot/Jimbot.tsx            (expression: waving|thinking|idea|unsure|celebrating|pointing|sleeping|camera; size; animated)
    mascot/JimbotLoader.tsx      (animated thinking/wave loader)
    icons/Icon.tsx
    ui/ Button, IconButton, Chip, StatusPill (verified|closing|caution|sponsored|new|bago), SegmentedControl,
        Toggle, Input/SearchField, GroupedList (iOS inset), BottomSheet (snap points), Toast, Skeleton,
        ProgressRing, Donut, Bars, LargeTitle
    layout/ AppShell (tab bar | rail | sidebar by breakpoint), GlassTabBar, NavRail, Sidebar, DetailPanel, InstallBanner, OfflineBanner
    cards/ CategoryTile, PromoBanner(+Carousel), ListingCard, SponsoredCard, ReelCard, ItineraryCard, PolaroidCard, ChatBubble, JimbotReplyCard
    map/ IllustratedMap, MapPin, MapCluster, UserDot
    states/ EmptyState, OfflineState, ErrorState, PermissionState (all use Jimbot)
  screens/
    Onboarding, HomeV1, HomeFull, ReelsViewer, Jimbot (+BudgetMakerSheet), Itinerary, Search, ShopDetail,
    moments/ MomentsCamera, CaptureResult, MomentsMap, FloatingGallery, CreateMoment
    Account, ScreenIndex
```

## Navigation & responsive shell
- Routes: `/onboarding`, `/` (Home full, default), `/home-v1`, `/reels/:id`, `/jimbot`, `/itinerary/:id`, `/search`, `/shop/:id`, `/moments` (camera), `/moments/map`, `/moments/create`, `/account`, `/screens`.
- First launch redirects to `/onboarding` until it is completed. Onboarding has 3 swipeable panels: waving fox "Kumusta! Ako si Jimbot", the itinerary/budget value prop, and Moments/privacy. Last panel: "Simulan" button, plus a "Biyahero" or "Negosyo" choice (Negosyo shows a "Darating sa susunod" note in Wave 1).
- **<768px:** glass tab bar fixed at the bottom with `env(safe-area-inset-bottom)`, in the order Home | Jimbot (fox) | Search | Moments (polaroid) | Account. The active tab sits in an orange capsule with a filled icon and a dark-brown label. Hidden on Reels Viewer and Camera.
- **768–1279px:** left glass navigation rail (72px, icons + labels). Card rows become 2–3 column grids.
- **≥1280px:** 240px left sidebar (logo, nav, install card). Content max 1040px. Right 380px `DetailPanel` shows the selected listing or itinerary: on desktop, clicking a ListingCard or ItineraryCard opens it in the panel instead of navigating. Jimbot opens as a right side panel from a sidebar button, as well as at its own route. Moments gallery becomes a 360px docked floating panel with a collapse button.
- Reels Viewer and Moments Camera are full-bleed on all sizes. On desktop the reel is centered at 9:16 with its actions beside it.

## Screens (Wave 1)
Phase tags appear in the Screen Index and as small corner badges in an optional "Design notes" overlay (toggle in Screen Index).

1. **Onboarding** [MVP]: described above. The fox waves on load.
2. **Home v1** [MVP]: orange header (location pill "Malapit sa iyo · Intramuros", bell, heart), white search bar overlapping the header bottom edge, 2×4 category grid (Kainan, Pasyalan, Budget Meals, Kapihan, Street Food, Resorts, Tours, Pasalubong, with distinct saturated tile colors and white or brown icons), "Pagkain at Pasyalan Malapit Sa Iyo" listing cards (photo, name, ₱–₱₱₱, distance, Verified "Na-verify, 12 araw", Closing soon, heart), "Iminumungkahing Biyahe" itinerary cards (fox avatar, "1 araw sa ₱1,500", 4 stops, estimated total, "Tingnan").
3. **Home full** [P2/P3 sections tagged]: v1 + promo carousel (orange/brown banners, scroll-snap, pagination dots, e.g. "Libreng kape sa ₱300 pataas" by fictional "Kapihan ni Aling Rosa") + "Mga Reels" row (first card larger with BAGO tag, the rest 140×250, muted looping preview, play icon, logo chip, "12.4K", Verified check, bottom scrim, "Tingnan lahat") + Sponsored cards placed between sections. The install banner and offline banner appear at the top of the content when relevant.
4. **Reels Viewer** [P3]: always-dark background. Vertical scroll-snap or drag between reels, one at a time. Top: glass back, "Reels", mute toggle, CC subtitle toggle. Right stack: Heart, Comment, Save, Share, "Idagdag sa itinerary" (pin). Bottom-left: logo, name, "Sundan" pill, 2-line caption with hashtags (expandable), Verified pill, price, distance. Progress bar. Floating glass card "Bisitahin ang shop" (place, hours, "Tingnan ang detalye" > Shop Detail). Sponsored tag on paid reels. Comments bottom sheet, iOS-style share sheet (`navigator.share` when available, else a custom sheet). States: skeleton, buffering spinner (Jimbot loader), offline (sleeping fox), empty. Data saver (from Account) disables autoplay and shows a tap-to-play poster.
5. **Jimbot** [MVP]: iOS Messages layout with large title "Jimbot" and a fox header. Quick chips: Gumawa ng itinerary, Kainan malapit sa akin sa budget ko, Budget maker, Humingi ng suhestiyon, Tulong / Support. Deep-orange (#C84A00) user bubbles with white 16px text (passes AA). Jimbot replies are surface cards with the fox avatar. Scripted sample conversation: "May ₱1,500 ako para sa isang araw sa Intramuros…" > thinking fox loader (~1.5s) > itinerary card (4 stops, cost per stop, Verified badges, total ₱1,380, "I-save" > celebrating toast, "Baguhin" > Itinerary). The "Budget maker" chip opens a bottom sheet with planned vs estimated per category (Pagkain, Transport, Aktibidad, Iba pa), bars and a donut. "Humingi ng suhestiyon" for an unknown place returns an unsure fox: "Hindi ako sigurado — wala pa akong verified na impormasyon tungkol diyan" plus an alternative verified suggestion. Free-text input matches keywords to scripted replies, with the unsure reply as the fallback (never invents places).
6. **Itinerary View** [MVP]: sticky budget header (total ₱1,500, spent, remaining, progress ring). Vertical timeline rows: time tile, stop name, status pill, cost + "TANTYA" caption, drag handle (`motion` Reorder), edit (inline sheet for time/cost), save, share. "Available offline" indicator (cached in localStorage).
7. **Search** [MVP]: large field with Cancel, filter chips (Kategorya, Lugar, Presyo, Bukas ngayon, each opening a small sheet), recent and trending searches, live-filtered result cards, and an empty state ("Wala akong nahanap…" with the unsure fox).
8. **Shop Detail** [MVP]: hero photo with glass back/heart/share, name, hours, ₱ range, Verified pill with date, tabs Info | Menu | Mga Reels, menu highlights with ₱ prices, map preview (illustrated map snippet with a pin), sticky primary "Idagdag sa itinerary", "Mag-ulat ng mali" link > report sheet.
9. **Moments** [P3]
   - **Camera (default):** live viewfinder inside a polaroid frame overlay (white border, thick bottom). Glass segmented control Camera | Mapa at the top. Controls: round shutter with an orange ring, flip, flash (torch where supported, else a screen-flash effect), last-photo thumbnail > floating gallery. First-time tip card with the camera fox: "Kunan mo ang unang Moment mo!"
   - **After capture:** the photo slides out of a camera slot, then develops over 2s (blur/sepia/opacity to full color), landing tilted at a random 2–4°. Caption field in Caveat (date, place, note), location chip "Malapit sa Intramuros", toggle "Idagdag sa mapa", privacy note "Pribado — ikaw lang ang nakakakita". Save > celebrating fox.
   - **Map:** full-screen illustrated map, pulsing orange user dot (general area only), orange photo pins with count badges and zoom-based clusters, selected pin larger with a brown ring. Floating glass controls: search, my-location, filter chips (Lahat, Pagkain, Pasyalan, Mga Moment), segmented control.
   - **Floating gallery:** glass bottom sheet with grabber and 3 snap points (peek: "Intramuros, 24 larawan"; half: horizontal row of tilted polaroids; full: masonry grid). The map stays interactive at peek and half. Panning updates the gallery to the visible area. Contents: "Gumawa ng Moment" button, chips Lahat / Akin / Mga Trip, polaroid cards. Tablet/desktop: docked 360px floating panel with collapse.
   - **Create Moment:** select photos (own captures + samples), frame picker (Classic white, Cream, Orange, Brown, Film-strip), caption/date/place, preview with tilt and stack, Save > celebrating fox. "I-share" is opt-in.
   - **States:** camera permission, location permission (explains general-area use only), empty map (sleeping fox), offline, skeleton polaroids.
10. **Account** [MVP]: profile header with fox badge. iOS grouped inset lists: Profile, Naka-save, Mga Trip, Budget preferences, Wika (Tagalog), Itsura (Light/Dark/System, working), Data saver (working), Notifications, Privacy, Tulong, Mag-log out (resets onboarding).

Global trust rules applied in components: every ListingCard, ReelCard and ShopDetail requires `verifiedDaysAgo` and renders the Verified pill. SponsoredCard and sponsored reels always render the "Sponsored" tag. Missing data renders "Wala pang impormasyon", never a guess.

## Jimbot mascot component
API: `<Jimbot expression="waving|thinking|idea|unsure|celebrating|pointing|sleeping|camera" variant="badge|standalone" crop="full|head" size={number} animate />`.

- **Base layers** (shared, from the reference): ears, salakot with weave, head + cream mask, chest bib, backpack straps + buckles, bedroll, and the PH flag on its pole.
- **Per-expression layers:**
  - *Waving:* the default reference face, with the left paw raised and waving.
  - *Thinking:* eyes glance up-right, paw under the chin, three animated dots.
  - *Idea:* wide eyes with bigger highlights, open smile, amber #FFB400 lightbulb above the hat.
  - *Unsure:* head tilted 8°, eyebrows angled, flat wavy mouth, cream "?" bubble. Used for "Hindi ako sigurado".
  - *Celebrating:* closed happy "^ ^" eyes, open mouth, both paws up, the flag waving, amber and cream confetti.
  - *Pointing:* paw extended to the right with the eyes following. Prop: a small map pin.
  - *Sleeping:* closed curved eyes, hat tipped down over one eye, "Zzz" in cream. Used for offline and empty states.
  - *Camera:* both paws holding a small cream-outlined instant camera with an orange lens, one eye winking. Used for Moments tips.
- **Head crop** (`crop="head"`) is the chat avatar and notification/toast avatar: ears, hat and face inside a 40px circle badge.
- **Motion** (`motion`, off under reduced motion):
  - Waving: the arm rotates ±18° for 3 cycles on mount, and on every app load (Onboarding, Home greeting).
  - Thinking: the head bobs and the dots stagger. This doubles as the `JimbotLoader`.
  - Celebrating: a spring bounce plus a confetti burst.
  - Sleeping: a slow breathing scale and drifting Zzz.
  - Idea: the bulb flickers on.
- **Uses:** app icon (PNG from the reference), onboarding hero (waving, standalone, large), chat avatar (head badge), Jimbot tab icon, loaders (thinking), and all empty/offline/error/permission states (sleeping, unsure, camera, pointing). The look is consistent in both modes.
- **Fidelity check:** in the component sheet, place the `waving`/`badge` render next to the reference PNG and compare proportions: ear height, hat brim width (~70% of the canvas), eye size, mask shape. Iterate until it reads as the same character.

## Screen Index (`/screens`)
Grid of screen entries. Each one renders two 390×844 iframes (`?theme=light` / `?theme=dark`, plus `&state=offline|empty|loading|permission|peek|half|full` where applicable) with the title and phase tag. Size switcher 390 / 768 / 1280 (iframes scale down to fit). It also includes a component sheet (`/screens/components`) showing every component variant in both modes: tab bar, header, tiles, banners, cards, pills, bubbles, fox expressions, sheet snaps, segmented control, polaroid frames, pins/clusters, charts, toggles, buttons, inputs, and states. A `state` query param is read by the relevant screens to force a state for review.

## Prototype flow wiring
Onboarding "Simulan" > Home full > Reels row card > Reels Viewer > "Tingnan ang detalye" > Shop Detail > "Idagdag sa itinerary" (toast with "Tanungin si Jimbot") > Jimbot > itinerary card "Baguhin" > Itinerary > Moments tab (Camera) > Shutter > Capture result > Save > segmented "Mapa" > tap pin > Floating gallery (peek > half > full).

## Accessibility & quality
- AA contrast checked for all token pairings (especially text on orange, tan, and the dark-mode status colors).
- 44px minimum hit areas, visible focus rings (orange 2px), `aria-label`s on icon buttons, `aria-current` on tabs, sheets as `role="dialog"` with focus return.
- Body text ≥16px, `lang="tl"` on `<html>`.
- Reduced motion: disable the developing animation and the wave loop, and use instant sheet transitions.

## Edge cases
- Camera denied or no device: permission state, then sample photo capture.
- `navigator.share` unavailable: custom share sheet. Video load failure: poster + retry.
- Offline (`useOnline`, also forceable via `?state=offline`): banner on Home, offline states on Reels/Map, and Itinerary still shows its offline-available badge.
- localStorage full when saving photos: toast "Puno na ang storage" and keep the newest 20.
- Unknown chat input: unsure fox reply.

## Verification
- `pnpm build` (tsc via Vite) passes after the major steps. No dev-server starts (already running).
- Manually walk the prototype flow at 390, 768 and 1280 in Light and Dark through the Screen Index.
- Check camera fallback by denying permission, and check Data saver disables reel autoplay.
- Run a Lighthouse-style PWA sanity check (manifest valid, service worker registers in the production preview).

## Implementation order
1. Inspect the fox upload. Add dependencies (`react-router`, `motion`, `lucide-react`). Tokens, fonts, ThemeProvider.
2. Jimbot SVG + expressions, Icon registry, UI primitives, BottomSheet, AppShell (tab bar/rail/sidebar).
3. Sample data + Unsplash imagery. Home v1/full, Search, Shop Detail.
4. Jimbot chat + Budget maker, Itinerary.
5. Reels Viewer.
6. Moments: camera, capture, illustrated map + pan/zoom, floating gallery, Create Moment, states.
7. Account, Onboarding, PWA manifest/SW/install banner, offline handling.
8. Screen Index + component sheet. Build check and responsive/dark pass.

## Out of scope (Wave 2)
All Business (User 2) screens: Statistika (Overview/Analytics/Backgrounds), business Jimbot, Blog & Reel creator, Account roles/branches, and helper features 1–11. Wave 1 keeps tokens and components generic so Wave 2 reuses them (sidebar in brown, chart cards).
