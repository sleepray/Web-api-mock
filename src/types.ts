import type { TMockMode } from "./mock/rules";

export type TNetworkRequestSource = "fetch" | "xhr";

/** 这次请求的返回被哪条 mock 规则改过 */
export type TMockRecordInfo = {
    ruleId: string;
    /** 实际生效的模式 */
    mode: TMockMode;
    /** 放行模式下服务器真正的返回；拦截和挂起没有发请求，所以没有 */
    real?: {
        status?: number;
        responseHeaders?: Record<string, string>;
        responseBody?: unknown;
        error?: string;
    };
};

export type TNetworkRequestRecord = {
    id: string;
    method: string;
    url: string;
    startedAt: number;
    durationMs?: number;
    requestHeaders?: Record<string, string>;
    requestBody?: unknown;
    status?: number;
    responseHeaders?: Record<string, string>;
    responseBody?: unknown;
    error?: string;
    source: TNetworkRequestSource;
    /** 有值表示 status / responseHeaders / responseBody 是规则给的，不是服务器的 */
    mock?: TMockRecordInfo;
    /** 刷新页面之前留下来的记录 */
    restored?: boolean;
};

export type TStoreListener = (records: readonly TNetworkRequestRecord[]) => void;