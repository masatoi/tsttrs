// src/utils.ts

import { Block, Position } from './types';

// ゲームボードのサイズ
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const NEXT_QUEUE_SIZE = 5; // Nextキューのサイズ

// テトロミノの形状定義
// ... (TETROMINOSの定義は変更なし) ...
export const TETROMINOS: {
  [key: number]: { shape: number[][]; color: string };
} = {
  0: { shape: [[0]], color: '0, 0, 0' }, // 空白セル
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
      [2, 0, 0], // 左上に寄せる
      [2, 2, 2],
      [0, 0, 0],
    ],
    color: '0, 0, 240', // 青色
  },
  3: {
    // L型
    shape: [
      [0, 0, 3], // 右上に寄せる
      [3, 3, 3],
      [0, 0, 0],
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
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ],
    color: '0, 240, 0', // 緑色
  },
  6: {
    // T型
    shape: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ],
    color: '160, 0, 240', // 紫色
  },
  7: {
    // Z型
    shape: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ],
    color: '240, 0, 0', // 赤色
  },
  8: { shape: [[0]], color: 'rgba(255, 255, 255, 0.2)' } // ゴーストブロック用 (色はCSSで指定するが念のため)
};

// ブロックの初期位置を計算する関数
// ↓↓↓ ここに export を追加 ↓↓↓
export const getInitialPosition = (type: number): Position => {
  // O型とI型は中央揃えのため少し調整
  const shape = TETROMINOS[type].shape;

  // ブロック形状の実際の高さを求める (O型対策)
  let minY = shape.length;
  let maxY = -1;
  shape.forEach((row, y) => {
    if (row.some(cell => cell !== 0)) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  });

  // ブロック形状の実際の幅を求める
  let minX = shape[0].length;
  let maxX = -1;
  shape.forEach(row => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    });
  });
  const blockWidth = maxX - minX + 1;

  // X座標: ボード中央からブロック幅の半分を引く。minXでオフセット調整。
  const initialX = Math.floor((BOARD_WIDTH - blockWidth) / 2) - minX;
  // Y座標: I型など、形状の上部に空白がある場合を考慮 (-minY)
  const initialY = -minY;

  return { x: initialX, y: initialY };
};

// --- 7-bag randomizer 用ヘルパー ---
// Fisher-Yates (Knuth) Shuffle アルゴリズム
const shuffleArray = (array: number[]): number[] => {
  let currentIndex = array.length;
  let randomIndex: number;
  // 元の配列を変更しないようにコピーを作成
  const shuffledArray = [...array];

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex], shuffledArray[currentIndex]];
  }

  return shuffledArray;
};

// 7種類のブロックID (1-7) を含むシャッフルされた配列（袋）を生成する関数
export const generateShuffledBag = (): number[] => {
  const types = [1, 2, 3, 4, 5, 6, 7];
  return shuffleArray(types);
};

// 指定されたタイプのブロックオブジェクトを生成する関数
export const createBlockByType = (type: number): Block => {
  // 不正なタイプが渡された場合のフォールバック (例: T型)
  const validTypes = [1, 2, 3, 4, 5, 6, 7];
  const blockType = validTypes.includes(type) ? type : 6; // T型をデフォルトに

  if (!validTypes.includes(type)) {
    console.warn(`Invalid block type requested: ${type}. Falling back to type 6.`);
  }

  return {
    shape: TETROMINOS[blockType].shape,
    position: getInitialPosition(blockType),
    type: blockType,
  };
};
// ---------------------------------

// 空のゲームボードを作成する関数
export const createEmptyBoard = (): number[][] => {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
};

// ブロックが有効な位置にあるかチェックする関数
export const isValidPosition = (
  block: Block,
  board: number[][],
): boolean => {
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      // ブロックのセルが空でない場合
      if (block.shape[y][x] !== 0) {
        const boardX = block.position.x + x;
        const boardY = block.position.y + y;

        // 1. ボード外にはみ出していないか
        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT // Y座標は >= BOARD_HEIGHT で判定 (0未満は許容するケースがあるため)
        ) {
          return false;
        }

        // 2. 他の固定ブロックと重なっていないか (ボード内かつY>=0 の場合のみチェック)
        //    ※ ゴースト自身を描画する際に他のゴーストセル(8)との衝突は考慮しない
        if (boardY >= 0 && board[boardY]?.[boardX] !== 0 && board[boardY]?.[boardX] !== 8) {
          return false;
        }
      }
    }
  }
  return true;
};

// --- ブロック回転関数 ---
/**
 * ブロックを指定された方向に90度回転させます。
 * O型ブロックは回転しません。
 * @param block 回転させるブロックオブジェクト
 * @param direction 回転方向 (1: 時計回り, -1: 反時計回り)
 * @returns 回転後の新しいブロックオブジェクト
 */
export const rotateBlock = (block: Block, direction: 1 | -1): Block => {
  // O型(タイプ4)は回転しない
  if (block.type === 4) {
    return block;
  }

  const shape = block.shape;
  // 形状データが正方形であることを前提とする (テトリスでは通常そう)
  // もし長方形があり得るなら、より複雑な処理が必要
  const N = shape.length;
  const newShape = Array.from({ length: N }, () => Array(N).fill(0));

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (direction === 1) { // 時計回り (Clockwise)
        // (y, x) -> (x, N - 1 - y)
        newShape[x][N - 1 - y] = shape[y][x];
      } else { // 反時計回り (Counter-Clockwise, direction === -1)
        // (y, x) -> (N - 1 - x, y)
        newShape[N - 1 - x][y] = shape[y][x];
      }
    }
  }

  // 新しい形状でブロックオブジェクトを返す (位置は変更しない)
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
        // グリッド範囲内であり、かつゴーストブロックでない場合のみ固定
        if (
          boardY >= 0 && boardY < BOARD_HEIGHT &&
          boardX >= 0 && boardX < BOARD_WIDTH &&
          newBoard[boardY]?.[boardX] !== 8 // ゴーストセルは上書きしない (オプショナルチェイニングで安全に)
        ) {
          // 既存のブロックがある場合も上書き (ブロック固定時)
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
    // ゴーストセル(8)も含めて、0以外のセルで埋まっているかチェック
    const isLineFull = row.every((cell) => cell !== 0 && cell !== 8);
    if (isLineFull) {
      linesCleared++;
      return false; // この行を削除
    }
    return true; // この行を保持
  });

  // 消去したライン数分、新しい空の行を上部に追加
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }

  return { newBoard, linesCleared };
};

// スコアを計算する関数
export const calculateScore = (lines: number, level: number): number => {
  // T-Spinなどの複雑なスコアは未実装
  const linePoints = [0, 100, 300, 500, 800]; // 1, 2, 3, 4ライン消し
  return linePoints[lines] * level;
};

// レベルを計算する関数
export const calculateLevel = (lines: number): number => {
  return Math.floor(lines / 10) + 1; // 10ラインごとにレベルアップ
};

// 落下速度を計算する関数（ミリ秒）
export const calculateDropTime = (level: number): number => {
  // レベルに応じて指数関数的に速くする例 (上限・下限設定)
  const baseSpeed = 1000;
  const speedMultiplier = 0.85; // レベルごとの速度係数
  const minSpeed = 100; // 最速値

  let dropTime = baseSpeed * Math.pow(speedMultiplier, level - 1);
  return Math.max(dropTime, minSpeed);
};

// ゲームボードのサイズ定数が必要な場合 (utils.ts からインポートするか、ここで定義)
// 例: import { BOARD_WIDTH, BOARD_HEIGHT } from './utils';

/**
 * ブロックのゴースト（落下予測地点）の位置を計算する関数
 * @param block 現在のブロック
 * @param grid 現在のゲーム盤面 (固定されたブロックのみ含む)
 * @returns ゴーストブロックの座標 (Position)
 */
export const calculateGhostPosition = (block: Block, grid: number[][]): Position => {
  let ghostY = block.position.y;
  let testBlock = { ...block };

  // 1マスずつ下に移動して、有効な最後の Y 座標を探す
  while (isValidPosition({ ...testBlock, position: { ...testBlock.position, y: ghostY + 1 } }, grid)) {
    ghostY++;
  }

  return { x: block.position.x, y: ghostY };
};

// ゴーストブロック用のセルタイプを定義 (utils.ts に移動しても良い)
export const GHOST_CELL_TYPE = 8;
