import { useState } from 'react';

interface LockScreenProps {
    onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const CORRECT_PASSWORD = '261751459';

    const handleUnlock = () => {
        if (password === CORRECT_PASSWORD) {
            onUnlock();
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0c0c10] flex items-center justify-center p-4 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-amber-900/10 rounded-full blur-[140px] -mr-[40vw] -mt-[40vw] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px] -ml-[30vw] -mb-[30vw] pointer-events-none"></div>

            <div className={`w-full max-w-md bg-[#141420] rounded-3xl border border-[#bf953f]/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500 relative ${error ? 'animate-shake' : ''}`}>
                {/* Author Info Header (Reusing Author Modal Style) */}
                <div className="h-40 bg-gradient-to-br from-[#18182a] to-[#0c0c10] flex items-center justify-center relative overflow-hidden border-b border-[#bf953f]/20">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <i className="fa-solid fa-sparkles text-7xl absolute -left-4 -top-4 text-[#bf953f]"></i>
                        <i className="fa-solid fa-dice-d20 text-[14rem] absolute -right-12 -bottom-12 text-[#bf953f]"></i>
                    </div>
                    <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className="w-16 h-16 bg-[#bf953f] rounded-2xl flex items-center justify-center shadow-2xl mb-2">
                            <i className="fa-solid fa-shield-halved text-black text-2xl"></i>
                        </div>
                        <h2 className="text-[#a89b7a] text-[10px] font-black tracking-[0.4em] uppercase">访问准入验证</h2>
                        <h2 className="golden-text text-xl uppercase tracking-widest font-black">SECRET BASE ACG</h2>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Author Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-[#bf953f]/10 rounded-xl flex items-center justify-center text-[#bf953f] border border-[#bf953f]/20 transition-transform group-hover:scale-110">
                                <i className="fa-solid fa-user-gear text-lg"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#6b6250] uppercase tracking-widest leading-none mb-1.5">主理人 / 制作者</p>
                                <p className="font-black text-[#f0ead8] tracking-tight text-sm">不咕鸟 (哈基米德)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-[#aa771c]/10 rounded-xl flex items-center justify-center text-[#aa771c] border border-[#aa771c]/20 transition-transform group-hover:scale-110">
                                <i className="fa-solid fa-users text-lg"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#6b6250] uppercase tracking-widest leading-none mb-1.5">官方社群</p>
                                <p className="font-black text-[#fcf6ba] tracking-tight text-sm">创想俱乐部</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-[#bf953f]/20 to-transparent"></div>

                    {/* Password Input Area */}
                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-[#6b6250] mb-2 uppercase tracking-widest ml-1 group-within:text-[#bf953f] transition-colors">请输入验证密钥</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                placeholder="•••••••••"
                                className="w-full bg-black/40 border border-white/10 focus:border-[#bf953f]/50 px-5 py-4 rounded-2xl text-[#fcf6ba] font-mono text-center text-xl tracking-[0.5em] outline-none transition-all placeholder:tracking-normal placeholder:text-slate-800 backdrop-blur-md shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-bold text-slate-500 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-circle-question text-[#bf953f]"></i>
                                提示：不咕鸟TRPG创想俱乐部群号
                            </p>
                        </div>

                        <button
                            onClick={handleUnlock}
                            className="w-full bg-gradient-to-br from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] font-black py-4 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-amber-900/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group"
                        >
                            <span>开启工具领域</span>
                            <i className="fa-solid fa-arrow-right-long text-sm group-hover:translate-x-1 transition-transform"></i>
                        </button>
                    </div>
                </div>

                {/* Bottom Footer Info */}
                <div className="p-4 bg-black/20 text-center">
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Antigravity Gemini AI Enhanced Edition v2.5</p>
                </div>
            </div>
        </div>
    );
}
