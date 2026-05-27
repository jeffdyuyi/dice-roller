import { useEffect } from 'react';
import twemoji from 'twemoji';

/**
 * TwemojiProvider
 * 
 * Globally replaces all emoji text nodes in the document with Twemoji SVG images,
 * ensuring consistent cross-platform rendering (especially on Windows where
 * flag emojis and some other glyphs are not natively rendered).
 * 
 * Uses a MutationObserver to catch dynamic content added by React re-renders.
 */
export function TwemojiProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const parseEmoji = (node: HTMLElement = document.body) => {
            twemoji.parse(node, {
                folder: 'svg',
                ext: '.svg',
                // Use jsDelivr CDN for reliable SVG emoji delivery
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                attributes: () => ({
                    style: 'display:inline-block;width:1.1em;height:1.1em;vertical-align:-0.15em;',
                }),
            });
        };

        // Initial parse on mount
        parseEmoji();

        // Watch for DOM changes so dynamically rendered content (chat messages,
        // dice rolls, React re-renders) also gets emoji replaced
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        parseEmoji(node as HTMLElement);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, []);

    return <>{children}</>;
}
