import { Component, OnInit } from '@angular/core';
import { SudokuService } from '../sudoku.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { GridComponent } from './grid/grid.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [
    CommonModule, 
    GridComponent,
    HeaderComponent,
    HttpClientModule
  ],
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.scss']
})
export class SudokuComponent implements OnInit {
  puzzle: number[][] = [];
  userInput: (number | null)[][] = [];
  gridId = 1;

  constructor(private sudokuService: SudokuService) {}

  ngOnInit(): void {
    this.sudokuService.getSudokuPuzzle().subscribe(data => {
      this.puzzle = data;
      this.initializeUserInput();
    });
  }

  initializeUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
  }

  checkSolution(): void {
    let isCorrect = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.puzzle[i][j] === 0 && this.userInput[i][j] !== this.puzzle[i][j]) {
          isCorrect = false;
          break;
        }
      }
    }
    if (isCorrect) {
      alert('Congratulations! The solution is correct.');
    } else {
      alert('Some numbers are incorrect. Please try again.');
    }
  }
}