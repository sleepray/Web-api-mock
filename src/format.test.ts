import { afterEach, describe, expect, it } from "vitest";

import { kConfig } from "./config";
import {
    formatBodyForDisplay,
    formatBodySize,
    formatCurl,
    formatRecord,
    formatRecords,
    queryEntries,
    statusReason,
} from "./format";
import { redactRecord } from "./redaction";
import type { TNetworkRequestRecord } from "./types";

const record: TNetworkRequestRecord = {
    id: "test",
    method: "POST",
    url: "https://api.example.test/items?access_token=url-secret&page=2",
    startedAt: 0,
    durationMs: 123,
    source: "fetch",
    requestHeaders: {
        "Content-Type": "application/json",
        Authorization: "Bearer header-secret",
    },
    requestBody: {
        profile: { password: "body-secret", name: "Ada" },
        items: [{ api_key: "nested-secret" }],
    },
    status: 200,
    responseHeaders: {
        "content-type": "application/json",
        "set-cookie": "session=response-secret",
    },
    responseBody: { access_token: "response-secret", ok: true },
};

const mutableConfig = kConfig as { maxBodyChars: number };
const originalMaxBodyChars = mutableConfig.maxBodyChars;

afterEach(() => {
    mutableConfig.maxBodyChars = originalMaxBodyChars;
});

describe("redactRecord", () => {
    it("redacts headers, URL parameters and nested JSON without mutating the capture", () => {
        const redacted = redactRecord(record);
        expect(redacted.requestHeaders?.Authorization).toBe("[REDACTED]");
        expect(redacted.responseHeaders?.["set-cookie"]).toBe("[REDACTED]");
        expect(redacted.url).toMatch(/access_token=%5BREDACTED%5D/);
        expect(redacted.requestBody).toEqual({
            profile: { password: "[REDACTED]", name: "Ada" },
            items: [{ api_key: "[REDACTED]" }],
        });
        expect((record.requestBody as { profile: { password: string } }).profile.password).toBe("body-secret");
    });
});

describe("formatRecord", () => {
    it("exports Markdown with secrets hidden by default", () => {
        const copy = formatRecord(record);
        expect(copy).toMatch(/## Request/);
        expect(copy).toMatch(/```json/);
        expect(copy).toMatch(/\[REDACTED\]/);
        for (const secret of ["header-secret", "body-secret", "response-secret"]) {
            expect(copy).not.toContain(secret);
        }
    });

    it("keeps captured values in raw mode", () => {
        const copy = formatRecord(record, "raw");
        for (const secret of ["header-secret", "body-secret", "response-secret"]) {
            expect(copy).toContain(secret);
        }
        expect(formatRecords([record, record])).toMatch(/# Request 2 of 2/);
    });

    it("redacts URL-encoded form fields", () => {
        const formRecord: TNetworkRequestRecord = {
            ...record,
            requestHeaders: { "content-type": "application/x-www-form-urlencoded" },
            requestBody: "token=form-secret&name=Ada",
        };
        expect(formatRecord(formRecord)).toMatch(/token=%5BREDACTED%5D/);
    });

    it("truncates oversized bodies and reports the full length", () => {
        mutableConfig.maxBodyChars = 3;
        const truncated = formatRecord({ ...record, responseBody: { long: "value" } });
        expect(truncated).toMatch(/```text/);
        expect(truncated).toMatch(/> Truncated: 21 characters total\./);
    });
});

describe("formatBodyForDisplay", () => {
    it("picks a language from the content type and flags empty bodies", () => {
        expect(formatBodyForDisplay("<html><body>ok</body></html>", { "content-type": "text/html" }).language).toBe("html");
        expect(formatBodyForDisplay(undefined, undefined).empty).toBe(true);
        expect(
            formatBodyForDisplay("token=secret&name=Ada", { "content-type": "application/x-www-form-urlencoded" }).language,
        ).toBe("text");
    });
});

describe("formatCurl", () => {
    it("builds a redacted command by default and a raw one on request", () => {
        const curl = formatCurl(record);
        expect(curl).toMatch(/^curl 'https:\/\/api\.example\.test\/items\?access_token=%5BREDACTED%5D&page=2'/);
        expect(curl).toMatch(/-X POST/);
        expect(curl).toMatch(/-H 'Authorization: \[REDACTED\]'/);
        expect(curl).toMatch(/--data-raw '\{"profile":\{"password":"\[REDACTED\]","name":"Ada"\}/);
        expect(formatCurl(record, "raw")).toMatch(/Bearer header-secret/);
    });

    it("escapes single quotes for the shell", () => {
        expect(formatCurl({ ...record, method: "GET", requestHeaders: undefined, requestBody: "it's" }, "raw")).toBe(
            `curl 'https://api.example.test/items?access_token=url-secret&page=2' \\\n  --data-raw 'it'\\''s'`,
        );
    });
});

describe("detail helpers", () => {
    it("formats body sizes in UTF-8 bytes", () => {
        expect(formatBodySize(undefined)).toBe("—");
        expect(formatBodySize("héllo")).toBe("6 B");
        expect(formatBodySize("x".repeat(2048))).toBe("2.0 KB");
    });

    it("names known status codes only", () => {
        expect(statusReason(404)).toBe("Not Found");
        expect(statusReason(299)).toBe("");
    });

    it("keeps repeated query parameters in order", () => {
        expect(queryEntries("/a?x=1&y=two&x=3")).toEqual([
            ["x", "1"],
            ["y", "two"],
            ["x", "3"],
        ]);
        expect(queryEntries("https://e.test/no-query")).toEqual([]);
    });
});
