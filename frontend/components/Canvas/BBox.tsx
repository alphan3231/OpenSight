import { Rect, Text, Group } from "react-konva";

interface BBoxProps {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    color?: string;
    isSelected?: boolean;
    onSelect?: () => void;
}

export default function BBox({
    x,
    y,
    width,
    height,
    label,
    color = "#00ff00",
    isSelected = false,
    onSelect,
}: BBoxProps) {
    return (
        <Group x={x} y={y} onClick={onSelect} onTap={onSelect}>
            <Rect
                width={width}
                height={height}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                fill={isSelected ? `${color}33` : "transparent"} // Transparent fill normally, light color when selected
            />
            {label && (
                <React.Fragment>
                    <Rect
                        y={-20}
                        width={label.length * 8 + 10}
                        height={20}
                        fill={color}
                    />
                    <Text
                        text={label}
                        y={-16}
                        x={5}
                        fill="white"
                        fontSize={12}
                        fontStyle="bold"
                    />
                </React.Fragment>
            )}
        </Group>
    );
}

import React from "react";
