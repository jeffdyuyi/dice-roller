import type { WhiteboardProject } from './types';
import { Storage } from '../../lib/storage';

const STORAGE_KEY = 'mock_whiteboards';

// Get all whiteboards for a user
export async function getMyWhiteboards(userId: string): Promise<WhiteboardProject[]> {
    const data = await Storage.get<WhiteboardProject[]>(STORAGE_KEY);
    if (!data) return [];
    return data.filter(w => w.userId === userId);
}

// Get a single whiteboard by ID
export async function getWhiteboard(id: string): Promise<WhiteboardProject | null> {
    const data = await Storage.get<WhiteboardProject[]>(STORAGE_KEY);
    if (!data) return null;
    return data.find(w => w.id === id) || null;
}

// Save or create a whiteboard
export async function saveWhiteboard(board: WhiteboardProject): Promise<void> {
    let all = await Storage.get<WhiteboardProject[]>(STORAGE_KEY) || [];
    const idx = all.findIndex(w => w.id === board.id);
    if (idx >= 0) {
        all[idx] = { ...board, updatedAt: Date.now() };
    } else {
        all.push({ ...board, updatedAt: Date.now() });
    }
    await Storage.set(STORAGE_KEY, all);
}

// Delete a whiteboard
export async function deleteWhiteboard(id: string): Promise<void> {
    let all = await Storage.get<WhiteboardProject[]>(STORAGE_KEY);
    if (!all) return;
    all = all.filter(w => w.id !== id);
    await Storage.set(STORAGE_KEY, all);
}
