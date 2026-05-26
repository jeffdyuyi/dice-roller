import type { Character } from './types';
import { Storage } from '../../lib/storage';

const STORAGE_KEY = 'mock_characters';

// 模拟 API: 获取当前用户的所有角色
export async function getMyCharacters(userId: string): Promise<Character[]> {
    const data = await Storage.get<Character[]>(STORAGE_KEY);
    if (!data) return [];
    return data.filter(c => c.userId === userId);
}

// 模拟 API: 获取单张角色卡
export async function getCharacter(id: string): Promise<Character | null> {
    const data = await Storage.get<Character[]>(STORAGE_KEY);
    if (!data) return null;
    return data.find(c => c.id === id) || null;
}

// 模拟 API: 保存/新建角色
export async function saveCharacter(char: Character): Promise<void> {
    let all = await Storage.get<Character[]>(STORAGE_KEY) || [];
    const idx = all.findIndex(c => c.id === char.id);
    if (idx >= 0) {
        all[idx] = char;
    } else {
        all.push(char);
    }
    await Storage.set(STORAGE_KEY, all);
}

// 模拟 API: 删除角色
export async function deleteCharacter(id: string): Promise<void> {
    let all = await Storage.get<Character[]>(STORAGE_KEY);
    if (!all) return;
    all = all.filter(c => c.id !== id);
    await Storage.set(STORAGE_KEY, all);
}
