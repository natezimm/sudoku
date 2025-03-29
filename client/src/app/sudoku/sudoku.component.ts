import { Component, OnInit } from '@angular/core';
import { SudokuService } from '../sudoku.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { GridComponent } from './grid/grid.component';
import { HeaderComponent } from './header/header.component';
import { Difficulty } from './sudoku.interface';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
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
  userMessage: string = 'Welcome! Here is your puzzle. Good luck!';
  difficulty: Difficulty = Difficulty.Easy; // Default difficulty
  Difficulty = Difficulty;
  difficultyLevels = [
    { label: 'Easy', value: Difficulty.Easy },
    { label: 'Medium', value: Difficulty.Medium },
    { label: 'Hard', value: Difficulty.Hard }
  ];

  constructor(private sudokuService: SudokuService) {}

  ngOnInit(): void {
    this.fetchPuzzle();
  }

  fetchPuzzle(): void {
    this.sudokuService.getSudokuPuzzle(this.difficulty).subscribe(data => {
      this.puzzle = data;
      this.initializeUserInput();
    });
  }

  initializeUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
  }

  onDifficultyChange(event: Event): void {
    const newDifficulty = (event.target as HTMLSelectElement).value as Difficulty;
    this.difficulty = newDifficulty;
    this.fetchPuzzle();
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
    this.userMessage = isCorrect
      ? 'Great job! You solved the puzzle!'
      : 'Oops! Some numbers are incorrect, try again!';
  }

  clearUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
    this.userMessage = 'Your input has been cleared, start fresh!';
  }
}