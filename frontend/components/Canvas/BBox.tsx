import React from "react";
import { Rect, Text, Group } from "react-konva";

interface BBoxProps {
    id?: string;
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
    locked?: boolean; // Added locked prop
}

export default function BBox({
    id,
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
    onTransformEnd,
    locked = false, // Added locked prop with default value
}: BBoxProps) {
    const fontSize = 14 / scale;
    const padding = 4 / scale;
    // const strokeWidth = (isSelected ? 3 : 2) / scale; // Original line, now replaced by fixed 2/scale

    return (
        <Group
            id={id}
            x={x}
            y={y}
            onClick={onSelect}
            onTap={onSelect}
            draggable={draggable && !locked} // Disable drag if locked
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd} // Keep onTransformEnd
        >
            <Rect
                width={width}
                height={height}
                stroke={color}
                strokeWidth={2 / scale} // Changed strokeWidth to fixed value
                fill={isSelected ? `${color}33` : "transparent"} // Transparent fill normally, light color when selected
                shadowColor="black" // Added shadow props
                shadowBlur={2}
                shadowOpacity={0.3}
                dash={locked ? [4, 4] : undefined} // Visual indicator for locked
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
