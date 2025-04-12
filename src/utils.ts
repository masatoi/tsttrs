import { Block, Position } from './types';

// ゲームボードのサイズ
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// テトロミノの形状定義
export const TETROMINOS: {
  [key: number]: { shape: number[][]; color: string };
} = {
  0: { shape: [[0]], color: '0, 0, 0' },
  1: {
    // I型
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '0, 240, 240', // 水色
  },
  2: {
    // J型
    shape: [
      [0, 0, 0],
      [2, 2, 2],
      [0, 0, 2],
    ],
    color: '0, 0, 240', // 青色
  },
  3: {
    // L型
    shape: [
      [0, 0, 0],
      [3, 3, 3],
      [3, 0, 0],
    ],
    color: '240, 160, 0', // オレンジ色
  },
  4: {
    // O型
    shape: [
      [4, 4],
      [4, 4],
    ],
    color: '240, 240, 0', // 黄色
  },
  5: {
    // S型
    shape: [
      [0, 0, 0],
      [0, 5, 5],
      [5, 5, 0],
    ],
    color: '0, 240, 0', // 緑色
  },
  6: {
    // T型
    shape: [
      [0, 0, 0],
      [6, 6, 6],
      [0, 6, 0],
    ],
    color: '160, 0, 240', // 紫色
  },
  7: {
    // Z型
    shape: [
      [0, 0, 0],
      [7, 7, 0],
      [0, 7, 7],
    ],
    color: '240, 0, 0', // 赤色
  },
};

// ランダムなテトロミノを生成する関数
export const randomTetromino = (): Block => {
  const types = [1, 2, 3, 4, 5, 6, 7];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    shape: TETROMINOS[type].shape,
    position: { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 },
    type,
  };
};

// 空のゲームボードを作成する関数
export const createEmptyBoard = (): number[][] => {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(0)
  );
};

// ブロックが有効な位置にあるかチェックする関数
export const isValidPosition = (
  block: Block,
  board: number[][]
): boolean => {
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      // ブロックのセルが空でない場合
      if (block.shape[y][x] !== 0) {
        const boardX = block.position.x + x;
        const boardY = block.position.y + y;

        // ボード外にはみ出していないか
        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY < 0 ||
          boardY >= BOARD_HEIGHT
        ) {
          return false;
        }

        // 他のブロックと重なっていないか
        if (board[boardY] && board[boardY][boardX] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
};

// ブロックを回転させる関数
export const rotateBlock = (block: Block): Block => {
  // 行列を転置して行を反転することで90度回転
  const newShape = block.shape[0].map((_, index) =>
    block.shape.map((row) => row[index]).reverse()
  );
  
  return {
    ...block,
    shape: newShape,
  };
};

// ブロックをボードに固定する関数
export const mergeBlockToBoard = (
  block: Block,
  board: number[][]
): number[][] => {
  const newBoard = [...board.map((row) => [...row])];
  
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      if (block.shape[y][x] !== 0) {
        const boardY = block.position.y + y;
        const boardX = block.position.x + x;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = block.type;
        }
      }
    }
  }
  
  return newBoard;
};

// 完成したラインを消去する関数
export const clearLines = (
  board: number[][]
): { newBoard: number[][]; linesCleared: number } => {
  let linesCleared = 0;
  const newBoard = board.filter((row) => {
    const isLineFull = row.every((cell) => cell !== 0);
    if (isLineFull) {
      linesCleared++;
      return false;
    }
    return true;
  });

  // 消去したライン数分、新しい空の行を上部に追加
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }

  return { newBoard, linesCleared };
};

// スコアを計算する関数
export const calculateScore = (lines: number, level: number): number => {
  const linePoints = [0, 100, 300, 500, 800];
  return linePoints[lines] * level;
};

// レベルを計算する関数
export const calculateLevel = (lines: number): number => {
  return Math.floor(lines / 10) + 1;
};

// 落下速度を計算する関数（ミリ秒）
export const calculateDropTime = (level: number): number => {
  return Math.max(1000 - (level - 1) * 100, 100);
};
