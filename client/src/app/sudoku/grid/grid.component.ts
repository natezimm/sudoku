import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent {
  @Input() puzzle: number[][] = [];
  @Input() userInput: (number | null)[][] = [];
  @Input() gridId: number = 1; // Unique ID for each grid
}