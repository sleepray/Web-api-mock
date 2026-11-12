import type { TNetworkRequestRecord } from "./types";

export const kRedactedValue = "[REDACTED]";

const kSensitiveHeaderNames = new Set([
    "authorization",
    "proxyauthorization",
    "cookie",
    "setcookie",
    "apikey",
    "xapikey",
    "token",
    "authtoken",
    "xauthtoken",
    "xsessiontoken",
]);

const kSensitiveFieldNames = new Set([
    "token",
    "accesstoken",
    "refreshtoken",
    "idtoken",
    "apikey",
    "xapikey",
    "key",
    "secret",
    "clientsecret",
    "password",
    "passwd",
    "credential",
    "session",
    "sessionid",
    "sid",
]);

function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveHeaderName(name: string): boolean {
    return kSensitiveHeaderNames.has(normalizeName(name));
}

function isSensitiveFieldName(name: string): boolean {
    return kSensitiveFieldNames.has(normalizeName(name));
}

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

export function redactHeaders(
    headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
    if (headers === undefined) {
        return undefined;
    }
    const result: Record<string, string> = {};
    for (const [name, value] of Object.entries(headers)) {
        result[name] = isSensitiveHeaderName(name) ? kRedactedValue : value;
    }
    return result;
}

export function redactUrl(url: string): string {
    try {
        const parsed = new URL(url);
        const entries = Array.from(parsed.searchParams.entries());
        if (!entries.some(([name]) => isSensitiveFieldName(name))) {
            return url;
        }
        parsed.search = "";
        for (const [name, value] of entries) {
            parsed.searchParams.append(
                name,
                isSensitiveFieldName(name) ? kRedactedValue : value,
            );
        }
        return parsed.href;
    } catch {
        return url;
    }
}

function redactJsonValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(redactJsonValue);
    }
    if (value === null || typeof value !== "object") {
        return value;
    }
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
        result[key] = isSensitiveFieldName(key)
            ? kRedactedValue
            : redactJsonValue(child);
    }
    return result;
}

function redactFormBody(text: string): string {
    const params = new URLSearchParams(text);
    const entries = Array.from(params.entries());
    if (!entries.some(([name]) => isSensitiveFieldName(name))) {
        return text;
    }
    const redacted = new URLSearchParams();
    for (const [name, value] of entries) {
        redacted.append(
            name,
            isSensitiveFieldName(name) ? kRedactedValue : value,
        );
    }
    return redacted.toString();
}

export function redactBody(
    body: unknown,
    headers: Record<string, string> | undefined,
): unknown {
    if (typeof body === "string") {
        return contentTypeOf(headers).includes(
            "application/x-www-form-urlencoded",
        )
            ? redactFormBody(body)
            : body;
    }
    return redactJsonValue(body);
}

/** Returns a new record and never mutates the captured request data. */
export function redactRecord(
    record: TNetworkRequestRecord,
): TNetworkRequestRecord {
    const requestHeaders = redactHeaders(record.requestHeaders);
    const responseHeaders = redactHeaders(record.responseHeaders);
    const redacted: TNetworkRequestRecord = {
        ...record,
        url: redactUrl(record.url),
        requestHeaders,
        responseHeaders,
        requestBody: redactBody(record.requestBody, requestHeaders),
        responseBody: redactBody(record.responseBody, responseHeaders),
    };
    // 放行模式记下的真实返回也是一个出口，走同一套脱敏
    const real = record.mock?.real;
    if (record.mock !== undefined && real !== undefined) {
        const realHeaders = redactHeaders(real.responseHeaders);
        redacted.mock = {
            ...record.mock,
            real: {
                ...real,
                responseHeaders: realHeaders,
                responseBody: redactBody(real.responseBody, realHeaders),
            },
        };
    }
    return redacted;
}
