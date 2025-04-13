// src/components/BlockDisplay.tsx
import React from 'react';
import { Block } from '../types';
import { TETROMINOS } from '../utils';

interface BlockDisplayProps {
    block: Block | null;
    className?: string;
    cellSize?: number; // セルサイズを prop で受け取れるようにする (オプション)
}

const BlockDisplay: React.FC<BlockDisplayProps> = ({
    block,
    className = "",
    cellSize = 15 // デフォルトのセルサイズ
}) => {
    // block が null、または shape が不正な配列の場合は空表示
    if (!block || typeof block.type !== 'number' || !Array.isArray(block.shape) || block.shape.length === 0) {
        return <div className={`block-display empty ${className}`} style={{ minWidth: cellSize * 4 + 12, minHeight: cellSize * 4 + 12 }}></div>;
    }

    const displaySize = 4; // 4x4 の表示エリア
    const displayGrid = Array.from({ length: displaySize }, () => Array(displaySize).fill(0));

    // const shapeHeight = block.shape.reduce((h, row) => row.some(c => c !== 0) ? h + 1 : h, 0) || 1; // ブロックの実質的な高さ
    const shapeWidth = block.shape[0]?.length || 1; // 最初の行の幅を基準とする

    // ブロック形状の中心を描画エリアの中心に合わせるためのオフセット
    // shapeデータの空白部分も考慮して中央揃え
    let minX = shapeWidth, maxX = -1, minY = block.shape.length, maxY = -1;
    block.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell !== 0) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        });
    });
    const actualWidth = (maxX === -1) ? 1 : maxX - minX + 1;
    const actualHeight = (maxY === -1) ? 1 : maxY - minY + 1;

    const offsetX = Math.floor((displaySize - actualWidth) / 2) - minX;
    const offsetY = Math.floor((displaySize - actualHeight) / 2) - minY;


    block.shape.forEach((row, y) => {
        if (Array.isArray(row)) {
            row.forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'number') {
                    const gridY = y + offsetY;
                    const gridX = x + offsetX;
                    if (gridY >= 0 && gridY < displaySize && gridX >= 0 && gridX < displaySize) {
                        if (TETROMINOS[cell]) {
                            displayGrid[gridY][gridX] = cell;
                        }
                    }
                }
            });
        }
    });

    return (
        <div className={`block-display ${className}`} style={{ minWidth: cellSize * displaySize + 12, minHeight: cellSize * displaySize + 12 }}>
            {displayGrid.map((row, y) => (
                <div className="row" key={`block-row-${y}`} style={{ height: cellSize }}>
                    {row.map((cell, x) => (
                        <div
                            className={`cell ${cell !== 0 ? 'filled' : ''}`}
                            key={`block-cell-${x}-${y}`}
                            style={{
                                width: cellSize,
                                height: cellSize,
                                backgroundColor: (cell !== 0 && TETROMINOS[cell]) ? `rgba(${TETROMINOS[cell].color})` : 'transparent',
                                border: `1px solid rgba(80, 80, 80, ${cell !== 0 ? 0.5 : 0.2})` // 境界線調整
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default BlockDisplay;
