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
        <div className="fixed inset-0 z-[9999] bg-x-dark flex items-center justify-center p-4 overflow-hidden">
            <div className={`w-full max-w-md bg-x-dark border border-x-borderStrong overflow-hidden relative ${error ? 'animate-shake' : ''}`}>
                <div className="h-40 bg-x-dark flex items-center justify-center relative overflow-hidden border-b border-x-border">
                    <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className="w-16 h-16 border border-x-border flex items-center justify-center mb-2 bg-x-white text-x-dark">
                            <span className="font-mono text-xl">L</span>
                        </div>
                        <h2 className="text-x-muted text-[12px] font-mono tracking-xai uppercase">访问准入验证</h2>
                        <h2 className="text-x-white text-[20px] uppercase font-sans">SECRET BASE ACG</h2>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Author Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border border-x-border flex items-center justify-center text-x-white">
                                <span className="font-mono">A</span>
                            </div>
                            <div>
                                <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-1">主理人 / 制作者</p>
                                <p className="font-sans text-x-white text-[16px]">不咕鸟 (哈基米德)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border border-x-border flex items-center justify-center text-x-white">
                                <span className="font-mono">C</span>
                            </div>
                            <div>
                                <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-1">官方社群</p>
                                <p className="font-sans text-x-white text-[16px]">创想俱乐部 (261751459)</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-x-border"></div>

                    {/* Password Input Area */}
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-[12px] font-mono text-x-muted mb-2 uppercase tracking-xai group-within:text-x-white transition-colors">请输入验证密钥</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                placeholder="•••••••••"
                                className="w-full bg-transparent border border-x-border focus:border-x-borderStrong px-5 py-4 text-x-white font-mono text-center text-[20px] outline-none transition-all placeholder:text-x-muted"
                            />
                        </div>

                        <div className="flex flex-col items-center">
                            <p className="text-[12px] font-mono text-x-muted mb-4 flex items-center gap-2">
                                提示：不咕鸟TRPG创想俱乐部群号
                            </p>
                        </div>

                        <button
                            onClick={handleUnlock}
                            className="w-full bg-x-white text-x-dark py-4 uppercase tracking-xai text-[14px] font-mono hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                        >
                            <span>开启工具领域</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Footer Info */}
                <div className="p-4 border-t border-x-border text-center">
                    <p className="text-[10px] font-mono text-x-muted uppercase tracking-xai">Antigravity Gemini AI Enhanced Edition v2.5</p>
                </div>
            </div>
        </div>
    );
}
