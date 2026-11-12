import { defineConfig, type Plugin } from "tsdown";

import {
    createBuildInfoPlugin,
    getUserScriptHeader,
    getUserScriptMetaBlock,
    getUserScriptVersion,
    kProdManifestFileName,
    kProdMetaFileName,
    kProdOutDir,
    kProdScriptFileName,
    kScriptName,
    kUserScriptOutputOptions,
} from "./tsdown.dev.config.mts";

function createProdHeaderPlugin(): Plugin {
    return {
        name: "add-user-script-header",
        generateBundle(_, bundle) {
            const headerOptions = { includeUpdateUrls: true };
            for (const fileName in bundle) {
                const chunk = bundle[fileName];
                if (chunk.type === "chunk") {
                    chunk.code = `${getUserScriptHeader(
                        kScriptName,
                        headerOptions,
                    )}\n${chunk.code}`;
                }
            }
            if (!(kProdScriptFileName in bundle)) {
                throw new Error(`Missing prod output ${kProdScriptFileName}`);
            }
            // Tampermonkey fetches @updateURL to compare @version and downloads the script only when newer
            this.emitFile({
                type: "asset",
                fileName: kProdMetaFileName,
                source: getUserScriptMetaBlock(kScriptName, headerOptions),
            });
            // 面板内「检查更新」读这个清单比较版本号
            this.emitFile({
                type: "asset",
                fileName: kProdManifestFileName,
                source: `${JSON.stringify({ version: getUserScriptVersion() })}\n`,
            });
        },
    };
}

export default defineConfig({
    entry: "src/network-request-inspector.user.ts",
    format: "iife",
    platform: "browser",
    outDir: kProdOutDir,
    outputOptions: kUserScriptOutputOptions,
    clean: true,
    minify: true,
    sourcemap: false,
    treeshake: true,
    // Build info first, then the header wraps everything
    plugins: [createBuildInfoPlugin({ dev: false }), createProdHeaderPlugin()],
});
