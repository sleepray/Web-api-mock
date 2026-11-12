import { afterEach, describe, expect, it, vi } from "vitest";

import { checkForUpdate, evaluateUpdateManifest } from "./update-check";

const kManifestUrl = "https://updates.example/nri/beta/update.json";

function manifest(version: unknown): string {
    return JSON.stringify({ name: "nri", version, files: {} });
}

/** Installs a GM_xmlhttpRequest stub that answers through the request callbacks. */
function stubRequest(reply: (details: Tampermonkey.Request) => void) {
    const request = vi.fn(reply);
    vi.stubGlobal("GM_xmlhttpRequest", request);
    return request;
}

function respond(details: Tampermonkey.Request, { status, responseText }: { status: number; responseText: string }) {
    const response = { status, responseText } as Tampermonkey.Response<object>;
    details.onload?.call(response, response);
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("evaluateUpdateManifest", () => {
    it("offers a strictly newer version only", () => {
        expect(evaluateUpdateManifest({ body: manifest("0.3.1"), currentVersion: "0.3.0" })).toEqual({
            status: "available",
            version: "0.3.1",
        });
        expect(evaluateUpdateManifest({ body: manifest("0.3.0"), currentVersion: "0.3.0" })).toEqual({ status: "up-to-date" });
        expect(evaluateUpdateManifest({ body: manifest("0.2.9"), currentVersion: "0.3.0" })).toEqual({ status: "up-to-date" });
    });

    // The beta channel also carries stable releases, so a beta install must
    // see the matching stable version as newer.
    it("orders prereleases by SemVer precedence", () => {
        expect(evaluateUpdateManifest({ body: manifest("0.3.0"), currentVersion: "0.3.0-beta.2" }).status).toBe("available");
        expect(evaluateUpdateManifest({ body: manifest("0.3.0-beta.10"), currentVersion: "0.3.0-beta.9" }).status).toBe(
            "available",
        );
        expect(evaluateUpdateManifest({ body: manifest("0.3.0-rc.1"), currentVersion: "0.3.0" }).status).toBe("up-to-date");
    });

    it.each([
        ["not JSON", "<html>", /not valid JSON/],
        ["null", "null", /no version/],
        ["missing version", JSON.stringify({ files: {} }), /no version/],
        ["numeric version", manifest(3), /no version/],
        ["malformed version", manifest("0.3.0(abc1234)"), /Invalid version/],
    ])("reports a failure for %s instead of claiming up to date", (_, body, reason) => {
        const result = evaluateUpdateManifest({ body, currentVersion: "0.3.0" });
        expect(result.status).toBe("failed");
        expect(result.status === "failed" ? result.reason : "").toMatch(reason);
    });
});

describe("checkForUpdate", () => {
    it("requests the channel manifest and evaluates it", async () => {
        const request = stubRequest((details) => respond(details, { status: 200, responseText: manifest("0.4.0") }));
        await expect(checkForUpdate({ manifestUrl: kManifestUrl, currentVersion: "0.3.0" })).resolves.toEqual({
            status: "available",
            version: "0.4.0",
        });
        expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: "GET", url: kManifestUrl }));
    });

    it("turns HTTP errors, network errors and timeouts into failures", async () => {
        stubRequest((details) => respond(details, { status: 404, responseText: "" }));
        await expect(checkForUpdate({ manifestUrl: kManifestUrl, currentVersion: "0.3.0" })).resolves.toEqual({
            status: "failed",
            reason: "Update server returned HTTP 404",
        });

        stubRequest((details) => {
            const error = {} as Tampermonkey.ErrorResponse;
            details.onerror?.call(error, error);
        });
        await expect(checkForUpdate({ manifestUrl: kManifestUrl, currentVersion: "0.3.0" })).resolves.toMatchObject({
            status: "failed",
            reason: "Could not reach the update server",
        });

        stubRequest((details) => details.ontimeout?.());
        await expect(checkForUpdate({ manifestUrl: kManifestUrl, currentVersion: "0.3.0" })).resolves.toMatchObject({
            status: "failed",
            reason: "Update check timed out",
        });
    });

    it("fails cleanly when GM_xmlhttpRequest is not granted", async () => {
        await expect(checkForUpdate({ manifestUrl: kManifestUrl, currentVersion: "0.3.0" })).resolves.toMatchObject({
            status: "failed",
        });
    });
});
