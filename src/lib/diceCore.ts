export interface DiceResult {
    total: number;
    breakdown: string;
    tag: { text: string; color: string; bg: string; border: string } | null;
    historyTitle: string;
    historyFormula: string;
    isCustom?: boolean;
}

export function rollStandardDice(count: number, sides: number, mod: number): DiceResult {
    let subTotal = 0;
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        subTotal += r;
    }

    const total = subTotal + mod;
    let isCritSuccess = false;
    let isCritFail = false;

    if (count === 1 && sides === 20) {
        if (rolls[0] === 20) isCritSuccess = true;
        if (rolls[0] === 1) isCritFail = true;
    }

    const modStr = mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`) : '';
    const rollsStr = rolls.length > 10 ? rolls.slice(0, 10).join(', ') + '...' : rolls.join(', ');
    const breakdown = `[${rollsStr}]${modStr}`;

    let tag = null;
    if (isCritSuccess) tag = { text: "大成功", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/50" };
    if (isCritFail) tag = { text: "大失败", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50" };

    const formulaStr = `${count}d${sides}` + (mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : '');
    const typeLabel = [4, 6, 8, 10, 12, 20, 100].includes(sides) ? "标准" : "自定义";

    return { total, breakdown, tag, historyTitle: typeLabel, historyFormula: formulaStr };
}

export function parseAndRollFormula(formulaInput: string): DiceResult {
    let input = formulaInput.toLowerCase().trim().replace(/\\s+/g, '');
    if (!input) throw new Error("输入为空");

    const terms = input.split(/([+-])/).filter(t => t);
    let total = 0;
    let breakdownParts: string[] = [];
    let currentSign = 1;

    for (let term of terms) {
        if (term === '+') { currentSign = 1; continue; }
        if (term === '-') { currentSign = -1; continue; }

        if (term.includes('d')) {
            const [cStr, sStr] = term.split('d');
            const c = cStr === '' ? 1 : parseInt(cStr, 10);
            const s = parseInt(sStr, 10);

            if (isNaN(c) || isNaN(s) || s < 1 || c < 1 || c > 100) {
                throw new Error("公式格式错误或超出限制: " + term);
            }

            let subT = 0;
            for (let j = 0; j < c; j++) subT += Math.floor(Math.random() * s) + 1;

            total += (subT * currentSign);
            breakdownParts.push(`${currentSign === 1 ? (breakdownParts.length > 0 ? '+ ' : '') : '- '}[${subT}]`);
        } else {
            const v = parseInt(term, 10);
            if (!isNaN(v)) {
                total += (v * currentSign);
                breakdownParts.push(`${currentSign === 1 ? (breakdownParts.length > 0 ? '+ ' : '') : '- '}${v}`);
            } else {
                throw new Error("未知字符: " + term);
            }
        }
    }

    return {
        total,
        breakdown: formulaInput + " = " + breakdownParts.join(' '),
        tag: null,
        historyTitle: "公式",
        historyFormula: formulaInput
    };
}

export interface DHResult extends DiceResult {
    hope: number;
    fear: number;
    breakdownHTML: string;
}

export function rollDaggerheart(mod: number): DHResult {
    const hope = Math.floor(Math.random() * 12) + 1;
    const fear = Math.floor(Math.random() * 12) + 1;
    const total = hope + fear + mod;

    let status = "";
    let tag = null;

    if (hope === fear) {
        status = "双重暴击";
        tag = { text: status, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/50" };
    } else if (hope > fear) {
        status = "伴随希望";
        tag = { text: status, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/50" };
    } else {
        status = "伴随恐惧";
        tag = { text: status, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/50" };
    }

    const modStr = mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` ${mod}`) : '';
    const breakdownHTML = `<span class="dh-hope">希望:${hope}</span> <span class="text-slate-600">/</span> <span class="dh-fear">恐惧:${fear}</span>${modStr}`;

    return {
        total,
        hope, fear, breakdownHTML,
        breakdown: `希望 ${hope}, 恐惧 ${fear}`,
        tag,
        historyTitle: "匕首心",
        historyFormula: "2d12 判定"
    };
}
