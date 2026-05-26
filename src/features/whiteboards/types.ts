export interface CellNoteEntry {
    id: string;
    mdContent: string;
    author: string;
    timestamp: number;
}

export interface CellData {
    q: number; // For square grids, q is x, r is y
    r: number;
    terrain?: string; // e.g. 🌿, 🧱, 🌊 (bottom layer)
    object?: string;  // e.g. 🚪, 💎, 🗝️ (middle layer)
    unit?: string;    // e.g. 👤, 🐉, 🏹, "战士" (top player/monster layer)
    entries: CellNoteEntry[];
}

export interface WhiteboardTab {
    id: string;
    name: string;
    gridType: 'square' | 'hex';
    bgImage?: string; // Base64 data URL
    bgOpacity?: number; // 0 to 1
    cells: Record<string, CellData>; // Keyed by "q,r" or "x,y"
}

export interface WhiteboardProject {
    id: string;
    name: string;
    userId: string;
    updatedAt: number;
    tabs: WhiteboardTab[];
}
