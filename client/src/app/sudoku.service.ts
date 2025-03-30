import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Difficulty } from './sudoku/sudoku.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSudokuPuzzle(difficulty: Difficulty): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?difficulty=${difficulty}`);
  }
}