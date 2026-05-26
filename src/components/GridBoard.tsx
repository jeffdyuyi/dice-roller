import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Image as KonvaImage } from 'react-konva';
import type { WhiteboardTab } from '../features/whiteboards/types';
import React from 'react';

// POINTY-TOPPED HEXAGON GEOMETRY CONSTANTS & HELPERS
const hexSize = 32; // Hexagon radius (distance from center to corners)

const getHexCenter = (q: number, r: number) => {
    const cx = hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const cy = hexSize * (1.5 * r);
    return { cx, cy };
};

const getHexPoints = (cx: number, cy: number, size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angleRad = (Math.PI / 180) * (60 * i + 30);
        points.push(cx + size * Math.cos(angleRad));
        points.push(cy + size * Math.sin(angleRad));
    }
    return points;
};

const hexRound = (x: number, y: number) => {
    const z = -x - y;
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);
    
    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);
    
    if (xDiff > yDiff && xDiff > zDiff) {
        rx = -ry - rz;
    } else if (yDiff > zDiff) {
        ry = -rx - rz;
    }
    return { q: rx, r: ry };
};

const pixelToHex = (x: number, y: number) => {
    const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / hexSize;
    const r = (2 / 3 * y) / hexSize;
    return hexRound(q, r);
};

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

    const gridSize = 50; // Grid square size
    const isHex = tab.gridType === 'hex';

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

        if (isHex) {
            const { q, r } = pixelToHex(clickX, clickY);
            onSelectCell(q, r);
        } else {
            const q = Math.floor(clickX / gridSize);
            const r = Math.floor(clickY / gridSize);
            onSelectCell(q, r);
        }
    };

    // Viewport logical bounds for dynamic clipping
    const minX = (-pos.x) / scale;
    const maxX = (dimensions.width - pos.x) / scale;
    const minY = (-pos.y) / scale;
    const maxY = (dimensions.height - pos.y) / scale;

    const gridLines = [];

    if (isHex) {
        // High-performance hex view clipping bounds
        const minR = Math.floor((minY - hexSize * 2) / (hexSize * 1.5));
        const maxR = Math.ceil((maxY + hexSize * 2) / (hexSize * 1.5));

        for (let r = minR; r <= maxR; r++) {
            const minQ = Math.floor((minX - hexSize * 2) / (hexSize * Math.sqrt(3)) - r / 2);
            const maxQ = Math.ceil((maxX + hexSize * 2) / (hexSize * Math.sqrt(3)) - r / 2);

            for (let q = minQ; q <= maxQ; q++) {
                const { cx, cy } = getHexCenter(q, r);
                gridLines.push(
                    <Line
                        key={`hex-line-${q}-${r}`}
                        points={getHexPoints(cx, cy, hexSize)}
                        closed
                        stroke="#2c2c2c"
                        strokeWidth={1 / scale}
                        listening={false}
                    />
                );
            }
        }
    } else {
        // Square clipping bounds
        const minCol = Math.floor(minX / gridSize) - 2;
        const maxCol = Math.ceil(maxX / gridSize) + 2;
        const minRow = Math.floor(minY / gridSize) - 2;
        const maxRow = Math.ceil(maxY / gridSize) + 2;

        // Draw vertical lines
        for (let col = minCol; col <= maxCol; col++) {
            gridLines.push(
                <Line
                    key={`v-${col}`}
                    points={[col * gridSize, minRow * gridSize, col * gridSize, maxRow * gridSize]}
                    stroke="#2c2c2c"
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
                    stroke="#2c2c2c"
                    strokeWidth={1 / scale}
                    listening={false}
                />
            );
        }
    }

    // Filter valid cells to render (including cells with direct tactical colors painted!)
    const cellsToRender = Object.values(tab.cells).filter(
        c => c.terrain || c.object || c.unit || c.color || c.entries.length > 0
    );

    return (
        <div ref={containerRef} className="w-full h-full bg-[#121212] relative overflow-hidden select-none outline-none">
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
                {/* 1. Map / Background Image Layer */}
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

                {/* 2. Grid Outline Lines Layer */}
                <Layer>
                    {gridLines}
                </Layer>

                {/* 3. Paint Overlay & Tokens & Notes Layer */}
                <Layer>
                    {/* A. Paint / Tactical Color Filling Overlay */}
                    {cellsToRender.map((cell) => {
                        if (!cell.color) return null;
                        if (isHex) {
                            const { cx, cy } = getHexCenter(cell.q, cell.r);
                            return (
                                <Line
                                    key={`paint-${cell.q},${cell.r}`}
                                    points={getHexPoints(cx, cy, hexSize - 0.5)}
                                    closed
                                    fill={cell.color}
                                    opacity={0.45}
                                    listening={false}
                                />
                            );
                        } else {
                            const x = cell.q * gridSize;
                            const y = cell.r * gridSize;
                            return (
                                <Rect
                                    key={`paint-${cell.q},${cell.r}`}
                                    x={x + 0.5}
                                    y={y + 0.5}
                                    width={gridSize - 1}
                                    height={gridSize - 1}
                                    fill={cell.color}
                                    opacity={0.45}
                                    listening={false}
                                />
                            );
                        }
                    })}

                    {/* B. Terrain, Object, Unit Tokens */}
                    {cellsToRender.map((cell) => {
                        if (!cell.terrain && !cell.object && !cell.unit && cell.entries.length === 0) return null;
                        
                        let tx = 0;
                        let ty = 0;
                        let w = gridSize;
                        let h = gridSize;

                        if (isHex) {
                            const { cx, cy } = getHexCenter(cell.q, cell.r);
                            tx = cx - hexSize;
                            ty = cy - hexSize;
                            w = hexSize * 2;
                            h = hexSize * 2;
                        } else {
                            tx = cell.q * gridSize;
                            ty = cell.r * gridSize;
                        }

                        const currentSize = isHex ? hexSize * 2 : gridSize;

                        return (
                            <React.Fragment key={`content-${cell.q},${cell.r}`}>
                                {/* Bottom: Terrain layer */}
                                {cell.terrain && (
                                    <Text
                                        x={tx}
                                        y={ty}
                                        width={w}
                                        height={h}
                                        text={cell.terrain}
                                        fontSize={cell.terrain.length > 1 ? currentSize * 0.32 : currentSize * 0.55}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                )}
                                
                                {/* Middle: Object layer */}
                                {cell.object && (
                                    <Text
                                        x={tx}
                                        y={ty}
                                        width={w}
                                        height={h}
                                        text={cell.object}
                                        fontSize={cell.object.length > 1 ? currentSize * 0.32 : currentSize * 0.55}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                )}

                                {/* Top: Player/Monster Unit layer */}
                                {cell.unit && (
                                    <Text
                                        x={tx}
                                        y={ty}
                                        width={w}
                                        height={h}
                                        text={cell.unit}
                                        fontSize={cell.unit.length > 1 ? currentSize * 0.3 : currentSize * 0.55}
                                        fill="#f4f4f4"
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                        fontStyle="bold"
                                    />
                                )}

                                {/* Note Entry Icons Layer (Every Emoji/marker corresponds directly to one Markdown text block!) */}
                                {(() => {
                                    const entryIcons = cell.entries.map(e => e.icon).filter(Boolean) as string[];
                                    const markersString = entryIcons.join(' ');
                                    const markersLength = entryIcons.join('').length;
                                    if (!markersString) return null;
                                    return (
                                        <Text
                                            x={tx}
                                            y={ty}
                                            width={w}
                                            height={h}
                                            text={markersString}
                                            fontSize={markersLength > 1 ? currentSize * 0.32 : currentSize * 0.55}
                                            align="center"
                                            verticalAlign="middle"
                                            listening={false}
                                        />
                                    );
                                })()}

                                {/* Note Blue Indicator Icon */}
                                {cell.entries.length > 0 && (
                                    isHex ? (
                                        <Rect
                                            x={tx + currentSize * 0.72}
                                            y={ty + currentSize * 0.18}
                                            width={6}
                                            height={6}
                                            fill="#0f62fe"
                                            listening={false}
                                        />
                                    ) : (
                                        <Rect
                                            x={tx + gridSize - 8}
                                            y={ty + 2}
                                            width={6}
                                            height={6}
                                            fill="#0f62fe"
                                            listening={false}
                                        />
                                    )
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* C. Highlight Selected Cell */}
                    {selectedCell && (
                        isHex ? (() => {
                            const { cx, cy } = getHexCenter(selectedCell.q, selectedCell.r);
                            return (
                                <Line
                                    points={getHexPoints(cx, cy, hexSize)}
                                    closed
                                    stroke="#0f62fe"
                                    strokeWidth={3 / scale}
                                    fill="rgba(15, 98, 254, 0.15)"
                                    listening={false}
                                />
                            );
                        })() : (
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
                        )
                    )}
                </Layer>
            </Stage>
        </div>
    );
}
