import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InfoPanel from './InfoPanel';
import type { GameState } from '../types';
import '@testing-library/jest-dom';

// Helper to create a minimal game state for testing
const createGameState = (overrides: Partial<GameState>): GameState => ({
  grid: [[]],
  currentBlock: { shape: [[]], position: { x: 0, y: 0 }, type: 1 },
  nextBlocks: [],
  heldBlock: null,
  canHold: true,
  score: 0,
  level: 1,
  lines: 0,
  isGameOver: false,
  isPaused: false,
  currentBag: [],
  nextBag: [],
  ...overrides,
});

describe('InfoPanel', () => {
  it('renders stats', () => {
    const gameState = createGameState({ score: 10, level: 2, lines: 3 });
    render(<InfoPanel gameState={gameState} />);
    expect(screen.getByText('スコア')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('レベル')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('ライン')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows game over message', () => {
    const gameState = createGameState({ isGameOver: true });
    render(<InfoPanel gameState={gameState} />);
    expect(screen.getByText('ゲームオーバー')).toBeInTheDocument();
    expect(screen.getByText('Rキーでリスタート')).toBeInTheDocument();
  });

  it('shows paused message', () => {
    const gameState = createGameState({ isPaused: true });
    render(<InfoPanel gameState={gameState} />);
    expect(screen.getByText('一時停止中')).toBeInTheDocument();
    expect(screen.getByText('Pキーで再開')).toBeInTheDocument();
  });
});

