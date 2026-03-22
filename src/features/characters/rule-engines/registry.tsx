import { getCharacter } from '../api';
import { Dnd5eCreator } from './dnd5e/Dnd5eCreator';
import { Dnd5eCard } from './dnd5e/Dnd5eCard';
import type { RuleEngine } from './types';

export const ruleRegistry: Record<string, RuleEngine> = {
    'dnd5e': {
        id: 'dnd5e',
        displayName: 'D&D 5th Edition',
        CreatorComponent: Dnd5eCreator,
        CardComponent: Dnd5eCard,
        adjustableFields: [
            { id: 'hp.current', label: '当前生命值', type: 'number' },
            { id: 'level', label: '等级', type: 'number' }
        ],
        validateData: (data) => {
            return !!(data.class && data.race && data.abilities);
        }
    },
    'coc7th': {
        id: 'coc7th',
        displayName: '克苏鲁的呼唤 7版',
        CreatorComponent: () => <div className="p-4 text-slate-400 italic font-bold">COC 7th 车卡器正在开发中...</div>,
        CardComponent: ({ data }) => <div className="p-4 bg-slate-800 text-white rounded-2xl shadow-xl font-black italic">调查员: {data.name || '无名小卒'}</div>,
        adjustableFields: [],
        validateData: () => true
    }
};

export function loadCharacterWithEngine(id: string) {
    const char = getCharacter(id);
    if (!char) return null;
    const engine = ruleRegistry[char.ruleSystem];
    return { char, engine };
}
