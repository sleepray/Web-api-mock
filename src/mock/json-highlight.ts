/**
 * 给规则编辑框里的 JSON 着色，颜色和详情区的 JSON 树一致（同一套 `nri-json-*` 类名）。
 * 编辑中的内容常常是写了一半的、不合法的 JSON，所以不解析，只按词法逐段认：
 * 认不出的字符原样输出，保证着色层和编辑框里的文字一字不差地对齐。
 */

const kTokenPattern =
    /("(?:[^"\\\n]|\\.)*"?)(\s*:)?|(?<![\w.])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w.])|\b(true|false)\b|\b(null)\b|([{}[\],:])/g;

// 只写进元素的文字内容，不进属性，引号不用转义
function escapeHtml(text: string): string {
    return text.replace(/[&<>]/g, (char) => {
        if (char === "&") {
            return "&amp;";
        }
        return char === "<" ? "&lt;" : "&gt;";
    });
}

function span(className: string, text: string): string {
    return `<span class="nri-json-${className}">${escapeHtml(text)}</span>`;
}

/** 返回着好色的 HTML；去掉标签后和输入逐字相同 */
export function highlightJson(text: string): string {
    let html = "";
    let last = 0;
    for (const match of text.matchAll(kTokenPattern)) {
        const index = match.index;
        html += escapeHtml(text.slice(last, index));
        const [whole, str, colon, num, bool, nul, punct] = match;
        if (str !== undefined) {
            // 后面紧跟冒号的字符串是键
            html += span(colon === undefined ? "string" : "key", str);
            if (colon !== undefined) {
                html += escapeHtml(colon.slice(0, -1)) + span("punct", ":");
            }
        } else if (num !== undefined) {
            html += span("number", num);
        } else if (bool !== undefined) {
            html += span("boolean", bool);
        } else if (nul !== undefined) {
            html += span("null", nul);
        } else if (punct !== undefined) {
            html += span("punct", punct);
        }
        last = index + whole.length;
    }
    return html + escapeHtml(text.slice(last));
}
