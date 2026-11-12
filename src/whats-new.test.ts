import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TChangelogEntry } from "./changelog";
import { kConfig } from "./config";
import { changelogBetween, takeWhatsNew } from "./whats-new";

function entry(version: string): TChangelogEntry {
    return { version, date: "2026-10-12", sections: [{ title: "Added", items: [{ text: version, children: [] }] }] };
}

const kChangelog = [
    "0.4.0-beta.1",
    "0.3.0",
    "0.3.0-beta.2",
    "0.3.0-beta.1",
    "0.2.0",
    "0.1.0",
].map(entry);

const versions = (entries: readonly TChangelogEntry[]) => entries.map((item) => item.version);

describe("changelogBetween", () => {
    it("lists every version after the seen one up to the running one, across several releases", () => {
        expect(versions(changelogBetween({ changelog: kChangelog, current: "0.3.0-beta.2", since: "0.1.0" }))).toEqual([
            "0.3.0-beta.2",
            "0.3.0-beta.1",
            "0.2.0",
        ]);
    });

    // Never show notes of versions the running build does not contain.
    it("leaves out versions newer than the running one", () => {
        expect(versions(changelogBetween({ changelog: kChangelog, current: "0.3.0" }))).not.toContain("0.4.0-beta.1");
    });

    // A release's notes already summarize its betas; listing both would repeat them.
    it("folds prereleases into their release when the release is listed", () => {
        expect(versions(changelogBetween({ changelog: kChangelog, current: "0.3.0", since: "0.2.0" }))).toEqual(["0.3.0"]);
        expect(versions(changelogBetween({ changelog: kChangelog, current: "0.4.0-beta.1", since: "0.3.0-beta.1" }))).toEqual([
            "0.4.0-beta.1",
            "0.3.0",
        ]);
    });

    it("sorts by version even when the file is out of order", () => {
        const shuffled = [entry("0.2.0"), entry("0.3.0-beta.1"), entry("0.1.0")];
        expect(versions(changelogBetween({ changelog: shuffled, current: "0.3.0-beta.1" }))).toEqual([
            "0.3.0-beta.1",
            "0.2.0",
            "0.1.0",
        ]);
    });
});

describe("takeWhatsNew", () => {
    let gmStore: Map<string, unknown>;

    beforeEach(() => {
        gmStore = new Map();
        vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown) =>
            gmStore.has(key) ? gmStore.get(key) : defaultValue,
        );
        vi.stubGlobal("GM_setValue", (key: string, value: unknown) => gmStore.set(key, value));
        vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // Nothing to compare against on a fresh install; the next update shows notes.
    it("shows nothing on the first run and records the version", () => {
        expect(takeWhatsNew({ changelog: kChangelog, current: "0.3.0" })).toBeUndefined();
        expect(gmStore.get(kConfig.seenVersionStorageKey)).toBe("0.3.0");
    });

    it("shows the notes since the seen version once", () => {
        gmStore.set(kConfig.seenVersionStorageKey, "0.2.0");
        const shown = takeWhatsNew({ changelog: kChangelog, current: "0.3.0-beta.2" });
        expect(shown?.from).toBe("0.2.0");
        expect(versions(shown?.entries ?? [])).toEqual(["0.3.0-beta.2", "0.3.0-beta.1"]);
        expect(takeWhatsNew({ changelog: kChangelog, current: "0.3.0-beta.2" })).toBeUndefined();
    });

    // Switching back from a beta to an older release is not an update.
    it("shows nothing after a downgrade or with an unreadable seen version", () => {
        gmStore.set(kConfig.seenVersionStorageKey, "0.4.0-beta.1");
        expect(takeWhatsNew({ changelog: kChangelog, current: "0.3.0" })).toBeUndefined();
        expect(gmStore.get(kConfig.seenVersionStorageKey)).toBe("0.3.0");

        gmStore.set(kConfig.seenVersionStorageKey, "garbage");
        expect(takeWhatsNew({ changelog: kChangelog, current: "0.3.0" })).toBeUndefined();
    });

    // Notes that cannot be recorded as seen would otherwise reappear on every open.
    it("shows nothing when the seen version cannot be stored", () => {
        gmStore.set(kConfig.seenVersionStorageKey, "0.2.0");
        vi.stubGlobal("GM_setValue", () => {
            throw new Error("denied");
        });
        expect(takeWhatsNew({ changelog: kChangelog, current: "0.3.0" })).toBeUndefined();
    });
});
