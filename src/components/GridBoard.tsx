import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Image as KonvaImage } from 'react-konva';
import type { WhiteboardTab } from '../features/whiteboards/types';

interface GridBoardProps {
    tab: WhiteboardTab;
    selectedCell: { q: number; r: number } | null;
    onSelectCell: (q: number, r: number) => void;
    recenterTrigger: number; // Trigger recenter when this changes
}

export function GridBoard({ tab, selectedCell, onSelectCell, recenterTrigger }: GridBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

    const gridSize = 50;

    // Handle container resize
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Load background image
    useEffect(() => {
        if (!tab.bgImage) {
            setBgImg(null);
            return;
        }
        const img = new window.Image();
        img.src = tab.bgImage;
        img.onload = () => {
            setBgImg(img);
        };
    }, [tab.bgImage]);

    // Handle "Recenter" trigger
    useEffect(() => {
        if (recenterTrigger === 0) return;
        const stage = stageRef.current;
        if (stage) {
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: dimensions.width / 2, y: dimensions.height / 2 });
            setScale(1);
            setPos({ x: dimensions.width / 2, y: dimensions.height / 2 });
            stage.batchDraw();
        }
    }, [recenterTrigger, dimensions.width, dimensions.height]);

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const zoomFactor = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

        // Limit zoom scale
        const boundedScale = Math.max(0.1, Math.min(10, newScale));

        stage.scale({ x: boundedScale, y: boundedScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * boundedScale,
            y: pointer.y - mousePointTo.y * boundedScale,
        };

        stage.position(newPos);
        setScale(boundedScale);
        setPos(newPos);
        stage.batchDraw();
    };

    const handleDragEnd = (e: any) => {
        if (e.target === stageRef.current) {
            setPos({
                x: e.target.x(),
                y: e.target.y()
            });
        }
    };

    const handleStageClick = () => {
        const stage = stageRef.current;
        if (!stage) return;

        // Don't select cell if user was dragging
        if (stage.isDragging()) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        // Calculate logical grid coordinates based on panning (pos) and zoom (scale)
        const clickX = (pointer.x - pos.x) / scale;
        const clickY = (pointer.y - pos.y) / scale;

        const q = Math.floor(clickX / gridSize);
        const r = Math.floor(clickY / gridSize);

        onSelectCell(q, r);
    };

    // Calculate visible grid boundaries to draw lines efficiently
    const minCol = Math.floor((-pos.x) / (gridSize * scale)) - 5;
    const maxCol = Math.ceil((dimensions.width - pos.x) / (gridSize * scale)) + 5;
    const minRow = Math.floor((-pos.y) / (gridSize * scale)) - 5;
    const maxRow = Math.ceil((dimensions.height - pos.y) / (gridSize * scale)) + 5;

    const gridLines = [];

    // Draw vertical lines
    for (let col = minCol; col <= maxCol; col++) {
        gridLines.push(
            <Line
                key={`v-${col}`}
                points={[col * gridSize, minRow * gridSize, col * gridSize, maxRow * gridSize]}
                stroke="#393939"
                strokeWidth={1 / scale}
                listening={false}
            />
        );
    }

    // Draw horizontal lines
    for (let row = minRow; row <= maxRow; row++) {
        gridLines.push(
            <Line
                key={`h-${row}`}
                points={[minCol * gridSize, row * gridSize, maxCol * gridSize, row * gridSize]}
                stroke="#393939"
                strokeWidth={1 / scale}
                listening={false}
            />
        );
    }

    // Render elements that have cell data
    const cellsToRender = Object.values(tab.cells).filter(c => c.terrain || c.object || c.unit || c.entries.length > 0);

    return (
        <div ref={containerRef} className="w-full h-full bg-[#161616] relative overflow-hidden select-none outline-none">
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                draggable
                onWheel={handleWheel}
                onDragEnd={handleDragEnd}
                onClick={handleStageClick}
                x={pos.x}
                y={pos.y}
                scaleX={scale}
                scaleY={scale}
            >
                {/* Background Image Layer */}
                <Layer>
                    {bgImg && (
                        <KonvaImage
                            image={bgImg}
                            x={0}
                            y={0}
                            opacity={tab.bgOpacity ?? 0.5}
                            listening={false}
                        />
                    )}
                </Layer>

                {/* Grid Lines Layer */}
                <Layer>
                    {gridLines}
                </Layer>

                {/* Content Elements Layer (Terrain, Object, Unit) */}
                <Layer>
                    {cellsToRender.map((cell) => {
                        const x = cell.q * gridSize;
                        const y = cell.r * gridSize;

                        return (
                            <React.Fragment key={`${cell.q},${cell.r}`}>
                                {/* Terrain block background */}
                                {cell.terrain && (
                                    <Text
                                        x={x}
                                        y={y}
                                        width={gridSize}
                                        height={gridSize}
                                        text={cell.terrain}
                                        fontSize={gridSize * 0.6}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                )}
                                
                                {/* Object block */}
                                {cell.object && (
                                    <Text
                                        x={x}
                                        y={y}
                                        width={gridSize}
                                        height={gridSize}
                                        text={cell.object}
                                        fontSize={gridSize * 0.6}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                )}

                                {/* Unit block (top layer, slightly larger or distinct text style) */}
                                {cell.unit && (
                                    <Text
                                        x={x}
                                        y={y}
                                        width={gridSize}
                                        height={gridSize}
                                        text={cell.unit}
                                        fontSize={cell.unit.length > 1 ? gridSize * 0.35 : gridSize * 0.6}
                                        fill="#f4f4f4"
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                        fontStyle="bold"
                                    />
                                )}

                                {/* Little indicator icon/dot for grid note items */}
                                {cell.entries.length > 0 && (
                                    <Rect
                                        x={x + gridSize - 8}
                                        y={y + 2}
                                        width={6}
                                        height={6}
                                        fill="#0f62fe"
                                        listening={false}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Highlight Selected Cell */}
                    {selectedCell && (
                        <Rect
                            x={selectedCell.q * gridSize}
                            y={selectedCell.r * gridSize}
                            width={gridSize}
                            height={gridSize}
                            stroke="#0f62fe"
                            strokeWidth={3 / scale}
                            fill="rgba(15, 98, 254, 0.15)"
                            listening={false}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
}

// Add React import for the Fragment above just in case
import React from 'react';
