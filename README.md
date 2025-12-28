[![CI](https://github.com/natezimm/sudoku/actions/workflows/deploy.yml/badge.svg)](https://github.com/natezimm/sudoku/actions/workflows/deploy.yml)
[![Coverage](https://img.shields.io/badge/coverage-checked-brightgreen)](#testing--quality)

# Sudoku

Full-stack Sudoku app with an Angular 19 frontend and an ASP.NET Core 8 backend that generates puzzles on demand.

## Architecture

### Backend (`server/`)
- Minimal ASP.NET Core app in `server/Program.cs` exposing `GET /api/sudoku`.
- `SudokuGenerator` builds a completed grid, then removes cells based on difficulty (`easy`/`medium`/`hard`).
- Swagger UI is enabled in Development.
- CORS is locked down to a single allowed origin via `ClientUrl` (from config/env var).
- Security headers and rate limiting applied to all responses.
- Input validation with strict whitelist for difficulty parameter.
- `server/Controllers/SudokuController.cs` exists for unit tests/alternate wiring, but the running app uses the minimal endpoint by default.

### Frontend (`client/`)
- Standalone Angular components render the grid, header, and stats view.
- Fetches puzzles from the backend, tracks elapsed time, validates input, and highlights row/column/box conflicts.
- Persists active game state, stats, and theme preference in `localStorage` (with a resume prompt on load).
- Difficulty switching includes a confirmation flow and timer handling.
- Security utilities for URL validation and input sanitization.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Node 22; see `.nvmrc` / `client/package.json`) and npm.
- [.NET 8 SDK](https://dotnet.microsoft.com/) (to build/run the ASP.NET Core backend).

### Configure the backend
The backend requires `ClientUrl` to be set (it will throw on startup if missing). For local development it’s already set to `http://localhost:4200` in `server/appsettings.json`.

Override it with an environment variable if needed:
```bash
export ClientUrl=http://localhost:4200
```

### Run locally
1. Start the backend (HTTP on port 5200):
   ```bash
   cd server
   dotnet run --launch-profile http
   ```
2. Start the frontend:
   ```bash
   cd ../client
   npm ci
   npm start
   ```
3. Open `http://localhost:4200` in your browser. The client targets `http://localhost:5200/api/sudoku` by default as defined in `client/src/environments/environment.ts`.

### Run tests
- Server: `dotnet test tests/Server.Tests` (covers `SudokuApp`, `SudokuController`, and the puzzle generator mappings).
- Client: `npm run test` (Karma/Jasmine); use `npm run test:coverage` for code coverage reports.

## Testing & Quality

- CI runs automated tests and checks code coverage before deployment.
- Coverage thresholds are enforced to ensure ongoing reliability:
  - Lines ≥ 90%
  - Statements ≥ 85%
  - Functions ≥ 85%
  - Branches ≥ 80%

### Build for production
- Frontend: `npm run build` outputs compiled assets into `client/dist/`.
- Backend: `dotnet publish -c Release -o out` creates a production-ready publish folder.

## Features
- **Difficulty tiers**: Request easy, medium, or hard puzzles and enjoy progressively sparser grids from the backend generator.
- **Interactive grid**: Tracks user input, validates digits on submit, flags row/column/box conflicts, and disables editing of prefilled cells.
- **Session persistence**: Active puzzle, elapsed time, pause/error state, and conflict metadata are saved to `localStorage` so you can resume after reloads.
- **Stats dashboard**: Records games completed and fastest solve time per difficulty with updates after each successful solve.
- **Timer controls**: Toggle pause/resume, see formatted elapsed time, and clear user input without losing the original puzzle.
- **Theme toggle**: Light/dark mode with a saved preference (`localStorage`) and system default on first visit.
- **Responsive UX**: Layout adapts across screen sizes with contextual status messages.

## API
- `GET /api/sudoku?difficulty=<easy|medium|hard>`
  - Returns `{ puzzle: number[][]; difficulty: string; }` with 9×9 grid data and zeros where the user must fill values.
  - Default difficulty is `easy`. The backend removes 45/51/55 cells for easy/medium/hard respectively.
  - Returns `400 Bad Request` for invalid difficulty values.
  - Rate limited to 60 requests per minute per IP.
  - Swagger documentation is available at `/swagger` in development mode.

## Security
- **Input Validation**: Strict whitelist validation for API parameters
- **Rate Limiting**: 60 requests/minute per IP to prevent DoS attacks
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP
- **HTTPS Enforcement**: Production API requires HTTPS; client validates secure URLs
- **Supply Chain Security**: Subresource Integrity (SRI) hashes for CDN resources
- **Container Hardening**: Non-root user, minimal chiseled Docker image
- **Host Validation**: AllowedHosts restricted to production domain

## Development notes
- Update `client/src/environments/environment.ts` to point `apiUrl` at your backend host.
- `localStorage` keys:
  - `sudokuActiveGame` stores the in-progress puzzle plus metadata.
  - `sudokuStats` tracks games completed and fastest times for each difficulty.
  - `sudokuTheme` stores the theme preference (`light`/`dark`).
- The backend puzzle generator does not currently enforce uniqueness of solutions; it generates a valid filled grid and removes cells to match the requested difficulty.

## Additional resources
- [Angular CLI Overview](https://angular.dev/tools/cli)
- [ASP.NET Core Documentation](https://learn.microsoft.com/aspnet/core/)
