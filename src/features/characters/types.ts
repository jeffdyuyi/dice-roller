export interface MemoItem {
    id: string;
    content: string;
    createdAt: number;
    source: 'self' | 'host';
}

export interface Character {
    id: string;
    name: string;
    userId: string;
    avatarUrl?: string;
    summary?: string;
    createdAt: number;
    updatedAt: number;
    memoContent?: string; // Legacy
    memoItems?: MemoItem[];
}
