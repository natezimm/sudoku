import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Difficulty } from './sudoku/sudoku.interface';
import { environment } from '../environments/environment';
import { validateSecureUrl } from './shared/security.utils';

/**
 * Service for fetching Sudoku puzzles from the backend API.
 * Includes security validations and error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class SudokuService {
  private readonly apiUrl: string;
  private readonly allowedDifficulties: ReadonlySet<string> = new Set(['easy', 'medium', 'hard']);

  constructor(private http: HttpClient) {
    // Validate API URL is secure on service initialization
    if (!validateSecureUrl(environment.apiUrl)) {
      console.warn('SudokuService: API URL security validation failed');
    }
    this.apiUrl = environment.apiUrl;
  }

  /**
   * Fetches a Sudoku puzzle from the API.
   * 
   * @param difficulty - The difficulty level (easy, medium, hard)
   * @returns Observable containing the puzzle data
   * @throws Error if difficulty is invalid
   */
  getSudokuPuzzle(difficulty: Difficulty): Observable<any> {
    // Validate difficulty on client side before making request
    const normalizedDifficulty = difficulty.toLowerCase();
    if (!this.allowedDifficulties.has(normalizedDifficulty)) {
      return throwError(() => new Error(`Invalid difficulty: ${difficulty}`));
    }

    // Use encodeURIComponent to prevent query string injection
    const encodedDifficulty = encodeURIComponent(normalizedDifficulty);
    
    return this.http.get<any>(`${this.apiUrl}?difficulty=${encodedDifficulty}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Handles HTTP errors with appropriate logging.
   * Avoids exposing sensitive error details to users.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'An error occurred while fetching the puzzle. Please try again.';
    
    if (error.status === 429) {
      userMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.status === 400) {
      userMessage = 'Invalid request. Please check your settings.';
    } else if (error.status === 0) {
      userMessage = 'Unable to connect to the server. Please check your connection.';
    }

    // Log error for debugging (avoid logging sensitive data)
    console.error('SudokuService Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url ? '[redacted]' : undefined
    });

    return throwError(() => new Error(userMessage));
  }
}