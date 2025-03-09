import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SudokuComponent } from './sudoku/sudoku.component';

export const routes: Routes = [
  { path: '', redirectTo: '/sudoku', pathMatch: 'full' },
  { path: 'sudoku', component: SudokuComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }