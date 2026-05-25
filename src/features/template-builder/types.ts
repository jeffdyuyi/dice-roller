export type ModuleType = 'variable_stat' | 'attribute' | 'trait' | 'inventory' | 'memo';

// 1. 可变数值模块 (如 HP, MP, 理智)
// 支持房主在房间面板上直接修改
export interface VariableStatModule {
    id: string;
    type: 'variable_stat';
    label: string; // 例如："生命值", "理智"
    defaultMax?: number;
    defaultCurrent?: number;
}

// 2. 常规属性模块 (如 力量, 敏捷, 或者 种族, 职业)
// 支持自定义字段，可存数字或文本
export interface AttributeField {
    id: string;
    name: string; // 例如："力量", "敏捷", "背景"
    valueType: 'number' | 'text';
}

export interface AttributeModule {
    id: string;
    type: 'attribute';
    label: string; // 例如："基础属性", "角色详情"
    fields: AttributeField[];
}

// 3. 特殊特性模块 (如 技能, 专长, 特性)
// 每个条目有独立的名称、需求细节、效果描述
export interface TraitModule {
    id: string;
    type: 'trait';
    label: string; // 例如："职业专长", "特殊技能"
}

// 4. 背包物品模块 (如 装备栏, 消耗品)
// 不限数量，用户自定义物品含有哪些可编辑条目
export interface InventoryField {
    id: string;
    name: string; // 例如："名称", "伤害", "重量"
    valueType: 'number' | 'text';
}

export interface InventoryModule {
    id: string;
    type: 'inventory';
    label: string; // 例如："行囊", "装备"
    itemFields: InventoryField[];
}

// 5. 冒险记录模块 (支持 Markdown 记录的便签区)
export interface MemoModule {
    id: string;
    type: 'memo';
    label: string; // 例如："背景故事", "冒险笔记"
}

// 所有可能的基础模块
export type SheetModule = VariableStatModule | AttributeModule | TraitModule | InventoryModule | MemoModule;

// --- 模板 Schema 数据结构 ---
export interface CharacterTemplate {
    id: string;
    name: string;
    description: string;
    author: string;
    modules: SheetModule[];
    createdAt: number;
    updatedAt: number;
}

// --- 根据模板实例化的角色卡数据结构 ---
export interface TraitItem {
    id: string;
    name: string;
    requirement: string;
    effect: string;
}

export interface InventoryItem {
    id: string;
    values: Record<string, any>; // Key 是 InventoryField 的 id
}

export interface CharacterInstance {
    id: string;
    templateId: string;
    playerId: string;
    characterName: string;
    avatarUrl?: string;
    
    // 角色数据载体，以模块 ID 为 Key 存储对应的数据
    // 例如 data['hp-mod-1'] = { current: 10, max: 10 }
    data: {
        [moduleId: string]: any; 
    };
    
    createdAt: number;
    updatedAt: number;
}
