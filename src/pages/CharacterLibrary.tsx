import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters, deleteCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/types';

export function CharacterLibrary() {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);

    const refreshCharacters = async () => {
        // user id is 'local-user' since we bypassed auth
        const chars = await getMyCharacters('local-user');
        setCharacters(chars);
    };

    useEffect(() => {
        refreshCharacters();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确认删除该角色备忘库吗？这会抹除其中的所有已存笔记条目！')) return;
        await deleteCharacter(id);
        await refreshCharacters();
    };

    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto w-full h-full flex flex-col">
            <header className="mb-12 flex justify-between items-end border-b border-ibm-border pb-6 shrink-0">
                <div>
                    <h1 className="text-ibm-text text-4xl font-sans font-light tracking-tight mb-2">备忘库存</h1>
                    <p className="text-ibm-textSecondary font-sans text-sm">管理您的角色设定档及接收到的冒险备忘录</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => navigate('/characters/new')} 
                        className="h-10 px-6 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all font-sans text-[14px]"
                    >
                        + 塑造新角色
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-ibm-border border-dashed">
                        <div className="w-16 h-16 border border-ibm-border flex items-center justify-center text-ibm-textSecondary mb-4">
                            <span className="font-mono text-2xl">M</span>
                        </div>
                        <h3 className="text-ibm-text font-sans text-lg mb-2">暂无角色备忘库</h3>
                        <p className="text-ibm-textSecondary font-sans text-[13px] text-center max-w-sm mb-6">
                            点击右上角塑造新角色，创建角色后，在联机房间中接收主持人分发的冒险备忘，或者在个人看板上管理角色设定。
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {characters.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => navigate(`/characters`)} // Currently navigates to list, can expand detail view in future
                                className="p-6 border border-ibm-border bg-ibm-layer hover:border-ibm-borderStrong transition-all duration-200 cursor-pointer flex flex-col group relative"
                            >
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleDelete(c.id, e)}
                                        className="text-ibm-textSecondary hover:text-[#fa4d56] font-mono text-xs"
                                        title="删除角色卡"
                                    >
                                        删除
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-ibm-background flex items-center justify-center text-ibm-text font-mono font-medium text-lg border border-ibm-border">
                                        {c.name ? c.name[0] : '角'}
                                    </div>
                                    <div className="truncate flex-1">
                                        <h3 className="text-[18px] font-sans font-medium text-ibm-text truncate pr-8">{c.name}</h3>
                                        <p className="text-[12px] text-ibm-textSecondary mt-0.5">
                                            记录条目: {c.memoItems?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-ibm-border/40 flex justify-between items-center">
                                    <span className="text-[12px] text-ibm-textSecondary font-mono uppercase px-2 py-0.5 border border-ibm-border">
                                        {c.summary || '备忘库存'}
                                    </span>
                                    <span className="text-[12px] text-ibm-primary group-hover:underline">查看管理 →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
