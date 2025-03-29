import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Difficulty } from './sudoku/sudoku.interface';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {
  private apiUrl = 'http://localhost:5200/api/sudoku';

  constructor(private http: HttpClient) {}

  getSudokuPuzzle(difficulty: Difficulty): Observable<{ puzzle: number[][], solution: number[][] }> {
    return this.http.get<{ puzzle: number[][], solution: number[][] }>(`${this.apiUrl}?difficulty=${difficulty}`);
  }
}