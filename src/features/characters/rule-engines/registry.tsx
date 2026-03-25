import { getCharacter } from '../api';
import { Dnd5eCreator } from './dnd5e/Dnd5eCreator';
import { Dnd5eCard } from './dnd5e/Dnd5eCard';
import { Dnd5eHostInspector } from './dnd5e/Dnd5eHostInspector';
import { Dnd2024Creator } from './dnd2024/Dnd2024Creator';
import { Dnd2024Card } from './dnd2024/Dnd2024Card';
import { Dnd2024HostInspector } from './dnd2024/Dnd2024HostInspector';
import type { RuleEngine } from './types';

export const ruleRegistry: Record<string, RuleEngine> = {
    'dnd5e': {
        id: 'dnd5e',
        displayName: 'D&D 5th Edition',
        CreatorComponent: Dnd5eCreator,
        CardComponent: Dnd5eCard,
        HostInspectorComponent: Dnd5eHostInspector,
        validateData: (data) => {
            return !!(data.class && data.race && data.abilities);
        }
    },
    'dnd2024': {
        id: 'dnd2024',
        displayName: 'D&D 2024 (新版)',
        CreatorComponent: Dnd2024Creator,
        CardComponent: Dnd2024Card,
        HostInspectorComponent: Dnd2024HostInspector,
        validateData: (data) => {
            return !!(data.name && data.className);
        }
    },
    'coc7th': {
        id: 'coc7th',
        displayName: '克苏鲁的呼唤 7版',
        CreatorComponent: () => <div className="p-4 text-slate-400 italic font-bold">COC 7th 车卡器正在开发中...</div>,
        CardComponent: ({ data }) => <div className="p-4 bg-slate-800 text-white rounded-2xl shadow-xl font-black italic">调查员: {data.name || '无名小卒'}</div>,
        validateData: () => true
    }
};

export function loadCharacterWithEngine(id: string) {
    const char = getCharacter(id);
    if (!char) return null;
    const engine = ruleRegistry[char.ruleSystem];
    if (!engine) return null;
    return { char, engine };
}
