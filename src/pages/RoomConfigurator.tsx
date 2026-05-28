import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMqttContext } from '../contexts/MqttContext';
import { getMyCharacters, saveCharacter } from '../features/characters/api';
import { getMyWhiteboards } from '../features/whiteboards/api';
import type { Character } from '../features/characters/types';
import type { WhiteboardProject } from '../features/whiteboards/types';

export function RoomConfigurator() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const {
        commState, myName: initialName,
        createRoom, joinRoom, connectionError, disconnectLocal
    } = useMqttContext();

    const queryMode = searchParams.get('mode') === 'join' ? 'join' : 'create';
    const queryRoomId = searchParams.get('roomId') || '';

    const [mode, setMode] = useState<'create' | 'join'>(queryMode);
    const [inputName, setInputName] = useState(initialName || 'Player-' + Math.floor(Math.random() * 1000));
    const [inputRoomId, setInputRoomId] = useState(queryRoomId);
    const [inputRoomName, setInputRoomName] = useState('');
    const [guestMode, setGuestMode] = useState(false);

    // Selected starter board (optional)
    const [myWhiteboards, setMyWhiteboards] = useState<WhiteboardProject[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');

    // Active character details (optional)
    const [myCharacters, setMyCharacters] = useState<Character[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string>('');

    // Custom player quick edit elements
    const [quickEditFields, setQuickEditFields] = useState<string[]>(['生命', '先攻']);
    const [newFieldName, setNewFieldName] = useState('');

    // Local-First custom broker configurations
    const [customBrokerInput, setCustomBrokerInput] = useState(() => {
        return localStorage.getItem('custom_mqtt_broker') || '';
    });

    const handleSaveCustomBroker = () => {
        const val = customBrokerInput.trim();
        if (val) {
            localStorage.setItem('custom_mqtt_broker', val);
            alert(`已成功设置自定义 MQTT Broker: ${val}\n重新连接时生效！`);
        } else {
            localStorage.removeItem('custom_mqtt_broker');
            alert('已恢复为公网默认 EMQX Broker！重新连接时生效。');
        }
    };

    useEffect(() => {
        // Sync query params when they change
        setMode(queryMode);
        setInputRoomId(queryRoomId);
    }, [queryMode, queryRoomId]);

    useEffect(() => {
        const userId = localStorage.getItem('dice_roller_my_id') || 'local-user';
        
        getMyCharacters(userId).then(chars => {
            setMyCharacters(chars);
            if (chars.length > 0) setSelectedCharId(chars[0].id);
        });

        getMyWhiteboards(userId).then(boards => {
            setMyWhiteboards(boards);
            if (boards.length > 0) setSelectedBoardId(boards[0].id);
        });
    }, []);

    // Redirect to home (which renders whiteboard/chat) immediately once connected!
    useEffect(() => {
        if (commState === 'CONNECTED') {
            navigate('/');
        }
    }, [commState, navigate]);

    const handleCreate = () => {
        if (!inputName.trim()) {
            alert('代号不能为空！');
            return;
        }
        let finalRoomName = inputRoomName.trim();
        if (!finalRoomName) {
            finalRoomName = 'ROOM' + Math.floor(1000 + Math.random() * 9000);
        }
        
        const starterBoard = myWhiteboards.find(b => b.id === selectedBoardId) || null;
        
        // Host gets a random 5-digit ID if they didn't specify one
        const finalRoomId = Math.floor(10000 + Math.random() * 90000).toString();
        
        const template = { name: '自定义战役', quickEditFields };
        createRoom(inputName.trim(), finalRoomId, finalRoomName, template, starterBoard);
    };

    const handleJoin = () => {
        if (!inputName.trim()) {
            alert('代号不能为空！');
            return;
        }
        if (!inputRoomId.trim()) {
            alert('请输入 5 位房间 ID！');
            return;
        }
        
        let charInfo = null;
        if (guestMode) {
            charInfo = { guestMode: true };
        } else {
            const char = myCharacters.find(c => c.id === selectedCharId);
            if (!char) {
                alert('请先关联一个角色卡，或以访客身份加入。');
                return;
            }
            charInfo = {
                guestMode: false,
                characterId: char.id
            };
        }
        joinRoom(inputName.trim(), inputRoomId.trim().toUpperCase(), charInfo);
    };

    const handleCreateQuickCharAndJoin = async () => {
        const charName = inputName.trim();
        if (!charName) {
            alert('代号/角色名不能为空！');
            return;
        }
        if (!inputRoomId.trim()) {
            alert('请输入 5 位房间 ID！');
            return;
        }

        const newCharId = 'char-' + Math.floor(100000 + Math.random() * 900000);
        const userId = localStorage.getItem('dice_roller_my_id') || 'local-user';

        const newChar: Character = {
            id: newCharId,
            name: charName,
            userId: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            memoItems: []
        };

        try {
            await saveCharacter(newChar);
            const chars = await getMyCharacters(userId);
            setMyCharacters(chars);
            setSelectedCharId(newCharId);
            
            const charInfo = {
                guestMode: false,
                characterId: newCharId
            };
            joinRoom(charName, inputRoomId.trim().toUpperCase(), charInfo);
        } catch (err) {
            console.error('一键建卡失败:', err);
            alert('一键建卡失败，请重试！');
        }
    };

    return (
        <div className="p-8 pb-32 max-w-4xl mx-auto w-full h-full flex flex-col bg-ibm-background">
            <header className="mb-12 border-b border-ibm-border pb-6 shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="h-8 px-4 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text text-xs font-mono transition-all"
                    >
                        ← 返回主控制台
                    </button>
                </div>
                <div>
                    <h1 className="text-ibm-text text-4xl font-sans font-light tracking-tight mb-2">联机战役配置</h1>
                    <p className="text-ibm-textSecondary font-sans text-sm">在这里配置您的联机代号，创建新的多人战役房间或加入现有的跑团车卡房间</p>
                </div>
            </header>

            {commState === 'WAITING' ? (
                <div className="bg-ibm-layer border border-ibm-border p-12 text-center flex flex-col items-center justify-center space-y-6">
                    <div className="w-12 h-12 border-4 border-ibm-border border-t-ibm-primary rounded-full animate-spin"></div>
                    <div>
                        <h2 className="text-xl font-sans text-ibm-text font-medium">
                            {mode === 'create' ? '正在开启房间通道...' : '正在申请加入战役...'}
                        </h2>
                        <p className="text-sm text-ibm-textSecondary mt-2">
                            {mode === 'create' ? '正在分配加密 MQTT 联机节点，并部署白板...' : '已向房主发送入场请求，请等待房主批准。'}
                        </p>
                    </div>
                    <button 
                        onClick={disconnectLocal}
                        className="h-10 px-8 border border-ibm-border text-ibm-text hover:bg-ibm-danger/10 hover:text-ibm-danger transition-all text-xs font-mono"
                    >
                        取消请求并返回
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Tab switcher and Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Headers */}
                        <div className="grid grid-cols-2 border border-ibm-border p-1 bg-ibm-layer">
                            <button
                                onClick={() => setMode('create')}
                                className={`py-3 text-center text-xs font-mono tracking-widest uppercase transition-all ${
                                    mode === 'create' 
                                        ? 'bg-[#ff832b] text-white font-semibold' 
                                        : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'
                                }`}
                            >
                                ⚔️ 开启新战役 (Host)
                            </button>
                            <button
                                onClick={() => setMode('join')}
                                className={`py-3 text-center text-xs font-mono tracking-widest uppercase transition-all ${
                                    mode === 'join' 
                                        ? 'bg-ibm-primary text-ibm-textOnColor font-semibold' 
                                        : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'
                                }`}
                            >
                                🛡️ 加入现有战役 (Player)
                            </button>
                        </div>

                        {/* Config Form Cards */}
                        <div className="bg-ibm-layer border border-ibm-border p-8 space-y-6">
                            <h3 className="text-lg font-sans font-medium text-ibm-text border-b border-ibm-border/30 pb-3 flex items-center gap-2">
                                <span>{mode === 'create' ? '🧙‍♂️ 房主与战役配置' : '🕵️ 玩家身份与房间验证'}</span>
                            </h3>

                            {/* Common: Player Nickname */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                    您在房间内的代号 / Nickname
                                </label>
                                <input 
                                    type="text" 
                                    value={inputName} 
                                    onChange={e => setInputName(e.target.value)} 
                                    className="w-full bg-ibm-background border border-ibm-border text-ibm-text px-4 py-3 text-sm focus:border-[#ff832b] outline-none transition-all placeholder:text-ibm-textSecondary/50 font-sans" 
                                    placeholder="输入您的昵称 (例如: 传奇DM - 萧森)"
                                />
                            </div>

                            {mode === 'create' ? (
                                <>
                                    {/* Create: Room Name */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                            战役房间名称 (英文/数字)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={inputRoomName} 
                                            onChange={e => {
                                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                setInputRoomName(val);
                                            }} 
                                            placeholder="例如: RAVENLOFT01 (留空则随机生成)" 
                                            className="w-full bg-ibm-background border border-ibm-border text-ibm-text px-4 py-3 text-sm focus:border-[#ff832b] outline-none transition-all placeholder:text-ibm-textSecondary/50 font-sans uppercase" 
                                        />
                                    </div>

                                    {/* Create: Optional starter whiteboard */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                            联动载入首发白板 (可选)
                                        </label>
                                        {myWhiteboards.length === 0 ? (
                                            <div className="p-4 border border-dashed border-ibm-border text-center text-xs text-ibm-textSecondary bg-ibm-background/40">
                                                您的白板库暂无存档。默认将创建一个空白网格白板。
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select 
                                                    value={selectedBoardId} 
                                                    onChange={e => setSelectedBoardId(e.target.value)} 
                                                    className="w-full bg-ibm-background border border-ibm-border px-4 py-3 text-sm text-ibm-text outline-none appearance-none cursor-pointer hover:bg-ibm-layerHover transition-all font-sans"
                                                >
                                                    <option value="">-- 不联动白板项目 (创建默认新白板) --</option>
                                                    {myWhiteboards.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name} (标签页: {b.tabs.length})</option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ibm-textSecondary pointer-events-none">▼</span>
                                            </div>
                                        )}
                                        <p className="text-[11px] text-ibm-textPlaceholder">提示：联动后，房间开启时将自动加载该白板的所有地图和标记物，并同步给全员玩家。</p>
                                    </div>

                                    {/* Create: Custom Quick Edit Fields */}
                                    <div className="space-y-4 border border-ibm-border p-5 bg-ibm-background/25">
                                        <div>
                                            <label className="text-[11px] font-mono uppercase tracking-widest text-[#ff832b] block font-bold">
                                                ⚔️ 战役玩家数据快速编辑配置 (可多选/增删)
                                            </label>
                                            <p className="text-[11px] text-ibm-textSecondary mt-1 leading-relaxed">
                                                房主可以预设此战役需要的快速修改字段(如生命、先攻等)。进入房间后，这些元素会以输入框形式显示在每位玩家昵称下，数值更改实时同步。
                                            </p>
                                        </div>

                                        {/* List of active fields */}
                                        <div className="flex flex-wrap gap-2">
                                            {quickEditFields.map(field => (
                                                <div 
                                                    key={field} 
                                                    className="flex items-center gap-1.5 bg-ibm-background border border-[#ff832b]/40 text-ibm-text px-2.5 py-1 text-xs rounded animate-in fade-in zoom-in duration-200"
                                                >
                                                    <span>{field}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuickEditFields(prev => prev.filter(f => f !== field))}
                                                        className="text-[#ff832b] hover:text-ibm-danger transition-colors font-bold text-sm ml-1"
                                                        title="删除此字段"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            {quickEditFields.length === 0 && (
                                                <span className="text-xs text-ibm-textPlaceholder italic">暂无预设快速编辑字段 (进入房间后将只有昵称)</span>
                                            )}
                                        </div>

                                        {/* Add new field */}
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={newFieldName}
                                                onChange={e => setNewFieldName(e.target.value)}
                                                placeholder="输入快速编辑元素名称，如先攻、HP、金币等"
                                                className="flex-1 bg-ibm-background border border-ibm-border text-ibm-text px-3 py-2 text-xs focus:border-[#ff832b] outline-none transition-all placeholder:text-ibm-textSecondary/50 font-sans"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const name = newFieldName.trim();
                                                        if (name && !quickEditFields.includes(name)) {
                                                            setQuickEditFields(prev => [...prev, name]);
                                                            setNewFieldName('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const name = newFieldName.trim();
                                                    if (name && !quickEditFields.includes(name)) {
                                                        setQuickEditFields(prev => [...prev, name]);
                                                        setNewFieldName('');
                                                    }
                                                }}
                                                className="bg-ibm-background border border-ibm-border hover:bg-[#ff832b]/10 hover:border-[#ff832b] text-[#ff832b] px-4 text-xs font-mono transition-all"
                                            >
                                                添加预设
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-ibm-textPlaceholder">提示：玩家加入后只在此房间中对该字段填写正负数字，退出即逝，不写入玩家数据库。</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Join: Room ID */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                            战役 5 位联机代码 (Room ID)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={inputRoomId} 
                                            onChange={e => setInputRoomId(e.target.value.toUpperCase().trim())} 
                                            placeholder="输入 5 位联机代码 (例如: 12345)" 
                                            className="w-full bg-ibm-background border border-ibm-border text-ibm-text px-4 py-3 text-sm focus:border-ibm-primary outline-none transition-all placeholder:text-ibm-textSecondary/50 font-mono text-center text-lg uppercase tracking-wider" 
                                            maxLength={5}
                                        />
                                    </div>

                                    {/* Join: Guest Mode Checkbox */}
                                    <div className="border border-ibm-border bg-ibm-background/45 p-4 space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={guestMode} 
                                                onChange={e => setGuestMode(e.target.checked)} 
                                                className="w-4 h-4 text-ibm-primary bg-ibm-background border-ibm-border focus:ring-0 rounded-none cursor-pointer outline-none accent-ibm-primary" 
                                            />
                                            <span className="text-[12px] font-mono uppercase tracking-widest text-ibm-textSecondary group-hover:text-ibm-text transition-colors select-none">
                                                以访客身份加入 (不挂载角色档案)
                                            </span>
                                        </label>

                                        {!guestMode && (
                                            <div className="space-y-2 border-t border-ibm-border/45 pt-4 animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                                    关联已存在的角色卡/备忘库
                                                </label>
                                                {myCharacters.length === 0 ? (
                                                    <div className="p-6 border border-dashed border-ibm-border bg-ibm-background/30 text-center space-y-3">
                                                        <p className="text-xs text-ibm-textSecondary">您的备忘库存内没有任何档案</p>
                                                        <button 
                                                            type="button"
                                                            onClick={handleCreateQuickCharAndJoin}
                                                            className="w-full h-11 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all text-xs font-mono font-medium uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                                                        >
                                                            <span>+</span> 快速新建空白备忘卡并加入
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <select 
                                                                value={selectedCharId} 
                                                                onChange={e => setSelectedCharId(e.target.value)} 
                                                                className="w-full bg-ibm-background border border-ibm-border px-4 py-3 text-sm text-ibm-text outline-none appearance-none cursor-pointer hover:bg-ibm-layerHover transition-all font-sans"
                                                            >
                                                                {myCharacters.map(c => (
                                                                    <option key={c.id} value={c.id}>{c.name} ({c.summary || '无模板'})</option>
                                                                ))}
                                                            </select>
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ibm-textSecondary pointer-events-none">▼</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <button
                                                                type="button"
                                                                onClick={handleCreateQuickCharAndJoin}
                                                                className="text-xs text-ibm-primary hover:underline font-mono"
                                                            >
                                                                + 快速新建另一个空白备忘卡并加入
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {connectionError && (
                                <div className="p-4 bg-ibm-danger/10 border border-ibm-danger/30 text-ibm-danger text-xs font-sans flex items-start gap-2.5 animate-in fade-in duration-200">
                                    <span className="text-sm">⚠️</span>
                                    <div>
                                        <p className="font-semibold">连接战役失败</p>
                                        <p className="mt-0.5 opacity-90">{connectionError}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-ibm-border/30 flex justify-end gap-3">
                                <button 
                                    onClick={() => navigate('/')}
                                    className="h-11 px-6 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover transition-all text-xs font-mono uppercase tracking-wider"
                                >
                                    取消
                                </button>
                                {mode === 'create' ? (
                                    <button 
                                        onClick={handleCreate}
                                        className="h-11 px-8 bg-[#ff832b] text-white hover:bg-[#e86c14] transition-all text-xs font-mono uppercase tracking-widest font-medium shadow-sm"
                                    >
                                        ⚔️ 部署并开启房间
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleJoin}
                                        className="h-11 px-8 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all text-xs font-mono uppercase tracking-widest font-medium shadow-sm"
                                    >
                                        🛡️ 申请进入战役
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tips & Info Sidebar */}
                    <div className="space-y-6">
                        <div className="border border-ibm-border bg-ibm-layer p-6 space-y-4">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-ibm-primary font-bold border-b border-ibm-border/30 pb-2">
                                💡 联机战役小提示
                            </h4>
                            <ul className="text-xs text-ibm-textSecondary space-y-3.5 leading-relaxed font-sans list-disc pl-4">
                                <li><strong>去中心化架构</strong>：本项目联机功能采用轻量级 MQTT 协议，玩家之间直接握手通信，极速响应，无需复杂的后台同步！</li>
                                <li><strong>白板共享</strong>：作为房主开启房间时，联动您事先画好的白板可以免去在战役中临时重新上传的麻烦。</li>
                                <li><strong>角色档案联动</strong>：玩家关联角色后，您的所有属性、冒险笔记将随同掷骰数据实时分享给房主，房主还可为您下发专属冒险备忘。</li>
                                <li><strong>房间失效判定</strong>：当检测到房主下线或关闭页面时，联机大厅的该房间会在 3 分钟内自动从公共列表中静默下架。</li>
                            </ul>
                        </div>

                        {/* 📶 Local LAN Guidance and Custom MQTT Broker */}
                        <div className="border border-ibm-border bg-ibm-layer p-6 space-y-4">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-[#ff832b] font-bold border-b border-ibm-border/30 pb-2">
                                📶 局域网离线/自组网联机指南
                            </h4>
                            <p className="text-[11px] text-ibm-textSecondary leading-relaxed">
                                当游玩场所（如地下室、展会等）<strong>无公网连接</strong>但处于同一 Wi-Fi 或热点下时，GM 与玩家可通过局域网自组网正常联机：
                            </p>
                            <div className="text-[11px] text-ibm-textSecondary space-y-2 bg-ibm-background/40 p-3.5 border border-ibm-border/60">
                                <p><strong>1. 开启本地代理：</strong>GM 需在电脑上运行本地 MQTT 代理服务（例如 Mosquitto），并允许 WebSocket 连接（默认端口 9001）。</p>
                                <p><strong>2. 获取局域网 IP：</strong>GM 在终端运行 <code className="font-mono text-white bg-ibm-layer px-1 py-0.5">ipconfig</code>，获取局域网 IPv4（例如 <code className="font-mono">192.168.1.100</code>）。</p>
                                <p><strong>3. 联机直连配置：</strong>将局域网代理地址填入下方配置，点击保存。玩家直接扫码或访问 GM IP 即可流畅对战。</p>
                            </div>
                            
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                    自定义 MQTT Broker 地址 (WebSocket)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={customBrokerInput} 
                                        onChange={e => setCustomBrokerInput(e.target.value)} 
                                        className="flex-1 bg-ibm-background border border-ibm-border text-ibm-text px-3 py-2 text-xs focus:border-[#ff832b] outline-none transition-all placeholder:text-ibm-textSecondary/50 font-mono" 
                                        placeholder="例如: ws://192.168.1.100:9001/mqtt"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveCustomBroker}
                                        className="bg-ibm-background border border-[#ff832b]/40 hover:bg-[#ff832b]/10 hover:border-[#ff832b] text-[#ff832b] px-3 text-xs font-mono transition-all"
                                    >
                                        保存
                                    </button>
                                </div>
                                <p className="text-[9px] text-ibm-textPlaceholder">
                                    留空并保存可重置为公网默认节点：<code className="font-mono">wss://broker.emqx.io:8084/mqtt</code>
                                </p>
                            </div>
                        </div>

                        <div className="border border-ibm-border bg-ibm-layer p-6 space-y-3">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-ibm-textSecondary font-bold border-b border-ibm-border/30 pb-2">
                                🛡️ 加密与数据保密
                            </h4>
                            <p className="text-[11px] text-ibm-textPlaceholder leading-relaxed">
                                所有在战局中产生的白板笔画、血量修改、实时备忘均仅保存在各自游玩的本地 IndexedDB 浏览器细分库内。退出战局时，房主退出即清空临时房间缓存，确保绝对的安全和独立隐私。
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
