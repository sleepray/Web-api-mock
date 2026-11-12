import type { TNetworkRequestRecord } from "../types";

import { prettyJson } from "./json-repair";
import { ruleCovers, type TMockRule } from "./rules";

/** 拦截层读不出响应体（二进制等）时填的占位文字，不能当成真实内容带进规则 */
const kUnreadableBody = "[unreadable response body]";

export type TRealResponse = { status: number; body: string };

function bodyText(body: unknown): string | undefined {
    if (body === undefined) {
        return "";
    }
    if (body === kUnreadableBody) {
        return;
    }
    if (typeof body === "string") {
        return prettyJson(body);
    }
    try {
        // 记录里像 JSON 的响应体已经解析成值了，排好版再带进规则，方便改
        return JSON.stringify(body, null, 2);
    } catch {
        return;
    }
}

/**
 * 这条记录里服务器真正的返回。
 * 没被规则改过的记录就是它自己的 status / 响应体；放行模式的在 mock.real 里；
 * 拦截和挂起没有发请求，还在进行中或失败的也没有返回，这些都拿不到。
 */
export function realResponseOf(record: TNetworkRequestRecord): TRealResponse | undefined {
    const source = record.mock === undefined ? record : record.mock.real;
    if (source === undefined || source.status === undefined || source.status === 0) {
        return;
    }
    const body = bodyText(source.responseBody);
    return body === undefined ? undefined : { status: source.status, body };
}

/** 规则管得到的请求里，最近一次的真实返回。`records` 是新的在前 */
export function findRealResponse(
    records: readonly TNetworkRequestRecord[],
    rule: TMockRule,
): TRealResponse | undefined {
    for (const record of records) {
        if (!ruleCovers(rule, record.method, record.url)) {
            continue;
        }
        const real = realResponseOf(record);
        if (real !== undefined) {
            return real;
        }
    }
    return;
}

/**
 * 规则的匹配条件：同源只用路径，去掉查询参数 —— 参数每次都可能变（分页、时间戳），按路径匹配更稳；
 * 跨域的带上域名。
 */
export function matchPatternFor(url: string, pageOrigin: string): string {
    try {
        const parsed = new URL(url, pageOrigin);
        return `${parsed.origin === pageOrigin ? "" : parsed.origin}${parsed.pathname}`;
    } catch {
        return url;
    }
}

/**
 * 从一条抓到的请求建规则时带入的内容。
 * 有真实返回就原样带入（状态码和响应体都是真的，在它上面改）；没有就只带方法和地址，
 * 状态码和响应体留空，落回默认的 500 —— 免得出现「真实状态码 + 默认报错内容」这种对不上的组合。
 */
export function ruleSeedFromRecord({
    record,
    records,
    pageOrigin,
}: {
    record: TNetworkRequestRecord;
    /** 全部记录（新的在前）。这条记录自己没有真实返回时，到里面找同一个接口最近的一次 */
    records: readonly TNetworkRequestRecord[];
    pageOrigin: string;
}): Partial<TMockRule> {
    const method = record.method.toUpperCase();
    const match = matchPatternFor(record.url, pageOrigin);
    const seed: Partial<TMockRule> = { method: method as TMockRule["method"], match };
    const real =
        realResponseOf(record) ??
        records.map(realResponseOf).find(
            (candidate, index) =>
                candidate !== undefined &&
                records[index].method.toUpperCase() === method &&
                matchPatternFor(records[index].url, pageOrigin) === match,
        );
    if (real !== undefined) {
        seed.status = real.status;
        seed.body = real.body;
        seed.orig = real;
    }
    return seed;
}
