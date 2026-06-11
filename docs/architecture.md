# Architecture

## Runtime Topology

Sudoku is a full-stack application with an Angular 19 client in `client/` and an ASP.NET Core 8 API in `server/`. The client calls the backend for generated puzzles and keeps local UI/session state in the browser.

## Architecture Diagram

```mermaid
flowchart LR
  Visitor["Player browser"] --> Client["Angular 19 client<br/>client/"]
  Client --> Components["Standalone UI components<br/>grid, header, game shell"]
  Client --> Services["Angular services<br/>Sudoku, game, stats, theme"]
  Services --> BrowserState["Browser persistence<br/>localStorage"]
  Services --> Api["Typed API access<br/>GET /api/sudoku"]
  Api --> Backend["ASP.NET Core 8 API<br/>server/Program.cs"]
  Backend --> Generator["SudokuGenerator<br/>grid fill + cell removal"]
  Generator --> Uniqueness["Uniqueness solver<br/>single-solution check"]
  Backend --> Models["Puzzle + difficulty models"]
  Backend --> Security["Validation, rate limits,<br/>CORS, security headers"]
  Backend --> Health["GET /api/health"]
  Repo["Repo quality gate<br/>npm run quality"] --> Builds["Angular build<br/>.NET build/test"]
  Builds --> Deploy["GitHub Actions<br/>Lightsail deploy script"]

  classDef user fill:#f8fafc,stroke:#475569,color:#0f172a
  classDef site fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
  classDef server fill:#ffedd5,stroke:#c2410c,color:#7c2d12
  classDef repo fill:#eef2ff,stroke:#4338ca,color:#312e81
  classDef client fill:#dcfce7,stroke:#15803d,color:#14532d
  classDef data fill:#fef3c7,stroke:#b45309,color:#78350f
  classDef delivery fill:#f3e8ff,stroke:#7e22ce,color:#581c87
  classDef external fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d
  class Visitor user
  class Client,Components,Services,Api client
  class Backend,Generator,Uniqueness,Security,Health server
  class BrowserState,Models data
  class Repo,Builds,Deploy delivery
```

## Source Boundaries

The backend owns puzzle generation, uniqueness checks, difficulty mapping, API validation, rate limiting, CORS, security headers, and health checks. The Angular client owns board rendering, input validation feedback, timer behavior, local persistence, theme state, and typed service access to the API.

## Quality Gates

Run `npm run quality` from the repo root after installing root and client npm dependencies. The gate checks Prettier formatting, Angular coverage, the Angular production build, .NET restore/build/test, Cobertura report generation, and backend coverage enforcement.

## Deployment Flow

GitHub Actions runs the root quality gate for pull requests and pushes to `main`. Pushes to `main` SSH to Lightsail and run the external deploy script for this repository, then check the client and `/api/health`.

## Workspace Connectivity

```mermaid
flowchart LR
  subgraph Workspace["Five repository workspace"]
    PortfolioRepo["nathanzimmerman.com<br/>portfolio"]
    BrickRepo["brick-breaker-resume<br/>Phaser resume game"]
    NerdleRepo["nerdle<br/>React + Express word game"]
    SudokuRepo["sudoku<br/>Angular + ASP.NET Core"]
    BlackjackRepo["blackjack<br/>React + Spring Boot"]
  end

  PortfolioRepo --> PortfolioSite["nathanzimmerman.com"]
  BrickRepo --> BrickSite["resume.nathanzimmerman.com"]
  NerdleRepo --> NerdleSite["nerdle.nathanzimmerman.com"]
  SudokuRepo --> SudokuSite["sudoku.nathanzimmerman.com"]
  BlackjackRepo --> BlackjackSite["blackjack.nathanzimmerman.com"]

  PortfolioSite --> BrickSite
  PortfolioSite --> NerdleSite
  PortfolioSite --> SudokuSite
  PortfolioSite --> BlackjackSite

  PortfolioRepo --> Actions["GitHub Actions<br/>quality + deploy workflows"]
  BrickRepo --> Actions
  NerdleRepo --> Actions
  SudokuRepo --> Actions
  BlackjackRepo --> Actions
  Actions --> Lightsail["AWS Lightsail<br/>static sites + app services"]
  Lightsail --> PortfolioSite
  Lightsail --> BrickSite
  Lightsail --> NerdleSite
  Lightsail --> SudokuSite
  Lightsail --> BlackjackSite

  classDef user fill:#f8fafc,stroke:#475569,color:#0f172a
  classDef site fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
  classDef server fill:#ffedd5,stroke:#c2410c,color:#7c2d12
  classDef repo fill:#eef2ff,stroke:#4338ca,color:#312e81
  classDef client fill:#dcfce7,stroke:#15803d,color:#14532d
  classDef data fill:#fef3c7,stroke:#b45309,color:#78350f
  classDef delivery fill:#f3e8ff,stroke:#7e22ce,color:#581c87
  classDef external fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d
  class PortfolioRepo,BrickRepo,NerdleRepo,SudokuRepo,BlackjackRepo repo
  class PortfolioSite,BrickSite,NerdleSite,SudokuSite,BlackjackSite site
  class Actions,Lightsail delivery
```

## Deferred Architecture Follow-Ups

Keep Angular ESLint adoption separate from this pass. Future work can add a .NET formatter/analyzer profile and move the report generator dependency from a global CI tool to a pinned local tool manifest.
