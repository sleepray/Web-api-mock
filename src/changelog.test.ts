import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { inlineParts, parseChangelog } from "./changelog";

const kChangelog = `# Changelog

Intro paragraph.

## [Unreleased]

### Added

- not released yet

## [0.3.0-beta.2] - 2026-10-11

### Added

- Beta switch
  - nested detail

### Changed

- moved \`install\` URL

### Fixed

## [0.2.0] - 2026-07-30

Paragraph that is not a list.

### Removed

- density switch

[0.2.0]: https://example.com/compare
`;

describe("parseChangelog", () => {
    it("reads released versions with their sections, newest first", () => {
        expect(parseChangelog(kChangelog)).toEqual([
            {
                version: "0.3.0-beta.2",
                date: "2026-10-11",
                sections: [
                    { title: "Added", items: [{ text: "Beta switch", children: ["nested detail"] }] },
                    { title: "Changed", items: [{ text: "moved `install` URL", children: [] }] },
                ],
            },
            {
                version: "0.2.0",
                date: "2026-07-30",
                sections: [{ title: "Removed", items: [{ text: "density switch", children: [] }] }],
            },
        ]);
    });

    // Unreleased notes must never ship as if they were in the running build.
    it("leaves out [Unreleased] and empty sections", () => {
        const entries = parseChangelog(kChangelog);
        expect(entries.map((entry) => entry.version)).not.toContain("Unreleased");
        expect(entries.flatMap((entry) => entry.sections.map((section) => section.title))).not.toContain("Fixed");
    });

    // The build injects the project's own changelog, so it must parse into something useful.
    it("parses this project's CHANGELOG.md", () => {
        const entries = parseChangelog(fs.readFileSync(path.resolve("CHANGELOG.md"), "utf-8"));
        expect(entries.length).toBeGreaterThan(3);
        for (const entry of entries) {
            expect(entry.version).toMatch(/^\d+\.\d+\.\d+/);
            expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(entry.sections.length).toBeGreaterThan(0);
        }
    });
});

describe("inlineParts", () => {
    it("splits code and strong spans and keeps link text only", () => {
        expect(inlineParts("Open **Beta** at `beta/` via [the docs](https://x.y)")).toEqual([
            { kind: "text", text: "Open " },
            { kind: "strong", text: "Beta" },
            { kind: "text", text: " at " },
            { kind: "code", text: "beta/" },
            { kind: "text", text: " via the docs" },
        ]);
    });

    it("keeps unmatched markers as text", () => {
        expect(inlineParts("a ` b ** c")).toEqual([{ kind: "text", text: "a ` b ** c" }]);
    });
});
