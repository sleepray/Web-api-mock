import type { TChangelogEntry } from "./changelog";
import { kConfig } from "./config";
import { compareSemver, parseSemver } from "./semver";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

function isNewer(version: string, than: string): boolean {
    try {
        return compareSemver(version, than) > 0;
    } catch {
        return false;
    }
}

/** "0.3.0" for "0.3.0-beta.2". */
function coreOf(version: string): string | undefined {
    const parsed = parseSemver(version);
    return parsed === null ? undefined : `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

/**
 * The entries after `since` (all when absent) up to and including `current`,
 * newest first. A release's notes already cover its prereleases, so those are
 * left out whenever their release is listed.
 */
export function changelogBetween({
    changelog,
    current,
    since,
}: {
    changelog: readonly TChangelogEntry[];
    current: string;
    since?: string;
}): TChangelogEntry[] {
    const inRange = changelog.filter(
        (entry) =>
            parseSemver(entry.version) !== null &&
            !isNewer(entry.version, current) &&
            (since === undefined || isNewer(entry.version, since)),
    );
    const releases = new Set(
        inRange
            .filter((entry) => parseSemver(entry.version)?.prerelease.length === 0)
            .map((entry) => entry.version),
    );
    return inRange
        .filter((entry) => {
            const core = coreOf(entry.version);
            return core === entry.version || core === undefined || !releases.has(core);
        })
        .sort((left, right) => compareSemver(right.version, left.version));
}

/**
 * Called whenever the panel is shown. Returns the notes since the version the
 * user last saw, once, and records the running version across all sites. A
 * first run (nothing seen yet) or an unchanged version shows nothing.
 */
export function takeWhatsNew({
    changelog,
    current,
}: {
    changelog: readonly TChangelogEntry[];
    current: string;
}): { from: string; entries: TChangelogEntry[] } | undefined {
    let seen: string | null;
    try {
        seen = getGlobalStorageItem(kConfig.seenVersionStorageKey);
    } catch {
        return;
    }
    if (seen === current) {
        return;
    }
    try {
        setGlobalStorageItem(kConfig.seenVersionStorageKey, current);
        // Storage swallows write errors; showing notes it cannot record would repeat them on every open.
        if (getGlobalStorageItem(kConfig.seenVersionStorageKey) !== current) {
            return;
        }
    } catch {
        return;
    }
    if (seen === null || !isNewer(current, seen)) {
        return;
    }
    const entries = changelogBetween({ changelog, current, since: seen });
    return entries.length > 0 ? { from: seen, entries } : undefined;
}
