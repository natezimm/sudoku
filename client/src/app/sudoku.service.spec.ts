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
    const mockResponse = { puzzle: [[0]] };

    service.getSudokuPuzzle(Difficulty.Medium).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}?difficulty=${Difficulty.Medium}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
