// ==UserScript==
// @name         接口报错模拟
// @namespace    https://github.com/sleepray/Web-api-mock
// @version      1.11.0
// @description  按规则把指定接口的返回改成 500、超时、空数据等，用来测前端的异常处理。只在浏览器这一侧生效。
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      raw.githubusercontent.com
// @sandbox      raw
// @homepageURL  https://github.com/sleepray/Web-api-mock
// @updateURL    https://raw.githubusercontent.com/sleepray/Web-api-mock/main/mock-error.user.js
// @downloadURL  https://raw.githubusercontent.com/sleepray/Web-api-mock/main/mock-error.user.js
// ==/UserScript==

/*
 * 安装：浏览器装 Tampermonkey，打开 https://raw.githubusercontent.com/sleepray/Web-api-mock/main/mock-error.user.js
 * 更新：点面板右上角「⋯」里的「检查更新」（有新版时标题栏会出现「更新到 x.y.z」），在打开的 Tampermonkey 页面里点「更新」，
 *       再刷新页面。脚本没法自己替换自己，所以最后那一下得人点。Tampermonkey 每天也会自己查一次。
 * 发布：改完把 @version 调大，推到仓库的 main 分支。
 *
 * 做什么：劫持页面里的 fetch 和 XMLHttpRequest，命中规则的请求返回伪造的内容。
 *
 * 三种模式，差别很大：
 *   拦截（block）  —— 请求根本不发到服务器，页面直接拿到假的返回。后端什么都没发生，安全。
 *   放行（rewrite）—— 请求照常发到服务器并执行，只把页面看到的返回改掉。
 *                     模拟的是「服务端已处理、前端却收到失败」，下单、支付、审批这类接口照样会真的生效。
 *   挂起（hang）   —— 请求不发到服务器，也一直不返回。用来看加载中的样子和前端的超时处理。
 *
 * 状态码填 0 表示网络错误（断网 / 连接被重置），一律按拦截处理。
 *
 * 「建规则」会把这个接口最近一次真实返回的状态码和响应体带进来，在它上面改。
 * 所以刚建好的规则返回的和原来一样，要报错得自己把状态码改成 500。
 *
 * 管不到的：页面跳转、<a>/<form> 触发的下载、图片脚本等静态资源、WebSocket、Service Worker 里发的请求。
 *
 * 所有 http / https 网址都运行（见头部的 @match）。没有规则的站点上只是给 fetch / XHR 套了一层、
 * 记一下最近的请求，不改任何返回。不想让它出现的站点，在 Tampermonkey 该脚本的「设置 → 用户排除」里加。
 *
 * 规则存在当前域名的 localStorage 里，各站点互不影响；不往任何地方发数据。
 * 最近的请求（含抓到的响应体）在离开页面时存进 sessionStorage，刷新后还在，关掉标签页就没了。
 * 必须 document-start + 在页面的 JS 环境里运行（@sandbox raw）：要赶在页面自己的脚本之前换掉 fetch。
 * 为了在 Tampermonkey 弹出菜单里加「显示 / 隐藏 Mock 按钮」声明了 GM_ 权限，所以页面的 window 要从
 * unsafeWindow 取（见下面的 W）。如果哪天规则不生效了，把头部的 @grant / @sandbox / @connect 这几行换回一行
 * 「@grant none」就退回老写法：菜单项没了、「检查更新」只会打开脚本地址，其它功能不变。
 */
(function () {
  "use strict";
  // 声明了 GM_ 权限后，Tampermonkey 给脚本的 window 是一层沙箱代理，往它上面挂 fetch 页面看不到；
  // 页面真正的 window 是 unsafeWindow。手动注入或 @grant none 时没有 unsafeWindow，window 就是页面的。
  const W = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (W.__apiMockErr) return;
  W.__apiMockErr = true;

  const KEY = "__api_mock_err__";
  const LEGACY_KEY = "__fomo_mock_err__";     // 1.8 及以前存规则用的 key，见 migrateLegacy()
  const UPDATE_URL = "https://raw.githubusercontent.com/sleepray/Web-api-mock/main/mock-error.user.js";    // 和头部的 @updateURL 一致
  // 正在跑的这一份的版本号。Tampermonkey 给的，手动注入时没有
  const VERSION = (typeof GM_info !== "undefined" && GM_info && GM_info.script && GM_info.script.version) || "";
  const RECENT_MAX = 60;       // 最近的请求留多少条（接口）
  const NOISE_MAX = 20;        // 页面预取、静态资源另算，最多留这么多，免得把接口挤掉
  const RECENT_KEY = "__api_mock_recent__";   // 最近的请求存在 sessionStorage 的这个 key 下，见 saveRecent()
  const RECENT_BUDGET = 1000000;   // 存下来的响应体一共不超过这么多字符：sessionStorage 和页面共用配额，别把页面自己的挤爆
  const BODY_MAX = 300000;     // 响应体超过这么多字符就不留：面板里改不动，存进 localStorage 也太占地方
  const DEFAULT_BODY = '{"code":500,"message":"Internal Server Error (mock)"}';
  const STATUS_TEXT = {
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests",
    500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout",
  };
  const DOCK_SIDES = ["left", "right", "top", "bottom"];
  const DOCK_SNAP = 12;        // 松手时按钮离窗口边缘不到这么多像素，就缩进那条边
  const PANEL_W = 580;         // 面板默认宽度；拖面板的侧边可以改，双击侧边恢复
  const PANEL_MIN = 420;
  const PANEL_MAX = 1400;
  const METHODS = ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE"];
  const MODES = [["block", "拦截：不发到服务器"], ["rewrite", "放行：只改返回"], ["hang", "挂起：一直不返回"]];
  // 规则卡上的一排快捷按钮。status ≥ 400 的会把响应体换成对应的报错内容
  const PRESETS = [
    { label: "500", status: 500, tip: "服务器内部错误，响应体换成报错内容" },
    { label: "502", status: 502, tip: "网关错误，响应体换成报错内容" },
    { label: "504", status: 504, tip: "网关超时，响应体换成报错内容" },
    { label: "401", status: 401, tip: "未登录 / 登录失效，响应体换成报错内容" },
    { label: "403", status: 403, tip: "没有权限，响应体换成报错内容" },
    { label: "断网", status: 0, tip: "网络错误：请求发不出去" },
    { label: "慢 3 秒", delay: 3000, tip: "其它不变，等 3 秒再返回" },
    { label: "空列表", empty: true, tip: "返回 200，把响应体里的列表清空（要先用「建规则」带入原返回）" },
    { label: "不返回", hang: true, tip: "请求一直挂着：看加载中的样子，和前端自己的超时提示" },
  ];

  migrateLegacy();
  let state = load();          // { paused, rules, ui }
  const recent = [];           // 最近的请求，供「用它建规则」。新的在前
  let ui = null;               // 面板建好后才有
  let menuId = null;           // Tampermonkey 弹出菜单里那一项的 id
  loadRecent();

  // ───────────────────────── 规则 ─────────────────────────

  function normRule(r) {
    const status = parseInt(r.status, 10);
    return {
      id: r.id || Math.random().toString(36).slice(2, 10),
      on: r.on !== false,
      method: METHODS.indexOf(r.method) >= 0 ? r.method : "ANY",
      match: typeof r.match === "string" ? r.match : "",
      status: status === 0 || (status >= 200 && status <= 599) ? status : 500,
      body: typeof r.body === "string" ? r.body : DEFAULT_BODY,
      mode: r.mode === "rewrite" || r.mode === "hang" ? r.mode : "block",
      delay: Math.max(0, parseInt(r.delay, 10) || 0),
      times: Math.max(0, parseInt(r.times, 10) || 0),   // 最多命中几次，0 = 不限
      hits: Math.max(0, parseInt(r.hits, 10) || 0),
      // 「建规则」带入的原返回，留一份给「复原」用：预设和手改都只动 status / body，这份不动。手动新增的规则没有
      orig: r.orig && typeof r.orig.body === "string"
        ? { status: okStatus(r.orig.status) ? parseInt(r.orig.status, 10) : 200, body: r.orig.body }
        : null,
    };
  }

  function okStatus(v) {
    v = parseInt(v, 10);
    return v === 0 || (v >= 200 && v <= 599);
  }

  // 按钮的位置和显隐、面板的宽度。位置按「离右边、离下边多远」存，窗口变大变小都贴着同一个角
  function normUi(u) {
    u = u || {};
    const right = parseFloat(u.right), bottom = parseFloat(u.bottom), width = parseFloat(u.width);
    return {
      right: isFinite(right) ? right : 16,
      bottom: isFinite(bottom) ? bottom : 16,
      hidden: !!u.hidden,
      dock: DOCK_SIDES.indexOf(u.dock) >= 0 ? u.dock : null,    // 贴边停靠在哪条边，null = 没停靠
      width: isFinite(width) ? Math.min(PANEL_MAX, Math.max(PANEL_MIN, width)) : PANEL_W,
    };
  }

  // 1.8 及以前把规则存在另一个 key 下。升级后第一次跑时搬过来，旧的删掉，规则不丢
  function migrateLegacy() {
    try {
      const old = W.localStorage.getItem(LEGACY_KEY);
      if (old == null) return;
      if (W.localStorage.getItem(KEY) == null) W.localStorage.setItem(KEY, old);
      W.localStorage.removeItem(LEGACY_KEY);
    } catch (e) { /* 存储读写不了就算了，当成没有旧规则 */ }
  }

  function load() {
    try {
      const s = JSON.parse(W.localStorage.getItem(KEY) || "{}") || {};
      return { paused: !!s.paused, rules: (Array.isArray(s.rules) ? s.rules : []).map(normRule), ui: normUi(s.ui) };
    } catch (e) {
      return { paused: false, rules: [], ui: normUi(null) };
    }
  }

  function save() {
    try { W.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式等写不进去，本次会话内仍生效 */ }
    if (ui) ui.badge();
  }

  function usedUp(r) { return r.times > 0 && r.hits >= r.times; }

  function activeCount() {
    if (state.paused) return 0;
    return state.rules.filter(function (r) { return r.on && r.match.trim() && !usedUp(r); }).length;
  }

  // 匹配写法：默认是「URL 里包含这一段」；以 re: 开头的按正则
  function urlMatch(pat, url) {
    pat = (pat || "").trim();
    if (!pat) return false;                    // 空规则不能拦下所有请求
    if (pat.indexOf("re:") === 0) {
      try { return new RegExp(pat.slice(3)).test(url); } catch (e) { return false; }
    }
    return url.indexOf(pat) !== -1;
  }

  function pick(method, url) {
    if (state.paused) return null;
    for (let i = 0; i < state.rules.length; i++) {
      const r = state.rules[i];
      if (!r.on || usedUp(r)) continue;
      if (r.method !== "ANY" && r.method !== method) continue;
      if (urlMatch(r.match, url)) return r;
    }
    return null;
  }

  function hit(rule, method, url) {
    rule.hits += 1;
    save();
    if (ui) ui.hits(rule);
    const hang = rule.mode === "hang";
    const what = hang ? "挂起" : rule.status === 0 ? "网络错误" : rule.status;
    const how = hang ? "拦截，一直不返回" : rule.mode === "rewrite" && rule.status !== 0 ? "放行后改返回" : "拦截，未发到服务器";
    console.warn("[mock] " + method + " " + url + " → " + what + "（" + how + "）");
    return record(method, url, what, true);
  }

  // 返回这条记录：响应体要晚一步才读得到，读到了再用 keepBody 挂上去。
  // 同一接口只留最新一条，但把上一条抓到的真实状态码和响应体接过来 ——
  // 不然接口一被模拟，「建规则」能带入的原返回就没了。count 是这个接口一共请求了几次。
  function record(method, url, status, mocked) {
    const path = shortUrl(url);
    let body = null, realStatus = null, count = 1;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].method !== method || recent[i].path !== path) continue;
      if (recent[i].body != null) body = recent[i].body;
      if (recent[i].realStatus != null) realStatus = recent[i].realStatus;
      count = (recent[i].count || 1) + 1;
      recent.splice(i, 1);
    }
    if (!mocked) realStatus = typeof status === "number" ? status : 0;   // 「失败」是网络错误，对应状态码 0
    const entry = { method: method, url: url, path: path, status: status, mocked: !!mocked, body: body,
      realStatus: realStatus, noise: isNoise(url), count: count };
    recent.unshift(entry);
    trimRecent(true, NOISE_MAX);
    trimRecent(false, RECENT_MAX);
    if (ui) ui.recent();
    return entry;
  }

  // 页面预取和静态资源：Next.js 的 RSC 预取（带 ?_rsc=）、/_next/ 下的文件、脚本样式图片字体。
  // 这些几乎不会是要模拟的接口，却能把列表占满（有的站点点一下菜单就是几十条），所以默认不显示、单独限量。
  function isNoise(url) {
    try {
      const u = new URL(url, W.location.href);
      return u.searchParams.has("_rsc") || u.pathname.indexOf("/_next/") === 0
        || /\.(js|mjs|css|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(u.pathname);
    } catch (e) {
      return false;
    }
  }

  // recent 是新的在前；同一类（接口 / 噪音）超过上限就丢掉最旧的
  function trimRecent(noise, max) {
    let n = 0;
    for (let i = 0; i < recent.length; i++) {
      if (recent[i].noise !== noise) continue;
      if (++n > max) recent.splice(i--, 1);
    }
  }

  // ── 刷新页面后还留着最近的请求 ──
  // 存在 sessionStorage：每个标签页一份，刷新还在，关掉标签页就清掉，正好是「这一次测试」的范围。
  // 好处不只是列表不丢：一刷新规则就先生效的接口，也还能带入刷新前抓到的真实返回。
  // 只管顶层页面的（面板只显示它的）；离开页面时才写，平时不碰存储。

  function loadRecent() {
    if (W.top !== W.self) return;
    try {
      const list = JSON.parse(W.sessionStorage.getItem(RECENT_KEY) || "[]");
      if (!Array.isArray(list)) return;
      list.slice(0, RECENT_MAX + NOISE_MAX).forEach(function (q) {
        if (!q || typeof q.method !== "string" || typeof q.url !== "string") return;
        recent.push({
          method: q.method, url: q.url, path: typeof q.path === "string" ? q.path : shortUrl(q.url),
          status: typeof q.status === "number" || typeof q.status === "string" ? q.status : "",
          mocked: !!q.mocked, body: typeof q.body === "string" ? q.body : null,
          realStatus: typeof q.realStatus === "number" ? q.realStatus : null,
          noise: !!q.noise, count: parseInt(q.count, 10) || 1,
          old: true,               // 刷新之前的；同一接口再请求一次，这条就被新的换掉
        });
      });
    } catch (e) { /* 读不出来就当没有 */ }
  }

  // 响应体从最新的开始留，加起来超过 RECENT_BUDGET 的那些只留接口不留内容
  function saveRecent() {
    if (W.top !== W.self) return;
    let budget = RECENT_BUDGET;
    const slim = recent.map(function (q) {
      const keep = q.body != null && q.body.length <= budget;
      if (keep) budget -= q.body.length;
      return { method: q.method, url: q.url, path: q.path, status: q.status, mocked: q.mocked,
        body: keep ? q.body : null, realStatus: q.realStatus, noise: q.noise, count: q.count };
    });
    try {
      W.sessionStorage.setItem(RECENT_KEY, JSON.stringify(slim));
    } catch (e) {
      // 页面自己已经把配额用得差不多了：退一步，只留接口列表
      slim.forEach(function (q) { q.body = null; });
      try { W.sessionStorage.setItem(RECENT_KEY, JSON.stringify(slim)); } catch (e2) { /* 还放不下就不留了 */ }
    }
  }

  W.addEventListener("pagehide", saveRecent);

  function keepBody(entry, text) {
    if (entry.noise) return;       // 预取和静态资源的内容不留，占内存又用不上
    if (typeof text === "string" && text.length <= BODY_MAX) entry.body = text;
  }

  // 只读文本类的返回：事件流（SSE）永远读不完，文件下载留着也没法改。
  // 读的是 clone，不占页面自己那份；任何一步出错都不能影响页面的请求。
  function grabFetchBody(res, entry) {
    if (entry.noise) return;
    try {
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.indexOf("event-stream") >= 0 || !/json|text|xml|javascript/.test(ct)) return;
      if (parseInt(res.headers.get("content-length"), 10) > BODY_MAX) return;
      res.clone().text().then(function (t) { keepBody(entry, t); }, function () { /* 读不出来就不带入 */ });
    } catch (e) { /* 同上 */ }
  }

  // ───────────────────────── 工具 ─────────────────────────

  function absUrl(u) {
    try { return new URL(String(u), W.location.href).href; } catch (e) { return String(u); }
  }

  // 同源只显示路径，去掉 query —— 建规则时用路径匹配更稳
  function shortUrl(url) {
    try {
      const u = new URL(url, W.location.href);
      return (u.origin === W.location.origin ? "" : u.origin) + u.pathname;
    } catch (e) {
      return String(url);
    }
  }

  // 等 ms 毫秒；Infinity 就一直等（挂起）。等的过程中页面取消了请求（AbortController）就立刻按取消结束 ——
  // 前端自己做的超时一般就是靠取消实现的，这样「挂起」才测得到它的超时提示。
  function waitOrAbort(ms, signal) {
    return new Promise(function (ok, fail) {
      function aborted() {
        fail(signal.reason !== undefined ? signal.reason : new DOMException("The user aborted a request.", "AbortError"));
      }
      if (signal) {
        if (signal.aborted) { aborted(); return; }
        signal.addEventListener("abort", aborted, { once: true });
      }
      if (ms !== Infinity) setTimeout(ok, ms);
    });
  }

  function contentType(body) {
    const t = (body || "").trim();
    return t.charAt(0) === "{" || t.charAt(0) === "[" ? "application/json" : "text/plain;charset=utf-8";
  }

  // ───────────────────────── fetch ─────────────────────────

  const origFetch = W.fetch;

  function fakeResponse(rule, url) {
    const noBody = rule.status === 204 || rule.status === 205 || rule.status === 304;
    const res = new Response(noBody ? null : rule.body, {
      status: rule.status,
      statusText: STATUS_TEXT[rule.status] || "",
      headers: { "content-type": contentType(rule.body) },
    });
    try { Object.defineProperty(res, "url", { value: url }); } catch (e) { /* 只读就算了 */ }
    return res;
  }

  if (typeof origFetch === "function") {
    W.fetch = function (input, init) {
      const self = this, args = arguments;
      let url, method, signal;
      try {
        const isReq = typeof Request !== "undefined" && input instanceof Request;
        url = absUrl(isReq ? input.url : input);
        method = String((init && init.method) || (isReq && input.method) || "GET").toUpperCase();
        signal = (init && init.signal) || (isReq && input.signal) || null;
      } catch (e) {
        return origFetch.apply(self, args);
      }

      const rule = pick(method, url);
      if (!rule) {
        const p = origFetch.apply(self, args);
        p.then(function (res) { grabFetchBody(res, record(method, url, res.status, false)); },
               function () { record(method, url, "失败", false); });
        return p;
      }

      const entry = hit(rule, method, url);
      const rewrite = rule.mode === "rewrite" && rule.status !== 0;
      const real = rewrite
        ? origFetch.apply(self, args)
            .then(function (res) { entry.realStatus = res.status; grabFetchBody(res, entry); })   // 放行模式拿得到真实返回，顺手留着
            .catch(function () { /* 真实请求失败也照样给假返回 */ })
        : null;
      return Promise.all([real, waitOrAbort(rule.mode === "hang" ? Infinity : rule.delay, signal)]).then(function () {
        if (rule.status === 0) throw new TypeError("Failed to fetch");
        return fakeResponse(rule, url);
      });
    };
  }

  // ───────────────────────── XMLHttpRequest ─────────────────────────

  const XP = W.XMLHttpRequest.prototype;
  const origOpen = XP.open, origSend = XP.send, origAbort = XP.abort;
  const META = new WeakMap();      // xhr → { method, url, aborted }

  function protoGet(name) {
    const d = Object.getOwnPropertyDescriptor(XP, name);
    return d && d.get ? d.get : function () { return undefined; };
  }
  const getReadyState = protoGet("readyState");
  const getStatus = protoGet("status");
  const getStatusText = protoGet("statusText");
  const getResponse = protoGet("response");
  const getResponseText = protoGet("responseText");
  const getResponseURL = protoGet("responseURL");
  const getResponseType = protoGet("responseType");
  const getTimeout = protoGet("timeout");
  const NET_FAIL = { status: 0, body: "" };     // 超时、断网时 XHR 该呈现的样子

  function fakeBody(xhr, body) {
    switch (getResponseType.call(xhr)) {
      case "json": try { return JSON.parse(body); } catch (e) { return null; }
      case "blob": return new Blob([body], { type: contentType(body) });
      case "arraybuffer": return new TextEncoder().encode(body).buffer;
      case "document": return null;
      default: return body;
    }
  }

  // 在实例上盖一层 getter，遮住原型上的真值。
  // live = true：真实请求照发，等它走完（readyState 4）才露出假值，过程中的进度仍是真的；
  // live = false：没发请求，直接就是「已完成」的假值。
  function maskXhr(xhr, rule, url, live) {
    function done() { return !live || getReadyState.call(xhr) === 4; }
    function def(name, fake, real) {
      Object.defineProperty(xhr, name, {
        configurable: true,
        get: function () { return done() ? fake() : real.call(xhr); },
      });
    }
    const body = rule.status === 0 ? "" : rule.body;
    const ctype = contentType(body);
    if (!live) Object.defineProperty(xhr, "readyState", { configurable: true, get: function () { return 4; } });
    def("status", function () { return rule.status; }, getStatus);
    def("statusText", function () { return STATUS_TEXT[rule.status] || ""; }, getStatusText);
    def("responseText", function () { return body; }, getResponseText);
    def("response", function () { return fakeBody(xhr, body); }, getResponse);
    def("responseURL", function () { return rule.status === 0 ? "" : url; }, getResponseURL);
    xhr.getResponseHeader = function (name) {
      if (!done()) return XP.getResponseHeader.call(xhr, name);
      return rule.status !== 0 && String(name).toLowerCase() === "content-type" ? ctype : null;
    };
    xhr.getAllResponseHeaders = function () {
      if (!done()) return XP.getAllResponseHeaders.call(xhr);
      return rule.status === 0 ? "" : "content-type: " + ctype + "\r\n";
    };
  }

  XP.open = function (method, url) {
    META.set(this, { method: String(method).toUpperCase(), url: absUrl(url), aborted: false });
    return origOpen.apply(this, arguments);
  };

  XP.abort = function () {
    const m = META.get(this);
    if (m) m.aborted = true;
    return origAbort.apply(this, arguments);
  };

  // XHR 的真实响应体，文本和 JSON 两种读得出来，其它类型（blob 等）不带入
  function xhrBody(xhr) {
    try {
      const t = getResponseType.call(xhr);
      if (t === "" || t === "text") return getResponseText.call(xhr);
      if (t === "json") {
        const v = getResponse.call(xhr);
        return v == null ? null : JSON.stringify(v);
      }
    } catch (e) { /* 读不出来就不带入 */ }
    return null;
  }

  XP.send = function () {
    const xhr = this, m = META.get(xhr);
    const rule = m ? pick(m.method, m.url) : null;
    if (!rule) {
      if (m) xhr.addEventListener("loadend", function () {
        keepBody(record(m.method, m.url, getStatus.call(xhr) || "失败", false), xhrBody(xhr));
      });
      return origSend.apply(xhr, arguments);
    }

    const entry = hit(rule, m.method, m.url);
    if (rule.mode === "rewrite" && rule.status !== 0) {
      maskXhr(xhr, rule, m.url, true);
      xhr.addEventListener("loadend", function () {      // 走原型上的 getter，读到的是真实返回
        entry.realStatus = getStatus.call(xhr) || 0;
        keepBody(entry, xhrBody(xhr));
      });
      return origSend.apply(xhr, arguments);
    }

    // 拦截 / 挂起：不调真正的 send，自己把「结束」的事件补上。kind = load / error / timeout
    const hang = rule.mode === "hang";
    function finish(kind) {
      if (m.aborted || m.done) return;
      m.done = true;
      maskXhr(xhr, kind === "timeout" ? NET_FAIL : rule, m.url, false);
      xhr.dispatchEvent(new Event("readystatechange"));
      xhr.dispatchEvent(new ProgressEvent(kind));
      xhr.dispatchEvent(new ProgressEvent("loadend"));
    }
    // 请求没真的发出去，浏览器不会替我们算超时：页面设了 xhr.timeout、而我们要等得比它久（或一直不返回），
    // 就到点补一个 timeout 事件，前端的超时提示才出得来
    const limit = getTimeout.call(xhr) || 0;
    if (limit > 0 && (hang || rule.delay > limit)) setTimeout(function () { finish("timeout"); }, limit);
    if (!hang) setTimeout(function () { finish(rule.status === 0 ? "error" : "load"); }, rule.delay);
  };

  // ───────────────────────── 面板 ─────────────────────────

  const CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI',sans-serif;font-size:12px;line-height:1.5}",
    ".fab{position:fixed;right:16px;bottom:16px;z-index:2147483647;height:28px;padding:0 12px;border:0;border-radius:14px;",
    "  background:#3a3f47;color:#fff;cursor:grab;opacity:.55;box-shadow:0 2px 8px rgba(0,0,0,.25);",
    "  white-space:nowrap;user-select:none;-webkit-user-select:none;touch-action:none}",
    ".fab:hover{opacity:1;background:#3a3f47}",
    ".fab{transition:transform .15s ease}",
    ".fab.dock-right:not(:hover):not(.peek){transform:translateX(calc(100% - 12px));color:transparent}",
    ".fab.dock-left:not(:hover):not(.peek){transform:translateX(calc(12px - 100%));color:transparent}",
    ".fab.dock-top:not(:hover):not(.peek){transform:translateY(calc(10px - 100%));color:transparent}",
    ".fab.dock-bottom:not(:hover):not(.peek){transform:translateY(calc(100% - 10px));color:transparent}",
    ".fab[hidden],.toast[hidden]{display:none}",
    ".toast{position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:calc(100vw - 32px);padding:8px 12px;border-radius:8px;",
    "  background:#1d2129;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.3)}",
    ".fab.live{background:#d92d20;opacity:1;font-weight:600}",
    ".fab.paused{background:#b54708;opacity:1}",
    // 面板不裁剪溢出：「⋯」菜单和拖宽用的侧边要能伸到面板外面，圆角由 head / 各页自己负责
    ".panel{position:fixed;right:16px;bottom:52px;z-index:2147483647;width:580px;max-width:calc(100vw - 16px);max-height:72vh;",
    "  display:flex;flex-direction:column;background:#fff;color:#1d2129;border:1px solid #d0d5dd;border-radius:10px;",
    "  box-shadow:0 12px 32px rgba(0,0,0,.22)}",
    ".panel[hidden]{display:none}",
    ".head{position:relative;display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid #eaecf0;",
    "  background:#f9fafb;border-radius:10px 10px 0 0}",
    ".head b{font-size:13px;flex:1;white-space:nowrap}",
    ".ver{margin-left:6px;font-size:11px;font-weight:400;color:#98a2b3}",
    ".link.hot{color:#b54708;font-weight:600}",
    ".link[hidden]{display:none}",
    ".head label{display:flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap}",
    ".head label.on{color:#b54708;font-weight:600}",
    ".dots{border:0;padding:0 6px;font-size:16px;line-height:1;color:#667085;background:none}",
    ".dots:hover{background:#eaecf0}",
    ".menu{position:absolute;top:calc(100% - 6px);right:36px;z-index:2;min-width:150px;padding:4px;background:#fff;",
    "  border:1px solid #d0d5dd;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18)}",
    ".menu[hidden]{display:none}",
    ".menu button{display:block;width:100%;height:28px;border:0;border-radius:5px;text-align:left;white-space:nowrap}",
    ".menu button.hot{color:#b54708;font-weight:600}",
    ".tabs{display:flex;align-items:center;gap:2px;padding:0 10px;border-bottom:1px solid #eaecf0}",
    ".tab{height:32px;padding:0 10px;border:0;border-bottom:2px solid transparent;border-radius:0;background:none;color:#667085}",
    ".tab:hover{background:none;color:#1d2129}",
    ".tab.on{color:#1570ef;border-bottom-color:#1570ef;font-weight:600}",
    ".tab i{font-style:normal;font-size:11px;font-weight:400;margin-left:5px;padding:0 6px;border-radius:8px;background:#f2f4f7;color:#667085}",
    ".tab i.live{background:#fef3f2;color:#d92d20}",
    ".tab i[hidden]{display:none}",
    ".q{margin-left:auto;width:20px;height:20px;padding:0;border-radius:50%;color:#98a2b3}",
    ".q.on{color:#1570ef;border-color:#b2ccff}",
    ".help{padding:8px 14px;background:#f9fafb;border-bottom:1px solid #eaecf0;color:#475467}",
    ".help[hidden],.pane[hidden]{display:none}",
    ".pane{flex:1;min-height:0;display:flex;flex-direction:column}",
    ".body{flex:1;min-height:0;padding:12px 14px;overflow:auto;border-radius:0 0 10px 10px}",
    ".tools{display:flex;align-items:center;gap:10px;padding:10px 14px 8px}",
    ".tools .end{margin-left:auto}",
    ".tools + .body{padding-top:4px}",
    ".link.danger{color:#d92d20;font-weight:600}",
    ".tools label{display:flex;align-items:center;gap:4px;color:#667085;white-space:nowrap;cursor:pointer}",
    ".list{flex:1;min-height:0;padding:0 14px 10px;overflow:auto;border-radius:0 0 10px 10px}",
    // 拖宽用的侧边：面板往哪边长，它就在哪边（见 placePanel）
    ".grip{position:absolute;top:10px;bottom:10px;right:-5px;width:10px;cursor:ew-resize;touch-action:none}",
    ".panel.grow-left .grip{right:auto;left:-5px}",
    ".rule{border:1px solid #d0d5dd;border-radius:8px;padding:8px;margin-bottom:8px}",
    ".rule.off{opacity:.5}",
    ".rule{transition:box-shadow .3s,border-color .3s}",
    ".rule.flash{border-color:#1570ef;box-shadow:0 0 0 3px rgba(21,112,239,.18)}",
    ".row{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}",
    ".row:last-child{margin-bottom:0}",
    ".row span{color:#667085;white-space:nowrap}",
    ".grow{flex:1;min-width:120px}",
    "input[type=text],input[type=number],select,textarea{height:26px;padding:0 6px;border:1px solid #d0d5dd;border-radius:5px;",
    "  background:#fff;color:#1d2129;outline:none}",
    "input:focus,select:focus,textarea:focus{border-color:#1570ef}",
    "input[type=number]{width:64px}",
    "textarea{width:100%;height:44px;padding:4px 6px;resize:vertical;font-family:ui-monospace,Menlo,monospace;font-size:11px}",
    "button{height:26px;padding:0 10px;border:1px solid #d0d5dd;border-radius:5px;background:#fff;color:#1d2129;cursor:pointer}",
    "button:hover{background:#f2f4f7}",
    ".x{border:0;padding:0 6px;color:#98a2b3}",
    ".x:hover{color:#d92d20;background:none}",
    ".link{border:0;padding:0;height:auto;color:#1570ef;background:none}",
    ".link:hover{background:none;text-decoration:underline}",
    ".hits{margin-left:auto}",
    ".hits.done{color:#b54708}",
    ".warn{margin-top:6px;padding:5px 8px;border-radius:5px;background:#fef3f2;color:#b42318}",
    ".warn[hidden],.tip[hidden],.err[hidden]{display:none}",
    ".tip{margin-top:6px;padding:5px 8px;border-radius:5px;background:#f2f4f7;color:#475467}",
    ".err{margin-top:4px;color:#b42318}",
    "textarea.bad{border-color:#d92d20}",
    ".row label{display:flex;align-items:center;gap:4px;color:#667085;white-space:nowrap;cursor:pointer}",
    ".chips{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-bottom:6px}",
    ".chips span{color:#667085;margin-right:2px}",
    ".chip{height:20px;padding:0 8px;border-radius:10px;font-size:11px;color:#344054}",
    ".chip.undo{margin-left:auto;color:#1570ef;border-color:#b2ccff}",
    ".more{padding:4px 0;color:#98a2b3}",
    // 一行一个接口，整行可点。「建规则」平时不显示，鼠标移上来或用键盘走到它时才出现；已有规则的一直显示
    ".req{display:flex;align-items:center;gap:8px;margin:0 -6px;padding:4px 6px;border-bottom:1px dashed #eaecf0;border-radius:4px;cursor:pointer}",
    ".req:hover{background:#f5f8ff}",
    ".req .m{flex:none;width:46px;font-size:11px;font-weight:600;color:#98a2b3}",
    ".req .m.post{color:#067647}",
    ".req .m.put,.req .m.patch{color:#b54708}",
    ".req .m.delete{color:#b42318}",
    // 路径太长时从中间省略：前半段可以收缩，最后一段不收缩
    ".req code{flex:1;min-width:0;display:flex;white-space:nowrap}",
    ".req code,.req code span{font-family:ui-monospace,Menlo,monospace;font-size:11px}",
    ".req .hd{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}",
    ".req .tl{flex:none}",
    ".req .n{flex:none;font-size:11px;color:#98a2b3}",
    ".req .tag{flex:none;padding:0 6px;border-radius:8px;font-size:11px;background:#fef3f2;color:#d92d20}",
    ".req .s{flex:none;min-width:28px;text-align:right;color:#667085;font-variant-numeric:tabular-nums}",
    ".req .s.c2{color:#067647}",
    ".req .s.c3{color:#1570ef}",
    ".req .s.c4{color:#b54708}",
    ".req .s.bad{color:#d92d20}",
    ".req .act{flex:none;width:52px;text-align:right;opacity:0}",
    ".req:hover .act,.req .act:focus-visible,.req .act.has{opacity:1}",
    ".req .act.has{color:#067647}",
    "@media (hover:none){.req .act{opacity:1}}",
    ".sep{display:flex;align-items:center;gap:8px;margin:8px 0 2px;font-size:11px;color:#98a2b3}",
    ".sep::before,.sep::after{content:'';flex:1;border-top:1px solid #eaecf0}",
    ".empty{color:#98a2b3}",
  ].join("\n");

  // 用 DOM API 拼界面，不用 innerHTML：不用操心转义，也不怕站点开了 Trusted Types
  function h(tag, props, kids) {
    const el = document.createElement(tag);
    for (const k in props || {}) {
      if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), props[k]);
      else el[k] = props[k];
    }
    [].concat(kids == null ? [] : kids).forEach(function (c) { if (c != null) el.append(c); });
    return el;
  }

  function select(opts, value, onpick) {
    const s = h("select", { onchange: function (e) { onpick(e.target.value); } }, opts.map(function (o) {
      const pair = Array.isArray(o) ? o : [o, o];
      return h("option", { value: pair[0] }, pair[1]);
    }));
    s.value = value;
    return s;
  }

  function hitsText(r) {
    if (r.times > 0) return "已命中 " + r.hits + " / " + r.times + (usedUp(r) ? "，已用完" : "");
    return "已命中 " + r.hits + " 次";
  }

  function buildUi() {
    const host = h("div", { id: "api-mock-err" });
    const root = host.attachShadow({ mode: "open" });
    try {
      // 可构造样式表不受站点 CSP 的 style-src 限制
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      root.adoptedStyleSheets = [sheet];
    } catch (e) {
      root.append(h("style", { textContent: CSS }));
    }

    const HOTKEY = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌥⇧M" : "Alt+Shift+M";
    const docEl = document.documentElement;
    const hitEls = new Map();      // rule.id → 命中次数那个 span
    let drag = null;               // 正在拖按钮时的起点
    let justDragged = false;
    let toastTimer = 0;
    let peekTimer = 0;
    let latest = "";               // 查到的新版本号；空 = 没查到有更新
    let updateChecked = false;     // 这次打开页面后，自动查过一次没有

    const fab = h("button", { className: "fab", title: "点击打开；按住可以拖动，拖到窗口边缘松手会缩进去", onclick: function () {
      if (justDragged) { justDragged = false; return; }   // 拖完松手浏览器会补一个 click，别当成「打开面板」
      setPanel(panel.hidden);
    } });
    const panel = h("div", { className: "panel", hidden: true });
    const toastEl = h("div", { className: "toast", hidden: true });
    const rulesBox = h("div");
    const recentBox = h("div");
    const cardEls = new Map();     // rule.id → 规则卡，「已有规则」跳过去时要找到它
    let tab = "";                  // 当前页签 rules / recent；空 = 还没打开过面板
    let filterText = "";           // 最近请求的筛选词（小写）
    let showNoise = false;         // 是否显示页面预取和静态资源
    let rz = null;                 // 正在拖宽面板时的起点
    const pause = h("input", { type: "checkbox", onchange: function (e) { state.paused = e.target.checked; save(); } });
    const pauseLabel = h("label", { title: "所有规则临时失效，规则本身保留" }, [pause, "全部暂停"]);
    // 检查更新平时收在「⋯」里；查到新版本后，标题栏上另外亮一个「更新到 x.y.z」
    const updateHot = h("button", { className: "link hot", hidden: true, title: "打开 Tampermonkey 的更新页，在那页点「更新」后刷新本页",
      onclick: function () { checkUpdate(true); } });
    const updateItem = h("button", { title: "到 GitHub 上查有没有新版本；有就打开 Tampermonkey 的更新页",
      onclick: function () { menu.hidden = true; checkUpdate(true); } }, "检查更新");
    const menu = h("div", { className: "menu", hidden: true }, [
      updateItem,
      h("button", { title: "把 Mock 按钮藏起来，按 " + HOTKEY + " 或在 Tampermonkey 菜单里再显示。规则照常生效",
        onclick: function () { menu.hidden = true; setHidden(true); } }, "隐藏 Mock 按钮"),
    ]);
    const dots = h("button", { className: "dots", title: "更多：检查更新、隐藏 Mock 按钮",
      onclick: function () { menu.hidden = !menu.hidden; } }, "⋯");
    const ruleCount = h("i");
    const tabRules = h("button", { className: "tab", onclick: function () { showTab("rules"); } }, ["规则", ruleCount]);
    const tabRecent = h("button", { className: "tab", onclick: function () { showTab("recent"); } }, "最近请求");
    const help = h("div", { className: "help", hidden: true }, [
      h("div", null, "· 在「最近请求」里点一个接口，会带着它的真实返回建一条规则，在上面改状态码或响应体。"),
      h("div", null, "· 只对页面里 fetch / XHR 发的请求生效；页面跳转、文件下载、WebSocket 管不到。"),
      h("div", null, "· 规则存在当前站点，刷新后仍在，测完记得暂停或删掉。状态码填 0 = 网络错误。"),
      h("div", null, "· 最近请求在刷新页面后还在，关掉标签页才清空；也可以点「清空」。"),
      h("div", null, "· 面板的侧边可以拖宽，双击侧边恢复默认宽度。"),
    ]);
    const helpBtn = h("button", { className: "q", title: "使用说明", onclick: function () {
      help.hidden = !help.hidden;
      helpBtn.classList.toggle("on", !help.hidden);
      placePanel();
    } }, "?");
    // 清空规则删了就找不回来，所以要点两次：第一次只是把按钮变成红色的确认，3 秒不点就恢复原样
    let clearArmed = 0;
    const clearBtn = h("button", { className: "link end", title: "删除全部规则", onclick: function () {
      if (!clearArmed) {
        clearBtn.textContent = "再点一次，删除全部 " + state.rules.length + " 条规则";
        clearBtn.classList.add("danger");
        clearArmed = setTimeout(disarmClear, 3000);
        return;
      }
      state.rules = [];
      save();
      renderRules();
    } }, "清空");
    function disarmClear() {
      clearTimeout(clearArmed);
      clearArmed = 0;
      clearBtn.textContent = "清空";
      clearBtn.classList.remove("danger");
    }
    const rulesBody = h("div", { className: "body" }, rulesBox);
    const paneRules = h("div", { className: "pane" }, [
      h("div", { className: "tools" }, [
        h("button", { onclick: function () { addRule({}); } }, "+ 新增规则"),
        clearBtn,
      ]),
      rulesBody,
    ]);
    const paneRecent = h("div", { className: "pane", hidden: true }, [
      h("div", { className: "tools" }, [
        h("input", { className: "grow", type: "text", placeholder: "筛选：方法或路径里的一段，如 post、/api/",
          oninput: function (e) { filterText = e.target.value.trim().toLowerCase(); renderRecent(); } }),
        h("label", { title: "页面跳转前的预取（Next.js 的 ?_rsc=）、脚本、样式、图片、字体。默认不显示" }, [
          h("input", { type: "checkbox", onchange: function (e) { showNoise = e.target.checked; renderRecent(); } }),
          "含页面预取和静态资源",
        ]),
        h("button", { className: "link", title: "清空下面的请求列表（包括刷新前留下的），不影响规则",
          onclick: function () { recent.length = 0; saveRecent(); renderRecent(); } }, "清空"),
      ]),
      h("div", { className: "list" }, recentBox),
    ]);
    const grip = h("div", { className: "grip", title: "拖动改面板宽度，双击恢复默认" });

    panel.append(
      h("div", { className: "head" }, [
        h("b", null, ["接口报错模拟", VERSION ? h("span", { className: "ver" }, "v" + VERSION) : null]),
        updateHot,
        pauseLabel,
        dots,
        h("button", { className: "x", title: "收起面板", onclick: function () { setPanel(false); } }, "✕"),
        menu,
      ]),
      h("div", { className: "tabs" }, [tabRules, tabRecent, helpBtn]),
      help,
      paneRules,
      paneRecent,
      grip
    );
    // 点菜单以外的地方就收起菜单。事件从 shadow DOM 里出来后 target 会变成宿主，所以看 composedPath
    document.addEventListener("pointerdown", function (e) {
      if (menu.hidden) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(menu) < 0 && path.indexOf(dots) < 0) menu.hidden = true;
    }, true);
    root.append(fab, panel, toastEl);

    // ── 按钮位置：可拖动，面板跟着按钮走 ──

    function viewport() {
      return { w: docEl.clientWidth || W.innerWidth, h: docEl.clientHeight || W.innerHeight };
    }

    // 只在画的时候夹进窗口里，不改存的值 —— 窗口缩小又放大后按钮回到原来的位置。
    // 停靠时贴死在那条边上（left / top 也要能贴：按钮宽度会随文字变，只按 right 定位的话左边会晃）。
    function placeFab() {
      const v = viewport(), d = state.ui.dock;
      const right = Math.min(Math.max(4, state.ui.right), Math.max(4, v.w - fab.offsetWidth - 4));
      const bottom = Math.min(Math.max(4, state.ui.bottom), Math.max(4, v.h - fab.offsetHeight - 4));
      DOCK_SIDES.forEach(function (side) { fab.classList.toggle("dock-" + side, d === side); });
      fab.style.left = d === "left" ? "0px" : "auto";
      fab.style.right = d === "left" ? "auto" : (d === "right" ? 0 : right) + "px";
      fab.style.top = d === "top" ? "0px" : "auto";
      fab.style.bottom = d === "top" ? "auto" : (d === "bottom" ? 0 : bottom) + "px";
      if (!panel.hidden) placePanel();
    }

    // 停靠的按钮滑出来有 0.15 秒动画，量位置前先把动画关掉，拿到的才是滑到位之后的位置
    function settledRect() {
      fab.style.transition = "none";
      const r = fab.getBoundingClientRect();
      fab.style.transition = "";
      return r;
    }

    function setPanel(open) {
      panel.hidden = !open;
      fab.classList.toggle("peek", open);      // 面板开着时，停靠的按钮别缩回去
      menu.hidden = true;
      if (open) {
        if (!tab) tab = state.rules.length ? "rules" : "recent";   // 第一次打开：有规则先看规则，没有就先看请求
        render();
      }
      if (open && !updateChecked) { updateChecked = true; checkUpdate(false); }   // 每次打开页面静默查一次，有新版按钮会变样
    }

    // ── 检查更新 ──
    // 脚本换不掉自己：能做的是查到新版本后打开脚本地址，Tampermonkey 会接管成它的更新页，人在那儿点一下。

    // a 比 b 新吗？按点分的数字逐段比，1.10.0 比 1.9.0 新
    function newer(a, b) {
      const x = String(a).split("."), y = String(b).split(".");
      for (let i = 0; i < Math.max(x.length, y.length); i++) {
        const d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
        if (d) return d > 0;
      }
      return false;
    }

    // 用 GM_openInTab：结果是异步回来的，那时再 window.open 会被浏览器当弹窗拦掉
    function openInstall() {
      if (typeof GM_openInTab === "function") GM_openInTab(UPDATE_URL, { active: true });
      else W.open(UPDATE_URL, "_blank");
    }

    // byUser：人点的才出提示、才打开更新页；面板第一次打开时自动查的那次是静默的，只改按钮上的字。
    // 用 GM_xmlhttpRequest 而不是 fetch：跨域读别的站点会被页面的安全策略挡住，也不该进「最近的请求」。
    function checkUpdate(byUser) {
      if (byUser && latest) { openInstall(); return; }
      if (typeof GM_xmlhttpRequest !== "function" || !VERSION) {      // 没在 Tampermonkey 的权限下跑：查不了，直接打开地址
        if (byUser) openInstall();
        return;
      }
      function fail() {
        if (byUser) toast("连不上 GitHub，没法检查更新");
      }
      GM_xmlhttpRequest({
        method: "GET", url: UPDATE_URL + "?t=" + Date.now(), timeout: 4000,
        onerror: fail, ontimeout: fail,
        onload: function (res) {
          const m = res.status === 200 && /@version\s+([\d.]+)/.exec(res.responseText || "");
          if (!m) { fail(); return; }
          if (!newer(m[1], VERSION)) {
            if (byUser) toast("已经是最新版本（" + VERSION + "）");
            return;
          }
          latest = m[1];
          updateHot.textContent = updateItem.textContent = "更新到 " + latest;
          updateHot.hidden = false;
          updateItem.classList.add("hot");
          if (byUser) {
            toast("发现新版本 " + latest + "：在新打开的页面里点「更新」，再刷新本页");
            openInstall();
          }
        },
      });
    }

    // 停靠着的按钮只露一小截，用菜单或快捷键叫出来时先滑出来亮个相，不然找不到它在哪
    function flashPeek() {
      if (!state.ui.dock) return;
      fab.classList.add("peek");
      clearTimeout(peekTimer);
      peekTimer = setTimeout(function () { if (panel.hidden) fab.classList.remove("peek"); }, 1500);
    }

    // 按钮在下半屏，面板往上开；在上半屏往下开。左右同理，保证面板不出窗口
    function placePanel() {
      const v = viewport(), r = settledRect();
      const up = r.top + r.height / 2 > v.h / 2;
      const alignRight = r.left + r.width / 2 > v.w / 2;
      const room = up ? r.top - 16 : v.h - r.bottom - 16;
      panel.style.top = up ? "auto" : (r.bottom + 8) + "px";
      panel.style.bottom = up ? (v.h - r.top + 8) + "px" : "auto";
      // 横向统一按 left 定位再夹进窗口：按钮在中间偏右时，面板比「按钮右缘到窗口左边」还宽，
      // 只按右对齐会伸出窗口左边
      panel.style.width = state.ui.width + "px";           // 超过窗口时由 CSS 的 max-width 夹住
      panel.classList.toggle("grow-left", alignRight);     // 右对齐时面板往左长，拖宽的侧边放在左边
      const pw = panel.offsetWidth;
      const left = alignRight ? r.right - pw : r.left;
      const maxH = Math.max(160, Math.min(v.h * 0.72, room));
      panel.style.right = "auto";
      panel.style.left = Math.max(8, Math.min(left, v.w - pw - 8)) + "px";
      panel.style.maxHeight = maxH + "px";
      panel.style.minHeight = Math.min(300, maxH) + "px";  // 两个页签内容一多一少，别让面板切换时忽高忽低
    }

    // ── 拖侧边改面板宽度 ──
    grip.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      rz = { x: e.clientX, w: panel.offsetWidth, left: panel.classList.contains("grow-left") };
      try { grip.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件没有可捕获的指针 */ }
      e.preventDefault();          // 别拖出文字选区
    });
    grip.addEventListener("pointermove", function (e) {
      if (!rz) return;
      const dx = e.clientX - rz.x;
      const w = rz.w + (rz.left ? -dx : dx);
      state.ui.width = Math.max(PANEL_MIN, Math.min(w, PANEL_MAX, viewport().w - 16));
      placePanel();
    });
    function endResize() {
      if (!rz) return;
      rz = null;
      save();
    }
    grip.addEventListener("pointerup", endResize);
    grip.addEventListener("pointercancel", endResize);
    grip.addEventListener("dblclick", function () { state.ui.width = PANEL_W; save(); placePanel(); });

    fab.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      justDragged = false;         // 上次拖完如果没补 click，标记别留到这一次
      const v = viewport(), r = settledRect();
      drag = { x: e.clientX, y: e.clientY, right: v.w - r.right, bottom: v.h - r.bottom, moved: false };
      try { fab.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件没有可捕获的指针 */ }
    });
    fab.addEventListener("pointermove", function (e) {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;   // 手抖几像素不算拖
      drag.moved = true;
      state.ui.dock = null;        // 一拖动就从边上出来，松手时再看要不要重新停靠
      state.ui.right = drag.right - dx;
      state.ui.bottom = drag.bottom - dy;
      placeFab();
    });
    function endDrag() {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) return;
      const v = viewport(), r = settledRect();
      state.ui.right = v.w - r.right;                    // 存夹进窗口之后的位置，别把按钮存到屏幕外
      state.ui.bottom = v.h - r.bottom;
      // 离哪条边够近就缩进哪条边；在角上时左右优先
      state.ui.dock = r.left < DOCK_SNAP ? "left" : v.w - r.right < DOCK_SNAP ? "right"
        : r.top < DOCK_SNAP ? "top" : v.h - r.bottom < DOCK_SNAP ? "bottom" : null;
      save();
      placeFab();
      justDragged = true;          // 不用定时器清：页面在后台时定时器会被拖慢，紧跟的真点击会被吞
    }
    fab.addEventListener("pointerup", endDrag);
    fab.addEventListener("pointercancel", endDrag);
    W.addEventListener("resize", placeFab);

    // ── 隐藏按钮：规则照常生效，所以隐藏的那一刻、以及带着生效的规则打开页面时提示几秒，免得忘了关 ──
    // 叫回来的三条路：Tampermonkey 弹出菜单里的「显示 Mock 按钮」；快捷键；控制台里 __apiMock.show()

    function hiddenTip() {
      const n = activeCount();
      return "Mock 按钮已隐藏，按 " + HOTKEY + " 或在 Tampermonkey 菜单里显示" + (n ? "。有 " + n + " 条规则仍在生效" : "");
    }

    function toast(text) {
      toastEl.textContent = text;
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.hidden = true; }, 4000);
    }

    function applyHidden() {
      fab.hidden = state.ui.hidden;
      if (state.ui.hidden) setPanel(false);
    }

    function setHidden(v) {
      state.ui.hidden = v;
      save();
      applyHidden();
      if (v) toast(hiddenTip());
      else { toastEl.hidden = true; placeFab(); flashPeek(); }
      refreshMenu();
    }

    // 用 code 不用 key：Mac 上 Option+Shift+M 打出来的字符不是 M
    W.addEventListener("keydown", function (e) {
      if (e.code !== "KeyM" || !e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      setHidden(!state.ui.hidden);
    }, true);

    function addRule(seed) {
      const r = normRule(seed);
      state.rules.push(r);
      save();
      focusRule(r);
    }

    function showTab(name) {
      tab = name;
      tabRules.classList.toggle("on", name === "rules");
      tabRecent.classList.toggle("on", name === "recent");
      paneRules.hidden = name !== "rules";
      paneRecent.hidden = name !== "recent";
      if (name === "rules") renderRules(); else renderRecent();
      if (!panel.hidden) placePanel();
    }

    // 切到规则页签，滚到这条规则并闪一下边框，告诉人「在这儿」
    function focusRule(r) {
      showTab("rules");
      const card = cardEls.get(r.id);
      if (!card) return;
      // 自己算滚动量，不用 scrollIntoView：它会连页面一起滚
      const box = rulesBody.getBoundingClientRect(), c = card.getBoundingClientRect();
      if (c.top < box.top) rulesBody.scrollTop -= box.top - c.top + 8;
      else if (c.bottom > box.bottom) rulesBody.scrollTop += Math.min(c.top - box.top - 8, c.bottom - box.bottom + 8);
      card.classList.add("flash");
      setTimeout(function () { card.classList.remove("flash"); }, 1200);
    }

    // 这个请求已经有规则管着了吗？不看规则是否启用、是否用完 —— 关着的规则也算「已有」，免得重复建
    function ruleFor(q) {
      for (let i = 0; i < state.rules.length; i++) {
        const r = state.rules[i];
        if ((r.method === "ANY" || r.method === q.method) && urlMatch(r.match, q.url)) return r;
      }
      return null;
    }

    // 点最近请求里的一行：已有规则就跳过去，没有就带着原返回建一条
    function pickRequest(q) {
      const has = ruleFor(q);
      if (has) { focusRule(has); return; }
      // 手上没有它的响应体（没见过真实返回、不是文本、太大没留、刷新后超出预算没存）时，状态码也不带：
      // 两项一起落回 normRule 默认的 500 和默认报错内容，免得出现「200 + 报错内容」这种对不上的组合
      const body = q.body != null ? pretty(q.body) : undefined;
      addRule({ method: q.method, match: q.path, status: body != null ? q.realStatus : undefined, body: body,
        orig: body != null ? { status: q.realStatus != null ? q.realStatus : 200, body: body } : null });
    }

    // 路径里的长 ID（十几二十位的数字、UUID）占地方又读不出什么，显示时缩成「前 4 位…后 4 位」。
    // 只影响显示：建规则带入的、鼠标停上去看到的都是完整路径
    function briefPath(path) {
      return path.split("/").map(function (seg) {
        const longId = /^\d{12,}$/.test(seg)
          || (seg.length >= 16 && /^[0-9a-f-]+$/i.test(seg) && (seg.match(/\d/g) || []).length >= 4);
        return longId ? seg.slice(0, 4) + "…" + seg.slice(-4) : seg;
      }).join("/");
    }

    // 拆成 [前半段, 最后一段]：放不下时省略号出在前半段的末尾，也就是整条路径的中间，结尾始终看得见
    function splitPath(p) {
      if (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
      const i = p.lastIndexOf("/");
      if (i <= 0) return [p, ""];
      if (p.length - i > 32) return [p.slice(0, -32), p.slice(-32)];   // 最后一段自己就很长：只保住末尾 32 个字符
      return [p.slice(0, i), p.slice(i)];
    }

    function ruleCard(r) {
      const hits = h("span", { className: "hits" + (usedUp(r) ? " done" : "") }, hitsText(r));
      hitEls.set(r.id, hits);
      const warn = h("div");
      function showModeNote() {
        const rewrite = r.mode === "rewrite", hang = r.mode === "hang";
        warn.className = rewrite ? "warn" : "tip";        // 放行会真的执行，用红的；挂起只是说明，用灰的
        warn.hidden = !rewrite && !hang;
        warn.textContent = rewrite ? "请求会真的发到服务器并执行，页面只是看到被改过的返回。下单、支付、审批这类接口照样会真的生效。"
          : hang ? "请求不发到服务器，页面会一直等：用来看加载中的样子，和前端自己的超时提示。状态码、响应体、延迟这时都不起作用。"
          : "";
      }
      showModeNote();
      const card = h("div", { className: "rule" + (r.on ? "" : " off") });
      cardEls.set(r.id, card);
      const bodyBox = h("textarea", { value: r.body, placeholder: "返回的响应体", spellcheck: false,
        oninput: function (e) { r.body = e.target.value; save(); checkBody(); } });
      const bodyErr = h("div", { className: "err", hidden: true });
      // 少个逗号、多个引号，页面拿到后会解析失败，报出来的错很像前端 bug —— 所以改的时候就提示
      function checkBody() {
        const msg = jsonError(r.body);
        bodyErr.hidden = !msg;
        bodyErr.textContent = msg ? "响应体不是合法的 JSON，页面拿到后会解析失败：" + msg : "";
        bodyBox.classList.toggle("bad", !!msg);
      }
      checkBody();
      const presets = h("div", { className: "chips" }, [h("span", null, "预设")].concat(PRESETS.map(function (p) {
        return h("button", { className: "chip", title: p.tip, onclick: function () { applyPreset(r, p); } }, p.label);
      })).concat([
        h("button", { className: "chip undo", title: "回到刚建好规则时的样子：状态码和响应体恢复成原返回，模式回到「拦截」，延迟清零",
          onclick: function () { resetRule(r); } }, "↺ 复原"),
      ]));
      // 带入的原返回往往几十上百行，按内容把框撑高一些，封顶 260px，再长就在框里滚动
      bodyBox.style.height = Math.min(260, Math.max(44, r.body.split("\n").length * 17 + 12)) + "px";

      function num(key, value, title) {
        return h("input", { type: "number", min: 0, value: value, title: title, onchange: function (e) {
          r[key] = e.target.value;
          const fixed = normRule(r);
          r[key] = fixed[key];
          e.target.value = r[key];
          save();
          api.hits(r);
        } });
      }

      card.append(
        h("div", { className: "row" }, [
          h("input", { type: "checkbox", checked: r.on, title: "启用这条规则", onchange: function (e) {
            r.on = e.target.checked;
            card.classList.toggle("off", !r.on);
            save();
          } }),
          select(METHODS, r.method, function (v) { r.method = v; save(); }),
          h("input", { className: "grow", type: "text", value: r.match,
            placeholder: "URL 里包含的一段，如 /api/transfers；正则以 re: 开头",
            oninput: function (e) { r.match = e.target.value; save(); } }),
          h("button", { className: "x", title: "删除这条规则", onclick: function () {
            state.rules = state.rules.filter(function (x) { return x !== r; });
            save();
            renderRules();
          } }, "✕"),
        ]),
        h("div", { className: "row" }, [
          h("span", null, "返回"), num("status", r.status, "HTTP 状态码，200–599；0 = 网络错误"),
          select(MODES, r.mode, function (v) { r.mode = v; showModeNote(); save(); }),
          h("span", null, "延迟"), num("delay", r.delay, "等多少毫秒再返回"), h("span", null, "ms"),
          h("span", null, "最多"), num("times", r.times, "最多命中几次，之后放行；0 = 不限"), h("span", null, "次"),
          hits,
          h("button", { className: "link", title: "命中次数清零", onclick: function () { r.hits = 0; save(); api.hits(r); } }, "清零"),
        ]),
        presets,
        bodyBox,
        bodyErr,
        warn
      );
      return card;
    }

    // 看着像 JSON（以 { 或 [ 开头）才校验；纯文本、HTML 这类不管。返回错误信息，没问题返回空串
    function jsonError(text) {
      const t = (text || "").trim();
      if (t.charAt(0) !== "{" && t.charAt(0) !== "[") return "";
      try { JSON.parse(t); return ""; } catch (e) { return String(e && e.message || e); }
    }

    // 报错时的响应体：{code, message}。原来的响应体里 code 是字符串（比如 "0"）就也给字符串，前端按老样子读
    function errorBody(current, status) {
      let asString = false;
      try {
        const o = JSON.parse(current);
        asString = !!o && typeof o === "object" && typeof o.code === "string";
      } catch (e) { /* 原来的不是 JSON，用默认的数字 code */ }
      return JSON.stringify({ code: asString ? String(status) : status, message: (STATUS_TEXT[status] || "Error") + " (mock)" }, null, 2);
    }

    // 把响应体里的列表清空：本身是数组就变 []；是对象就把两层以内值为数组的字段清空，同层的 total / count 归零。
    // 一个数组都没找到返回 null
    function emptyLists(text) {
      let o, found = 0;
      try { o = JSON.parse(text); } catch (e) { return null; }
      function walk(v, depth) {
        Object.keys(v).forEach(function (k) {
          if (Array.isArray(v[k])) { v[k] = []; found += 1; }
          else if (v[k] && typeof v[k] === "object") { if (depth < 2) walk(v[k], depth + 1); }
          else if (typeof v[k] === "number" && /^(total|count|totalCount|totalElements|totalPages)$/i.test(k)) v[k] = 0;
        });
      }
      if (Array.isArray(o)) { o = []; found = 1; }
      else if (o && typeof o === "object") walk(o, 1);
      return found ? JSON.stringify(o, null, 2) : null;
    }

    // 手动新增的规则没有带入过原返回：到最近的请求里找一条这条规则管得到的真实返回
    function findReal(r) {
      for (let i = 0; i < recent.length; i++) {
        const q = recent[i];
        if (q.body != null && (r.method === "ANY" || r.method === q.method) && urlMatch(r.match, q.url)) return q;
      }
      return null;
    }

    // 点过几个预设、又手改过之后，一步回到原返回。只动预设会动的那几项，匹配条件和命中次数不碰
    function resetRule(r) {
      if (!r.orig) {
        const q = findReal(r);
        if (q) r.orig = { status: q.realStatus != null ? q.realStatus : 200, body: pretty(q.body) };
      }
      if (!r.orig) {
        toast("没有这个接口的原返回。先取消勾选这条规则，让页面真实请求一次，再点「复原」");
        return;
      }
      r.status = r.orig.status;
      r.body = r.orig.body;
      r.mode = "block";
      r.delay = 0;
      save();
      renderRules();
    }

    function applyPreset(r, p) {
      if (p.hang) {
        r.mode = "hang";
      } else {
        if (p.empty) {
          const emptied = emptyLists(r.body);
          if (emptied == null) { toast("响应体里没找到列表。先用「建规则」带入这个接口的原返回，再点「空列表」"); return; }
          r.status = 200;
          r.body = emptied;
        }
        if (r.mode === "hang") r.mode = "block";          // 其它预设都要有返回，先从挂起里出来
        if (p.status != null) {
          r.status = p.status;
          if (p.status >= 400) r.body = errorBody(r.body, p.status);
        }
        if (p.delay != null) r.delay = p.delay;
      }
      save();
      renderRules();
    }

    // 压成一行的 JSON 没法改，带入时排一下版。页面拿到后反正要再解析一遍，排版不影响它读到的值
    function pretty(text) {
      try { return JSON.stringify(JSON.parse(text), null, 2); } catch (e) { return text; }
    }

    function renderRules() {
      hitEls.clear();
      cardEls.clear();
      disarmClear();
      clearBtn.hidden = !state.rules.length;
      rulesBox.replaceChildren.apply(rulesBox, state.rules.length
        ? state.rules.map(ruleCard)
        : [h("div", { className: "empty", style: "margin-bottom:8px" }, [
          "还没有规则。到「",
          h("button", { className: "link", onclick: function () { showTab("recent"); } }, "最近请求"),
          "」里点一个接口，或者点上面的「+ 新增规则」。",
        ])]);
    }

    function requestRow(q) {
      const st = q.status;
      // 2xx 绿、3xx 蓝、4xx 橙、5xx 和没拿到状态码的（失败 / 网络错误 / 挂起）红
      const tone = typeof st !== "number" || st >= 500 || st < 200 ? " bad" : st >= 400 ? " c4" : st >= 300 ? " c3" : " c2";
      const parts = splitPath(briefPath(q.path));
      const has = ruleFor(q);
      return h("div", { className: "req", onclick: function () { pickRequest(q); } }, [
        h("span", { className: "m " + String(q.method).toLowerCase() }, q.method),
        h("code", { title: q.path }, [h("span", { className: "hd" }, parts[0]), h("span", { className: "tl" }, parts[1])]),
        q.count > 1 ? h("span", { className: "n", title: "这个接口一共请求了 " + q.count + " 次" }, "×" + q.count) : null,
        q.mocked ? h("span", { className: "tag", title: "这次的返回是规则给的，不是服务器的" }, "模拟") : null,
        h("span", { className: "s" + tone }, String(st)),
        // 点击由整行接住，这个按钮只是给键盘留个落点
        h("button", { className: "link act" + (has ? " has" : ""),
          title: has ? "这个接口已经有规则了，点击跳到那条规则" : "带入这个接口，以及它最近一次真实返回的状态码和响应体" },
          has ? "已有规则" : "建规则"),
      ]);
    }

    function renderRecent() {
      if (panel.hidden || tab !== "recent") return;
      const list = recent.filter(function (q) {
        if (q.noise && !showNoise) return false;
        return !filterText || (q.method + " " + q.path).toLowerCase().indexOf(filterText) >= 0;
      });
      const folded = showNoise ? 0 : recent.filter(function (q) { return q.noise; }).length;
      const more = folded ? [h("div", { className: "more" }, "另有 " + folded + " 条页面预取 / 静态资源没显示")] : [];
      const rows = [];
      let marked = false;
      list.forEach(function (q) {
        if (q.old && !marked) {
          marked = true;
          rows.push(h("div", { className: "sep", title: "刷新后还没再请求过的接口。照样可以点它建规则，带入的是刷新前抓到的返回" },
            "刷新页面之前的请求"));
        }
        rows.push(requestRow(q));
      });
      recentBox.replaceChildren.apply(recentBox, list.length ? rows.concat(more)
        : [h("div", { className: "empty" }, recent.length ? "没有符合的请求。" : "还没有抓到请求，在页面上操作一下。")].concat(more));
    }

    function render() {
      pause.checked = state.paused;
      showTab(tab || "rules");
    }

    const api = {
      badge: function () {
        const n = activeCount();
        fab.textContent = state.paused ? "Mock 已暂停" : n ? "Mock · " + n + " 条生效" : "Mock";
        fab.classList.toggle("live", n > 0);
        fab.classList.toggle("paused", state.paused);
        pauseLabel.classList.toggle("on", state.paused);
        ruleCount.textContent = String(state.rules.length);
        ruleCount.hidden = !state.rules.length;
        ruleCount.classList.toggle("live", n > 0);
      },
      hits: function (r) {
        const el = hitEls.get(r.id);
        if (el) { el.textContent = hitsText(r); el.classList.toggle("done", usedUp(r)); }
        api.badge();
      },
      recent: renderRecent,
      setHidden: setHidden,
      reload: function () { applyHidden(); if (!panel.hidden) render(); api.badge(); placeFab(); refreshMenu(); },
    };

    document.documentElement.append(host);   // 挂在 html 下：SPA 重绘 body 时不会被带走
    api.badge();
    applyHidden();
    placeFab();
    if (state.ui.hidden && activeCount() > 0) toast(hiddenTip());
    return api;
  }

  // 面板只在顶层页面出现；iframe 里只拦截，规则同源共用
  if (W.top === W.self) {
    const boot = function () { if (!ui) ui = buildUi(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  // Tampermonkey 弹出菜单里、脚本名下面的「显示 / 隐藏 Mock 按钮」。
  // 菜单项的文字改不了，只能注销了重新注册；手动注入或 @grant none 时没有这两个函数，直接跳过。
  function refreshMenu() {
    if (typeof GM_registerMenuCommand !== "function" || W.top !== W.self) return;
    try {
      if (menuId != null && typeof GM_unregisterMenuCommand === "function") GM_unregisterMenuCommand(menuId);
      menuId = GM_registerMenuCommand(state.ui.hidden ? "显示 Mock 按钮" : "隐藏 Mock 按钮", toggleHidden);
    } catch (e) { /* 菜单注册不上不影响拦截 */ }
  }

  function toggleHidden() {
    if (ui) { ui.setHidden(!state.ui.hidden); return; }
    state.ui.hidden = !state.ui.hidden;      // 页面还没加载完、面板没建好：先记下，建面板时会照这个状态来
    save();
    refreshMenu();
  }

  refreshMenu();

  // 控制台入口：快捷键被页面占用、又不在 Tampermonkey 里跑的时候，在 DevTools 里敲 __apiMock.show()
  W.__apiMock = {
    show: function () { if (ui) ui.setHidden(false); },
    hide: function () { if (ui) ui.setHidden(true); },
  };

  // 别的标签页改了规则，这边跟着生效
  W.addEventListener("storage", function (e) {
    if (e.key !== KEY) return;
    state = load();
    if (ui) ui.reload();
  });
})();
