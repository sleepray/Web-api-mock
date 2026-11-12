import { describe, expect, it } from "vitest";

import type { TNetworkRequestRecord } from "../types";

import { findRealResponse, matchPatternFor, realResponseOf, ruleSeedFromRecord } from "./record-seed";
import { normalizeRule } from "./rules";

const kOrigin = "https://app.test";

function record(overrides: Partial<TNetworkRequestRecord> = {}): TNetworkRequestRecord {
    return {
        id: "1",
        method: "GET",
        url: `${kOrigin}/api/plans?page=1`,
        startedAt: 0,
        source: "fetch",
        status: 200,
        responseBody: { code: "0", items: [1] },
        ...overrides,
    };
}

describe("realResponseOf", () => {
    it("uses the record's own response when no rule touched it", () => {
        expect(realResponseOf(record())).toEqual({
            status: 200,
            body: '{\n  "code": "0",\n  "items": [\n    1\n  ]\n}',
        });
    });

    it("treats an empty body as a real, empty response", () => {
        expect(realResponseOf(record({ status: 204, responseBody: undefined }))).toEqual({ status: 204, body: "" });
    });

    it("keeps non-JSON text as is", () => {
        expect(realResponseOf(record({ responseBody: "<html>" }))?.body).toBe("<html>");
    });

    it("reads the server's response from a pass-through mock", () => {
        const mocked = record({
            status: 500,
            responseBody: { mock: true },
            mock: { ruleId: "r", mode: "rewrite", real: { status: 201, responseBody: { real: true } } },
        });
        expect(realResponseOf(mocked)).toEqual({ status: 201, body: '{\n  "real": true\n}' });
    });

    it("has nothing for blocked, hung, pending, failed or unreadable requests", () => {
        expect(realResponseOf(record({ mock: { ruleId: "r", mode: "block" } }))).toBeUndefined();
        expect(realResponseOf(record({ mock: { ruleId: "r", mode: "hang" } }))).toBeUndefined();
        expect(realResponseOf(record({ status: undefined, responseBody: undefined }))).toBeUndefined();
        expect(realResponseOf(record({ status: undefined, error: "Network error" }))).toBeUndefined();
        expect(realResponseOf(record({ responseBody: "[unreadable response body]" }))).toBeUndefined();
    });
});

describe("matchPatternFor", () => {
    it("uses the path without the query for same-origin requests", () => {
        expect(matchPatternFor(`${kOrigin}/api/plans?page=2`, kOrigin)).toBe("/api/plans");
    });

    it("keeps the origin for cross-origin requests", () => {
        expect(matchPatternFor("https://api.other.test/v1/users?id=1", kOrigin)).toBe(
            "https://api.other.test/v1/users",
        );
    });
});

describe("ruleSeedFromRecord", () => {
    it("carries the real status and body so the rule starts as a copy of the response", () => {
        const source = record({ method: "post" });
        expect(ruleSeedFromRecord({ record: source, records: [source], pageOrigin: kOrigin })).toEqual({
            method: "POST",
            match: "/api/plans",
            status: 200,
            body: '{\n  "code": "0",\n  "items": [\n    1\n  ]\n}',
            orig: { status: 200, body: '{\n  "code": "0",\n  "items": [\n    1\n  ]\n}' },
        });
    });

    it("falls back to the latest real response of the same endpoint when this request was blocked", () => {
        const blocked = record({ id: "2", url: `${kOrigin}/api/plans?page=9`, mock: { ruleId: "r", mode: "block" } });
        const otherEndpoint = record({ id: "3", url: `${kOrigin}/api/users`, responseBody: "users" });
        const earlier = record({ id: "4", status: 201, responseBody: "earlier" });
        const seed = ruleSeedFromRecord({
            record: blocked,
            records: [blocked, otherEndpoint, earlier],
            pageOrigin: kOrigin,
        });
        expect(seed).toMatchObject({ status: 201, body: "earlier", orig: { status: 201, body: "earlier" } });
    });

    it("leaves status and body out when no real response is known, so defaults apply together", () => {
        const failed = record({ status: undefined, responseBody: undefined, error: "Network error" });
        expect(ruleSeedFromRecord({ record: failed, records: [failed], pageOrigin: kOrigin })).toEqual({
            method: "GET",
            match: "/api/plans",
        });
    });
});

describe("findRealResponse", () => {
    it("returns the most recent real response the rule covers", () => {
        const rule = normalizeRule({ method: "GET", match: "/api/plans" });
        const records = [
            record({ id: "a", mock: { ruleId: "r", mode: "block" } }),
            record({ id: "b", method: "POST", responseBody: "post" }),
            record({ id: "c", status: 404, responseBody: "nf" }),
            record({ id: "d", responseBody: "older" }),
        ];
        expect(findRealResponse(records, rule)).toEqual({ status: 404, body: "nf" });
        expect(findRealResponse(records, normalizeRule({ match: "/api/none" }))).toBeUndefined();
    });
});
