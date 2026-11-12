/**
 * CHANGELOG.md parsing. The build injects the parsed entries (see
 * tsdown.dev.config.mts), so this module stays free of imports and runs in
 * both the build and the userscript.
 */

export type TChangelogItem = { text: string; children: string[] };

/** One kind of change in a version's notes ("Added", "Changed", …). */
export type TChangelogSection = { title: string; items: TChangelogItem[] };

export type TChangelogEntry = {
    version: string;
    date: string;
    sections: TChangelogSection[];
};

const kVersionHeading = /^## \[([^\]]+)\](?:\s*-\s*(\S+))?/;
const kSectionHeading = /^### (.+)$/;
const kItem = /^- (.*)$/;
const kChildItem = /^ {2}- (.*)$/;

/**
 * Released versions of a Keep a Changelog file, as written and in file order
 * (newest first). Only the headings and bullet lists the changelog uses are
 * read; [Unreleased], paragraphs and empty sections are left out.
 */
export function parseChangelog(markdown: string): TChangelogEntry[] {
    const entries: TChangelogEntry[] = [];
    let current: TChangelogEntry | undefined;
    for (const line of markdown.split("\n")) {
        const heading = kVersionHeading.exec(line);
        if (heading !== null) {
            const version = heading[1] ?? "";
            current =
                version === "Unreleased"
                    ? undefined
                    : { version, date: heading[2] ?? "", sections: [] };
            if (current !== undefined) {
                entries.push(current);
            }
            continue;
        }
        if (current === undefined) {
            continue;
        }
        const section = kSectionHeading.exec(line);
        if (section !== null) {
            current.sections.push({ title: (section[1] ?? "").trim(), items: [] });
            continue;
        }
        const items = current.sections.at(-1)?.items;
        if (items === undefined) {
            continue;
        }
        const child = kChildItem.exec(line);
        if (child !== null) {
            items.at(-1)?.children.push((child[1] ?? "").trim());
            continue;
        }
        const item = kItem.exec(line);
        if (item !== null) {
            items.push({ text: (item[1] ?? "").trim(), children: [] });
        }
    }
    for (const entry of entries) {
        entry.sections = entry.sections.filter((section) => section.items.length > 0);
    }
    return entries.filter((entry) => entry.sections.length > 0);
}

export type TInlinePart = { kind: "text" | "code" | "strong"; text: string };

/** A changelog line split into plain text, `code` and **strong** spans; links keep only their text. */
export function inlineParts(text: string): TInlinePart[] {
    const plain = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    return plain
        .split(/(`[^`]+`|\*\*[^*]+\*\*)/)
        .filter((part) => part !== "")
        .map((part): TInlinePart => {
            if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
                return { kind: "code", text: part.slice(1, -1) };
            }
            if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
                return { kind: "strong", text: part.slice(2, -2) };
            }
            return { kind: "text", text: part };
        });
}
