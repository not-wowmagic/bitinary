# Research notes: practical anti-template UI polish

The goal is **not** to remove all rounded corners or all cards. It is to make each visible element earn its place, based on information architecture, clear interactions and consistent system design.

## Professional product guidance

**Apple Human Interface Guidelines — Design Principles:** values include purpose, user agency, visual hierarchy, consistency, simplicity and craft. The existing hero → route → timeline hierarchy is worth preserving; polish its details rather than replacing it with generic tiles. https://developer.apple.com/design/human-interface-guidelines/design-principles

**Apple HIG — Layout (2026 update):** alignment and hierarchy, adaptable content, safe areas and larger text sizes. For mobile itinerary rows, permit wrapping and growing heights. https://developer.apple.com/design/human-interface-guidelines/layout

**Apple HIG — Segmented Controls:** closely related views and clearly selected state; in multi-day itineraries, separate the day picker from view-switcher semantics, keeping a similar visual footprint. https://developer.apple.com/design/human-interface-guidelines/segmented-controls

**Vercel Web Interface Guidelines (GitHub):** keyboard reachability, visible focus, mobile target sizes, deliberate alignment, concentric nested radii, purposeful animation, authentic loading/error states. https://github.com/vercel-labs/web-interface-guidelines

**GitHub Primer Typography:** consistent semantic typography, readable scales, accessible units, natural left-aligned content. https://github.com/primer/design/blob/main/content/foundations/typography.mdx

**W3C WAI ARIA dialogs:** keyboard and focus management when presenting stop details. https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

## Community discussions (opinions, not universally applicable rules)

A September 2026 r/UI_Design discussion argued that generic sameness and thoughtless composition often matter more than the mere presence of cards, borders or gradients: https://www.reddit.com/r/UI_Design/comments/1w70kqb/question_about_websites_looking_like_ai_slop/

A June 2026 r/UXDesign discussion criticized the combination of excessive emoji chips, all-over borders, visually purposeless icons and poor product specificity in generated UIs: https://www.reddit.com/r/UXDesign/comments/1tvt03p/aigenerated_ui_proves_people_value_design_but_not/

**Application:** keep your own warm, location-first aesthetic and chronological travel timeline. Reduce ornaments, strengthen actual information, and do not imitate a generic SaaS analytics UI.
