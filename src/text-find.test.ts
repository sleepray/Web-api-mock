import { describe, expect, it } from "vitest";

import { createFindPattern, matchSpans } from "./text-find";

function spans(text: string, query: string): [number, number][] {
    const pattern = createFindPattern(query);
    if (pattern === undefined) {
        throw new Error("expected a pattern");
    }
    return matchSpans(text, pattern);
}

describe("createFindPattern", () => {
    it("has no pattern for an empty query, so nothing is highlighted", () => {
        expect(createFindPattern("")).toBeUndefined();
    });

    it("matches the query literally, since bodies are full of regex characters", () => {
        expect(spans('{"a":[1]} a.b (x)', "[1]")).toEqual([[5, 8]]);
        expect(spans("a.b axb", "a.b")).toEqual([[0, 3]]);
        expect(spans("f(x) f(x)", "(x)")).toEqual([
            [1, 4],
            [6, 9],
        ]);
        expect(spans("\\d 1", "\\d")).toEqual([[0, 2]]);
    });

    it("ignores case, like the browser's find", () => {
        expect(spans("SGD sgd Sgd", "sgd")).toEqual([
            [0, 3],
            [4, 7],
            [8, 11],
        ]);
    });
});

describe("matchSpans", () => {
    it("finds non-overlapping matches", () => {
        expect(spans("aaaa", "aa")).toEqual([
            [0, 2],
            [2, 4],
        ]);
    });

    it("leaves the pattern reusable", () => {
        const pattern = createFindPattern("a");
        if (pattern === undefined) {
            throw new Error("expected a pattern");
        }
        expect(matchSpans("a a", pattern)).toHaveLength(2);
        expect(matchSpans("a a", pattern)).toHaveLength(2);
    });
});
