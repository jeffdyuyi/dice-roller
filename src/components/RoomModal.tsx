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
        createRoom, joinRoom, leaveRoom
    } = useMqttContext();

    const [inputName, setInputName] = useState(initialName);
    const [inputRoomId, setInputRoomId] = useState('');
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
                            <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">房间联接</h3>
                            <span className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.2em]">时空联结序列</span>
                        </div>
                    </div>

                    {commState === 'DISCONNECTED' && (
                        <div className="space-y-8">
                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1 group-within:text-amber-500 transition-colors">登录代号 (昵称)</label>
                                    <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入您的昵称..." className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 px-6 py-4 rounded-2xl text-white font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm" />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1 group-within:text-amber-500 transition-colors">时空坐标 (房间 ID)</label>
                                    <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位房间代码" className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 px-6 py-4 rounded-2xl text-white font-mono font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm" />
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-5">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" checked={guestMode} onChange={e => setGuestMode(e.target.checked)} className="peer sr-only" />
                                        <div className="w-12 h-7 bg-white/10 rounded-full peer-checked:bg-[#bf953f] transition-all border border-white/5 shadow-inner"></div>
                                        <div className="absolute left-1.5 top-1.5 w-4 h-4 bg-slate-400 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-white shadow-md"></div>
                                    </div>
                                    <span className="text-xs font-black text-slate-400 group-hover:text-slate-200 transition-colors">以访客身份加入 (不导入角色卡)</span>
                                </label>

                                {!guestMode && (
                                    <div className="animate-in slide-in-from-top-2 duration-400">
                                        <label className="block text-[10px] font-black text-slate-500 mb-2.5 uppercase tracking-widest ml-1">导入档案 (角色卡)</label>
                                        {myCharacters.length === 0 ? (
                                            <div className="text-[10px] text-amber-500/70 font-bold bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 italic leading-relaxed">
                                                <i className="fa-solid fa-circle-exclamation mr-2"></i> 您尚未创建任何角色档案，请先前往角色库。
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <select value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-xl px-5 py-3 text-xs font-black text-white outline-none appearance-none cursor-pointer transition-all hover:bg-white/10">
                                                    {myCharacters.map(c => (
                                                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name} ({c.ruleSystem})</option>
                                                    ))}
                                                </select>
                                                <i className="fa-solid fa-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-amber-500 transition-colors pointer-events-none"></i>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => createRoom(inputName, inputRoomId)} className="flex-1 bg-white/5 border border-white/10 hover:border-amber-500/50 hover:text-amber-500 text-slate-400 font-black py-5 rounded-2xl transition-all active:scale-95">创建房间</button>
                                <button onClick={handleJoin} className="flex-1 bg-gradient-to-br from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] font-black py-5 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-amber-900/30">发送加入请求</button>
                            </div>
                        </div>
                    )}

                    {commState === 'WAITING' && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative group">
                                <div className="w-20 h-20 border-2 border-white/5 rounded-full animate-spin-slow"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-t-amber-500 border-white/5 rounded-full animate-spin"></div>
                                </div>
                            </div>
                            <div className="text-white font-black text-xl mt-8">请求同步中...</div>
                            <p className="text-[10px] text-slate-500 mt-3 font-black uppercase tracking-[0.2em] animate-pulse">正在等待房主通过验证</p>
                        </div>
                    )}

                    {commState === 'CONNECTED' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-20 h-20 bg-amber-500 text-black rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-900/20 group-hover:rotate-6 transition-transform">
                                <i className="fa-solid fa-circle-check text-4xl"></i>
                            </div>
                            <div className="text-white font-black text-xl leading-none mb-2">已建立联接</div>
                            <span className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.3em] mb-6">目前联接目标: {roomId}</span>
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
