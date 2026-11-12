import { describe, expect, it } from "vitest";

import { createXhrFaker, kXhrNetworkFailure } from "./fake-xhr";

/** A stand-in for the browser's XHR: read-only getters on the prototype, like the real one. */
class StubXhr {
    real = {
        readyState: 1,
        status: 0,
        statusText: "",
        response: "" as unknown,
        responseText: "",
        responseURL: "",
        responseType: "" as XMLHttpRequestResponseType,
        timeout: 0,
        headers: "",
    };
    get readyState(): number {
        return this.real.readyState;
    }
    get status(): number {
        return this.real.status;
    }
    get statusText(): string {
        return this.real.statusText;
    }
    get response(): unknown {
        return this.real.response;
    }
    get responseText(): string {
        return this.real.responseText;
    }
    get responseURL(): string {
        return this.real.responseURL;
    }
    get responseType(): XMLHttpRequestResponseType {
        return this.real.responseType;
    }
    get timeout(): number {
        return this.real.timeout;
    }
    getResponseHeader(name: string): string | null {
        return name.toLowerCase() === "x-real" ? "yes" : null;
    }
    getAllResponseHeaders(): string {
        return this.real.headers;
    }
}

const faker = createXhrFaker({ XMLHttpRequest: StubXhr as unknown as typeof XMLHttpRequest });

function stub(): { stub: StubXhr; xhr: XMLHttpRequest } {
    const instance = new StubXhr();
    return { stub: instance, xhr: instance as unknown as XMLHttpRequest };
}

function finishReal(target: StubXhr): void {
    target.real = {
        ...target.real,
        readyState: 4,
        status: 200,
        statusText: "OK",
        response: '{"real":true}',
        responseText: '{"real":true}',
        responseURL: "https://a.test/api",
        headers: "x-real: yes\r\n",
    };
}

describe("mask without sending (block)", () => {
    it("presents a finished request with the rule's response", () => {
        const { xhr } = stub();
        faker.mask(xhr, { status: 503, body: '{"code":503}' }, "https://a.test/api", false);
        expect(xhr.readyState).toBe(4);
        expect(xhr.status).toBe(503);
        expect(xhr.statusText).toBe("Service Unavailable");
        expect(xhr.responseText).toBe('{"code":503}');
        expect(xhr.response).toBe('{"code":503}');
        expect(xhr.responseURL).toBe("https://a.test/api");
        expect(xhr.getResponseHeader("Content-Type")).toBe("application/json");
        expect(xhr.getResponseHeader("x-real")).toBeNull();
        expect(xhr.getAllResponseHeaders()).toBe("content-type: application/json\r\n");
    });

    it("shapes `response` to the requested responseType", () => {
        const { stub: target, xhr } = stub();
        target.real.responseType = "json";
        faker.mask(xhr, { status: 200, body: '{"a":1}' }, "https://a.test/api", false);
        expect(xhr.response).toEqual({ a: 1 });
        faker.mask(xhr, { status: 200, body: "not json" }, "https://a.test/api", false);
        expect(xhr.response).toBeNull();
    });

    it("looks like a network failure for status 0: no body, no URL, no headers", () => {
        const { xhr } = stub();
        faker.mask(xhr, kXhrNetworkFailure, "https://a.test/api", false);
        expect(xhr.status).toBe(0);
        expect(xhr.responseText).toBe("");
        expect(xhr.responseURL).toBe("");
        expect(xhr.getAllResponseHeaders()).toBe("");
        expect(xhr.getResponseHeader("content-type")).toBeNull();
    });
});

describe("mask while the real request runs (rewrite)", () => {
    it("shows real progress until the request completes, then the rule's response", () => {
        const { stub: target, xhr } = stub();
        faker.mask(xhr, { status: 500, body: "boom" }, "https://a.test/api", true);
        expect(xhr.readyState).toBe(1);
        expect(xhr.status).toBe(0);
        expect(xhr.getResponseHeader("x-real")).toBe("yes");

        finishReal(target);
        expect(xhr.readyState).toBe(4);
        expect(xhr.status).toBe(500);
        expect(xhr.responseText).toBe("boom");
        expect(xhr.getResponseHeader("x-real")).toBeNull();
        expect(xhr.getResponseHeader("content-type")).toBe("text/plain;charset=utf-8");
    });
});

describe("readReal / readTimeout", () => {
    it("reads the true response even after the instance was masked", () => {
        const { stub: target, xhr } = stub();
        faker.mask(xhr, { status: 500, body: "boom" }, "https://a.test/api", true);
        finishReal(target);
        expect(faker.readReal(xhr)).toEqual({
            status: 200,
            body: '{"real":true}',
            headers: "x-real: yes\r\n",
        });
    });

    it("serialises a JSON response and gives no body for binary ones", () => {
        const { stub: target, xhr } = stub();
        finishReal(target);
        target.real.responseType = "json";
        target.real.response = { real: true };
        expect(faker.readReal(xhr).body).toBe('{"real":true}');
        target.real.responseType = "blob";
        expect(faker.readReal(xhr).body).toBeUndefined();
    });

    it("reads the page's timeout", () => {
        const { stub: target, xhr } = stub();
        target.real.timeout = 3000;
        expect(faker.readTimeout(xhr)).toBe(3000);
    });
});
