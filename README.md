# ChoreDash — customer app

React Native (Expo SDK 57, Expo Router) app for booking house help. Product docs live in
`../choredash/` (PRD, Screen Flow, Frontend Spec, Architecture, Security, Tickets).

## Run

```bash
npm install
cp .env.example .env.local   # EXPO_PUBLIC_USE_MOCKS=true → no backend needed
npm start                    # then press i / a, or scan with Expo Go
```

Mock login: any 10-digit number starting 6–9, OTP **123456**. Searching "Sector 62" gives a
not-served location (B6).

## Scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, including the architecture boundary rules |
| `npm test` | Jest (jest-expo) |
| `npm run check` | all three — run before every PR |

Folder structure and coding rules: see [AGENTS.md](AGENTS.md#project-structure).
