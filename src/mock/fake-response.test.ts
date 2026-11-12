import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { contentTypeOf, createFakeResponse, fakeResponseHeaders, waitOrAbort } from "./fake-response";

describe("waitOrAbort", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("resolves after the delay", async () => {
        let done = false;
        void waitOrAbort(300).then(() => {
            done = true;
        });
        await vi.advanceTimersByTimeAsync(299);
        expect(done).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(done).toBe(true);
    });

    it("never resolves for an infinite wait, until the request is aborted", async () => {
        const controller = new AbortController();
        const outcome = waitOrAbort(Infinity, controller.signal).then(
            () => "resolved",
            (reason: unknown) => reason,
        );
        await vi.advanceTimersByTimeAsync(60_000);
        controller.abort();
        const reason = await outcome;
        expect(reason).toBeInstanceOf(DOMException);
        expect((reason as DOMException).name).toBe("AbortError");
    });

    it("rejects with the page's own abort reason, so its timeout handling sees what it expects", async () => {
        const controller = new AbortController();
        const reason = new Error("page timeout");
        const outcome = waitOrAbort(1000, controller.signal).catch((error: unknown) => error);
        controller.abort(reason);
        expect(await outcome).toBe(reason);
    });

    it("rejects at once when the signal was already aborted", async () => {
        const controller = new AbortController();
        controller.abort();
        await expect(waitOrAbort(0, controller.signal)).rejects.toBeInstanceOf(DOMException);
    });
});

describe("contentTypeOf", () => {
    it("guesses JSON from the first character and falls back to plain text", () => {
        expect(contentTypeOf('  {"a":1}')).toBe("application/json");
        expect(contentTypeOf("[1]")).toBe("application/json");
        expect(contentTypeOf("oops")).toBe("text/plain;charset=utf-8");
        expect(contentTypeOf("")).toBe("text/plain;charset=utf-8");
    });
});

describe("createFakeResponse", () => {
    it("carries the rule's status, reason, body and the request URL", async () => {
        const response = createFakeResponse({
            status: 500,
            body: '{"code":500}',
            url: "https://a.test/api",
        });
        expect(response.status).toBe(500);
        expect(response.ok).toBe(false);
        expect(response.statusText).toBe("Internal Server Error");
        expect(response.url).toBe("https://a.test/api");
        expect(response.headers.get("content-type")).toBe("application/json");
        expect(await response.json()).toEqual({ code: 500 });
    });

    it("drops the body for statuses that must not have one instead of throwing", async () => {
        const response = createFakeResponse({ status: 204, body: "ignored", url: "https://a.test/" });
        expect(response.status).toBe(204);
        expect(await response.text()).toBe("");
    });
});

describe("fakeResponseHeaders", () => {
    it("has no headers for a network error", () => {
        expect(fakeResponseHeaders(0, "{}")).toEqual({});
        expect(fakeResponseHeaders(200, "{}")).toEqual({ "content-type": "application/json" });
    });
});
