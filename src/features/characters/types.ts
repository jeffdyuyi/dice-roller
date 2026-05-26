export interface Character {
    id: string;
    name: string;
    userId: string;
    avatarUrl?: string;
    summary?: string;
    createdAt: number;
    updatedAt: number;
    memoContent?: string;
}
