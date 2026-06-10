import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../environments/environment';
import { Difficulty } from './sudoku/sudoku.interface';
import { SudokuService } from './sudoku.service';

describe('SudokuService', () => {
  let service: SudokuService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SudokuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests a sudoku puzzle with the given difficulty', () => {
    const mockResponse = {
      puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
      difficulty: Difficulty.Medium
    };

    service.getSudokuPuzzle(Difficulty.Medium).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}?difficulty=${Difficulty.Medium}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('rejects malformed puzzle responses', () => {
    let errorMessage = '';
    spyOn(console, 'error');

    service.getSudokuPuzzle(Difficulty.Easy).subscribe({
      error: error => {
        errorMessage = error.message;
      }
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}?difficulty=${Difficulty.Easy}`
    );
    req.flush({ puzzle: [[0]], difficulty: Difficulty.Easy });

    expect(errorMessage).toBe('An error occurred while fetching the puzzle. Please try again.');
  });
});
