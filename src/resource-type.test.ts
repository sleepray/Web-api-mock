import { describe, expect, it } from "vitest";

import { resourceTypeOf } from "./resource-type";
import type { TNetworkRequestRecord } from "./types";

function record({ url, contentType, responseBody }: { url: string; contentType?: string; responseBody?: unknown }): TNetworkRequestRecord {
    return {
        id: url,
        method: "GET",
        url,
        startedAt: 0,
        source: "fetch",
        responseHeaders: contentType === undefined ? undefined : { "Content-Type": contentType },
        responseBody,
    };
}

describe("resourceTypeOf", () => {
    it.each([
        ["application/json; charset=utf-8", "json"],
        ["application/problem+json", "json"],
        ["text/html", "doc"],
        ["application/rss+xml", "doc"],
        ["text/plain", "text"],
        ["text/event-stream", "text"],
        ["text/javascript", "js"],
        ["text/css", "css"],
        ["image/svg+xml", "img"],
        ["application/dash+xml", "media"],
        ["application/vnd.apple.mpegurl", "media"],
        ["font/woff2", "font"],
        ["application/vnd.ms-fontobject", "font"],
        ["application/wasm", "other"],
    ])("classifies %s as %s", (contentType, expected) => {
        expect(resourceTypeOf(record({ url: "https://a.test/x", contentType }))).toBe(expected);
    });

    it("treats a body that parses as JSON as JSON regardless of Content-Type", () => {
        expect(resourceTypeOf(record({ url: "https://a.test/api", contentType: "text/plain", responseBody: { ok: true } }))).toBe(
            "json",
        );
        expect(resourceTypeOf(record({ url: "https://a.test/api", responseBody: [1] }))).toBe("json");
    });

    it("falls back to the URL extension when the type is missing or generic", () => {
        expect(resourceTypeOf(record({ url: "https://a.test/data.json?v=1" }))).toBe("json");
        expect(resourceTypeOf(record({ url: "https://a.test/app.mjs", contentType: "application/octet-stream" }))).toBe("js");
        expect(resourceTypeOf(record({ url: "/relative/page.html" }))).toBe("doc");
        expect(resourceTypeOf(record({ url: "https://a.test/api" }))).toBe("other");
    });
});
