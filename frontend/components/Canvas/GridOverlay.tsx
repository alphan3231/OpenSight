import React from 'react';
import { Group, Line } from 'react-konva';

interface GridOverlayProps {
    width: number;
    height: number;
    gridSize?: number;
    visible?: boolean;
    color?: string;
}

const GridOverlay: React.FC<GridOverlayProps> = ({ width, height, gridSize = 50, visible = false, color = "rgba(255, 255, 255, 0.2)" }) => {
    if (!visible) return null;

    const lines = [];

    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
        lines.push(
            <Line
                key={`v-${i}`}
                points={[i, 0, i, height]}
                stroke={color}
                strokeWidth={1}
                listening={false} // Don't intercept events
            />
        );
    }

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
        lines.push(
            <Line
                key={`h-${i}`}
                points={[0, i, width, i]}
                stroke={color}
                strokeWidth={1}
                listening={false}
            />
        );
    }

    return (
        <Group>
            {lines}
        </Group>
    );
};

export default GridOverlay;
