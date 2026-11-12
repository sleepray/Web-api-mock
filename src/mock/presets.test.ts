import { describe, expect, it } from "vitest";

import { applyPreset, emptyLists, errorBody, getMockPresets, resetRule, type TMockPreset } from "./presets";
import { normalizeRule } from "./rules";

function preset(label: string): TMockPreset {
    const found = getMockPresets().find((item) => item.label === label);
    if (found === undefined) {
        throw new Error(`No preset ${label}`);
    }
    return found;
}

const kListBody = JSON.stringify({ code: "0", data: { items: [1, 2], total: 2, page: 1 }, tags: ["a"] });

describe("errorBody", () => {
    it("uses a numeric code by default", () => {
        expect(JSON.parse(errorBody("not json", 500))).toEqual({
            code: 500,
            message: "Internal Server Error (mock)",
        });
    });

    it("keeps code a string when the original response used a string code", () => {
        expect(JSON.parse(errorBody('{"code":"0","data":{}}', 401))).toEqual({
            code: "401",
            message: "Unauthorized (mock)",
        });
    });

    it("falls back to a generic message for a status without a reason phrase", () => {
        expect(JSON.parse(errorBody("{}", 599)).message).toBe("Error (mock)");
    });
});

describe("emptyLists", () => {
    it("empties a top-level array", () => {
        expect(emptyLists("[1,2,3]")).toBe("[]");
    });

    it("empties arrays up to two levels deep and zeroes sibling totals", () => {
        expect(JSON.parse(emptyLists(kListBody) ?? "")).toEqual({
            code: "0",
            data: { items: [], total: 0, page: 1 },
            tags: [],
        });
    });

    it("leaves arrays deeper than two levels alone", () => {
        const body = JSON.stringify({ a: { b: { c: [1] } }, list: [1] });
        expect(JSON.parse(emptyLists(body) ?? "")).toEqual({ a: { b: { c: [1] } }, list: [] });
    });

    it("reports nothing to empty when the body has no list or is not JSON", () => {
        expect(emptyLists('{"a":1}')).toBeUndefined();
        expect(emptyLists("plain")).toBeUndefined();
        expect(emptyLists('"text"')).toBeUndefined();
    });
});

describe("applyPreset", () => {
    const base = normalizeRule({ id: "r", match: "/api", status: 200, body: kListBody, delay: 0 });

    it("sets an error status and replaces the body with an error payload", () => {
        const result = applyPreset(base, preset("500"));
        expect("rule" in result && result.rule.status).toBe(500);
        expect("rule" in result && JSON.parse(result.rule.body).code).toBe("500");
    });

    it("turns the rule into a network error without touching the body", () => {
        const result = applyPreset(base, preset("Offline"));
        expect("rule" in result && result.rule).toMatchObject({ status: 0, body: kListBody });
    });

    it("only adds a delay for the slow preset", () => {
        const result = applyPreset(base, preset("Slow 3s"));
        expect("rule" in result && result.rule).toMatchObject({ status: 200, body: kListBody, delay: 3000 });
    });

    it("empties the lists and responds 200", () => {
        const failing = { ...base, status: 500 };
        const result = applyPreset(failing, preset("Empty list"));
        expect("rule" in result && result.rule.status).toBe(200);
        expect("rule" in result && JSON.parse(result.rule.body).data.items).toEqual([]);
    });

    it("refuses Empty list when the body has no list, leaving the rule as it was", () => {
        const result = applyPreset({ ...base, body: '{"a":1}' }, preset("Empty list"));
        expect("error" in result).toBe(true);
    });

    it("switches to hang, and any other preset leaves hang again", () => {
        const hung = applyPreset(base, preset("Never respond"));
        expect("rule" in hung && hung.rule.mode).toBe("hang");
        const back = applyPreset({ ...base, mode: "hang" }, preset("502"));
        expect("rule" in back && back.rule.mode).toBe("block");
    });

    it("does not mutate the rule it was given", () => {
        applyPreset(base, preset("500"));
        expect(base.status).toBe(200);
    });
});

describe("resetRule", () => {
    it("restores the captured response and clears mode and delay", () => {
        const rule = normalizeRule({
            status: 500,
            body: "changed",
            mode: "hang",
            delay: 3000,
            hits: 4,
            match: "/api",
            orig: { status: 200, body: "real" },
        });
        const result = resetRule(rule);
        expect("rule" in result && result.rule).toMatchObject({
            status: 200,
            body: "real",
            mode: "block",
            delay: 0,
            hits: 4,
            match: "/api",
        });
    });

    it("adopts a fallback response for a hand-made rule and remembers it", () => {
        const result = resetRule(normalizeRule({ status: 500 }), { status: 404, body: "nf" });
        expect("rule" in result && result.rule).toMatchObject({
            status: 404,
            body: "nf",
            orig: { status: 404, body: "nf" },
        });
    });

    it("explains why it cannot reset when no real response is known", () => {
        expect("error" in resetRule(normalizeRule({}))).toBe(true);
    });
});
