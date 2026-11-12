/** Dev-server + tsdown 共用：.env 加载、端口与脚本 URL 单一来源 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

export const kDefaultDevServerPort = 3010;
export const kDevScriptPath = "/network-request-inspector.user.js";

const kRepoRoot = path.dirname(fileURLToPath(import.meta.url));

let gDevEnvLoaded = false;

/**
 * 加载仓库根目录 `.env` / `.env.local`。
 * - 文件优先级：`.env.local` > `.env`（同 key 以 local 为准）
 * - 已存在于 `process.env` 的键不覆盖（命令行 / 系统环境优先）
 */
export function loadDevEnv(rootDir = kRepoRoot): void {
    if (gDevEnvLoaded) {
        return;
    }
    gDevEnvLoaded = true;

    // path 数组：先出现的文件值优先；默认不 override 已有 process.env
    loadDotenv({
        path: [
            path.join(rootDir, ".env.local"),
            path.join(rootDir, ".env"),
        ],
        quiet: true,
    });
}

/**
 * 解析开发服务器端口。
 * 优先 `NRI_DEV_PORT`，其次 `PORT`；未设置则用默认 3010。
 * 会先尝试加载 `.env` / `.env.local`。
 */
export function resolveDevServerPort(
    env: NodeJS.ProcessEnv = process.env,
): number {
    loadDevEnv();

    const raw = env.NRI_DEV_PORT ?? env.PORT;
    if (raw == null || raw.trim() === "") {
        return kDefaultDevServerPort;
    }

    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(
            `Invalid dev server port (NRI_DEV_PORT/PORT): ${JSON.stringify(raw)}`,
        );
    }
    return port;
}

export function getDevScriptUrl(port = resolveDevServerPort()): string {
    return `http://localhost:${port}${kDevScriptPath}`;
}