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
} from '../utils';

// ゲーム状態の初期値
const initialState: GameState = {
  grid: createEmptyBoard(),
  currentBlock: randomTetromino(),
  nextBlock: randomTetromino(),
  score: 0,
  level: 1,
  lines: 0,
  isGameOver: false,
  isPaused: true,
};

// ゲーム状態を更新するリデューサー
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'MOVE_LEFT': {
      const newBlock = {
        ...state.currentBlock,
        position: {
          ...state.currentBlock.position,
          x: state.currentBlock.position.x - 1,
        },
      };
      
      if (isValidPosition(newBlock, state.grid)) {
        return {
          ...state,
          currentBlock: newBlock,
        };
      }
      return state;
    }
    
    case 'MOVE_RIGHT': {
      const newBlock = {
        ...state.currentBlock,
        position: {
          ...state.currentBlock.position,
          x: state.currentBlock.position.x + 1,
        },
      };
      
      if (isValidPosition(newBlock, state.grid)) {
        return {
          ...state,
          currentBlock: newBlock,
        };
      }
      return state;
    }
    
    case 'MOVE_DOWN': {
      const newBlock = {
        ...state.currentBlock,
        position: {
          ...state.currentBlock.position,
          y: state.currentBlock.position.y + 1,
        },
      };
      
      if (isValidPosition(newBlock, state.grid)) {
        return {
          ...state,
          currentBlock: newBlock,
        };
      }
      
      // 移動できない場合は、ブロックを固定して次のブロックを生成
      const newGrid = mergeBlockToBoard(state.currentBlock, state.grid);
      const { newBoard, linesCleared } = clearLines(newGrid);
      
      if (linesCleared > 0) {
        const newLines = state.lines + linesCleared;
        const newLevel = calculateLevel(newLines);
        const newScore = state.score + calculateScore(linesCleared, state.level);
        
        return {
          ...state,
          grid: newBoard,
          currentBlock: state.nextBlock,
          nextBlock: randomTetromino(),
          score: newScore,
          level: newLevel,
          lines: newLines,
        };
      }
      
      // 新しいブロックが配置できるかチェック
      const newCurrentBlock = state.nextBlock;
      const isGameOver = !isValidPosition(newCurrentBlock, newBoard);
      
      return {
        ...state,
        grid: newBoard,
        currentBlock: newCurrentBlock,
        nextBlock: randomTetromino(),
        isGameOver: isGameOver,
        isPaused: isGameOver ? true : state.isPaused,
      };
    }
    
    case 'ROTATE': {
      const newBlock = rotateBlock(state.currentBlock);
      
      if (isValidPosition(newBlock, state.grid)) {
        return {
          ...state,
          currentBlock: newBlock,
        };
      }
      
      // 回転後に壁や他のブロックと衝突する場合、位置を調整して再試行
      // 左右に1マスずつ試す
      const adjustments = [-1, 1, -2, 2];
      for (const adjustment of adjustments) {
        const adjustedBlock = {
          ...newBlock,
          position: {
            ...newBlock.position,
            x: newBlock.position.x + adjustment,
          },
        };
        
        if (isValidPosition(adjustedBlock, state.grid)) {
          return {
            ...state,
            currentBlock: adjustedBlock,
          };
        }
      }
      
      return state;
    }
    
    case 'HARD_DROP': {
      let newBlock = { ...state.currentBlock };
      let newY = newBlock.position.y;
      
      // ブロックが着地するまで下に移動
      while (
        isValidPosition(
          {
            ...newBlock,
            position: { ...newBlock.position, y: newY + 1 },
          },
          state.grid
        )
      ) {
        newY++;
      }
      
      newBlock.position.y = newY;
      
      // ブロックを固定して次のブロックを生成
      const newGrid = mergeBlockToBoard(newBlock, state.grid);
      const { newBoard, linesCleared } = clearLines(newGrid);
      
      if (linesCleared > 0) {
        const newLines = state.lines + linesCleared;
        const newLevel = calculateLevel(newLines);
        const newScore = state.score + calculateScore(linesCleared, state.level);
        
        return {
          ...state,
          grid: newBoard,
          currentBlock: state.nextBlock,
          nextBlock: randomTetromino(),
          score: newScore,
          level: newLevel,
          lines: newLines,
        };
      }
      
      // 新しいブロックが配置できるかチェック
      const newCurrentBlock = state.nextBlock;
      const isGameOver = !isValidPosition(newCurrentBlock, newBoard);
      
      return {
        ...state,
        grid: newBoard,
        currentBlock: newCurrentBlock,
        nextBlock: randomTetromino(),
        isGameOver: isGameOver,
        isPaused: isGameOver ? true : state.isPaused,
      };
    }
    
    case 'PAUSE':
      return {
        ...state,
        isPaused: true,
      };
    
    case 'RESUME':
      return {
        ...state,
        isPaused: false,
      };
    
    case 'RESTART':
      return {
        ...initialState,
        isPaused: false,
      };
    
    case 'TICK':
      // ゲームが一時停止中またはゲームオーバーの場合は何もしない
      if (state.isPaused || state.isGameOver) {
        return state;
      }
      
      // 下に移動（MOVE_DOWNと同じロジック）
      return gameReducer(state, { type: 'MOVE_DOWN' });
    
    default:
      return state;
  }
};

// ゲームロジックを管理するカスタムフック
export const useGameLogic = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [dropTime, setDropTime] = useState<number | null>(null);
  
  // キー入力の状態を追跡
  const [keyState, setKeyState] = useState<{ [key: string]: boolean }>({});
  
  // キーが押された時の処理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 既に押されているキーの場合は無視（連続入力防止）
      if (keyState[event.key]) return;
      
      // キーの状態を更新
      setKeyState(prev => ({ ...prev, [event.key]: true }));
      
      if (state.isGameOver) return;
      
      // requestAnimationFrameを使用して描画と同期
      window.requestAnimationFrame(() => {
        switch (event.key) {
          case 'ArrowLeft':
            dispatch({ type: 'MOVE_LEFT' });
            break;
          case 'ArrowRight':
            dispatch({ type: 'MOVE_RIGHT' });
            break;
          case 'ArrowDown':
            dispatch({ type: 'MOVE_DOWN' });
            break;
          case 'ArrowUp':
            dispatch({ type: 'ROTATE' });
            break;
          case ' ':
            dispatch({ type: 'HARD_DROP' });
            break;
          case 'p':
          case 'P':
            if (state.isPaused) {
              dispatch({ type: 'RESUME' });
            } else {
              dispatch({ type: 'PAUSE' });
            }
            break;
          case 'r':
          case 'R':
            dispatch({ type: 'RESTART' });
            break;
        }
      });
    },
    [state.isGameOver, state.isPaused, keyState, dispatch]
  );
  
  // キーが離された時の処理
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // キーの状態を更新
      setKeyState(prev => ({ ...prev, [event.key]: false }));
    },
    []
  );
  
  // ドロップタイマーを管理する関数
  const startDropTimer = useCallback(() => {
    if (state.isPaused || state.isGameOver) {
      setDropTime(null);
      return;
    }
    
    setDropTime(calculateDropTime(state.level));
  }, [state.isPaused, state.isGameOver, state.level]);
  
  // ドロップタイマーをリセットする関数
  const resetDropTimer = useCallback(() => {
    if (!state.isPaused && !state.isGameOver) {
      setDropTime(calculateDropTime(state.level));
    }
  }, [state.isPaused, state.isGameOver, state.level]);
  
  // キーボードイベントリスナーを設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  // ドロップタイマーを設定
  useEffect(() => {
    startDropTimer();
  }, [startDropTimer]);
  
  // 一定間隔でブロックを落下させる
  useEffect(() => {
    if (!dropTime) return;
    
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, dropTime);
    
    return () => {
      clearInterval(interval);
    };
  }, [dropTime]);
  
  return {
    state,
    dispatch,
    resetDropTimer,
  };
};
