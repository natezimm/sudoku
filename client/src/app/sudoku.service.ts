import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Ensure HttpClient is imported
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Make the service available globally
})
export class SudokuService {
  private apiUrl = 'http://localhost:5200/api/sudoku';  // Adjust your API URL here

  constructor(private http: HttpClient) {}

  getSudokuPuzzle(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}