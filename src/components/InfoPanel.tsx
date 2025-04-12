// src/components/InfoPanel.tsx
import React from 'react';
import { GameState } from '../types';
// BlockDisplay のインポートは不要になる

interface InfoPanelProps {
  // gameState から必要な情報のみ Pick する形にしても良い
  gameState: GameState;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ gameState }) => {
  const { score, level, lines, isGameOver, isPaused } = gameState;

  return (
    // クラス名を変更しても良い (例: stats-panel)
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

      {/* Stats */}
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

      {/* Controls Info */}
      <div className="controls-info">
        <h3>操作方法</h3>
        <ul>
          <li>← → : 移動</li>
          <li>↑ : 回転</li>
          <li>↓ : ソフトドロップ</li>
          <li>スペース : ハードドロップ</li>
          <li>Shift / C : ホールド</li>
          <li>P : 一時停止/再開</li>
          <li>R : リスタート</li>
        </ul>
      </div>
    </div>
  );
};

export default InfoPanel;
