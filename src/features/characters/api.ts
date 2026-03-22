import type { Character } from './rule-engines/types';

const STORAGE_KEY = 'mock_characters';

// 模拟 API: 获取当前用户的所有角色
export function getMyCharacters(userId: string): Character[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        const all: Character[] = JSON.parse(data);
        return all.filter(c => c.userId === userId);
    } catch {
        return [];
    }
}

// 模拟 API: 获取单张角色卡
export function getCharacter(id: string): Character | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
        const all: Character[] = JSON.parse(data);
        return all.find(c => c.id === id) || null;
    } catch {
        return null;
    }
}

// 模拟 API: 保存/新建角色
export function saveCharacter(char: Character): void {
    const data = localStorage.getItem(STORAGE_KEY);
    let all: Character[] = [];
    if (data) {
        try { all = JSON.parse(data); } catch { }
    }
    const idx = all.findIndex(c => c.id === char.id);
    if (idx >= 0) {
        all[idx] = char;
    } else {
        all.push(char);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// 模拟 API: 删除角色
export function deleteCharacter(id: string): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    try {
        let all: Character[] = JSON.parse(data);
        all = all.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { }
}
