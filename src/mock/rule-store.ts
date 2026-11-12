import { kConfig } from "../config";

import { normalizeRule, pickRule, ruleCovers, type TMockRule } from "./rules";

/**
 * 这个网站的 mock 规则。存在 localStorage：按站点隔离，刷新后仍在，同源的其它标签页也看得到。
 * 拦截层每个请求都要查一次规则，所以读一次后放在内存里，改动时再写回去。
 */

type TMockState = { paused: boolean; rules: TMockRule[] };

let state: TMockState | undefined;
const listeners = new Set<() => void>();

function readItem(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function parseState(raw: string | null): TMockState | undefined {
    if (raw === null) {
        return;
    }
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) {
            return;
        }
        const { paused, rules } = parsed as { paused?: unknown; rules?: unknown };
        return { paused: paused === true, rules: Array.isArray(rules) ? rules.map(normalizeRule) : [] };
    } catch {
        return;
    }
}

/**
 * 旧版独立 mock 脚本把规则存在别的键下。新键还没有数据时把旧的搬过来；旧键一律删掉，
 * 免得卸载旧脚本后留下没人管的数据。
 */
function migrateLegacy(): TMockState | undefined {
    let migrated: TMockState | undefined;
    for (const key of kConfig.mockLegacyStorageKeys) {
        const legacy = parseState(readItem(key));
        if (legacy === undefined) {
            continue;
        }
        migrated ??= legacy;
        try {
            localStorage.removeItem(key);
        } catch {
            // 删不掉就留着，下次还会再试
        }
    }
    return migrated;
}

function load(): TMockState {
    const current = parseState(readItem(kConfig.mockRulesStorageKey));
    const legacy = migrateLegacy();
    const loaded = current ?? legacy ?? { paused: false, rules: [] };
    if (current === undefined && legacy !== undefined) {
        persist(loaded);
    }
    return loaded;
}

function persist(next: TMockState): void {
    try {
        localStorage.setItem(kConfig.mockRulesStorageKey, JSON.stringify(next));
    } catch {
        // 隐私模式 / 配额满：这次会话内规则仍然生效，只是刷新后没了
    }
}

function current(): TMockState {
    state ??= load();
    return state;
}

function commit(next: TMockState): void {
    state = next;
    persist(next);
    for (const listener of listeners) {
        listener();
    }
}

export function getMockRules(): readonly TMockRule[] {
    return current().rules;
}

export function isMockPaused(): boolean {
    return current().paused;
}

/** 规则或暂停状态变了就通知；不带参数，要什么自己读 */
export function subscribeMock(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function setMockPaused(paused: boolean): void {
    commit({ ...current(), paused });
}

/** 新规则加在最后；`seed` 里没给的字段用默认值 */
export function addMockRule(seed: Partial<TMockRule> = {}): TMockRule {
    const rule = normalizeRule(seed);
    commit({ ...current(), rules: [...current().rules, rule] });
    return rule;
}

/** 用 `next` 换掉同 id 的规则；找不到就什么都不做 */
export function replaceMockRule(next: TMockRule): void {
    const { rules } = current();
    if (!rules.some((rule) => rule.id === next.id)) {
        return;
    }
    commit({ ...current(), rules: rules.map((rule) => (rule.id === next.id ? normalizeRule(next) : rule)) });
}

export function removeMockRule(id: string): void {
    commit({ ...current(), rules: current().rules.filter((rule) => rule.id !== id) });
}

export function clearMockRules(): void {
    commit({ ...current(), rules: [] });
}

/** 拦截层命中规则时调用：命中次数加一。有次数上限的规则靠它「用完」 */
export function recordMockHit(id: string): void {
    const { rules } = current();
    commit({
        ...current(),
        rules: rules.map((rule) => (rule.id === id ? { ...rule, hits: rule.hits + 1 } : rule)),
    });
}

/** 这次请求该用哪条规则。拦截层的热路径：任何异常都当作没有规则，不能影响页面的请求 */
export function findMockRule(method: string, url: string): TMockRule | undefined {
    try {
        const { rules, paused } = current();
        if (paused || rules.length === 0) {
            return;
        }
        return pickRule({ rules, paused, method, url });
    } catch {
        return;
    }
}

/** 管得到这个请求的第一条规则，不论是否启用、是否用完。界面用它判断「已经有规则了」 */
export function findCoveringRule(method: string, url: string): TMockRule | undefined {
    return current().rules.find((rule) => ruleCovers(rule, method, url));
}

/** 从 localStorage 重新读一遍。别的标签页改了规则时用 */
export function reloadMockState(): void {
    state = load();
    for (const listener of listeners) {
        listener();
    }
}

/** 同源的其它标签页改了规则，这边跟着生效 */
export function installMockStorageSync(target: Pick<Window, "addEventListener"> = window): void {
    target.addEventListener("storage", (event) => {
        if (event.key === kConfig.mockRulesStorageKey) {
            reloadMockState();
        }
    });
}
