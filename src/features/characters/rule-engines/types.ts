// 通用角色基础数据
export interface Character {
    id: string;
    userId: string;
    ruleSystem: string;
    name: string;
    level: number;
    avatarUrl?: string;
    summary?: string;
    characterData: Record<string, any>; // 规则特定的 JSON
    inventory: any[];
    experience: number;
    currency: Record<string, number>;
    createdAt: number;
}

export interface CreatorProps {
    data: Record<string, any>;
    onChange: (data: Record<string, any>) => void;
}

export interface CardProps {
    data: Record<string, any>;
    compact?: boolean;
}

export interface HostInspectorProps {
    data: Record<string, any>;
    onChange: (newData: Record<string, any>) => void;
}

export interface AdjustFieldDef {
    id: string;
    label: string;
    type: 'number' | 'text' | 'boolean';
}

export interface RuleEngine {
    id: string;
    displayName: string;
    CreatorComponent: React.ComponentType<CreatorProps>;
    CardComponent: React.ComponentType<CardProps>;
    HostInspectorComponent?: React.ComponentType<HostInspectorProps>;
    validateData: (data: Record<string, any>) => boolean;
}
