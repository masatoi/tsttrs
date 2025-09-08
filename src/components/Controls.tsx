import React from 'react';
import { GameAction } from '../types';

interface ControlsProps {
  isPaused: boolean;
  isGameOver: boolean;
  dispatch: React.Dispatch<GameAction>;
}

const Controls: React.FC<ControlsProps> = ({ isPaused, isGameOver, dispatch }) => {
  const handleStartPause = () => {
    if (isPaused) {
      dispatch({ type: 'RESUME' });
    } else {
      dispatch({ type: 'PAUSE' });
    }
  };

  const handleRestart = () => {
    dispatch({ type: 'RESTART' });
  };

  return (
    <div className="controls">
      <button
        className="control-button"
        onClick={handleStartPause}
        disabled={isGameOver}
      >
        {isPaused ? '開始' : '一時停止'}
      </button>
      
      <button
        className="control-button"
        onClick={handleRestart}
      >
        リスタート
      </button>
    </div>
  );
};

export default React.memo(Controls);
