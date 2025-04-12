// src/components/HoldDisplay.tsx
import React from 'react';
import { GameState } from '../types';
import BlockDisplay from './BlockDisplay'; // 切り出した BlockDisplay をインポート

interface HoldDisplayProps {
    gameState: Pick<GameState, 'heldBlock' | 'canHold' | 'isGameOver'>; // 必要な state のみ受け取る
}

const HoldDisplay: React.FC<HoldDisplayProps> = ({ gameState }) => {
    const { heldBlock, canHold, isGameOver } = gameState;

    return (
        <div className="hold-panel">
            <h3>ホールド {!isGameOver && !canHold ? '(済)' : ''}</h3>
            <BlockDisplay block={heldBlock} className="hold-block-display" />
        </div>
    );
};

export default HoldDisplay;
