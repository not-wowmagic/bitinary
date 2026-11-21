# Motion guidelines — subtle, smooth and native-feeling (optional)

> **For Cursor:** Please add smooth animation **where it is feasible and genuinely useful**, but **do not change the approved layout**. First inspect the host app's design system and current motion utilities. Ask about unresolved animation expectations during the required user interview in `CURSOR_START_HERE.md`. If animation would require risky refactoring, compromise performance, conflict with established motion rules or reduce accessibility, keep the interaction static and explain why.

## Motion principles

- Animate **state changes and spatial relationships**, not decoration. The itinerary should still make sense with all animation removed.
- Respect the existing system's motion tokens and platform conventions first. For web, use small CSS transitions or the project's existing animation utilities; do **not** add a dependency purely to animate this reference.
- Prefer **opacity** and **transform** to avoid layout shifts. Avoid animating expensive filters, large blur regions, heavy shadows, full-page backgrounds or layout dimensions during chat streaming.
- No auto-playing background motion, constant floating icons, unnecessary bounce, random stagger, or scroll-jacking. No heavy parallax, animated gradient loops or distracting entrance sequences.
- Content is usable **immediately**; do not gate data, keyboard focus, save operations or error messages behind timing.
- Limit duration and easing variation. Native-feeling means deliberate and quiet, not highly elastic or theatrical.

## Suggested interactions (illustrative values, not global overrides)

| Interaction | Recommended treatment | Typical duration | Why it helps |
| --- | --- | --- | --- |
| Overview / Day / Map selection | A short easing of the selected-pill fill or position; panel content cross-fades **only if it doesn't disrupt focus or scroll** | 140–200 ms | Reinforces which view is active |
| Place-row press or selection | Very subtle pressed-state tint or scale (e.g. scale <= 0.99), with immediate tap response | 100–150 ms | Makes cells feel tappable |
| Place details sheet opening | Sheet translate upward a small distance + fade in; backdrop fades gently; trap focus as soon as dialog is active | 220–300 ms | Connects selected stop to its details |
| Place details sheet closing | Short reverse transition; promptly restore focus to triggering row | 150–220 ms | Predictable dismissal |
| Confirmed stop replacement | Brief highlight or cross-fade of the changed row; other rows should not jump around visually | 180–260 ms | Makes the changed stop findable |
| Budget meter change | Smooth width interpolation **only when the verified displayed total changes**, while numeric text updates accurately and immediately | 180–260 ms | Shows relation between the change and its cost |
| Save plan | Tactful icon/text change (e.g. bookmark to check) upon **real save success**, not on button press alone | 130–200 ms | Confirms a completed action |
| Loading/refinement state | Small, controlled progress treatment using existing patterns; do not animate every AI token or force the user to wait | Existing app convention | Indicates ongoing work without visual noise |

*Numbers above are starting points, not mandatory. The repo's existing timing and easing conventions take precedence. Avoid a long cascading animation when rendering multiple itinerary stops.*

## Accessibility and implementation requirements

1. **Reduced motion:** Honor `prefers-reduced-motion: reduce` for web and the corresponding platform accessibility setting for native apps. Disable movement or use an instantaneous state change; do not rely on a tiny duration if there are vestibular concerns.
2. **Keyboard and focus:** Keep tab selection, sheet dismissal, focus return, and Escape behavior correct before, during and after transitions. Avoid focus being trapped in an invisible closing sheet.
3. **Reversibility:** Rapid taps / repeated selections / closing during opening must not break visual state, trigger double actions or leave overlays stuck.
4. **Responsiveness:** Retain the same look and layout on 320px, 375px, 390px, 430px and desktop; animations must not cause scroll jumps or horizontal overflow.
5. **Performance:** Test on a real or emulated lower-end mobile device if available; prefer compositor-friendly updates and don't attach expensive observers to streaming token updates.
6. **Meaning:** Users must never have to infer a cost, stop, button state or navigation destination solely from movement; use visible labels and state styling.
7. **Existing system first:** If the app already uses Swift UIKit animations, its standard UIKit/Swift patterns take priority; if web, use the project's existing web approach. Do not install UIKit into a web project.

## Acceptance criteria for Cursor

- [ ] Visual structure remains very close to `REFERENCE_APPROVED_LAYOUT.png` and the polished HTML reference.
- [ ] Only meaningful interactions animate; static content stays quiet.
- [ ] No regressions to accessibility, user settings, keyboard controls, scrolling, save/refine functionality or loading behavior.
- [ ] Motion can be suppressed, and essential content/action feedback remains clear with no motion.
- [ ] Animations are interruption-safe, lightweight and not noticeably janky on target devices.
- [ ] If animations were omitted, Cursor explains the specific technical/product reason, without presenting that as a design failure.

**Priority:** Correct data and accessibility > approved visual fidelity > working interactions > optional motion polish. Smooth motion should reinforce the approved design, never compete with it.
