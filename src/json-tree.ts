import { tr } from "./i18n";
import { matchSpans } from "./text-find";

/** 可折叠 JSON 树：子节点在首次展开时才构建，大数组按块追加，避免一次渲染整棵大树 */
const kChunkSize = 200;
/** 默认展开的层级（根为 0） */
const kExpandDepth = 2;

const kChevronSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;

/** Which line of a node: a primitive or empty container is a single line; others have a header and a footer */
type TJsonLinePart = "line" | "header" | "footer";

/** A find match in a tree: the line, as child indexes from the root, and its occurrence within the line */
export type TJsonLineMatch = {
    path: number[];
    part: TJsonLinePart;
    occurrence: number;
};

/** Expands a container node and renders its children up to index */
type TNodeControl = {
    header: HTMLElement;
    footer: HTMLElement;
    revealChild: (index: number) => HTMLElement | undefined;
};

const nodeControls = new WeakMap<HTMLElement, TNodeControl>();
const treeValues = new WeakMap<HTMLElement, unknown>();

function span(className: string, text: string): HTMLSpanElement {
    const el = document.createElement("span");
    el.className = className;
    el.textContent = text;
    return el;
}

function primitiveToken(value: unknown): [className: string, text: string] {
    if (value === null) {
        return ["nri-json-null", "null"];
    }
    switch (typeof value) {
        case "string":
            return ["nri-json-string", JSON.stringify(value)];
        case "number":
        case "bigint":
            return ["nri-json-number", String(value)];
        case "boolean":
            return ["nri-json-boolean", String(value)];
        default:
            return ["nri-json-null", typeof value];
    }
}

function keyLabel(name: string | undefined): HTMLSpanElement[] {
    if (name === undefined) {
        return [];
    }
    return [span("nri-json-key", JSON.stringify(name)), span("nri-json-punct", ": ")];
}

/** The text keyLabel renders */
function keyText(name: string | undefined): string {
    return name === undefined ? "" : `${JSON.stringify(name)}: `;
}

/** Entries of a container; undefined for primitives */
function containerEntries(value: unknown): [string, unknown][] | undefined {
    if (value === null || typeof value !== "object") {
        return;
    }
    return Array.isArray(value)
        ? value.map((item: unknown, index) => [String(index), item])
        : Object.entries(value);
}

function brackets(value: unknown): [string, string] {
    return Array.isArray(value) ? ["[", "]"] : ["{", "}"];
}

function createNode(
    name: string | undefined,
    value: unknown,
    depth: number,
    isLast: boolean,
): HTMLElement {
    const comma = isLast ? "" : ",";
    const entries = containerEntries(value);

    if (entries === undefined) {
        const line = document.createElement("div");
        line.className = "nri-json-line";
        line.append(
            ...keyLabel(name),
            span(...primitiveToken(value)),
            span("nri-json-punct", comma),
        );
        return line;
    }

    const isArray = Array.isArray(value);
    const [open, close] = brackets(value);

    if (entries.length === 0) {
        const line = document.createElement("div");
        line.className = "nri-json-line";
        line.append(...keyLabel(name), span("nri-json-punct", `${open}${close}${comma}`));
        return line;
    }

    const node = document.createElement("div");
    const header = document.createElement("div");
    header.className = "nri-json-line nri-json-toggle";
    const chevron = document.createElement("span");
    chevron.className = "nri-json-chevron";
    chevron.innerHTML = kChevronSvg;
    const noun = isArray ? "item" : "key";
    // Shown only while collapsed; find skips it so a header reads the same either way
    const collapsedTail = document.createElement("span");
    collapsedTail.className = "nri-json-tail";
    collapsedTail.append(
        span(
            "nri-json-summary",
            tr(
                `${entries.length} ${noun}${entries.length === 1 ? "" : "s"}`,
                `${entries.length} ${noun === "key" ? "个字段" : "项"}`,
            ),
        ),
        span("nri-json-punct", `${close}${comma}`),
    );
    header.append(chevron, ...keyLabel(name), span("nri-json-punct", open), collapsedTail);

    const children = document.createElement("div");
    children.className = "nri-json-children";
    const footer = document.createElement("div");
    footer.className = "nri-json-line";
    footer.appendChild(span("nri-json-punct", `${close}${comma}`));

    let rendered = 0;
    let moreButton: HTMLButtonElement | undefined;
    const renderMore = (): void => {
        const end = Math.min(entries.length, rendered + kChunkSize);
        const fragment = document.createDocumentFragment();
        entries.slice(rendered, end).forEach(([key, child], offset) => {
            const index = rendered + offset;
            fragment.appendChild(
                createNode(
                    isArray ? undefined : key,
                    child,
                    depth + 1,
                    index === entries.length - 1,
                ),
            );
        });
        rendered = end;
        moreButton?.remove();
        children.appendChild(fragment);
        if (rendered < entries.length) {
            moreButton = document.createElement("button");
            moreButton.type = "button";
            moreButton.className = "nri-json-more";
            moreButton.textContent = tr(
                `Show More (${entries.length - rendered} remaining)`,
                `显示更多（还有 ${entries.length - rendered} 项）`,
            );
            moreButton.addEventListener("click", renderMore);
            children.appendChild(moreButton);
        }
    };

    const setExpanded = (expanded: boolean): void => {
        if (expanded && rendered === 0) {
            renderMore();
        }
        node.classList.toggle("nri-json-open", expanded);
        collapsedTail.hidden = expanded;
        children.hidden = !expanded;
        footer.hidden = !expanded;
    };
    header.addEventListener("click", () => {
        // 拖选文字时不切换
        if ((window.getSelection()?.toString() ?? "") !== "") {
            return;
        }
        setExpanded(!node.classList.contains("nri-json-open"));
    });

    nodeControls.set(node, {
        header,
        footer,
        revealChild: (index) => {
            setExpanded(true);
            while (rendered <= index && rendered < entries.length) {
                renderMore();
            }
            const child = children.children.item(index);
            return child instanceof HTMLElement ? child : undefined;
        },
    });

    node.append(header, children, footer);
    setExpanded(depth < kExpandDepth);
    return node;
}

/** 渲染 JSON 值；字符串原样以等宽文本显示 */
export function createJsonTree(value: unknown): HTMLElement {
    if (typeof value === "string") {
        const pre = document.createElement("pre");
        pre.className = "nri-source";
        pre.textContent = value;
        return pre;
    }
    const tree = document.createElement("div");
    tree.className = "nri-json";
    tree.appendChild(createNode(undefined, value, 0, true));
    treeValues.set(tree, value);
    return tree;
}

/**
 * Matches of a global pattern in the lines a tree of value renders, in display
 * order, whether or not the lines are expanded yet; stops at limit. Collapsed
 * summaries are not searched.
 */
export function findJsonLineMatches(
    value: unknown,
    pattern: RegExp,
    limit: number,
): TJsonLineMatch[] {
    const matches: TJsonLineMatch[] = [];
    const addLine = (text: string, path: number[], part: TJsonLinePart): void => {
        const count = Math.min(matchSpans(text, pattern).length, limit - matches.length);
        for (let occurrence = 0; occurrence < count; occurrence++) {
            matches.push({ path, part, occurrence });
        }
    };
    const visit = (
        name: string | undefined,
        current: unknown,
        isLast: boolean,
        path: number[],
    ): void => {
        if (matches.length >= limit) {
            return;
        }
        const comma = isLast ? "" : ",";
        const entries = containerEntries(current);
        if (entries === undefined) {
            addLine(`${keyText(name)}${primitiveToken(current)[1]}${comma}`, path, "line");
            return;
        }
        const [open, close] = brackets(current);
        if (entries.length === 0) {
            addLine(`${keyText(name)}${open}${close}${comma}`, path, "line");
            return;
        }
        addLine(`${keyText(name)}${open}`, path, "header");
        const isArray = Array.isArray(current);
        entries.forEach(([key, child], index) => {
            visit(isArray ? undefined : key, child, index === entries.length - 1, [
                ...path,
                index,
            ]);
        });
        addLine(`${close}${comma}`, path, "footer");
    };
    visit(undefined, value, true, []);
    return matches;
}

/** Matches in a tree made by createJsonTree; undefined for any other element */
export function findInJsonTree(
    tree: Element,
    pattern: RegExp,
    limit: number,
): TJsonLineMatch[] | undefined {
    if (!(tree instanceof HTMLElement) || !treeValues.has(tree)) {
        return;
    }
    return findJsonLineMatches(treeValues.get(tree), pattern, limit);
}

/** Expands the nodes down to a matched line and returns its element */
export function revealJsonLine(
    tree: HTMLElement,
    { path, part }: { path: readonly number[]; part: TJsonLinePart },
): HTMLElement | undefined {
    let node = tree.firstElementChild;
    for (const index of path) {
        const control = node instanceof HTMLElement ? nodeControls.get(node) : undefined;
        node = control?.revealChild(index) ?? null;
    }
    if (!(node instanceof HTMLElement)) {
        return;
    }
    if (part === "line") {
        return node;
    }
    const control = nodeControls.get(node);
    if (control === undefined) {
        return;
    }
    if (part === "header") {
        return control.header;
    }
    // The footer shows only while expanded
    control.revealChild(0);
    return control.footer;
}
