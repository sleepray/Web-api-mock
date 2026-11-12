import { kConfig } from "./config";
import { createFakeResponse, fakeResponseHeaders, waitOrAbort } from "./mock/fake-response";
import { createXhrFaker, kXhrNetworkFailure, type TXhrFake } from "./mock/fake-xhr";
import { findMockRule, recordMockHit } from "./mock/rule-store";
import { effectiveMode, type TMockRule } from "./mock/rules";
import { upsertRecord } from "./store";
import type { TMockRecordInfo, TNetworkRequestRecord } from "./types";
import {
    createId,
    headersToRecord,
    shouldIgnoreUrl,
    tryParseJson,
} from "./utils";

type TPageWindow = Window &
    typeof globalThis & {
        fetch: typeof fetch;
        XMLHttpRequest: typeof XMLHttpRequest;
        Request?: typeof Request;
        Headers?: typeof Headers;
        URL?: typeof URL;
        URLSearchParams?: typeof URLSearchParams;
        Blob?: typeof Blob;
        FormData?: typeof FormData;
        ArrayBuffer?: typeof ArrayBuffer;
    };

export function getPageWindow(): TPageWindow {
    // prod: @grant sandbox → unsafeWindow points to page
    // dev via proxy: GM_addElement injects into page context → window === page
    // keep unsafeWindow fallback for any sandbox execution path
    const maybeUnsafe = (globalThis as { unsafeWindow?: Window }).unsafeWindow;
    return (maybeUnsafe ?? window) as TPageWindow;
}

/** Sync: BodyInit 常见形态均可同步快照，避免 XHR loadend 抢在微任务前冲掉 body */
function readRequestBody(
    body: BodyInit | null | undefined,
    pageWindow?: TPageWindow,
): unknown {
    if (body === null || body === undefined) {
        return undefined;
    }
    if (typeof body === "string") {
        return tryParseJson(body);
    }
    const pw = pageWindow ?? getPageWindow();
    if (
        body instanceof URLSearchParams ||
        (pw.URLSearchParams && body instanceof pw.URLSearchParams) ||
        Object.prototype.toString.call(body) === "[object URLSearchParams]"
    ) {
        return body.toString();
    }
    if (
        (typeof Blob !== "undefined" && body instanceof Blob) ||
        (pw.Blob && body instanceof pw.Blob) ||
        Object.prototype.toString.call(body) === "[object Blob]" ||
        Object.prototype.toString.call(body) === "[object File]"
    ) {
        const b = body as Blob;
        return `[Blob type=${b.type || "unknown"} size=${b.size}]`;
    }
    if (
        (typeof FormData !== "undefined" && body instanceof FormData) ||
        (pw.FormData && body instanceof pw.FormData) ||
        Object.prototype.toString.call(body) === "[object FormData]"
    ) {
        const entries: string[] = [];
        (body as FormData).forEach((value, key) => {
            if (typeof value === "string") {
                entries.push(`${key}=${value}`);
            } else {
                entries.push(
                    `${key}=[File name=${(value as File).name} size=${(value as File).size}]`,
                );
            }
        });
        return entries.join("&");
    }
    if (
        body instanceof ArrayBuffer ||
        (pw.ArrayBuffer && body instanceof pw.ArrayBuffer) ||
        Object.prototype.toString.call(body) === "[object ArrayBuffer]"
    ) {
        return `[ArrayBuffer byteLength=${(body as ArrayBuffer).byteLength}]`;
    }
    if (
        ArrayBuffer.isView(body) ||
        (pw.ArrayBuffer?.isView && pw.ArrayBuffer.isView(body))
    ) {
        return `[TypedArray byteLength=${(body as ArrayBufferView).byteLength}]`;
    }
    try {
        return String(body);
    } catch {
        return "[unreadable body]";
    }
}

async function readFetchInput(
    input: RequestInfo | URL,
    init?: RequestInit,
    pageWindow?: TPageWindow,
): Promise<{
    method: string;
    url: string;
    requestHeaders?: Record<string, string>;
    requestBody?: unknown;
}> {
    const pw = pageWindow ?? getPageWindow();
    const isRequest =
        input instanceof Request ||
        (pw.Request && input instanceof pw.Request) ||
        Object.prototype.toString.call(input) === "[object Request]";

    if (isRequest) {
        const req = input as Request;
        const method = (init?.method ?? req.method ?? "GET").toUpperCase();
        const url = req.url;
        const HeadersCtor = pw.Headers ?? Headers;
        const mergedHeaders = new HeadersCtor(req.headers);
        if (init?.headers !== undefined) {
            new HeadersCtor(init.headers).forEach((value, key) => {
                mergedHeaders.set(key, value);
            });
        }
        let requestBody: unknown;
        if (init?.body !== undefined) {
            requestBody = readRequestBody(init.body, pw);
        } else {
            try {
                const cloned = req.clone();
                const text = await cloned.text();
                requestBody = text === "" ? undefined : tryParseJson(text);
            } catch {
                requestBody = "[unreadable Request body]";
            }
        }
        return {
            method,
            url,
            requestHeaders: headersToRecord(mergedHeaders),
            requestBody,
        };
    }

    const url =
        typeof input === "string"
            ? input
            : ((input as object) instanceof URL ||
                  (pw.URL && (input as object) instanceof pw.URL))
              ? (input as URL).href
              : String(input);
    const HeadersCtor = pw.Headers ?? Headers;
    return {
        method: (init?.method ?? "GET").toUpperCase(),
        url: new URL(url, location.href).href,
        requestHeaders: headersToRecord(
            init?.headers !== undefined ? new HeadersCtor(init.headers) : undefined,
        ),
        requestBody: readRequestBody(init?.body, pw),
    };
}

function parseResponseHeaders(headerString: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of headerString.trim().split(/[\r\n]+/)) {
        const index = line.indexOf(":");
        if (index <= 0) {
            continue;
        }
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim();
        if (key !== "") {
            result[key] = value;
        }
    }
    return result;
}

/** 记录里的响应体：空的不记，像 JSON 的解析成值，和真实请求的记法一致 */
function bodyForRecord(text: string | undefined): unknown {
    return text === undefined || text === "" ? undefined : tryParseJson(text);
}

/** 请求上带的取消信号：init 里的优先，其次是 Request 对象自己的 */
function fetchSignal(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
): AbortSignal | undefined {
    if (init?.signal !== undefined && init.signal !== null) {
        return init.signal;
    }
    const signal = (input as { signal?: unknown }).signal;
    return typeof signal === "object" && signal !== null ? (signal as AbortSignal) : undefined;
}

type TFetchRecordBase = Omit<
    TNetworkRequestRecord,
    "durationMs" | "status" | "responseHeaders" | "responseBody" | "error"
>;

/**
 * 命中 mock 规则的 fetch：按规则决定发不发请求、等多久、给页面什么返回。
 * 记录里的 status / 响应头 / 响应体是页面看到的（规则给的）；放行模式下服务器真正的返回记在 mock.real。
 */
async function mockFetch({
    rule,
    base,
    input,
    init,
    originalFetch,
    pageWindow,
}: {
    rule: TMockRule;
    base: TFetchRecordBase;
    input: RequestInfo | URL;
    init: RequestInit | undefined;
    originalFetch: typeof fetch;
    pageWindow: TPageWindow;
}): Promise<Response> {
    // 等待期间规则可能被改掉或删掉，这次请求按命中那一刻的规则走
    const snapshot = { ...rule };
    const mode = effectiveMode(snapshot);
    const mock: TMockRecordInfo = { ruleId: snapshot.id, mode };
    const elapsed = (): number => Date.now() - base.startedAt;
    recordMockHit(snapshot.id);
    upsertRecord({ ...base, mock });

    try {
        const signal = fetchSignal(input, init);
        if (mode === "rewrite") {
            // 放行：请求真的发出去并执行，只是页面拿不到它的返回
            const real = originalFetch(input, init).then(
                async (response) => {
                    let responseBody: unknown;
                    try {
                        responseBody = bodyForRecord(await response.text());
                    } catch {
                        responseBody = "[unreadable response body]";
                    }
                    mock.real = {
                        status: response.status,
                        responseHeaders: headersToRecord(response.headers),
                        responseBody,
                    };
                },
                (error: unknown) => {
                    // 真实请求失败也照样给假返回
                    mock.real = { error: error instanceof Error ? error.message : String(error) };
                },
            );
            await Promise.all([real, waitOrAbort(snapshot.delay, signal)]);
        } else {
            await waitOrAbort(mode === "hang" ? Infinity : snapshot.delay, signal);
        }
    } catch (error) {
        // 等的过程中页面取消了请求
        upsertRecord({ ...base, mock, durationMs: elapsed(), error: "Aborted" });
        throw error;
    }

    if (snapshot.status === 0) {
        upsertRecord({ ...base, mock, durationMs: elapsed(), error: "Failed to fetch" });
        throw new pageWindow.TypeError("Failed to fetch");
    }
    upsertRecord({
        ...base,
        mock,
        durationMs: elapsed(),
        status: snapshot.status,
        responseHeaders: fakeResponseHeaders(snapshot.status, snapshot.body),
        responseBody: bodyForRecord(snapshot.body),
    });
    return createFakeResponse({
        status: snapshot.status,
        body: snapshot.body,
        url: base.url,
        ResponseCtor: pageWindow.Response,
    });
}

function installFetchHook(pageWindow: TPageWindow): void {
    const originalFetch = pageWindow.fetch.bind(pageWindow);

    pageWindow.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> => {
        const startedAt = Date.now();
        const id = createId();
        let base: Omit<
            TNetworkRequestRecord,
            "durationMs" | "status" | "responseHeaders" | "responseBody" | "error"
        >;

        try {
            const parsed = await readFetchInput(input, init, pageWindow);
            base = {
                id,
                method: parsed.method,
                url: parsed.url,
                startedAt,
                requestHeaders: parsed.requestHeaders,
                requestBody: parsed.requestBody,
                source: "fetch",
            };
        } catch {
            base = {
                id,
                method: "GET",
                url: String(input),
                startedAt,
                source: "fetch",
            };
        }

        // 先查规则再看要不要忽略：给静态资源写了规则，说明就是要改它
        const rule = findMockRule(base.method, base.url);
        if (rule !== undefined) {
            return mockFetch({ rule, base, input, init, originalFetch, pageWindow });
        }

        if (shouldIgnoreUrl(base.url, kConfig.ignoreUrlPatterns)) {
            return originalFetch(input, init);
        }

        upsertRecord({ ...base });

        try {
            const response = await originalFetch(input, init);
            let responseBody: unknown;
            try {
                const text = await response.clone().text();
                responseBody = text === "" ? undefined : tryParseJson(text);
            } catch {
                responseBody = "[unreadable response body]";
            }

            upsertRecord({
                ...base,
                durationMs: Date.now() - startedAt,
                status: response.status,
                responseHeaders: headersToRecord(response.headers),
                responseBody,
            });
            return response;
        } catch (error) {
            upsertRecord({
                ...base,
                durationMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    };
}

function installXhrHook(pageWindow: TPageWindow): void {
    const OriginalXHR = pageWindow.XMLHttpRequest;
    const originalOpen = OriginalXHR.prototype.open;
    const originalSend = OriginalXHR.prototype.send;
    const originalSetRequestHeader = OriginalXHR.prototype.setRequestHeader;
    const originalAbort = OriginalXHR.prototype.abort;
    // 要在换掉原型上的方法之前建：它记下的是浏览器原本的 getter
    const faker = createXhrFaker(pageWindow);

    type TXhrMeta = {
        method: string;
        url: string;
        requestHeaders: Record<string, string>;
        id: string;
        startedAt: number;
        ignored: boolean;
        requestBody?: unknown;
        /** 页面调过 abort() */
        aborted: boolean;
        /** 被规则拦下、没有真的发出去的请求：已经给过结果了 */
        mockDone: boolean;
        /** 被规则拦下的请求在页面调 abort() 时要做的事 —— 请求没发出去，浏览器不会替我们发 abort 事件 */
        onMockAbort?: () => void;
    };

    const metaMap = new WeakMap<XMLHttpRequest, TXhrMeta>();

    OriginalXHR.prototype.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null,
    ): void {
        const resolvedUrl =
            typeof url === "string"
                ? new URL(url, location.href).href
                : url.href;
        metaMap.set(this, {
            method: method.toUpperCase(),
            url: resolvedUrl,
            requestHeaders: {},
            id: createId(),
            startedAt: Date.now(),
            ignored: shouldIgnoreUrl(resolvedUrl, kConfig.ignoreUrlPatterns),
            aborted: false,
            mockDone: false,
        });
        return originalOpen.call(
            this,
            method,
            url as string,
            async ?? true,
            username,
            password,
        );
    };

    OriginalXHR.prototype.setRequestHeader = function (
        name: string,
        value: string,
    ): void {
        const meta = metaMap.get(this);
        if (meta !== undefined) {
            meta.requestHeaders[name] = value;
        }
        return originalSetRequestHeader.call(this, name, value);
    };

    OriginalXHR.prototype.abort = function (): void {
        const meta = metaMap.get(this);
        if (meta !== undefined) {
            meta.aborted = true;
            meta.onMockAbort?.();
        }
        return originalAbort.call(this);
    };

    /**
     * 命中 mock 规则的 XHR。记录里的 status / 响应头 / 响应体是页面看到的（规则给的），
     * 放行模式下服务器真正的返回记在 mock.real。
     */
    function sendMocked(
        xhr: XMLHttpRequest,
        meta: TXhrMeta,
        rule: TMockRule,
        body: Document | XMLHttpRequestBodyInit | null | undefined,
    ): void {
        // 等待期间规则可能被改掉或删掉，这次请求按命中那一刻的规则走
        const snapshot = { ...rule };
        const mode = effectiveMode(snapshot);
        const mock: TMockRecordInfo = { ruleId: snapshot.id, mode };
        recordMockHit(snapshot.id);
        meta.startedAt = Date.now();
        meta.requestBody = readRequestBody(body as BodyInit | null | undefined, pageWindow);

        const pending = (): TNetworkRequestRecord => ({
            id: meta.id,
            method: meta.method,
            url: meta.url,
            startedAt: meta.startedAt,
            requestHeaders: { ...meta.requestHeaders },
            requestBody: meta.requestBody,
            source: "xhr",
            mock,
        });
        const finished = (): TNetworkRequestRecord => ({
            ...pending(),
            durationMs: Date.now() - meta.startedAt,
        });
        const recordFake = (fake: TXhrFake, error = "Network error"): void => {
            upsertRecord(
                fake.status === 0
                    ? { ...finished(), error }
                    : {
                          ...finished(),
                          status: fake.status,
                          responseHeaders: fakeResponseHeaders(fake.status, fake.body),
                          responseBody: bodyForRecord(fake.body),
                      },
            );
        };
        upsertRecord(pending());

        if (mode === "rewrite") {
            // 放行：请求真的发出去并执行；等它走完，页面读到的是规则的返回
            faker.mask(xhr, snapshot, meta.url, true);
            xhr.addEventListener("loadend", () => {
                if (meta.aborted) {
                    upsertRecord({ ...finished(), error: "Aborted" });
                    return;
                }
                const real = faker.readReal(xhr);
                mock.real =
                    real.status === 0
                        ? { error: "Network error" }
                        : {
                              status: real.status,
                              responseHeaders: parseResponseHeaders(real.headers),
                              responseBody: bodyForRecord(real.body),
                          };
                recordFake(snapshot);
            });
            return originalSend.call(xhr, body);
        }

        // 拦截 / 挂起：不调真正的 send，自己把「结束」的事件补上
        const finish = (kind: "load" | "error" | "timeout"): void => {
            if (meta.aborted || meta.mockDone) {
                return;
            }
            meta.mockDone = true;
            const fake = kind === "timeout" ? kXhrNetworkFailure : snapshot;
            faker.mask(xhr, fake, meta.url, false);
            recordFake(fake, kind === "timeout" ? "Timeout" : "Network error");
            xhr.dispatchEvent(new pageWindow.Event("readystatechange"));
            xhr.dispatchEvent(new pageWindow.ProgressEvent(kind));
            xhr.dispatchEvent(new pageWindow.ProgressEvent("loadend"));
        };
        meta.onMockAbort = (): void => {
            if (!meta.mockDone) {
                meta.mockDone = true;
                upsertRecord({ ...finished(), error: "Aborted" });
            }
        };
        // 请求没真的发出去，浏览器不会替我们算超时：页面设了 xhr.timeout、而规则要等得比它久（或一直不返回），
        // 就到点补一个 timeout 事件，前端的超时提示才出得来
        const limit = faker.readTimeout(xhr);
        if (limit > 0 && (mode === "hang" || snapshot.delay > limit)) {
            setTimeout(() => finish("timeout"), limit);
        }
        if (mode !== "hang") {
            setTimeout(() => finish(snapshot.status === 0 ? "error" : "load"), snapshot.delay);
        }
    }

    OriginalXHR.prototype.send = function (
        body?: Document | XMLHttpRequestBodyInit | null,
    ): void {
        const meta = metaMap.get(this);
        if (meta === undefined) {
            return originalSend.call(this, body);
        }
        // 先查规则再看要不要忽略：给静态资源写了规则，说明就是要改它
        const rule = findMockRule(meta.method, meta.url);
        if (rule !== undefined) {
            return sendMocked(this, meta, rule, body);
        }
        if (meta.ignored) {
            return originalSend.call(this, body);
        }

        const startedAt = Date.now();
        meta.startedAt = startedAt;
        // 同步写入 meta：后续 loadend/error/abort 的 upsert 是整条替换，必须带上 body
        meta.requestBody = readRequestBody(
            body as BodyInit | null | undefined,
            pageWindow,
        );

        upsertRecord({
            id: meta.id,
            method: meta.method,
            url: meta.url,
            startedAt,
            requestHeaders: { ...meta.requestHeaders },
            requestBody: meta.requestBody,
            source: "xhr",
        });

        const finalize = (): void => {
            let responseBody: unknown;
            try {
                const text = this.responseText;
                responseBody = text === "" ? undefined : tryParseJson(text);
            } catch {
                // responseType 不是文本时读 responseText 会抛错；JSON 类型的还能从 response 拿到
                responseBody =
                    bodyForRecord(faker.readReal(this).body) ?? "[unreadable response body]";
            }

            upsertRecord({
                id: meta.id,
                method: meta.method,
                url: meta.url,
                startedAt: meta.startedAt,
                durationMs: Date.now() - meta.startedAt,
                requestHeaders: { ...meta.requestHeaders },
                requestBody: meta.requestBody,
                status: this.status,
                responseHeaders: parseResponseHeaders(
                    this.getAllResponseHeaders(),
                ),
                responseBody,
                source: "xhr",
            });
        };

        this.addEventListener("loadend", finalize);
        this.addEventListener("error", () => {
            upsertRecord({
                id: meta.id,
                method: meta.method,
                url: meta.url,
                startedAt: meta.startedAt,
                durationMs: Date.now() - meta.startedAt,
                requestHeaders: { ...meta.requestHeaders },
                requestBody: meta.requestBody,
                error: "Network error",
                source: "xhr",
            });
        });
        this.addEventListener("abort", () => {
            upsertRecord({
                id: meta.id,
                method: meta.method,
                url: meta.url,
                startedAt: meta.startedAt,
                durationMs: Date.now() - meta.startedAt,
                requestHeaders: { ...meta.requestHeaders },
                requestBody: meta.requestBody,
                error: "Aborted",
                source: "xhr",
            });
        });

        return originalSend.call(this, body);
    };
}

export function installNetworkInterceptors(): void {
    const pageWindow = getPageWindow();
    installFetchHook(pageWindow);
    installXhrHook(pageWindow);
}
