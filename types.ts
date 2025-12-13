
export interface Question {
  id: string;
  value: number;
  question: string;
  answer: string;
  scripture: string;
  isAnswered: boolean;
}

export interface Category {
  id: string;
  name: string;
  questions: Question[];
}

export interface GameBoardData {
  id?: string; // Optional ID for custom games
  title?: string; // Optional title for custom games
  categories: Category[];
  round: 1 | 2;
}

export interface FullGameData {
  round1: GameBoardData;
  round2?: GameBoardData; // Optional, can be generated later
  final: FinalJeopardyQuestion;
}

export interface FinalJeopardyQuestion {
  category: string;
  question: string;
  answer: string;
  scripture?: string;
}

export interface PresetMetadata {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji char
  isCustom?: boolean; // Flag for user-created packs
  hasTwoRounds?: boolean;
}

export enum GameState {
  START = 'START',
  LOADING = 'LOADING',
  LOBBY = 'LOBBY',
  LIBRARY = 'LIBRARY',
  CREATOR = 'CREATOR', 
  PLAYING = 'PLAYING',
  ROUND_TRANSITION = 'ROUND_TRANSITION',
  FINAL_JEOPARDY = 'FINAL_JEOPARDY',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR'
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'AI' | 'PRESET';
export type AppMode = 'MENU' | 'HOST' | 'CONTROLLER';
export type Topic = 'GENERAL' | 'JESUS' | 'PROPHECY' | 'HISTORY' | 'PERSONALITIES' | 'FRUITAGE' | 'MEETING';
export type VisualMode = 'CLASSIC' | 'NEON' | 'ANCIENT';

export interface Avatar {
  id: string;
  name: string;
  color: string;
  icon: string; // Emoji or URL
}

export interface Team {
  id: string;
  name: string;
  avatar: Avatar; 
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export interface QuestionRecord {
  questionId: string;
  category: string;
  question: string;
  answer: string;
  scripture: string;
  value: number;
  winnerTeamId: string | null; 
  wrongTeamIds: string[]; 
}

export interface NetworkMessage {
  type: 'JOIN' | 'BUZZ' | 'GAME_STATE' | 'SCORE_UPDATE' | 'QUESTION_OPEN' | 'QUESTION_CLOSE' | 'GAME_OVER' | 'BUZZER_STATUS' | 'FJ_UPDATE' | 'ADMIN_ACTION' | 'FJ_WAGER' | 'SCORE_EDIT';
  payload?: any;
  teamId?: string;
  teamName?: string;
  avatar?: Avatar;
  action?: 'REVEAL' | 'SCORE_ADD' | 'SCORE_SUB' | 'CLOSE' | 'CLEAR_BUZZER' | 'FJ_REVEAL' | 'FJ_SCORING' | 'FJ_FINISH' | 'TOGGLE_MUSIC' | 'RESTART_GAME' | 'SCORE_EDIT';
}
