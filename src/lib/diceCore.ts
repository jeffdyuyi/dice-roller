export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DICE_TYPES: Record<DiceType, { icon: string, sides: number }> = {
    d4: { icon: 'fa-dice-d6', sides: 4 },
    d6: { icon: 'fa-dice-d6', sides: 6 },
    d8: { icon: 'fa-dice-d20', sides: 8 },
    d10: { icon: 'fa-dice-d10', sides: 10 },
    d12: { icon: 'fa-dice-d12', sides: 12 },
    d20: { icon: 'fa-dice-d20', sides: 20 },
    d100: { icon: 'fa-dice-d6', sides: 100 }
};

export interface DiceResult {
    total: number;
    breakdown: string;
    tag: { text: string; color: string; bg: string; border: string } | null;
    historyTitle: string;
    historyFormula: string;
    isHTML?: boolean;
    hope?: number;
    fear?: number;
}

export function rollStandardDice(count: number, sides: number, mod: number): DiceResult {
    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        sum += r;
    }

    let isCritSuccess = false;
    let isCritFail = false;
    if (count === 1 && sides === 20) {
        if (rolls[0] === 20) isCritSuccess = true;
        if (rolls[0] === 1) isCritFail = true;
    }

    const total = sum + mod;
    const formulaStr = `${count}d${sides}` + (mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : '');

    let rollsStr = rolls.join(', ');
    if (rolls.length > 10) rollsStr = rolls.slice(0, 10).join(', ') + '...';
    const breakdownStr = `[${rollsStr}]` + (mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`) : '');

    let tag = null;
    if (isCritSuccess) tag = { text: "大成功", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (isCritFail) tag = { text: "大失败", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };

    const typeLabel = [4, 6, 8, 10, 12, 20, 100].includes(sides) ? "标准" : "自定义";

    return { total, breakdown: breakdownStr, tag, historyTitle: typeLabel, historyFormula: formulaStr };
}

export function parseAndRollFormula(formulaInput: string): DiceResult {
    let input = formulaInput.toLowerCase().trim().replace(/\s+/g, '');
    if (!input) throw new Error("输入为空");

    const terms = input.split(/([+-])/).filter(t => t);
    let total = 0;
    let breakdownParts: string[] = [];
    let currentSign = 1;

    for (const term of terms) {
        if (term === '+') { currentSign = 1; continue; }
        if (term === '-') { currentSign = -1; continue; }

        if (term.includes('d')) {
            const [cStr, sStr] = term.split('d');
            const c = cStr === '' ? 1 : parseInt(cStr, 10);
            const s = parseInt(sStr, 10);

            if (isNaN(c) || isNaN(s) || s < 1 || c < 1 || c > 100) {
                throw new Error("格式错误: " + term);
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

export function rollDaggerheart(mod: number): DiceResult {
    const hope = Math.floor(Math.random() * 12) + 1;
    const fear = Math.floor(Math.random() * 12) + 1;
    const total = hope + fear + mod;

    let status = "";
    let tag = null;

    if (hope === fear) {
        status = "双重暴击";
        tag = { text: status, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    } else if (hope > fear) {
        status = "伴随希望";
        tag = { text: status, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    } else {
        status = "伴随恐惧";
        tag = { text: status, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
    }

    const modStr = mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` ${mod}`) : '';
    // Format breakdown for display
    const breakdown = `希望 ${hope} / 恐惧 ${fear}${modStr}`;

    return {
        total,
        hope,
        fear,
        breakdown,
        tag,
        historyTitle: "匕首心",
        historyFormula: "2d12 判定",
        isHTML: false // I'll handle styling in the React component instead of raw HTML
    };
}
