import { describe, expect, it } from "vitest";

import { findJsonLineMatches } from "./json-tree";
import { createFindPattern } from "./text-find";

function find(value: unknown, query: string, limit = 100) {
    const pattern = createFindPattern(query);
    if (pattern === undefined) {
        throw new Error("expected a pattern");
    }
    return findJsonLineMatches(value, pattern, limit);
}

describe("findJsonLineMatches", () => {
    it("searches lines as the tree renders them: quoted keys and strings, separators", () => {
        const value = { currency: "SGD", amount: 1 };
        // A query spanning a key and its value matches, as it reads on screen
        expect(find(value, '"currency": "SGD",')).toEqual([
            { path: [0], part: "line", occurrence: 0 },
        ]);
        // The last entry has no trailing comma
        expect(find(value, '"amount": 1,')).toEqual([]);
        expect(find(value, '"amount": 1')).toEqual([
            { path: [1], part: "line", occurrence: 0 },
        ]);
    });

    it("finds lines nested deeper than the tree expands, in display order", () => {
        const value = {
            data: { items: [{ bank: { name: "ICBC" } }] },
            note: "icbc",
        };
        expect(find(value, "icbc")).toEqual([
            { path: [0, 0, 0, 0, 0], part: "line", occurrence: 0 },
            { path: [1], part: "line", occurrence: 0 },
        ]);
    });

    it("finds entries of large arrays beyond the first rendered chunk", () => {
        const value = Array.from({ length: 450 }, (_, index) =>
            index === 420 ? "needle" : "hay",
        );
        expect(find(value, "needle")).toEqual([
            { path: [420], part: "line", occurrence: 0 },
        ]);
    });

    it("tells container headers from footers so the right line is revealed", () => {
        const value = { list: [1], empty: {} };
        expect(find(value, "[")).toEqual([
            { path: [0], part: "header", occurrence: 0 },
        ]);
        expect(find(value, "],")).toEqual([
            { path: [0], part: "footer", occurrence: 0 },
        ]);
        // Empty containers render on one line
        expect(find(value, '"empty": {}')).toEqual([
            { path: [1], part: "line", occurrence: 0 },
        ]);
    });

    it("counts every occurrence within a line", () => {
        expect(find({ a: "aaa" }, "a")).toEqual([
            { path: [0], part: "line", occurrence: 0 },
            { path: [0], part: "line", occurrence: 1 },
            { path: [0], part: "line", occurrence: 2 },
            { path: [0], part: "line", occurrence: 3 },
        ]);
    });

    it("does not search collapsed summaries such as “3 keys”", () => {
        expect(find({ a: { b: 1, c: 2 } }, "keys")).toEqual([]);
    });

    it("stops at the limit", () => {
        expect(find(["x", "x", "x", "xx"], "x", 4)).toHaveLength(4);
        expect(find({ a: "xxxxx" }, "x", 2)).toHaveLength(2);
    });
});
