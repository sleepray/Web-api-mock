import { tr } from "../i18n";

/**
 * 响应体编辑框用的 JSON 校验、修复和排版。
 *
 * 手改响应体时最常见的失误：删多了引号、漏了逗号、多了个尾逗号、括号没配上、键没加引号。
 * 修复器用一个不挑剔的解析器把它读成值，再重新输出成合法的 JSON；读的时候让过的每一步都记下来，
 * 好告诉人修了什么。全是猜的，所以只在人点了才做，界面上要能撤销。
 */

export type TJsonFixKind = "quote" | "comma" | "extra" | "bracket" | "colon" | "other";
export type TJsonFixes = Partial<Record<TJsonFixKind, number>>;

export type TJsonRepair = {
    /** 修好并重新排版后的 JSON */
    text: string;
    fixes: TJsonFixes;
    /** 给人看的一句话，比如 "1 quote, 1 missing comma" */
    summary: string;
};

/** 看着像 JSON（以 `{` 或 `[` 开头）才校验；纯文本、HTML 这类不管 */
export function looksLikeJson(text: string): boolean {
    const first = text.trim().charAt(0);
    return first === "{" || first === "[";
}

/** 像 JSON 却不合法时返回解析器的报错，否则返回空串 */
export function jsonError(text: string): string {
    if (!looksLikeJson(text)) {
        return "";
    }
    try {
        JSON.parse(text.trim());
        return "";
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}

/** [种类, 英文单数, 英文复数, 中文] */
const kFixLabels: readonly [TJsonFixKind, string, string, string][] = [
    ["quote", "quote", "quotes", "引号"],
    ["comma", "missing comma", "missing commas", "补逗号"],
    ["extra", "extra comma", "extra commas", "去掉多余的逗号"],
    ["bracket", "bracket", "brackets", "补括号"],
    ["colon", "colon", "colons", "补冒号"],
    ["other", "other fix", "other fixes", "其它"],
];

function summarize(fixes: TJsonFixes): string {
    const parts = kFixLabels.filter(([kind]) => (fixes[kind] ?? 0) > 0);
    return tr(
        parts.map(([kind, one, many]) => `${fixes[kind]} ${fixes[kind] === 1 ? one : many}`).join(", "),
        parts.map(([kind, , , zh]) => `${zh} ${fixes[kind]} 处`).join("、"),
    );
}

const kPlainEscapes: Record<string, string> = {
    '"': '"',
    "\\": "\\",
    "/": "/",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
    "'": "'",
};

/** 引号的种类：1 直双引号，2 中文双引号，3 直单引号，4 中文单引号，0 不是引号 */
function quoteKind(c: string | undefined): number {
    if (c === '"') {
        return 1;
    }
    if (c === "“" || c === "”") {
        return 2;
    }
    if (c === "'") {
        return 3;
    }
    if (c === "‘" || c === "’") {
        return 4;
    }
    return 0;
}

const kMaxDepth = 200;

/** 修不了（不是以 `{` / `[` 开头、后面还跟着别的内容、嵌套太深）时不返回内容 */
export function repairJson(src: string): TJsonRepair | undefined {
    const n = src.length;
    const fixes: TJsonFixes = {};
    let i = 0;

    function note(kind: TJsonFixKind): void {
        fixes[kind] = (fixes[kind] ?? 0) + 1;
    }

    // 跳过空白和注释
    function skip(): void {
        for (;;) {
            while (i < n && /\s/.test(src[i])) {
                i++;
            }
            if (src[i] === "/" && src[i + 1] === "/") {
                while (i < n && src[i] !== "\n") {
                    i++;
                }
                note("other");
                continue;
            }
            if (src[i] === "/" && src[i + 1] === "*") {
                const end = src.indexOf("*/", i + 2);
                i = end < 0 ? n : end + 2;
                note("other");
                continue;
            }
            return;
        }
    }

    function readString(): string {
        const kind = quoteKind(src[i]);
        // 单引号、中文引号：换成双引号
        if (src[i] !== '"') {
            note("quote");
        }
        i++;
        let out = "";
        for (;;) {
            const c = src[i];
            // 到行尾、到结尾都没等到另一半引号：多半是把它删了，就在这儿收住。
            // 行尾的逗号（结尾处还有括号）不算内容，退回去留给外层当分隔符
            if (i >= n || c === "\n" || c === "\r") {
                const trailing = i >= n ? /[\s}\],]/ : /[ \t,]/;
                let j = i - 1;
                while (j >= 0 && trailing.test(src[j])) {
                    j--;
                }
                out = out.slice(0, Math.max(0, out.length - (i - 1 - j)));
                i = j + 1;
                note("quote");
                return out;
            }
            // 直引号开头的只认同样的直引号收尾（内容里可能有中文引号）；
            // 中文引号开头的，中文引号和对应的直引号都算收尾
            const ck = quoteKind(c);
            if (ck !== 0 && (ck === kind || (ck === kind - 1 && (kind === 2 || kind === 4)))) {
                i++;
                return out;
            }
            if (c === "\\") {
                const d = src[i + 1];
                const hex = src.slice(i + 2, i + 6);
                if (d === "u" && /^[0-9a-fA-F]{4}$/.test(hex)) {
                    out += String.fromCharCode(parseInt(hex, 16));
                    i += 6;
                    continue;
                }
                if (d !== undefined && Object.prototype.hasOwnProperty.call(kPlainEscapes, d)) {
                    out += kPlainEscapes[d];
                    i += 2;
                    continue;
                }
                // 不认识的转义：去掉反斜杠
                out += d ?? "";
                i += 2;
                note("other");
                continue;
            }
            out += c;
            i++;
        }
    }

    // 没加引号的值：true / false / null / 数字，或者一段该加引号的字
    function readBareValue(): unknown {
        // 数字、true / false / null 后面跟着空格：只取这一个，后面的算下一项（[1 2 3] 是三个数，不是一个字符串）
        const literal = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=[ \t])/.exec(
            src.slice(i, i + 64),
        );
        if (literal !== null) {
            const word = literal[0];
            i += word.length;
            if (word === "true" || word === "false") {
                return word === "true";
            }
            return word === "null" ? null : Number(word);
        }
        const start = i;
        while (i < n && !/[,\]}\n\r"]/.test(src[i])) {
            i++;
        }
        const word = src.slice(start, i).trim();
        if (word === "") {
            throw new Error("empty value");
        }
        // 后面紧跟一个引号、引号后面就是分隔符：这是只丢了开头引号的字符串
        if (src[i] === '"' && /^"[ \t]*([,}\]\n\r]|$)/.test(src.slice(i, i + 40))) {
            i++;
            note("quote");
            return word;
        }
        if (word === "true" || word === "false") {
            return word === "true";
        }
        if (word === "null") {
            return null;
        }
        if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(word)) {
            return Number(word);
        }
        const low = word.toLowerCase();
        if (low === "true" || low === "false") {
            note("other");
            return low === "true";
        }
        if (low === "null" || low === "none" || low === "nil" || low === "undefined") {
            note("other");
            return null;
        }
        if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(word)) {
            note("other");
            return Number(word);
        }
        note("quote");
        return word;
    }

    function readBareKey(): string {
        const start = i;
        while (i < n && !/[:=\n\r,}\]]/.test(src[i])) {
            i++;
        }
        return src
            .slice(start, i)
            .trim()
            .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
    }

    function readAny(depth: number): unknown {
        if (depth > kMaxDepth) {
            throw new Error("too deep");
        }
        skip();
        const c = src[i];
        if (c === "{") {
            return readObject(depth);
        }
        if (c === "[") {
            return readArray(depth);
        }
        return quoteKind(c) !== 0 ? readString() : readBareValue();
    }

    function readObject(depth: number): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        i++;
        for (;;) {
            const at = i;
            skip();
            if (i >= n) {
                note("bracket");
                return result;
            }
            const c = src[i];
            if (c === "}") {
                i++;
                return result;
            }
            // 括号没配上：这个对象到此为止，那个 ] 留给外层
            if (c === "]") {
                note("bracket");
                return result;
            }
            if (c === ",") {
                i++;
                note("extra");
                continue;
            }
            let key: string;
            if (quoteKind(c) !== 0) {
                key = readString();
            } else {
                key = readBareKey();
                // 孤零零的冒号之类：跳过去
                if (key === "") {
                    i++;
                    note("other");
                    continue;
                }
                note("quote");
            }
            skip();
            if (src[i] === ":") {
                i++;
            } else if (src[i] === "=") {
                i += src[i + 1] === ">" ? 2 : 1;
                note("colon");
            } else {
                note("colon");
            }
            skip();
            let value: unknown;
            // 冒号后面什么都没有：给个 null
            if (i >= n || src[i] === "," || src[i] === "}" || src[i] === "]") {
                value = null;
                note("other");
            } else {
                value = readAny(depth + 1);
            }
            // 用 defineProperty：键叫 __proto__ 时直接赋值会改原型而不是加字段
            Object.defineProperty(result, key, {
                value,
                enumerable: true,
                writable: true,
                configurable: true,
            });
            skip();
            if (src[i] === ",") {
                i++;
                skip();
                // 最后一项后面多了个逗号
                if (src[i] === "}" || i >= n) {
                    note("extra");
                }
            } else if (i < n && src[i] !== "}" && src[i] !== "]") {
                // 两项之间漏了逗号
                note("comma");
            }
            // 保险：无论如何都要往前走
            if (i === at) {
                i++;
            }
        }
    }

    function readArray(depth: number): unknown[] {
        const result: unknown[] = [];
        i++;
        for (;;) {
            const at = i;
            skip();
            if (i >= n) {
                note("bracket");
                return result;
            }
            const c = src[i];
            if (c === "]") {
                i++;
                return result;
            }
            if (c === "}") {
                note("bracket");
                return result;
            }
            if (c === ",") {
                i++;
                note("extra");
                continue;
            }
            if (c === ":") {
                i++;
                note("other");
                continue;
            }
            result.push(readAny(depth + 1));
            skip();
            if (src[i] === ",") {
                i++;
                skip();
                if (src[i] === "]" || i >= n) {
                    note("extra");
                }
            } else if (i < n && src[i] !== "]" && src[i] !== "}") {
                note("comma");
            }
            if (i === at) {
                i++;
            }
        }
    }

    let value: unknown;
    try {
        skip();
        if (src[i] !== "{" && src[i] !== "[") {
            return;
        }
        value = readAny(0);
        skip();
        // 后面只剩多出来的括号、逗号、分号可以不管；还有别的内容就不猜了
        while (i < n && /[\]}\s,;]/.test(src[i])) {
            if (!/\s/.test(src[i])) {
                note("other");
            }
            i++;
        }
        if (i < n) {
            return;
        }
    } catch {
        return;
    }
    return { text: JSON.stringify(value, null, 2), fixes, summary: summarize(fixes) };
}

export type TJsonFormatResult =
    /** 排好版的文本；`fixed` 有值说明原文写坏了，是修过的 */
    | { text: string; fixed?: string }
    | { error: string };

/** 「格式化」和「自动修复」是同一个动作：合法的重新排版；写坏了的先试着修好再排版 */
export function formatJson(text: string): TJsonFormatResult {
    const trimmed = text.trim();
    if (!looksLikeJson(trimmed)) {
        return { error: tr("The body is not JSON, so there is nothing to format", "响应体不是 JSON，没有可以排版的") };
    }
    try {
        return { text: JSON.stringify(JSON.parse(trimmed), null, 2) };
    } catch {
        const repaired = repairJson(trimmed);
        if (repaired === undefined) {
            return { error: tr("This JSON cannot be repaired automatically; fix it by hand", "这段 JSON 自动修不了，得照着提示手动改") };
        }
        return { text: repaired.text, fixed: repaired.summary };
    }
}

/** 压成一行的 JSON 没法改，带入规则时排一下版；不是 JSON 就原样返回 */
export function prettyJson(text: string): string {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text;
    }
}
