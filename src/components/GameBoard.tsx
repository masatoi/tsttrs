import React, { useMemo } from 'react';
import { GameState } from '../types';
import { TETROMINOS } from '../utils';
import { calculateGhostPosition, GHOST_CELL_TYPE } from '../utils';

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { grid, currentBlock, isGameOver } = gameState;

  // 現在のブロックを含むグリッドを作成（useMemoで最適化）
  const displayGrid = useMemo(() => {

    // 1. グリッドのコピーを作成
    const workingGrid = grid.map(row => [...row]);

    // 2. ゴーストピースの位置を計算 (ゲームオーバー時は計算しない)
    const ghostPosition = !isGameOver ? calculateGhostPosition(currentBlock, grid) : null;

    // 3. ゴーストピースを描画 (実際のブロックと重ならない場所のみ)
    if (ghostPosition && ghostPosition.y > currentBlock.position.y) { // ゴーストが現在位置より下にある場合のみ描画
      const ghostBlock = { ...currentBlock, position: ghostPosition };
      ghostBlock.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== 0) {
            const boardY = ghostBlock.position.y + y;
            const boardX = ghostBlock.position.x + x;
            // グリッド範囲内で、かつ元々空(0)のセルにのみゴーストを描画
            if (
              boardY >= 0 && boardY < workingGrid.length &&
              boardX >= 0 && boardX < workingGrid[0].length &&
              workingGrid[boardY][boardX] === 0 // ★ 既に何かある場所は上書きしない
            ) {
              workingGrid[boardY][boardX] = GHOST_CELL_TYPE;
            }
          }
        });
      });
    }

    // 4. 現在のブロックをグリッドに描画 (ゴーストを上書きする可能性あり)
    if (!isGameOver) { // ゲームオーバー時は現在のブロックを描画しない
      currentBlock.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== 0) {
            const boardY = currentBlock.position.y + y;
            const boardX = currentBlock.position.x + x;
            // グリッド範囲内にある場合のみ描画 (最上部より上も含む)
            if (
              // boardY >= 0 && // Y < 0 (画面上部) でも描画する必要がある
              boardY < workingGrid.length &&
              boardX >= 0 &&
              boardX < workingGrid[0].length
            ) {
              // 画面上部にはみ出している部分も描画できるように、boardY>=0のチェックを調整
              if (boardY >= 0) {
                workingGrid[boardY][boardX] = currentBlock.type;
              }
            }
          }
        });
      });
    }

    return workingGrid;
  }, [grid, currentBlock, isGameOver]); // 依存配列に isGameOver を追加

  return (
    <div className="game-board">
      {displayGrid.map((row, y) => (
        <div className="row" key={`row-${y}`}>
          {row.map((cellValue, x) => {
            let className = 'cell';
            let backgroundColor = 'transparent';
            let borderColor = 'rgba(50, 50, 50, 0.5)'; // デフォルトの枠線色

            if (cellValue === GHOST_CELL_TYPE) {
              className += ' ghost';
              // GhostのスタイルはCSSで定義するため、ここでは背景色を設定しない
              // 必要であれば、ここで基本色を設定しCSSで上書きも可能
              // backgroundColor = `rgba(${TETROMINOS[currentBlock.type].color}, 0.1)`; // 例: 薄い色
            } else if (cellValue !== 0) {
              className += ' filled';
              backgroundColor = `rgba(${TETROMINOS[cellValue].color})`;
              borderColor = `rgba(255, 255, 255, 0.3)`; // filledセルの枠線色
            }

            return (
              <div
                className={className}
                key={`cell-${x}-${y}`}
                style={{
                  backgroundColor: backgroundColor,
                  // 枠線スタイルを動的に設定
                  borderColor: borderColor,
                  // 必要に応じて他のスタイルも調整
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// React.memoでコンポーネントをメモ化して不要な再レンダリングを防止
export default React.memo(GameBoard);
