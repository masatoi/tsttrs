// src/components/InfoPanel.tsx
import React from 'react';
import { GameState, Block } from '../types'; // Blockもインポート
import { TETROMINOS } from '../utils';

interface InfoPanelProps {
  gameState: GameState;
}

// 単一のブロックを描画するヘルパーコンポーネント
const BlockDisplay: React.FC<{ block: Block | null; className?: string }> = ({ block, className = "" }) => {
  if (!block) {
    // ブロックがない場合はプレースホルダーなどを表示しても良い
    return <div className={`block-display empty ${className}`}></div>;
  }

  // ブロック形状に合わせて描画エリアのサイズを調整 (例: 4x4)
  const displaySize = 4;
  const displayGrid = Array.from({ length: displaySize }, () => Array(displaySize).fill(0));

  // ブロック形状の中心を計算 (描画エリア内で中央に表示するため)
  const shapeHeight = block.shape.length;
  const shapeWidth = block.shape[0].length; // O型以外は正方形でない可能性あり
  const offsetY = Math.floor((displaySize - shapeHeight) / 2);
  const offsetX = Math.floor((displaySize - shapeWidth) / 2);


  block.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const gridY = y + offsetY;
        const gridX = x + offsetX;
        if (gridY >= 0 && gridY < displaySize && gridX >= 0 && gridX < displaySize) {
          displayGrid[gridY][gridX] = block.type;
        }
      }
    });
  });

  return (
    <div className={`block-display ${className}`}>
      {displayGrid.map((row, y) => (
        <div className="row" key={`block-row-${y}`}>
          {row.map((cell, x) => (
            <div
            className={`cell ${cell !== 0 ? 'filled' : ''}`}
            key={`block-cell-${x}-${y}`}
            style={{
              backgroundColor: cell !== 0 ? `rgba(${TETROMINOS[cell]?.color || '0,0,0'})` : 'transparent',
            }}
              />
          ))}
        </div>
      ))}
    </div>
  );
};


const InfoPanel: React.FC<InfoPanelProps> = ({ gameState }) => {
  const { score, level, lines, nextBlocks, heldBlock, canHold, isGameOver, isPaused } = gameState;

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

    {/* ホールド表示 */}
      <div className="hold-block">
      <h3>ホールド {canHold ? '' : '(使用済)'}</h3>
      <BlockDisplay block={heldBlock} className="hold-block-display"/>
      </div>

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

      {/* Nextキュー表示 */}
      <div className="next-blocks">
      <h3>次のブロック</h3>
      <div className="next-blocks-queue">
      {nextBlocks.map((block, index) => (
        <BlockDisplay key={`next-${index}-${block.type}`} block={block} className="next-block-display"/>
      ))}
    </div>
      </div>

      <div className="controls-info">
      <h3>操作方法</h3>
      <ul>
      <li>← → : 移動</li>
      <li>↑ : 回転</li>
      <li>↓ : ソフトドロップ</li>
      <li>スペース : ハードドロップ</li>
      <li>Shift / C : ホールド</li> {/* ホールド操作を追加 */}
      <li>P : 一時停止/再開</li>
      <li>R : リスタート</li>
      </ul>
      </div>
      </div>
  );
};

export default InfoPanel;
