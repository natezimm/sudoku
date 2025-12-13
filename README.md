# Sudoku

Full-stack Sudoku experience that pairs an Angular 19 frontend with an ASP.NET Core 8 backend puzzle generator.

## Architecture

### Backend (`server/`)
- Minimal ASP.NET Core app wired up in `Program.cs` plus a `SudokuController` for the `/api/sudoku` endpoint.
- `SudokuGenerator` builds valid puzzles and removes cells based on the requested difficulty (easy/medium/hard).
- Opens Swagger/UI in Development and enforces a `ClientUrl` CORS policy so the Angular client can fetch puzzles.
- Includes a `Dockerfile` for containerized hosting.

### Frontend (`client/`)
- Standalone Angular components render the grid, header, and statistics views.
- Fetches puzzles from the backend, tracks elapsed time, highlights row/column/box conflicts, and persists both statistics and the current game state in `localStorage`.
- Difficulty selection, error highlighting, pause/resume, and reset actions keep the experience interactive across reloads.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) and npm (to run the Angular client).
- [.NET 8 SDK](https://dotnet.microsoft.com/) (to build/run the ASP.NET Core backend).
- Docker (optional, for containerized backend builds).

### Configure the backend
1. Ensure `ClientUrl` is set so the backend knows which origin to allow (`http://localhost:4200` is the default for local dev). You can set it via shell:
   ```bash
   export ClientUrl=http://localhost:4200
   ```
   The same value is mirrored in `server/appsettings*.json` when you don’t set the environment variable.

### Run locally
1. Start the backend (port 5200 by default):
   ```bash
   cd server
   dotnet run --urls http://localhost:5200
   ```
2. Start the frontend:
   ```bash
   cd ../client
   npm install
   npm start
   ```
3. Open `http://localhost:4200` in your browser. The client targets `http://localhost:5200/api/sudoku` by default as defined in `client/src/environments/environment.ts`.

### Run tests
- Server: `dotnet test tests/Server.Tests` (covers `SudokuApp`, `SudokuController`, and the puzzle generator mappings).
- Client: `npm run test` (Karma/Jasmine); use `npm run test:coverage` for code coverage reports.

### Build for production
- Frontend: `npm run build` outputs compiled assets into `client/dist/`.
- Backend: `dotnet publish -c Release -o out` creates a production-ready publish folder.
- Docker (backend): `docker build -t sudoku-server server` then `docker run -p 5200:5200 -e ClientUrl=http://localhost:4200 sudoku-server`.

## Features
- **Difficulty tiers**: Request easy, medium, or hard puzzles and enjoy progressively sparser grids from the backend generator.
- **Interactive grid**: Tracks user input, validates digits on every submit, flags row/column/box conflicts, and disables editing of prefilled cells.
- **Session persistence**: Current puzzle state, elapsed time, highlighting preferences, and conflict metadata are saved to `localStorage` so you can resume where you left off.
- **Stats dashboard**: Records games completed and fastest solve times per difficulty with updates after each successful solve.
- **Timer controls**: Toggle pause/resume, see formatted elapsed time, and clear user input without losing the original puzzle.
- **Responsive UX**: Standalone header/grid components adapt to different screen sizes while giving immediate feedback via contextual messages.

## API
- `GET /api/sudoku?difficulty=<easy|medium|hard>`
  - Returns `{ puzzle: number[][]; difficulty: string; }` with 9×9 grid data and zeros where the user must fill values.
  - Default difficulty is `easy`. The backend removes 45/51/55 cells for easy/medium/hard respectively.
  - Swagger documentation is available at `/swagger` in development mode.

## Development notes
- Update `client/src/environments/environment.ts` (and its `production.ts` counterpart if you add one) to point `apiUrl` at your backend host.
- `localStorage` keys:
  - `sudokuActiveGame` stores the in-progress puzzle plus metadata.
  - `sudokuStats` tracks games completed and fastest times for each difficulty.
- The server exposes `/api/sudoku` via both the minimal endpoint in `SudokuApp` and the MVC-style `SudokuController`, so you can hit it with HTTP clients or wire it into additional backend logic.

## Additional resources
- [Angular CLI Overview](https://angular.dev/tools/cli)
- [ASP.NET Core Documentation](https://learn.microsoft.com/aspnet/core/)
