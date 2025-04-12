// ブロックの位置を表す型
export interface Position {
  x: number;
  y: number;
}

// ブロックを表す型
export interface Block {
  shape: number[][];  // ブロックの形状（2次元配列）
  position: Position; // ブロックの現在位置
  type: number;       // ブロックの種類（1-7）
}

// ゲームの状態を表す型
export interface GameState {
  grid: number[][];    // ゲームボードの状態（0: 空, 1-7: ブロックの種類）
  currentBlock: Block; // 現在操作中のブロック
  nextBlock: Block;    // 次に出現するブロック
  score: number;       // 現在のスコア
  level: number;       // 現在のレベル
  lines: number;       // 消去したライン数
  isGameOver: boolean; // ゲームオーバー状態
  isPaused: boolean;   // 一時停止状態
}

// ゲームアクションの型
export type GameAction =
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'MOVE_DOWN' }
  | { type: 'ROTATE' }
  | { type: 'HARD_DROP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'TICK' };
