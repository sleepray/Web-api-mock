import { describe, expect, it } from "vitest";

import { compareSemver, isPrerelease, parseSemver } from "./semver";

// Ascending precedence, covering SemVer item 11: numeric identifiers compare
// as numbers and rank below alphanumeric ones, more identifiers win on an
// equal prefix, and a release outranks its prereleases.
const ordered = [
    "0.1.9",
    "0.2.0-1",
    "0.2.0-alpha",
    "0.2.0-alpha.1",
    "0.2.0-alpha.beta",
    "0.2.0-beta",
    "0.2.0-beta.1",
    "0.2.0-beta.2",
    "0.2.0-beta.9",
    "0.2.0-beta.10",
    "0.2.0-rc.1",
    "0.2.0",
    "0.2.1-beta.1",
    "0.2.1",
    "0.10.0",
    "1.0.0",
];

describe("parseSemver", () => {
    it("parses core, prerelease, prefix and build metadata", () => {
        expect(parseSemver("0.2.0")).toEqual({ major: 0, minor: 2, patch: 0, prerelease: [] });
        expect(parseSemver("v1.10.3-beta.2")).toEqual({ major: 1, minor: 10, patch: 3, prerelease: ["beta", "2"] });
        expect(parseSemver("0.2.0+071204a")?.prerelease).toEqual([]);
        expect(parseSemver(" 0.2.0-rc.1+build.5 ")?.prerelease).toEqual(["rc", "1"]);
    });

    // The old userscript format carried a commit hash; it must be rejected,
    // since hashes order arbitrarily.
    it.each(["", "0.2", "0.2.0.57", "0.1.0(51c8c29)", "01.2.0", "0.2.0-beta.01", "0.2.0-", "0.2.0-beta..1", "0.2.0+"])(
        "rejects %j",
        (invalid) => {
            expect(parseSemver(invalid)).toBeNull();
        },
    );
});

describe("compareSemver", () => {
    it("follows SemVer precedence for every pair", () => {
        ordered.forEach((left, i) => {
            ordered.forEach((right, j) => {
                expect(compareSemver(left, right), `${left} vs ${right}`).toBe(Math.sign(i - j));
            });
        });
    });

    it("ignores the v prefix and build metadata", () => {
        expect(compareSemver("v0.2.0", "0.2.0")).toBe(0);
        expect(compareSemver("0.2.0+aaa", "0.2.0+bbb")).toBe(0);
        expect(compareSemver("0.2.0-beta.1+zzz", "0.2.0-beta.1")).toBe(0);
    });

    it("throws on invalid input instead of treating it as up to date", () => {
        expect(() => compareSemver("0.1.0(51c8c29)", "0.2.0")).toThrow(/Invalid version/);
    });
});

describe("isPrerelease", () => {
    it("detects prerelease suffixes only", () => {
        expect(isPrerelease("0.2.0-beta.1")).toBe(true);
        expect(isPrerelease("0.2.0+abc")).toBe(false);
        expect(isPrerelease("bogus")).toBe(false);
    });
});
