import { tr } from "../i18n";
import { showToast } from "../utils";

import { planEditorKey, type TEditAction } from "./editor-assist";
import { formatJson, jsonError } from "./json-repair";
import { applyPreset, getMockPresets, resetRule, type TRuleChange } from "./presets";
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
    /** 不再跟着规则变化重画（面板重建时调用） */
    dispose: () => void;
};

// 下拉框里只放短名字，解释放在 title 和下方的提示里：面板默认只有 440px 宽
function modeOptions(): readonly { value: TMockMode; label: string; title: string }[] {
    return [
        {
            value: "block",
            label: tr("Block", "拦截"),
            title: tr("Not sent to the server; the page gets the rule's response", "不发到服务器，页面直接拿到规则的返回"),
        },
        {
            value: "rewrite",
            label: tr("Pass through", "放行"),
            title: tr(
                "Really sent and executed; only the response the page sees is replaced",
                "真的发出并执行，只把页面看到的返回换掉",
            ),
        },
        {
            value: "hang",
            label: tr("Hang", "挂起"),
            title: tr("Not sent and never answered", "不发，也一直不返回"),
        },
    ];
}

/** 详情和提示里用的模式名 */
export function mockModeLabel(mode: TMockMode): string {
    if (mode === "rewrite") {
        return tr("pass-through", "放行");
    }
    return mode === "hang" ? tr("hang", "挂起") : tr("block", "拦截");
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
        /* 顶栏和请求列表的筛选栏一样：同样的内边距和控件高度 */
        ${R} .nri-rules-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${R} .nri-rules-pause {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            white-space: nowrap;
        }
        ${R} .nri-rules-pause.nri-paused {
            color: var(--nri-orange);
            font-weight: 600;
        }
        ${R} .nri-rules-hint {
            padding: 0 12px 6px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
            flex-shrink: 0;
        }
        /* 列表区和请求列表同底色、同分隔线、同滚动条 */
        ${R} .nri-rules-list {
            flex: 1;
            min-height: 44px;
            overflow: auto;
            padding: 0 12px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
            background: var(--nri-sidebar);
        }
        ${R} .nri-rules-list::-webkit-scrollbar,
        ${R} textarea.nri-rule-body::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ${R} .nri-rules-list::-webkit-scrollbar-track,
        ${R} .nri-rules-list::-webkit-scrollbar-corner,
        ${R} textarea.nri-rule-body::-webkit-scrollbar-track,
        ${R} textarea.nri-rule-body::-webkit-scrollbar-corner,
        ${R} textarea.nri-rule-body::-webkit-resizer {
            background: transparent;
        }
        ${R} .nri-rules-list::-webkit-scrollbar-thumb,
        ${R} textarea.nri-rule-body::-webkit-scrollbar-thumb {
            border: 3px solid transparent;
            border-radius: 5px;
            background: var(--nri-scrollbar-thumb) padding-box;
        }
        ${R} .nri-rules-list::-webkit-scrollbar-thumb:hover,
        ${R} textarea.nri-rule-body::-webkit-scrollbar-thumb:hover {
            background-color: var(--nri-scrollbar-thumb-hover);
        }
        ${R} .nri-rules-empty {
            padding: 18px 8px;
            color: var(--nri-label-secondary);
            text-align: center;
            line-height: 1.5;
        }
        /* 一条规则一节，用细分隔线隔开，不再套圆角卡片 */
        ${R} .nri-rule {
            padding: 10px 0;
            border-bottom: var(--nri-hairline) solid var(--nri-separator);
            transition: background-color 0.3s ease;
        }
        ${R} .nri-rule:last-child {
            border-bottom: 0;
        }
        ${R} .nri-rule.nri-rule-off > :not(:first-child) {
            opacity: 0.5;
        }
        /* 定位到某条规则时整节闪一下底色；用阴影铺满左右留白，不改布局 */
        ${R} .nri-rule.nri-rule-flash {
            background: var(--nri-selection-inactive);
            box-shadow:
                -12px 0 0 var(--nri-selection-inactive),
                12px 0 0 var(--nri-selection-inactive);
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
        /* 页面常会给 input / select / textarea 设白底、边框和字号（甚至 !important），面板主题必须优先。
           外观和请求列表的筛选框一致 */
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
        ${R} .nri-field::placeholder {
            color: var(--nri-label-tertiary);
        }
        ${R} .nri-field:focus {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        /* 下拉框、数字框、编辑框的原生部件（下拉列表、滚动条）跟着面板的明暗走 */
        ${R}[data-nri-theme="dark"] .nri-field {
            color-scheme: dark;
        }
        ${R}[data-nri-theme="light"] .nri-field {
            color-scheme: light;
        }
        ${R} select.nri-field {
            -webkit-appearance: none;
            appearance: none;
            padding: 0 20px 0 7px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238c8c8c' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9.5 6 6 6-6'/%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: right 6px center !important;
            background-size: 10px !important;
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
            width: 52px;
            -moz-appearance: textfield;
            appearance: textfield;
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-field-num::-webkit-inner-spin-button,
        ${R} .nri-field-num::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
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
            margin-bottom: 8px;
        }
        ${R} .nri-chips .nri-text-btn {
            margin-left: auto;
            font-size: 11px;
        }
        ${R} .nri-rule-bodyhead {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }
        ${R} .nri-rule-bodyhead .nri-text-btn {
            margin-left: auto;
            font-size: 11px;
        }
        /* 编辑框和详情区的源码视图一致：等宽 11px、行高 1.5 */
        ${R} textarea.nri-rule-body {
            display: block;
            width: 100%;
            height: 44px;
            min-height: 44px;
            padding: 6px 8px;
            resize: vertical;
            overflow: auto;
            white-space: pre;
            font-family: var(--nri-font-mono) !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            scrollbar-color: var(--nri-scrollbar-thumb) transparent;
            user-select: text;
        }
        ${R} textarea.nri-rule-body.nri-invalid {
            box-shadow: inset 0 0 0 1px var(--nri-red);
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

const kXmarkSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12"/><path d="M18 6 6 18"/></svg>';

/** 按下不抢焦点，和面板工具栏的按钮一样 */
function keepFocusOnPress(node: HTMLElement): void {
    node.addEventListener("mousedown", (event) => {
        event.preventDefault();
    });
}

/** 和设置里「测试版」一样的开关 */
function createSwitch(label: string, onToggle: (on: boolean) => void): { el: HTMLButtonElement; set: (on: boolean) => void } {
    const node = el("button", "nri-switch");
    node.type = "button";
    node.setAttribute("role", "switch");
    node.title = label;
    node.setAttribute("aria-label", label);
    keepFocusOnPress(node);
    node.addEventListener("click", () => onToggle(node.getAttribute("aria-checked") !== "true"));
    return {
        el: node,
        set: (on) => {
            node.setAttribute("aria-checked", on ? "true" : "false");
        },
    };
}

/** 和工具栏 All | Failed | Mocked 一样的分段控件 */
function createSegments<T extends string>(
    label: string,
    segments: readonly { value: T; label: string; title: string }[],
    onChange: (value: T) => void,
): { el: HTMLDivElement; set: (value: T) => void } {
    const group = el("div", "nri-segmented");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", label);
    const buttons = segments.map((segment) => {
        const node = el("button", "nri-segment", segment.label);
        node.type = "button";
        node.dataset.value = segment.value;
        node.title = segment.title;
        keepFocusOnPress(node);
        node.addEventListener("click", () => {
            if (node.getAttribute("aria-pressed") !== "true") {
                onChange(segment.value);
            }
        });
        group.appendChild(node);
        return node;
    });
    return {
        el: group,
        set: (value) => {
            for (const node of buttons) {
                node.setAttribute("aria-pressed", node.dataset.value === value ? "true" : "false");
            }
        },
    };
}

function hitsText(rule: TMockRule): string {
    if (rule.times > 0) {
        return tr(
            `Hits ${rule.hits} / ${rule.times}${isUsedUp(rule) ? " — spent" : ""}`,
            `已命中 ${rule.hits} / ${rule.times}${isUsedUp(rule) ? "，已用完" : ""}`,
        );
    }
    return tr(`Hits ${rule.hits}`, `已命中 ${rule.hits} 次`);
}

function modeNote(mode: TMockMode): { text: string; danger: boolean } | undefined {
    if (mode === "rewrite") {
        return {
            text: tr(
                "The request is really sent and executed; only the response the page sees is replaced. Orders, payments and approvals still take effect.",
                "请求会真的发到服务器并执行，页面只是看到被改过的返回。下单、支付、审批这类接口照样会真的生效。",
            ),
            danger: true,
        };
    }
    if (mode === "hang") {
        return {
            text: tr(
                "The request is not sent and never completes: use it to check loading states and the page's own timeout. Status, body and delay are ignored.",
                "请求不发到服务器，页面会一直等：用来看加载中的样子和前端自己的超时提示。状态码、响应体、延迟这时都不起作用。",
            ),
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
    const enabled = createSwitch(tr("Enable this rule", "启用这条规则"), (on) => update({ on }));

    const method = el("select", "nri-field");
    method.title = tr("Request method", "请求方法");
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
    match.placeholder = tr(
        "Part of the URL, e.g. /api/transfers; start with re: for a regex",
        "URL 里包含的一段，如 /api/transfers；以 re: 开头按正则匹配",
    );
    match.title = match.placeholder;
    match.setAttribute("aria-label", tr("URL match", "URL 匹配"));
    match.addEventListener("input", () => update({ match: match.value }));

    // 和详情区右上角的关闭按钮同一个样式
    const remove = button("nri-close-btn", "", tr("Delete this rule", "删除这条规则"), () => removeMockRule(rule.id));
    remove.innerHTML = kXmarkSvg;
    remove.setAttribute("aria-label", remove.title);
    keepFocusOnPress(remove);

    const head = el("div", "nri-rule-row");
    head.append(enabled.el, method, match, remove);

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
    const status = numberField("status", tr("HTTP status, 200–599; 0 = network error", "HTTP 状态码，200–599；0 = 网络错误"));
    const delay = numberField("delay", tr("Wait this many milliseconds before responding", "等多少毫秒再返回"));
    const times = numberField(
        "times",
        tr(
            "Apply at most this many times, then let requests through; 0 = no limit",
            "最多命中几次，之后放行；0 = 不限",
        ),
    );

    const mode = createSegments(tr("Mode", "模式"), modeOptions(), (value) => update({ mode: value }, true));

    const hits = el("span", "nri-rule-hits");
    const resetHits = button("nri-text-btn", tr("Reset", "清零"), tr("Set the hit count back to 0", "命中次数清零"), () =>
        update({ hits: 0 }),
    );

    // 默认面板只有 440px 宽，分两行固定排布，免得随宽度折得七零八落
    const settings = el("div", "nri-rule-row");
    settings.append(el("span", "nri-rule-label", tr("Respond", "返回")), status, mode.el, hits, resetHits);
    const timing = el("div", "nri-rule-row");
    timing.append(
        el("span", "nri-rule-label", tr("Delay", "延迟")),
        delay,
        el("span", "nri-rule-label", "ms"),
        el("span", "nri-rule-label", tr("Max hits", "最多命中")),
        times,
        el("span", "nri-rule-label", tr("(0 = no limit)", "次（0 = 不限）")),
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
    presets.append(el("span", "nri-rule-label", tr("Presets", "预设")));
    for (const preset of getMockPresets()) {
        presets.append(button("nri-type-chip", preset.label, preset.title, () => applyChange(applyPreset(rule, preset))));
    }
    presets.append(
        button(
            "nri-text-btn",
            tr("↺ Reset", "↺ 复原"),
            tr(
                "Back to the captured response: restore status and body, block mode, no delay",
                "回到真实返回：状态码和响应体恢复，模式回到拦截，延迟清零",
            ),
            () => applyChange(resetRule(rule, options.findRealResponse(rule))),
        ),
    );

    // ---- 响应体编辑框 ----
    const body = el("textarea", "nri-field nri-rule-body");
    body.spellcheck = false;
    body.placeholder = tr("Response body", "返回的响应体");
    body.setAttribute("aria-label", tr("Response body", "响应体"));

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
        tr("Auto-fix", "自动修复"),
        tr(
            "Add missing quotes, commas and brackets, drop stray commas, then re-indent. Can be undone",
            "补上缺的引号、逗号、括号，去掉多余的逗号，再重新排版。可以撤销",
        ),
        formatBody,
    );
    function checkBody(): void {
        const message = jsonError(rule.body);
        errorLine.hidden = message === "";
        errorLine.replaceChildren(
            ...(message === ""
                ? []
                : [
                      tr(
                          `The body is not valid JSON, so the page will fail to parse it: ${message}`,
                          `响应体不是合法的 JSON，页面拿到后会解析失败：${message}`,
                      ),
                      autoFix,
                  ]),
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
            showToast("info", tr("Already formatted", "已经是排好版的了"), 1500);
            return;
        }
        const previous = rule.body;
        setBody(result.text);
        fixNote.replaceChildren(
            result.fixed === undefined
                ? tr("Re-indented.", "已重新排版。")
                : tr(
                      `Fixed ${result.fixed}. Check that the result is what you meant.`,
                      `已自动修复：${result.fixed}。请确认内容是你要的。`,
                  ),
            button("nri-text-btn", tr("Undo", "撤销"), tr("Put the body back the way it was", "恢复成修改前的样子"), () => {
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
        "nri-text-btn",
        tr("Format", "格式化"),
        tr(
            "Re-indent the JSON; broken JSON (missing quotes, commas, brackets) is repaired first",
            "把 JSON 重新排版；写坏了的（少引号、逗号、括号）会先试着修好",
        ),
        formatBody,
    );
    const bodyHead = el("div", "nri-rule-bodyhead");
    bodyHead.append(el("span", "nri-rule-label", tr("Response body", "响应体")), format);

    card.append(head, settings, timing, presets, bodyHead, body, errorLine, fixNote, note);

    function setValue(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): void {
        if ((forceSync || document.activeElement !== field) && field.value !== value) {
            field.value = value;
        }
    }

    function sync(next: TMockRule): void {
        const bodyChanged = next.body !== body.value;
        rule = next;
        card.classList.toggle("nri-rule-off", !rule.on);
        enabled.set(rule.on);
        setValue(method, rule.method);
        setValue(match, rule.match);
        setValue(status, String(rule.status));
        mode.set(rule.mode);
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
    const addBtn = button("nri-push-btn", tr("+ New Rule", "+ 新增规则"), tr("Add an empty rule", "新增一条空规则"), () => {
        const rule = addMockRule({});
        reveal(rule.id);
        cards.get(rule.id)?.el.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    });

    const pauseTitle = tr("Turn every rule off for now; the rules themselves are kept", "所有规则临时失效，规则本身保留");
    const pause = createSwitch(pauseTitle, (on) => setMockPaused(on));
    const pauseLabel = el("span", "nri-rules-pause");
    const pauseText = el("span", undefined, tr("Pause All", "全部暂停"));
    pauseText.title = pauseTitle;
    pauseText.addEventListener("click", () => setMockPaused(!isMockPaused()));
    pauseLabel.append(pauseText, pause.el);

    // 清空的规则找不回来，所以要点两次：第一次只是把按钮变成红色的确认，3 秒不点就恢复原样
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    function disarmClear(): void {
        if (clearTimer !== undefined) {
            clearTimeout(clearTimer);
            clearTimer = undefined;
        }
        clearBtn.textContent = tr("Clear All", "清空");
        clearBtn.classList.remove("nri-danger");
    }
    const clearBtn = button("nri-text-btn", tr("Clear All", "清空"), tr("Delete every rule", "删除全部规则"), () => {
        if (clearTimer === undefined) {
            const count = getMockRules().length;
            clearBtn.textContent = tr(
                `Click again to delete ${count === 1 ? "the rule" : `all ${count} rules`}`,
                `再点一次，删除全部 ${count} 条规则`,
            );
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
        tr(
            "Rule bodies are stored and shown unredacted — the page must receive the real content.",
            "规则里的响应体按原文保存和显示，不脱敏——页面要拿到的就是原文。",
        ),
    );

    const list = el("div", "nri-rules-list");
    const empty = el(
        "div",
        "nri-rules-empty",
        tr(
            "No rules yet. Select a request and choose Mock, or add a rule by hand.",
            "还没有规则。在请求列表里选中一个请求点魔杖按钮，或者手动新增。",
        ),
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
        pause.set(paused);
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
    const unsubscribe = subscribeMock(render);

    return {
        el: view,
        dispose: unsubscribe,
        reveal,
        focus: () => {
            addBtn.focus({ preventScroll: true });
        },
    };
}
