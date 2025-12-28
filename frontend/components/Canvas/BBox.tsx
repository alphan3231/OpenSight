import { Rect, Text, Group } from "react-konva";

interface BBoxProps {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    color?: string;
    isSelected?: boolean;
    scale?: number;
    onSelect?: () => void;
    draggable?: boolean;
    onDragEnd?: (e: any) => void;
    onTransformEnd?: (e: any) => void;
}

export default function BBox({
    x,
    y,
    width,
    height,
    label,
    color = "#00ff00",
    isSelected = false,
    scale = 1,
    onSelect,
    draggable,
    onDragEnd,
    onTransformEnd
}: BBoxProps) {
    const fontSize = 14 / scale;
    const padding = 4 / scale;
    const strokeWidth = (isSelected ? 3 : 2) / scale;

    return (
        <Group
            x={x}
            y={y}
            onClick={onSelect}
            onTap={onSelect}
            draggable={draggable}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
        >
            <Rect
                width={width}
                height={height}
                stroke={color}
                strokeWidth={strokeWidth}
                fill={isSelected ? `${color}33` : "transparent"} // Transparent fill normally, light color when selected
            />
            {label && (
                <React.Fragment>
                    <Rect
                        y={-(fontSize + padding * 2)}
                        width={label.length * (fontSize * 0.6) + padding * 2} // Approx width
                        height={fontSize + padding * 2}
                        fill={color}
                    />
                    <Text
                        text={label}
                        y={-(fontSize + padding)}
                        x={padding}
                        fill="white"
                        fontSize={fontSize}
                        fontStyle="bold"
                    />
                </React.Fragment>
            )}
        </Group>
    );
}

import React from "react";
