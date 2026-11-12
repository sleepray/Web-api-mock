import { showToast } from "../utils";

import { planEditorKey, type TEditAction } from "./editor-assist";
import { formatJson, jsonError } from "./json-repair";
import { applyPreset, kMockPresets, resetRule, type TMockPreset, type TRuleChange } from "./presets";
import type { TRealResponse } from "./record-seed";
import {
    addMockRule,
    clearMockRules,
    getMockRules,
    isMockPaused,
    removeMockRule,
    replaceMockRule,
    setMockPaused,
    subscribeMock,
} from "./rule-store";
import { isUsedUp, kMockMethods, normalizeRule, type TMockMode, type TMockRule } from "./rules";

/**
 * 面板里的「Rules」视图：规则列表和每条规则的编辑器。
 * 规则的数据都在 rule-store 里，这里只负责画和改。
 */

export type TRulesViewOptions = {
    /** 给一条规则找最近抓到的真实返回，Reset 时用 */
    findRealResponse: (rule: TMockRule) => TRealResponse | undefined;
};

export type TRulesView = {
    el: HTMLDivElement;
    /** 滚到这条规则并闪一下边框，告诉人「在这儿」 */
    reveal: (ruleId: string) => void;
    /** 把键盘焦点放进视图 */
    focus: () => void;
};

// 下拉框里只放短名字，解释放在 title 和下方的提示里：面板默认只有 440px 宽
const kModeOptions: readonly { value: TMockMode; label: string }[] = [
    { value: "block", label: "Block" },
    { value: "rewrite", label: "Pass through" },
    { value: "hang", label: "Hang" },
];

/** 详情和提示里用的模式名 */
export function mockModeLabel(mode: TMockMode): string {
    return mode === "rewrite" ? "pass-through" : mode;
}

/** 规则视图自己的样式；`root` 是面板根节点的选择器，所有规则都以它开头，和面板其它样式的写法一致 */
export function rulesViewStyle(root: string): string {
    const R = root;
    return `
        ${R} .nri-panel[data-view="rules"] > :is(.nri-searchbar, .nri-typebar, .nri-list, .nri-detail) {
            display: none;
        }
        ${R} .nri-rules {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${R} .nri-rules-bar {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px 6px 12px;
            flex-shrink: 0;
        }
        ${R} .nri-rules-bar label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: var(--nri-label-secondary);
            white-space: nowrap;
        }
        ${R} .nri-rules-bar label.nri-paused {
            color: var(--nri-orange);
            font-weight: 600;
        }
        ${R} .nri-rules-hint {
            padding: 0 12px 6px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
            flex-shrink: 0;
        }
        ${R} .nri-rules-list {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 8px 8px;
        }
        ${R} .nri-rules-empty {
            padding: 18px 8px;
            color: var(--nri-label-secondary);
            text-align: center;
            line-height: 1.5;
        }
        ${R} .nri-rule {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 8px;
            background: var(--nri-row-alt);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            transition: box-shadow 0.3s ease;
        }
        ${R} .nri-rule.nri-rule-off > :not(:first-child) {
            opacity: 0.5;
        }
        ${R} .nri-rule.nri-rule-flash {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${R} .nri-rule-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 6px;
        }
        ${R} .nri-rule-label {
            color: var(--nri-label-secondary);
            font-size: 11px;
            white-space: nowrap;
        }
        ${R} .nri-check {
            width: 13px;
            height: 13px;
            margin: 0;
            accent-color: var(--nri-selection);
            flex: 0 0 auto;
        }
        /* 页面常会给 input / select / textarea 设白底、边框和字号（甚至 !important），面板主题必须优先 */
        ${R} .nri-field {
            height: 22px;
            margin: 0;
            padding: 0 6px;
            border: 0 !important;
            border-radius: 6px;
            background: var(--nri-fill) !important;
            box-shadow: none;
            color: var(--nri-label) !important;
            font-size: 12px !important;
            line-height: normal !important;
            outline: none !important;
            min-width: 0;
        }
        ${R} .nri-field:focus {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${R} select.nri-field {
            padding: 0 2px 0 4px;
            color-scheme: light dark;
        }
        ${R} select.nri-field option {
            background: var(--nri-menu-opaque);
            color: var(--nri-label);
        }
        ${R} .nri-field-grow {
            flex: 1;
            min-width: 120px;
        }
        ${R} .nri-field-num {
            width: 58px;
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-rule-hits {
            margin-left: auto;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${R} .nri-rule-hits.nri-spent {
            color: var(--nri-orange);
        }
        ${R} .nri-chips {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin-bottom: 6px;
        }
        ${R} .nri-chip {
            height: 18px;
            padding: 0 7px;
            border: 0;
            border-radius: 9px;
            background: var(--nri-fill);
            color: var(--nri-label);
            font-size: 11px;
            white-space: nowrap;
        }
        ${R} .nri-chip:hover {
            background: var(--nri-fill-pressed);
        }
        ${R} .nri-chip.nri-chip-end {
            margin-left: auto;
            color: var(--nri-blue);
        }
        ${R} .nri-rule-bodywrap {
            position: relative;
        }
        ${R} textarea.nri-rule-body {
            display: block;
            width: 100%;
            height: 44px;
            min-height: 44px;
            padding: 5px 7px;
            resize: vertical;
            overflow: auto;
            white-space: pre;
            font-family: var(--nri-font-mono) !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            user-select: text;
        }
        ${R} textarea.nri-rule-body.nri-invalid {
            box-shadow: inset 0 0 0 1px var(--nri-red);
        }
        /* 「Format」浮在编辑框右上角，不占一行；往左让开滚动条 */
        ${R} .nri-rule-format {
            position: absolute;
            top: 4px;
            right: 18px;
            opacity: 0.85;
        }
        ${R} .nri-rule-format:hover {
            opacity: 1;
        }
        ${R} .nri-rule-error {
            margin-top: 4px;
            color: var(--nri-red);
            font-size: 11px;
            line-height: 1.4;
            user-select: text;
        }
        ${R} .nri-rule-note {
            margin-top: 6px;
            padding: 5px 8px;
            border-radius: 6px;
            background: var(--nri-fill);
            color: var(--nri-label-secondary);
            font-size: 11px;
            line-height: 1.4;
        }
        ${R} .nri-rule-note.nri-danger {
            background: color-mix(in srgb, var(--nri-red) 14%, transparent);
            color: var(--nri-red);
        }
        ${R} .nri-rule-error .nri-text-btn,
        ${R} .nri-rule-note .nri-text-btn {
            margin-left: 6px;
            font-weight: 600;
        }
        ${R} .nri-text-btn.nri-danger {
            color: var(--nri-red);
            font-weight: 600;
        }
    `;
}

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className !== undefined) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

function button(className: string, text: string, title: string, onClick: () => void): HTMLButtonElement {
    const node = el("button", className, text);
    node.type = "button";
    node.title = title;
    node.addEventListener("click", onClick);
    return node;
}

function hitsText(rule: TMockRule): string {
    if (rule.times > 0) {
        return `Hits ${rule.hits} / ${rule.times}${isUsedUp(rule) ? " — spent" : ""}`;
    }
    return `Hits ${rule.hits}`;
}

function modeNote(mode: TMockMode): { text: string; danger: boolean } | undefined {
    if (mode === "rewrite") {
        return {
            text: "The request is really sent and executed; only the response the page sees is replaced. Orders, payments and approvals still take effect.",
            danger: true,
        };
    }
    if (mode === "hang") {
        return {
            text: "The request is not sent and never completes: use it to check loading states and the page's own timeout. Status, body and delay are ignored.",
            danger: false,
        };
    }
    return;
}

/**
 * 把输入辅助算出来的动作落到编辑框上。
 * 走 execCommand 是为了留在浏览器的撤销记录里（Ctrl+Z 能退回去）；不支持时退回直接改值。
 */
function applyEditAction(textarea: HTMLTextAreaElement, action: TEditAction): void {
    if (action.kind === "move") {
        textarea.setSelectionRange(action.to, action.to);
        return;
    }
    if (action.select !== undefined) {
        textarea.setSelectionRange(action.select[0], action.select[1]);
    }
    let done = false;
    try {
        done = document.execCommand(action.text === "" ? "delete" : "insertText", false, action.text);
    } catch {
        // 走下面
    }
    if (!done) {
        textarea.setRangeText(action.text, textarea.selectionStart, textarea.selectionEnd, "end");
        textarea.dispatchEvent(new Event("input"));
    }
    if (action.caretBack !== undefined) {
        const caret = textarea.selectionStart - action.caretBack;
        textarea.setSelectionRange(caret, caret);
    }
}

type TRuleCard = {
    id: string;
    el: HTMLDivElement;
    /** 规则在别处变了（命中次数、别的标签页、预设），把界面对齐到最新值 */
    sync: (rule: TMockRule) => void;
};

function createRuleCard(initial: TMockRule, options: TRulesViewOptions): TRuleCard {
    let rule = initial;
    // 正在输入的那个控件不回写，免得打断输入；预设、复原这类主动改值的操作要强制回写
    let forceSync = false;

    function update(patch: Partial<TMockRule>, force = false): void {
        rule = { ...rule, ...patch };
        forceSync = force;
        replaceMockRule(rule);
        forceSync = false;
    }

    const card = el("div", "nri-rule");

    // ---- 第一行：启用 | 方法 | 地址匹配 | 删除 ----
    const enabled = el("input", "nri-check");
    enabled.type = "checkbox";
    enabled.title = "Enable this rule";
    enabled.addEventListener("change", () => update({ on: enabled.checked }));

    const method = el("select", "nri-field");
    method.title = "Request method";
    for (const value of kMockMethods) {
        const option = el("option", undefined, value);
        option.value = value;
        method.appendChild(option);
    }
    method.addEventListener("change", () => update({ method: method.value as TMockRule["method"] }));

    const match = el("input", "nri-field nri-field-grow");
    match.type = "text";
    match.spellcheck = false;
    match.autocomplete = "off";
    match.placeholder = "Part of the URL, e.g. /api/transfers; start with re: for a regex";
    match.setAttribute("aria-label", "URL match");
    match.addEventListener("input", () => update({ match: match.value }));

    const remove = button("nri-btn", "✕", "Delete this rule", () => removeMockRule(rule.id));

    const head = el("div", "nri-rule-row");
    head.append(enabled, method, match, remove);

    // ---- 第二行：状态码 | 模式 | 延迟 | 次数上限 | 命中次数 ----
    function numberField(key: "status" | "delay" | "times", title: string): HTMLInputElement {
        const field = el("input", "nri-field nri-field-num");
        field.type = "number";
        field.min = "0";
        field.title = title;
        field.addEventListener("change", () => {
            // 填了不合法的值就落回默认，并把框里的数改回来
            const fixed = normalizeRule({ ...rule, [key]: field.value })[key];
            field.value = String(fixed);
            update({ [key]: fixed });
        });
        return field;
    }
    const status = numberField("status", "HTTP status, 200–599; 0 = network error");
    const delay = numberField("delay", "Wait this many milliseconds before responding");
    const times = numberField("times", "Apply at most this many times, then let requests through; 0 = no limit");

    const mode = el("select", "nri-field");
    mode.title =
        "Block: not sent, the rule answers. Pass through: really sent and executed, the page sees the rule's response. Hang: not sent, never answers";
    for (const { value, label } of kModeOptions) {
        const option = el("option", undefined, label);
        option.value = value;
        mode.appendChild(option);
    }
    mode.addEventListener("change", () => update({ mode: mode.value as TMockMode }, true));

    const hits = el("span", "nri-rule-hits");
    const resetHits = button("nri-text-btn", "Reset", "Set the hit count back to 0", () => update({ hits: 0 }));

    // 默认面板只有 440px 宽，分两行固定排布，免得随宽度折得七零八落
    const settings = el("div", "nri-rule-row");
    settings.append(el("span", "nri-rule-label", "Respond"), status, mode, hits, resetHits);
    const timing = el("div", "nri-rule-row");
    timing.append(
        el("span", "nri-rule-label", "Delay"),
        delay,
        el("span", "nri-rule-label", "ms"),
        el("span", "nri-rule-label", "Max hits"),
        times,
        el("span", "nri-rule-label", "(0 = no limit)"),
    );

    // ---- 预设 ----
    function applyChange(change: TRuleChange): void {
        if ("error" in change) {
            showToast("info", change.error, 4000);
            return;
        }
        fixNote.hidden = true;
        update(change.rule, true);
    }
    const presets = el("div", "nri-chips");
    presets.append(el("span", "nri-rule-label", "Presets"));
    for (const preset of kMockPresets) {
        presets.append(
            button("nri-chip", preset.label, preset.title, () =>
                applyChange(applyPreset(rule, preset as TMockPreset)),
            ),
        );
    }
    presets.append(
        button(
            "nri-chip nri-chip-end",
            "↺ Reset",
            "Back to the captured response: restore status and body, block mode, no delay",
            () => applyChange(resetRule(rule, options.findRealResponse(rule))),
        ),
    );

    // ---- 响应体编辑框 ----
    const body = el("textarea", "nri-field nri-rule-body");
    body.spellcheck = false;
    body.placeholder = "Response body";
    body.setAttribute("aria-label", "Response body");

    const errorLine = el("div", "nri-rule-error");
    const fixNote = el("div", "nri-rule-note");
    fixNote.hidden = true;
    const note = el("div", "nri-rule-note");

    // 带入的真实返回往往几十上百行，按内容把框撑高一些，封顶 260px，再长就在框里滚动
    function fitHeight(): void {
        const lines = rule.body.split("\n").length;
        body.style.height = `${Math.min(260, Math.max(44, lines * 16.5 + 12))}px`;
    }

    // 少个逗号、多个引号，页面拿到后会解析失败，报出来的错很像前端 bug —— 所以改的时候就提示
    const autoFix = button(
        "nri-text-btn",
        "Auto-fix",
        "Add missing quotes, commas and brackets, drop stray commas, then re-indent. Can be undone",
        formatBody,
    );
    function checkBody(): void {
        const message = jsonError(rule.body);
        errorLine.hidden = message === "";
        errorLine.replaceChildren(
            ...(message === ""
                ? []
                : [`The body is not valid JSON, so the page will fail to parse it: ${message}`, autoFix]),
        );
        body.classList.toggle("nri-invalid", message !== "");
    }

    function setBody(text: string): void {
        body.value = text;
        update({ body: text });
        checkBody();
        fitHeight();
    }

    // 「Format」和「Auto-fix」是同一个动作：合法的重新排版；写坏了的先试着修好再排版。
    // 修复是猜的，所以改完留一条说明修了什么，带「Undo」
    function formatBody(): void {
        const result = formatJson(rule.body);
        if ("error" in result) {
            showToast("info", result.error, 3000);
            return;
        }
        if (result.text === rule.body) {
            showToast("info", "Already formatted", 1500);
            return;
        }
        const previous = rule.body;
        setBody(result.text);
        fixNote.replaceChildren(
            result.fixed === undefined
                ? "Re-indented."
                : `Fixed ${result.fixed}. Check that the result is what you meant.`,
            button("nri-text-btn", "Undo", "Put the body back the way it was", () => {
                setBody(previous);
                fixNote.hidden = true;
            }),
        );
        fixNote.hidden = false;
    }

    body.addEventListener("input", () => {
        fixNote.hidden = true;
        update({ body: body.value });
        checkBody();
    });
    body.addEventListener("keydown", (event) => {
        if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        const action = planEditorKey(
            { value: body.value, start: body.selectionStart, end: body.selectionEnd },
            { key: event.key, shiftKey: event.shiftKey },
        );
        if (action !== undefined) {
            event.preventDefault();
            applyEditAction(body, action);
        }
    });

    const format = button(
        "nri-push-btn nri-rule-format",
        "Format",
        "Re-indent the JSON; broken JSON (missing quotes, commas, brackets) is repaired first",
        formatBody,
    );
    const bodyWrap = el("div", "nri-rule-bodywrap");
    bodyWrap.append(body, format);

    card.append(head, settings, timing, presets, bodyWrap, errorLine, fixNote, note);

    function setValue(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): void {
        if ((forceSync || document.activeElement !== field) && field.value !== value) {
            field.value = value;
        }
    }

    function sync(next: TMockRule): void {
        const bodyChanged = next.body !== body.value;
        rule = next;
        card.classList.toggle("nri-rule-off", !rule.on);
        enabled.checked = rule.on;
        setValue(method, rule.method);
        setValue(match, rule.match);
        setValue(status, String(rule.status));
        setValue(mode, rule.mode);
        setValue(delay, String(rule.delay));
        setValue(times, String(rule.times));
        setValue(body, rule.body);
        hits.textContent = hitsText(rule);
        hits.classList.toggle("nri-spent", isUsedUp(rule));
        const modeInfo = modeNote(rule.mode);
        note.hidden = modeInfo === undefined;
        note.textContent = modeInfo?.text ?? "";
        note.classList.toggle("nri-danger", modeInfo?.danger === true);
        // 响应体是从别处改过来的（预设、复原、别的标签页）才重新校验和调高度；自己输入时 input 事件已经做过了
        if (bodyChanged && body.value === rule.body) {
            checkBody();
            fitHeight();
        }
    }

    body.value = rule.body;
    checkBody();
    fitHeight();
    sync(rule);

    return { id: rule.id, el: card, sync };
}

export function createRulesView(options: TRulesViewOptions): TRulesView {
    const view = el("div", "nri-rules");
    view.hidden = true;

    // ---- 顶部：新建 | 全部暂停 | 清空 ----
    const addBtn = button("nri-push-btn", "+ New Rule", "Add an empty rule", () => {
        const rule = addMockRule({});
        reveal(rule.id);
        cards.get(rule.id)?.el.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    });

    const pause = el("input", "nri-check");
    pause.type = "checkbox";
    pause.addEventListener("change", () => setMockPaused(pause.checked));
    const pauseLabel = el("label");
    pauseLabel.title = "Turn every rule off for now; the rules themselves are kept";
    pauseLabel.append(pause, "Pause All");

    // 清空的规则找不回来，所以要点两次：第一次只是把按钮变成红色的确认，3 秒不点就恢复原样
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    function disarmClear(): void {
        if (clearTimer !== undefined) {
            clearTimeout(clearTimer);
            clearTimer = undefined;
        }
        clearBtn.textContent = "Clear All";
        clearBtn.classList.remove("nri-danger");
    }
    const clearBtn = button("nri-text-btn", "Clear All", "Delete every rule", () => {
        if (clearTimer === undefined) {
            const count = getMockRules().length;
            clearBtn.textContent = `Click again to delete ${count === 1 ? "the rule" : `all ${count} rules`}`;
            clearBtn.classList.add("nri-danger");
            clearTimer = setTimeout(disarmClear, 3000);
            return;
        }
        disarmClear();
        clearMockRules();
    });

    const bar = el("div", "nri-rules-bar");
    bar.append(addBtn, pauseLabel, el("span", "nri-spacer"), clearBtn);

    // 脱敏的一个明确例外：规则里的响应体必须是原文，否则 mock 回去的是打了码的假数据
    const hint = el(
        "div",
        "nri-rules-hint",
        "Rule bodies are stored and shown unredacted — the page must receive the real content.",
    );

    const list = el("div", "nri-rules-list");
    const empty = el(
        "div",
        "nri-rules-empty",
        "No rules yet. Select a request and choose Mock, or add a rule by hand.",
    );

    view.append(bar, hint, list);

    const cards = new Map<string, TRuleCard>();
    let order: string[] = [];

    function render(): void {
        const rules = getMockRules();
        const ids = rules.map((rule) => rule.id);
        // 规则增删了才重排卡片；已有的卡片留着用，正在输入的编辑框不会丢焦点
        if (ids.length !== order.length || ids.some((id, index) => id !== order.at(index))) {
            for (const id of order) {
                if (!ids.includes(id)) {
                    cards.delete(id);
                }
            }
            for (const rule of rules) {
                if (!cards.has(rule.id)) {
                    cards.set(rule.id, createRuleCard(rule, options));
                }
            }
            order = ids;
            const nodes = ids.flatMap((id) => {
                const card = cards.get(id);
                return card === undefined ? [] : [card.el];
            });
            list.replaceChildren(...(nodes.length === 0 ? [empty] : nodes));
            disarmClear();
        }
        for (const rule of rules) {
            cards.get(rule.id)?.sync(rule);
        }
        const paused = isMockPaused();
        pause.checked = paused;
        pauseLabel.classList.toggle("nri-paused", paused);
        clearBtn.hidden = rules.length === 0;
        hint.hidden = rules.length === 0;
    }

    function reveal(ruleId: string): void {
        const card = cards.get(ruleId);
        if (card === undefined) {
            return;
        }
        // 自己算滚动量，不用 scrollIntoView：它会连宿主页面一起滚
        const box = list.getBoundingClientRect();
        const rect = card.el.getBoundingClientRect();
        if (rect.top < box.top) {
            list.scrollTop -= box.top - rect.top + 8;
        } else if (rect.bottom > box.bottom) {
            list.scrollTop += Math.min(rect.top - box.top - 8, rect.bottom - box.bottom + 8);
        }
        card.el.classList.add("nri-rule-flash");
        setTimeout(() => card.el.classList.remove("nri-rule-flash"), 1200);
    }

    list.replaceChildren(empty);
    render();
    subscribeMock(render);

    return {
        el: view,
        reveal,
        focus: () => {
            addBtn.focus({ preventScroll: true });
        },
    };
}
