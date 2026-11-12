import { type TCopyMode } from "./copy-mode";
import { kConfig } from "./config";
import { redactRecord } from "./redaction";
import type { TNetworkRequestRecord } from "./types";

export type TBodyDisplay = {
    text: string;
    language: "json" | "html" | "xml" | "text";
    empty: boolean;
    truncated: boolean;
    totalChars: number;
};

function contentTypeOf(headers: Record<string, string> | undefined): string {
    if (headers === undefined) {
        return "";
    }
    for (const [name, value] of Object.entries(headers)) {
        if (name.toLowerCase() === "content-type") {
            return value.toLowerCase();
        }
    }
    return "";
}

function bodyLanguage(
    body: unknown,
    headers: Record<string, string> | undefined,
): TBodyDisplay["language"] {
    if (body !== null && typeof body === "object") {
        return "json";
    }
    const text = String(body).trim().toLowerCase();
    const contentType = contentTypeOf(headers);
    if (
        contentType.includes("text/html") ||
        contentType.includes("application/xhtml+xml") ||
        text.startsWith("<!doctype html") ||
        text.startsWith("<html")
    ) {
        return "html";
    }
    if (
        contentType.includes("xml") ||
        text.startsWith("<?xml") ||
        text.startsWith("<svg")
    ) {
        return "xml";
    }
    return "text";
}

/** Formats an already captured body without changing the captured record. */
export function formatBodyForDisplay(
    body: unknown,
    headers: Record<string, string> | undefined,
): TBodyDisplay {
    if (body === undefined || body === null) {
        return {
            text: "",
            language: "text",
            empty: true,
            truncated: false,
            totalChars: 0,
        };
    }

    let text: string;
    try {
        text =
            typeof body === "string" ? body : JSON.stringify(body, null, 2);
    } catch {
        text = String(body);
    }
    const totalChars = text.length;
    const truncated = totalChars > kConfig.maxBodyChars;
    return {
        text: truncated ? text.slice(0, kConfig.maxBodyChars) : text,
        language: truncated ? "text" : bodyLanguage(body, headers),
        empty: false,
        truncated,
        totalChars,
    };
}

export function formatHeadersForDisplay(
    headers: Record<string, string> | undefined,
): string {
    if (headers === undefined || Object.keys(headers).length === 0) {
        return "(none)";
    }
    return Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
}

/** Applies the requested privacy mode without mutating the captured record. */
export function recordForDisplay(
    record: TNetworkRequestRecord,
    mode: TCopyMode,
): TNetworkRequestRecord {
    return mode === "redacted" ? redactRecord(record) : record;
}

function inlineCode(value: string): string {
    return `\`${value.replace(/`/g, "\\`")}\``;
}

function fenced(
    text: string,
    language: TBodyDisplay["language"] | "http",
): string {
    const runs = text.match(/`+/g) ?? [];
    const fenceLength = Math.max(3, ...runs.map((run) => run.length + 1));
    const fence = "`".repeat(fenceLength);
    return `${fence}${language}\n${text}\n${fence}`;
}

function formatBodyMarkdown(body: TBodyDisplay): string {
    if (body.empty) {
        return "*(empty)*";
    }
    const content = fenced(body.text, body.language);
    return body.truncated
        ? `${content}\n\n> Truncated: ${body.totalChars} characters total.`
        : content;
}

function formatRequest(record: TNetworkRequestRecord): string {
    const body = formatBodyForDisplay(record.requestBody, record.requestHeaders);
    const metadata = [
        `- Method: ${inlineCode(record.method)}`,
        `- URL: ${inlineCode(record.url)}`,
        `- Source: ${inlineCode(record.source)}`,
    ];
    if (record.durationMs !== undefined) {
        metadata.push(`- Duration: ${record.durationMs}ms`);
    }
    return [
        "## Request",
        "",
        ...metadata,
        "",
        "### Headers",
        "",
        fenced(formatHeadersForDisplay(record.requestHeaders), "http"),
        "",
        "### Body",
        "",
        formatBodyMarkdown(body),
    ].join("\n");
}

function formatResponse(record: TNetworkRequestRecord): string {
    const body = formatBodyForDisplay(record.responseBody, record.responseHeaders);
    const metadata =
        record.status !== undefined
            ? [`- Status: ${record.status}`]
            : record.error !== undefined
              ? [`- Error: ${inlineCode(record.error)}`]
              : ["- Status: *(pending)*"];
    return [
        "## Response",
        "",
        ...metadata,
        "",
        "### Headers",
        "",
        fenced(formatHeadersForDisplay(record.responseHeaders), "http"),
        "",
        "### Body",
        "",
        formatBodyMarkdown(body),
    ].join("\n");
}

/** Pure: record → Markdown suitable for a clipboard. */
export function formatRecord(
    record: TNetworkRequestRecord,
    mode: TCopyMode = "redacted",
): string {
    const displayed = recordForDisplay(record, mode);
    return [formatRequest(displayed), "", formatResponse(displayed)].join("\n");
}

/** Pure: a visible request list → one Markdown clipboard document. */
export function formatRecords(
    records: readonly TNetworkRequestRecord[],
    mode: TCopyMode = "redacted",
): string {
    return records
        .map(
            (record, index) =>
                `# Request ${index + 1} of ${records.length}\n\n${formatRecord(record, mode)}`,
        )
        .join("\n\n---\n\n");
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Pure: record → a runnable cURL command (POSIX shell quoting). */
export function formatCurl(
    record: TNetworkRequestRecord,
    mode: TCopyMode = "redacted",
): string {
    const displayed = recordForDisplay(record, mode);
    const method = displayed.method.toUpperCase();
    const parts = [`curl ${shellQuote(displayed.url)}`];
    if (method !== "GET") {
        parts.push(`-X ${method}`);
    }
    for (const [name, value] of Object.entries(displayed.requestHeaders ?? {})) {
        parts.push(`-H ${shellQuote(`${name}: ${value}`)}`);
    }
    const body = displayed.requestBody;
    if (body !== undefined && body !== null && body !== "") {
        let text: string;
        try {
            text = typeof body === "string" ? body : JSON.stringify(body);
        } catch {
            text = String(body);
        }
        parts.push(`--data-raw ${shellQuote(text)}`);
    }
    return parts.join(" \\\n  ");
}

/** Body size in UTF-8 bytes, formatted like `512 B` / `1.2 KB` / `3.4 MB`. */
export function formatBodySize(body: unknown): string {
    if (body === undefined || body === null) {
        return "—";
    }
    let text: string;
    try {
        text = typeof body === "string" ? body : JSON.stringify(body);
    } catch {
        text = String(body);
    }
    const bytes = new TextEncoder().encode(text).length;
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const kStatusReasons: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    206: "Partial Content",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    413: "Payload Too Large",
    415: "Unsupported Media Type",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
};

/** Standard reason phrase for a status code; empty when unknown. */
export function statusReason(status: number): string {
    return kStatusReasons[status] ?? "";
}

/** Query parameters of a URL in their original order; relative URLs resolve against a dummy base. */
export function queryEntries(url: string): [string, string][] {
    try {
        return Array.from(new URL(url, "http://localhost").searchParams.entries());
    } catch {
        return [];
    }
}
