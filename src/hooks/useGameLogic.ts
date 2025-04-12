// src/hooks/useGameLogic.ts

import { useReducer, useEffect, useCallback, useState } from 'react';
import { GameState, GameAction, Block } from '../types';
import {
  createEmptyBoard,
  isValidPosition,
  rotateBlock,
  mergeBlockToBoard,
  clearLines,
  calculateScore,
  calculateLevel,
  calculateDropTime,
  NEXT_QUEUE_SIZE,
  getInitialPosition,
  generateShuffledBag,
  createBlockByType,
} from '../utils';

// --- 初期状態生成ヘルパー ---
const generateInitialGameState = (): GameState => {
  let currentBag = generateShuffledBag();
  let nextBag = generateShuffledBag();

  const getNextTypeIdAndUpdateBags = (): number => {
    if (currentBag.length === 0) {
      currentBag = nextBag;
      nextBag = generateShuffledBag();
    }
    return currentBag.shift()!;
  };

  const initialCurrentBlockType = getNextTypeIdAndUpdateBags();
  const initialCurrentBlock = createBlockByType(initialCurrentBlockType);

  const initialNextBlocks: Block[] = [];
  for (let i = 0; i < NEXT_QUEUE_SIZE; i++) {
    const nextType = getNextTypeIdAndUpdateBags();
    initialNextBlocks.push(createBlockByType(nextType));
  }

  return {
    grid: createEmptyBoard(),
    currentBlock: initialCurrentBlock,
    nextBlocks: initialNextBlocks, // <- Typo修正: nextBlocks
    heldBlock: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isPaused: true,
    currentBag: currentBag,
    nextBag: nextBag,
  };
};

// ゲーム状態の初期値
const initialState: GameState = generateInitialGameState();

// --- 袋から次のブロックを取得し、状態を更新するヘルパー関数 ---
const getNextBlockAndUpdateState = (currentState: GameState): { nextBlock: Block; updatedState: GameState } => {
  let updatedCurrentBag = [...currentState.currentBag];
  let updatedNextBag = [...currentState.nextBag];

  if (updatedCurrentBag.length === 0) {
    updatedCurrentBag = updatedNextBag;
    updatedNextBag = generateShuffledBag();
  }
  const nextTypeId = updatedCurrentBag.shift()!;
  const nextBlock = createBlockByType(nextTypeId);

  const updatedState = {
    ...currentState,
    currentBag: updatedCurrentBag,
    nextBag: updatedNextBag,
  };

  return { nextBlock, updatedState };
};

const processBlockLocking = (
  state: GameState,
  lockedBlock: Block, // 固定されるブロックの情報
  hardDropDistance: number = 0 // ハードドロップで落下した距離 (0なら通常落下/ソフトドロップ)
): GameState => {
  // 1. グリッドにブロックをマージ
  let fixedGrid = mergeBlockToBoard(lockedBlock, state.grid);
  // 2. ライン消去処理
  const { newBoard, linesCleared } = clearLines(fixedGrid);

  // 3. スコア・レベル・ライン数計算
  let newScore = state.score;
  let newLines = state.lines;
  let newLevel = state.level;

  // ハードドロップボーナスを加算 (落下距離に基づいて)
  if (hardDropDistance > 0) {
    // 例: 落下したマス数 * 2点
    newScore += hardDropDistance * 2;
  }

  if (linesCleared > 0) {
    newLines = state.lines + linesCleared;
    newLevel = calculateLevel(newLines);
    // ライン消去スコアを加算 (新しいレベルで計算)
    newScore += calculateScore(linesCleared, newLevel);
    console.log(`Lines Cleared: ${linesCleared}, Total Lines: ${newLines}, New Level: ${newLevel}`);
  } else {
    // console.log("No lines cleared."); // 必要ならログ表示
  }

  // 4. 次のブロック準備 (袋からの取得 & キュー更新)
  const nextCurrentBlockFromQueue = state.nextBlocks[0]; // キューの先頭を取得
  // 袋から新しいブロックIDを取得し、袋の状態も更新
  const { nextBlock: newBlockForQueue, updatedState: stateAfterBagUpdate } = getNextBlockAndUpdateState(state);
  // 新しいNextキューを作成
  const newNextBlocksQueue = [...state.nextBlocks.slice(1), newBlockForQueue];

  // 5. 次のカレントブロック生成 (初期位置にリセット)
  const nextCurrentBlock = {
    ...nextCurrentBlockFromQueue,
    position: getInitialPosition(nextCurrentBlockFromQueue.type)
  };

  // 6. ゲームオーバー判定 (新しいボードと次のブロックで判定)
  const isGameOver = !isValidPosition(nextCurrentBlock, newBoard);

  // 7. 新しい状態オブジェクトを構築して返す
  return {
    ...stateAfterBagUpdate, // 袋の状態が更新された state をベースに
    grid: newBoard,
    currentBlock: nextCurrentBlock,
    nextBlocks: newNextBlocksQueue,
    score: newScore,
    level: newLevel,
    lines: newLines,
    isGameOver: isGameOver,
    isPaused: isGameOver ? true : state.isPaused, // ゲームオーバーなら一時停止
    canHold: true, // 固定後はホールド可能にリセット
    // heldBlock はこの関数では変更しない
  };
};

// ゲーム状態を更新するリデューサー
const gameReducer = (state: GameState, action: GameAction): GameState => {
  // --- ガード節 ---
  if (state.isGameOver && action.type !== 'RESTART') { return state; }
  // PAUSEアクション自体は許可する。TICKは別途isPausedを見る。
  if (state.isPaused && !['RESUME', 'RESTART', 'PAUSE'].includes(action.type)) { return state; }
  // ---------------

  switch (action.type) {
    // --- 移動 ---
    case 'MOVE_LEFT': {
      const newBlock = {
        ...state.currentBlock,
        position: { ...state.currentBlock.position, x: state.currentBlock.position.x - 1 },
      };
      if (isValidPosition(newBlock, state.grid)) {
        return { ...state, currentBlock: newBlock };
      }
      return state;
    }
    case 'MOVE_RIGHT': {
      const newBlock = {
        ...state.currentBlock,
        position: { ...state.currentBlock.position, x: state.currentBlock.position.x + 1 },
      };
      if (isValidPosition(newBlock, state.grid)) {
        return { ...state, currentBlock: newBlock };
      }
      return state;
    }
    // --- 回転 ---
    case 'ROTATE': {
      const rotatedBlock = rotateBlock(state.currentBlock);
      let newBlock = rotatedBlock;
      let foundValidPosition = false;

      if (isValidPosition(rotatedBlock, state.grid)) {
        foundValidPosition = true;
      } else {
        const adjustments = [1, -1, 2, -2];
        for (const dx of adjustments) {
          const adjustedBlock = {
            ...rotatedBlock,
            position: { ...rotatedBlock.position, x: rotatedBlock.position.x + dx },
          };
          if (isValidPosition(adjustedBlock, state.grid)) {
            newBlock = adjustedBlock;
            foundValidPosition = true;
            break;
          }
        }
      }

      if (foundValidPosition) {
        return { ...state, currentBlock: newBlock };
      }
      return state;
    }
    // --- 落下 & 固定 ---
    case 'MOVE_DOWN': {
      const newBlockPos = {
        ...state.currentBlock,
        position: { ...state.currentBlock.position, y: state.currentBlock.position.y + 1 },
      };

      if (isValidPosition(newBlockPos, state.grid)) {
        // 下に移動できる場合
        return { ...state, currentBlock: newBlockPos };
      } else {
        // --- ブロック固定処理を呼び出す ---
        // 通常落下なので hardDropDistance は 0 (または省略)
        return processBlockLocking(state, state.currentBlock);
      }
    }
    case 'HARD_DROP': {
      // 着地位置を計算
      let newY = state.currentBlock.position.y;
      let testBlock = { ...state.currentBlock };
      while (isValidPosition({ ...testBlock, position: { ...testBlock.position, y: newY + 1 } }, state.grid)) {
        newY++;
      }
      const landedBlock = { ...state.currentBlock, position: { ...state.currentBlock.position, y: newY } };
      const dropDistance = newY - state.currentBlock.position.y; // 落下距離を計算

      // --- ブロック固定処理を呼び出す (落下距離を渡す) ---
      return processBlockLocking(state, landedBlock, dropDistance);
    }
    case 'HOLD': {
      // (変更なし)
      if (!state.canHold) return state;
      let newCurrentBlock: Block;
      const newHeldBlock = state.currentBlock;
      let stateAfterBagUpdate = state;
      let newNextBlocksQueue = [...state.nextBlocks];
      if (state.heldBlock) { newCurrentBlock = state.heldBlock; }
      else {
        newCurrentBlock = state.nextBlocks[0];
        const { nextBlock: newBlockForQueue, updatedState } = getNextBlockAndUpdateState(state);
        stateAfterBagUpdate = updatedState;
        newNextBlocksQueue = [...state.nextBlocks.slice(1), newBlockForQueue];
      }
      const currentBlockAtInitialPos = { ...newCurrentBlock, position: getInitialPosition(newCurrentBlock.type) };
      const isImmediatelyGameOver = !isValidPosition(currentBlockAtInitialPos, stateAfterBagUpdate.grid);
      if (isImmediatelyGameOver) { /* ...ゲームオーバー処理... */
        return { ...stateAfterBagUpdate, nextBlocks: newNextBlocksQueue, isGameOver: true, isPaused: true, heldBlock: newHeldBlock, canHold: false };
      }
      return { ...stateAfterBagUpdate, currentBlock: currentBlockAtInitialPos, nextBlocks: newNextBlocksQueue, heldBlock: newHeldBlock, canHold: false };
    }
    // --- 追加: 一時停止/再開 ---
    case 'PAUSE':
      // ガード節で isPaused=true の場合は弾かれているはず
      return { ...state, isPaused: true };
    case 'RESUME':
      // ガード節で isPaused=false または isGameOver=true の場合は弾かれているはず
      return { ...state, isPaused: false };
    // --- 修正済み: リスタート ---
    case 'RESTART':
      return generateInitialGameState();
    // --- 修正済み: Tick ---
    case 'TICK':
      // isPaused/isGameOver チェックは不要 (ガード節で処理されるため)
      // if (state.isPaused || state.isGameOver) return state;
      return gameReducer(state, { type: 'MOVE_DOWN' });
    default:
      // 型チェックのために網羅性を確認 (never 型を使うなど)
      // const _: never = action;
      return state;
  }
};

// ゲームロジックを管理するカスタムフック
export const useGameLogic = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [dropTime, setDropTime] = useState<number | null>(null);

  // キー入力の状態は不要になったため削除

  // キーが押された時の処理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // メタキーや修飾キーが押されている場合は無視 (例: Cmd+Rによるリロード防止)
      if (event.metaKey || event.ctrlKey) return;

      // テキスト入力中などはゲーム操作を無効化 (オプション)
      // if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      //     return;
      // }

      // キーリピートによる連続ディスパッチを防ぐ (キーが既に押されているかどうかのチェックは不要)
      // if (keyState[event.key]) return; // この行を削除

      // if (state.isGameOver && event.key !== 'r' && event.key !== 'R') return; // GameOver中はRキーのみ許可
      // if (state.isPaused && event.key !== 'p' && event.key !== 'P' && event.key !== 'r' && event.key !== 'R') return; // Pause中はPとRのみ許可

      let actionDispatched = true; // アクションがディスパッチされたか

      switch (event.key) {
        case 'ArrowLeft':
          if (!state.isPaused) dispatch({ type: 'MOVE_LEFT' });
          break;
        case 'ArrowRight':
          if (!state.isPaused) dispatch({ type: 'MOVE_RIGHT' });
          break;
        case 'ArrowDown':
          if (!state.isPaused) dispatch({ type: 'MOVE_DOWN' });
          // 下キーを押したらドロップタイマーをリセットして即時反応させる（オプション）
          // resetDropTimer();
          break;
        case 'ArrowUp':
          if (!state.isPaused) dispatch({ type: 'ROTATE' });
          break;
        case ' ': // Space
          if (!state.isPaused) dispatch({ type: 'HARD_DROP' });
          break;
        case 'Shift':
        case 'c': // Shift または C キーでホールド
        case 'C':
          if (!state.isPaused) dispatch({ type: 'HOLD' });
          break;
        case 'p':
        case 'P':
          if (state.isPaused && !state.isGameOver) {
            dispatch({ type: 'RESUME' });
          } else if (!state.isPaused) {
            dispatch({ type: 'PAUSE' });
          }
          break;
        case 'r':
        case 'R':
          dispatch({ type: 'RESTART' });
          break;
        default:
          actionDispatched = false; // 対応するキーでなければフラグを下げる
          break;
      }

      // ゲーム操作に関連するキーが押された場合、デフォルトのブラウザ動作（スクロールなど）を抑制
      if (actionDispatched && ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) {
        event.preventDefault();
      }
    },
    [state.isPaused, state.isGameOver, dispatch] // keyStateを依存配列から削除
  );

  // キーが離された時の処理 (キーリピート制御が不要になったため、handleKeyUp自体不要になる場合がある)
  // 必要であれば残す (例: 特定キーを押しっぱなしにする操作)
  // const handleKeyUp = useCallback((event: KeyboardEvent) => {
  //     // 必要ならキー状態を管理
  // }, []);

  // ドロップタイマーを管理する関数
  const updateDropTime = useCallback(() => {
    if (state.isPaused || state.isGameOver) {
      setDropTime(null); // タイマー停止
    } else {
      setDropTime(calculateDropTime(state.level)); // レベルに応じた速度設定
    }
  }, [state.isPaused, state.isGameOver, state.level]);

  // キーボードイベントリスナーを設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    // window.addEventListener('keyup', handleKeyUp); // 不要なら削除
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // window.removeEventListener('keyup', handleKeyUp); // 不要なら削除
    };
  }, [handleKeyDown]); // handleKeyUpを削除

  // isPaused, isGameOver, level の変化に応じてドロップ時間を更新
  useEffect(() => {
    updateDropTime();
  }, [updateDropTime]);

  // 一定間隔でブロックを落下させる (TICKアクション)
  useEffect(() => {
    if (!dropTime || state.isPaused || state.isGameOver) {
      return; // タイマーがnull、一時停止中、ゲームオーバーなら何もしない
    }

    const intervalId = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, dropTime);

    // クリーンアップ関数: コンポーネントのアンマウント時やdropTime変更時にインターバルをクリア
    return () => clearInterval(intervalId);
  }, [dropTime, state.isPaused, state.isGameOver, dispatch]); // dispatchも依存配列に追加

  return {
    state,
    dispatch,
    // resetDropTimer, // 不要になった、または別の方法で実装
  };
};
