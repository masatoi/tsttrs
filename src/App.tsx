// src/App.tsx
import './App.css';
import GameBoard from './components/GameBoard';
import InfoPanel from './components/InfoPanel';
import Controls from './components/Controls';
import HoldDisplay from './components/HoldDisplay'; // インポート
import NextQueueDisplay from './components/NextQueueDisplay'; // インポート
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const { state, dispatch } = useGameLogic();

  return (
    <div className="app">
      
      {/* 新しいレイアウト構造 */}
      <div className="game-layout">

        {/* 左パネル: ホールド */}
        <div className="left-panel">
          <HoldDisplay gameState={state} />
        </div>

        {/* 中央: ゲームボード */}
        <div className="game-board-area">
          <GameBoard gameState={state} />
        </div>

        {/* 右パネル: Nextキュー、情報、コントロール */}
        <div className="right-panel">
          <NextQueueDisplay gameState={state} />
          <InfoPanel gameState={state} /> {/* Stats, Messages, Controls Info */}
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
