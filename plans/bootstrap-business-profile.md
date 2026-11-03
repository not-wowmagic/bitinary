# Bootstrap business profile, Facebook-style and easy to find

## Context (what exists today)
- The traveler business profile already exists at `/shop/:id`. It has a cover, logo, actions, the tabs **Mga Post · Reviews · Menu · Larawan · About**, post cards with like/comment/share, a comments sheet, a review form, a photo lightbox and owner replies (Make version 5).
- **Why the user can't find it:** on desktop (≥1280px), tapping a place opens a **400px side panel** (`useOpen().place` → `?panel=shop:id`), so the full Facebook-style page never appears. On phones and tablets it opens full screen.
- The app is styled with Tailwind v4. Bootstrap is not installed. Hundreds of Tailwind class names collide with Bootstrap's (`mt-3`, `p-4`, `gap-2`, `bg-primary`, `text-white`, `border`, `card`…). Bootstrap's utilities use `!important` and a different spacing scale, so a plain `bootstrap.css` import would break the design.

## Goal
1. **Use Bootstrap** (Bootstrap 5.3 + React-Bootstrap) for the business-profile feature, with **no visible change** to the existing design. Every other feature stays exactly as it is, and Tailwind remains for layout everywhere.
2. Make the profile **feel like a Facebook business page** on desktop (two columns: Intro + Photos on the left, the feed on the right). Mobile and tablet keep today's layout.
3. Make it **easy to find**:
   - A "Mga Negosyo" section on Home and a directory page.
   - "Tingnan ang buong profile" in the desktop side panel.
   - Business cards that open the full profile.

Decisions taken as defaults, since the user skipped the questions:
- Bootstrap is used for the **business profile** only, not the whole app.
- Tailwind is kept.
- No feature is removed.

## Success criteria
- Bootstrap and React-Bootstrap are installed and used by the profile screens: Nav/Tab, Offcanvas, Modal, Dropdown, Carousel, Form controls, ToggleButtonGroup, ProgressBar, Placeholder, OverlayTrigger/Tooltip.
- **Everything outside the profile is unchanged.** Before/after screenshots of Home, Search, Jimbot, Moments, `/biz/stats` and `/bitinarydev` at 390px and 1280px are pixel-identical apart from the new Home section, which is placed below "Malapit sa iyo".
- **The profile looks the same on a phone (390px)** as today: same colors, fonts, radii and spacing. The sheets keep the rounded-top bottom-sheet look, with a drag handle and swipe-down to close.
- **Desktop (≥1024px) `/shop/:id` uses the Facebook-style layout:**
  - a wide cover (max 1100px) with the logo overlapping it;
  - name, rating and badges beside the logo, with actions on the right;
  - an underline tab bar;
  - two columns: left **Intro** and **Mga Larawan** cards, right a "Write a review" composer box plus the posts feed.
- Reviews, comments, likes, owner replies and the `/biz` link keep working exactly as now, with the same data hooks (`useBusinessFeed`).
- Light and Dark, Tagalog copy, keyboard and screen-reader access all work. Esc closes overlays, and focus returns to the trigger.

## 1. Add Bootstrap without touching the design
- **Dependencies:** `bootstrap@^5.3.3` and `react-bootstrap@^2.10`, plus dev dependency `sass@^1.77` (Vite compiles SCSS natively).
- **New `src/styles/bootstrap.scss`** compiles only what the profile needs.
  - Includes: functions, variables, variables-dark, maps, mixins, root, transitions, `close`, `nav`, `dropdown`, `modal`, `offcanvas`, `carousel`, `forms`, `button-group` (for ToggleButtonGroup), `progress`, `placeholders`, `tooltip`.
  - Excludes **reboot**, **utilities API**, **grid**, **containers**, **buttons**, **card**, **badge**, **helpers** and **type**, so no global element styles and no colliding utility classes.
  - Wrapped as `@layer bootstrap { … }` (via a Sass `@use` + `meta.load-css` inside the layer).
  - Sass variables are mapped to Bitinary values:
    - `$primary: #ff6a00`
    - `$font-family-sans-serif` → Open Sans
    - `$headings-font-family` → Poppins
    - `$border-radius: 1.25rem`
    - `$modal-border-radius` and `$offcanvas` radius: 28px
    - `$enable-shadows: false`
    - `$prefix: bs-`
- **`src/index.css`:**
  - Declare the layer order first: `@layer bootstrap, theme, base, components, utilities;`. Tailwind utilities always win over Bootstrap component styles, so Tailwind classes on React-Bootstrap elements set the look.
  - Import `./styles/bootstrap.scss` before Tailwind.
  - Add `@source not inline("collapse");` so Tailwind doesn't emit its `.collapse { visibility: collapse }` utility, which would clash with Bootstrap's `.collapse` (the word appears in the source text).
  - Map Bootstrap CSS variables to Bitinary tokens in `@layer base`, so Light/Dark and the `/bitinarydev` theme editor drive Bootstrap too:
    - `--bs-body-bg: var(--c-surface)`, `--bs-body-color: var(--c-fg)`
    - `--bs-border-color: var(--c-line)`, `--bs-secondary-color: var(--c-fg-2)`
    - `--bs-primary` / `--bs-primary-rgb` from `--c-primary`
    - `--bs-link-color: var(--c-link)`
    - `--bs-font-sans-serif: var(--font-body)`
    - `--bs-modal-bg` / `--bs-offcanvas-bg: var(--c-surface)`
    - `--bs-dropdown-bg: var(--c-surface)`, `--bs-dropdown-link-active-bg: var(--c-primary)`
    - `--bs-tooltip-bg: var(--c-brown)`
    - `--bs-progress-bar-bg: var(--c-amber)`
    - `--bs-backdrop-bg: #2b130a`, `--bs-backdrop-opacity: .45`
  - Dark mode keys off the existing `[data-theme='dark']`. No `data-bs-theme` is needed, because the variables point at our tokens.
- **Guard:** a quick grep/test confirms no Bootstrap class is used outside `src/components/profile/**`, `src/screens/ShopDetail.tsx` and the new business directory files.

## 2. Shared Bootstrap wrappers (`src/components/profile/bs.tsx`)
- **`ProfileSheet({ open, onClose, title, footer, children })`:**
  - Below `md`: React-Bootstrap **Offcanvas** `placement="bottom"`, styled like today's Sheet: max-h 92dvh, rounded top 28px, drag handle, and swipe down >80px or a fast flick to close (pointer handler on the header).
  - `md`+: React-Bootstrap **Modal** `centered`, max-width 480px, rounded 28px.
  - Both use the header title in `font-display`, a close button with aria-label "Isara", a body scroll lock, Esc to close and a focus trap (Bootstrap built-in).
  - It replaces the profile's use of `@/components/ui/Sheet` only. Other screens keep `Sheet`.
- **`ConfirmModal`:** a Bootstrap **Modal** `size="sm" centered`, styled as today's iOS alert (rounded 18px, stacked buttons, a destructive one in red). It replaces `IOSAlert` in the profile and review flows.
- **`PhotoViewer`:** **Modal** fullscreen-on-mobile with a React-Bootstrap **Carousel** (`interval={null}`, `touch`, indicators, prev/next with Tagalog aria-labels "Nakaraan" / "Susunod", keyboard arrows). It replaces `Lightbox`.

## 3. Profile screens rebuilt on Bootstrap (same look on mobile)
Files: `src/screens/ShopDetail.tsx`, `src/components/profile/{PostCard,Reviews,Bits}.tsx`. The data layer is untouched (`useBusinessFeed`, `useVerificationOf`, console flags, banners).

- **Tabs:** React-Bootstrap **Tab.Container** + **Nav** with `activeKey` from `?tab=` (or `?ptab=` in the panel) and **Tab.Content/Tab.Pane**.
  - Mobile style: the current segmented pill look (Tailwind classes on `Nav.Link`).
  - Desktop: an underline variant like Facebook (2px primary bar under the active tab).
  - Arrow-key navigation comes from Bootstrap's `role="tablist"`.
- **"⋯" menu:** a React-Bootstrap **Dropdown** (`align="end"`) with *I-share ang profile* and *Mag-ulat ng mali*, replacing the More sheet.
- **Comments:** `ProfileSheet` containing the comment list and a composer built from **Form** + **InputGroup** + **Form.Control** (`as="textarea"`, auto-grow, 500 characters, counter after 400) and a send button. The read-only notice when comments are off, and the guest sign-in button, are kept.
- **Review form:** `ProfileSheet` with:
  - stars as a **ToggleButtonGroup** `type="radio"` (5 star buttons, 48px, labels as today);
  - **Form.Control** textarea with `isInvalid` and `Form.Control.Feedback`;
  - photo picker (same);
  - **Form.Check** `type="switch"` for "Bumisita ako";
  - check-in code in a **Form.Control**.
  - Discarding unsaved changes asks through `ConfirmModal`.
- **Reviews tab:**
  - Star distribution uses **ProgressBar** (amber, 8px, rounded).
  - Filter chips use a **ToggleButtonGroup** `type="radio"` styled as the current chips.
  - Deleting asks through `ConfirmModal`.
- **Post cards:** layout unchanged. The "Sponsored" tag gets an **OverlayTrigger/Tooltip** ("Bayad na promo ng negosyo"), and so does "Rehistradong negosyo" ("May DTI at business permit na sinuri ng Bitinary").
- **Loading (`?state=loading`):** Bootstrap **Placeholder** (`animation="glow"`) blocks shaped like today's skeletons.
- **Report and "Rehistradong negosyo" info:** `ProfileSheet`.

## 4. Facebook-style desktop layout (≥1024px, full page only)
- **Header:**
  - Cover 340px high, full width up to 1100px, rounded bottom 24px.
  - 140px logo with a 4px ring overlapping the cover bottom-left.
  - To the right of the logo: name (`text-[32px]`), then "★ 4.5 · 236 review · Kainan · Ermita", then badges.
  - Far right: **Mag-review** (primary), **Sa itinerary**, **I-share**, **⋯**.
  - A divider, then the **underline tab bar**.
- **Posts tab body:** a grid `lg:grid-cols-[360px_1fr]` with gap 24px.
  - **Left (sticky top 88px):**
    - **Intro** card: description, category, area/address, hours with open status, contact, price, tags, "Rehistradong negosyo".
    - **Mga Larawan** card: 3×3 thumbnails, with "Tingnan lahat" switching to the Photos tab.
    - **Menu highlights** card: top 3 items.
  - **Right:**
    - A Facebook-like **composer box**: avatar plus a pill "Ano ang masasabi mo tungkol sa {name}?" that opens the review form. For guests it opens the sign-in prompt.
    - Then the posts feed. Cards are max 680px.
- **Reviews / Menu / Larawan / About tabs:** single centered column, max 820px, as today.
- **Phones and tablets:** exactly today's layout.
- **Side panel (desktop):** keeps the compact version and adds a full-width **"Tingnan ang buong profile"** button under the action row. It navigates to `/shop/:id` (full page) and closes the panel.

## 5. Finding business profiles
- **Home section "Mga Negosyo sa Bitinary"** (in `HomeFull` and `HomeV1`, after "Pagkain at Pasyalan Malapit Sa Iyo"):
  - Horizontal scroll of **BusinessCard**: cover image, overlapping logo, name, "★ rating · n review", "Rehistrado" chip when verified, and **Tingnan ang profile**.
  - It lists visible places, linked/featured first.
  - Cards always open the **full** `/shop/:id` page (`navigate`, not the panel).
  - "Lahat" goes to `/negosyo`.
- **New page `/negosyo` "Mga Negosyo"** (inside the AppShell, lazy):
  - Search field and category chips (reuse categories).
  - Grid of BusinessCards: 1 column on mobile, 2 on md, 3 on xl.
  - Hidden places (console) are excluded.
  - Empty state with Jimbot.
- **Search:** result rows keep the current behavior. A secondary link per row, "Profile", opens the full page.
- **Screen Index:** add entries for `/negosyo`, `/shop/mangben` at 1280 (Facebook layout), and the panel "Tingnan ang buong profile".

## Files
- **New:**
  - `src/styles/bootstrap.scss`
  - `src/components/profile/bs.tsx` (ProfileSheet, ConfirmModal, PhotoViewer)
  - `src/components/profile/Intro.tsx` (Intro, Photos and Menu highlight cards)
  - `src/components/cards/BusinessCard.tsx`
  - `src/screens/Businesses.tsx`
- **Changed:**
  - `package.json`, `src/index.css`
  - `src/screens/ShopDetail.tsx`
  - `src/components/profile/{PostCard,Reviews}.tsx`
  - `src/screens/Home.tsx` (new section)
  - `src/screens/Search.tsx` (profile link)
  - `src/app/routes.tsx` (`/negosyo`)
  - `src/screens/ScreenIndex.tsx`
- **Unchanged:** every other screen and the shared `Sheet` / `IOSAlert` (still used elsewhere).

## Edge cases
- **The theme editor in `/bitinarydev`** recolors Bootstrap parts too, through the mapped variables.
- **Modal/Offcanvas inside the desktop side panel** (`embedded`) portal to `body`, layered above the panel (z-index 1055 vs panel 40).
- **Swipe-to-close** only starts from the header or handle, so scrolling a long comment list doesn't close the sheet.
- **Reduced motion:** Bootstrap transitions are disabled (`$enable-transitions` honors `prefers-reduced-motion`), and so is the Carousel slide.
- **SSR/hydration** is not relevant (SPA).
- **Bundle size:** only the selected SCSS partials (~25–35 KB CSS gzip ~6 KB). React-Bootstrap is tree-shaken per component and lazy-loaded with the profile route chunk.

## Verification
- Run `node_modules/.bin/tsc --noEmit -p .` and `node_modules/.bin/vite build --outDir /tmp/x`.
- **Visual parity:** take before/after screenshots (vite preview + headless chromium) at 390 and 1280 of Home, Search, Jimbot, Moments map, `/biz/stats` and `/bitinarydev`, and diff them with PIL.
  - Expect no differences except the new Home section.
  - For `/shop/p2` at 390, expect only sub-pixel differences.
- **Functional headless flows:**
  - Open comments (`?comments=p1`) → Offcanvas shows; Esc closes.
  - Review form → validation shows Bootstrap feedback.
  - Photos → Carousel next/prev.
  - The ⋯ Dropdown opens.
  - At 1280, `/shop/mangben` shows the Intro card and the composer box.
  - The side panel shows "Tingnan ang buong profile".
  - `/negosyo` lists every visible business.
- Grep check that no Bootstrap utility classes exist in the built CSS (no `.mt-3{…!important}`).
