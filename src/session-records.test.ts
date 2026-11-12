import { describe, expect, it } from "vitest";

import { kConfig } from "./config";
import { kRedactedValue } from "./redaction";
import { loadSessionRecords, recordsForSession, saveSessionRecords } from "./session-records";
import type { TNetworkRequestRecord } from "./types";

function record(overrides: Partial<TNetworkRequestRecord> = {}): TNetworkRequestRecord {
    return {
        id: "1",
        method: "POST",
        url: "https://a.test/api/login?token=abc&page=1",
        startedAt: 1,
        source: "fetch",
        status: 200,
        requestHeaders: { Authorization: "Bearer secret", Accept: "application/json" },
        requestBody: { user: "u", password: "p" },
        responseHeaders: { "Set-Cookie": "sid=1", "Content-Type": "application/json" },
        responseBody: { token: "real-token", ok: true },
        ...overrides,
    };
}

function memoryStorage(): Storage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
        map,
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => {
            map.set(key, value);
        },
    } as Storage & { map: Map<string, string> };
}

describe("recordsForSession", () => {
    it("redacts the request side and response headers but keeps the response body for mocking", () => {
        const [slim] = recordsForSession([record()]);
        expect(slim.requestHeaders?.Authorization).toBe(kRedactedValue);
        expect(slim.requestHeaders?.Accept).toBe("application/json");
        expect(slim.requestBody).toEqual({ user: "u", password: kRedactedValue });
        expect(slim.url).not.toContain("abc");
        expect(slim.url).toContain("page=1");
        expect(slim.responseHeaders?.["Set-Cookie"]).toBe(kRedactedValue);
        expect(slim.responseBody).toEqual({ token: "real-token", ok: true });
    });

    it("drops requests that were still in flight", () => {
        const pending = record({ id: "p", status: undefined, responseBody: undefined });
        const failed = record({ id: "f", status: undefined, error: "Network error" });
        expect(recordsForSession([pending, failed, record()]).map((item) => item.id)).toEqual(["f", "1"]);
    });

    it("keeps bodies newest-first within the budget and only the request for the rest", () => {
        const big = "x".repeat(100);
        const slim = recordsForSession(
            [
                record({ id: "new", responseBody: big }),
                record({ id: "mid", responseBody: big }),
                record({ id: "old", responseBody: "small" }),
            ],
            150,
        );
        expect(slim.map((item) => item.responseBody)).toEqual([big, undefined, "small"]);
    });

    it("redacts the real response headers of a pass-through mock and keeps its body", () => {
        const [slim] = recordsForSession([
            record({
                mock: {
                    ruleId: "r",
                    mode: "rewrite",
                    real: { status: 201, responseHeaders: { "Set-Cookie": "x" }, responseBody: { real: 1 } },
                },
            }),
        ]);
        expect(slim.mock?.real?.responseHeaders?.["Set-Cookie"]).toBe(kRedactedValue);
        expect(slim.mock?.real?.responseBody).toEqual({ real: 1 });
    });

    it("does not change the records it was given", () => {
        const original = record();
        recordsForSession([original]);
        expect(original.requestHeaders?.Authorization).toBe("Bearer secret");
    });
});

describe("saveSessionRecords / loadSessionRecords", () => {
    it("round-trips and marks the records as restored", () => {
        const storage = memoryStorage();
        saveSessionRecords([record({ id: "a" }), record({ id: "b", restored: true })], storage);
        const loaded = loadSessionRecords(storage);
        expect(loaded.map((item) => [item.id, item.restored])).toEqual([
            ["a", true],
            ["b", true],
        ]);
    });

    it("falls back to the request list only when the full save does not fit", () => {
        const storage = memoryStorage();
        let calls = 0;
        storage.setItem = (key: string, value: string) => {
            calls += 1;
            if (calls === 1) {
                throw new DOMException("quota", "QuotaExceededError");
            }
            storage.map.set(key, value);
        };
        saveSessionRecords([record()], storage);
        const [loaded] = loadSessionRecords(storage);
        expect(loaded.id).toBe("1");
        expect(loaded.responseBody).toBeUndefined();
    });

    it("gives up quietly when nothing fits", () => {
        const storage = memoryStorage();
        storage.setItem = () => {
            throw new DOMException("quota", "QuotaExceededError");
        };
        expect(() => saveSessionRecords([record()], storage)).not.toThrow();
    });

    it("ignores corrupt or foreign data", () => {
        const storage = memoryStorage();
        storage.map.set(kConfig.sessionRecordsStorageKey, "{nope");
        expect(loadSessionRecords(storage)).toEqual([]);
        storage.map.set(kConfig.sessionRecordsStorageKey, JSON.stringify([{ id: 1 }, record({ id: "ok" })]));
        expect(loadSessionRecords(storage).map((item) => item.id)).toEqual(["ok"]);
    });

    it("never restores more than the list holds", () => {
        const storage = memoryStorage();
        const many = Array.from({ length: kConfig.maxEntries + 5 }, (_, index) => record({ id: String(index) }));
        storage.map.set(kConfig.sessionRecordsStorageKey, JSON.stringify(many));
        expect(loadSessionRecords(storage)).toHaveLength(kConfig.maxEntries);
    });
});
