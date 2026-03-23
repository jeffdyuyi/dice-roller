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
    const [selectedRuleSystem, setSelectedRuleSystem] = useState('D&D 5E');
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
                ruleSystem: char.ruleSystem,
                characterData: char.characterData
            };
        }
        joinRoom(inputName, inputRoomId, charInfo);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0a0c14] border border-amber-900/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl opacity-50"></div>

                <button onClick={onClose} className="absolute top-8 right-8 text-slate-600 hover:text-white transition-colors z-10"><i className="fa-solid fa-xmark text-xl"></i></button>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-900/20">
                            <i className="fa-solid fa-tower-broadcast text-black text-xl"></i>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">联机房间</h3>
                            <span className="text-[9px] font-black text-amber-500/40 uppercase tracking-[0.2em]">房间创建与加入</span>
                        </div>
                    </div>

                    {commState === 'DISCONNECTED' && (
                        <div className="space-y-6">
                            {/* Mode Tabs */}
                            <div className="flex bg-white/5 p-1 rounded-xl gap-1 border border-white/5">
                                <button onClick={() => { setMode('join'); setConnectionError(null); }} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'join' ? 'bg-[#bf953f] text-[#0c0c10] shadow-lg shadow-amber-900/20' : 'text-slate-500 hover:text-slate-300'}`}>加入房间</button>
                                <button onClick={() => { setMode('create'); setConnectionError(null); }} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'create' ? 'bg-[#bf953f] text-[#0c0c10] shadow-lg shadow-amber-900/20' : 'text-slate-500 hover:text-slate-300'}`}>创建房间</button>
                            </div>

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.2em] ml-1 group-within:text-amber-500 transition-colors">您的昵称</label>
                                    <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入您的昵称..." className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 px-5 py-3.5 rounded-xl text-white font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-sm" />
                                </div>
                                {mode === 'join' ? (
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.2em] ml-1 group-within:text-amber-500 transition-colors">房间 ID</label>
                                        <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位代码" className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 px-5 py-3.5 rounded-xl text-white font-mono font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-sm" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="group">
                                            <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.2em] ml-1 group-within:text-amber-500 transition-colors">房间名称 (选填)</label>
                                            <input type="text" value={inputRoomName} onChange={e => setInputRoomName(e.target.value)} placeholder="给房间起个名字..." className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 px-5 py-3.5 rounded-xl text-white font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-sm" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.2em] ml-1 group-within:text-amber-500 transition-colors">游戏规则</label>
                                            <div className="relative">
                                                <select value={selectedRuleSystem} onChange={e => setSelectedRuleSystem(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-sm font-black text-white outline-none appearance-none cursor-pointer transition-all hover:bg-white/10">
                                                    <option value="D&D 5E" className="bg-slate-900">D&D 5E (龙与地下城)</option>
                                                    <option value="Daggerheart" className="bg-slate-900">Daggerheart (匕首之心)</option>
                                                    <option value="COC 7th" className="bg-slate-900">COC 7th (克苏鲁的呼唤)</option>
                                                    <option value="Other" className="bg-slate-900">其他规则系统</option>
                                                </select>
                                                <i className="fa-solid fa-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"></i>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mode === 'join' && (
                                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input type="checkbox" checked={guestMode} onChange={e => setGuestMode(e.target.checked)} className="peer sr-only" />
                                            <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-[#bf953f] transition-all border border-white/5 shadow-inner"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-transform peer-checked:translate-x-4 peer-checked:bg-white shadow-md"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-200 transition-colors">以访客身份加入 (不使用角色卡)</span>
                                    </label>

                                    {!guestMode && (
                                        <div className="animate-in slide-in-from-top-2 duration-400">
                                            <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">关联角色档案</label>
                                            {myCharacters.length === 0 ? (
                                                <div className="text-[9px] text-amber-500/70 font-bold bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 italic leading-relaxed">
                                                    您的角色库中尚无存档。
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <select value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-lg px-4 py-2.5 text-[11px] font-black text-white outline-none appearance-none cursor-pointer transition-all hover:bg-white/10">
                                                        {myCharacters.map(c => (
                                                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name} ({c.ruleSystem})</option>
                                                        ))}
                                                    </select>
                                                    <i className="fa-solid fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-amber-500 transition-colors pointer-events-none"></i>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {connectionError && (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                                    <i className="fa-solid fa-circle-exclamation text-red-500 text-sm mt-0.5"></i>
                                    <p className="text-[10px] text-red-500 font-bold leading-relaxed">{connectionError}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                {mode === 'create' ? (
                                    <button onClick={() => createRoom(inputName, inputRoomId, inputRoomName, selectedRuleSystem)} className="w-full bg-gradient-to-br from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] font-black py-4 rounded-xl transition-all active:scale-95 shadow-2xl shadow-amber-900/30 uppercase tracking-widest text-[12px]">立即开启房间</button>
                                ) : (
                                    <button onClick={handleJoin} className="w-full bg-gradient-to-br from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] font-black py-4 rounded-xl transition-all active:scale-95 shadow-2xl shadow-amber-900/30 uppercase tracking-widest text-[12px]">发送入场请求</button>
                                )}
                            </div>
                        </div>
                    )}

                    {commState === 'WAITING' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="relative group">
                                <div className="w-20 h-20 border-2 border-white/5 rounded-full animate-spin-slow"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-t-amber-500 border-white/5 rounded-full animate-spin"></div>
                                </div>
                            </div>
                            <div className="text-white font-black text-lg mt-8">{mode === 'create' ? '正在创建房间...' : '正在入场确认...'}</div>
                            <p className="text-[9px] text-slate-500 mt-2 font-black uppercase tracking-[0.2em] animate-pulse">
                                {mode === 'create' ? '正在配置房间设置' : '等待房主接受入场请'}
                            </p>
                            <button onClick={disconnectLocal} className="mt-8 text-xs font-black text-red-500/60 hover:text-red-500 transition-colors border-b border-red-500/20">取消并返回</button>
                        </div>
                    )}

                    {commState === 'CONNECTED' && (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center mb-5 shadow-2xl shadow-amber-900/20 group-hover:rotate-6 transition-transform">
                                <i className="fa-solid fa-circle-check text-3xl"></i>
                            </div>
                            <div className="text-white font-black text-lg leading-none mb-2">已在房间内</div>
                            <span className="text-[9px] font-black text-amber-500/40 uppercase tracking-[0.3em] mb-6">当前房间 ID: {roomId}</span>
                            <div className="flex gap-4 w-full pt-4">
                                <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-black py-4 rounded-xl transition-all active:scale-95 border border-white/5">返回大厅</button>
                                <button onClick={() => { leaveRoom(); onClose(); }} className="flex-1 bg-red-600/10 text-red-500 font-black py-4 rounded-xl transition-all active:scale-95 border border-red-500/20 hover:bg-red-600 hover:text-white">断开联接</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
