/** Mock 规则：按「方法 + 地址里的一段」匹配请求，命中后改写它的返回。 */

export type TMockMode =
    /** 拦截：请求不发到服务器，直接给假的返回 */
    | "block"
    /** 放行：请求照常发出并执行，只把页面看到的返回换掉 */
    | "rewrite"
    /** 挂起：不发请求，也一直不返回 */
    | "hang";

export const kMockMethods = ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type TMockMethod = (typeof kMockMethods)[number];

export type TMockRule = {
    id: string;
    on: boolean;
    method: TMockMethod;
    /** 地址里包含的一段；以 `re:` 开头的按正则匹配 */
    match: string;
    /** 200–599；0 表示网络错误（断网、连接被重置） */
    status: number;
    body: string;
    mode: TMockMode;
    /** 等多少毫秒再返回 */
    delay: number;
    /** 最多命中几次，之后放行；0 = 不限 */
    times: number;
    hits: number;
    /** 建规则时带入的真实返回，留给 Reset 用；手动新建的规则没有 */
    orig?: { status: number; body: string };
};

export const kDefaultMockStatus = 500;
export const kDefaultMockBody = '{"code":500,"message":"Internal Server Error (mock)"}';

function toInt(value: unknown): number {
    const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN;
}

/** 0（网络错误）或 200–599 才算能用的状态码 */
export function isValidMockStatus(value: unknown): boolean {
    const status = toInt(value);
    return status === 0 || (status >= 200 && status <= 599);
}

export function createRuleId(): string {
    return Math.random().toString(36).slice(2, 10);
}

/**
 * 把任意来源（表单输入、localStorage 里的旧数据）收拾成一条合法的规则。
 * 缺的、不合法的字段落回默认值：读坏的数据不能让拦截出错。
 */
export function normalizeRule(raw: unknown): TMockRule {
    const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const method = String(r.method ?? "").toUpperCase();
    const orig = (typeof r.orig === "object" && r.orig !== null ? r.orig : undefined) as
        | Record<string, unknown>
        | undefined;
    const rule: TMockRule = {
        id: typeof r.id === "string" && r.id !== "" ? r.id : createRuleId(),
        on: r.on !== false,
        method: (kMockMethods as readonly string[]).includes(method) ? (method as TMockMethod) : "ANY",
        match: typeof r.match === "string" ? r.match : "",
        status: isValidMockStatus(r.status) ? toInt(r.status) : kDefaultMockStatus,
        body: typeof r.body === "string" ? r.body : kDefaultMockBody,
        mode: r.mode === "rewrite" || r.mode === "hang" ? r.mode : "block",
        delay: Math.max(0, toInt(r.delay) || 0),
        times: Math.max(0, toInt(r.times) || 0),
        hits: Math.max(0, toInt(r.hits) || 0),
    };
    if (orig !== undefined && typeof orig.body === "string") {
        rule.orig = {
            status: isValidMockStatus(orig.status) ? toInt(orig.status) : 200,
            body: orig.body,
        };
    }
    return rule;
}

/** 默认是「地址里包含这一段」；`re:` 开头按正则。空的匹配条件不匹配任何请求，免得一条空规则拦下所有接口。 */
export function urlMatches(pattern: string, url: string): boolean {
    const trimmed = pattern.trim();
    if (trimmed === "") {
        return false;
    }
    if (trimmed.startsWith("re:")) {
        try {
            return new RegExp(trimmed.slice(3)).test(url);
        } catch {
            return false;
        }
    }
    return url.includes(trimmed);
}

export function isUsedUp(rule: TMockRule): boolean {
    return rule.times > 0 && rule.hits >= rule.times;
}

/** 这条规则管不管得到这个请求。不看是否启用、是否用完：关着的规则也算「已经有规则了」。 */
export function ruleCovers(rule: TMockRule, method: string, url: string): boolean {
    return (rule.method === "ANY" || rule.method === method.toUpperCase()) && urlMatches(rule.match, url);
}

/** 这次请求该用哪条规则：第一条启用着、没用完、又匹配得上的。 */
export function pickRule({
    rules,
    paused,
    method,
    url,
}: {
    rules: readonly TMockRule[];
    paused: boolean;
    method: string;
    url: string;
}): TMockRule | undefined {
    if (paused) {
        return;
    }
    return rules.find((rule) => rule.on && !isUsedUp(rule) && ruleCovers(rule, method, url));
}

/** 正在生效的规则条数，显示在角标上提醒「还开着」 */
export function countActiveRules(rules: readonly TMockRule[], paused: boolean): number {
    if (paused) {
        return 0;
    }
    return rules.filter((rule) => rule.on && rule.match.trim() !== "" && !isUsedUp(rule)).length;
}

/** 放行模式遇上「网络错误」没有意义（没有可改写的返回），按拦截处理 */
export function effectiveMode(rule: TMockRule): TMockMode {
    return rule.mode === "rewrite" && rule.status === 0 ? "block" : rule.mode;
}
