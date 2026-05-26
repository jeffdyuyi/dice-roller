import { useState, useEffect } from 'react';
import { getMyCharacters } from '../features/characters/api';
import type { Character } from '../features/characters/types';
import { useMqttContext } from '../contexts/MqttContext';
import { Storage } from '../lib/storage';

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
                getMyCharacters(user.id).then(chars => {
                    setMyCharacters(chars);
                    if (chars.length > 0) setSelectedCharId(chars[0].id);
                });
            }
            
            Storage.get<any[]>('dice_roller_templates').then(storedTemplates => {
                if (storedTemplates) {
                    setTemplates(storedTemplates);
                    if (storedTemplates.length > 0) setSelectedTemplateId(storedTemplates[0].id);
                }
            });
        }
    }, [isOpen]);

    // Flat flow: auto-close modal when connected
    useEffect(() => {
        if (commState === 'CONNECTED' && isOpen) {
            onClose();
        }
    }, [commState, isOpen, onClose]);

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
                characterId: char.id
            };
        }
        joinRoom(inputName, inputRoomId, charInfo);
    };

    return (
        <div className="fixed inset-0 bg-ibm-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-ibm-layer border border-ibm-borderStrong p-8 md:p-10 max-w-md w-full relative overflow-hidden rounded-none shadow-none">
                <button onClick={onClose} className="absolute top-6 right-6 text-ibm-textSecondary hover:text-ibm-text transition-colors z-10 p-2 rounded-none bg-transparent hover:bg-ibm-layerHover border border-transparent hover:border-ibm-border">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>

                <div className="relative z-10">
                    <div className="flex flex-col mb-8 text-center items-center">
                        <div className="w-14 h-14 bg-ibm-primary text-ibm-textOnColor rounded-none flex items-center justify-center mb-4 border border-ibm-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <h3 className="text-[28px] font-sans font-semibold tracking-tight text-ibm-text leading-tight">联机房间</h3>
                        <span className="text-[12px] font-mono tracking-xai uppercase text-ibm-textSecondary mt-1">创建或加入一个战役</span>
                    </div>

                    {commState === 'DISCONNECTED' && (
                        <div className="space-y-6">
                            {/* Mode Tabs */}
                            <div className="flex bg-transparent border border-ibm-border p-1 rounded-none">
                                <button onClick={() => { setMode('join'); setConnectionError(null); }} className={`flex-1 py-2 text-[12px] font-mono uppercase tracking-xai font-medium rounded-none transition-all ${mode === 'join' ? 'bg-ibm-primary text-ibm-textOnColor' : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'}`}>加入房间</button>
                                <button onClick={() => { setMode('create'); setConnectionError(null); }} className={`flex-1 py-2 text-[12px] font-mono uppercase tracking-xai font-medium rounded-none transition-all ${mode === 'create' ? 'bg-ibm-primary text-ibm-textOnColor' : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'}`}>创建房间</button>
                            </div>

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[12px] font-mono tracking-xai uppercase font-medium text-ibm-textSecondary mb-2 transition-colors">您的昵称</label>
                                    <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入您的昵称..." className="w-full bg-ibm-background border-b-2 border-transparent focus:border-ibm-primary rounded-none px-4 py-3 text-ibm-text font-sans outline-none transition-all placeholder:text-ibm-textPlaceholder text-[15px]" />
                                </div>
                                {mode === 'join' ? (
                                    <div className="group">
                                        <label className="block text-[12px] font-mono tracking-xai uppercase font-medium text-ibm-textSecondary mb-2 transition-colors">房间 ID</label>
                                        <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位代码" className="w-full bg-ibm-background border-b-2 border-transparent focus:border-ibm-primary rounded-none px-4 py-3 text-ibm-text font-mono outline-none transition-all placeholder:text-ibm-textPlaceholder text-[15px] uppercase" />
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="group">
                                            <label className="block text-[12px] font-mono tracking-xai uppercase font-medium text-ibm-textSecondary mb-2 transition-colors">房间名称 (选填)</label>
                                            <input type="text" value={inputRoomName} onChange={e => setInputRoomName(e.target.value)} placeholder="给房间起个名字..." className="w-full bg-ibm-background border-b-2 border-transparent focus:border-ibm-primary rounded-none px-4 py-3 text-ibm-text font-sans outline-none transition-all placeholder:text-ibm-textPlaceholder text-[15px]" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[12px] font-mono tracking-xai uppercase font-medium text-ibm-textSecondary mb-2 transition-colors">选用规则模板</label>
                                            <div className="relative">
                                                <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full bg-ibm-background border border-ibm-border focus:border-ibm-primary rounded-none px-4 py-3 text-[15px] font-sans text-ibm-text outline-none appearance-none cursor-pointer transition-all">
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id} className="bg-ibm-background text-ibm-text">{t.name}</option>
                                                    ))}
                                                    {templates.length === 0 && <option value="" disabled className="bg-ibm-background text-ibm-textSecondary">暂无本地模板</option>}
                                                </select>
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ibm-textSecondary pointer-events-none font-mono">▼</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mode === 'join' && (
                                <div className="bg-ibm-background border border-ibm-border rounded-none p-5 space-y-4 mt-5">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={guestMode} onChange={e => setGuestMode(e.target.checked)} className="peer sr-only" />
                                            <div className="w-10 h-5 bg-ibm-layer border border-ibm-border rounded-none peer-checked:bg-ibm-primary transition-colors"></div>
                                            <div className="absolute left-[2px] top-[2px] w-4 h-4 bg-ibm-textSecondary rounded-none transition-transform peer-checked:translate-x-5 peer-checked:bg-ibm-textOnColor"></div>
                                        </div>
                                        <span className="text-[12px] font-mono tracking-xai uppercase text-ibm-textSecondary group-hover:text-ibm-text transition-colors">以访客身份加入 (不使用角色卡)</span>
                                    </label>

                                    {!guestMode && (
                                        <div className="animate-in slide-in-from-top-2 duration-400 mt-4">
                                            <label className="block text-[12px] font-mono tracking-xai uppercase font-medium text-ibm-textSecondary mb-2">关联角色档案</label>
                                            {myCharacters.length === 0 ? (
                                                <div className="text-[12px] text-ibm-textSecondary font-mono tracking-xai uppercase text-center bg-ibm-layer border border-ibm-border rounded-none p-3">
                                                    您的角色库中尚无存档。
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <select value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full bg-ibm-layer border border-ibm-border rounded-none px-4 py-3 text-[15px] font-sans text-ibm-text outline-none appearance-none cursor-pointer hover:bg-ibm-layerHover transition-all">
                                                        {myCharacters.map(c => (
                                                            <option key={c.id} value={c.id} className="bg-ibm-background text-ibm-text">{c.name} ({c.summary || '无模板'})</option>
                                                        ))}
                                                    </select>
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ibm-textSecondary pointer-events-none font-mono">▼</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {connectionError && (
                                <div className="bg-ibm-danger/10 text-ibm-danger rounded-none p-4 flex items-start gap-3 animate-in fade-in duration-300">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <p className="text-[14px] font-sans leading-relaxed">{connectionError}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                {mode === 'create' ? (
                                    <button 
                                        onClick={() => {
                                            const t = templates.find(x => x.id === selectedTemplateId);
                                            createRoom(inputName, inputRoomId, inputRoomName, t || null);
                                        }} 
                                        className="w-full bg-ibm-primary text-ibm-textOnColor rounded-none font-mono uppercase tracking-xai font-medium py-3.5 text-[12px] transition-all hover:bg-ibm-primaryHover"
                                    >
                                        立即开启房间
                                    </button>
                                ) : (
                                    <button onClick={handleJoin} className="w-full bg-ibm-primary text-ibm-textOnColor rounded-none font-mono uppercase tracking-xai font-medium py-3.5 text-[12px] transition-all hover:bg-ibm-primaryHover">发送入场请求</button>
                                )}
                            </div>
                        </div>
                    )}

                    {commState === 'WAITING' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-12 h-12 border-4 border-ibm-border border-t-ibm-primary rounded-full animate-spin mb-6"></div>
                            <div className="text-ibm-text font-sans text-[22px] font-medium mb-2">{mode === 'create' ? '正在配置...' : '等待入场...'}</div>
                            <p className="text-[14px] text-ibm-textSecondary font-sans mb-8">
                                {mode === 'create' ? '正在建立加密连接通道' : '等待房主接受您的加入请求'}
                            </p>
                            <button onClick={disconnectLocal} className="text-[14px] font-sans text-ibm-primary hover:text-ibm-primaryHover transition-colors">取消</button>
                        </div>
                    )}

                    {commState === 'CONNECTED' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-ibm-primary text-ibm-textOnColor rounded-none flex items-center justify-center mb-5 border border-ibm-primary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </div>
                            <div className="text-ibm-text font-sans text-[22px] font-medium mb-2">已连接至房间</div>
                            <span className="text-[12px] font-mono tracking-xai uppercase text-ibm-textSecondary mb-8 bg-ibm-background border border-ibm-border px-3 py-1 rounded-none">房间 ID: {roomId}</span>
                            <div className="flex flex-col gap-3 w-full">
                                <button onClick={onClose} className="w-full bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover rounded-none font-mono uppercase tracking-xai font-medium py-3.5 transition-all text-[12px]">返回大厅界面</button>
                                <button onClick={() => { leaveRoom(); onClose(); }} className="w-full bg-transparent border border-ibm-border text-ibm-textSecondary hover:text-ibm-danger hover:border-ibm-danger rounded-none font-mono uppercase tracking-xai font-medium py-3.5 transition-all text-[12px]">断开联接</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
