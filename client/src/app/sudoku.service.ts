import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Difficulty } from './sudoku/sudoku.interface';
import { environment } from '../environments/environment';
import { validateSecureUrl } from './shared/security.utils';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {
  private readonly apiUrl: string;
  private readonly allowedDifficulties: ReadonlySet<string> = new Set(['easy', 'medium', 'hard']);

  constructor(private http: HttpClient) {
    if (!validateSecureUrl(environment.apiUrl)) {
      console.warn('SudokuService: API URL security validation failed');
    }
    this.apiUrl = environment.apiUrl;
  }

  getSudokuPuzzle(difficulty: Difficulty): Observable<any> {
    const normalizedDifficulty = difficulty.toLowerCase();
    if (!this.allowedDifficulties.has(normalizedDifficulty)) {
      return throwError(() => new Error(`Invalid difficulty: ${difficulty}`));
    }

    const encodedDifficulty = encodeURIComponent(normalizedDifficulty);
    
    return this.http.get<any>(`${this.apiUrl}?difficulty=${encodedDifficulty}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'An error occurred while fetching the puzzle. Please try again.';
    
    if (error.status === 429) {
      userMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.status === 400) {
      userMessage = 'Invalid request. Please check your settings.';
    } else if (error.status === 0) {
      userMessage = 'Unable to connect to the server. Please check your connection.';
    }

    console.error('SudokuService Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url ? '[redacted]' : undefined
    });

    return throwError(() => new Error(userMessage));
  }
}
