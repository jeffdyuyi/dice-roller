import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    if (!content) return null;

    // Helper to parse inline styles: bold (**), italic (*), strikethrough (~~), inline code (`)
    const parseInline = (text: string): React.ReactNode[] => {
        let tokens: { type: 'text' | 'bold' | 'italic' | 'strike' | 'code'; content: string }[] = [{ type: 'text', content: text }];

        const regexes = [
            { type: 'bold' as const, re: /\*\*([^*]+)\*\*/g },
            { type: 'strike' as const, re: /~~([^~]+)~~/g },
            { type: 'italic' as const, re: /\*([^*]+)\*/g },
            { type: 'code' as const, re: /`([^`]+)`/g }
        ];

        for (const r of regexes) {
            const nextTokens: typeof tokens = [];
            for (const t of tokens) {
                if (t.type !== 'text') {
                    nextTokens.push(t);
                    continue;
                }
                let lastIndex = 0;
                let match;
                r.re.lastIndex = 0; // reset
                while ((match = r.re.exec(t.content)) !== null) {
                    const before = t.content.substring(lastIndex, match.index);
                    if (before) nextTokens.push({ type: 'text', content: before });
                    nextTokens.push({ type: r.type, content: match[1] });
                    lastIndex = r.re.lastIndex;
                }
                const after = t.content.substring(lastIndex);
                if (after) nextTokens.push({ type: 'text', content: after });
            }
            tokens = nextTokens;
        }

        return tokens.map((token, i) => {
            switch (token.type) {
                case 'bold': return <strong key={i} className="font-semibold text-ibm-text">{token.content}</strong>;
                case 'italic': return <em key={i} className="italic text-ibm-text">{token.content}</em>;
                case 'strike': return <del key={i} className="line-through text-ibm-textSecondary">{token.content}</del>;
                case 'code': return <code key={i} className="font-mono bg-ibm-layerHover text-ibm-primary px-1 py-0.5 border border-ibm-border text-xs">{token.content}</code>;
                default: return <span key={i}>{token.content}</span>;
            }
        });
    };

    // Split content by lines and group into block elements
    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    
    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let currentTable: { headers: string[]; alignments: string[]; rows: string[][] } | null = null;
    let currentQuote: string[] | null = null;

    const flushList = (key: number) => {
        if (!currentList) return;
        const listItems = currentList.items.map((item, idx) => (
            <li key={idx} className="ml-5 list-disc leading-relaxed text-ibm-text select-text">
                {parseInline(item)}
            </li>
        ));
        blocks.push(
            <ul key={`list-${key}`} className="space-y-1 my-2 select-text">
                {listItems}
            </ul>
        );
        currentList = null;
    };

    const flushTable = (key: number) => {
        if (!currentTable) return;
        blocks.push(
            <div key={`table-container-${key}`} className="overflow-x-auto my-3 border border-ibm-border select-text">
                <table className="min-w-full divide-y divide-ibm-border font-sans text-xs">
                    <thead className="bg-ibm-layer">
                        <tr>
                            {currentTable.headers.map((th, idx) => (
                                <th 
                                    key={idx} 
                                    className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wider text-ibm-textSecondary border-r border-ibm-border last:border-r-0"
                                >
                                    {parseInline(th.trim())}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ibm-border bg-ibm-background/40">
                        {currentTable.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="odd:bg-ibm-background/10 even:bg-ibm-layer/10 hover:bg-ibm-layerHover/30 transition-colors">
                                {row.map((cell, cellIdx) => (
                                    <td 
                                        key={cellIdx} 
                                        className="px-3 py-2 text-ibm-text border-r border-ibm-border last:border-r-0"
                                    >
                                        {parseInline(cell.trim())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        currentTable = null;
    };

    const flushQuote = (key: number) => {
        if (!currentQuote) return;
        blocks.push(
            <blockquote key={`quote-${key}`} className="border-l-4 border-ibm-primary pl-3 py-1 my-2 italic text-ibm-textSecondary bg-ibm-layer/40 font-serif select-text">
                {currentQuote.map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                        {parseInline(line)}
                    </p>
                ))}
            </blockquote>
        );
        currentQuote = null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Parse Tables
        if (trimmed.startsWith('|')) {
            if (currentList) flushList(i);
            if (currentQuote) flushQuote(i);

            const cells = line.split('|').map(s => s.trim());
            if (cells[0] === '') cells.shift();
            if (cells[cells.length - 1] === '') cells.pop();

            if (!currentTable) {
                currentTable = {
                    headers: cells,
                    alignments: [],
                    rows: []
                };
            } else if (currentTable.alignments.length === 0 && cells.every(c => c.startsWith(':') || c.startsWith('-') || c.endsWith(':'))) {
                currentTable.alignments = cells;
            } else {
                currentTable.rows.push(cells);
            }
            continue;
        } else {
            if (currentTable) flushTable(i);
        }

        // 2. Parse Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (currentQuote) flushQuote(i);
            const content = trimmed.substring(2);
            if (!currentList) {
                currentList = { type: 'ul', items: [content] };
            } else {
                currentList.items.push(content);
            }
            continue;
        } else {
            if (currentList) flushList(i);
        }

        // 3. Parse Blockquotes
        if (trimmed.startsWith('>')) {
            const content = trimmed.substring(trimmed.startsWith('> ') ? 2 : 1);
            if (!currentQuote) {
                currentQuote = [content];
            } else {
                currentQuote.push(content);
            }
            continue;
        } else {
            if (currentQuote) flushQuote(i);
        }

        // 4. Empty line (Paragraph breaks)
        if (trimmed === '') {
            continue;
        }

        // 5. Parse Headers
        if (trimmed.startsWith('# ')) {
            blocks.push(<h1 key={i} className="text-lg font-sans font-bold text-ibm-text mt-4 mb-2 tracking-tight select-text">{parseInline(trimmed.substring(2))}</h1>);
        } else if (trimmed.startsWith('## ')) {
            blocks.push(<h2 key={i} className="text-base font-sans font-semibold text-ibm-text mt-3 mb-1.5 tracking-tight border-b border-ibm-border pb-1 select-text">{parseInline(trimmed.substring(3))}</h2>);
        } else if (trimmed.startsWith('### ')) {
            blocks.push(<h3 key={i} className="text-sm font-sans font-semibold text-ibm-text mt-2.5 mb-1 select-text">{parseInline(trimmed.substring(4))}</h3>);
        } else if (trimmed.startsWith('#### ')) {
            blocks.push(<h4 key={i} className="text-[12px] font-sans font-semibold text-ibm-text mt-2 mb-1 select-text">{parseInline(trimmed.substring(5))}</h4>);
        } else {
            // Standard Paragraph
            blocks.push(<p key={i} className="text-[13px] leading-relaxed text-ibm-text my-1.5 font-sans break-words select-text">{parseInline(line)}</p>);
        }
    }

    if (currentTable) flushTable(lines.length);
    if (currentList) flushList(lines.length);
    if (currentQuote) flushQuote(lines.length);

    return <div className="space-y-1 text-ibm-text select-text">{blocks}</div>;
}
