import { describe, expect, it } from "vitest";

import { moveSelection } from "./list-navigation";

const ids = ["a", "b", "c"];

describe("moveSelection", () => {
    it("moves with arrow keys and stops at the ends instead of wrapping", () => {
        expect(moveSelection(ids, undefined, "next")).toBe("a");
        expect(moveSelection(ids, undefined, "previous")).toBe("c");
        expect(moveSelection(ids, "a", "next")).toBe("b");
        expect(moveSelection(ids, "c", "next")).toBe("c");
        expect(moveSelection(ids, "a", "previous")).toBe("a");
    });

    it("jumps with Home/End and recovers from a stale selection", () => {
        expect(moveSelection(ids, "b", "first")).toBe("a");
        expect(moveSelection(ids, "b", "last")).toBe("c");
        expect(moveSelection(ids, "gone", "next")).toBe("a");
        expect(moveSelection([], "a", "next")).toBeUndefined();
    });
});
