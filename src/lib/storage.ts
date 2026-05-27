import localforage from 'localforage';

localforage.config({
    name: 'dice_roller_db',
    storeName: 'trpg_data', // Should be alphanumeric, with underscores
    description: 'Storage for characters and templates'
});

export const Storage = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await localforage.getItem<T>(key);
            if (data === null) {
                // Fallback to localStorage for migration
                const lsData = localStorage.getItem(key);
                if (lsData) {
                    try {
                        const parsed = JSON.parse(lsData);
                        await localforage.setItem(key, parsed);
                        return parsed;
                    } catch {
                        return lsData as any;
                    }
                }
            }
            return data;
        } catch (e) {
            console.error(`Error reading ${key} from storage:`, e);
            return null;
        }
    },

    async set<T>(key: string, value: T): Promise<void> {
        try {
            await localforage.setItem(key, value);
            // Sync to localStorage for fallback/migration during development
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (lsErr) {
                console.warn(`LocalStorage backup skipped for ${key} (likely quota exceeded):`, lsErr);
            }
        } catch (e) {
            console.error(`Error saving ${key} to storage:`, e);
            throw e;
        }
    },

    async remove(key: string): Promise<void> {
        try {
            await localforage.removeItem(key);
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Error removing ${key} from storage:`, e);
        }
    }
};
