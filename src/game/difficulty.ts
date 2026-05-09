import { PIPE_GAP, PIPE_SPEED } from './constants';

const STARTING_DIFFICULTY_LEVEL = 1;
const SCORE_PER_DIFFICULTY_LEVEL = 3;
const MAX_DIFFICULTY_LEVEL = 8;
const DIFFICULTY_TUNING_MULTIPLIER = 3;
const PIPE_SPEED_STEP = 15;
const PIPE_GAP_STEP = 6;
const MIN_PIPE_GAP = 140;
const BASE_PIPE_SPAWN_DELAY_MS = 1450;
const PIPE_SPAWN_DELAY_STEP_MS = 55;
const MIN_PIPE_SPAWN_DELAY_MS = 1000;

export function getDifficultyLevel(score: number): number {
  return Math.min(
    STARTING_DIFFICULTY_LEVEL + Math.floor(score / SCORE_PER_DIFFICULTY_LEVEL),
    MAX_DIFFICULTY_LEVEL,
  );
}

export function getPipeSpeed(score: number): number {
  return PIPE_SPEED - getDifficultyLevel(score) * PIPE_SPEED_STEP * DIFFICULTY_TUNING_MULTIPLIER;
}

export function getPipeGap(score: number): number {
  return Math.max(PIPE_GAP - getDifficultyLevel(score) * PIPE_GAP_STEP * DIFFICULTY_TUNING_MULTIPLIER, MIN_PIPE_GAP);
}

export function getPipeSpawnDelay(score: number): number {
  return Math.max(
    BASE_PIPE_SPAWN_DELAY_MS - getDifficultyLevel(score) * PIPE_SPAWN_DELAY_STEP_MS * DIFFICULTY_TUNING_MULTIPLIER,
    MIN_PIPE_SPAWN_DELAY_MS,
  );
}
