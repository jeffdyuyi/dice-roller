export interface CellNoteEntry {
    id: string;
    icon?: string; // Optional emoji or single Chinese character marker
    mdContent: string;
    author: string;
    timestamp: number;
}

export interface CellData {
    q: number; // For square grids, q is x, r is y
    r: number;
    color?: string;   // Hex background color fill
    entries: CellNoteEntry[];
}

export interface WhiteboardToken {
    id: string;
    q: number; // grid coordinate X / Q
    r: number; // grid coordinate Y / R
    color: string; // token circle fill color
    label: string; // single English or Chinese character
    ownerId: string; // player ID who placed it
    ownerName: string; // player name who placed it
}

export interface WallSegment {
    id: string;
    type: 'wall' | 'door' | 'window';
    thickness: 'thin' | 'standard' | 'massive';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isOpen?: boolean; // Toggles door swing state
}

export interface WhiteboardTab {
    id: string;
    name: string;
    gridType: 'square' | 'hex';
    bgImage?: string; // Base64 data URL
    bgOpacity?: number; // 0 to 1
    cells: Record<string, CellData>; // Keyed by "q,r" or "x,y"
    tokens?: WhiteboardToken[]; // Player circular draggable tokens
    walls?: WallSegment[]; // List of snapped wall/door/window segments
}

export interface WhiteboardProject {
    id: string;
    name: string;
    userId: string;
    updatedAt: number;
    tabs: WhiteboardTab[];
    hostName?: string;
    allowedEditors?: string[]; // IDs of players with editing permissions
}
