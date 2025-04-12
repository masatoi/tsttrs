import React from 'react';
import { GameState } from '../types';
import { TETROMINOS } from '../utils';

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { grid, currentBlock } = gameState;

  // 現在のブロックを含むグリッドを作成
  const renderGrid = () => {
    // グリッドのコピーを作成
    const displayGrid = grid.map(row => [...row]);

    // 現在のブロックをグリッドに追加
    currentBlock.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          const boardY = currentBlock.position.y + y;
          const boardX = currentBlock.position.x + x;
          
          // ボード内にある場合のみ描画
          if (
            boardY >= 0 &&
            boardY < displayGrid.length &&
            boardX >= 0 &&
            boardX < displayGrid[0].length
          ) {
            displayGrid[boardY][boardX] = currentBlock.type;
          }
        }
      });
    });

    return displayGrid;
  };

  const displayGrid = renderGrid();

  return (
    <div className="game-board">
      {displayGrid.map((row, y) => (
        <div className="row" key={`row-${y}`}>
          {row.map((cell, x) => (
            <div
              className={`cell ${cell !== 0 ? 'filled' : ''}`}
              key={`cell-${x}-${y}`}
              style={{
                backgroundColor: cell !== 0 ? `rgba(${TETROMINOS[cell].color})` : 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
