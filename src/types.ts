// src/types.ts
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
  grid: number[][];       // ゲームボードの状態（0: 空, 1-7: ブロックの種類, 8: ゴースト）
  currentBlock: Block;    // 現在操作中のブロック
  nextBlocks: Block[];    // 次に出現するブロックのキュー (5個)
  heldBlock: Block | null; // ホールド中のブロック
  canHold: boolean;       // 現在のターンでホールド可能か
  score: number;          // 現在のスコア
  level: number;          // 現在のレベル
  lines: number;          // 消去したライン数
  isGameOver: boolean;    // ゲームオーバー状態
  isPaused: boolean;      // 一時停止状態
  // --- 7-bag randomizer 用の状態 ---
  currentBag: number[];   // 現在使用中のブロック種類IDの袋
  nextBag: number[];      // 次に使用するブロック種類IDの袋
  // ---------------------------------
}

// ゲームアクションの型
export type GameAction =
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'MOVE_DOWN' }
  | { type: 'ROTATE' } // 時計回り (Clockwise)
  | { type: 'ROTATE_COUNTER_CLOCKWISE' } // ★ 反時計回り (Counter-Clockwise)
  | { type: 'HARD_DROP' }
  | { type: 'HOLD' } // ホールドアクション
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'TICK' };
