import { describe, expect, it } from "vitest";

import {
    countActiveRules,
    effectiveMode,
    isUsedUp,
    isValidMockStatus,
    kDefaultMockBody,
    normalizeRule,
    pickRule,
    ruleCovers,
    urlMatches,
} from "./rules";

describe("normalizeRule", () => {
    it("fills a blank rule with safe defaults", () => {
        const rule = normalizeRule({});
        expect(rule).toMatchObject({
            on: true,
            method: "ANY",
            match: "",
            status: 500,
            body: kDefaultMockBody,
            mode: "block",
            delay: 0,
            times: 0,
            hits: 0,
        });
        expect(rule.id).not.toBe("");
        expect(rule.orig).toBeUndefined();
    });

    it("keeps valid fields and repairs invalid ones", () => {
        const rule = normalizeRule({
            id: "abc",
            on: false,
            method: "post",
            match: "/api/x",
            status: "404",
            body: "{}",
            mode: "rewrite",
            delay: "250",
            times: -3,
            hits: "2",
        });
        expect(rule).toMatchObject({
            id: "abc",
            on: false,
            method: "POST",
            match: "/api/x",
            status: 404,
            mode: "rewrite",
            delay: 250,
            times: 0,
            hits: 2,
        });
    });

    it("accepts status 0 as a network error and rejects out-of-range codes", () => {
        expect(normalizeRule({ status: 0 }).status).toBe(0);
        expect(normalizeRule({ status: 199 }).status).toBe(500);
        expect(normalizeRule({ status: 600 }).status).toBe(500);
        expect(normalizeRule({ status: "abc" }).status).toBe(500);
    });

    it("keeps the captured original response only when it has a body", () => {
        expect(normalizeRule({ orig: { status: 201, body: "x" } }).orig).toEqual({ status: 201, body: "x" });
        expect(normalizeRule({ orig: { status: "bad", body: "x" } }).orig).toEqual({ status: 200, body: "x" });
        expect(normalizeRule({ orig: { status: 200 } }).orig).toBeUndefined();
    });

    it("survives data that is not an object", () => {
        expect(normalizeRule(null).status).toBe(500);
        expect(normalizeRule("junk").method).toBe("ANY");
    });
});

describe("isValidMockStatus", () => {
    it("allows 0 and 200–599", () => {
        expect([0, 200, 204, 404, 599].every(isValidMockStatus)).toBe(true);
        expect([1, 100, 199, 600, -1, Number.NaN, "x"].some(isValidMockStatus)).toBe(false);
    });
});

describe("urlMatches", () => {
    it("matches a substring of the URL", () => {
        expect(urlMatches("/api/plans", "https://a.test/api/plans?page=1")).toBe(true);
        expect(urlMatches("/api/plans", "https://a.test/api/users")).toBe(false);
    });

    it("never matches on an empty pattern, so a blank rule cannot swallow every request", () => {
        expect(urlMatches("", "https://a.test/")).toBe(false);
        expect(urlMatches("   ", "https://a.test/")).toBe(false);
    });

    it("treats re: as a regular expression and an invalid one as no match", () => {
        expect(urlMatches("re:/users/\\d+$", "https://a.test/users/42")).toBe(true);
        expect(urlMatches("re:/users/\\d+$", "https://a.test/users/me")).toBe(false);
        expect(urlMatches("re:([", "https://a.test/")).toBe(false);
    });
});

describe("pickRule", () => {
    const rules = [
        normalizeRule({ id: "off", on: false, match: "/api" }),
        normalizeRule({ id: "spent", match: "/api", times: 1, hits: 1 }),
        normalizeRule({ id: "post", method: "POST", match: "/api" }),
        normalizeRule({ id: "any", match: "/api" }),
    ];

    it("returns the first enabled, unspent rule that matches method and URL", () => {
        expect(pickRule({ rules, paused: false, method: "POST", url: "https://a.test/api" })?.id).toBe("post");
        expect(pickRule({ rules, paused: false, method: "get", url: "https://a.test/api" })?.id).toBe("any");
    });

    it("returns nothing while paused or when no rule matches", () => {
        expect(pickRule({ rules, paused: true, method: "GET", url: "https://a.test/api" })).toBeUndefined();
        expect(pickRule({ rules, paused: false, method: "GET", url: "https://a.test/other" })).toBeUndefined();
    });
});

describe("ruleCovers", () => {
    it("ignores whether the rule is enabled or spent", () => {
        const rule = normalizeRule({ on: false, method: "GET", match: "/api", times: 1, hits: 5 });
        expect(ruleCovers(rule, "get", "https://a.test/api")).toBe(true);
        expect(ruleCovers(rule, "POST", "https://a.test/api")).toBe(false);
    });
});

describe("countActiveRules", () => {
    it("counts enabled rules that can still fire", () => {
        const rules = [
            normalizeRule({ match: "/a" }),
            normalizeRule({ match: "/b", on: false }),
            normalizeRule({ match: "" }),
            normalizeRule({ match: "/c", times: 2, hits: 2 }),
            normalizeRule({ match: "/d", times: 2, hits: 1 }),
        ];
        expect(countActiveRules(rules, false)).toBe(2);
        expect(countActiveRules(rules, true)).toBe(0);
    });
});

describe("isUsedUp / effectiveMode", () => {
    it("is spent only when a hit limit is set and reached", () => {
        expect(isUsedUp(normalizeRule({ times: 0, hits: 99 }))).toBe(false);
        expect(isUsedUp(normalizeRule({ times: 2, hits: 1 }))).toBe(false);
        expect(isUsedUp(normalizeRule({ times: 2, hits: 2 }))).toBe(true);
    });

    it("treats rewrite with a network error as block: there is no response to rewrite", () => {
        expect(effectiveMode(normalizeRule({ mode: "rewrite", status: 0 }))).toBe("block");
        expect(effectiveMode(normalizeRule({ mode: "rewrite", status: 500 }))).toBe("rewrite");
        expect(effectiveMode(normalizeRule({ mode: "hang", status: 0 }))).toBe("hang");
    });
});
