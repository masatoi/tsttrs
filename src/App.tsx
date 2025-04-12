// src/App.tsx
import './App.css';
import GameBoard from './components/GameBoard';
import InfoPanel from './components/InfoPanel';
import Controls from './components/Controls';
import HoldDisplay from './components/HoldDisplay';
import NextQueueDisplay from './components/NextQueueDisplay';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const { state, dispatch } = useGameLogic();

  return (
    <div className="app">
      {/* 4カラムレイアウト */}
      <div className="game-layout">

        {/* Column 1: ホールド */}
        <div className="left-panel">
          <HoldDisplay gameState={state} />
        </div>

        {/* Column 2: ゲームボード */}
        <div className="game-board-area">
          <GameBoard gameState={state} />
        </div>

        {/* Column 3: Nextキュー */}
        <div>
          <NextQueueDisplay gameState={state} />
        </div>

        {/* Column 4: 情報 & コントロール */}
        <div className="info-controls-area"> {/* ★ 新しいラッパーDiv */}
          <InfoPanel gameState={state} />
          <Controls
            isPaused={state.isPaused}
            isGameOver={state.isGameOver}
            dispatch={dispatch}
          />
        </div>

      </div> {/* game-layout */}
    </div> /* app */
  )
}

export default App;
