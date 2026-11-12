import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { kConfig } from "./config";
import {
    claimDailyBetaCheck,
    getUpdateChannel,
    loadIncludeBeta,
    saveIncludeBeta,
} from "./update-channel";

/** GM storage is shared across sites, which is what makes the check daily rather than per site. */
let gmStore: Map<string, unknown>;

beforeEach(() => {
    gmStore = new Map();
    vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown) =>
        gmStore.has(key) ? gmStore.get(key) : defaultValue,
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown) => gmStore.set(key, value));
    vi.stubGlobal("localStorage", {
        getItem: () => null,
        setItem: () => undefined,
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("include beta preference", () => {
    // Betas must be an explicit opt-in: anything else keeps users on releases.
    it("is off by default and for unexpected stored values", () => {
        expect(loadIncludeBeta()).toBe(false);
        for (const value of ["false", "1", "yes", '"true"', false]) {
            gmStore.set(kConfig.includeBetaStorageKey, value);
            expect(loadIncludeBeta()).toBe(false);
        }
    });

    it("round-trips through global storage", () => {
        saveIncludeBeta(true);
        expect(loadIncludeBeta()).toBe(true);
        saveIncludeBeta(false);
        expect(loadIncludeBeta()).toBe(false);
    });

    it("picks the beta channel only when included", () => {
        expect(getUpdateChannel(true)).toBe("beta");
        expect(getUpdateChannel(false)).toBe("latest");
    });
});

describe("claimDailyBetaCheck", () => {
    it("allows one check per local day across all sites", () => {
        const morning = new Date(2026, 9, 11, 8, 0);
        const evening = new Date(2026, 9, 11, 23, 59);
        const nextDay = new Date(2026, 9, 12, 0, 1);

        expect(claimDailyBetaCheck(morning)).toBe(true);
        expect(claimDailyBetaCheck(evening)).toBe(false);
        expect(claimDailyBetaCheck(nextDay)).toBe(true);
        expect(claimDailyBetaCheck(nextDay)).toBe(false);
    });

    // A broken storage must not turn into a request on every page load.
    it("skips the check when storage throws", () => {
        vi.stubGlobal("GM_getValue", () => {
            throw new Error("denied");
        });
        vi.stubGlobal("GM_setValue", () => {
            throw new Error("denied");
        });
        vi.stubGlobal("localStorage", {
            getItem: () => {
                throw new Error("denied");
            },
            setItem: () => {
                throw new Error("denied");
            },
        });
        expect(claimDailyBetaCheck(new Date(2026, 9, 11))).toBe(false);
    });
});
