import { describe, expect, it } from "vitest";

import {
    extendSelection,
    kEmptySelection,
    pruneSelection,
    selectAll,
    selectOnly,
    toggleSelection,
    type TListSelection,
} from "./list-selection";

const order = ["a", "b", "c", "d", "e"];

function idsOf(selection: TListSelection): string[] {
    return Array.from(selection.ids).sort();
}

describe("selectOnly", () => {
    it("selects a single row", () => {
        expect(idsOf(selectOnly("b"))).toEqual(["b"]);
        expect(selectOnly("b").focusId).toBe("b");
        expect(selectOnly(undefined)).toBe(kEmptySelection);
    });
});

describe("toggleSelection", () => {
    it("adds and removes rows like ⌘-click and moves focus accordingly", () => {
        let selection = toggleSelection(selectOnly("a"), "c");
        expect(idsOf(selection)).toEqual(["a", "c"]);
        expect(selection.focusId).toBe("c");

        selection = toggleSelection(selection, "c");
        expect(idsOf(selection)).toEqual(["a"]);
        expect(selection.focusId).toBe("a");

        selection = toggleSelection(selection, "a");
        expect(selection.ids.size).toBe(0);
        expect(selection.focusId).toBeUndefined();
    });
});

describe("extendSelection", () => {
    it("selects the range from the anchor and shrinks it when reversing", () => {
        let selection = extendSelection(order, selectOnly("b"), "d");
        expect(idsOf(selection)).toEqual(["b", "c", "d"]);
        expect(selection.focusId).toBe("d");
        expect(selection.anchorId).toBe("b");

        // The anchor stays put, so extending past it flips the range.
        selection = extendSelection(order, selection, "a");
        expect(idsOf(selection)).toEqual(["a", "b"]);
        expect(extendSelection(order, selection, undefined)).toBe(selection);
    });

    it("starts from the target when there is no usable anchor", () => {
        expect(idsOf(extendSelection(order, kEmptySelection, "c"))).toEqual(["c"]);
        expect(idsOf(extendSelection(order, selectOnly("gone"), "c"))).toEqual(["c"]);
    });
});

describe("selectAll", () => {
    it("selects every visible row and keeps or sets the focus", () => {
        const selection = selectAll(order, selectOnly("c"));
        expect(idsOf(selection)).toEqual(order);
        expect(selection.focusId).toBe("c");
        expect(selectAll(order, kEmptySelection).focusId).toBe("a");
        expect(selectAll([], selectOnly("a"))).toBe(kEmptySelection);
    });
});

describe("pruneSelection", () => {
    it("drops rows that left the list and repairs focus and anchor", () => {
        const selection = extendSelection(order, selectOnly("b"), "d");
        expect(pruneSelection(order, selection)).toBe(selection);

        let pruned = pruneSelection(["a", "b", "c"], selection);
        expect(idsOf(pruned)).toEqual(["b", "c"]);
        expect(pruned.focusId).toBe("c");
        expect(pruned.anchorId).toBe("b");

        pruned = pruneSelection(["c", "d"], selection);
        expect(idsOf(pruned)).toEqual(["c", "d"]);
        expect(pruned.focusId).toBe("d");
        expect(pruned.anchorId).toBe("d");

        expect(pruneSelection([], selection)).toBe(kEmptySelection);
    });
});
