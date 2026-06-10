import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Difficulty, SudokuPuzzleResponse } from './sudoku/sudoku.interface';
import { environment } from '../environments/environment';
import { validateSecureUrl } from './shared/security.utils';

@Injectable({
  providedIn: 'root',
})
export class SudokuService {
  private readonly apiUrl: string;
  private readonly allowedDifficulties: ReadonlySet<string> = new Set([
    'easy',
    'medium',
    'hard',
  ]);

  constructor(private http: HttpClient) {
    if (!validateSecureUrl(environment.apiUrl)) {
      console.warn('SudokuService: API URL security validation failed');
    }
    this.apiUrl = environment.apiUrl;
  }

  getSudokuPuzzle(difficulty: Difficulty): Observable<SudokuPuzzleResponse> {
    const normalizedDifficulty = difficulty.toLowerCase();
    if (!this.allowedDifficulties.has(normalizedDifficulty)) {
      return throwError(() => new Error(`Invalid difficulty: ${difficulty}`));
    }

    const encodedDifficulty = encodeURIComponent(normalizedDifficulty);

    return this.http
      .get<unknown>(`${this.apiUrl}?difficulty=${encodedDifficulty}`)
      .pipe(
        map((response) => this.toSudokuPuzzleResponse(response)),
        catchError(this.handleError)
      );
  }

  private toSudokuPuzzleResponse(response: unknown): SudokuPuzzleResponse {
    if (!this.isSudokuPuzzleResponse(response)) {
      throw new Error('Unexpected puzzle response from API.');
    }

    return response;
  }

  private isSudokuPuzzleResponse(
    response: unknown
  ): response is SudokuPuzzleResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    const candidate = response as Partial<SudokuPuzzleResponse>;
    return (
      Array.isArray(candidate.puzzle) &&
      this.isValidGrid(candidate.puzzle) &&
      typeof candidate.difficulty === 'string' &&
      this.allowedDifficulties.has(candidate.difficulty)
    );
  }

  private isValidGrid(grid: unknown[][]): boolean {
    return (
      grid.length === 9 &&
      grid.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 9 &&
          row.every(
            (cell) =>
              typeof cell === 'number' &&
              Number.isInteger(cell) &&
              cell >= 0 &&
              cell <= 9
          )
      )
    );
  }

  private handleError(error: unknown): Observable<never> {
    let userMessage =
      'An error occurred while fetching the puzzle. Please try again.';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 429) {
        userMessage =
          'Too many requests. Please wait a moment before trying again.';
      } else if (error.status === 400) {
        userMessage = 'Invalid request. Please check your settings.';
      } else if (error.status === 0) {
        userMessage =
          'Unable to connect to the server. Please check your connection.';
      }

      console.error('SudokuService Error:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url ? '[redacted]' : undefined,
      });
    } else {
      console.error('SudokuService Error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return throwError(() => new Error(userMessage));
  }
}
