import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridComponent } from './grid.component';

describe('GridComponent', () => {
  let component: GridComponent;
  let fixture: ComponentFixture<GridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridComponent);
    component = fixture.componentInstance;
    component.puzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
    component.userInput = Array.from({ length: 9 }, () => Array(9).fill(null));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits change events when a cell changes', () => {
    let emitted = false;
    component.cellChange.subscribe(() => (emitted = true));

    component.onCellChange();
    expect(emitted).toBeTrue();
  });

  it('applies error flags only when highlighting is enabled', () => {
    component.highlightErrors = false;
    expect(component.isCellIncorrect(0, 0)).toBeFalse();
    expect(component.isRowIncorrect(0)).toBeFalse();
    expect(component.isColIncorrect(0)).toBeFalse();
    expect(component.isBoxIncorrect(0, 0)).toBeFalse();
    expect(component.getCellClasses(0, 0)).toEqual({
      incorrect: false,
      'error-row': false,
      'error-col': false,
      'error-box': false
    });

    component.highlightErrors = true;
    component.incorrectCells = [{ row: 0, col: 1 }];
    component.incorrectRows[0] = true;
    component.incorrectCols[1] = true;
    component.incorrectBoxes[0] = true;

    expect(component.isCellIncorrect(0, 1)).toBeTrue();
    expect(component.isRowIncorrect(0)).toBeTrue();
    expect(component.isColIncorrect(1)).toBeTrue();
    expect(component.isBoxIncorrect(0, 1)).toBeTrue();

    const classes = component.getCellClasses(0, 1);
    expect(classes['incorrect']).toBeTrue();
    expect(classes['error-row']).toBeTrue();
    expect(classes['error-col']).toBeTrue();
    expect(classes['error-box']).toBeTrue();
  });
});
