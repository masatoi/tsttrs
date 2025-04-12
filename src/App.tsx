import React from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import InfoPanel from './components/InfoPanel';
import Controls from './components/Controls';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const { state, dispatch } = useGameLogic();

  return (
    <div className="app">
      <h1>テトリスゲーム</h1>
      
      <div className="game-container">
        <GameBoard gameState={state} />
        <div className="side-panel">
          <InfoPanel gameState={state} />
          <Controls
            isPaused={state.isPaused}
            isGameOver={state.isGameOver}
            dispatch={dispatch}
          />
        </div>
      </div>
    </div>
  )
}

export default App
