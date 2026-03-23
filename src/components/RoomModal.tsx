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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-800 transition-colors z-10"><i className="fa-solid fa-xmark text-xl"></i></button>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <i className="fa-solid fa-tower-broadcast text-white"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">房间联接</h3>
                    </div>

                    {commState === 'DISCONNECTED' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest ml-1 group-within:text-indigo-600 transition-colors">登录代号 (Nickname)</label>
                                    <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入您的昵称..." className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 px-5 py-3 rounded-2xl text-slate-800 font-bold outline-none transition-all placeholder:text-slate-300" />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest ml-1 group-within:text-indigo-600 transition-colors">时空坐标 (Room ID)</label>
                                    <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位房间代码(创建时留空)" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 px-5 py-3 rounded-2xl text-slate-800 font-mono font-bold outline-none transition-all placeholder:text-slate-300" />
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-100 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" checked={guestMode} onChange={e => setGuestMode(e.target.checked)} className="peer sr-only" />
                                        <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                    </div>
                                    <span className="text-xs font-black text-slate-600 group-hover:text-slate-800 transition-colors">以访客身份加入 (无角色卡)</span>
                                </label>

                                {!guestMode && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">导入档案 (Character)</label>
                                        {myCharacters.length === 0 ? (
                                            <div className="text-[10px] text-orange-500 font-bold bg-orange-50 p-3 rounded-xl border border-orange-100 italic">
                                                <i className="fa-solid fa-circle-exclamation mr-1"></i> 您尚未创建任何角色档案，请先前往角色库。
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <select value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer">
                                                    {myCharacters.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.ruleSystem})</option>
                                                    ))}
                                                </select>
                                                <i className="fa-solid fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button onClick={() => createRoom(inputName, inputRoomId)} className="flex-1 bg-white border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-100/50">创建时空</button>
                                <button onClick={handleJoin} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-indigo-100">建立联接</button>
                            </div>
                        </div>
                    )}

                    {commState === 'WAITING' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                            <div className="text-slate-800 font-black text-lg">请求同步中...</div>
                            <p className="text-xs text-slate-400 mt-2 font-bold">请等待管理员批准接入</p>
                        </div>
                    )}

                    {commState === 'CONNECTED' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                <i className="fa-solid fa-circle-check text-4xl"></i>
                            </div>
                            <div className="text-slate-800 font-black text-lg">已建立联接</div>
                            <p className="text-xs text-slate-400 mt-2 font-bold mb-6">当前时空: {roomId}</p>
                            <div className="flex gap-4 w-full">
                                <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all active:scale-95">返回大厅</button>
                                <button onClick={() => { leaveRoom(); onClose(); }} className="flex-1 bg-red-50 text-red-500 font-black py-3 rounded-xl transition-all active:scale-95 border border-red-100">断开联接</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
