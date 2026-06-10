export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export interface SudokuPuzzleResponse {
  puzzle: number[][];
  difficulty: Difficulty;
}

export enum MessageType {
  Welcome = 'welcome',
  DifficultyChange = 'difficultyChange',
  Success = 'success',
  Failure = 'failure',
  ClearInput = 'clearInput',
  Progress = 'progress',
  Unknown = 'unknown'
}
