import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import type { WhiteboardTab, WhiteboardToken, WallSegment, CellData, CellNoteEntry } from '../features/whiteboards/types';
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

const getConnectedWallPaths = (walls: WallSegment[], gridSize: number) => {
    const wallTypeSegments = walls.filter(w => w.type === 'wall');
    const otherSegments = walls.filter(w => w.type !== 'wall');
    
    const paths: { thickness: string; points: number[]; ids: string[] }[] = [];
    const visited = new Set<string>();
    
    const thicknesses = ['thin', 'standard', 'massive'] as const;
    
    for (const thick of thicknesses) {
        const thicknessWalls = wallTypeSegments.filter(w => w.thickness === thick);
        
        for (const wall of thicknessWalls) {
            if (visited.has(wall.id)) continue;
            
            const pathPoints = [wall.startX * gridSize, wall.startY * gridSize, wall.endX * gridSize, wall.endY * gridSize];
            const pathIds = [wall.id];
            visited.add(wall.id);
            
            let extended = true;
            while (extended) {
                extended = false;
                const startX = pathPoints[0];
                const startY = pathPoints[1];
                const endX = pathPoints[pathPoints.length - 2];
                const endY = pathPoints[pathPoints.length - 1];
                
                for (const other of thicknessWalls) {
                    if (visited.has(other.id)) continue;
                    
                    const osx = other.startX * gridSize;
                    const osy = other.startY * gridSize;
                    const oex = other.endX * gridSize;
                    const oey = other.endY * gridSize;
                    
                    if (Math.abs(endX - osx) < 0.1 && Math.abs(endY - osy) < 0.1) {
                        pathPoints.push(oex, oey);
                        pathIds.push(other.id);
                        visited.add(other.id);
                        extended = true;
                        break;
                    } else if (Math.abs(endX - oex) < 0.1 && Math.abs(endY - oey) < 0.1) {
                        pathPoints.push(osx, osy);
                        pathIds.push(other.id);
                        visited.add(other.id);
                        extended = true;
                        break;
                    } else if (Math.abs(startX - osx) < 0.1 && Math.abs(startY - osy) < 0.1) {
                        pathPoints.unshift(oex, oey);
                        pathIds.unshift(other.id);
                        visited.add(other.id);
                        extended = true;
                        break;
                    } else if (Math.abs(startX - oex) < 0.1 && Math.abs(startY - oey) < 0.1) {
                        pathPoints.unshift(osx, osy);
                        pathIds.unshift(other.id);
                        visited.add(other.id);
                        extended = true;
                        break;
                    }
                }
            }
            
            paths.push({
                thickness: thick,
                points: pathPoints,
                ids: pathIds
            });
        }
    }
    
    return { paths, otherSegments };
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
    wallDrawingMode?: 'wall' | 'door' | 'window' | 'delete' | null;
    wallThicknessMode?: 'thin' | 'standard' | 'massive';
    onUpdateWalls?: (walls: WallSegment[]) => void;
    fogDrawingMode?: 'paint' | 'erase' | null;
    onUpdateFogOfWar?: (fog: Record<string, boolean>) => void;
    
    // New Props for Alignment and Painting Brush
    isAlignMode?: boolean;
    onUpdateBgPosition?: (bgX: number, bgY: number, bgScale: number) => void;
    tileColorBrushMode?: string | null;
    onBatchUpdateCells?: (cellsUpdates: Record<string, Partial<CellData>>) => void;
}

export function GridBoard({ 
    tab, 
    selectedCell, 
    recenterTrigger, 
    onCellInteraction, 
    allowedEditors, 
    myId, 
    isHost, 
    onUpdateTokens,
    wallDrawingMode = null,
    wallThicknessMode = 'standard',
    onUpdateWalls,
    fogDrawingMode = null,
    onUpdateFogOfWar,
    isAlignMode = false,
    onUpdateBgPosition,
    tileColorBrushMode = null,
    onBatchUpdateCells
}: GridBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

    // Fog of war local rendering and strokes ref
    const [localFog, setLocalFog] = useState<Record<string, boolean>>({});
    const isDrawingFog = useRef(false);
    const lastDrawnCell = useRef<string | null>(null);
    const fogRef = useRef<Record<string, boolean>>({});

    // Terrain painting local rendering overlay and refs
    const [localPaintedCells, setLocalPaintedCells] = useState<Record<string, string | undefined>>({});
    const isDrawingTerrain = useRef(false);
    const lastPaintedCell = useRef<string | null>(null);
    const terrainPaintRef = useRef<Record<string, Partial<CellData>>>({});

    // Reset local painted overlays when active tab shifts
    useEffect(() => {
        setLocalPaintedCells({});
        terrainPaintRef.current = {};
    }, [tab.id]);

    useEffect(() => {
        fogRef.current = tab.fogOfWar || {};
        setLocalFog(tab.fogOfWar || {});
    }, [tab.fogOfWar]);

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

    const [drawingWall, setDrawingWall] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
    const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);

    // Transform stage absolute screen position back to logical coordinate space
    const getStageLogicalPosition = () => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;
        
        const lx = (pointer.x - pos.x) / scale;
        const ly = (pointer.y - pos.y) / scale;
        return { x: lx, y: ly };
    };

    // Calculate distance from point (px, py) to line segment (x1, y1) -> (x2, y2) in grid units
    const getDistanceToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.sqrt((px - x1)**2 + (py - y1)**2);
        
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        
        return Math.sqrt((px - projX)**2 + (py - projY)**2);
    };

    const toggleDoorState = (wallId: string) => {
        if (!onUpdateWalls) return;
        const currentWalls = tab.walls || [];
        const updated = currentWalls.map(w => {
            if (w.id === wallId && w.type === 'door') {
                return { ...w, isOpen: !w.isOpen };
            }
            return w;
        });
        onUpdateWalls(updated);
    };

    const handleDeleteWallAt = (lx: number, ly: number) => {
        if (isHex || !onUpdateWalls) return;
        const currentWalls = tab.walls || [];
        const gridX = lx / gridSize;
        const gridY = ly / gridSize;
        
        const wallToDelete = currentWalls.find(w => {
            const dist = getDistanceToSegment(gridX, gridY, w.startX, w.startY, w.endX, w.endY);
            return dist < 0.25; // Snapping distance
        });
        
        if (wallToDelete) {
            onUpdateWalls(currentWalls.filter(w => w.id !== wallToDelete.id));
        }
    };

    const handleMouseDown = (e: any) => {
        // Intercept Fog of War drawing strokes
        const coords = getEventCoords();
        if (fogDrawingMode && coords) {
            isDrawingFog.current = true;
            const key = `${coords.q},${coords.r}`;
            const nextFog = { ...fogRef.current };
            if (fogDrawingMode === 'paint') {
                nextFog[key] = true;
            } else {
                delete nextFog[key];
            }
            fogRef.current = nextFog;
            setLocalFog(nextFog);
            lastDrawnCell.current = key;
            return;
        }

        // Intercept Terrain Painting brush strokes
        if (tileColorBrushMode && coords) {
            isDrawingTerrain.current = true;
            const key = `${coords.q},${coords.r}`;
            const targetColor = tileColorBrushMode === 'eraser' ? undefined : tileColorBrushMode;
            
            terrainPaintRef.current = {
                [key]: { color: targetColor }
            };
            
            lastPaintedCell.current = key;
            setLocalPaintedCells({
                [key]: targetColor
            });
            return;
        }

        if (!wallDrawingMode || isHex) return;
        
        // Ignore right clicks
        if (e.evt.button === 2) return;
        
        const logicalPos = getStageLogicalPosition();
        if (!logicalPos) return;
        
        if (wallDrawingMode === 'delete') {
            handleDeleteWallAt(logicalPos.x, logicalPos.y);
            return;
        }
        
        // Snap to nearest 0.5 coordinate increments (vertices or midpoints)
        const snapX = Math.round((logicalPos.x / gridSize) * 2) / 2;
        const snapY = Math.round((logicalPos.y / gridSize) * 2) / 2;
        
        setDrawingWall({
            startX: snapX,
            startY: snapY,
            currentX: snapX,
            currentY: snapY
        });
    };

    const handleMouseMove = () => {
        // Intercept Fog of War drawing drag moves
        if (isDrawingFog.current && fogDrawingMode) {
            const coords = getEventCoords();
            if (coords) {
                const key = `${coords.q},${coords.r}`;
                if (key !== lastDrawnCell.current) {
                    const nextFog = { ...fogRef.current };
                    if (fogDrawingMode === 'paint') {
                        nextFog[key] = true;
                    } else {
                        delete nextFog[key];
                    }
                    fogRef.current = nextFog;
                    setLocalFog(nextFog);
                    lastDrawnCell.current = key;
                }
            }
            return;
        }

        // Intercept Terrain Painting drag moves
        if (isDrawingTerrain.current && tileColorBrushMode) {
            const coords = getEventCoords();
            if (coords) {
                const key = `${coords.q},${coords.r}`;
                if (key !== lastPaintedCell.current) {
                    const targetColor = tileColorBrushMode === 'eraser' ? undefined : tileColorBrushMode;
                    
                    terrainPaintRef.current = {
                        ...terrainPaintRef.current,
                        [key]: { color: targetColor }
                    };
                    
                    lastPaintedCell.current = key;
                    setLocalPaintedCells(prev => ({
                        ...prev,
                        [key]: targetColor
                    }));
                }
            }
            return;
        }

        if (isHex) return;
        
        const logicalPos = getStageLogicalPosition();
        if (!logicalPos) return;
        
        if (wallDrawingMode === 'delete') {
            const currentWalls = tab.walls || [];
            const gridX = logicalPos.x / gridSize;
            const gridY = logicalPos.y / gridSize;
            
            const wallNear = currentWalls.find(w => {
                const dist = getDistanceToSegment(gridX, gridY, w.startX, w.startY, w.endX, w.endY);
                return dist < 0.25;
            });
            
            setHoveredWallId(wallNear ? wallNear.id : null);
            return;
        }
        
        if (!drawingWall || !wallDrawingMode) return;
        
        const snapX = Math.round((logicalPos.x / gridSize) * 2) / 2;
        const snapY = Math.round((logicalPos.y / gridSize) * 2) / 2;
        
        setDrawingWall(prev => prev ? {
            ...prev,
            currentX: snapX,
            currentY: snapY
        } : null);
    };

    const handleMouseUp = () => {
        // End Fog of War drawing stroke
        if (isDrawingFog.current) {
            isDrawingFog.current = false;
            lastDrawnCell.current = null;
            if (onUpdateFogOfWar) {
                onUpdateFogOfWar(fogRef.current);
            }
            return;
        }

        // End Terrain Painting brush stroke
        if (isDrawingTerrain.current) {
            isDrawingTerrain.current = false;
            lastPaintedCell.current = null;
            setLocalPaintedCells({});
            if (onBatchUpdateCells && Object.keys(terrainPaintRef.current).length > 0) {
                onBatchUpdateCells(terrainPaintRef.current);
            }
            terrainPaintRef.current = {};
            return;
        }

        if (!drawingWall || !wallDrawingMode || isHex) return;
        
        const startX = drawingWall.startX;
        const startY = drawingWall.startY;
        const endX = drawingWall.currentX;
        const endY = drawingWall.currentY;
        
        setDrawingWall(null);
        
        if (startX === endX && startY === endY) return;
        
        const newWall: WallSegment = {
            id: 'wall-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
            type: wallDrawingMode as 'wall' | 'door' | 'window',
            thickness: wallThicknessMode || 'standard',
            startX,
            startY,
            endX,
            endY
        };
        
        const currentWalls = tab.walls || [];
        const isDuplicate = currentWalls.some(
            w => (w.startX === startX && w.startY === startY && w.endX === endX && w.endY === endY) ||
                 (w.startX === endX && w.startY === endY && w.endX === startX && w.endY === startY)
        );
        
        if (!isDuplicate && onUpdateWalls) {
            onUpdateWalls([...currentWalls, newWall]);
        }
    };

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
            if (wallDrawingMode) return;
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
            if (wallDrawingMode) return;
            const coords = getEventCoords();
            if (coords) {
                onCellInteraction({ type: 'contextmenu', ...coords });
            }
        };

        const handleTouchStart = () => {
            if (wallDrawingMode) return;
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

    // Filter valid cells to render, merged with local painted cell overlays
    const cellsToRenderMap = [
        ...Object.values(tab.cells),
        ...Object.entries(localPaintedCells).map(([key, color]) => {
            const [q, r] = key.split(',').map(Number);
            return {
                q,
                r,
                color,
                entries: tab.cells[key]?.entries || []
            };
        })
    ].reduce((acc, cell) => {
        // Deduplicate: localPaintedCells takes priority!
        acc[`${cell.q},${cell.r}`] = cell;
        return acc;
    }, {} as Record<string, any>);
    
    const cellsToRender = Object.values(cellsToRenderMap).filter(
        (c: any) => c.color || c.entries.length > 0
    );

    // Render preview and existing walls with smart CAD joining
    const renderWalls = () => {
        if (isHex) return null;
        
        const wallsList = tab.walls || [];
        const { paths, otherSegments } = getConnectedWallPaths(wallsList, gridSize);
        
        return (
            <Group>
                {/* 1. Connected wall paths (smooth CAD style) */}
                {paths.map((path, idx) => {
                    const thicknessWidth = 
                        path.thickness === 'thin' ? 3 :
                        path.thickness === 'massive' ? 16 : 8;
                        
                    const isHovered = path.ids.includes(hoveredWallId || '') && wallDrawingMode === 'delete';
                    
                    return (
                        <Group key={`path-${idx}`}>
                            {/* Outer Shadow & stroke */}
                            <Line
                                points={path.points}
                                stroke={isHovered ? '#fa4d56' : (isDarkMode ? '#161616' : '#262626')}
                                strokeWidth={thicknessWidth}
                                shadowColor="#000000"
                                shadowBlur={4}
                                shadowOpacity={0.4}
                                shadowOffset={{ x: 1, y: 1 }}
                                lineCap="round"
                                lineJoin="round"
                            />
                            {/* Inner fill */}
                            {thicknessWidth > 3 && (
                                <Line
                                    points={path.points}
                                    stroke={isHovered ? '#ff832b' : (isDarkMode ? '#8d8d8d' : '#e0e0e0')}
                                    strokeWidth={thicknessWidth - 4}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            )}
                        </Group>
                    );
                })}

                {/* 1.2 Doors & Windows and other individual segments */}
                {otherSegments.map((wall) => {
                    const x1 = wall.startX * gridSize;
                    const y1 = wall.startY * gridSize;
                    const x2 = wall.endX * gridSize;
                    const y2 = wall.endY * gridSize;
                    
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    if (len === 0) return null;
                    
                    const thicknessWidth = 
                        wall.thickness === 'thin' ? 3 :
                        wall.thickness === 'massive' ? 16 : 8;
                        
                    const isHovered = wall.id === hoveredWallId && wallDrawingMode === 'delete';
                    
                    if (wall.type === 'door') {
                        const isOpen = !!wall.isOpen;
                        const angle = 90 * Math.PI / 180;
                        const rx = (dx * Math.cos(angle) - dy * Math.sin(angle)) * 0.95;
                        const ry = (dx * Math.sin(angle) + dy * Math.cos(angle)) * 0.95;
                        
                        const ux = -dy / len;
                        const uy = dx / len;
                        const jambLength = thicknessWidth + 4;
                        
                        const doorColor = isHovered ? '#fa4d56' : '#ff832b';
                        const jambColor = isHovered ? '#fa4d56' : (isDarkMode ? '#8d8d8d' : '#393939');

                        return (
                            <Group 
                                key={`door-${wall.id}`}
                                onClick={() => {
                                    if (!wallDrawingMode) toggleDoorState(wall.id);
                                }}
                                onTap={() => {
                                    if (!wallDrawingMode) toggleDoorState(wall.id);
                                }}
                                onMouseEnter={(e: any) => {
                                    if (!wallDrawingMode) {
                                        const stage = e.target.getStage();
                                        if (stage) stage.container().style.cursor = 'pointer';
                                    }
                                }}
                                onMouseLeave={(e: any) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                            >
                                <Line
                                    points={[x1, y1, x2, y2]}
                                    stroke="transparent"
                                    strokeWidth={20}
                                />
                                <Line
                                    points={isOpen ? [x1, y1, x1 + rx, y1 + ry] : [x1, y1, x2, y2]}
                                    stroke={doorColor}
                                    strokeWidth={Math.max(3, thicknessWidth / 2)}
                                    lineCap="round"
                                />
                                {isOpen && (
                                    <Line
                                        points={[x1 + rx, y1 + ry, x2, y2]}
                                        stroke={doorColor}
                                        strokeWidth={1}
                                        dash={[2, 2]}
                                    />
                                )}
                                <Line
                                    points={[x1 - ux * jambLength / 2, y1 - uy * jambLength / 2, x1 + ux * jambLength / 2, y1 + uy * jambLength / 2]}
                                    stroke={jambColor}
                                    strokeWidth={2}
                                />
                                <Line
                                    points={[x2 - ux * jambLength / 2, y2 - uy * jambLength / 2, x2 + ux * jambLength / 2, y2 + uy * jambLength / 2]}
                                    stroke={jambColor}
                                    strokeWidth={2}
                                />
                            </Group>
                        );
                    } else if (wall.type === 'window') {
                        const ux = -dy / len;
                        const uy = dx / len;
                        const spacing = Math.max(2, thicknessWidth / 3);
                        
                        return (
                            <Group key={`window-${wall.id}`}>
                                <Line
                                    points={[x1, y1, x2, y2]}
                                    stroke={isHovered ? '#fa4d56' : (isDarkMode ? '#262626' : '#f4f4f4')}
                                    strokeWidth={thicknessWidth}
                                    lineCap="square"
                                />
                                <Line
                                    points={[x1, y1, x2, y2]}
                                    stroke={isHovered ? '#fa4d56' : '#00d8ff'}
                                    strokeWidth={2}
                                />
                                <Line
                                    points={[x1 + ux * spacing, y1 + uy * spacing, x2 + ux * spacing, y2 + uy * spacing]}
                                    stroke={isHovered ? '#fa4d56' : (isDarkMode ? '#8d8d8d' : '#525252')}
                                    strokeWidth={1}
                                />
                                <Line
                                    points={[x1 - ux * spacing, y1 - uy * spacing, x2 - ux * spacing, y2 - uy * spacing]}
                                    stroke={isHovered ? '#fa4d56' : (isDarkMode ? '#8d8d8d' : '#525252')}
                                    strokeWidth={1}
                                />
                            </Group>
                        );
                    }
                    return null;
                })}
                
                {/* 2. Drawing preview line */}
                {drawingWall && (
                    <Group>
                        <Line
                            points={[
                                drawingWall.startX * gridSize,
                                drawingWall.startY * gridSize,
                                drawingWall.currentX * gridSize,
                                drawingWall.currentY * gridSize
                            ]}
                            stroke="#ff832b"
                            strokeWidth={
                                wallThicknessMode === 'thin' ? 3 :
                                wallThicknessMode === 'massive' ? 16 : 8
                            }
                            opacity={0.6}
                            dash={[4, 4]}
                        />
                        <Circle
                            x={drawingWall.startX * gridSize}
                            y={drawingWall.startY * gridSize}
                            radius={5}
                            fill="#ff832b"
                        />
                        <Circle
                            x={drawingWall.currentX * gridSize}
                            y={drawingWall.currentY * gridSize}
                            radius={5}
                            fill="#ff832b"
                        />
                    </Group>
                )}
            </Group>
        );
    };

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
                draggable={!wallDrawingMode && !fogDrawingMode && !isAlignMode && !tileColorBrushMode}
                onWheel={handleWheel}
                onDragStart={() => {
                     onCellInteraction({ type: 'dragstart', q: 0, r: 0, screenX: 0, screenY: 0 });
                }}
                onDragEnd={handleDragEnd}
                onClick={handleStageClick}
                onContextMenu={handleContextMenu}
                onTouchStart={(e) => {
                    handleTouchStart();
                    handleMouseDown(e);
                }}
                onTouchEnd={() => {
                    handleTouchEnd();
                    handleMouseUp();
                }}
                onTouchMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
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
                            x={tab.bgX ?? 0}
                            y={tab.bgY ?? 0}
                            scaleX={tab.bgScale ?? 1}
                            scaleY={tab.bgScale ?? 1}
                            opacity={tab.bgOpacity ?? 0.5}
                            listening={isAlignMode}
                            draggable={isAlignMode}
                            onDragEnd={(e) => {
                                const newBgX = Math.round(e.target.x());
                                const newBgY = Math.round(e.target.y());
                                if (onUpdateBgPosition) {
                                    onUpdateBgPosition(newBgX, newBgY, tab.bgScale ?? 1);
                                }
                            }}
                            onMouseEnter={(e: any) => {
                                if (isAlignMode) {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'move';
                                }
                            }}
                            onMouseLeave={(e: any) => {
                                const stage = e.target.getStage();
                                if (stage) stage.container().style.cursor = 'default';
                            }}
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
                </Layer>

                {/* 3.5. Vector snapped walls, doors, windows layer */}
                <Layer>
                    {renderWalls()}
                </Layer>

                {/* 3.6. Fog of War Layer (High-performance Viewport Culling & Double Opacity Mask) */}
                {tab.fogEnabled && (
                    <Layer>
                        {(() => {
                            const fogShapes = [];
                            const fogKeys = Object.keys(localFog);
                            
                            for (const key of fogKeys) {
                                if (!localFog[key]) continue;
                                const parts = key.split(',');
                                const q = parseInt(parts[0], 10);
                                const r = parseInt(parts[1], 10);
                                if (isNaN(q) || isNaN(r)) continue;

                                // 1. Dynamic Viewport Culling bounds check
                                if (isHex) {
                                    const { cx, cy } = getHexCenter(q, r);
                                    const isVisible = 
                                        cx >= minX - hexSize * 2 &&
                                        cx <= maxX + hexSize * 2 &&
                                        cy >= minY - hexSize * 2 &&
                                        cy <= maxY + hexSize * 2;
                                        
                                    if (!isVisible) continue;
                                    
                                    fogShapes.push(
                                        <Line
                                            key={`fog-${key}`}
                                            points={getHexPoints(cx, cy, hexSize + 0.5)}
                                            closed
                                            fill="#000000"
                                            opacity={isHost ? 0.35 : 1.0}
                                            listening={false}
                                        />
                                    );
                                } else {
                                    const x = q * gridSize;
                                    const y = r * gridSize;
                                    const isVisible = 
                                        x >= minX - gridSize * 2 &&
                                        x <= maxX + gridSize * 2 &&
                                        y >= minY - gridSize * 2 &&
                                        y <= maxY + gridSize * 2;
                                        
                                    if (!isVisible) continue;

                                    fogShapes.push(
                                        <Rect
                                            key={`fog-${key}`}
                                            x={x}
                                            y={y}
                                            width={gridSize}
                                            height={gridSize}
                                            fill="#000000"
                                            opacity={isHost ? 0.35 : 1.0}
                                            listening={false}
                                        />
                                    );
                                }
                            }
                            return fogShapes;
                        })()}
                    </Layer>
                )}

                {/* 3.7. Cell annotations, markers, notes, selected highlight layer */}
                <Layer>
                    {/* B. Entry Icon Tokens */}
                    {cellsToRender.filter(cell => {
                        const isFogged = localFog[`${cell.q},${cell.r}`];
                        if (tab.fogEnabled && isFogged && !isHost) {
                            return false;
                        }
                        return true;
                    }).map((cell) => {
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
                        const entryIcons = cell.entries.map((e: CellNoteEntry) => e.icon).filter(Boolean) as string[];
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
                    {selectedCell && (() => {
                        const isFogged = localFog[`${selectedCell.q},${selectedCell.r}`];
                        if (tab.fogEnabled && isFogged && !isHost) return null;
                        
                        return isHex ? (() => {
                            const { cx, cy } = getHexCenter(selectedCell.q, selectedCell.r);
                            return (
                                <Line
                                    points={getHexPoints(cx, cy, hexSize)}
                                    closed
                                    stroke="#ff832b"
                                    strokeWidth={3 / scale}
                                    fill="rgba(255, 131, 43, 0.04)"
                                    listening={false}
                                />
                            );
                        })() : (
                            <Rect
                                x={selectedCell.q * gridSize}
                                y={selectedCell.r * gridSize}
                                width={gridSize}
                                height={gridSize}
                                stroke="#ff832b"
                                strokeWidth={3 / scale}
                                fill="rgba(255, 131, 43, 0.04)"
                                listening={false}
                            />
                        );
                    })()}
                </Layer>

                {/* 4. Draggable Circular Tokens Layer */}
                <Layer>
                    {(tab.tokens || []).filter(token => {
                        const isFogged = localFog[`${token.q},${token.r}`];
                        if (tab.fogEnabled && isFogged && !isHost) {
                            return false;
                        }
                        return true;
                    }).map((token) => {
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
