// src/hooks/useGameLogic.ts
import { useReducer, useEffect, useCallback, useState } from 'react';
import { GameState, GameAction, Block } from '../types';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  createEmptyBoard,
  randomTetromino,
  isValidPosition,
  rotateBlock,
  mergeBlockToBoard,
  clearLines,
  calculateScore,
  calculateLevel,
  calculateDropTime,
  NEXT_QUEUE_SIZE,
  getInitialPosition, // 初期位置計算関数をインポート
} from '../utils';

// Nextキューを初期化する関数
const initializeNextBlocks = (): Block[] => {
    return Array.from({ length: NEXT_QUEUE_SIZE }, () => randomTetromino());
};

// ゲーム状態の初期値
const initialBlocks = initializeNextBlocks();
const initialState: GameState = {
  grid: createEmptyBoard(),
  currentBlock: initialBlocks[0], // 最初のブロック
  nextBlocks: initialBlocks.slice(1), // 残りのブロックをキューに
  heldBlock: null,
  canHold: true,
  score: 0,
  level: 1,
  lines: 0,
  isGameOver: false,
  isPaused: true, // 初期状態は一時停止
};


// ゲーム状態を更新するリデューサー
const gameReducer = (state: GameState, action: GameAction): GameState => {
  // ゲームオーバーまたは一時停止中は特定の操作のみ許可
  if (state.isGameOver && action.type !== 'RESTART') {
    return state;
  }
   if (state.isPaused && !['RESUME', 'RESTART', 'PAUSE'].includes(action.type) && !(action.type === 'TICK' && !state.isGameOver)) {
       return state;
   }

  switch (action.type) {
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

    case 'MOVE_DOWN': {
        const newBlock = {
            ...state.currentBlock,
            position: { ...state.currentBlock.position, y: state.currentBlock.position.y + 1 },
        };

        if (isValidPosition(newBlock, state.grid)) {
            // 下に移動できる場合
            return { ...state, currentBlock: newBlock };
        } else {
            // 下に移動できない場合 (ブロック固定処理)
            let fixedGrid = mergeBlockToBoard(state.currentBlock, state.grid);
            const { newBoard, linesCleared } = clearLines(fixedGrid);

            let newScore = state.score;
            let newLines = state.lines;
            let newLevel = state.level;

            if (linesCleared > 0) {
                newLines = state.lines + linesCleared;
                newLevel = calculateLevel(newLines);
                newScore = state.score + calculateScore(linesCleared, newLevel); // レベルは新しいレベルで計算
            }

            // 次のブロックを準備
            const nextCurrentBlock = state.nextBlocks[0];
            const remainingNextBlocks = state.nextBlocks.slice(1);
            const newNextBlocks = [...remainingNextBlocks, randomTetromino()]; // 新しいブロックをキューに追加

             // 新しいブロックが配置可能かチェック (ゲームオーバー判定)
             const isGameOver = !isValidPosition(nextCurrentBlock, newBoard);

            return {
                ...state,
                grid: newBoard,
                currentBlock: { // 新しいブロックの位置をリセット
                    ...nextCurrentBlock,
                    position: getInitialPosition(nextCurrentBlock.type)
                },
                nextBlocks: newNextBlocks,
                score: newScore,
                level: newLevel,
                lines: newLines,
                isGameOver: isGameOver,
                isPaused: isGameOver ? true : state.isPaused, // ゲームオーバーなら一時停止
                canHold: true, // ブロック固定時にホールド可能にする
            };
        }
    }


    case 'ROTATE': {
      const rotatedBlock = rotateBlock(state.currentBlock);
      let newBlock = rotatedBlock;

      // 回転後の位置をチェックし、必要ならずらす (Wall Kick)
      if (!isValidPosition(rotatedBlock, state.grid)) {
        // 左右に1マス、2マスずらして試す (基本的なWall Kick)
        const adjustments = [1, -1, 2, -2];
        for (const dx of adjustments) {
          const adjustedBlock = {
            ...rotatedBlock,
            position: { ...rotatedBlock.position, x: rotatedBlock.position.x + dx },
          };
          if (isValidPosition(adjustedBlock, state.grid)) {
            newBlock = adjustedBlock;
            break; // 有効な位置が見つかったらループを抜ける
          }
           // 上下にずらす試行も追加可能 (より高度なWall Kick)
            // const dy = 1; // 例えば下に1マス
            // const adjustedBlockY = {
            //   ...rotatedBlock,
            //   position: { ...rotatedBlock.position, y: rotatedBlock.position.y + dy },
            // };
            // if (isValidPosition(adjustedBlockY, state.grid)) {
            //      newBlock = adjustedBlockY;
            //      break;
            // }
        }
      }

       // 最終的に有効な位置が見つかれば更新
        if (isValidPosition(newBlock, state.grid)) {
            return { ...state, currentBlock: newBlock };
        }

      return state; // 回転も移動もできなければ状態はそのまま
    }

    case 'HARD_DROP': {
      let newY = state.currentBlock.position.y;
      let testBlock = { ...state.currentBlock };

      // ブロックが着地するまで下に移動できるかチェック
      while (
        isValidPosition(
          { ...testBlock, position: { ...testBlock.position, y: newY + 1 } },
          state.grid
        )
      ) {
        newY++;
      }

      const landedBlock = {
        ...state.currentBlock,
        position: { ...state.currentBlock.position, y: newY },
      };

      // ブロックを固定して次のブロックを生成 (MOVE_DOWNの固定処理と類似)
       let fixedGrid = mergeBlockToBoard(landedBlock, state.grid);
       const { newBoard, linesCleared } = clearLines(fixedGrid);

       let newScore = state.score;
       let newLines = state.lines;
       let newLevel = state.level;

       // ハードドロップによるスコア加算 (例: 落下マス数 * 2)
       const hardDropBonus = (newY - state.currentBlock.position.y) * 2;
       newScore += hardDropBonus;

       if (linesCleared > 0) {
           newLines = state.lines + linesCleared;
           newLevel = calculateLevel(newLines);
           newScore += calculateScore(linesCleared, newLevel); // ライン消去スコアも加算
       }

       const nextCurrentBlock = state.nextBlocks[0];
       const remainingNextBlocks = state.nextBlocks.slice(1);
       const newNextBlocks = [...remainingNextBlocks, randomTetromino()];

       const isGameOver = !isValidPosition(nextCurrentBlock, newBoard);

       return {
           ...state,
           grid: newBoard,
           currentBlock: { // 新しいブロックの位置をリセット
                ...nextCurrentBlock,
                position: getInitialPosition(nextCurrentBlock.type)
            },
           nextBlocks: newNextBlocks,
           score: newScore,
           level: newLevel,
           lines: newLines,
           isGameOver: isGameOver,
           isPaused: isGameOver ? true : state.isPaused,
           canHold: true, // ハードドロップ後もホールド可能
       };
    }

    case 'HOLD': {
      if (!state.canHold) {
        return state; // 既にホールド済みなら何もしない
      }

      let newCurrentBlock: Block;
      let newHeldBlock = state.currentBlock; // 現在のブロックをホールドへ

      if (state.heldBlock) {
        // ホールド中のブロックがあればそれを現在のブロックにする
        newCurrentBlock = state.heldBlock;
      } else {
        // ホールドが空なら、Nextから新しいブロックを取得
        newCurrentBlock = state.nextBlocks[0];
        const remainingNextBlocks = state.nextBlocks.slice(1);
        state.nextBlocks = [...remainingNextBlocks, randomTetromino()]; // nextキューも更新
      }

      // 新しいカレントブロックの初期位置を設定
      newCurrentBlock.position = getInitialPosition(newCurrentBlock.type);

       // 新しいブロックが配置可能かチェック (ホールド直後にゲームオーバーになるケース)
       const isImmediatelyGameOver = !isValidPosition(newCurrentBlock, state.grid);
       if (isImmediatelyGameOver) {
            return {
                ...state,
                isGameOver: true,
                isPaused: true,
                heldBlock: newHeldBlock, // ホールドは実行する
                canHold: false,
            };
       }

      return {
        ...state,
        currentBlock: newCurrentBlock,
        heldBlock: newHeldBlock,
        canHold: false, // ホールド後は次のブロック固定までホールド不可
      };
    }


    case 'PAUSE':
      return { ...state, isPaused: true };

    case 'RESUME':
      // ゲームオーバー時は再開できない
      if (state.isGameOver) return state;
      return { ...state, isPaused: false };

    case 'RESTART':
      const newInitialBlocks = initializeNextBlocks();
      return {
          ...initialState,
          grid: createEmptyBoard(),
          currentBlock: newInitialBlocks[0],
          nextBlocks: newInitialBlocks.slice(1),
          isPaused: false, // リスタート時はゲーム開始
      };


    case 'TICK':
      // ゲームが一時停止中またはゲームオーバーの場合は何もしない
      if (state.isPaused || state.isGameOver) {
        return state;
      }
      // 下に移動（MOVE_DOWNと同じロジックを再利用）
      return gameReducer(state, { type: 'MOVE_DOWN' });


    default:
      // 未知のアクションタイプの場合は状態を変更しない
       // console.warn('Unknown action type:', (action as any).type);
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
