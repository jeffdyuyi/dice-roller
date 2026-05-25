import { useState, useEffect } from 'react';
import { getMyCharacters } from '../features/characters/api';
import type { Character } from '../features/characters/rule-engines/types';
import { useMqttContext } from '../contexts/MqttContext';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RoomModal({
    isOpen, onClose
}: RoomModalProps) {
    const {
        commState, roomId, myName: initialName,
        createRoom, joinRoom, connectionError, setConnectionError, disconnectLocal, leaveRoom
    } = useMqttContext();
    const [mode, setMode] = useState<'join' | 'create'>('join');
    const [inputName, setInputName] = useState(initialName);
    const [inputRoomId, setInputRoomId] = useState('');
    const [inputRoomName, setInputRoomName] = useState('新联机房间');
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [guestMode, setGuestMode] = useState(false);

    // Character selection state
    const [myCharacters, setMyCharacters] = useState<Character[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            const user = JSON.parse(localStorage.getItem('mock_user') || '{}');
            if (user.id) {
                const chars = getMyCharacters(user.id);
                setMyCharacters(chars);
                if (chars.length > 0) setSelectedCharId(chars[0].id);
            }
            
            const storedTemplates = localStorage.getItem('dice_roller_templates');
            if (storedTemplates) {
                const parsed = JSON.parse(storedTemplates);
                setTemplates(parsed);
                if (parsed.length > 0) setSelectedTemplateId(parsed[0].id);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleJoin = () => {
        let charInfo = null;
        if (guestMode) {
            charInfo = { guestMode: true };
        } else {
            const char = myCharacters.find(c => c.id === selectedCharId);
            if (!char) {
                alert('请先选择一个角色，或开启访客模式。');
                return;
            }
            charInfo = {
                guestMode: false,
                characterId: char.id,
                templateId: (char as any).templateId || char.ruleSystem, // backward compatibility
                characterData: char.characterData
            };
        }
        joinRoom(inputName, inputRoomId, charInfo);
    };

    return (
        <div className="fixed inset-0 bg-x-dark/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-x-dark border border-x-border p-8 max-w-md w-full relative overflow-hidden group">
                <button onClick={onClose} className="absolute top-8 right-8 text-x-muted hover:text-x-white transition-colors z-10 font-mono">X</button>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 border border-x-border flex items-center justify-center bg-x-white text-x-dark">
                            <span className="font-mono text-xl">R</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[20px] font-sans text-x-white leading-none mb-1">联机房间</h3>
                            <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai">房间创建与加入</span>
                        </div>
                    </div>

                    {commState === 'DISCONNECTED' && (
                        <div className="space-y-6">
                            {/* Mode Tabs */}
                            <div className="flex bg-x-surface p-1 border border-x-border">
                                <button onClick={() => { setMode('join'); setConnectionError(null); }} className={`flex-1 py-2.5 text-[12px] font-mono uppercase tracking-xai transition-all ${mode === 'join' ? 'bg-x-white text-x-dark border border-transparent' : 'text-x-muted border border-transparent hover:text-x-white hover:bg-x-surface'}`}>加入房间</button>
                                <button onClick={() => { setMode('create'); setConnectionError(null); }} className={`flex-1 py-2.5 text-[12px] font-mono uppercase tracking-xai transition-all ${mode === 'create' ? 'bg-x-white text-x-dark border border-transparent' : 'text-x-muted border border-transparent hover:text-x-white hover:bg-x-surface'}`}>创建房间</button>
                            </div>

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[12px] font-mono text-x-muted mb-2 uppercase tracking-xai group-within:text-x-white transition-colors">您的昵称</label>
                                    <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入您的昵称..." className="w-full bg-transparent border border-x-border focus:border-x-borderStrong px-5 py-3 text-x-white font-mono outline-none transition-all placeholder:text-x-muted text-[14px]" />
                                </div>
                                {mode === 'join' ? (
                                    <div className="group">
                                        <label className="block text-[12px] font-mono text-x-muted mb-2 uppercase tracking-xai group-within:text-x-white transition-colors">房间 ID</label>
                                        <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位代码" className="w-full bg-transparent border border-x-border focus:border-x-borderStrong px-5 py-3 text-x-white font-mono outline-none transition-all placeholder:text-x-muted text-[14px]" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="group">
                                            <label className="block text-[12px] font-mono text-x-muted mb-2 uppercase tracking-xai group-within:text-x-white transition-colors">房间名称 (选填)</label>
                                            <input type="text" value={inputRoomName} onChange={e => setInputRoomName(e.target.value)} placeholder="给房间起个名字..." className="w-full bg-transparent border border-x-border focus:border-x-borderStrong px-5 py-3 text-x-white font-mono outline-none transition-all placeholder:text-x-muted text-[14px]" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[12px] font-mono text-x-muted mb-2 uppercase tracking-xai group-within:text-x-white transition-colors">选用规则模板</label>
                                            <div className="relative">
                                                <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full bg-transparent border border-x-border focus:border-x-borderStrong px-5 py-3 text-[14px] font-mono text-x-white outline-none appearance-none cursor-pointer transition-all hover:bg-x-surface">
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id} className="bg-x-dark">{t.name}</option>
                                                    ))}
                                                    {templates.length === 0 && <option value="" disabled>暂无本地模板</option>}
                                                </select>
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-x-muted pointer-events-none font-mono">v</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mode === 'join' && (
                                <div className="bg-x-surface p-5 border border-x-border space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={guestMode} onChange={e => setGuestMode(e.target.checked)} className="peer sr-only" />
                                            <div className="w-10 h-6 bg-transparent border border-x-border peer-checked:bg-x-white transition-all"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-x-white transition-transform peer-checked:translate-x-4 peer-checked:bg-x-dark"></div>
                                        </div>
                                        <span className="text-[12px] font-mono text-x-muted group-hover:text-x-white transition-colors">以访客身份加入 (不使用角色卡)</span>
                                    </label>

                                    {!guestMode && (
                                        <div className="animate-in slide-in-from-top-2 duration-400 mt-4">
                                            <label className="block text-[12px] font-mono text-x-muted mb-2 uppercase tracking-xai">关联角色档案</label>
                                            {myCharacters.length === 0 ? (
                                                <div className="text-[12px] text-x-muted font-mono bg-x-surface p-3 border border-x-border">
                                                    您的角色库中尚无存档。
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <select value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full bg-transparent border border-x-border focus:border-x-borderStrong px-4 py-3 text-[14px] font-mono text-x-white outline-none appearance-none cursor-pointer transition-all">
                                                        {myCharacters.map(c => (
                                                            <option key={c.id} value={c.id} className="bg-x-dark text-x-white">{c.name} ({c.summary || '无模板'})</option>
                                                        ))}
                                                    </select>
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-x-muted group-hover:text-x-white transition-colors pointer-events-none font-mono">v</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {connectionError && (
                                <div className="bg-transparent border border-x-borderStrong p-4 flex items-start gap-3 animate-in fade-in duration-300">
                                    <span className="text-x-white font-mono">!</span>
                                    <p className="text-[12px] text-x-white font-mono leading-relaxed">{connectionError}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                {mode === 'create' ? (
                                    <button 
                                        onClick={() => {
                                            const t = templates.find(x => x.id === selectedTemplateId);
                                            createRoom(inputName, inputRoomId, inputRoomName, t || null);
                                        }} 
                                        className="w-full bg-x-white text-x-dark font-mono py-4 uppercase tracking-xai text-[14px] transition-all hover:bg-white/90"
                                    >
                                        立即开启房间
                                    </button>
                                ) : (
                                    <button onClick={handleJoin} className="w-full bg-x-white text-x-dark font-mono py-4 uppercase tracking-xai text-[14px] transition-all hover:bg-white/90">发送入场请求</button>
                                )}
                            </div>
                        </div>
                    )}

                    {commState === 'WAITING' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="text-x-white font-mono text-[24px] mt-8 mb-4">{mode === 'create' ? '正在创建房间...' : '正在入场确认...'}</div>
                            <p className="text-[12px] text-x-muted font-mono uppercase tracking-xai animate-pulse">
                                {mode === 'create' ? '正在配置房间设置' : '等待房主接受入场请求'}
                            </p>
                            <button onClick={disconnectLocal} className="mt-8 text-[12px] font-mono text-x-white border-b border-x-border hover:border-x-borderStrong transition-colors uppercase tracking-xai">取消并返回</button>
                        </div>
                    )}

                    {commState === 'CONNECTED' && (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-16 h-16 border border-x-border bg-x-white text-x-dark flex items-center justify-center mb-5">
                                <span className="font-mono text-2xl">C</span>
                            </div>
                            <div className="text-x-white font-sans text-[20px] leading-none mb-2">已在房间内</div>
                            <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-6">当前房间 ID: {roomId}</span>
                            <div className="flex gap-4 w-full pt-4">
                                <button onClick={onClose} className="flex-1 bg-transparent hover:bg-x-surface text-x-white font-mono py-4 transition-all border border-x-border uppercase tracking-xai text-[12px]">返回大厅</button>
                                <button onClick={() => { leaveRoom(); onClose(); }} className="flex-1 bg-transparent text-x-white font-mono py-4 transition-all border border-x-border hover:border-x-white uppercase tracking-xai text-[12px]">断开联接</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
