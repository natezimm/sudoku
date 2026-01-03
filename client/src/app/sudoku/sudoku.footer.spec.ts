import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SudokuComponent } from './sudoku.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { SudokuService } from '../sudoku.service';
import { StatsService } from './stats.service';
import { GameStorageService } from './game-storage.service';
import { ThemeService } from '../theme.service';
import { Difficulty } from './sudoku.interface';

// Minimal stubs to satisfy the component's dependencies
const sudokuServiceStub = {
    getSudokuPuzzle: () => of({ puzzle: [] })
};

const statsServiceStub = {
    getStats: () => ({
        [Difficulty.Easy]: { gamesCompleted: 0, fastestTime: null },
        [Difficulty.Medium]: { gamesCompleted: 0, fastestTime: null },
        [Difficulty.Hard]: { gamesCompleted: 0, fastestTime: null }
    })
};

const gameStorageServiceStub = {
    load: () => null,
    save: () => { },
    clear: () => { }
};

const themeServiceStub = {
    isDarkMode: false
};

describe('SudokuComponent Footer', () => {
    let component: SudokuComponent;
    let fixture: ComponentFixture<SudokuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SudokuComponent],
            providers: [
                { provide: SudokuService, useValue: sudokuServiceStub },
                { provide: StatsService, useValue: statsServiceStub },
                { provide: GameStorageService, useValue: gameStorageServiceStub },
                { provide: ThemeService, useValue: themeServiceStub }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA] // Ignore other child components like app-header, app-grid
        }).compileComponents();

        fixture = TestBed.createComponent(SudokuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should render the footer with "Made by" text and "Nathan Zimmerman" link', () => {
        const footerElement = fixture.nativeElement.querySelector('.app-footer');
        expect(footerElement).toBeTruthy();
        expect(footerElement.textContent).toContain('Made by');

        const linkElement = footerElement.querySelector('a');
        expect(linkElement).toBeTruthy();
        expect(linkElement.textContent).toContain('Nathan Zimmerman');
        expect(linkElement.textContent).not.toContain('Made by');
        expect(linkElement.getAttribute('href')).toBe('https://nathanzimmerman.com');
    });
});
