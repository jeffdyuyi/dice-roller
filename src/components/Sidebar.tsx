import { useState, useRef } from 'react';
import { parseAndRollFormula, rollDaggerheart } from '../lib/diceCore';
import { useMqttContext } from '../contexts/MqttContext';

interface SidebarProps {
    onRoll: (rollData: any) => void;
}

export function Sidebar({ onRoll }: SidebarProps) {
    const { isHost, connectedPlayers, roomTemplate, patchCharacter, commState } = useMqttContext();

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        formula: true,
        daggerheart: false,
        hostStats: true,
        hostItems: false
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    const [formulaText, setFormulaText] = useState('');
    const [dhMod, setDhMod] = useState(0);
    const [dhAdv, setDhAdv] = useState<'none' | 'advantage' | 'disadvantage'>('none');
    const [isHidden, setIsHidden] = useState(false);

    // Host Tools State
    const [statTargetPlayer, setStatTargetPlayer] = useState<string>('');
    const [statTargetModule, setStatTargetModule] = useState<string>('');
    const [itemTargetPlayer, setItemTargetPlayer] = useState<string>('all');
    const [itemTargetModule, setItemTargetModule] = useState<string>('');
    const [itemText, setItemText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertMarkdown = (prefix: string, suffix: string = '') => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = itemText;
        const selected = text.slice(start, end);
        const before = text.slice(0, start);
        const after = text.slice(end);
        
        const inserted = suffix ? `${prefix}${selected || '内容'}${suffix}` : `${prefix}${selected}`;
        setItemText(before + inserted + after);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = start + prefix.length + (selected ? selected.length : '内容'.length);
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const validPlayers = connectedPlayers.filter(p => !p.isHost && p.characterData);
    const statModules = roomTemplate?.modules?.filter((m: any) => m.type === 'variable_stat') || [];
    const itemModules = roomTemplate?.modules?.filter((m: any) => m.type === 'trait' || m.type === 'inventory' || m.type === 'memo') || [];

    // Auto-select first available options
    if (!statTargetPlayer && validPlayers.length > 0) setStatTargetPlayer(validPlayers[0].id);
    if (!statTargetModule && statModules.length > 0) setStatTargetModule(statModules[0].id);
    if (!itemTargetModule && itemModules.length > 0) setItemTargetModule(itemModules[0].id);

    const selectedPlayerForStat = connectedPlayers.find(p => p.id === statTargetPlayer);
    const currentStatValue = selectedPlayerForStat?.characterData?.[statTargetModule]?.current ?? 0;

    const setStatValue = (val: number) => {
        if (!statTargetPlayer || !statTargetModule) return;
        const player = connectedPlayers.find(p => p.id === statTargetPlayer);
        if (!player || !player.characterData) return;
        
        const currentData = player.characterData[statTargetModule] || { current: 0 };
        const newData = { ...currentData, current: val };
        patchCharacter(statTargetPlayer, statTargetModule, newData);
    };

    const handleItemSend = () => {
        if (!itemTargetModule || !itemText.trim()) return;
        
        const targetIds = itemTargetPlayer === 'all' 
            ? validPlayers.map(p => p.id)
            : [itemTargetPlayer];

        if (targetIds.length === 0) {
            alert('没有有效的目标玩家');
            return;
        }

        const newItem = { id: crypto.randomUUID(), text: itemText };

        targetIds.forEach(id => {
            const player = connectedPlayers.find(p => p.id === id);
            if (!player || !player.characterData) return;

            const modData = player.characterData[itemTargetModule] || { list: [] };
            const list = Array.isArray(modData.list) ? modData.list : [];
            const newData = { ...modData, list: [...list, newItem] };
            patchCharacter(id, itemTargetModule, newData);
        });

        setItemText('');
    };

    const handleFormulaRoll = () => {
        try {
            const result = parseAndRollFormula(formulaText || '0');
            onRoll({ ...result, isHidden });
        } catch (e: any) {
            alert(e.message || '公式格式错误');
        }
    };

    const handleDhRoll = () => {
        const result = rollDaggerheart(dhMod, dhAdv);
        onRoll({ ...result, isHidden });
    };

    const insertText = (text: string) => {
        let val = text;
        if (text === '+' || text === '-') val = ` ${text} `;
        setFormulaText(prev => prev + val);
    };

    const adjustValue = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min?: number) => {
        setter(prev => {
            const next = prev + delta;
            if (min !== undefined && next < min) return min;
            return next;
        });
    };

    return (
        <aside className="w-full md:w-[320px] bg-x-dark border-r border-x-border flex flex-col h-[60%] md:h-full shrink-0 z-20 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">

                {/* Formula Section */}
                <div className="border-b border-x-border">
                    <button 
                        onClick={() => toggleSection('formula')}
                        className="w-full flex justify-between items-center p-5 hover:bg-x-surface transition-colors text-left"
                    >
                        <span className="text-[14px] font-sans uppercase tracking-widest text-x-white">公式</span>
                        <span className="font-mono text-x-muted text-[16px]">{openSections.formula ? '-' : '+'}</span>
                    </button>
                    {openSections.formula && (
                        <div className="px-5 pb-8 space-y-6 animate-in fade-in duration-300">
                            <div className="bg-transparent border border-x-border p-6 relative">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[12px] font-mono text-x-muted uppercase tracking-xai flex items-center gap-2">
                                        掷骰公式
                                    </label>
                                    <button onClick={() => setFormulaText('')} className="text-x-muted hover:text-x-white transition-colors font-mono">
                                        X
                                    </button>
                                </div>
                                <textarea
                                    value={formulaText}
                                    onChange={e => setFormulaText(e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent text-x-white font-mono text-[24px] focus:outline-none placeholder-x-muted resize-none leading-relaxed"
                                    placeholder="输入公式 如 2d20 + 8"
                                />
                                
                                <div className="mt-8 pt-4 border-t border-x-border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsHidden(!isHidden)}
                                            className={`flex items-center justify-center w-6 h-6 border transition-all ${isHidden ? 'bg-x-white border-x-white' : 'bg-transparent border-x-border hover:border-x-borderStrong'}`}
                                        >
                                            {isHidden && <span className="text-x-dark text-[14px] leading-none">×</span>}
                                        </button>
                                        <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai cursor-pointer select-none" onClick={() => setIsHidden(!isHidden)}>暗骰</span>
                                    </div>
                                    <button onClick={handleFormulaRoll} className="bg-x-white text-x-dark px-10 py-2.5 text-[14px] font-mono uppercase tracking-xai transition-all hover:bg-white/90">执 行</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2.5">
                                {/* Dice Shortcuts */}
                                {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                    <button key={d} onClick={() => insertText(d)} className="h-11 bg-transparent border border-x-border text-[14px] font-mono text-x-muted hover:bg-x-surface hover:text-x-white hover:border-x-borderStrong transition-all">{d.toUpperCase()}</button>
                                ))}
                                <button onClick={() => setFormulaText(p => p.slice(0, -1))} className="h-11 bg-transparent text-x-muted border border-x-border hover:bg-x-surface hover:text-x-white transition-all font-mono">DEL</button>

                                {/* Number Pad and Operators */}
                                {[7, 8, 9, '+', 4, 5, 6, '-', 1, 2, 3, 'd', 0].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => insertText(item.toString())}
                                        className={`h-11 font-mono transition-all border border-x-border text-[16px] hover:border-x-borderStrong ${typeof item === 'number' || item === '0' || item === 'd'
                                            ? 'bg-transparent text-x-white hover:bg-x-surface'
                                            : 'bg-x-surface text-x-white hover:bg-x-borderStrong'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}

                                {/* Execute Button in Grid */}
                                <button onClick={handleFormulaRoll} className="col-span-3 h-11 bg-x-white text-x-dark font-mono text-[14px] tracking-xai uppercase hover:bg-white/90 transition-all flex items-center justify-center gap-3">
                                    执 行
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Daggerheart Section */}
                <div className="border-b border-x-border">
                    <button 
                        onClick={() => toggleSection('daggerheart')}
                        className="w-full flex justify-between items-center p-5 hover:bg-x-surface transition-colors text-left"
                    >
                        <span className="text-[14px] font-sans uppercase tracking-widest text-x-white">二元骰</span>
                        <span className="font-mono text-x-muted text-[16px]">{openSections.daggerheart ? '-' : '+'}</span>
                    </button>
                    {openSections.daggerheart && (
                        <div className="px-5 pb-8 flex flex-col items-center space-y-8 animate-in fade-in duration-300">
                            <div className="flex gap-6 items-center bg-transparent p-6 border border-x-border relative w-full justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <span className="text-[14px] font-mono text-x-white tracking-xai uppercase">希望</span>
                                </div>
                                <div className="text-x-muted font-mono text-lg">VS</div>
                                <div className="flex flex-col items-center gap-3">
                                    <span className="text-[14px] font-mono text-x-muted tracking-xai uppercase">恐惧</span>
                                </div>
                            </div>

                            <div className="w-full space-y-6">
                                <div className="flex items-center justify-center h-14 bg-transparent border border-x-border focus-within:border-x-borderStrong transition-all group">
                                    <button onClick={() => adjustValue(setDhMod, -1)} className="w-16 h-full text-x-muted hover:text-x-white transition-colors hover:bg-x-surface font-mono">-</button>
                                    <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-center font-mono text-x-white outline-none text-[20px]" />
                                    <button onClick={() => adjustValue(setDhMod, 1)} className="w-16 h-full text-x-muted hover:text-x-white transition-colors hover:bg-x-surface font-mono">+</button>
                                </div>

                                {/* Daggerheart Advantage Toggle */}
                                <div className="flex bg-x-surface p-1 border border-x-border">
                                    {(['none', 'advantage', 'disadvantage'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setDhAdv(type)}
                                            className={`flex-1 py-2.5 text-[12px] font-mono tracking-xai uppercase transition-all ${dhAdv === type
                                                ? 'bg-x-white text-x-dark border border-transparent'
                                                : 'text-x-muted hover:text-x-white hover:bg-x-surface border border-transparent'
                                                }`}
                                        >
                                            {type === 'none' ? '常规' : type === 'advantage' ? '优势' : '劣势'}
                                        </button>
                                    ))}
                                </div>

                                <button onClick={handleDhRoll} className="w-full bg-x-white text-x-dark font-mono py-4 uppercase tracking-xai transition-all hover:bg-white/90">
                                    结果判定
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Host Tools */}
                {commState === 'CONNECTED' && isHost && (
                    <>
                        {/* Host Stats Section */}
                        <div className="border-b border-x-border">
                            <button 
                                onClick={() => toggleSection('hostStats')}
                                className="w-full flex justify-between items-center p-5 hover:bg-x-surface transition-colors text-left"
                            >
                                <span className="text-[14px] font-sans uppercase tracking-widest text-x-white">快速数值管理</span>
                                <span className="font-mono text-x-muted text-[16px]">{openSections.hostStats ? '-' : '+'}</span>
                            </button>
                            {openSections.hostStats && (
                                <div className="px-5 pb-8 space-y-4 animate-in fade-in duration-300">
                                    <div className="group">
                                        <select value={statTargetPlayer} onChange={e => setStatTargetPlayer(e.target.value)} className="w-full bg-transparent border border-x-border px-4 py-2 text-[14px] font-mono text-x-white outline-none cursor-pointer hover:border-x-borderStrong">
                                            {validPlayers.map(p => <option key={p.id} value={p.id} className="bg-x-dark">{p.name}</option>)}
                                            {validPlayers.length === 0 && <option disabled value="">无存活玩家</option>}
                                        </select>
                                    </div>
                                    <div className="group">
                                        <select value={statTargetModule} onChange={e => setStatTargetModule(e.target.value)} className="w-full bg-transparent border border-x-border px-4 py-2 text-[14px] font-mono text-x-white outline-none cursor-pointer hover:border-x-borderStrong">
                                            {statModules.map((m: any) => <option key={m.id} value={m.id} className="bg-x-dark">{m.label}</option>)}
                                            {statModules.length === 0 && <option disabled value="">无数值模块</option>}
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center justify-center h-12 bg-transparent border border-x-border focus-within:border-x-borderStrong transition-all group mt-2">
                                        <button 
                                            onClick={() => setStatValue(currentStatValue - 1)} 
                                            disabled={validPlayers.length === 0 || statModules.length === 0}
                                            className="w-12 h-full text-x-muted hover:text-x-white transition-colors hover:bg-x-surface font-mono disabled:opacity-50"
                                        >
                                            -
                                        </button>
                                        <input 
                                            type="number" 
                                            value={currentStatValue} 
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setStatValue(isNaN(val) ? 0 : val);
                                            }}
                                            disabled={validPlayers.length === 0 || statModules.length === 0}
                                            className="flex-1 bg-transparent text-center font-mono text-x-white outline-none text-[16px] disabled:opacity-50" 
                                        />
                                        <button 
                                            onClick={() => setStatValue(currentStatValue + 1)} 
                                            disabled={validPlayers.length === 0 || statModules.length === 0}
                                            className="w-12 h-full text-x-muted hover:text-x-white transition-colors hover:bg-x-surface font-mono disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Host Items/Memo Section */}
                        <div className="border-b border-x-border">
                            <button 
                                onClick={() => toggleSection('hostItems')}
                                className="w-full flex justify-between items-center p-5 hover:bg-x-surface transition-colors text-left"
                            >
                                <span className="text-[14px] font-sans uppercase tracking-widest text-x-white">发放物品 / 记录</span>
                                <span className="font-mono text-x-muted text-[16px]">{openSections.hostItems ? '-' : '+'}</span>
                            </button>
                            {openSections.hostItems && (
                                <div className="px-5 pb-8 space-y-4 animate-in fade-in duration-300">
                                    <div className="flex gap-2">
                                        <select value={itemTargetPlayer} onChange={e => setItemTargetPlayer(e.target.value)} className="flex-1 bg-transparent border border-x-border px-3 py-2 text-[12px] font-mono text-x-white outline-none cursor-pointer">
                                            <option value="all" className="bg-x-dark">发送给: 全体玩家</option>
                                            {validPlayers.map(p => <option key={p.id} value={p.id} className="bg-x-dark">仅发送给: {p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <select value={itemTargetModule} onChange={e => setItemTargetModule(e.target.value)} className="flex-1 bg-transparent border border-x-border px-3 py-2 text-[12px] font-mono text-x-white outline-none cursor-pointer">
                                            {itemModules.map((m: any) => <option key={m.id} value={m.id} className="bg-x-dark">接收区: {m.label}</option>)}
                                            {itemModules.length === 0 && <option disabled value="">无适用模块</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="flex gap-1 mb-2 bg-x-surface border border-x-border p-1">
                                            <button onClick={() => insertMarkdown('**', '**')} className="w-8 h-8 flex items-center justify-center text-x-muted hover:text-x-white hover:bg-x-dark transition-colors font-sans font-bold" title="加粗">B</button>
                                            <button onClick={() => insertMarkdown('*', '*')} className="w-8 h-8 flex items-center justify-center text-x-muted hover:text-x-white hover:bg-x-dark transition-colors font-sans italic" title="斜体">I</button>
                                            <button onClick={() => insertMarkdown('~~', '~~')} className="w-8 h-8 flex items-center justify-center text-x-muted hover:text-x-white hover:bg-x-dark transition-colors font-sans line-through" title="删除线">S</button>
                                            <div className="w-px bg-x-border mx-1 my-1"></div>
                                            <button onClick={() => insertMarkdown('> ')} className="w-8 h-8 flex items-center justify-center text-x-muted hover:text-x-white hover:bg-x-dark transition-colors font-mono" title="引用">&gt;</button>
                                            <button onClick={() => insertMarkdown('- ')} className="w-8 h-8 flex items-center justify-center text-x-muted hover:text-x-white hover:bg-x-dark transition-colors font-mono" title="列表">•</button>
                                            <button onClick={() => insertMarkdown('`', '`')} className="w-8 h-8 flex items-center justify-center text-x-muted hover:text-x-white hover:bg-x-dark transition-colors font-mono text-[10px]" title="代码">&lt;/&gt;</button>
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={itemText}
                                            onChange={e => setItemText(e.target.value)}
                                            rows={4}
                                            className="w-full bg-transparent border border-x-border focus:border-x-borderStrong text-x-white font-mono text-[14px] outline-none resize-none p-3 placeholder:text-x-muted"
                                            placeholder="输入包含 Markdown 的说明文本..."
                                        />
                                    </div>
                                    <button 
                                        onClick={handleItemSend} 
                                        disabled={!itemText.trim() || itemModules.length === 0}
                                        className="w-full bg-x-white text-x-dark font-mono py-3 uppercase tracking-xai transition-all hover:bg-white/90 disabled:opacity-50"
                                    >
                                        立即发放
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
