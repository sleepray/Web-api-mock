import { describe, expect, it } from "vitest";

import { placeTooltip } from "./tooltip";

const kViewport = { viewportWidth: 800, viewportHeight: 600 };

describe("placeTooltip", () => {
    // Below the pointer rather than the target, so it never covers what the
    // pointer rests on, and lined up with the target like a native tooltip
    it("places the tooltip below the pointer at the target's left edge", () => {
        expect(
            placeTooltip({ pointerY: 100, targetLeft: 200, width: 120, height: 20, ...kViewport }),
        ).toEqual({ top: 112, left: 200 });
    });

    // Near the bottom of the window, such as the panel's toggle, the
    // tooltip goes above the pointer instead of being cut off
    it("flips above the pointer when it does not fit below", () => {
        expect(
            placeTooltip({ pointerY: 580, targetLeft: 200, width: 120, height: 20, ...kViewport }),
        ).toEqual({ top: 548, left: 200 });
    });

    // The panel sits at the right edge, so a long URL tooltip would run off
    it("keeps the tooltip inside the viewport horizontally", () => {
        expect(
            placeTooltip({ pointerY: 100, targetLeft: 700, width: 300, height: 20, ...kViewport }),
        ).toEqual({ top: 112, left: 496 });
        expect(
            placeTooltip({ pointerY: 100, targetLeft: -50, width: 120, height: 20, ...kViewport }),
        ).toEqual({ top: 112, left: 4 });
    });

    // Wider or taller than the viewport: the start stays visible
    it("never places the tooltip before the viewport's top-left margin", () => {
        expect(
            placeTooltip({ pointerY: 10, targetLeft: 100, width: 1000, height: 590, ...kViewport }),
        ).toEqual({ top: 4, left: 4 });
    });
});
