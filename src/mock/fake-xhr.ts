import { statusReason } from "../format";

import { contentTypeOf } from "./fake-response";

/** 让 XHR 呈现成什么样：状态码 0 是网络错误，响应体为空 */
export type TXhrFake = { status: number; body: string };

/** 超时、断网时 XHR 该呈现的样子 */
export const kXhrNetworkFailure: TXhrFake = { status: 0, body: "" };

type TXhrWindow = {
    XMLHttpRequest: typeof XMLHttpRequest;
    Blob?: typeof Blob;
    TextEncoder?: typeof TextEncoder;
};

export type TXhrFaker = {
    /**
     * 读真实返回。走原型上的 getter，所以实例被 `mask` 盖住之后读到的仍是真值。
     * 响应体只读得出文本和 JSON 两种，其它类型（blob 等）没有 `body`。
     */
    readReal: (xhr: XMLHttpRequest) => { status: number; body?: string; headers: string };
    /** 页面给这个请求设的超时（毫秒），没设是 0 */
    readTimeout: (xhr: XMLHttpRequest) => number;
    /**
     * 在实例上盖一层 getter，遮住原型上的真值。
     * `live = true`：真实请求照发，等它走完（readyState 4）才露出假值，过程中的进度仍是真的；
     * `live = false`：没发请求，直接就是「已完成」的假值。
     */
    mask: (xhr: XMLHttpRequest, fake: TXhrFake, url: string, live: boolean) => void;
};

/**
 * `status` / `responseText` 这些是原型上的只读 getter，页面读它们时拿到的是浏览器给的真值。
 * 要让页面看到假的返回，只能在那一个实例上定义同名属性盖住。
 */
export function createXhrFaker(pageWindow: TXhrWindow): TXhrFaker {
    const proto = pageWindow.XMLHttpRequest.prototype;

    function protoGetter<T>(name: string): (xhr: XMLHttpRequest) => T | undefined {
        const getter = Object.getOwnPropertyDescriptor(proto, name)?.get;
        return (xhr) => (getter === undefined ? undefined : (getter.call(xhr) as T));
    }
    const getReadyState = protoGetter<number>("readyState");
    const getStatus = protoGetter<number>("status");
    const getStatusText = protoGetter<string>("statusText");
    const getResponse = protoGetter<unknown>("response");
    const getResponseText = protoGetter<string>("responseText");
    const getResponseURL = protoGetter<string>("responseURL");
    const getResponseType = protoGetter<XMLHttpRequestResponseType>("responseType");
    const getTimeout = protoGetter<number>("timeout");
    const realGetResponseHeader = proto.getResponseHeader;
    const realGetAllResponseHeaders = proto.getAllResponseHeaders;

    // 页面按 responseType 读 response，假的也得给成对应的类型
    function fakeResponseValue(xhr: XMLHttpRequest, body: string): unknown {
        switch (getResponseType(xhr)) {
            case "json":
                try {
                    return JSON.parse(body);
                } catch {
                    return null;
                }
            case "blob":
                return new (pageWindow.Blob ?? Blob)([body], { type: contentTypeOf(body) });
            case "arraybuffer":
                return new (pageWindow.TextEncoder ?? TextEncoder)().encode(body).buffer;
            case "document":
                return null;
            default:
                return body;
        }
    }

    function readRealBody(xhr: XMLHttpRequest): string | undefined {
        try {
            const type = getResponseType(xhr);
            if (type === "" || type === "text" || type === undefined) {
                return getResponseText(xhr);
            }
            if (type === "json") {
                const value = getResponse(xhr);
                return value === null || value === undefined ? undefined : JSON.stringify(value);
            }
        } catch {
            // 读不出来就当没有
        }
        return;
    }

    return {
        readReal(xhr) {
            let headers = "";
            try {
                headers = realGetAllResponseHeaders.call(xhr);
            } catch {
                // 请求还没发出时读响应头会抛错
            }
            return { status: getStatus(xhr) ?? 0, body: readRealBody(xhr), headers };
        },
        readTimeout(xhr) {
            return getTimeout(xhr) ?? 0;
        },
        mask(xhr, fake, url, live) {
            const done = (): boolean => !live || getReadyState(xhr) === 4;
            const failed = fake.status === 0;
            const body = failed ? "" : fake.body;
            const contentType = contentTypeOf(body);
            function define<T>(name: string, fakeValue: () => T, realValue: (target: XMLHttpRequest) => T | undefined): void {
                Object.defineProperty(xhr, name, {
                    configurable: true,
                    get: () => (done() ? fakeValue() : realValue(xhr)),
                });
            }
            if (!live) {
                Object.defineProperty(xhr, "readyState", { configurable: true, get: () => 4 });
            }
            define("status", () => fake.status, getStatus);
            define("statusText", () => statusReason(fake.status), getStatusText);
            define("responseText", () => body, getResponseText);
            define("response", () => fakeResponseValue(xhr, body), getResponse);
            define("responseURL", () => (failed ? "" : url), getResponseURL);
            xhr.getResponseHeader = (name: string): string | null => {
                if (!done()) {
                    return realGetResponseHeader.call(xhr, name);
                }
                return !failed && name.toLowerCase() === "content-type" ? contentType : null;
            };
            xhr.getAllResponseHeaders = (): string => {
                if (!done()) {
                    return realGetAllResponseHeaders.call(xhr);
                }
                return failed ? "" : `content-type: ${contentType}\r\n`;
            };
        },
    };
}
