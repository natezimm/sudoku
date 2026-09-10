import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridComponent } from './grid.component';

describe('GridComponent', () => {
  let component: GridComponent;
  let fixture: ComponentFixture<GridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridComponent],
    }).compileComponents();

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

  it('renders cells in row order so keyboard and visual coordinates agree', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.input-cell');
    expect(inputs.length).toBe(81);
    expect(inputs[2].getAttribute('aria-label')).toBe('Row 1, Column 3');
    expect(inputs[9].getAttribute('aria-label')).toBe('Row 2, Column 1');
    expect(inputs[80].getAttribute('aria-label')).toBe('Row 9, Column 9');
  });

  it('highlights the selected cell and its row, column, and box', () => {
    const selections: ({ row: number; col: number } | null)[] = [];
    component.selectionChange.subscribe((selection) =>
      selections.push(selection)
    );

    component.selectCell(1, 1);
    expect(component.isSelected(1, 1)).toBeTrue();
    expect(component.isPeer(1, 8)).toBeTrue();
    expect(component.isPeer(8, 1)).toBeTrue();
    expect(component.isPeer(2, 2)).toBeTrue();
    expect(component.isPeer(4, 4)).toBeFalse();
    expect(component.isPeer(1, 1)).toBeFalse();
    expect(component.cellTabIndex(1, 1)).toBe(0);
    expect(component.cellTabIndex(0, 0)).toBe(-1);

    component.clearSelection();
    expect(selections).toEqual([{ row: 1, col: 1 }, null]);
    expect(component.isPeer(1, 1)).toBeFalse();
    expect(component.cellTabIndex(0, 0)).toBe(0);
  });

  it('enters and erases keypad values while returning focus to the selected cell', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[aria-label="Row 1, Column 3"]'
    );
    const change = spyOn(component.cellChange, 'emit');
    input.focus();

    component.enterNumber(4);
    fixture.detectChanges();
    expect(component.userInput[0][2]).toBe(4);
    expect(input.value).toBe('4');
    expect(document.activeElement).toBe(input);

    component.enterNumber(null);
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(change).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid text and keypad values', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[aria-label="Row 1, Column 1"]'
    );
    input.focus();
    component.enterNumber(7);
    fixture.detectChanges();

    for (const value of ['0', 'x', '23']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      expect(input.value).toBe('7');
    }
    for (const value of [0, 10, 1.5]) component.enterNumber(value);
    expect(component.userInput[0][0]).toBe(7);

    input.value = '3';
    input.dispatchEvent(new Event('input'));
    expect(component.userInput[0][0]).toBe(3);
  });

  it('moves by visual coordinates through given cells and stops at board edges', () => {
    component.puzzle[1][1] = 6;
    fixture.detectChanges();
    const cell = (row: number, col: number): HTMLElement =>
      fixture.nativeElement.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
      );
    const press = (key: string) => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      );
      fixture.detectChanges();
    };
    cell(0, 1).focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(cell(1, 1));
    expect(component.selectedCell).toEqual({ row: 1, col: 1 });
    press('ArrowLeft');
    expect(document.activeElement).toBe(cell(1, 0));
    press('ArrowUp');
    press('ArrowLeft');
    expect(document.activeElement).toBe(cell(0, 0));
    press('ArrowRight');
    expect(document.activeElement).toBe(cell(0, 1));
  });

  it('supports digit keys and deletion without accepting other characters', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[aria-label="Row 1, Column 1"]'
    );
    input.focus();
    const press = (key: string) => {
      const event = new KeyboardEvent('keydown', {
        key,
        cancelable: true,
      });
      input.dispatchEvent(event);
      return event;
    };

    press('9');
    expect(component.userInput[0][0]).toBe(9);
    expect(press('x').defaultPrevented).toBeTrue();
    expect(component.userInput[0][0]).toBe(9);
    press('Delete');
    expect(component.userInput[0][0]).toBeNull();
    press('3');
    press('Backspace');
    expect(component.userInput[0][0]).toBeNull();
    expect(press('Tab').defaultPrevented).toBeFalse();
  });

  it('protects givens and paused or read-only games from keypad changes', () => {
    component.enterNumber(5);
    expect(component.userInput[0][0]).toBeNull();
    component.selectCell(0, 0);
    component.puzzle[0][0] = 8;
    component.enterNumber(5);
    expect(component.userInput[0][0]).toBeNull();

    component.selectCell(0, 1);
    component.isPaused = true;
    component.enterNumber(5);
    component.selectCell(0, 2);
    expect(component.userInput[0][1]).toBeNull();
    expect(component.selectedCell).toEqual({ row: 0, col: 1 });
    expect(component.isSelected(0, 1)).toBeFalse();
    expect(component.isPeer(0, 2)).toBeFalse();
    expect(component.cellTabIndex(0, 1)).toBe(-1);

    component.isPaused = false;
    component.isReadOnly = true;
    component.enterNumber(5);
    expect(component.userInput[0][1]).toBeNull();
    fixture.detectChanges();
    const given: HTMLButtonElement =
      fixture.nativeElement.querySelector('.non-input');
    expect(given.disabled).toBeTrue();
    expect(given.textContent?.trim()).toBe('8');
    expect(fixture.nativeElement.querySelector('.paused')).toBeNull();
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
      'error-box': false,
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
