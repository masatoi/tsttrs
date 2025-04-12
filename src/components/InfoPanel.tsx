import React from 'react';
import { GameState } from '../types';
import { TETROMINOS } from '../utils';

interface InfoPanelProps {
  gameState: GameState;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ gameState }) => {
  const { score, level, lines, nextBlock, isGameOver, isPaused } = gameState;

  // 次のブロックを表示
  const renderNextBlock = () => {
    return (
      <div className="next-block-display">
        {nextBlock.shape.map((row, y) => (
          <div className="row" key={`next-row-${y}`}>
            {row.map((cell, x) => (
              <div
                className={`cell ${cell !== 0 ? 'filled' : ''}`}
                key={`next-cell-${x}-${y}`}
                style={{
                  backgroundColor: cell !== 0 ? `rgba(${TETROMINOS[nextBlock.type].color})` : 'transparent',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="info-panel">
      {isGameOver && (
        <div className="game-over-message">
          <h2>ゲームオーバー</h2>
          <p>Rキーでリスタート</p>
        </div>
      )}
      
      {isPaused && !isGameOver && (
        <div className="paused-message">
          <h2>一時停止中</h2>
          <p>Pキーで再開</p>
        </div>
      )}
      
      <div className="stats">
        <div className="stat-item">
          <h3>スコア</h3>
          <p>{score}</p>
        </div>
        
        <div className="stat-item">
          <h3>レベル</h3>
          <p>{level}</p>
        </div>
        
        <div className="stat-item">
          <h3>ライン</h3>
          <p>{lines}</p>
        </div>
      </div>
      
      <div className="next-block">
        <h3>次のブロック</h3>
        {renderNextBlock()}
      </div>
      
      <div className="controls-info">
        <h3>操作方法</h3>
        <ul>
          <li>← → : 移動</li>
          <li>↑ : 回転</li>
          <li>↓ : 落下</li>
          <li>スペース : 即時落下</li>
          <li>P : 一時停止/再開</li>
          <li>R : リスタート</li>
        </ul>
      </div>
    </div>
  );
};

export default InfoPanel;
