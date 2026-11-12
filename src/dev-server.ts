import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    getDevScriptUrl,
    kDevScriptPath,
    resolveDevServerPort,
} from "../dev-shared.mts";

const kDevServerPort = resolveDevServerPort();
const kScriptPath = kDevScriptPath;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kDistScript = path.resolve(
    __dirname,
    "../dist/dev/network-request-inspector.user.js",
);

function sendNoCacheHeaders(res: http.ServerResponse): void {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Access-Control-Allow-Origin", "*");
}

function launchDevServer(): void {
    const server = http.createServer((req, res) => {
        const url = req.url ?? "/";
        const pathname = url.split("?")[0] ?? "/";

        if (pathname === kScriptPath || pathname === "/") {
            if (!fs.existsSync(kDistScript)) {
                sendNoCacheHeaders(res);
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain; charset=utf-8");
                res.end(
                    `Script not found: ${kDistScript}\nRun "pnpm build:dev" / "pnpm dev" first.`,
                );
                return;
            }

            sendNoCacheHeaders(res);
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/javascript; charset=utf-8");
            fs.createReadStream(kDistScript).pipe(res);
            return;
        }

        res.statusCode = 404;
        res.end("Not found");
    });

    server.listen(kDevServerPort, () => {
        console.log(
            `[nri-dev-server] listening on http://localhost:${kDevServerPort}`,
        );
        console.log(`[nri-dev-server] script: ${getDevScriptUrl(kDevServerPort)}`);
    });
}

launchDevServer();