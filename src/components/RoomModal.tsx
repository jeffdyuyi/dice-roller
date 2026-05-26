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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl saturate-150 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#1d1d1f] p-8 md:p-10 max-w-md w-full relative overflow-hidden rounded-2xl shadow-apple">
                <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10 p-2 rounded-full hover:bg-white/10">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>

                <div className="relative z-10">
                    <div className="flex flex-col mb-8 text-center items-center">
                        <div className="w-14 h-14 bg-gradient-to-tr from-apple-blue to-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <h3 className="text-[28px] font-sans font-semibold tracking-tight text-white leading-tight">联机房间</h3>
                        <span className="text-[14px] font-sans text-white/70 mt-1">创建或加入一个战役</span>
                    </div>

                    {commState === 'DISCONNECTED' && (
                        <div className="space-y-6">
                            {/* Mode Tabs */}
                            <div className="flex bg-black/30 p-1 rounded-xl">
                                <button onClick={() => { setMode('join'); setConnectionError(null); }} className={`flex-1 py-2 text-[14px] font-sans font-medium rounded-lg transition-all ${mode === 'join' ? 'bg-[#272729] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}>加入房间</button>
                                <button onClick={() => { setMode('create'); setConnectionError(null); }} className={`flex-1 py-2 text-[14px] font-sans font-medium rounded-lg transition-all ${mode === 'create' ? 'bg-[#272729] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}>创建房间</button>
                            </div>

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[13px] font-sans font-medium text-white/80 mb-2 transition-colors">您的昵称</label>
                                    <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入您的昵称..." className="w-full bg-black/20 focus:bg-black/40 rounded-xl px-4 py-3 text-white font-sans outline-none focus:ring-2 focus:ring-apple-blue transition-all placeholder:text-white/70 text-[15px]" />
                                </div>
                                {mode === 'join' ? (
                                    <div className="group">
                                        <label className="block text-[13px] font-sans font-medium text-white/80 mb-2 transition-colors">房间 ID</label>
                                        <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位代码" className="w-full bg-black/20 focus:bg-black/40 rounded-xl px-4 py-3 text-white font-sans outline-none focus:ring-2 focus:ring-apple-blue transition-all placeholder:text-white/70 text-[15px] uppercase" />
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="group">
                                            <label className="block text-[13px] font-sans font-medium text-white/80 mb-2 transition-colors">房间名称 (选填)</label>
                                            <input type="text" value={inputRoomName} onChange={e => setInputRoomName(e.target.value)} placeholder="给房间起个名字..." className="w-full bg-black/20 focus:bg-black/40 rounded-xl px-4 py-3 text-white font-sans outline-none focus:ring-2 focus:ring-apple-blue transition-all placeholder:text-white/70 text-[15px]" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[13px] font-sans font-medium text-white/80 mb-2 transition-colors">选用规则模板</label>
                                            <div className="relative">
                                                <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full bg-black/20 focus:bg-black/40 rounded-xl px-4 py-3 text-[15px] font-sans text-white outline-none focus:ring-2 focus:ring-apple-blue appearance-none cursor-pointer transition-all">
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id} className="bg-[#272729]">{t.name}</option>
                                                    ))}
                                                    {templates.length === 0 && <option value="" disabled>暂无本地模板</option>}
                                                </select>
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">▼</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mode === 'join' && (
                                <div className="bg-black/20 rounded-xl p-5 space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={guestMode} onChange={e => setGuestMode(e.target.checked)} className="peer sr-only" />
                                            <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-apple-blue transition-colors"></div>
                                            <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                                        </div>
                                        <span className="text-[14px] font-sans text-white/70 group-hover:text-white transition-colors">以访客身份加入 (不使用角色卡)</span>
                                    </label>

                                    {!guestMode && (
                                        <div className="animate-in slide-in-from-top-2 duration-400 mt-4">
                                            <label className="block text-[13px] font-sans font-medium text-white/80 mb-2">关联角色档案</label>
                                            {myCharacters.length === 0 ? (
                                                <div className="text-[14px] text-white/80 font-sans text-center bg-black/20 rounded-lg p-3">
                                                    您的角色库中尚无存档。
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <select value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full bg-[#272729] rounded-xl px-4 py-3 text-[15px] font-sans text-white outline-none appearance-none cursor-pointer hover:bg-[#2a2a2d] transition-all">
                                                        {myCharacters.map(c => (
                                                            <option key={c.id} value={c.id} className="bg-[#272729] text-white">{c.name} ({c.summary || '无模板'})</option>
                                                        ))}
                                                    </select>
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">▼</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {connectionError && (
                                <div className="bg-red-500/10 text-red-400 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
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
                                        className="w-full bg-apple-blue text-white rounded-full font-sans font-medium py-3.5 text-[16px] transition-all hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f]"
                                    >
                                        立即开启房间
                                    </button>
                                ) : (
                                    <button onClick={handleJoin} className="w-full bg-apple-blue text-white rounded-full font-sans font-medium py-3.5 text-[16px] transition-all hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f]">发送入场请求</button>
                                )}
                            </div>
                        </div>
                    )}

                    {commState === 'WAITING' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-12 h-12 border-4 border-white/10 border-t-apple-blue rounded-full animate-spin mb-6"></div>
                            <div className="text-white font-sans text-[22px] font-medium mb-2">{mode === 'create' ? '正在配置...' : '等待入场...'}</div>
                            <p className="text-[14px] text-white/70 font-sans mb-8">
                                {mode === 'create' ? '正在建立加密连接通道' : '等待房主接受您的加入请求'}
                            </p>
                            <button onClick={disconnectLocal} className="text-[14px] font-sans text-apple-blue hover:text-blue-400 transition-colors">取消</button>
                        </div>
                    )}

                    {commState === 'CONNECTED' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-5">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </div>
                            <div className="text-white font-sans text-[22px] font-medium mb-2">已连接至房间</div>
                            <span className="text-[14px] font-sans text-white/70 mb-8 bg-black/20 px-3 py-1 rounded-full">房间 ID: {roomId}</span>
                            <div className="flex flex-col gap-3 w-full">
                                <button onClick={onClose} className="w-full bg-[#272729] hover:bg-[#2a2a2d] text-white rounded-full font-sans font-medium py-3.5 transition-all text-[16px]">返回大厅界面</button>
                                <button onClick={() => { leaveRoom(); onClose(); }} className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full font-sans font-medium py-3.5 transition-all text-[16px]">断开联接</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
