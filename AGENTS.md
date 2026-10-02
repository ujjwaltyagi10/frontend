This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project structure

ChoreDash customer app. Screen IDs (A1, B1…), requirement IDs and ticket IDs (CD-###) come from
the docs in `../choredash/`. Use them in testIDs, comments, branch names and PRs.

```
src/
├── app/                 # Expo Router routes ONLY. Each file is 1–3 lines: render a feature screen.
│   ├── (auth)/          #   onboarding stack (A2, A7–A11) — shown while not onboarded
│   ├── (main)/          #   everything after onboarding
│   │   ├── (tabs)/      #     Home · Bookings · Money (Money hidden for guests)
│   │   └── profile/     #     Profile stack (H1–H11)
│   └── locating.tsx, location-search.tsx   # reachable from both stacks
├── features/<name>/     # one folder per product area (onboarding, home, services, cart,
│   ├── screens/         #   checkout, pass, wallet, bookings, support, profile)
│   ├── components/      #   UI used only by this feature
│   ├── hooks/           #   TanStack Query hooks + feature logic
│   └── index.ts         #   public API — the ONLY file other code may import
├── components/ui/       # design-system primitives (Text, Button, Screen, StateView…)
├── api/                 # HTTP client, endpoints, types, query keys, query client
├── mocks/               # in-app mock backend (handlers + fixtures); loaded only by api/client.ts
├── stores/              # Zustand: session, selected location, cart draft — nothing else
├── hooks/               # data hooks shared by several features (e.g. saved addresses)
├── lib/                 # framework-free helpers: auth tokens, storage, i18n, analytics, format
├── config/              # env (zod-validated) and product constants
├── theme/               # design tokens (tokens.js is shared with tailwind.config.js)
├── providers/           # app-wide providers and startup (bootstrap/splash)
└── types/               # global type augmentation (i18next, react-query)
```

### Rules (enforced by ESLint where possible)

- **Features never import other features.** If two features need something, move it to
  `components/`, `lib/` or `stores/`. Outside a feature, import only `@/features/<name>`.
- **Shared layers never import features or routes.** Route files don't call the API.
- **Server data lives only in TanStack Query.** Add keys to `api/query-keys.ts`; opt into disk
  persistence with `meta: { persist: true }`. Zustand holds only what the server doesn't know.
- **Never compute prices in the app** — show the server quote. Money is integer paise; format
  with `formatMoney`. Times are UTC on the wire, shown in IST via `lib/format`.
- **Money-moving writes** send an `idempotencyKey` from `newIdempotencyKey()` (`lib/ids.ts`),
  created once per user action and reused on retry.
- **No hard-coded colours or sizes.** Use NativeWind classes backed by `theme/tokens.js`
  (`bg-primary`, `text-fg-muted`, `rounded-card`, `text-h2`…). Use cyan sparingly (selected states, key accents); text and icons on cyan fills are white (as in Pronto), cyan text on white uses `text-primary-strong`. Icons default to zinc-400/500. Subheadings, subtitles and secondary lines use `tone="muted"` (zinc-500) — never a new grey; on cyan cards use `tone="onPrimaryMuted"` (zinc-100).
- **Build screens from `@/components/ui`**: Text, Button, IconButton, Icon (+ shared `icons`), Card,
  Input, PhoneInput, OtpInput, PriceText, Badge, Chip, SegmentedTabs, DurationStepper, Banner,
  ListGroup + ListRow (iOS-Settings-style grouped menus — don't box each row), Steps, Accordion, Skeleton, EmptyState, StateView, StickyFooter, BottomSheet/ConfirmSheet, toast. See them
  all on a device at `/dev-gallery` (Profile → Component gallery, dev builds only).
- **Font weight comes from the font file.** Use `<Text weight="semibold">` (or the variant default);
  `font-*` classes select a Lexend file and Tailwind's fontWeight utilities are disabled. Never set
  `fontWeight` in styles. Load new weights per-file (`@expo-google-fonts/lexend/600SemiBold`).
- **Icons are SF Symbols / Material Symbols** via `<Icon>`; every icon-only button needs an
  `accessibilityLabel`. No emoji as icons.
- **Every string goes through i18n** (`src/lib/i18n/locales/en/<namespace>.json`); errors map from
  API codes via `useErrorMessage()`.
- **Tokens only in secure storage** (`lib/auth/token-storage.ts`), never AsyncStorage.
- **Every screen handles loading, error and empty states** (`StateView`, skeletons for main screens).
- Analytics only through typed `track()` events in `lib/analytics/events.ts`; never send phone,
  address or OTP.
- Formatting is Prettier (`npm run format`; `npm run check` fails on unformatted code). Tailwind classes are
  auto-sorted by the Prettier plugin — don't hand-order them.
- Files in kebab-case; one screen per file named `<name>-screen.tsx`; tests sit next to the file
  as `*.test.ts(x)`.

### Adding things

- **A new screen:** create it in `features/<f>/screens/`, export it from the feature's `index.ts`,
  add a one-line route file in `src/app/`, register header options in the parent `_layout.tsx`.
- **A new endpoint:** add types in `api/types/`, a function in `api/endpoints/<module>.ts`, a mock
  in `mocks/handlers/<module>.ts` (+ fixtures), and a query hook in the feature.
- Placeholder screens use `components/dev/placeholder-screen.tsx`; delete the placeholder when
  the ticket is built.

### Mock mode

`EXPO_PUBLIC_USE_MOCKS=true` routes every request to `src/mocks` with
`EXPO_PUBLIC_MOCK_LATENCY_MS` delay. Mock OTP is `123456`. Set it to `false` and point
`EXPO_PUBLIC_API_URL` at the Go backend (`../Backend`, `make run`) to use the real API — on a
device/simulator use your Mac's LAN IP, e.g. `http://192.168.1.20:8080/v1`.

Payments in development (mocks or the Go backend with `PAYMENT_GATEWAY=fake`) use the test gateway
sheet, which calls `POST /dev/payments/{id}/outcome {outcome: success|failure|never}` — the same
route on both. Razorpay is only used when `EXPO_PUBLIC_APP_ENV` is staging/production (CD-046).

`src/api/live-backend.test.ts` runs the app's real API client against a running backend:
`LIVE_API_URL=http://localhost:8080/v1 npx jest src/api/live-backend.test.ts` (skipped otherwise).
Mocks must keep matching `../Backend/api/openapi.yaml`.

### Known deviations from the Frontend Spec

The spec assumed a bare React Native monorepo. This app uses Expo instead: Expo Router (built on
React Navigation) instead of hand-written navigators, NativeWind instead of a `styled` helper,
expo-image instead of fast-image, expo-secure-store instead of react-native-keychain,
AsyncStorage instead of MMKV (swap in `lib/storage/kv-storage.ts` once we use development
builds), and EAS Build/Update instead of Fastlane/CodePush.
