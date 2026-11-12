import { statusReason } from "../format";

/**
 * 等 `ms` 毫秒；`Infinity` 就一直等（挂起）。等的过程中页面取消了请求（AbortController）就立刻按取消结束 ——
 * 前端自己做的超时一般就是靠取消实现的，这样「挂起」才测得到它的超时提示。
 */
export function waitOrAbort(ms: number, signal?: AbortSignal | null): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal !== undefined && signal !== null) {
            const onAbort = (): void => {
                reject(
                    signal.reason !== undefined
                        ? signal.reason
                        : new DOMException("The user aborted a request.", "AbortError"),
                );
            };
            if (signal.aborted) {
                onAbort();
                return;
            }
            signal.addEventListener("abort", onAbort, { once: true });
        }
        if (ms !== Infinity) {
            setTimeout(resolve, ms);
        }
    });
}

/** 规则只有响应体没有响应头，Content-Type 按内容猜：像 JSON 就是 JSON，否则当纯文本 */
export function contentTypeOf(body: string): string {
    const first = body.trim().charAt(0);
    return first === "{" || first === "[" ? "application/json" : "text/plain;charset=utf-8";
}

/** 这几个状态码按规范不能带响应体，带了 Response 构造会抛错 */
function forbidsBody(status: number): boolean {
    return status === 204 || status === 205 || status === 304;
}

/**
 * 按规则造一个 fetch 的返回。
 * `ResponseCtor` 传页面自己的 Response：脚本跑在沙箱里时，沙箱造的对象页面未必认。
 */
export function createFakeResponse({
    status,
    body,
    url,
    ResponseCtor = Response,
}: {
    status: number;
    body: string;
    url: string;
    ResponseCtor?: typeof Response;
}): Response {
    const response = new ResponseCtor(forbidsBody(status) ? null : body, {
        status,
        statusText: statusReason(status),
        headers: { "content-type": contentTypeOf(body) },
    });
    try {
        // 自己构造的 Response 的 url 是空的，页面读 response.url 时要拿到请求的地址
        Object.defineProperty(response, "url", { value: url });
    } catch {
        // 改不了就算了
    }
    return response;
}

/** 假返回对应的响应头，记录里显示用，和 createFakeResponse / XHR 伪造给页面的一致 */
export function fakeResponseHeaders(status: number, body: string): Record<string, string> {
    return status === 0 ? {} : { "content-type": contentTypeOf(body) };
}
