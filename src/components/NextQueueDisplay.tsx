// src/components/NextQueueDisplay.tsx
import React from 'react';
import { GameState } from '../types';
import BlockDisplay from './BlockDisplay'; // 切り出した BlockDisplay をインポート

interface NextQueueDisplayProps {
    gameState: Pick<GameState, 'nextBlocks'>; // 必要な state のみ受け取る
}

const NextQueueDisplay: React.FC<NextQueueDisplayProps> = ({ gameState }) => {
    const { nextBlocks } = gameState;

    return (
        <div className="next-queue-panel">
            <h3>Next</h3>
            <div className="next-blocks-queue">
                {Array.isArray(nextBlocks) && nextBlocks.map((block, index) => (
                    block ? <BlockDisplay key={`next-${index}-${block.type}`} block={block} className="next-block-display" /> : null
                ))}
            </div>
        </div>
    );
};

export default NextQueueDisplay;