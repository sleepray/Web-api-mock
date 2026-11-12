import fs from "node:fs";
import path from "node:path";

import { defineConfig, type Plugin } from "tsdown";

import { parseChangelog } from "./src/changelog.ts";

import {
  getDevScriptUrl,
  kDevScriptPath,
  resolveDevServerPort,
} from "./dev-shared.mts";

export const kDevServerPort = resolveDevServerPort();
export { kDevScriptPath };
export const kDevScriptUrl = getDevScriptUrl(kDevServerPort);

const kDevOutDir = "dist/dev";
const kRepoRoot = path.dirname(new URL(import.meta.url).pathname);

/** Prod outputs: the script and a metadata-only .meta.js that Tampermonkey polls for updates. */
export const kProdScriptFileName = "network-request-inspector.user.js";
export const kProdMetaFileName = "network-request-inspector.meta.js";

/**
 * 更新源是 GitHub 仓库里入库的构建产物：<base>/<分支>/dist/prod/<文件>。
 * 通道对应分支：latest 读 main，beta 读 beta；发布时两个分支一起推。
 */
const kUpdateRepoRawBaseUrl = "https://raw.githubusercontent.com/sleepray/Web-api-mock";
const kUpdateChannelBranch = { latest: "main", beta: "beta" } as const;
/** 入库的产物目录，和 tsdown.prod.config.mts 的 outDir 一致 */
export const kProdOutDir = "dist/prod";
/** 面板内检查更新读的清单，只有一个 version 字段 */
export const kProdManifestFileName = "update.json";
/** 脚本身份：和原版 NRI 不同名、不同命名空间，两者才不会被 Tampermonkey 当成同一个脚本 */
export const kScriptName = "Network Request Inspector + Mock";
const kScriptNamespace = "https://github.com/sleepray/Web-api-mock";

/**
 * Tampermonkey's @version comparison agrees with SemVer only on this subset:
 * prerelease suffixes are alpha/beta/rc plus a number ("alpha.beta" orders differently).
 */
const kUserScriptVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:alpha|beta|rc)\.[1-9]\d*)?$/;

function getPackageVersion(): string {
  const packageJsonPath = path.join(kRepoRoot, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  if (
    typeof packageJson.version !== "string" ||
    packageJson.version.trim() === ""
  ) {
    throw new Error("Version not found in package.json");
  }
  if (!kUserScriptVersionPattern.test(packageJson.version)) {
    throw new Error(
      `Invalid package.json version ${JSON.stringify(packageJson.version)}: expected X.Y.Z or X.Y.Z-(alpha|beta|rc).N`,
    );
  }
  return packageJson.version;
}

/** Userscript @version is the plain version; a commit hash would make update ordering arbitrary. */
export function getUserScriptVersion(): string {
  return getPackageVersion();
}

function getUpdateUrl(channel: "latest" | "beta", fileName: string): string {
  return `${kUpdateRepoRawBaseUrl}/${kUpdateChannelBranch[channel]}/${kProdOutDir}/${fileName}`;
}

function getUpdateChannelUrls(channel: "latest" | "beta") {
  return {
    manifestUrl: getUpdateUrl(channel, kProdManifestFileName),
    installUrl: getUpdateUrl(channel, kProdScriptFileName),
  };
}

/**
 * Injects `const __NRI_BUILD__` (see src/version.ts). Every version is unique,
 * so the panel shows it as is. Only prod builds carry update URLs; dev builds
 * are served by the dev-server and have nothing to update from.
 */
export function createBuildInfoPlugin({ dev }: { dev: boolean }): Plugin {
  const version = getPackageVersion();
  // Parsed here so the userscript ships the notes, not a markdown parser.
  const changelog = parseChangelog(
    fs.readFileSync(path.join(kRepoRoot, "CHANGELOG.md"), "utf-8"),
  );
  const buildInfo = dev
    ? { version, dev: true, changelog }
    : {
        version,
        changelog,
        update: {
          latest: getUpdateChannelUrls("latest"),
          beta: getUpdateChannelUrls("beta"),
        },
      };
  return {
    name: "nri-build-info",
    generateBundle(_, bundle) {
      const inject = `const __NRI_BUILD__ = ${JSON.stringify(buildInfo)};\n`;
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type !== "chunk") {
          continue;
        }
        chunk.code = `${inject}${chunk.code}`;
      }
    },
  };
}

type TUserScriptHeaderOptions = {
  isDevProxy?: boolean;
  /** Adds @updateURL / @downloadURL and the grant for the in-panel update check; prod script only. */
  includeUpdateUrls?: boolean;
};

/** The userscript metadata block, which is also the whole .meta.js. */
export function getUserScriptMetaBlock(
  name: string,
  options?: TUserScriptHeaderOptions,
): string {
  const isDevProxy = options?.isDevProxy === true;
  const includeUpdateUrls = options?.includeUpdateUrls === true;
  // Every build, beta or not, lets Tampermonkey auto-update from latest only.
  // Betas come from the in-panel check when the user opts in; an installed
  // beta then moves on to the next higher release by itself.
  const updateBlock = includeUpdateUrls
    ? `// @updateURL    ${getUpdateUrl("latest", kProdMetaFileName)}
// @downloadURL  ${getUpdateUrl("latest", kProdScriptFileName)}
`
    : "";
  // Page CSP and CORS can block a page-level fetch, so the update check reads update.json via GM_xmlhttpRequest.
  const updateGrantBlock = includeUpdateUrls
    ? `// @grant        GM_xmlhttpRequest
// @connect      ${new URL(kUpdateRepoRawBaseUrl).host}
`
    : "";
  const grantBlock = isDevProxy
    ? `// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @connect      localhost
// @connect      127.0.0.1
`
    : `// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
${updateGrantBlock}`;

  return `
// ==UserScript==
// @name         ${name}
// @namespace    ${kScriptNamespace}
// @version      ${getUserScriptVersion()}
// @description  Inspect page fetch/XHR requests, copy them, and mock their responses with rules
// @author       Sower
${updateBlock}// @match        *://*/*
// @run-at       document-start
// @noframes
${grantBlock}// ==/UserScript==
`.trimStart();
}

export function getUserScriptHeader(
  name: string,
  options?: TUserScriptHeaderOptions,
): string {
  return `${getUserScriptMetaBlock(name, options)}\n"use strict";\n`;
}

function createHeaderPlugin(options: {
  scriptName: string;
  isDevProxy?: boolean;
  injectDevScriptUrl?: boolean;
}): Plugin {
  return {
    name: `nri-header-${options.scriptName}`,
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type !== "chunk") {
          continue;
        }
        const header = getUserScriptHeader(options.scriptName, {
          isDevProxy: options.isDevProxy,
        });
        const inject =
          options.injectDevScriptUrl === true
            ? `const __NRI_DEV_SCRIPT_URL__ = ${JSON.stringify(kDevScriptUrl)};\n`
            : "";
        chunk.code = `${header}\n${inject}${chunk.code}`;
      }
    },
  };
}

// tsdown names iife output "[name].iife.js"; Tampermonkey only offers to install
// URLs ending in ".user.js", so keep the entry basename as is.
export const kUserScriptOutputOptions = { entryFileNames: "[name].js" };

// - main script: plain IIFE for proxy inject — NO userscript header
// - proxy script: only file installed in TM, needs full header + grants
// Entry basenames become outputs:
//   network-request-inspector.user.js / dev-proxy.user.js
export default defineConfig([
  {
    entry: "src/network-request-inspector.user.ts",
    format: "iife",
    platform: "browser",
    outDir: kDevOutDir,
    outputOptions: kUserScriptOutputOptions,
    clean: true,
    minify: false,
    sourcemap: false,
    treeshake: false,
    // no userscript header: served via GM_xmlhttpRequest + GM_addElement inject
    plugins: [createBuildInfoPlugin({ dev: true })],
  },
  {
    entry: "src/dev-proxy.user.ts",
    format: "iife",
    platform: "browser",
    outDir: kDevOutDir,
    outputOptions: kUserScriptOutputOptions,
    clean: false,
    minify: false,
    sourcemap: false,
    treeshake: false,
    plugins: [
      createBuildInfoPlugin({ dev: true }),
      createHeaderPlugin({
        scriptName: `${kScriptName} (dev-proxy)`,
        isDevProxy: true,
        injectDevScriptUrl: true,
      }),
    ],
  },
]);
