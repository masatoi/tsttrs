// src/components/HoldDisplay.tsx
import React from 'react';
import { GameState } from '../types';
import BlockDisplay from './BlockDisplay';

interface HoldDisplayProps {
    // isGameOver も状態判定に使うので含める
    gameState: Pick<GameState, 'heldBlock' | 'canHold' | 'isGameOver'>;
}

const HoldDisplay: React.FC<HoldDisplayProps> = ({ gameState }) => {
    const { heldBlock, canHold, isGameOver } = gameState;

    // ホールドが使用できない状態 (canHoldがfalse または ゲームオーバー) かどうか
    const isHoldUnavailable = !canHold || isGameOver;

    // BlockDisplay をラップする div のクラス名を動的に設定
    const wrapperClassName = `block-display-wrapper ${isHoldUnavailable ? 'hold-unavailable' : ''}`;

    return (
        <div className="hold-panel">
            {/* <h3>ホールド {!isGameOver && !canHold ? '(済)' : ''}</h3> ← 文字表示を削除 */}
            <h3>Hold</h3> {/* タイトルはシンプルに */}
            {/* BlockDisplay を div でラップし、状態に応じたクラスを付与 */}
            <div className={wrapperClassName}>
                <BlockDisplay block={heldBlock} className="hold-block-display" />
            </div>
        </div>
    );
};

export default React.memo(HoldDisplay);
