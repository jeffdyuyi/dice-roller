export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DICE_TYPES: Record<DiceType, { icon: string, sides: number }> = {
    d4: { icon: 'fa-dice-d4', sides: 4 },
    d6: { icon: 'fa-dice-d6', sides: 6 },
    d8: { icon: 'fa-dice-d8', sides: 8 },
    d10: { icon: 'fa-dice-d10', sides: 10 },
    d12: { icon: 'fa-dice-d12', sides: 12 },
    d20: { icon: 'fa-dice-d20', sides: 20 },
    d100: { icon: 'fa-dice', sides: 100 }
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
    advDice?: number;
    advType?: 'advantage' | 'disadvantage' | 'none';
}

export function rollStandardDice(count: number, sides: number, mod: number, advType: 'advantage' | 'disadvantage' | 'none' = 'none'): DiceResult {
    const rollOnce = () => {
        const rolls: number[] = [];
        let sum = 0;
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * sides) + 1;
            rolls.push(r);
            sum += r;
        }
        return { rolls, sum };
    };

    let result1 = rollOnce();
    let finalRolls = result1.rolls;
    let finalSum = result1.sum;
    let breakdownStr = "";
    let advLabel = "";

    if (advType !== 'none') {
        let result2 = rollOnce();
        if (advType === 'advantage') {
            advLabel = " (优势)";
            if (result2.sum > result1.sum) {
                finalRolls = result2.rolls;
                finalSum = result2.sum;
                breakdownStr = `[${result2.rolls.join(', ')}] > [${result1.rolls.join(', ')}]`;
            } else {
                breakdownStr = `[${result1.rolls.join(', ')}] >= [${result2.rolls.join(', ')}]`;
            }
        } else {
            advLabel = " (劣势)";
            if (result2.sum < result1.sum) {
                finalRolls = result2.rolls;
                finalSum = result2.sum;
                breakdownStr = `[${result2.rolls.join(', ')}] < [${result1.rolls.join(', ')}]`;
            } else {
                breakdownStr = `[${result1.rolls.join(', ')}] <= [${result2.rolls.join(', ')}]`;
            }
        }
    } else {
        let rollsStr = result1.rolls.join(', ');
        if (result1.rolls.length > 10) rollsStr = result1.rolls.slice(0, 10).join(', ') + '...';
        breakdownStr = `[${rollsStr}]`;
    }

    let isCritSuccess = false;
    let isCritFail = false;
    if (count === 1 && sides === 20) {
        if (finalRolls[0] === 20) isCritSuccess = true;
        if (finalRolls[0] === 1) isCritFail = true;
    }

    const total = finalSum + mod;
    const formulaStr = `${count}d${sides}` + (mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : '') + advLabel;

    const fullBreakdown = breakdownStr + (mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`) : '');

    let tag = null;
    if (isCritSuccess) tag = { text: "大成功", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (isCritFail) tag = { text: "大失败", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };

    const typeLabel = [4, 6, 8, 10, 12, 20, 100].includes(sides) ? "标准" : "自定义";

    return { total, breakdown: fullBreakdown, tag, historyTitle: typeLabel, historyFormula: formulaStr, advType };
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

export function rollDaggerheart(mod: number, advType: 'advantage' | 'disadvantage' | 'none' = 'none'): DiceResult {
    const hope = Math.floor(Math.random() * 12) + 1;
    const fear = Math.floor(Math.random() * 12) + 1;
    const advDice = (advType !== 'none') ? Math.floor(Math.random() * 6) + 1 : 0;

    let total = hope + fear + mod;
    if (advType === 'advantage') total += advDice;
    if (advType === 'disadvantage') total -= advDice;

    let status = "";
    let tag = null;

    if (hope === fear) {
        status = "关键成功";
        tag = { text: status, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    } else if (hope > fear) {
        status = "伴随希望";
        tag = { text: status, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    } else {
        status = "伴随恐惧";
        tag = { text: status, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
    }

    const modStr = mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` ${mod}`) : '';
    const advStr = advType === 'advantage' ? ` + ${advDice}(优)` : advType === 'disadvantage' ? ` - ${advDice}(劣)` : '';

    // Format breakdown for display
    const breakdown = `希望 ${hope} / 恐惧 ${fear}${advStr}${modStr}`;

    return {
        total,
        hope,
        fear,
        advDice: advDice > 0 ? advDice : undefined,
        advType,
        breakdown,
        tag,
        historyTitle: "匕首心",
        historyFormula: "2d12 判定" + (advType === 'advantage' ? " (优势)" : advType === 'disadvantage' ? " (劣势)" : ""),
        isHTML: false
    };
}
