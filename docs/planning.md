# Investo — Ephemeral Investment Simulator (Planning)

## Product North Star
- Deliver a game-like, zero-friction simulator to show how small budgeting tweaks compound into future wealth.
- No auth, no persistence; everything is ephemeral and instant, optimized for tactile play.
- Core loop: set income → split via 50/30/20 → pick market → watch growth curve + summary metrics.

## Success Criteria (MVP)
- Interactive budget split that always sums to 100%, with live donut visualization.
- Market selection with live or fallback rate; supports manual override.
- Growth simulator line chart with principal vs interest shading and scrub interaction.
- Details dashboard with total value, contributions, interest earned, and monthly passive income.
- Smooth 60fps feel on mid-range devices; interactions respond <100ms; chart updates <200ms.

## Audience & Tone
- Beginners to intermediate retail investors, early 20s–40s.
- Tone: playful, confident, straight-to-the-point; avoids jargon.
- Visual feel: “finance arcade” — bold color blocking, chunky controls, clear contrast.

## Guardrails / Non-Goals (MVP)
- No login, accounts, or cloud sync.
- No transaction execution; simulation only.
- No historical portfolio tracking; state resets on app reload.
- Keep API footprint minimal; prefer cached/static fallback when offline.

## UX Principles
- Always show money impact in currency, not just percentages.
- One-screen primary flow; reduce navigation depth.
- Controls feel like game sliders/toggles; avoid form-like inputs.
- Progressive disclosure: advanced options (deduction %, manual rate) appear inline when toggled.

## Information Architecture (MVP)
- App shell (single stack): Home → composite screen with four regions (Budget Splitter, Market Selector, Growth Simulator, Details Dashboard).
- Modals/Sheets: keypad for income entry, asset search results, settings (e.g., currency toggle if added later).

## Technical Approach
- Stack: Expo (React Native), TypeScript, NativeWind/Tailwind for styling, Reanimated/Moti for micro-interactions, Victory Native/Recharts alternative (evaluate performance) for charts, TanStack Query for market data fetch + caching.
- State model: lightweight global store (Zustand) for ephemeral session state (income, split, rate, horizon). Derived selectors for computed values (savings/month, contributions, projections).
- Data sources: public market API (alpha vantage, Twelve Data, or Yahoo unofficial) via simple REST; cache responses in TanStack Query; provide static fallback rates for key indices.
- Theming: single vibrant palette (finance arcade) with semantic tokens (bg, card, accent, success/warning/neutral); haptics on key interactions.

## Core Data Model (in-memory)
- `income`: number (monthly gross/net input).
- `deductionPct`: number (0–60), optional; used to derive net income when toggle on.
- `split`: { needsPct, wantsPct, savingsPct } constrained to 100.
- `asset`: { symbol, name, avgReturnPct, source }.
- `manualRatePct`: number | null.
- `horizonYears`: integer (1–50).
- Derived:
  - `netIncome = income * (1 - deductionPct/100)` when deduction active.
  - `savingsMonthly = netIncome * (savingsPct/100)`.
  - `annualRate = manualRatePct ?? asset.avgReturnPct`.
  - `contributionMonthly = savingsMonthly` (for now; extend for lump sum later).
  - `futureValue` via compound formula; principal vs interest split for chart shading.

## Calculation References
- Monthly contribution compounded monthly over years `n`, annual rate `r`:
  $$FV = P \times \frac{(1 + r/12)^{12n} - 1}{r/12}$$
  where `P = contributionMonthly`.
- Principal contributed:
  $$Principal = P \times 12n$$
- Interest earned:
  $$Interest = FV - Principal$$
- Monthly passive income (simple approximation):
  $$Passive = FV \times \frac{r}{12}$$
- If deduction toggle is on: `netIncome = income * (1 - deductionPct/100)` and use `netIncome` for splits.

## Feature Specs
### 1) Budget Splitter
- Inputs: income keypad (modal); deduction toggle + % slider (optional); linked 50/30/20 sliders (Needs, Wants, Savings) with sum constraint.
- Interactions: dragging one slider adjusts others to maintain 100%; quick reset to default 50/30/20; haptic ticks at 5% increments.
- Visualization: live donut chart with labels showing % and currency amounts (₱/$ based on chosen currency setting).
- Edge cases: income empty → disable downstream modules with helper text; min savings floor (e.g., 5%)? (open question).

### 2) Market Selector (API + manual fallback)
- Search bar for ticker/index/crypto; results list with symbol, name, recent return snippet.
- Selection sets `asset` and derived `annualRate`.
- Historical performance card: show 10y CAGR when available; fallback to 5y/3y; indicate data source.
- Manual override: numeric input for custom rate; if set, takes precedence over fetched rate.
- Offline/failed fetch: show cached static rates and mark as "Offline mode".

### 3) Growth Simulator
- Time horizon slider (1–50 years) with snap points at 5,10,20,30,40,50; shows tooltip at thumb.
- Chart: interactive line with scrub; area under curve split into principal (darker) and interest (lighter). Tooltip shows year, total, principal, interest.
- Animation: smooth transitions on slider/rate/split changes; keep 60fps by throttling updates (debounce + memoized data).

### 4) Details Dashboard
- Cards: Total portfolio value, Total contributions, Total interest, Monthly passive income.
- Copy: concise, motivational; show delta vs prior state on interaction (small up/down badges).

## Additional Feature Backlog (later)
- Inflation toggle (subtract 3–4% from annual rate and annotate results).
- Goal milestones along timeline (icons + thresholds list).
- Lump sum starting amount.
- Comparison mode (secondary series on chart with alternate rate).

## Visual & Interaction Direction
- Layout: single scrollable page; hero controls up top (income + split), chart center, metrics below.
- Components: chunky sliders, pill buttons, accent gradients; avoid default gray iOS styles.
- Colors (example tokens):
  - `bg`: deep navy/ink
  - `card`: charcoal
  - `accent`: electric teal or citrus
  - `needs/wants/savings`: distinct hues for donut and sliders
  - `principal/interest`: two-tone for chart fill
- Motion: subtle scale on press, spring on slider release, chart transitions with ease-out.
- Haptics: light impact on slider snap, success on hitting milestones (later).

## API Strategy
- Decision: Twelve Data (free tier, ~800 req/day, ~8–10 req/min burst). Requires API key; store as `TWELVE_DATA_KEY` in env. Good for search + one historical pull per selected asset when cached 24h.
- Fetch plan: TanStack Query + REST calls. On asset select, fetch symbol metadata and a compact monthly/weekly time series to compute ~10y CAGR client-side (fallback to 5y/3y if series short). Cache CAGR + last price for 24h (stale-while-revalidate) to stay within limits.
- Fallback data: static JSON of common indices (S&P 500 10.5%, MSCI World 9.1%, PH index placeholder, BTC 20% capped) and a basic bank rate (1–3%) for manual override suggestion. If API fails/offline, show badge "Using fallback rate".
- Error UX: toast + inline badge; allow manual rate override anytime; never block the simulator.

## Performance & Quality
- Target 60fps on mid devices; avoid heavy re-render by memoizing chart data; batch state updates.
- Input validation: numeric only; clamp sliders; guard against NaN.
- Offline: allow manual rate and local fallback assets; disable fetch when offline.
- Accessibility: large touch targets, high contrast, support dynamic type where feasible.

## Analytics / Telemetry (optional later)
- Lightweight event logging (screen load, slider changes, market select) via expo-tracking-optional; not in MVP.

## Testing Approach
- Unit: pure functions for calculations (future value, split logic).
- Component tests: slider constraint logic; chart data transform; TanStack Query mocks.
- Manual QA: offline mode, low-income edge cases, high horizon.

## Delivery Plan (MVP Build Steps)
1) Foundations: setup design tokens, typography scale, color palette, haptics util, Zustand store with baseline state + selectors.
2) Budget Splitter: income keypad, deduction toggle, constrained sliders, donut chart.
3) Market Selector: search UI with stub data, TanStack Query wiring, fallback/manual rate input.
4) Growth Simulator: compound calc utilities, chart component with principal/interest fill, horizon slider, scrub tooltip.
5) Details Dashboard: metric cards wired to derived selectors.
6) Polish: animations, toasts/badges, accessibility passes, performance tuning.
7) QA: unit tests for math and state, smoke run on device/emulator.

## Open Questions
- Currency handling: fix to one (₱) or allow toggle to $/₱?
- Minimum/maximum bounds for deduction % and savings %.
- Do we want per-session persistence (AsyncStorage) despite "ephemeral"? (likely skip for now).

## Next Actions
- Generate Twelve Data API key and add to local env (`TWELVE_DATA_KEY`).
- Approve color and motion direction.
- Lock the default split (50/30/20) and slider constraints.
