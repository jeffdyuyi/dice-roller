import { useState } from 'react';
import { useMqttContext } from '../contexts/MqttContext';

export function RoomManagerPanel() {
    const {
        roomId, roomName, roomTemplate, isHost, connectedPlayers, pendingPlayers, myId,
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

    return (
        <div className="w-full h-full flex flex-col bg-x-dark border-r border-x-border overflow-hidden select-none">
            {/* Header */}
            <div className="p-3 border-b border-x-border flex items-center justify-between bg-transparent shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border border-x-border bg-x-white text-x-dark flex items-center justify-center">
                        <span className="font-mono text-[11px] font-bold">M</span>
                    </div>
                    <div>
                        <h2 className="text-[12px] font-mono text-x-white uppercase tracking-wider font-bold">战役管理 PANEL</h2>
                    </div>
                </div>
                <span className="text-[9px] font-mono text-x-muted uppercase tracking-wider border border-x-border px-1.5 py-0.5">
                    {isHost ? 'DM / HOST' : 'PLAYER'}
                </span>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                
                {/* Room Info Slim Card */}
                <div className="bg-x-surface/20 p-2.5 border border-x-border relative overflow-hidden">
                    <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between items-center">
                            <span className="text-x-muted uppercase tracking-wide">房间 ID:</span>
                            <span className="text-x-white font-bold select-all text-xs tracking-wider">{roomId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-x-muted uppercase tracking-wide">房间名称:</span>
                            <span className="text-x-white truncate max-w-[120px]" title={roomName || ''}>{roomName || '未命名'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-x-muted uppercase tracking-wide">选用战役:</span>
                            <span className="text-x-white px-1.5 py-0.5 border border-x-border/50 text-[9px] truncate max-w-[120px]" title={roomTemplate?.name || '默认战役'}>
                                {roomTemplate?.name || '默认战役'}
                            </span>
                        </div>
                        <div className="pt-1.5 flex gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(roomId || '');
                                    alert('房间 ID 已成功复制到剪贴板！');
                                }}
                                className="flex-1 bg-x-white text-x-dark border border-x-white py-1 text-[9px] font-mono uppercase tracking-wider transition-all hover:bg-white/95 text-center font-bold"
                            >
                                复制 ID
                            </button>
                            <button
                                onClick={() => setShowQr(!showQr)}
                                className={`flex-1 border py-1 text-[9px] font-mono uppercase tracking-wider transition-all text-center font-bold ${
                                    showQr
                                        ? 'bg-x-white text-x-dark border-x-white'
                                        : 'bg-transparent text-x-white border-x-border hover:bg-x-surface'
                                }`}
                            >
                                {showQr ? '收起二维码' : '扫码直连'}
                            </button>
                        </div>
                        {showQr && roomId && (
                            <div className="mt-2 p-2 bg-white flex flex-col items-center justify-center border border-x-border rounded-none animate-in fade-in duration-200">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                        `${window.location.origin}${window.location.pathname}#/rooms?mode=join&roomId=${roomId}`
                                    )}`}
                                    alt="Room QR Code"
                                    className="w-[130px] h-[130px] select-none"
                                />
                                <span className="text-[8px] text-x-dark font-mono mt-1 font-bold tracking-wider text-center uppercase">
                                    扫码直连此战役
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications / Wait List */}
                {pendingPlayers.length > 0 && isHost && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                            <span className="font-mono text-x-muted text-[10px]">*</span>
                            <h3 className="text-[10px] font-mono text-x-white uppercase tracking-wider font-bold">申请入场 ({pendingPlayers.length})</h3>
                        </div>
                        <div className="space-y-1.5">
                            {pendingPlayers.map(p => (
                                <div key={p.id} className="border border-x-border p-2 flex items-center justify-between bg-x-surface/10 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 border border-x-border bg-x-surface flex items-center justify-center text-x-white font-mono text-xs">
                                            {p.name?.[0] || '?'}
                                        </div>
                                        <div className="truncate max-w-[100px]">
                                            <p className="text-[11px] font-sans text-x-white truncate leading-none">{p.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => acceptPlayer(p.id, p.name)}
                                            className="w-6 h-6 border border-x-border text-x-white hover:bg-x-white hover:text-x-dark transition-all flex items-center justify-center font-mono text-[10px]"
                                            title="同意"
                                        >
                                            Y
                                        </button>
                                        <button
                                            onClick={() => rejectPlayer(p.id)}
                                            className="w-6 h-6 border border-x-border text-x-white hover:bg-x-white hover:text-x-dark transition-all flex items-center justify-center font-mono text-[10px]"
                                            title="拒绝"
                                        >
                                            N
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Connected Players list */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-x-border/30 pb-1.5">
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="font-mono text-x-muted text-[10px]">-</span>
                            <h3 className="text-[10px] font-mono text-x-muted uppercase tracking-wider">在场人员 ({connectedPlayers.length})</h3>
                        </div>
                        
                        {/* Compact Sorting Selector */}
                        <div className="flex items-center gap-1 shrink-0">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-x-dark border border-x-border text-x-white text-[9px] font-mono py-0.5 pl-1.5 pr-4 outline-none cursor-pointer hover:bg-x-surface transition-all appearance-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238d8d8d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 4px center',
                                    backgroundSize: '8px'
                                }}
                            >
                                <option value="default">默认排序</option>
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

                    <div className="space-y-1.5">
                        {sortedPlayers.map(p => (
                            <div key={p.id} className="group p-2 hover:bg-x-surface/30 border border-x-border/30 hover:border-x-border transition-all flex flex-col gap-2 bg-x-surface/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] border ${p.isHost ? 'bg-x-white text-x-dark border-x-white' : 'bg-transparent text-x-white border-x-border'}`}>
                                            {p.name?.[0]}
                                        </div>
                                        <div className="truncate min-w-0 flex items-center gap-1">
                                            <span className="text-[12px] font-sans text-x-white truncate leading-none">{p.name}</span>
                                            {p.id === myId && <span className="text-x-muted opacity-55 text-[9px] shrink-0">(您)</span>}
                                            {p.isHost && <span className="text-[8px] font-mono bg-x-white text-x-dark px-1 py-0.2 select-none uppercase tracking-wide shrink-0">H</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {isHost && p.id !== myId && (
                                            <button
                                                onClick={() => kickPlayer(p.id)}
                                                className="w-5 h-5 text-x-muted hover:text-x-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-x-surface border border-transparent hover:border-x-border font-mono text-[9px]"
                                                title="踢出房间"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic Quick Edit Numeric Fields */}
                                {quickEditFields.length > 0 && (
                                    <div className="grid grid-cols-2 gap-1.5 border-t border-x-border/15 pt-1.5 pl-8">
                                        {quickEditFields.map((field: string) => {
                                            const val = p.quickEditValues?.[field] ?? 0;
                                            const canEdit = isHost || p.id === myId;
                                            
                                            return (
                                                <div key={field} className="flex flex-col gap-0.5">
                                                    <span className="text-[9px] font-mono text-x-muted uppercase tracking-wider">{field}</span>
                                                    
                                                    {canEdit ? (
                                                        <div className="flex items-center bg-x-surface/50 border border-x-border w-full h-[22px] overflow-hidden">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuickEditValue(p.id, field, val - 1)}
                                                                className="w-5 h-full text-x-muted hover:text-x-white hover:bg-x-dark/40 transition-all font-mono text-[10px] flex items-center justify-center select-none"
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
                                                                className="flex-1 w-full h-full bg-transparent text-center text-[10px] font-mono text-x-white focus:outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuickEditValue(p.id, field, val + 1)}
                                                                className="w-5 h-full text-x-muted hover:text-x-white hover:bg-x-dark/40 transition-all font-mono text-[10px] flex items-center justify-center select-none"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center bg-x-surface/20 border border-transparent w-full h-[22px]">
                                                            <span className="text-[10px] font-mono text-[#ff832b] font-bold">{val}</span>
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

            {/* Footer */}
            <div className="p-2 border-t border-x-border bg-x-dark shrink-0">
                <button
                    onClick={() => {
                        if (confirm('确定要离开房间领域并断开连接吗？')) {
                            leaveRoom();
                        }
                    }}
                    className="w-full bg-transparent hover:bg-x-white text-x-muted hover:text-x-dark border border-x-border py-2 font-mono text-[10px] uppercase tracking-wider transition-all font-bold"
                >
                    断开连接 DISCONNECT
                </button>
            </div>
        </div>
    );
}
