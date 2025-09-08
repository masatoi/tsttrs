// src/components/BlockDisplay.tsx
import React, { useMemo } from 'react';
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
    const displayGrid = useMemo(() => {
        if (!block || typeof block.type !== 'number' || !Array.isArray(block.shape) || block.shape.length === 0) {
            return Array.from({ length: 4 }, () => Array(4).fill(0));
        }

        const displaySize = 4;
        const grid = Array.from({ length: displaySize }, () => Array(displaySize).fill(0));

        const shapeWidth = block.shape[0]?.length || 1;
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
                                grid[gridY][gridX] = cell;
                            }
                        }
                    }
                });
            }
        });

        return grid;
    }, [block]); // Only recalculate when block changes

    if (!block || typeof block.type !== 'number' || !Array.isArray(block.shape) || block.shape.length === 0) {
        return <div className={`block-display empty ${className}`} style={{ minWidth: cellSize * 4 + 12, minHeight: cellSize * 4 + 12 }}></div>;
    }

    return (
        <div className={`block-display ${className}`} style={{ minWidth: cellSize * 4 + 12, minHeight: cellSize * 4 + 12 }}>
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
                                border: `1px solid rgba(80, 80, 80, ${cell !== 0 ? 0.5 : 0.2})`
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default React.memo(BlockDisplay);
