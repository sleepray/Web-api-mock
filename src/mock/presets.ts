import { statusReason } from "../format";

import type { TMockRule } from "./rules";

/** 规则卡上的一排快捷按钮：一下把规则改成某种常见的异常场景 */
export type TMockPreset = {
    label: string;
    title: string;
    /** 改成这个状态码；≥ 400 时响应体换成对应的报错内容 */
    status?: number;
    delay?: number;
    /** 返回 200，把响应体里的列表清空 */
    empty?: boolean;
    /** 一直不返回 */
    hang?: boolean;
};

const kErrorBodyNote = "the body becomes an error payload";

export const kMockPresets: readonly TMockPreset[] = [
    { label: "500", status: 500, title: `Internal Server Error; ${kErrorBodyNote}` },
    { label: "502", status: 502, title: `Bad Gateway; ${kErrorBodyNote}` },
    { label: "504", status: 504, title: `Gateway Timeout; ${kErrorBodyNote}` },
    { label: "401", status: 401, title: `Unauthorized or session expired; ${kErrorBodyNote}` },
    { label: "403", status: 403, title: `Forbidden; ${kErrorBodyNote}` },
    { label: "Offline", status: 0, title: "Network error: the request never reaches the server" },
    { label: "Slow 3s", delay: 3000, title: "Keep everything else and respond after 3 seconds" },
    {
        label: "Empty list",
        empty: true,
        title: "Respond 200 with the lists in the body emptied (needs the captured response)",
    },
    {
        label: "Never respond",
        hang: true,
        title: "Leave the request pending to check loading states and the page's own timeout",
    },
];

/**
 * 报错时的响应体 `{code, message}`。
 * 原来的响应体里 code 是字符串（比如 "0"）就也给字符串：前端按原来的类型读，不会因为类型变了走到别的分支。
 */
export function errorBody(current: string, status: number): string {
    let codeIsString = false;
    try {
        const parsed: unknown = JSON.parse(current);
        codeIsString =
            typeof parsed === "object" &&
            parsed !== null &&
            typeof (parsed as { code?: unknown }).code === "string";
    } catch {
        // 原来的不是 JSON，用数字 code
    }
    const reason = statusReason(status);
    return JSON.stringify(
        {
            code: codeIsString ? String(status) : status,
            message: `${reason === "" ? "Error" : reason} (mock)`,
        },
        null,
        2,
    );
}

const kTotalKeyPattern = /^(total|count|totalCount|totalElements|totalPages)$/i;

/**
 * 把响应体里的列表清空：本身是数组就变成 `[]`；是对象就把两层以内值为数组的字段清空，
 * 同层的 total / count 一类的数字归零。一个数组都没找到时不返回内容。
 */
export function emptyLists(text: string): string | undefined {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return;
    }
    if (Array.isArray(parsed)) {
        return "[]";
    }
    if (typeof parsed !== "object" || parsed === null) {
        return;
    }
    let found = 0;
    function walk(node: Record<string, unknown>, depth: number): void {
        for (const key of Object.keys(node)) {
            const value = node[key];
            if (Array.isArray(value)) {
                node[key] = [];
                found += 1;
            } else if (typeof value === "object" && value !== null) {
                if (depth < 2) {
                    walk(value as Record<string, unknown>, depth + 1);
                }
            } else if (typeof value === "number" && kTotalKeyPattern.test(key)) {
                node[key] = 0;
            }
        }
    }
    walk(parsed as Record<string, unknown>, 1);
    return found > 0 ? JSON.stringify(parsed, null, 2) : undefined;
}

export type TRuleChange = { rule: TMockRule } | { error: string };

/** 套用预设，返回改好的新规则；套不上（比如响应体里没有列表）时返回原因 */
export function applyPreset(rule: TMockRule, preset: TMockPreset): TRuleChange {
    if (preset.hang === true) {
        return { rule: { ...rule, mode: "hang" } };
    }
    const next: TMockRule = { ...rule };
    if (preset.empty === true) {
        const emptied = emptyLists(rule.body);
        if (emptied === undefined) {
            return {
                error: "No list found in the response body. Create the rule from a captured request, then use Empty list.",
            };
        }
        next.status = 200;
        next.body = emptied;
    }
    // 其它预设都要有返回，先从挂起里出来
    if (next.mode === "hang") {
        next.mode = "block";
    }
    if (preset.status !== undefined) {
        next.status = preset.status;
        if (preset.status >= 400) {
            next.body = errorBody(rule.body, preset.status);
        }
    }
    if (preset.delay !== undefined) {
        next.delay = preset.delay;
    }
    return { rule: next };
}

/**
 * 点过几个预设、又手改过之后，一步回到真实返回。只动预设会动的那几项，匹配条件和命中次数不碰。
 * 规则自己没存原返回时用 `fallback`（最近抓到的这个接口的真实返回），并把它记进规则。
 */
export function resetRule(
    rule: TMockRule,
    fallback?: { status: number; body: string },
): TRuleChange {
    const orig = rule.orig ?? fallback;
    if (orig === undefined) {
        return {
            error: "No original response for this request yet. Disable the rule, let the page make the real request once, then reset.",
        };
    }
    return {
        rule: { ...rule, status: orig.status, body: orig.body, mode: "block", delay: 0, orig },
    };
}
