import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { kConfig } from "../config";

import {
    addMockRule,
    clearMockRules,
    findCoveringRule,
    findMockRule,
    getMockRules,
    installMockStorageSync,
    isMockPaused,
    recordMockHit,
    reloadMockState,
    removeMockRule,
    replaceMockRule,
    setMockPaused,
    subscribeMock,
} from "./rule-store";

const localStore = new Map<string, string>();
const kKey = kConfig.mockRulesStorageKey;

function stored(): { paused: boolean; rules: { id: string; match: string; hits: number }[] } {
    return JSON.parse(localStore.get(kKey) ?? "null");
}

beforeEach(() => {
    localStore.clear();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => localStore.get(key) ?? null,
        setItem: (key: string, value: string) => localStore.set(key, value),
        removeItem: (key: string) => localStore.delete(key),
    });
    reloadMockState();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("rules", () => {
    it("starts empty and unpaused", () => {
        expect(getMockRules()).toEqual([]);
        expect(isMockPaused()).toBe(false);
    });

    it("adds, replaces and removes rules, persisting every change", () => {
        const rule = addMockRule({ match: "/api/a", status: 503 });
        expect(stored().rules.map((item) => item.match)).toEqual(["/api/a"]);

        replaceMockRule({ ...rule, match: "/api/b" });
        expect(getMockRules().at(0)?.match).toBe("/api/b");
        expect(stored().rules.at(0)?.match).toBe("/api/b");

        removeMockRule(rule.id);
        expect(getMockRules()).toEqual([]);
        expect(stored().rules).toEqual([]);
    });

    it("ignores a replacement for a rule that no longer exists", () => {
        const rule = addMockRule({ match: "/api/a" });
        removeMockRule(rule.id);
        replaceMockRule({ ...rule, match: "/api/zombie" });
        expect(getMockRules()).toEqual([]);
    });

    it("clears every rule but keeps the paused flag", () => {
        addMockRule({ match: "/a" });
        addMockRule({ match: "/b" });
        setMockPaused(true);
        clearMockRules();
        expect(getMockRules()).toEqual([]);
        expect(isMockPaused()).toBe(true);
    });

    it("survives a reload from storage", () => {
        addMockRule({ match: "/api/a", method: "POST", times: 2 });
        setMockPaused(true);
        reloadMockState();
        expect(getMockRules().at(0)).toMatchObject({ match: "/api/a", method: "POST", times: 2 });
        expect(isMockPaused()).toBe(true);
    });

    it("keeps working in memory when storage refuses writes", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => null,
            setItem: () => {
                throw new Error("quota");
            },
            removeItem: () => undefined,
        });
        reloadMockState();
        addMockRule({ match: "/api/a" });
        expect(findMockRule("GET", "https://a.test/api/a")).toBeDefined();
    });
});

describe("findMockRule", () => {
    it("finds the rule for a request and counts its hits until the limit is spent", () => {
        const rule = addMockRule({ match: "/api/a", times: 2 });
        expect(findMockRule("GET", "https://a.test/api/a")?.id).toBe(rule.id);
        recordMockHit(rule.id);
        recordMockHit(rule.id);
        expect(stored().rules.at(0)?.hits).toBe(2);
        expect(findMockRule("GET", "https://a.test/api/a")).toBeUndefined();
    });

    it("finds nothing while paused", () => {
        addMockRule({ match: "/api/a" });
        setMockPaused(true);
        expect(findMockRule("GET", "https://a.test/api/a")).toBeUndefined();
    });

    it("treats corrupt storage as no rules instead of throwing into the page's request", () => {
        localStore.set(kKey, "{not json");
        reloadMockState();
        expect(findMockRule("GET", "https://a.test/api/a")).toBeUndefined();
        expect(getMockRules()).toEqual([]);
    });
});

describe("findCoveringRule", () => {
    it("also returns disabled and spent rules, so the same request is not given a second rule", () => {
        const rule = addMockRule({ match: "/api/a", on: false });
        expect(findMockRule("GET", "https://a.test/api/a")).toBeUndefined();
        expect(findCoveringRule("GET", "https://a.test/api/a")?.id).toBe(rule.id);
    });
});

describe("subscribeMock", () => {
    it("notifies on every change until unsubscribed", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeMock(listener);
        const rule = addMockRule({ match: "/a" });
        recordMockHit(rule.id);
        setMockPaused(true);
        expect(listener).toHaveBeenCalledTimes(3);
        unsubscribe();
        clearMockRules();
        expect(listener).toHaveBeenCalledTimes(3);
    });
});

describe("migration from the standalone mock script", () => {
    it("moves rules from the old key and deletes it", () => {
        const [legacyKey] = kConfig.mockLegacyStorageKeys;
        localStore.set(
            legacyKey,
            JSON.stringify({
                paused: true,
                rules: [{ id: "old1", method: "GET", match: "/api/plans", status: 500, body: "{}", hits: 3 }],
                ui: { right: 16, bottom: 16 },
            }),
        );
        reloadMockState();
        expect(getMockRules().at(0)).toMatchObject({ id: "old1", match: "/api/plans", status: 500, hits: 3 });
        expect(isMockPaused()).toBe(true);
        expect(stored().rules.at(0)?.id).toBe("old1");
        expect(localStore.has(legacyKey)).toBe(false);
    });

    it("prefers the newer legacy key and removes both", () => {
        const [newer, older] = kConfig.mockLegacyStorageKeys;
        localStore.set(newer, JSON.stringify({ rules: [{ id: "newer", match: "/n" }] }));
        localStore.set(older, JSON.stringify({ rules: [{ id: "older", match: "/o" }] }));
        reloadMockState();
        expect(getMockRules().map((rule) => rule.id)).toEqual(["newer"]);
        expect(localStore.has(newer)).toBe(false);
        expect(localStore.has(older)).toBe(false);
    });

    it("keeps rules already saved under the new key and still removes the old data", () => {
        const [legacyKey] = kConfig.mockLegacyStorageKeys;
        localStore.set(kKey, JSON.stringify({ paused: false, rules: [{ id: "current", match: "/c" }] }));
        localStore.set(legacyKey, JSON.stringify({ rules: [{ id: "old", match: "/o" }] }));
        reloadMockState();
        expect(getMockRules().map((rule) => rule.id)).toEqual(["current"]);
        expect(localStore.has(legacyKey)).toBe(false);
    });
});

describe("installMockStorageSync", () => {
    it("reloads when another tab changes the rules, and ignores unrelated keys", () => {
        let handler: ((event: { key: string | null }) => void) | undefined;
        installMockStorageSync({
            addEventListener: ((_type: string, listener: (event: { key: string | null }) => void) => {
                handler = listener;
            }) as Window["addEventListener"],
        });
        const listener = vi.fn();
        subscribeMock(listener);

        localStore.set(kKey, JSON.stringify({ paused: false, rules: [{ id: "other-tab", match: "/x" }] }));
        handler?.({ key: "something-else" });
        expect(getMockRules()).toEqual([]);

        handler?.({ key: kKey });
        expect(getMockRules().map((rule) => rule.id)).toEqual(["other-tab"]);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
