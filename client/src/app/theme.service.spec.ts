import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
    let service: ThemeService;
    let mockDocument: Document;

    beforeEach(() => {
        // Mock document and local storage
        const store: { [key: string]: string } = {};

        mockDocument = {
            defaultView: {
                matchMedia: jasmine.createSpy('matchMedia').and.returnValue({
                    matches: true, // Simulating system dark mode preference
                    media: '(prefers-color-scheme: dark)',
                    onchange: null,
                    addListener: jasmine.createSpy('addListener'),
                    removeListener: jasmine.createSpy('removeListener'),
                    addEventListener: jasmine.createSpy('addEventListener'),
                    removeEventListener: jasmine.createSpy('removeEventListener'),
                    dispatchEvent: jasmine.createSpy('dispatchEvent'),
                } as MediaQueryList)
            },
            documentElement: {
                classList: {
                    toggle: jasmine.createSpy('toggle'),
                    contains: jasmine.createSpy('contains').and.returnValue(false),
                    add: jasmine.createSpy('add'),
                    remove: jasmine.createSpy('remove'),
                }
            }
        } as unknown as Document;

        spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
        spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
            store[key] = value;
        });

        TestBed.configureTestingModule({
            providers: [
                ThemeService,
                { provide: DOCUMENT, useValue: mockDocument }
            ]
        });
        service = TestBed.inject(ThemeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should default to light mode (false) even if system prefers dark', () => {
        // We intentionally ignored matchMedia in the service
        expect(service.isDarkMode).toBeFalse();
        expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('dark-mode', false);
    });

    it('should toggle theme', () => {
        expect(service.isDarkMode).toBeFalse();
        service.toggle();
        expect(service.isDarkMode).toBeTrue();
        expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('dark-mode', true);
        expect(localStorage.setItem).toHaveBeenCalledWith('sudokuTheme', 'dark');

        service.toggle();
        expect(service.isDarkMode).toBeFalse();
        expect(localStorage.setItem).toHaveBeenCalledWith('sudokuTheme', 'light');
    });

    it('should load from local storage if set', () => {
        (localStorage.getItem as jasmine.Spy).and.returnValue('dark');
        // Re-create service to trigger constructor load
        service = new ThemeService(mockDocument);
        expect(service.isDarkMode).toBeTrue();
    });
});
