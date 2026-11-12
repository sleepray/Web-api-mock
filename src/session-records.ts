import { kConfig } from "./config";
import { redactBody, redactHeaders, redactUrl } from "./redaction";
import type { TNetworkRequestRecord } from "./types";

/**
 * 刷新页面后还留着请求记录：离开页面时写进 sessionStorage，加载时读回来。
 * sessionStorage 每个标签页一份，刷新还在，关掉标签页就清掉，正好是「这一次测试」的范围。
 * 好处不只是列表不丢：刷新后规则一上来就拦下的接口，也还能拿刷新前抓到的真实返回建规则。
 *
 * 落盘前把请求一侧（URL 参数、请求头、请求体）和响应头脱敏：凭证不该因为刷新被写进存储。
 * 响应体保留原文 —— 建 mock 规则要的就是它。
 */

type TStorageLike = Pick<Storage, "getItem" | "setItem">;

function bodyChars(body: unknown): number {
    if (body === undefined) {
        return 0;
    }
    if (typeof body === "string") {
        return body.length;
    }
    try {
        return JSON.stringify(body)?.length ?? 0;
    } catch {
        return Infinity;
    }
}

/** 还在进行中的请求没有结果，刷新后也不会再有，不留 */
function isFinished(record: TNetworkRequestRecord): boolean {
    return record.status !== undefined || record.error !== undefined;
}

/**
 * 要存下来的记录。响应体从最新的开始留，加起来超过 `budget` 的那些只留请求、不留响应体。
 * `records` 是新的在前。
 */
export function recordsForSession(
    records: readonly TNetworkRequestRecord[],
    budget: number = kConfig.sessionRecordsBudgetChars,
): TNetworkRequestRecord[] {
    let left = budget;
    return records.filter(isFinished).map((record) => {
        const requestHeaders = redactHeaders(record.requestHeaders);
        const responseHeaders = redactHeaders(record.responseHeaders);
        const size = bodyChars(record.responseBody) + bodyChars(record.mock?.real?.responseBody);
        const keepBody = size <= left;
        if (keepBody) {
            left -= size;
        }
        const slim: TNetworkRequestRecord = {
            ...record,
            url: redactUrl(record.url),
            requestHeaders,
            requestBody: redactBody(record.requestBody, requestHeaders),
            responseHeaders,
            responseBody: keepBody ? record.responseBody : undefined,
        };
        if (record.mock?.real !== undefined) {
            const realHeaders = redactHeaders(record.mock.real.responseHeaders);
            slim.mock = {
                ...record.mock,
                real: {
                    ...record.mock.real,
                    responseHeaders: realHeaders,
                    responseBody: keepBody ? record.mock.real.responseBody : undefined,
                },
            };
        }
        delete slim.restored;
        return slim;
    });
}

export function saveSessionRecords(
    records: readonly TNetworkRequestRecord[],
    storage: TStorageLike = sessionStorage,
): void {
    const slim = recordsForSession(records);
    try {
        storage.setItem(kConfig.sessionRecordsStorageKey, JSON.stringify(slim));
    } catch {
        // 页面自己已经把配额用得差不多了：退一步，只留请求列表
        try {
            storage.setItem(
                kConfig.sessionRecordsStorageKey,
                JSON.stringify(recordsForSession(records, 0)),
            );
        } catch {
            // 还放不下就不留了
        }
    }
}

function isRecord(value: unknown): value is TNetworkRequestRecord {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const record = value as Partial<TNetworkRequestRecord>;
    return (
        typeof record.id === "string" &&
        typeof record.method === "string" &&
        typeof record.url === "string" &&
        typeof record.startedAt === "number" &&
        (record.source === "fetch" || record.source === "xhr")
    );
}

/** 读回上次留下的记录，标成「刷新之前的」。读坏了就当没有 */
export function loadSessionRecords(storage: TStorageLike = sessionStorage): TNetworkRequestRecord[] {
    try {
        const parsed: unknown = JSON.parse(storage.getItem(kConfig.sessionRecordsStorageKey) ?? "[]");
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter(isRecord)
            .slice(0, kConfig.maxEntries)
            .map((record) => ({ ...record, restored: true }));
    } catch {
        return [];
    }
}
