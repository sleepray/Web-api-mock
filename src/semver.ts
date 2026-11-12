/** SemVer 2.0 parsing and precedence (spec item 11) for update checks. */

export type TSemver = {
    major: number;
    minor: number;
    patch: number;
    /** Prerelease identifiers split on "."; empty for releases. */
    prerelease: string[];
};

// Numeric identifiers have no leading zeros; build metadata is validated but ignored.
const kSemverPattern =
    /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const kNumericIdentifier = /^\d+$/;

/** Parses a version with an optional "v" prefix; returns null when invalid. */
export function parseSemver(raw: string): TSemver | null {
    const match = kSemverPattern.exec(raw.trim());
    if (match === null) {
        return null;
    }
    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        prerelease: match[4] === undefined ? [] : match[4].split("."),
    };
}

export function isPrerelease(raw: string): boolean {
    const version = parseSemver(raw);
    return version !== null && version.prerelease.length > 0;
}

function compareIdentifiers(left: string, right: string): number {
    const leftNumeric = kNumericIdentifier.test(left);
    const rightNumeric = kNumericIdentifier.test(right);
    if (leftNumeric && rightNumeric) {
        return Math.sign(Number(left) - Number(right));
    }
    // Numeric identifiers rank below alphanumeric ones.
    if (leftNumeric !== rightNumeric) {
        return leftNumeric ? -1 : 1;
    }
    if (left === right) {
        return 0;
    }
    return left < right ? -1 : 1;
}

/**
 * Compares by SemVer precedence and returns -1, 0 or 1.
 * Throws on invalid input so callers never treat garbage as up to date.
 */
export function compareSemver(left: string, right: string): number {
    const a = parseSemver(left);
    const b = parseSemver(right);
    if (a === null || b === null) {
        throw new Error(
            `Invalid version: ${JSON.stringify(a === null ? left : right)}`,
        );
    }

    for (const key of ["major", "minor", "patch"] as const) {
        if (a[key] !== b[key]) {
            return a[key] < b[key] ? -1 : 1;
        }
    }

    // A release outranks prereleases of the same core version.
    if (a.prerelease.length === 0 || b.prerelease.length === 0) {
        return Math.sign(b.prerelease.length - a.prerelease.length);
    }

    const length = Math.min(a.prerelease.length, b.prerelease.length);
    for (let index = 0; index < length; index += 1) {
        const result = compareIdentifiers(a.prerelease.at(index) ?? "", b.prerelease.at(index) ?? "");
        if (result !== 0) {
            return result;
        }
    }
    // With an equal prefix, more identifiers rank higher.
    return Math.sign(a.prerelease.length - b.prerelease.length);
}
