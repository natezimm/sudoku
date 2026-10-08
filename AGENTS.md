# Sudoku agent guide

## Scope and workspace

Sudoku has an Angular client and ASP.NET Core API, deployed at `sudoku.nathanzimmerman.com`. The API generates uniquely solvable puzzles; the client manages board interaction, timer, persistence, statistics, and themes.

This repo and siblings `../nathanzimmerman.com`, `../brick-breaker-resume`, `../nerdle`, and `../blackjack` are independent Git repositories. Read a sibling's `AGENTS.md` before editing it. Check the working tree and preserve unrelated changes. See `docs/architecture.md` for context; executable configuration takes precedence over stale prose.

## Where to work

- `client/src/main.ts` bootstraps standalone `AppComponent` with `app.config.ts`; register providers there. `app.module.ts` is not the active bootstrap path.
- `client/src/app/sudoku/`: game shell, grid/header components, board logic in `sudoku-game.service.ts`, persistence in `game-storage.service.ts`, and statistics in `stats.service.ts`.
- `client/src/app/sudoku.service.ts`: typed API access; `theme.service.ts`: theme state.
- `client/src/app/shared/security.utils.ts` and `client/src/environments/`: security helpers and API URLs.
- `server/Program.cs`: minimal API endpoints, configuration, and middleware.
- `server/Services/SudokuGenerator.cs`: generation and uniqueness checking; `server/Models/`: difficulty and puzzle models.
- Colocated Angular `*.spec.ts`, `tests/Server.Tests/`, and `e2e/sudoku.spec.js`: tests.

## Commands and runtime caveats

The client manifest declares Angular **22**, and `server/server.csproj` targets **.NET 10**, matching CI's .NET SDK. Older README/architecture references to Angular 19/.NET 8 are stale. `.nvmrc` and CI select Node 22, while root/client manifests require Node 26. These pins conflict; note which runtime you use and any engine failures. Resolve pin changes as a coordinated configuration change.

Run from the repository root unless a directory is specified:

- Install: `npm ci` and `npm ci --prefix client`.
- API: in `server/`, run `dotnet run --launch-profile http` (port 5200).
- Client: `npm start --prefix client` (port 4200).
- API configuration requires an absolute HTTP(S) `ClientUrl` for CORS; local configuration supplies `http://localhost:4200`. The development client calls `http://localhost:5200/api/sudoku`; production builds use the public API URL in `environment.prod.ts`.
- Client build: `npm run client:build`; browser assets are under `client/dist/browser/`.
- Client tests: `npm test --prefix client` starts watch mode locally; `npm run client:test:coverage` runs once with Karma/Jasmine and ChromeHeadless. Requires Chrome or a configured `CHROME_BIN`; Playwright's Chromium installation is separate.
- Backend: `npm run server:restore`, `npm run server:build`, and `npm run server:test`.
- Backend coverage gate: `npm run server:test:coverage`. Its reporting step updates the global `dotnet-reportgenerator-globaltool` and requires tool-install access and `reportgenerator` on PATH.
- Browser tests: `npm run test:e2e`; install Chromium with `npx playwright install chromium` if needed.
- Full gate: `npm run quality` runs formatting, client coverage, server restore/build/coverage, and Playwright. Playwright builds and serves the Angular client. Client coverage thresholds in `client/karma.conf.js` apply only when `CI` is set; backend thresholds in `scripts/enforce-cobertura-coverage.mjs` always apply.
- Documentation-only checks: `npx prettier --check <files>`.

## Behavior to preserve

- Generated puzzles must have exactly one solution. Preserve difficulty validation and server-side uniqueness checking when changing generation.
- `GET /api/sudoku?difficulty=easy|medium|hard` returns `{ puzzle, difficulty }` with a 9-by-9 grid and zeros for blank cells. Difficulty defaults to `easy`; invalid values return 400. `GET /api/health` supports deployment checks.
- Keep board evaluation and input normalization in services rather than growing component/template logic. Preserve prefilled cells, conflict highlighting, pause/resume, and difficulty-switch confirmation.
- Preserve persisted-game compatibility and the `sudokuActiveGame`, `sudokuStats`, and `sudokuTheme` storage keys, or explicitly handle migration when changing formats.
- Retain CORS, input validation, rate limits, and security headers.
- Browser tests mock puzzle responses; test generation and API changes in the backend suite as well.

## Verification and delivery

Run checks relevant to the change and use the full gate for broad application changes. Report failing or unrun checks. Edit source files rather than generated builds, `TestResults/`, or reports.

Playwright uses fixed port 4173 and reuses an existing server outside CI. Sibling repos use the same default, so stop other preview servers and run browser suites sequentially. `.github/workflows/deploy.yml` runs CI for PRs/main pushes; successful main pushes invoke the external GCP deployment script.
