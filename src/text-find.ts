/** Find in page text: case-insensitive literal matching over rendered DOM text */

/** Case-insensitive, global pattern for a literal query; undefined when the query is empty */
export function createFindPattern(query: string): RegExp | undefined {
    if (query === "") {
        return;
    }
    return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
}

/** [start, end) offsets of every match of a global pattern in text */
export function matchSpans(text: string, pattern: RegExp): [number, number][] {
    return Array.from(text.matchAll(pattern), (match) => [
        match.index,
        match.index + match[0].length,
    ]);
}

/** Text lines are the nearest non-span ancestors: a JSON line, a <pre>, a table cell */
function lineOf(node: Node): Node | null {
    let parent = node.parentElement;
    while (parent !== null && parent.tagName === "SPAN") {
        parent = parent.parentElement;
    }
    return parent;
}

/**
 * Ranges of every match in the visible text under container, in document order.
 * Text in hidden elements and in elements matching skip is ignored; a match may
 * span several text nodes of one line but never crosses lines.
 */
export function findTextRanges(
    container: Node,
    pattern: RegExp,
    skip: string,
    limit = Number.POSITIVE_INFINITY,
): Range[] {
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (node instanceof Element) {
                    return (node instanceof HTMLElement && node.hidden) ||
                        node.matches(skip)
                        ? NodeFilter.FILTER_REJECT
                        : NodeFilter.FILTER_SKIP;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        },
    );
    const ranges: Range[] = [];
    let line: Node | null = null;
    let texts: Text[] = [];

    const flush = (): void => {
        if (texts.length === 0) {
            return;
        }
        const text = texts.map((node) => node.data).join("");
        for (const [start, end] of matchSpans(text, pattern)) {
            if (ranges.length >= limit) {
                break;
            }
            const from = locate(texts, start, false);
            const to = locate(texts, end, true);
            if (from === undefined || to === undefined) {
                continue;
            }
            const range = document.createRange();
            range.setStart(from[0], from[1]);
            range.setEnd(to[0], to[1]);
            ranges.push(range);
        }
        texts = [];
    };

    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if (!(node instanceof Text) || node.length === 0) {
            continue;
        }
        const nodeLine = lineOf(node);
        if (nodeLine !== line) {
            flush();
            line = nodeLine;
        }
        texts.push(node);
    }
    flush();
    return ranges;
}

/**
 * Maps an offset in the joined text of a line back to a text node position. At
 * a node boundary a match start belongs to the later node, a match end to the earlier.
 */
function locate(
    texts: readonly Text[],
    offset: number,
    isEnd: boolean,
): [Text, number] | undefined {
    let rest = offset;
    for (const node of texts) {
        if (isEnd ? rest <= node.length : rest < node.length) {
            return [node, rest];
        }
        rest -= node.length;
    }
    return;
}

/** Scrolls only the scroller (never the host page) so the range sits comfortably in view */
export function scrollRangeIntoView(scroller: HTMLElement, range: Range): void {
    const rect = range.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    if (rect.top < view.top || rect.bottom > view.bottom) {
        scroller.scrollTop += rect.top - view.top - (view.height - rect.height) / 2;
    }
    if (rect.left < view.left || rect.right > view.right) {
        scroller.scrollLeft += rect.left - view.left - (view.width - rect.width) / 2;
    }
}
