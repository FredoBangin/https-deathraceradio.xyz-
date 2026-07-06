# Death Race Radio UI/UX Audit

Saved: `design-audit/`
Capture tool: Firefox headless via `puppeteer-core`, local Vite server.
Final check: `design-audit/final-verification.json`, plus `final-*.png` screenshots from `http://127.0.0.1:5174/`.

## Steps

1. Home desktop: healthy after fixes. Hero loads, search is visible, recent cards have more title space.
2. Home mobile: healthier after fixes. Search is now visible, bottom nav no longer covers main scroll area.
3. Songs desktop: healthy. Table layout scans well with right player rail.
4. Songs mobile: improved. Search is visible, category tabs scroll horizontally, era filter moved below tabs.
5. Search suggestions: healthy. Suggestions are readable and keyboard/search intent is clear.
6. Radio mobile: healthy for empty state. Search hidden intentionally so radio player keeps vertical space.

## Findings Fixed

1. Social previews were weak: `og:description` repeated the domain, no `og:image`, no Twitter card, no canonical URL.
   Fixed in `index.html`; added `/og-image.png`.
2. Install/share metadata was missing: no manifest, theme color, apple touch icon, PNG/ICO favicon fallback, robots, sitemap.
   Added public assets and metadata files.
3. Lazy route fallback looked broken in fast screenshots: page showed only `Loading` while footer was already visible.
   Replaced with full skeleton layout.
4. Mobile search was unavailable.
   Search now appears as a second topbar row on normal mobile routes.
5. Mobile bottom nav overlapped content.
   Main and radio scroll areas now end above the fixed nav.
6. Songs mobile filters clipped awkwardly.
   Category tabs are horizontally scrollable, and era filter sits on its own row.
7. Desktop recent cards were too cramped with right rail.
   Recent row switches to two columns below 1500px.
8. Icon-only row controls lacked explicit labels.
   Added `aria-label`/`title` for play, like, and more actions.
9. Eras sort used a native browser select with gray OS styling, and view icons were hand-drawn SVGs.
   Replaced it with the app's custom dropdown skin and app icon system.
10. Red accents were inconsistent across hero, hovers, likes, playlist cards, and glows.
    Normalized those states to the Death Race Radio red token.
11. Songs era dropdown could open off-screen on narrow mobile viewports.
    Anchored the custom panel inside the viewport and added consistent thin scrollbar styling.
12. Sidebar color still drifted in radio-expanded and mobile states.
    Replaced the remaining blue/orange sidebar treatments with the neutral dark surface and shared Death Race Radio red hover/active tokens. Also aligned player rail toggles, queue toggles, action-menu hovers, toast errors, auth errors, and archive status badges to the same red system.
13. Glow intensity still felt too loud after the first pass.
    Reduced red bloom on cards, rows, lyrics, auth, comments, player controls, sidebar active states, and dropdown states. Red now behaves as an accent instead of a halo.
14. Typography felt too informal and heavy.
    Switched the site to IBM Plex Sans and added final weight/tracking guards for headings, buttons, badges, menus, player metadata, and sidebar brand text.

## Final Verification

- `npm run lint` passed.
- `npm run build` passed.
- Final browser pass covered home desktop, home mobile, songs mobile, search suggestions, and radio mobile.
- DOM checks found `overflowX: 0`, `unlabeledButtonCount: 0`, and `nestedInteractiveCount: 0` on the tested pages.
- Rendered head tags include title, description, canonical URL, theme color, OG image, Twitter card tags, touch icon, favicon fallbacks, and manifest.
- Dropdown verification covered Eras sort and Songs era menus. Browser checks found `selectCount: 0`, no console errors, and active dropdown color `rgb(193, 39, 45)`.
- Latest sidebar color pass: `npm run lint`, `npm run build`, `git diff --check`, and hardcoded mismatch scans passed on July 6, 2026. Fresh screenshots for this last sidebar pass were blocked because Playwright Chromium is not installed in the local cache, Firefox headless crashed, and the approval request to download Chromium was rejected by the environment.
- Final glow/type polish was verified with static scans for oversized red glows, native selects, and hard-coded mismatch reds before the final lint/build pass.

## Remaining Risks

- Screenshot audit cannot prove full WCAG compliance. Needs keyboard-only pass, screen reader pass, and real device Safari/Chrome checks.
- Category tabs still require horizontal scrolling on narrow phones; usable, but a segmented menu could be cleaner later.
- OG image depends on a Wikimedia-sourced artist photo rendered into a local PNG. Verify rights/compliance before paid or official promotion.
