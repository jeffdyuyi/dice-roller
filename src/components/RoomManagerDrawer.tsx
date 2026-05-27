import { useState } from 'react';
import { useMqttContext } from '../contexts/MqttContext';

export function RoomManagerDrawer() {
    const {
        isManagerOpen, setManagerOpen, roomId, roomName, roomTemplate, isHost, connectedPlayers, pendingPlayers, myId,
        acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, updateQuickEditValue
    } = useMqttContext();
    const [sortBy, setSortBy] = useState<string>('default');
    const [showQr, setShowQr] = useState<boolean>(false);

    const quickEditFields = roomTemplate?.quickEditFields || [];

    let sortedPlayers = [...connectedPlayers];
    if (sortBy === 'name-asc') {
        sortedPlayers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name-desc') {
        sortedPlayers.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortBy.startsWith('field-')) {
        const parts = sortBy.split('-');
        const fieldName = parts[1];
        const direction = parts[2]; // 'asc' or 'desc'
        sortedPlayers.sort((a, b) => {
            const valA = a.quickEditValues?.[fieldName] ?? 0;
            const valB = b.quickEditValues?.[fieldName] ?? 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
    }

    if (!isManagerOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-x-dark/80 backdrop-blur-sm" onClick={() => setManagerOpen(false)}></div>
            <div className="relative w-full max-w-md bg-x-dark border-l border-x-border h-full flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-x-border flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-x-border bg-x-white text-x-dark flex items-center justify-center">
                            <span className="font-mono text-[16px]">M</span>
                        </div>
                        <div>
                            <h2 className="text-[14px] font-mono text-x-white uppercase tracking-xai">房间管理</h2>
                            <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mt-0.5">{isHost ? '您是房主' : '游玩中'}</p>
                        </div>
                    </div>
                    <button onClick={() => setManagerOpen(false)} className="w-10 h-10 border border-x-border hover:bg-x-surface text-x-muted transition-colors flex items-center justify-center font-mono">
                        X
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Room Info Card */}
                    <div className="bg-transparent p-6 border border-x-border relative overflow-hidden">
                        <div className="relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-1">房间 ID</div>
                                    <div className="text-[32px] font-mono text-x-white leading-none select-all">{roomId}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-1">选用模板</div>
                                    <div className="text-[12px] font-mono text-x-white bg-transparent px-2 py-1 border border-x-border">{roomTemplate?.name || '无模板'}</div>
                                </div>
                            </div>

                            <div className="mt-6 mb-6">
                                <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-1">房间名称</div>
                                <div className="text-[14px] font-sans text-x-white border-l border-x-white pl-3 py-1 bg-transparent">{roomName || '未命名房间'}</div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomId || '');
                                        alert('ID 已复制');
                                    }}
                                    className="flex-1 bg-x-white text-x-dark border border-x-white px-3 py-2.5 text-[12px] font-mono uppercase tracking-xai transition-all hover:bg-white/90"
                                >
                                    复制 ID
                                </button>
                                <button
                                    onClick={() => setShowQr(!showQr)}
                                    className={`flex-1 border px-3 py-2.5 text-[12px] font-mono uppercase tracking-xai transition-all text-center font-bold ${
                                        showQr
                                            ? 'bg-x-white text-x-dark border-x-white'
                                            : 'bg-transparent text-x-white border-x-border hover:bg-x-surface'
                                    }`}
                                >
                                    {showQr ? '隐藏二维码' : '扫码直连'}
                                </button>
                            </div>
                            {showQr && roomId && (
                                <div className="mt-4 p-4 bg-white flex flex-col items-center justify-center border border-x-border rounded-none animate-in fade-in duration-200">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                            `${window.location.origin}${window.location.pathname}#/rooms?mode=join&roomId=${roomId}`
                                        )}`}
                                        alt="Room QR Code"
                                        className="w-[160px] h-[160px] select-none"
                                    />
                                    <span className="text-[10px] text-x-dark font-mono mt-2 font-bold tracking-wider text-center uppercase">
                                        物理面团扫码加入
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notification/Status area */}
                    {pendingPlayers.length > 0 && isHost && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-x-muted text-[12px]">*</span>
                                <h3 className="text-[12px] font-mono text-x-white uppercase tracking-xai">待入场请求 ({pendingPlayers.length})</h3>
                            </div>
                            <div className="space-y-3">
                                {pendingPlayers.map(p => (
                                    <div key={p.id} className="bg-transparent border border-x-border p-4 flex items-center justify-between group animate-in zoom-in-95 duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 border border-x-border bg-x-surface flex items-center justify-center text-x-white font-mono">
                                                {p.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-sans text-x-white">{p.name}</p>
                                                <p className="text-[10px] font-mono text-x-muted uppercase tracking-xai mt-1">申请加入档案...</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => acceptPlayer(p.id, p.name)}
                                                className="w-10 h-10 bg-transparent border border-x-border text-x-white hover:bg-x-white hover:text-x-dark transition-all flex items-center justify-center font-mono"
                                            >
                                                Y
                                            </button>
                                            <button
                                                onClick={() => rejectPlayer(p.id)}
                                                className="w-10 h-10 bg-transparent border border-x-border text-x-white hover:bg-x-white hover:text-x-dark transition-all flex items-center justify-center font-mono"
                                            >
                                                N
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Connected Players */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 border-b border-x-border/30 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-x-muted text-[12px]">-</span>
                                <h3 className="text-[12px] font-mono text-x-muted uppercase tracking-xai">当前在场人员 ({connectedPlayers.length})</h3>
                            </div>
                            
                            {/* Sorting selector */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono text-x-muted uppercase tracking-xai">排序:</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="bg-x-dark border border-x-border text-x-white text-[11px] font-mono py-1 px-2 pr-6 outline-none cursor-pointer hover:bg-x-surface transition-all appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238d8d8d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 6px center',
                                        backgroundSize: '10px'
                                    }}
                                >
                                    <option value="default">默认顺序</option>
                                    <option value="name-asc">昵称 A-Z</option>
                                    <option value="name-desc">昵称 Z-A</option>
                                    {quickEditFields.map((field: string) => (
                                        <optgroup key={field} label={`按 [${field}]`}>
                                            <option value={`field-${field}-desc`}>{field} 从高到低</option>
                                            <option value={`field-${field}-asc`}>{field} 从低到高</option>
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {sortedPlayers.map(p => (
                                <div key={p.id} className="group p-3 hover:bg-x-surface border border-x-border/30 hover:border-x-border transition-all flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 flex items-center justify-center font-mono border ${p.isHost ? 'bg-x-white text-x-dark border-x-white' : 'bg-transparent text-x-white border-x-border'}`}>
                                                {p.name?.[0]}
                                            </div>
                                            <div>
                                                <span className="text-[14px] font-sans text-x-white">{p.name} {p.id === myId && <span className="text-x-muted opacity-60 ml-1">(您)</span>}</span>
                                                {p.isHost && <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mt-0.5">HOST</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isHost && p.id !== myId && (
                                                <button
                                                    onClick={() => kickPlayer(p.id)}
                                                    className="w-8 h-8 text-x-muted hover:text-x-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-x-surface font-mono"
                                                    title="踢出房间"
                                                >
                                                    -
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Edit Numeric Elements */}
                                    {quickEditFields.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 border-t border-x-border/20 pt-2.5 pl-11">
                                            {quickEditFields.map((field: string) => {
                                                const val = p.quickEditValues?.[field] ?? 0;
                                                const canEdit = isHost || p.id === myId;
                                                
                                                return (
                                                    <div key={field} className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-mono text-x-muted uppercase tracking-wider">{field}</span>
                                                        
                                                        {canEdit ? (
                                                            <div className="flex items-center bg-x-surface border border-x-border w-full h-[28px] overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuickEditValue(p.id, field, val - 1)}
                                                                    className="w-6 h-full text-x-muted hover:text-x-white hover:bg-x-dark/30 transition-all font-mono text-xs flex items-center justify-center select-none"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="^-?[0-9]*$"
                                                                    value={val === 0 ? '' : val}
                                                                    placeholder="0"
                                                                    onChange={e => {
                                                                        const raw = e.target.value;
                                                                        if (raw === '-' || raw === '') {
                                                                            updateQuickEditValue(p.id, field, 0);
                                                                        } else {
                                                                            const parsed = parseInt(raw);
                                                                            if (!isNaN(parsed)) {
                                                                                updateQuickEditValue(p.id, field, parsed);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="flex-1 w-full h-full bg-transparent text-center text-xs font-mono text-x-white focus:outline-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuickEditValue(p.id, field, val + 1)}
                                                                    className="w-6 h-full text-x-muted hover:text-x-white hover:bg-x-dark/30 transition-all font-mono text-xs flex items-center justify-center select-none"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center bg-x-surface border border-transparent w-full h-[28px]">
                                                                <span className="text-xs font-mono text-[#ff832b] font-bold">{val}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="p-6 bg-x-dark border-t border-x-border mt-auto">
                    <button
                        onClick={() => { leaveRoom(); setManagerOpen(false); }}
                        className="w-full bg-transparent hover:bg-x-white text-x-muted hover:text-x-dark border border-x-border py-4 font-mono text-[12px] uppercase tracking-xai transition-all"
                    >
                        完全退出房间领域 DISCONNECT
                    </button>
                </div>
            </div>
        </div>
    );
}
