import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import type { WhiteboardTab, WhiteboardToken } from '../features/whiteboards/types';
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

export interface CellInteractionEvent {
    type: 'click' | 'dblclick' | 'contextmenu' | 'longpress' | 'dragstart';
    q: number;
    r: number;
    screenX: number;
    screenY: number;
}

interface GridBoardProps {
    tab: WhiteboardTab;
    selectedCell: { q: number; r: number } | null;
    recenterTrigger: number; // Trigger recenter when this changes
    onCellInteraction: (event: CellInteractionEvent) => void;
    allowedEditors?: string[];
    myId?: string;
    isHost?: boolean;
    onUpdateTokens?: (tokens: WhiteboardToken[]) => void;
}

export function GridBoard({ tab, selectedCell, recenterTrigger, onCellInteraction, allowedEditors, myId, isHost, onUpdateTokens }: GridBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

    const gridSize = 50; // Grid square size
    const isHex = tab.gridType === 'hex';

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

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

        const clickTimeout = useRef<NodeJS.Timeout | null>(null);
        const touchStartRef = useRef<number | null>(null);
        const longPressTimerRef = useRef<any>(null);

        const getEventCoords = () => {
            const stage = stageRef.current;
            if (!stage) return null;

            const pointer = stage.getPointerPosition();
            if (!pointer) return null;

            const clickX = (pointer.x - pos.x) / scale;
            const clickY = (pointer.y - pos.y) / scale;

            let q = 0, r = 0;
            if (isHex) {
                const coords = pixelToHex(clickX, clickY);
                q = coords.q;
                r = coords.r;
            } else {
                q = Math.floor(clickX / gridSize);
                r = Math.floor(clickY / gridSize);
            }

            const { cx, cy } = isHex 
                ? getHexCenter(q, r) 
                : { cx: (q + 0.5) * gridSize, cy: (r + 0.5) * gridSize };

            const screenX = cx * scale + pos.x;
            const screenY = cy * scale + pos.y;

            return { q, r, screenX, screenY };
        };

        const handleStageClick = (e: any) => {
            const stage = stageRef.current;
            if (!stage) return;
            if (stage.isDragging()) return;
            if (e.evt.button === 2) return; // Ignore right click

            const coords = getEventCoords();
            if (!coords) return;

            if (clickTimeout.current) {
                clearTimeout(clickTimeout.current);
                clickTimeout.current = null;
                onCellInteraction({ type: 'dblclick', ...coords });
            } else {
                clickTimeout.current = setTimeout(() => {
                    clickTimeout.current = null;
                    onCellInteraction({ type: 'click', ...coords });
                }, 250);
            }
        };

        const handleContextMenu = (e: any) => {
            e.evt.preventDefault();
            const coords = getEventCoords();
            if (coords) {
                onCellInteraction({ type: 'contextmenu', ...coords });
            }
        };

        const handleTouchStart = () => {
            const stage = stageRef.current;
            if (!stage) return;
            touchStartRef.current = Date.now();

            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = setTimeout(() => {
                const coords = getEventCoords();
                if (coords && touchStartRef.current) {
                    onCellInteraction({ type: 'longpress', ...coords });
                    touchStartRef.current = null;
                }
            }, 600);
        };

        const handleTouchEnd = () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
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
                        stroke={isDarkMode ? '#2c2c2c' : '#e0e0e0'}
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
                    stroke={isDarkMode ? '#2c2c2c' : '#e0e0e0'}
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
                    stroke={isDarkMode ? '#2c2c2c' : '#e0e0e0'}
                    strokeWidth={1 / scale}
                    listening={false}
                />
            );
        }
    }

    // Filter valid cells to render
    const cellsToRender = Object.values(tab.cells).filter(
        c => c.color || c.entries.length > 0
    );

    return (
        <div 
            ref={containerRef} 
            style={{ backgroundColor: isDarkMode ? '#161616' : '#ffffff' }}
            className="w-full h-full relative overflow-hidden select-none outline-none transition-colors duration-150"
        >
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                draggable
                onWheel={handleWheel}
                onDragStart={() => {
                    onCellInteraction({ type: 'dragstart', q: 0, r: 0, screenX: 0, screenY: 0 });
                }}
                onDragEnd={handleDragEnd}
                onClick={handleStageClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
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
                                    stroke={cell.color}
                                    strokeWidth={1.5 / scale}
                                    dash={[4, 4]}
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
                                    stroke={cell.color}
                                    strokeWidth={1.5 / scale}
                                    dash={[4, 4]}
                                    listening={false}
                                />
                            );
                        }
                    })}

                    {/* B. Entry Icon Tokens */}
                    {cellsToRender.map((cell) => {
                        if (cell.entries.length === 0) return null;

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

                        // Collect all entry icons into one display string
                        const entryIcons = cell.entries.map(e => e.icon).filter(Boolean) as string[];
                        const markersString = entryIcons.join(' ');
                        const markersLength = entryIcons.join('').length;

                        return (
                            <React.Fragment key={`content-${cell.q},${cell.r}`}>
                                {/* Entry Icons displayed in hex center */}
                                {markersString && (
                                    <Text
                                        x={tx}
                                        y={ty}
                                        width={w}
                                        height={h}
                                        text={markersString}
                                        fontSize={markersLength > 2 ? currentSize * 0.28 : markersLength > 1 ? currentSize * 0.38 : currentSize * 0.52}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                )}

                                {/* Blue dot: has entries */}
                                {isHex ? (
                                    <Rect
                                        x={tx + currentSize * 0.72}
                                        y={ty + currentSize * 0.18}
                                        width={5}
                                        height={5}
                                        fill="#0f62fe"
                                        listening={false}
                                    />
                                ) : (
                                    <Rect
                                        x={tx + gridSize - 8}
                                        y={ty + 2}
                                        width={5}
                                        height={5}
                                        fill="#0f62fe"
                                        listening={false}
                                    />
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

                {/* 4. Draggable Circular Tokens Layer */}
                <Layer>
                    {(tab.tokens || []).map((token) => {
                        const { cx, cy } = isHex
                            ? getHexCenter(token.q, token.r)
                            : { cx: (token.q + 0.5) * gridSize, cy: (token.r + 0.5) * gridSize };

                        const isDraggable = !!isHost || myId === token.ownerId || (allowedEditors || []).includes(myId || '');

                        return (
                            <Group
                                key={`token-${token.id}`}
                                x={cx}
                                y={cy}
                                draggable={isDraggable}
                                onDragStart={(e) => {
                                    e.target.scale({ x: 1.15, y: 1.15 });
                                    e.target.getLayer()?.batchDraw();
                                }}
                                onDragEnd={(e) => {
                                    e.target.scale({ x: 1, y: 1 });
                                    const dropX = e.target.x();
                                    const dropY = e.target.y();
                                    
                                    let newQ = 0;
                                    let newR = 0;
                                    if (isHex) {
                                        const coords = pixelToHex(dropX, dropY);
                                        newQ = coords.q;
                                        newR = coords.r;
                                    } else {
                                        newQ = Math.floor(dropX / gridSize);
                                        newR = Math.floor(dropY / gridSize);
                                    }
                                    
                                    const snappedCx = isHex ? getHexCenter(newQ, newR).cx : (newQ + 0.5) * gridSize;
                                    const snappedCy = isHex ? getHexCenter(newQ, newR).cy : (newR + 0.5) * gridSize;
                                        
                                    e.target.position({ x: snappedCx, y: snappedCy });
                                    e.target.getLayer()?.batchDraw();

                                    if (onUpdateTokens && tab.tokens) {
                                        const updated = tab.tokens.map(t =>
                                            t.id === token.id ? { ...t, q: newQ, r: newR } : t
                                        );
                                        onUpdateTokens(updated);
                                    }
                                }}
                            >
                                <Circle
                                    radius={18}
                                    fill={token.color}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    shadowBlur={6}
                                    shadowColor="#000000"
                                    shadowOpacity={0.4}
                                    shadowOffset={{ x: 1.5, y: 1.5 }}
                                />
                                <Text
                                    text={token.label}
                                    fill="#ffffff"
                                    fontSize={12}
                                    fontStyle="bold"
                                    align="center"
                                    verticalAlign="middle"
                                    offsetX={9}
                                    offsetY={6}
                                    width={18}
                                    height={12}
                                    listening={false}
                                />
                            </Group>
                        );
                    })}
                </Layer>
            </Stage>
        </div>
    );
}
