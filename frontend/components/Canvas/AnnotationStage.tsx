"use client";

import { Stage, Layer, Transformer, Group } from "react-konva";
import { useState, useRef, useEffect, useCallback } from "react";
import URLImage from "./URLImage";
import BBox from "./BBox";
import GridOverlay from "./GridOverlay";

interface Annotation {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

interface AnnotationStageProps {
    imageSrc: string;
    annotations: Annotation[];
    onAnnotationsChange: (annotations: Annotation[]) => void;
    onSelectAnnotation: (id: string | null) => void;
    selectedId: string | null;

    tool: "select" | "rect" | "pan";
    rotation: number;
    brightness: number;

    contrast: number;
    showGrid: boolean;
    scale: number;
    onScaleChange: (scale: number) => void;
}


export default function AnnotationStage({
    imageSrc,
    annotations,
    onAnnotationsChange,
    onSelectAnnotation,
    selectedId,

    tool,
    rotation,
    brightness,
    contrast,
    showGrid,
    scale,
    onScaleChange,
}: AnnotationStageProps) {
    const stageRef = useRef<any>(null);
    const groupRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    // Removed internal scale state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [newAnnotation, setNewAnnotation] = useState<Annotation | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    // Initial Fit to Screen
    const handleImageLoad = useCallback((w: number, h: number) => {
        setImageSize({ width: w, height: h });
        // Simple fit logic: assuming container is roughly 800x600 for now, 
        // in real app we measure container ref.
        const containerW = 800;
        const containerH = 600;
        const scaleW = containerW / w;
        const scaleH = containerH / h;
        const fitScale = Math.min(scaleW, scaleH, 1); // Don't zoom in if image is small
        onScaleChange(fitScale);
        // Center it
        setPosition({
            x: (containerW - w * fitScale) / 2,
            y: (containerH - h * fitScale) / 2
        });
    }, []);

    // Update transformer when selection changes
    useEffect(() => {
        if (selectedId && transformerRef.current) {
            const node = stageRef.current.findOne(`#${selectedId}`);
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId, annotations]);

    // Zoom Logic
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        onScaleChange(newScale);
        setPosition({
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        });
    };

    // Drawing Logic
    const handleMouseDown = (e: any) => {
        // If clicking on transformer, do nothing
        if (e.target.getParent()?.className === 'Transformer') {
            return;
        }

        const clickedOnEmpty = e.target === e.target.getStage();

        // Select tool logic
        if (tool === "select") {
            if (clickedOnEmpty) {
                onSelectAnnotation(null);
                if (transformerRef.current) transformerRef.current.nodes([]);
            }
            return;
        }

        if (tool === "pan") return;

        // Rect tool logic
        if (clickedOnEmpty || tool === 'rect') {
            // Start drawing
            // Deselect current
            onSelectAnnotation(null);

            const stage = e.target.getStage();
            // Get pointer relative to image (accounting for zoom/pan AND rotation)
            // We use the group's transform
            const group = groupRef.current;
            const transform = group.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(stage.getPointerPosition());

            setNewAnnotation({
                id: Math.random().toString(36).substr(2, 9),
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                label: "New Object",
            });
        }
    };

    const handleMouseMove = (e: any) => {
        if (!newAnnotation) return;
        const stage = e.target.getStage();
        const group = groupRef.current;
        const transform = group.getAbsoluteTransform().copy();
        transform.invert();
        const pos = transform.point(stage.getPointerPosition());

        setNewAnnotation({
            ...newAnnotation,
            width: pos.x - newAnnotation.x,
            height: pos.y - newAnnotation.y,
        });
    };

    const handleMouseUp = () => {
        if (!newAnnotation) return;
        if (Math.abs(newAnnotation.width) > 5 && Math.abs(newAnnotation.height) > 5) {
            const finalAnnotation = {
                ...newAnnotation,
                x: newAnnotation.width < 0 ? newAnnotation.x + newAnnotation.width : newAnnotation.x,
                y: newAnnotation.height < 0 ? newAnnotation.y + newAnnotation.height : newAnnotation.y,
                width: Math.abs(newAnnotation.width),
                height: Math.abs(newAnnotation.height),
            };
            onAnnotationsChange([...annotations, finalAnnotation]);
            // Auto select the new one to edit label immediately
            onSelectAnnotation(finalAnnotation.id);
        }
        setNewAnnotation(null);
    };

    // Transform End (Resize/Move commands)
    const handleTransformEnd = (e: any) => {
        const node = e.target;
        const id = node.id();

        const newAnns = annotations.map(ann => {
            if (ann.id === id) {
                return {
                    ...ann,
                    x: node.x(),
                    y: node.y(),
                    width: node.width() * node.scaleX(),
                    height: node.height() * node.scaleY(),
                };
            }
            return ann;
        });

        // Reset scale to 1 (Konva best practice)
        node.scaleX(1);
        node.scaleY(1);

        onAnnotationsChange(newAnns);
    };

    return (
        <div className="bg-gray-900 overflow-hidden relative border border-gray-800 rounded-lg w-full h-full flex justify-center items-center">
            <Stage
                width={800}
                height={600}
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable={tool === "pan"}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                ref={stageRef}
                className={tool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}
            >

                <Layer>
                    <Group
                        ref={groupRef}
                        rotation={rotation}
                        x={
                            (rotation % 360 + 360) % 360 === 90 ? imageSize.height :
                                (rotation % 360 + 360) % 360 === 180 ? imageSize.width :
                                    (rotation % 360 + 360) % 360 === 270 ? 0 : 0
                        }
                        y={
                            (rotation % 360 + 360) % 360 === 90 ? 0 :
                                (rotation % 360 + 360) % 360 === 180 ? imageSize.height :
                                    (rotation % 360 + 360) % 360 === 270 ? imageSize.width : 0
                        }
                    >
                        <URLImage
                            src={imageSrc}
                            onImageLoad={handleImageLoad}
                            brightness={brightness}
                            contrast={contrast}
                        />

                        {imageSize.width > 0 && (
                            <GridOverlay
                                width={imageSize.width}
                                height={imageSize.height}
                                visible={showGrid}
                            />
                        )}

                        {annotations.map((ann) => (
                            <BBox
                                key={ann.id}
                                {...ann}
                                id={ann.id} // Important for transformer search
                                isSelected={ann.id === selectedId}
                                scale={scale}
                                onSelect={() => {
                                    if (tool === 'select') onSelectAnnotation(ann.id);
                                }}
                                draggable={tool === 'select'}
                                onDragEnd={(e: any) => {
                                    const node = e.target;
                                    const newAnns = annotations.map(a =>
                                        a.id === ann.id ? { ...a, x: node.x(), y: node.y() } : a
                                    );
                                    onAnnotationsChange(newAnns);
                                }}
                                onTransformEnd={handleTransformEnd}
                            />
                        ))}

                        {newAnnotation && (
                            <BBox
                                {...newAnnotation}
                                x={newAnnotation.width < 0 ? newAnnotation.x + newAnnotation.width : newAnnotation.x}
                                y={newAnnotation.height < 0 ? newAnnotation.y + newAnnotation.height : newAnnotation.y}
                                width={Math.abs(newAnnotation.width)}
                                height={Math.abs(newAnnotation.height)}
                                color="#FFFF00"
                            />
                        )}

                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                // Limit resize
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                        />
                    </Group>
                </Layer>
            </Stage>


            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                Scale: {scale.toFixed(2)}x
            </div>
        </div>
    );
}
