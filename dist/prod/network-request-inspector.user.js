// ==UserScript==
// @name         Network Request Inspector + Mock
// @namespace    https://github.com/sleepray/Web-api-mock
// @version      0.4.0
// @description  Inspect page fetch/XHR requests, copy them, and mock their responses with rules
// @author       Sower
// @updateURL    https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/network-request-inspector.meta.js
// @downloadURL  https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/network-request-inspector.user.js
// @match        *://*/*
// @run-at       document-start
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

"use strict";

const __NRI_BUILD__ = {"version":"0.4.0","changelog":[{"version":"0.4.0","date":"2026-11-12","sections":[{"title":"Added","items":[{"text":"Mock：按规则改写接口的返回，用来测前端的异常处理。工具栏的 **Requests | Rules** 切换到规则列表，每条规则按「方法 + 地址里的一段」匹配（以 `re:` 开头按正则），可以设状态码（`0` 为网络错误）、响应体、延迟和最多命中次数","children":[]},{"text":"三种模式：**Block** 不发到服务器、直接返回规则的内容；**Pass through** 请求照常发出并执行，只替换页面看到的返回；**Hang** 不发也一直不返回，用来看加载状态和前端自己的超时","children":[]},{"text":"在详情区点魔杖按钮或在右键菜单里选 **Mock This Request**，带着这个请求真实的状态码和响应体建规则，在它上面改；已有规则的请求改为 **Edit Mock Rule**，跳到那条规则","children":[]},{"text":"规则卡上的预设：`500`、`502`、`504`、`401`、`403`、**Offline**、**Slow 3s**、**Empty list**、**Never respond**，以及回到真实返回的 **Reset**","children":[]},{"text":"响应体编辑：输入时自动补上配对的引号和括号、回车保持缩进；**Format** 重新排版，写坏的 JSON 可以 **Auto-fix**（补引号、逗号、括号，去掉多余的逗号），改完说明修了几处并可撤销","children":[]},{"text":"被规则改过的请求在列表里带 **MOCK** 标记，筛选新增 **Mocked**；详情区说明是哪种模式改的，Pass through 模式下显示服务器真正的返回","children":[]},{"text":"有规则生效时角标显示条数，面板收起贴边时露出的那一截变红；**Pause All** 临时停用全部规则","children":[]},{"text":"刷新页面后请求列表仍在，刷新前的请求排在 **Before reload** 分隔线下面，照样可以查看和建规则；关掉标签页或清空请求后不再保留。存下来的请求头、请求参数和请求体已脱敏","children":[]},{"text":"规则按网站保存，刷新后仍然生效，同一网站的其它标签页同步生效；旧版独立 mock 脚本的规则会自动迁移过来，旧脚本还装着时会提示卸载","children":[]}]},{"title":"Changed","items":[{"text":"安装和更新改为从 GitHub 仓库获取，需要按 README 重新安装一次","children":[]}]}]},{"version":"0.3.0-beta.9","date":"2026-11-09","sections":[{"title":"Added","items":[{"text":"详情区可查找文本：点放大镜或在详情区按 `⌘F` 打开查找栏，高亮全部命中，`Return` / `⇧Return` 在命中之间跳转；JSON 树中折叠的节点会自动展开","children":[]}]}]},{"version":"0.3.0-beta.8","date":"2026-10-19","sections":[{"title":"Fixed","items":[{"text":"面板内按钮、筛选和请求行的悬停提示不显示：现在以面板配色显示，鼠标停留约 1.5 秒后出现，沿工具栏移到相邻按钮时立即切换","children":[]}]}]},{"version":"0.3.0-beta.7","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"详情区只在选中请求时显示，未选中时列表占满面板；点详情区右上角的 `×` 或在列表中按 `Esc` 可关闭详情区，再点任意请求即重新打开。`Esc` 改为先关闭详情区，再按一次才隐藏面板","children":[]}]}]},{"version":"0.3.0-beta.6","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"面板打开时 **NRI** 按钮变为向下箭头，一眼可见再点一次即可收起","children":[]}]},{"title":"Fixed","items":[{"text":"What's New 的条目在部分网站上缺少列表圆点","children":[]}]}]},{"version":"0.3.0-beta.5","date":"2026-10-12","sections":[{"title":"Added","items":[{"text":"更新后第一次打开面板时显示 **What's New**，列出从上一个版本到当前版本之间的全部变更，可跨多个版本；也可以随时在设置中查看所有版本的变更","children":[]}]},{"title":"Changed","items":[{"text":"面板打开时 **NRI** 按钮呈按下状态，悬停提示先说明点击的作用与快捷键，再显示请求数","children":[]}]}]},{"version":"0.3.0-beta.4","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"配色、主题、显示 / 隐藏快捷键与更新相关设置收进工具栏右端的齿轮设置浮层，面板底部状态栏移除，列表可多显示一行","children":[]},{"text":"配色与主题改为在设置中直接选择，不再需要逐个点击切换","children":[]},{"text":"测试版开关改为 macOS 风格的开关；有可安装的新版本时齿轮上显示圆点","children":[]}]}]},{"version":"0.3.0-beta.3","date":"2026-10-11","sections":[{"title":"Added","items":[{"text":"面板底部新增 **Beta** 开关，可选择接收测试版：打开后立即检查一次，此后每天自动检查一次，发现新版本时弹出提示并可直接安装","children":[]}]},{"title":"Changed","items":[{"text":"安装地址统一为正式版地址，Tampermonkey 只自动安装正式版；不再提供单独的测试版安装地址，已安装测试版的用户如需继续接收测试版，请在面板底部打开 **Beta**","children":[]},{"text":"面板较窄时底部隐藏 “Show/Hide” 文字标签，快捷键与版本信息不再被截断","children":[]}]}]},{"version":"0.3.0-beta.2","date":"2026-10-11","sections":[{"title":"Changed","items":[{"text":"安装与更新地址迁移到 `https://updates.sower.site/network-request-inspector/`；已安装 0.3.0-beta.1 的用户需要从新地址重新安装一次，之后照常自动更新","children":[]}]}]},{"version":"0.3.0-beta.1","date":"2026-10-11","sections":[{"title":"Added","items":[{"text":"在线安装与自动更新：通过固定地址安装正式版，Tampermonkey 会定期检查并安装新版本","children":[]},{"text":"测试版通道：通过单独的地址安装测试版，正式版发布后测试版会自动升级到正式版","children":[]},{"text":"面板底部显示当前完整版本号，可手动检查更新，发现新版本时可直接安装","children":[]},{"text":"详情区显示状态码及原因短语、耗时、响应大小、开始时间与来源（Fetch / XHR），并分为响应体、响应头、请求三个视图","children":[]},{"text":"JSON 响应体以可折叠树展示，可切换为格式化源码；响应头与查询参数以键值表展示","children":[]},{"text":"复制为 cURL、复制 URL、复制响应体、复制全部可见请求","children":[]},{"text":"复制模式 Redacted / Raw：默认隐藏认证类请求头、Cookie、API Key、敏感 URL 参数，以及 JSON 和表单中名为 token、secret、password、key、session 等的字段；列表、详情与所有复制方式都遵循该模式","children":[]},{"text":"按 All / Failed 筛选，Failed 包含 4xx、5xx 与网络错误","children":[]},{"text":"按响应类型筛选（JSON、Doc、Text、JS、CSS、Img、Media、Font、Other），⌘ 点击可多选，没有对应请求的类型会变暗","children":[]},{"text":"多选请求：⌘ 点击切换、Shift 点击或 Shift + 方向键连续选择、⌘A 全选可见请求，可将所选请求按列表顺序复制为 Markdown、cURL 或 URL","children":[]},{"text":"右键菜单：复制请求与响应、复制为 cURL、复制 URL、复制响应体、复制全部可见请求、清空请求","children":[]},{"text":"键盘操作：方向键选择请求、← / → 切换详情视图、⌘C 复制、⌘F 聚焦筛选框、⌘K 清空、Esc 逐级退出；面板内的按键不会触发宿主页面的快捷键","children":[]},{"text":"显示 / 隐藏面板的全局快捷键，默认 `H`，可录制新组合、禁用或重置；在输入框中只响应带 ⌘ / Ctrl / ⌥ 的组合，与面板已占用的按键冲突时会被拒绝","children":[]},{"text":"VS Code 与 macOS 两套配色，各有深色与浅色变体，与主题切换相互独立","children":[]}]},{"title":"Changed","items":[{"text":"面板改为上方请求列表、下方可调整高度的详情区，取代在列表中展开详情的方式；面板高度不足时详情区自动收缩，工具栏、列表、详情头部与底部栏始终完整显示","children":[]},{"text":"面板最小高度提高到 260px","children":[]},{"text":"主题、配色、面板尺寸、垂直位置、详情高度、复制模式与显示 / 隐藏快捷键在所有网站间同步；面板的打开 / 隐藏状态仍按网站分别保存","children":[]},{"text":"面板始终使用自带的界面字体与等宽字体，不受宿主页面样式影响","children":[]},{"text":"操作提示改为跟随面板风格的通知横幅","children":[]}]},{"title":"Removed","items":[{"text":"紧凑密度开关，面板始终使用紧凑布局","children":[]}]},{"title":"Fixed","items":[{"text":"新请求到达时列表与详情的滚动位置不再跳动","children":[]},{"text":"页面包含 iframe 时不再出现多个面板；同时安装多个版本时只会启动一个","children":[]}]}]},{"version":"0.2.0","date":"2026-07-30","sections":[{"title":"Added","items":[{"text":"面板停靠在页面边缘，鼠标移到边缘时显示","children":[]},{"text":"在列表中展开请求即可预览详情","children":[]},{"text":"拖动面板左侧与顶部边缘调整面板尺寸，拖动详情区边缘调整详情高度，调整结果会被记住","children":[]},{"text":"主题可选深色、浅色或跟随系统，选择会被记住","children":[]},{"text":"紧凑密度开关","children":[]}]},{"title":"Changed","items":[{"text":"加宽请求方法列","children":[]},{"text":"打开 / 隐藏面板时不再有边缘滑动动画","children":[]},{"text":"面板开关按钮在深色与浅色主题下使用一致的半透明底色","children":[]}]},{"title":"Fixed","items":[{"text":"XHR 请求完成后请求体丢失","children":[]},{"text":"开关按钮可以上下拖动，展开或收起时不再跳动","children":[]}]}]},{"version":"0.1.0","date":"2026-07-21","sections":[{"title":"Added","items":[{"text":"拦截页面的 fetch 与 XHR 请求，在浮动面板中按时间列出","children":[]},{"text":"按 URL 模糊搜索请求","children":[]},{"text":"一键复制请求与响应（Markdown）","children":[]},{"text":"深色主题列表","children":[]}]}]}],"update":{"latest":{"manifestUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/update.json","installUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/network-request-inspector.user.js"},"beta":{"manifestUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/beta/dist/prod/update.json","installUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/beta/dist/prod/network-request-inspector.user.js"}}};
(function(){let e={maxEntries:80,maxBodyChars:2e5,ignoreUrlPatterns:[/\.(js|css|map|png|jpe?g|gif|svg|webp|woff2?|ttf|ico)(\?|$)/i],panelDefaultCollapsed:!0,panelDefaultWidth:440,panelDefaultHeight:560,panelMinWidth:280,panelMinHeight:236,panelSizeStorageKey:`nri-panel-size`,panelDefaultBottom:16,panelMinBottom:8,panelOffsetStorageKey:`nri-panel-offset`,detailDefaultHeight:300,detailMinHeight:120,detailMaxHeight:720,detailHeightStorageKey:`nri-detail-height`,panelCollapsedStorageKey:`nri-panel-collapsed`,panelModeStorageKey:`nri-panel-mode`,panelDefaultTheme:`system`,panelThemeStorageKey:`nri-panel-theme`,panelDefaultPalette:`vscode`,panelPaletteStorageKey:`nri-panel-palette`,copyModeDefault:`redacted`,copyModeStorageKey:`nri-copy-mode`,toggleShortcutStorageKey:`nri-toggle-shortcut`,includeBetaStorageKey:`nri-include-beta`,betaCheckDateStorageKey:`nri-beta-check-date`,seenVersionStorageKey:`nri-seen-version`,mockRulesStorageKey:`nri-mock-rules`,mockLegacyStorageKeys:[`__api_mock_err__`,`__fomo_mock_err__`],sessionRecordsStorageKey:`nri-session-records`,sessionRecordsBudgetChars:1e6},t=`[REDACTED]`,n=/* @__PURE__ */ new Set([`authorization`,`proxyauthorization`,`cookie`,`setcookie`,`apikey`,`xapikey`,`token`,`authtoken`,`xauthtoken`,`xsessiontoken`]),r=/* @__PURE__ */ new Set([`token`,`accesstoken`,`refreshtoken`,`idtoken`,`apikey`,`xapikey`,`key`,`secret`,`clientsecret`,`password`,`passwd`,`credential`,`session`,`sessionid`,`sid`]);function i(e){return e.toLowerCase().replace(/[^a-z0-9]/g,``)}function a(e){return n.has(i(e))}function o(e){return r.has(i(e))}function s(e){if(e===void 0)return``;for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.toLowerCase();return``}function c(e){if(e===void 0)return;let n={};for(let[r,i]of Object.entries(e))n[r]=a(r)?t:i;return n}function l(e){try{let n=new URL(e),r=Array.from(n.searchParams.entries());if(!r.some(([e])=>o(e)))return e;n.search=``;for(let[e,i]of r)n.searchParams.append(e,o(e)?t:i);return n.href}catch{return e}}function u(e){if(Array.isArray(e))return e.map(u);if(typeof e!=`object`||!e)return e;let n={};for(let[r,i]of Object.entries(e))n[r]=o(r)?t:u(i);return n}function d(e){let n=new URLSearchParams(e),r=Array.from(n.entries());if(!r.some(([e])=>o(e)))return e;let i=new URLSearchParams;for(let[e,n]of r)i.append(e,o(e)?t:n);return i.toString()}function f(e,t){return typeof e==`string`?s(t).includes(`application/x-www-form-urlencoded`)?d(e):e:u(e)}function p(e){let t=c(e.requestHeaders),n=c(e.responseHeaders),r={...e,url:l(e.url),requestHeaders:t,responseHeaders:n,requestBody:f(e.requestBody,t),responseBody:f(e.responseBody,n)},i=e.mock?.real;if(e.mock!==void 0&&i!==void 0){let t=c(i.responseHeaders);r.mock={...e.mock,real:{...i,responseHeaders:t,responseBody:f(i.responseBody,t)}}}return r}function m(e){if(e===void 0)return``;for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.toLowerCase();return``}function h(e,t){if(typeof e==`object`&&e)return`json`;let n=String(e).trim().toLowerCase(),r=m(t);return r.includes(`text/html`)||r.includes(`application/xhtml+xml`)||n.startsWith(`<!doctype html`)||n.startsWith(`<html`)?`html`:r.includes(`xml`)||n.startsWith(`<?xml`)||n.startsWith(`<svg`)?`xml`:`text`}function g(t,n){if(t==null)return{text:``,language:`text`,empty:!0,truncated:!1,totalChars:0};let r;try{r=typeof t==`string`?t:JSON.stringify(t,null,2)}catch{r=String(t)}let i=r.length,a=i>e.maxBodyChars;return{text:a?r.slice(0,e.maxBodyChars):r,language:a?`text`:h(t,n),empty:!1,truncated:a,totalChars:i}}function _(e){return e===void 0||Object.keys(e).length===0?`(none)`:Object.entries(e).map(([e,t])=>`${e}: ${t}`).join(`
`)}function v(e,t){return t===`redacted`?p(e):e}function y(e){return`\`${e.replace(/`/g,"\\`")}\``}function ee(e,t){let n=e.match(/`+/g)??[],r=Math.max(3,...n.map(e=>e.length+1)),i="`".repeat(r);return`${i}${t}\n${e}\n${i}`}function b(e){if(e.empty)return`*(empty)*`;let t=ee(e.text,e.language);return e.truncated?`${t}\n\n> Truncated: ${e.totalChars} characters total.`:t}function x(e){let t=g(e.requestBody,e.requestHeaders),n=[`- Method: ${y(e.method)}`,`- URL: ${y(e.url)}`,`- Source: ${y(e.source)}`];return e.durationMs!==void 0&&n.push(`- Duration: ${e.durationMs}ms`),[`## Request`,``,...n,``,`### Headers`,``,ee(_(e.requestHeaders),`http`),``,`### Body`,``,b(t)].join(`
`)}function te(e){let t=g(e.responseBody,e.responseHeaders);return[`## Response`,``,...e.status===void 0?e.error===void 0?[`- Status: *(pending)*`]:[`- Error: ${y(e.error)}`]:[`- Status: ${e.status}`],``,`### Headers`,``,ee(_(e.responseHeaders),`http`),``,`### Body`,``,b(t)].join(`
`)}function ne(e,t=`redacted`){let n=v(e,t);return[x(n),``,te(n)].join(`
`)}function re(e,t=`redacted`){return e.map((n,r)=>`# Request ${r+1} of ${e.length}\n\n${ne(n,t)}`).join(`

---

`)}function ie(e){return`'${e.replace(/'/g,`'\\''`)}'`}function ae(e,t=`redacted`){let n=v(e,t),r=n.method.toUpperCase(),i=[`curl ${ie(n.url)}`];r!==`GET`&&i.push(`-X ${r}`);for(let[e,t]of Object.entries(n.requestHeaders??{}))i.push(`-H ${ie(`${e}: ${t}`)}`);let a=n.requestBody;if(a!=null&&a!==``){let e;try{e=typeof a==`string`?a:JSON.stringify(a)}catch{e=String(a)}i.push(`--data-raw ${ie(e)}`)}return i.join(` \\
  `)}function oe(e){if(e==null)return`—`;let t;try{t=typeof e==`string`?e:JSON.stringify(e)}catch{t=String(e)}let n=new TextEncoder().encode(t).length;return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(1)} MB`}let se={200:`OK`,201:`Created`,202:`Accepted`,204:`No Content`,206:`Partial Content`,301:`Moved Permanently`,302:`Found`,303:`See Other`,304:`Not Modified`,307:`Temporary Redirect`,308:`Permanent Redirect`,400:`Bad Request`,401:`Unauthorized`,403:`Forbidden`,404:`Not Found`,405:`Method Not Allowed`,408:`Request Timeout`,409:`Conflict`,410:`Gone`,413:`Payload Too Large`,415:`Unsupported Media Type`,422:`Unprocessable Entity`,429:`Too Many Requests`,500:`Internal Server Error`,501:`Not Implemented`,502:`Bad Gateway`,503:`Service Unavailable`,504:`Gateway Timeout`};function ce(e){return se[e]??``}function le(e){try{return Array.from(new URL(e,`http://localhost`).searchParams.entries())}catch{return[]}}function ue(e,t){return new Promise((n,r)=>{if(t!=null){let e=()=>{r(t.reason===void 0?new DOMException(`The user aborted a request.`,`AbortError`):t.reason)};if(t.aborted){e();return}t.addEventListener(`abort`,e,{once:!0})}e!==1/0&&setTimeout(n,e)})}function S(e){let t=e.trim().charAt(0);return t===`{`||t===`[`?`application/json`:`text/plain;charset=utf-8`}function de(e){return e===204||e===205||e===304}function fe({status:e,body:t,url:n,ResponseCtor:r=Response}){let i=new r(de(e)?null:t,{status:e,statusText:ce(e),headers:{"content-type":S(t)}});try{Object.defineProperty(i,"url",{value:n})}catch{}return i}function pe(e,t){return e===0?{}:{"content-type":S(t)}}let me={status:0,body:``};function he(e){let t=e.XMLHttpRequest.prototype;function n(e){let n=Object.getOwnPropertyDescriptor(t,e)?.get;return e=>n===void 0?void 0:n.call(e)}let r=n(`readyState`),i=n(`status`),a=n(`statusText`),o=n(`response`),s=n(`responseText`),c=n(`responseURL`),l=n(`responseType`),u=n(`timeout`),d=t.getResponseHeader,f=t.getAllResponseHeaders;function p(t,n){switch(l(t)){case`json`:try{return JSON.parse(n)}catch{return null}case`blob`:return new(e.Blob??Blob)([n],{type:S(n)});case`arraybuffer`:return new(e.TextEncoder??TextEncoder)().encode(n).buffer;case`document`:return null;default:return n}}function m(e){try{let t=l(e);if(t===``||t===`text`||t===void 0)return s(e);if(t===`json`){let t=o(e);return t==null?void 0:JSON.stringify(t)}}catch{}}return{readReal(e){let t=``;try{t=f.call(e)}catch{}return{status:i(e)??0,body:m(e),headers:t}},readTimeout(e){return u(e)??0},mask(e,t,n,l){let u=()=>!l||r(e)===4,m=t.status===0,h=m?``:t.body,g=S(h);function _(t,n,r){Object.defineProperty(e,t,{configurable:!0,get:()=>u()?n():r(e)})}l||Object.defineProperty(e,"readyState",{configurable:!0,get:()=>4}),_(`status`,()=>t.status,i),_(`statusText`,()=>ce(t.status),a),_(`responseText`,()=>h,s),_(`response`,()=>p(e,h),o),_(`responseURL`,()=>m?``:n,c),e.getResponseHeader=t=>u()?!m&&t.toLowerCase()===`content-type`?g:null:d.call(e,t),e.getAllResponseHeaders=()=>u()?m?``:`content-type: ${g}\r\n`:f.call(e)}}}let ge=[`ANY`,`GET`,`POST`,`PUT`,`PATCH`,`DELETE`];function C(e){let t=typeof e==`number`?e:parseInt(String(e),10);return Number.isFinite(t)?Math.trunc(t):NaN}function _e(e){let t=C(e);return t===0||t>=200&&t<=599}function ve(){return Math.random().toString(36).slice(2,10)}function ye(e){let t=typeof e==`object`&&e?e:{},n=String(t.method??``).toUpperCase(),r=typeof t.orig==`object`&&t.orig!==null?t.orig:void 0,i={id:typeof t.id==`string`&&t.id!==``?t.id:ve(),on:t.on!==!1,method:ge.includes(n)?n:`ANY`,match:typeof t.match==`string`?t.match:``,status:_e(t.status)?C(t.status):500,body:typeof t.body==`string`?t.body:`{"code":500,"message":"Internal Server Error (mock)"}`,mode:t.mode===`rewrite`||t.mode===`hang`?t.mode:`block`,delay:Math.max(0,C(t.delay)||0),times:Math.max(0,C(t.times)||0),hits:Math.max(0,C(t.hits)||0)};return r!==void 0&&typeof r.body==`string`&&(i.orig={status:_e(r.status)?C(r.status):200,body:r.body}),i}function be(e,t){let n=e.trim();if(n===``)return!1;if(n.startsWith(`re:`))try{return new RegExp(n.slice(3)).test(t)}catch{return!1}return t.includes(n)}function xe(e){return e.times>0&&e.hits>=e.times}function Se(e,t,n){return(e.method===`ANY`||e.method===t.toUpperCase())&&be(e.match,n)}function w({rules:e,paused:t,method:n,url:r}){if(!t)return e.find(e=>e.on&&!xe(e)&&Se(e,n,r))}function Ce(e,t){return t?0:e.filter(e=>e.on&&e.match.trim()!==``&&!xe(e)).length}function we(e){return e.mode===`rewrite`&&e.status===0?`block`:e.mode}let Te,Ee=/* @__PURE__ */ new Set;function De(e){try{return localStorage.getItem(e)}catch{return null}}function Oe(e){if(e!==null)try{let t=JSON.parse(e);if(typeof t!=`object`||!t)return;let{paused:n,rules:r}=t;return{paused:n===!0,rules:Array.isArray(r)?r.map(ye):[]}}catch{return}}function ke(){let t;for(let n of e.mockLegacyStorageKeys){let e=Oe(De(n));if(e!==void 0){t??=e;try{localStorage.removeItem(n)}catch{}}}return t}function Ae(){let t=Oe(De(e.mockRulesStorageKey)),n=ke(),r=t??n??{paused:!1,rules:[]};return t===void 0&&n!==void 0&&je(r),r}function je(t){try{localStorage.setItem(e.mockRulesStorageKey,JSON.stringify(t))}catch{}}function T(){return Te??=Ae(),Te}function Me(e){Te=e,je(e);for(let e of Ee)e()}function Ne(){return T().rules}function Pe(){return T().paused}function Fe(e){return Ee.add(e),()=>{Ee.delete(e)}}function E(e){Me({...T(),paused:e})}function Ie(e={}){let t=ye(e);return Me({...T(),rules:[...T().rules,t]}),t}function Le(e){let{rules:t}=T();t.some(t=>t.id===e.id)&&Me({...T(),rules:t.map(t=>t.id===e.id?ye(e):t)})}function Re(e){Me({...T(),rules:T().rules.filter(t=>t.id!==e)})}function ze(){Me({...T(),rules:[]})}function Be(e){let{rules:t}=T();Me({...T(),rules:t.map(t=>t.id===e?{...t,hits:t.hits+1}:t)})}function D(e,t){try{let{rules:n,paused:r}=T();return r||n.length===0?void 0:w({rules:n,paused:r,method:e,url:t})}catch{return}}function Ve(e,t){return T().rules.find(n=>Se(n,e,t))}function O(){Te=Ae();for(let e of Ee)e()}function He(t=window){t.addEventListener(`storage`,t=>{t.key===e.mockRulesStorageKey&&O()})}let k=[],Ue=/* @__PURE__ */ new Set;function We(){let e=k.slice();for(let t of Ue)t(e)}function Ge(){return k}function A(t){let n=k.findIndex(e=>e.id===t.id);n>=0?k=[...k.slice(0,n),t,...k.slice(n+1)]:(k=[t,...k],k.length>e.maxEntries&&(k=k.slice(0,e.maxEntries))),We()}function Ke(t){if(t.length===0)return;let n=new Set(k.map(e=>e.id));k=[...k,...t.filter(e=>!n.has(e.id))].slice(0,e.maxEntries),We()}function qe(){k=[],We()}function Je(e){return Ue.add(e),e(k.slice()),()=>{Ue.delete(e)}}let Ye=`nri-toast-style`,j=`nri-toast-container`,Xe=`dark`,Ze=`vscode`;function Qe(e,t){Xe=e,Ze=t;let n=document.getElementById(j);n!==null&&(n.dataset.nriTheme=e,n.dataset.nriPalette=t)}let $e={success:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m4.8 8.2 2.1 2.1 4.3-4.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,error:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m5.5 5.5 5 5m0-5-5 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,warning:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M8 4.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.4" r="1" fill="#fff"/></svg>`,info:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><circle cx="8" cy="4.8" r="1" fill="#fff"/><path d="M8 7.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`};function et(){if(document.getElementById(Ye)!==null)return;let e=document.createElement(`style`);e.id=Ye,e.textContent=`
        /* macOS 通知横幅：右上角毛玻璃卡片，从右侧滑入 */
        #${j} {
            /* 与面板一致：VS Code 默认主题 Dark 2026 / Light 2026 */
            --nri-toast-bg: rgba(32, 33, 34, 0.9);
            --nri-toast-opaque: rgb(32, 33, 34);
            --nri-toast-fg: #bfbfbf;
            --nri-toast-edge: #2a2b2c;
            --nri-toast-shadow: rgba(0, 0, 0, 0.45);
            --nri-toast-success: #73c991;
            --nri-toast-error: #f48771;
            --nri-toast-warning: #cca700;
            --nri-toast-info: #3794ff;
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 2147483646;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
            pointer-events: none;
        }
        #${j}[data-nri-theme="light"] {
            --nri-toast-bg: rgba(250, 250, 253, 0.94);
            --nri-toast-opaque: rgb(250, 250, 253);
            --nri-toast-fg: #202020;
            --nri-toast-edge: #e4e5e6;
            --nri-toast-shadow: rgba(0, 0, 0, 0.16);
            --nri-toast-success: #73c991;
            --nri-toast-error: #ad0707;
            --nri-toast-warning: #bf8803;
            --nri-toast-info: #006ab1;
        }
        /* macOS 风格：苹果系统色、0.5px 细线 */
        #${j}[data-nri-palette="macos"] {
            --nri-toast-bg: rgba(40, 40, 44, 0.78);
            --nri-toast-opaque: rgb(40, 40, 44);
            --nri-toast-fg: rgba(255, 255, 255, 0.88);
            --nri-toast-edge: rgba(255, 255, 255, 0.1);
            --nri-toast-edge-width: 0.5px;
            --nri-toast-success: #30d158;
            --nri-toast-error: #ff453a;
            --nri-toast-warning: #ff9f0a;
            --nri-toast-info: #0a84ff;
        }
        #${j}[data-nri-theme="light"][data-nri-palette="macos"] {
            --nri-toast-bg: rgba(246, 246, 246, 0.8);
            --nri-toast-opaque: rgb(246, 246, 246);
            --nri-toast-fg: rgba(0, 0, 0, 0.85);
            --nri-toast-edge: rgba(0, 0, 0, 0.1);
            --nri-toast-shadow: rgba(0, 0, 0, 0.2);
            --nri-toast-success: #28cd41;
            --nri-toast-error: #ff3b30;
            --nri-toast-warning: #ff9500;
            --nri-toast-info: #007aff;
        }
        #${j} .nri-toast {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 220px;
            max-width: 360px;
            padding: 11px 14px 11px 12px;
            border-radius: 14px;
            background: var(--nri-toast-bg);
            -webkit-backdrop-filter: blur(24px) saturate(1.8);
            backdrop-filter: blur(24px) saturate(1.8);
            box-shadow:
                inset 0 0 0 var(--nri-toast-edge-width, 1px) var(--nri-toast-edge),
                0 10px 30px var(--nri-toast-shadow);
            color: var(--nri-toast-fg);
            /* 始终使用自带字体，不继承宿主页面 */
            font: 500 13px/1.35 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", Roboto, Arial, sans-serif !important;
            letter-spacing: normal !important;
            text-transform: none !important;
            -webkit-font-smoothing: antialiased;
            word-break: break-word;
            opacity: 0;
            transform: translateX(calc(100% + 24px));
            transition:
                transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1),
                opacity 0.25s ease;
        }
        /* 宿主页面的 span/div 规则不得影响提示内容 */
        #${j} .nri-toast * {
            margin: 0;
            padding: 0;
            font: inherit !important;
            letter-spacing: inherit !important;
            text-transform: inherit !important;
            color: inherit;
        }
        #${j} .nri-toast-show {
            opacity: 1;
            transform: none;
        }
        #${j} .nri-toast-icon {
            flex: 0 0 auto;
            width: 18px;
            height: 18px;
        }
        #${j} .nri-toast-icon svg {
            display: block;
            width: 100%;
            height: 100%;
        }
        #${j} .nri-toast-success .nri-toast-icon {
            color: var(--nri-toast-success);
        }
        #${j} .nri-toast-error .nri-toast-icon {
            color: var(--nri-toast-error);
        }
        #${j} .nri-toast-warning .nri-toast-icon {
            color: var(--nri-toast-warning);
        }
        #${j} .nri-toast-info .nri-toast-icon {
            color: var(--nri-toast-info);
        }
        @media (prefers-reduced-transparency: reduce) {
            #${j} .nri-toast {
                background: var(--nri-toast-opaque);
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            #${j} .nri-toast {
                transform: none;
                transition: opacity 0.2s ease;
            }
        }
    `,document.head.appendChild(e)}function tt(){let e=document.getElementById(j);if(e instanceof HTMLDivElement)return e;let t=document.createElement(`div`);return t.id=j,t.dataset.nriTheme=Xe,t.dataset.nriPalette=Ze,t.setAttribute(`role`,`status`),t.setAttribute(`aria-live`,`polite`),document.documentElement.appendChild(t),t}function M(e,t,n=2500){et();let r=tt(),i=document.createElement(`div`);i.className=`nri-toast nri-toast-${e}`;let a=document.createElement(`span`);a.className=`nri-toast-icon`,a.innerHTML=$e[e];let o=document.createElement(`span`);o.textContent=t,i.append(a,o),r.appendChild(i),i.offsetWidth,i.classList.add(`nri-toast-show`),window.setTimeout(()=>{i.classList.remove(`nri-toast-show`),window.setTimeout(()=>{i.remove()},300)},n)}async function nt(e){let t=navigator.clipboard;if(t!==void 0&&typeof t.writeText==`function`){await t.writeText(e);return}let n=document.createElement(`textarea`);n.value=e,n.style.cssText=`position:fixed;left:-9999px;top:-9999px;opacity:0;`,document.body.appendChild(n),n.focus(),n.select();let r=document.execCommand(`copy`);if(n.remove(),!r)throw Error(`Clipboard copy failed`)}function rt(){return typeof crypto<`u`&&typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function it(e){let t=e.trim();if(t.startsWith(`{`)&&t.endsWith(`}`)||t.startsWith(`[`)&&t.endsWith(`]`))try{return JSON.parse(t)}catch{return e}return e}function at(e){if(e!==void 0){if(e instanceof Headers){let t={};return e.forEach((e,n)=>{t[n]=e}),t}return{...e}}}function ot(e,t){return t.some(t=>t.test(e))}function N(){return globalThis.unsafeWindow??window}function st(e,t){if(e==null)return;if(typeof e==`string`)return it(e);let n=t??N();if(e instanceof URLSearchParams||n.URLSearchParams&&e instanceof n.URLSearchParams||Object.prototype.toString.call(e)===`[object URLSearchParams]`)return e.toString();if(typeof Blob<`u`&&e instanceof Blob||n.Blob&&e instanceof n.Blob||Object.prototype.toString.call(e)===`[object Blob]`||Object.prototype.toString.call(e)===`[object File]`){let t=e;return`[Blob type=${t.type||`unknown`} size=${t.size}]`}if(typeof FormData<`u`&&e instanceof FormData||n.FormData&&e instanceof n.FormData||Object.prototype.toString.call(e)===`[object FormData]`){let t=[];return e.forEach((e,n)=>{typeof e==`string`?t.push(`${n}=${e}`):t.push(`${n}=[File name=${e.name} size=${e.size}]`)}),t.join(`&`)}if(e instanceof ArrayBuffer||n.ArrayBuffer&&e instanceof n.ArrayBuffer||Object.prototype.toString.call(e)===`[object ArrayBuffer]`)return`[ArrayBuffer byteLength=${e.byteLength}]`;if(ArrayBuffer.isView(e)||n.ArrayBuffer?.isView&&n.ArrayBuffer.isView(e))return`[TypedArray byteLength=${e.byteLength}]`;try{return String(e)}catch{return`[unreadable body]`}}async function ct(e,t,n){let r=n??N();if(e instanceof Request||r.Request&&e instanceof r.Request||Object.prototype.toString.call(e)===`[object Request]`){let n=e,i=(t?.method??n.method??`GET`).toUpperCase(),a=n.url,o=r.Headers??Headers,s=new o(n.headers);t?.headers!==void 0&&new o(t.headers).forEach((e,t)=>{s.set(t,e)});let c;if(t?.body!==void 0)c=st(t.body,r);else try{let e=await n.clone().text();c=e===``?void 0:it(e)}catch{c=`[unreadable Request body]`}return{method:i,url:a,requestHeaders:at(s),requestBody:c}}let i=typeof e==`string`?e:e instanceof URL||r.URL&&e instanceof r.URL?e.href:String(e),a=r.Headers??Headers;return{method:(t?.method??`GET`).toUpperCase(),url:new URL(i,location.href).href,requestHeaders:at(t?.headers===void 0?void 0:new a(t.headers)),requestBody:st(t?.body,r)}}function lt(e){let t={};for(let n of e.trim().split(/[\r\n]+/)){let e=n.indexOf(`:`);if(e<=0)continue;let r=n.slice(0,e).trim(),i=n.slice(e+1).trim();r!==``&&(t[r]=i)}return t}function ut(e){return e===void 0||e===``?void 0:it(e)}function dt(e,t){if(t?.signal!==void 0&&t.signal!==null)return t.signal;let n=e.signal;return typeof n==`object`&&n?n:void 0}async function ft({rule:e,base:t,input:n,init:r,originalFetch:i,pageWindow:a}){let o={...e},s=we(o),c={ruleId:o.id,mode:s},l=()=>Date.now()-t.startedAt;Be(o.id),A({...t,mock:c});try{let e=dt(n,r);if(s===`rewrite`){let t=i(n,r).then(async e=>{let t;try{t=ut(await e.text())}catch{t=`[unreadable response body]`}c.real={status:e.status,responseHeaders:at(e.headers),responseBody:t}},e=>{c.real={error:e instanceof Error?e.message:String(e)}});await Promise.all([t,ue(o.delay,e)])}else await ue(s===`hang`?1/0:o.delay,e)}catch(e){throw A({...t,mock:c,durationMs:l(),error:`Aborted`}),e}if(o.status===0)throw A({...t,mock:c,durationMs:l(),error:`Failed to fetch`}),new a.TypeError(`Failed to fetch`);return A({...t,mock:c,durationMs:l(),status:o.status,responseHeaders:pe(o.status,o.body),responseBody:ut(o.body)}),fe({status:o.status,body:o.body,url:t.url,ResponseCtor:a.Response})}function pt(t){let n=t.fetch.bind(t);t.fetch=async(r,i)=>{let a=Date.now(),o=rt(),s;try{let e=await ct(r,i,t);s={id:o,method:e.method,url:e.url,startedAt:a,requestHeaders:e.requestHeaders,requestBody:e.requestBody,source:`fetch`}}catch{s={id:o,method:`GET`,url:String(r),startedAt:a,source:`fetch`}}let c=D(s.method,s.url);if(c!==void 0)return ft({rule:c,base:s,input:r,init:i,originalFetch:n,pageWindow:t});if(ot(s.url,e.ignoreUrlPatterns))return n(r,i);A({...s});try{let e=await n(r,i),t;try{let n=await e.clone().text();t=n===``?void 0:it(n)}catch{t=`[unreadable response body]`}return A({...s,durationMs:Date.now()-a,status:e.status,responseHeaders:at(e.headers),responseBody:t}),e}catch(e){throw A({...s,durationMs:Date.now()-a,error:e instanceof Error?e.message:String(e)}),e}}}function mt(t){let n=t.XMLHttpRequest,r=n.prototype.open,i=n.prototype.send,a=n.prototype.setRequestHeader,o=n.prototype.abort,s=he(t),c=/* @__PURE__ */ new WeakMap;n.prototype.open=function(t,n,i,a,o){let s=typeof n==`string`?new URL(n,location.href).href:n.href;return c.set(this,{method:t.toUpperCase(),url:s,requestHeaders:{},id:rt(),startedAt:Date.now(),ignored:ot(s,e.ignoreUrlPatterns),aborted:!1,mockDone:!1}),r.call(this,t,n,i??!0,a,o)},n.prototype.setRequestHeader=function(e,t){let n=c.get(this);return n!==void 0&&(n.requestHeaders[e]=t),a.call(this,e,t)},n.prototype.abort=function(){let e=c.get(this);return e!==void 0&&(e.aborted=!0,e.onMockAbort?.()),o.call(this)};function l(e,n,r,a){let o={...r},c=we(o),l={ruleId:o.id,mode:c};Be(o.id),n.startedAt=Date.now(),n.requestBody=st(a,t);let u=()=>({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,source:`xhr`,mock:l}),d=()=>({...u(),durationMs:Date.now()-n.startedAt}),f=(e,t=`Network error`)=>{A(e.status===0?{...d(),error:t}:{...d(),status:e.status,responseHeaders:pe(e.status,e.body),responseBody:ut(e.body)})};if(A(u()),c===`rewrite`)return s.mask(e,o,n.url,!0),e.addEventListener(`loadend`,()=>{if(n.aborted){A({...d(),error:`Aborted`});return}let t=s.readReal(e);l.real=t.status===0?{error:`Network error`}:{status:t.status,responseHeaders:lt(t.headers),responseBody:ut(t.body)},f(o)}),i.call(e,a);let p=r=>{if(n.aborted||n.mockDone)return;n.mockDone=!0;let i=r===`timeout`?me:o;s.mask(e,i,n.url,!1),f(i,r===`timeout`?`Timeout`:`Network error`),e.dispatchEvent(new t.Event(`readystatechange`)),e.dispatchEvent(new t.ProgressEvent(r)),e.dispatchEvent(new t.ProgressEvent(`loadend`))};n.onMockAbort=()=>{n.mockDone||(n.mockDone=!0,A({...d(),error:`Aborted`}))};let m=s.readTimeout(e);m>0&&(c===`hang`||o.delay>m)&&setTimeout(()=>p(`timeout`),m),c!==`hang`&&setTimeout(()=>p(o.status===0?`error`:`load`),o.delay)}n.prototype.send=function(e){let n=c.get(this);if(n===void 0)return i.call(this,e);let r=D(n.method,n.url);if(r!==void 0)return l(this,n,r,e);if(n.ignored)return i.call(this,e);let a=Date.now();return n.startedAt=a,n.requestBody=st(e,t),A({id:n.id,method:n.method,url:n.url,startedAt:a,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,source:`xhr`}),this.addEventListener(`loadend`,()=>{let e;try{let t=this.responseText;e=t===``?void 0:it(t)}catch{e=ut(s.readReal(this).body)??`[unreadable response body]`}A({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,status:this.status,responseHeaders:lt(this.getAllResponseHeaders()),responseBody:e,source:`xhr`})}),this.addEventListener(`error`,()=>{A({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,error:`Network error`,source:`xhr`})}),this.addEventListener(`abort`,()=>{A({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,error:`Aborted`,source:`xhr`})}),i.call(this,e)}}function ht(){let e=N();pt(e),mt(e)}function P(e){if(e===void 0)return 0;if(typeof e==`string`)return e.length;try{return JSON.stringify(e)?.length??0}catch{return 1/0}}function gt(e){return e.status!==void 0||e.error!==void 0}function _t(t,n=e.sessionRecordsBudgetChars){let r=n;return t.filter(gt).map(e=>{let t=c(e.requestHeaders),n=c(e.responseHeaders),i=P(e.responseBody)+P(e.mock?.real?.responseBody),a=i<=r;a&&(r-=i);let o={...e,url:l(e.url),requestHeaders:t,requestBody:f(e.requestBody,t),responseHeaders:n,responseBody:a?e.responseBody:void 0};if(e.mock?.real!==void 0){let t=c(e.mock.real.responseHeaders);o.mock={...e.mock,real:{...e.mock.real,responseHeaders:t,responseBody:a?e.mock.real.responseBody:void 0}}}return delete o.restored,o})}function vt(t,n=sessionStorage){let r=_t(t);try{n.setItem(e.sessionRecordsStorageKey,JSON.stringify(r))}catch{try{n.setItem(e.sessionRecordsStorageKey,JSON.stringify(_t(t,0)))}catch{}}}function yt(e){if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.id==`string`&&typeof t.method==`string`&&typeof t.url==`string`&&typeof t.startedAt==`number`&&(t.source===`fetch`||t.source===`xhr`)}function F(t=sessionStorage){try{let n=JSON.parse(t.getItem(e.sessionRecordsStorageKey)??`[]`);return Array.isArray(n)?n.filter(yt).slice(0,e.maxEntries).map(e=>({...e,restored:!0})):[]}catch{return[]}}let I;function L(e){return e!==void 0&&e!==`separator`&&e.disabled!==!0}function bt(e,t,n){for(let r=1;r<=e.length;r++){let i=(t+n*r+e.length*2)%e.length;if(L(e[i]))return i}}function xt(e,t,n){let r=t.length===1?(n??-1)+1:n??0,i=t.toLowerCase();for(let t=0;t<e.length;t++){let n=(r+t)%e.length,a=e[n];if(L(a)&&a.label.toLowerCase().startsWith(i))return n}}function St(){I?.()}function Ct(){return I!==void 0}function wt(e,t,n,r){St();let i=document.activeElement instanceof HTMLElement?document.activeElement:void 0,a=document.createElement(`div`);a.className=`nri-menu`,a.setAttribute(`role`,`menu`),a.tabIndex=-1;let o=[],s,c=``,l,u=e=>{s=e,o.forEach((t,n)=>{t?.classList.toggle(`nri-menu-active`,n===e)})},d=e=>{I===f&&(I=void 0,window.removeEventListener(`pointerdown`,m,!0),window.removeEventListener(`contextmenu`,m,!0),window.removeEventListener(`blur`,h),window.removeEventListener(`resize`,h),window.removeEventListener(`scroll`,g,!0),window.clearTimeout(l),a.remove(),e&&i?.isConnected===!0&&i.focus({preventScroll:!0}))},f=()=>{d(!0)},p=e=>{let n=t[e];L(n)&&(d(!0),n.onSelect())};t.forEach((e,t)=>{if(e===`separator`){let e=document.createElement(`div`);e.className=`nri-menu-separator`,e.setAttribute(`role`,`separator`),a.appendChild(e),o.push(void 0);return}let n=document.createElement(`button`);n.type=`button`,n.className=`nri-menu-item`,n.tabIndex=-1,n.setAttribute(`role`,`menuitem`),n.disabled=e.disabled===!0,e.danger===!0&&n.classList.add(`nri-menu-danger`);let r=document.createElement(`span`);if(r.className=`nri-menu-label`,r.textContent=e.label,n.appendChild(r),e.shortcut!==void 0){let t=document.createElement(`span`);t.className=`nri-menu-shortcut`,t.textContent=e.shortcut,n.appendChild(t)}n.addEventListener(`pointermove`,()=>{L(e)&&s!==t&&u(t)}),n.addEventListener(`click`,e=>{e.stopPropagation(),p(t)}),a.appendChild(n),o.push(n)}),a.addEventListener(`pointerleave`,()=>{u(void 0)}),a.addEventListener(`contextmenu`,e=>{e.preventDefault()}),a.addEventListener(`keydown`,e=>{e.stopPropagation();let{key:n}=e;if(n===`ArrowDown`||n===`ArrowUp`){e.preventDefault();let r=n===`ArrowDown`?1:-1,i=s??(r===1?-1:t.length);u(bt(t,i,r))}else if(n===`Home`||n===`End`)e.preventDefault(),u(n===`Home`?bt(t,-1,1):bt(t,t.length,-1));else if(n===`Enter`||n===` `)e.preventDefault(),s!==void 0&&p(s);else if(n===`Escape`||n===`Tab`)e.preventDefault(),d(!0);else if(n.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault(),window.clearTimeout(l),c+=n,l=window.setTimeout(()=>{c=``},800);let r=xt(t,c,s);r!==void 0&&u(r)}});let m=e=>{e.target instanceof Node&&a.contains(e.target)||d(!1)},h=()=>{d(!1)},g=e=>{e.target instanceof Node&&a.contains(e.target)||d(!1)};e.appendChild(a),I=f;let _=a.getBoundingClientRect(),v=n,y=r;v+_.width>window.innerWidth-4&&(v=Math.max(4,n-_.width)),y+_.height>window.innerHeight-4&&(y=Math.max(4,r-_.height)),a.style.left=`${v}px`,a.style.top=`${y}px`,a.focus({preventScroll:!0}),window.setTimeout(()=>{I===f&&(window.addEventListener(`pointerdown`,m,!0),window.addEventListener(`contextmenu`,m,!0),window.addEventListener(`blur`,h),window.addEventListener(`resize`,h),window.addEventListener(`scroll`,g,!0))},0)}let Tt=()=>{try{let e=globalThis;return e.__NRI_STORAGE_BRIDGE__??e.unsafeWindow?.__NRI_STORAGE_BRIDGE__??null}catch{return null}},Et=()=>{try{return typeof GM_getValue==`function`}catch{return!1}},Dt=()=>{try{return typeof GM_setValue==`function`}catch{return!1}},Ot=e=>{if(e==null)return null;if(typeof e==`string`)return e;try{return JSON.stringify(e)}catch{return null}},kt=e=>{try{return localStorage.getItem(e)}catch{return null}},At=(e,t)=>{try{localStorage.setItem(e,t)}catch{}};function R(e){if(Et())try{let t=GM_getValue(e),n=Ot(t);if(n!==null)return n}catch{}let t=Tt();if(t!==null)try{let n=t.get(e),r=Ot(n);if(r!==null)return r}catch{}let n=kt(e);return n===null?null:(z(e,n),n)}function z(e,t){if(Dt())try{GM_setValue(e,t)}catch{}let n=Tt();if(n!==null)try{n.set(e,t)}catch{}At(e,t)}let jt=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function Mt(t){let n=Math.max(e.detailMinHeight,Math.floor(window.innerHeight*.6)),r=Math.min(e.detailMaxHeight,n);return Math.min(r,Math.max(e.detailMinHeight,Math.round(t)))}function Nt(){let t=e.detailDefaultHeight;try{let n=R(e.detailHeightStorageKey);if(n===null)return Mt(t);let r=JSON.parse(n);return typeof r==`object`&&r&&jt(r.height)?Mt(r.height):jt(r)?Mt(r):Mt(t)}catch{return Mt(t)}}function Pt(t){try{z(e.detailHeightStorageKey,JSON.stringify({height:Mt(t)}))}catch{}}function Ft(e,t){let n=(n,r)=>{let i=document.createElement(`div`);return i.className=r,i.dataset.nriDetailResize=n,i.addEventListener(`pointerdown`,r=>{if(r.button!==0)return;r.preventDefault(),r.stopPropagation();let a=r.clientY,o=e(),s=r.pointerId;try{i.setPointerCapture(s)}catch{}let c=e=>{let r=n===`top`?a-e.clientY:e.clientY-a;t(Mt(o+r))},l=()=>{window.removeEventListener(`pointermove`,c),window.removeEventListener(`pointerup`,l),window.removeEventListener(`pointercancel`,l),document.body.style.removeProperty(`cursor`),document.body.style.removeProperty(`user-select`);try{i.releasePointerCapture(s)}catch{}Pt(e())};document.body.style.cursor=`ns-resize`,document.body.style.userSelect=`none`,window.addEventListener(`pointermove`,c),window.addEventListener(`pointerup`,l),window.addEventListener(`pointercancel`,l)}),i};return{top:n(`top`,`nri-detail-resize nri-detail-resize-t`),bottom:n(`bottom`,`nri-detail-resize nri-detail-resize-b`)}}let It=e=>e===`redacted`||e===`raw`;function Lt(){try{let t=R(e.copyModeStorageKey);if(t===null)return e.copyModeDefault;let n=JSON.parse(t);if(typeof n==`object`&&n&&It(n.mode))return n.mode;if(It(n))return n}catch{}return e.copyModeDefault}function Rt(t){try{z(e.copyModeStorageKey,JSON.stringify({mode:t}))}catch{}}function zt(e){if(e!==``)return new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),`gi`)}function Bt(e,t){return Array.from(e.matchAll(t),e=>[e.index,e.index+e[0].length])}function Vt(e){let t=e.parentElement;for(;t!==null&&t.tagName===`SPAN`;)t=t.parentElement;return t}function Ht(e,t,n,r=1/0){let i=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(e){return e instanceof Element?e instanceof HTMLElement&&e.hidden||e.matches(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP:NodeFilter.FILTER_ACCEPT}}),a=[],o=null,s=[],c=()=>{if(s.length===0)return;let e=s.map(e=>e.data).join(``);for(let[n,i]of Bt(e,t)){if(a.length>=r)break;let e=Ut(s,n,!1),t=Ut(s,i,!0);if(e===void 0||t===void 0)continue;let o=document.createRange();o.setStart(e[0],e[1]),o.setEnd(t[0],t[1]),a.push(o)}s=[]};for(let e=i.nextNode();e!==null;e=i.nextNode()){if(!(e instanceof Text)||e.length===0)continue;let t=Vt(e);t!==o&&(c(),o=t),s.push(e)}return c(),a}function Ut(e,t,n){let r=t;for(let t of e){if(n?r<=t.length:r<t.length)return[t,r];r-=t.length}}function Wt(e,t){let n=t.getBoundingClientRect(),r=e.getBoundingClientRect();(n.top<r.top||n.bottom>r.bottom)&&(e.scrollTop+=n.top-r.top-(r.height-n.height)/2),(n.left<r.left||n.right>r.right)&&(e.scrollLeft+=n.left-r.left-(r.width-n.width)/2)}let B=/* @__PURE__ */ new WeakMap,Gt=/* @__PURE__ */ new WeakMap;function V(e,t){let n=document.createElement(`span`);return n.className=e,n.textContent=t,n}function Kt(e){if(e===null)return[`nri-json-null`,`null`];switch(typeof e){case`string`:return[`nri-json-string`,JSON.stringify(e)];case`number`:case`bigint`:return[`nri-json-number`,String(e)];case`boolean`:return[`nri-json-boolean`,String(e)];default:return[`nri-json-null`,typeof e]}}function qt(e){return e===void 0?[]:[V(`nri-json-key`,JSON.stringify(e)),V(`nri-json-punct`,`: `)]}function Jt(e){return e===void 0?``:`${JSON.stringify(e)}: `}function Yt(e){if(typeof e==`object`&&e)return Array.isArray(e)?e.map((e,t)=>[String(t),e]):Object.entries(e)}function Xt(e){return Array.isArray(e)?[`[`,`]`]:[`{`,`}`]}function Zt(e,t,n,r){let i=r?``:`,`,a=Yt(t);if(a===void 0){let n=document.createElement(`div`);return n.className=`nri-json-line`,n.append(...qt(e),V(...Kt(t)),V(`nri-json-punct`,i)),n}let o=Array.isArray(t),[s,c]=Xt(t);if(a.length===0){let t=document.createElement(`div`);return t.className=`nri-json-line`,t.append(...qt(e),V(`nri-json-punct`,`${s}${c}${i}`)),t}let l=document.createElement(`div`),u=document.createElement(`div`);u.className=`nri-json-line nri-json-toggle`;let d=document.createElement(`span`);d.className=`nri-json-chevron`,d.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;let f=o?`item`:`key`,p=document.createElement(`span`);p.className=`nri-json-tail`,p.append(V(`nri-json-summary`,`${a.length} ${f}${a.length===1?``:`s`}`),V(`nri-json-punct`,`${c}${i}`)),u.append(d,...qt(e),V(`nri-json-punct`,s),p);let m=document.createElement(`div`);m.className=`nri-json-children`;let h=document.createElement(`div`);h.className=`nri-json-line`,h.appendChild(V(`nri-json-punct`,`${c}${i}`));let g=0,_,v=()=>{let e=Math.min(a.length,g+200),t=document.createDocumentFragment();a.slice(g,e).forEach(([e,r],i)=>{let s=g+i;t.appendChild(Zt(o?void 0:e,r,n+1,s===a.length-1))}),g=e,_?.remove(),m.appendChild(t),g<a.length&&(_=document.createElement(`button`),_.type=`button`,_.className=`nri-json-more`,_.textContent=`Show More (${a.length-g} remaining)`,_.addEventListener(`click`,v),m.appendChild(_))},y=e=>{e&&g===0&&v(),l.classList.toggle(`nri-json-open`,e),p.hidden=e,m.hidden=!e,h.hidden=!e};return u.addEventListener(`click`,()=>{(window.getSelection()?.toString()??``)===``&&y(!l.classList.contains(`nri-json-open`))}),B.set(l,{header:u,footer:h,revealChild:e=>{for(y(!0);g<=e&&g<a.length;)v();let t=m.children.item(e);return t instanceof HTMLElement?t:void 0}}),l.append(u,m,h),y(n<2),l}function H(e){if(typeof e==`string`){let t=document.createElement(`pre`);return t.className=`nri-source`,t.textContent=e,t}let t=document.createElement(`div`);return t.className=`nri-json`,t.appendChild(Zt(void 0,e,0,!0)),Gt.set(t,e),t}function Qt(e,t,n){let r=[],i=(e,i,a)=>{let o=Math.min(Bt(e,t).length,n-r.length);for(let e=0;e<o;e++)r.push({path:i,part:a,occurrence:e})},a=(e,t,o,s)=>{if(r.length>=n)return;let c=o?``:`,`,l=Yt(t);if(l===void 0){i(`${Jt(e)}${Kt(t)[1]}${c}`,s,`line`);return}let[u,d]=Xt(t);if(l.length===0){i(`${Jt(e)}${u}${d}${c}`,s,`line`);return}i(`${Jt(e)}${u}`,s,`header`);let f=Array.isArray(t);l.forEach(([e,t],n)=>{a(f?void 0:e,t,n===l.length-1,[...s,n])}),i(`${d}${c}`,s,`footer`)};return a(void 0,e,!0,[]),r}function $t(e,t,n){if(e instanceof HTMLElement&&Gt.has(e))return Qt(Gt.get(e),t,n)}function en(e,{path:t,part:n}){let r=e.firstElementChild;for(let e of t)r=(r instanceof HTMLElement?B.get(r):void 0)?.revealChild(e)??null;if(!(r instanceof HTMLElement))return;if(n===`line`)return r;let i=B.get(r);if(i!==void 0)return n===`header`?i.header:(i.revealChild(0),i.footer)}function tn(e,t,n){if(e.length===0)return;let r=e.length-1;if(n===`first`)return e[0];if(n===`last`)return e[r];let i=t===void 0?-1:e.indexOf(t);return i<0?n===`next`?e[0]:e[r]:e[n===`next`?Math.min(r,i+1):Math.max(0,i-1)]}function nn(e,t){return(rn()?e.metaKey:e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(rn()?!e.ctrlKey:!e.metaKey)&&e.key.toLowerCase()===t}function rn(){if(typeof navigator>`u`)return!1;let e=navigator.userAgentData?.platform??navigator.platform;return/mac|iphone|ipad/i.test(e)}function an(e){return rn()?`⌘${e.toUpperCase()}`:`Ctrl+${e.toUpperCase()}`}let on={ids:/* @__PURE__ */ new Set,focusId:void 0,anchorId:void 0};function sn(e){return e===void 0?on:{ids:/* @__PURE__ */ new Set([e]),focusId:e,anchorId:e}}function cn(e,t){let n=new Set(e.ids);if(!n.delete(t))return n.add(t),{ids:n,focusId:t,anchorId:t};let r=Array.from(n),i=e.focusId===t?r.at(-1):e.focusId;return{ids:n,focusId:i,anchorId:i}}function ln(e,t,n){if(n===void 0)return t;let r=e.indexOf(n);if(r<0)return t;let i=t.anchorId??t.focusId??n,a=e.indexOf(i);if(a<0)return sn(n);let[o,s]=a<=r?[a,r]:[r,a];return{ids:new Set(e.slice(o,s+1)),focusId:n,anchorId:i}}function un(e,t){if(e.length===0)return on;let n=t.focusId!==void 0&&e.includes(t.focusId)?t.focusId:e[0];return{ids:new Set(e),focusId:n,anchorId:n}}function dn(e,t){let n=new Set(e),r=new Set(Array.from(t.ids).filter(e=>n.has(e)));if(r.size===t.ids.size)return t;if(r.size===0)return on;let i=t.focusId!==void 0&&r.has(t.focusId)?t.focusId:Array.from(r).at(-1);return{ids:r,focusId:i,anchorId:t.anchorId!==void 0&&n.has(t.anchorId)?t.anchorId:i}}function fn(){try{let t=localStorage.getItem(e.panelCollapsedStorageKey);if(t!==null){let e=JSON.parse(t);if(typeof e==`object`&&e&&typeof e.collapsed==`boolean`)return e.collapsed;if(typeof e==`boolean`)return e}let n=localStorage.getItem(e.panelModeStorageKey);if(n!==null){let e=JSON.parse(n);if(typeof e==`object`&&e&&typeof e.collapsed==`boolean`)return e.collapsed}}catch{}return e.panelDefaultCollapsed}function pn(t){try{localStorage.setItem(e.panelCollapsedStorageKey,JSON.stringify({collapsed:t}))}catch{}}let mn=e=>typeof e==`number`&&Number.isFinite(e);function hn(t,n){let r=e.panelMinBottom,i=Math.max(r,window.innerHeight-Math.max(1,n)-e.panelMinBottom);return Math.min(i,Math.max(r,Math.round(t)))}function gn(t){let n=e.panelDefaultBottom;try{let r=R(e.panelOffsetStorageKey);if(r===null)return hn(n,t);let i=JSON.parse(r);return typeof i!=`object`||!i||!mn(i.bottom)?mn(i)?hn(i,t):hn(n,t):hn(i.bottom,t)}catch{return hn(n,t)}}function U(t,n){try{z(e.panelOffsetStorageKey,JSON.stringify({bottom:hn(t,n)}))}catch{}}function _n(e,t,n,r){let i=!1;e.addEventListener(`click`,e=>{i&&(i=!1,e.preventDefault(),e.stopImmediatePropagation())},!0),e.addEventListener(`pointerdown`,a=>{if(a.button!==0)return;let o=a.clientY,s=n(),c=!1,l=n=>{let a=o-n.clientY;if(!c){if(Math.abs(a)<4)return;c=!0,i=!0,e.setPointerCapture(n.pointerId),document.body.style.userSelect=`none`,document.body.style.cursor=`ns-resize`}r(hn(s+a,t()))},u=r=>{if(window.removeEventListener(`pointermove`,l),window.removeEventListener(`pointerup`,u),window.removeEventListener(`pointercancel`,u),document.body.style.removeProperty(`user-select`),document.body.style.removeProperty(`cursor`),c){try{e.releasePointerCapture(r.pointerId)}catch{}U(n(),t()),window.setTimeout(()=>{i=!1},0)}};window.addEventListener(`pointermove`,l),window.addEventListener(`pointerup`,u),window.addEventListener(`pointercancel`,u)})}let W=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function vn(t){let n=Math.max(e.panelMinWidth,window.innerWidth-32),r=Math.max(e.panelMinHeight,window.innerHeight-80);return{width:Math.min(n,Math.max(e.panelMinWidth,Math.round(t.width))),height:Math.min(r,Math.max(e.panelMinHeight,Math.round(t.height)))}}function yn(){let t={width:e.panelDefaultWidth,height:e.panelDefaultHeight};try{let n=R(e.panelSizeStorageKey);if(n===null)return vn(t);let r=JSON.parse(n);return typeof r!=`object`||!r||!W(r.width)||!W(r.height)?vn(t):vn({width:r.width,height:r.height})}catch{return vn(t)}}function G(t){try{z(e.panelSizeStorageKey,JSON.stringify(vn(t)))}catch{}}function bn(e,t,n){let r=(e,r)=>{let i=document.createElement(`div`);return i.className=r,i.dataset.nriResize=e,i.addEventListener(`pointerdown`,r=>{if(r.button!==0)return;r.preventDefault(),r.stopPropagation();let i=t(),a={edge:e,startX:r.clientX,startY:r.clientY,startWidth:i.width,startHeight:i.height},o=t=>{let r=a.startX-t.clientX,i=a.startY-t.clientY;n(vn({width:e===`top`?a.startWidth:a.startWidth+r,height:e===`left`?a.startHeight:a.startHeight+i}))},s=()=>{window.removeEventListener(`pointermove`,o),window.removeEventListener(`pointerup`,s),window.removeEventListener(`pointercancel`,s),document.body.style.removeProperty(`cursor`),document.body.style.removeProperty(`user-select`),G(t())};document.body.style.cursor=e===`left`?`ew-resize`:e===`top`?`ns-resize`:`nwse-resize`,document.body.style.userSelect=`none`,window.addEventListener(`pointermove`,o),window.addEventListener(`pointerup`,s),window.addEventListener(`pointercancel`,s)}),i};e.append(r(`left`,`nri-resize nri-resize-l`),r(`top`,`nri-resize nri-resize-t`),r(`top-left`,`nri-resize nri-resize-tl`))}let xn=e=>e===`dark`||e===`light`||e===`system`;function Sn(){try{let t=R(e.panelThemeStorageKey);if(t===null)return e.panelDefaultTheme;let n=JSON.parse(t);return typeof n==`object`&&n&&xn(n.theme)?n.theme:xn(n)?n:e.panelDefaultTheme}catch{return e.panelDefaultTheme}}function Cn(t){try{z(e.panelThemeStorageKey,JSON.stringify({theme:t}))}catch{}}function wn(e){return e===`dark`||e===`light`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`}let Tn=e=>e===`vscode`||e===`macos`;function En(){try{let t=R(e.panelPaletteStorageKey);if(t===null)return e.panelDefaultPalette;let n=JSON.parse(t),r=typeof n==`object`&&n?n.palette:n;return Tn(r)?r:e.panelDefaultPalette}catch{return e.panelDefaultPalette}}function Dn(t){try{z(e.panelPaletteStorageKey,JSON.stringify({palette:t}))}catch{}}let On=[{value:`json`,label:`JSON`,title:`JSON`},{value:`doc`,label:`Doc`,title:`HTML and XML documents`},{value:`text`,label:`Text`,title:`Plain text, CSV, and event streams`},{value:`js`,label:`JS`,title:`JavaScript`},{value:`css`,label:`CSS`,title:`Stylesheets`},{value:`img`,label:`Img`,title:`Images`},{value:`media`,label:`Media`,title:`Audio and video`},{value:`font`,label:`Font`,title:`Fonts`},{value:`other`,label:`Other`,title:`Binary, empty, pending, and failed responses`}],kn=[[/\.json$/,`json`],[/\.(html?|xhtml|xml)$/,`doc`],[/\.(txt|csv|md)$/,`text`],[/\.(m?js|cjs)$/,`js`],[/\.css$/,`css`],[/\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/,`img`],[/\.(mp4|webm|ogg|mp3|wav|m4a|aac|flac|m3u8|mpd)$/,`media`],[/\.(woff2?|ttf|otf|eot)$/,`font`]];function An(e){if(e!==void 0){for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.split(`;`)[0].trim().toLowerCase()}}function jn(e){if(e.includes(`json`))return`json`;if(e.includes(`javascript`)||e.includes(`ecmascript`))return`js`;if(e===`text/css`)return`css`;if(e.startsWith(`image/`))return`img`;if(e.startsWith(`audio/`)||e.startsWith(`video/`)||e.includes(`mpegurl`)||e===`application/dash+xml`)return`media`;if(e.startsWith(`font/`)||e.includes(`font`))return`font`;if(e===`text/html`||e.includes(`xml`))return`doc`;if(e.startsWith(`text/`))return`text`}function Mn(e){let t;try{t=new URL(e,`http://localhost/`).pathname.toLowerCase()}catch{return}return kn.find(([e])=>e.test(t))?.[1]}function Nn(e){let t=e.responseBody;if(typeof t==`object`&&t)return`json`;let n=An(e.responseHeaders);return(n===void 0?void 0:jn(n))??Mn(e.url)??`other`}function Pn(e,t){return t.getBoundingClientRect().top-e.getBoundingClientRect().top+e.scrollTop}function Fn(e){let t=e.scrollTop;for(let n of e.children){if(!(n instanceof HTMLElement))continue;let r=n.dataset.recordId;if(r===void 0)continue;let i=Pn(e,n);if(i+n.offsetHeight>t)return{id:r,top:i}}return null}function In(e){let t=e.closest(`.nri-item`);return t instanceof HTMLElement?t.dataset.recordId:void 0}function Ln(e){let t=/* @__PURE__ */ new Map;for(let n of e.querySelectorAll(`.nri-detail-body`)){let e=In(n);e!==void 0&&t.set(e,{top:n.scrollTop,left:n.scrollLeft})}return t}function Rn(e,t){for(let n of e.querySelectorAll(`.nri-detail-body`)){let e=In(n);if(e===void 0)continue;let r=t.get(e);r!==void 0&&(n.scrollTop=r.top,n.scrollLeft=r.left)}}function zn(e,t){let n=e.scrollTop,r=Fn(e),i=Ln(e);if(t(),Rn(e,i),r===null){e.scrollTop=n;return}let a=Array.from(e.children).find(e=>e instanceof HTMLElement&&e.dataset.recordId===r.id);e.scrollTop=a instanceof HTMLElement?n+(Pn(e,a)-r.top):n}function Bn(e){let t=e.trim().charAt(0);return t===`{`||t===`[`}function Vn(e){if(!Bn(e))return``;try{return JSON.parse(e.trim()),``}catch(e){return e instanceof Error?e.message:String(e)}}let Hn=[[`quote`,`quote`,`quotes`],[`comma`,`missing comma`,`missing commas`],[`extra`,`extra comma`,`extra commas`],[`bracket`,`bracket`,`brackets`],[`colon`,`colon`,`colons`],[`other`,`other fix`,`other fixes`]];function Un(e){return Hn.filter(([t])=>(e[t]??0)>0).map(([t,n,r])=>`${e[t]} ${e[t]===1?n:r}`).join(`, `)}let Wn={'"':`"`,"\\":`\\`,"/":`/`,b:`\b`,f:`\f`,n:`
`,r:`\r`,t:`	`,"'":`'`};function Gn(e){return e===`"`?1:e===`“`||e===`”`?2:e===`'`?3:e===`‘`||e===`’`?4:0}function Kn(e){let t=e.length,n={},r=0;function i(e){n[e]=(n[e]??0)+1}function a(){for(;;){for(;r<t&&/\s/.test(e[r]);)r++;if(e[r]===`/`&&e[r+1]===`/`){for(;r<t&&e[r]!==`
`;)r++;i(`other`)}else if(e[r]===`/`&&e[r+1]===`*`){let n=e.indexOf(`*/`,r+2);r=n<0?t:n+2,i(`other`)}else return}}function o(){let n=Gn(e[r]);e[r]!==`"`&&i(`quote`),r++;let a=``;for(;;){let o=e[r];if(r>=t||o===`
`||o===`\r`){let n=r>=t?/[\s}\],]/:/[ \t,]/,o=r-1;for(;o>=0&&n.test(e[o]);)o--;return a=a.slice(0,Math.max(0,a.length-(r-1-o))),r=o+1,i(`quote`),a}let s=Gn(o);if(s!==0&&(s===n||s===n-1&&(n===2||n===4)))return r++,a;if(o===`\\`){let t=e[r+1],n=e.slice(r+2,r+6);if(t===`u`&&/^[0-9a-fA-F]{4}$/.test(n)){a+=String.fromCharCode(parseInt(n,16)),r+=6;continue}if(t!==void 0&&Object.prototype.hasOwnProperty.call(Wn,t)){a+=Wn[t],r+=2;continue}a+=t??``,r+=2,i(`other`)}else a+=o,r++}}function s(){let n=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=[ \t])/.exec(e.slice(r,r+64));if(n!==null){let e=n[0];return r+=e.length,e===`true`||e===`false`?e===`true`:e===`null`?null:Number(e)}let a=r;for(;r<t&&!/[,\]}\n\r"]/.test(e[r]);)r++;let o=e.slice(a,r).trim();if(o===``)throw Error(`empty value`);if(e[r]===`"`&&/^"[ \t]*([,}\]\n\r]|$)/.test(e.slice(r,r+40)))return r++,i(`quote`),o;if(o===`true`||o===`false`)return o===`true`;if(o===`null`)return null;if(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(o))return Number(o);let s=o.toLowerCase();return s===`true`||s===`false`?(i(`other`),s===`true`):s===`null`||s===`none`||s===`nil`||s===`undefined`?(i(`other`),null):/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(o)?(i(`other`),Number(o)):(i(`quote`),o)}function c(){let n=r;for(;r<t&&!/[:=\n\r,}\]]/.test(e[r]);)r++;return e.slice(n,r).trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,``)}function l(t){if(t>200)throw Error(`too deep`);a();let n=e[r];return n===`{`?u(t):n===`[`?d(t):Gn(n)===0?s():o()}function u(n){let s={};for(r++;;){let u=r;if(a(),r>=t)return i(`bracket`),s;let d=e[r];if(d===`}`)return r++,s;if(d===`]`)return i(`bracket`),s;if(d===`,`){r++,i(`extra`);continue}let f;if(Gn(d)!==0)f=o();else{if(f=c(),f===``){r++,i(`other`);continue}i(`quote`)}a(),e[r]===`:`?r++:(e[r]===`=`&&(r+=e[r+1]===`>`?2:1),i(`colon`)),a();let p;r>=t||e[r]===`,`||e[r]===`}`||e[r]===`]`?(p=null,i(`other`)):p=l(n+1),Object.defineProperty(s,f,{value:p,enumerable:!0,writable:!0,configurable:!0}),a(),e[r]===`,`?(r++,a(),(e[r]===`}`||r>=t)&&i(`extra`)):r<t&&e[r]!==`}`&&e[r]!==`]`&&i(`comma`),r===u&&r++}}function d(n){let o=[];for(r++;;){let s=r;if(a(),r>=t)return i(`bracket`),o;let c=e[r];if(c===`]`)return r++,o;if(c===`}`)return i(`bracket`),o;c===`,`?(r++,i(`extra`)):c===`:`?(r++,i(`other`)):(o.push(l(n+1)),a(),e[r]===`,`?(r++,a(),(e[r]===`]`||r>=t)&&i(`extra`)):r<t&&e[r]!==`]`&&e[r]!==`}`&&i(`comma`),r===s&&r++)}}let f;try{if(a(),e[r]!==`{`&&e[r]!==`[`)return;for(f=l(0),a();r<t&&/[\]}\s,;]/.test(e[r]);)/\s/.test(e[r])||i(`other`),r++;if(r<t)return}catch{return}return{text:JSON.stringify(f,null,2),fixes:n,summary:Un(n)}}function qn(e){let t=e.trim();if(!Bn(t))return{error:`The body is not JSON, so there is nothing to format`};try{return{text:JSON.stringify(JSON.parse(t),null,2)}}catch{let e=Kn(t);return e===void 0?{error:`This JSON cannot be repaired automatically; fix it by hand`}:{text:e.text,fixed:e.summary}}}function Jn(e){try{return JSON.stringify(JSON.parse(e),null,2)}catch{return e}}function Yn(e){if(e===void 0)return``;if(e!==`[unreadable response body]`){if(typeof e==`string`)return Jn(e);try{return JSON.stringify(e,null,2)}catch{return}}}function Xn(e){let t=e.mock===void 0?e:e.mock.real;if(t===void 0||t.status===void 0||t.status===0)return;let n=Yn(t.responseBody);return n===void 0?void 0:{status:t.status,body:n}}function Zn(e,t){for(let n of e){if(!Se(t,n.method,n.url))continue;let e=Xn(n);if(e!==void 0)return e}}function Qn(e,t){try{let n=new URL(e,t);return`${n.origin===t?``:n.origin}${n.pathname}`}catch{return e}}function $n({record:e,records:t,pageOrigin:n}){let r=e.method.toUpperCase(),i=Qn(e.url,n),a={method:r,match:i},o=Xn(e)??t.map(Xn).find((e,a)=>e!==void 0&&t[a].method.toUpperCase()===r&&Qn(t[a].url,n)===i);return o!==void 0&&(a.status=o.status,a.body=o.body,a.orig=o),a}function er(e,t){let n=t===`}`?`{`:`[`,r=0,i=!1;for(let a=0;a<e.length;a++){let o=e[a];i?o===`\\`?a++:(o===`"`||o===`
`)&&(i=!1):o===`"`?i=!0:o===n?r++:o===t&&r--}return r<=0}function tr({value:e,start:t,end:n},{key:r,shiftKey:i}){if(e.trim()!==``&&!/^\s*[[{]/.test(e))return;let a=t!==n,o=e.charAt(t-1),s=e.charAt(n),c=e.slice(e.lastIndexOf(`
`,t-1)+1,t),l=(c.replace(/\\./g,``).match(/"/g)??[]).length%2==1,u=s===``||/[\s,\]}:]/.test(s);if(r===`Tab`&&!i)return{kind:`insert`,text:`  `};if(r===`Enter`&&!i){let e=/^[ \t]*/.exec(c)?.[0]??``,t=/[[{][ \t]*$/.test(c),n=t&&!a&&(s===`}`||s===`]`);return{kind:`insert`,text:`\n${e}${t?`  `:``}${n?`\n${e}`:``}`,caretBack:n?e.length+1:void 0}}if(r===`Backspace`){let e=o+s;return!a&&(e===`""`||e===`{}`||e===`[]`)?{kind:`insert`,text:``,select:[t-1,t+1]}:void 0}if(r===`"`)return o===`\\`?void 0:a?{kind:`insert`,text:`"${e.slice(t,n)}"`}:l?s===`"`?{kind:`move`,to:t+1}:void 0:u?{kind:`insert`,text:`""`,caretBack:1}:void 0;if(r===`{`||r===`[`){if(l)return;let i=r===`{`?`}`:`]`;return a?{kind:`insert`,text:`${r}${e.slice(t,n)}${i}`}:u?{kind:`insert`,text:`${r}${i}`,caretBack:1}:void 0}if((r===`}`||r===`]`)&&!a&&s===r&&!l&&er(e,r))return{kind:`move`,to:t+1}}let nr=`the body becomes an error payload`,rr=[{label:`500`,status:500,title:`Internal Server Error; ${nr}`},{label:`502`,status:502,title:`Bad Gateway; ${nr}`},{label:`504`,status:504,title:`Gateway Timeout; ${nr}`},{label:`401`,status:401,title:`Unauthorized or session expired; ${nr}`},{label:`403`,status:403,title:`Forbidden; ${nr}`},{label:`Offline`,status:0,title:`Network error: the request never reaches the server`},{label:`Slow 3s`,delay:3e3,title:`Keep everything else and respond after 3 seconds`},{label:`Empty list`,empty:!0,title:`Respond 200 with the lists in the body emptied (needs the captured response)`},{label:`Never respond`,hang:!0,title:`Leave the request pending to check loading states and the page's own timeout`}];function K(e,t){let n=!1;try{let t=JSON.parse(e);n=typeof t==`object`&&!!t&&typeof t.code==`string`}catch{}let r=ce(t);return JSON.stringify({code:n?String(t):t,message:`${r===``?`Error`:r} (mock)`},null,2)}let ir=/^(total|count|totalCount|totalElements|totalPages)$/i;function ar(e){let t;try{t=JSON.parse(e)}catch{return}if(Array.isArray(t))return`[]`;if(typeof t!=`object`||!t)return;let n=0;function r(e,t){for(let i of Object.keys(e)){let a=e[i];Array.isArray(a)?(e[i]=[],n+=1):typeof a==`object`&&a?t<2&&r(a,t+1):typeof a==`number`&&ir.test(i)&&(e[i]=0)}}return r(t,1),n>0?JSON.stringify(t,null,2):void 0}function or(e,t){if(t.hang===!0)return{rule:{...e,mode:`hang`}};let n={...e};if(t.empty===!0){let t=ar(e.body);if(t===void 0)return{error:`No list found in the response body. Create the rule from a captured request, then use Empty list.`};n.status=200,n.body=t}return n.mode===`hang`&&(n.mode=`block`),t.status!==void 0&&(n.status=t.status,t.status>=400&&(n.body=K(e.body,t.status))),t.delay!==void 0&&(n.delay=t.delay),{rule:n}}function sr(e,t){let n=e.orig??t;return n===void 0?{error:`No original response for this request yet. Disable the rule, let the page make the real request once, then reset.`}:{rule:{...e,status:n.status,body:n.body,mode:`block`,delay:0,orig:n}}}let cr=[{value:`block`,label:`Block`},{value:`rewrite`,label:`Pass through`},{value:`hang`,label:`Hang`}];function lr(e){return e===`rewrite`?`pass-through`:e}function ur(e){let t=e;return`
        ${t} .nri-panel[data-view="rules"] > :is(.nri-searchbar, .nri-typebar, .nri-list, .nri-detail) {
            display: none;
        }
        ${t} .nri-rules {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${t} .nri-rules-bar {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px 6px 12px;
            flex-shrink: 0;
        }
        ${t} .nri-rules-bar label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: var(--nri-label-secondary);
            white-space: nowrap;
        }
        ${t} .nri-rules-bar label.nri-paused {
            color: var(--nri-orange);
            font-weight: 600;
        }
        ${t} .nri-rules-hint {
            padding: 0 12px 6px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
            flex-shrink: 0;
        }
        ${t} .nri-rules-list {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 8px 8px;
        }
        ${t} .nri-rules-empty {
            padding: 18px 8px;
            color: var(--nri-label-secondary);
            text-align: center;
            line-height: 1.5;
        }
        ${t} .nri-rule {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 8px;
            background: var(--nri-row-alt);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            transition: box-shadow 0.3s ease;
        }
        ${t} .nri-rule.nri-rule-off > :not(:first-child) {
            opacity: 0.5;
        }
        ${t} .nri-rule.nri-rule-flash {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${t} .nri-rule-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 6px;
        }
        ${t} .nri-rule-label {
            color: var(--nri-label-secondary);
            font-size: 11px;
            white-space: nowrap;
        }
        ${t} .nri-check {
            width: 13px;
            height: 13px;
            margin: 0;
            accent-color: var(--nri-selection);
            flex: 0 0 auto;
        }
        /* 页面常会给 input / select / textarea 设白底、边框和字号（甚至 !important），面板主题必须优先 */
        ${t} .nri-field {
            height: 22px;
            margin: 0;
            padding: 0 6px;
            border: 0 !important;
            border-radius: 6px;
            background: var(--nri-fill) !important;
            box-shadow: none;
            color: var(--nri-label) !important;
            font-size: 12px !important;
            line-height: normal !important;
            outline: none !important;
            min-width: 0;
        }
        ${t} .nri-field:focus {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${t} select.nri-field {
            padding: 0 2px 0 4px;
            color-scheme: light dark;
        }
        ${t} select.nri-field option {
            background: var(--nri-menu-opaque);
            color: var(--nri-label);
        }
        ${t} .nri-field-grow {
            flex: 1;
            min-width: 120px;
        }
        ${t} .nri-field-num {
            width: 58px;
            font-variant-numeric: tabular-nums;
        }
        ${t} .nri-rule-hits {
            margin-left: auto;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${t} .nri-rule-hits.nri-spent {
            color: var(--nri-orange);
        }
        ${t} .nri-chips {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin-bottom: 6px;
        }
        ${t} .nri-chip {
            height: 18px;
            padding: 0 7px;
            border: 0;
            border-radius: 9px;
            background: var(--nri-fill);
            color: var(--nri-label);
            font-size: 11px;
            white-space: nowrap;
        }
        ${t} .nri-chip:hover {
            background: var(--nri-fill-pressed);
        }
        ${t} .nri-chip.nri-chip-end {
            margin-left: auto;
            color: var(--nri-blue);
        }
        ${t} .nri-rule-bodywrap {
            position: relative;
        }
        ${t} textarea.nri-rule-body {
            display: block;
            width: 100%;
            height: 44px;
            min-height: 44px;
            padding: 5px 7px;
            resize: vertical;
            overflow: auto;
            white-space: pre;
            font-family: var(--nri-font-mono) !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            user-select: text;
        }
        ${t} textarea.nri-rule-body.nri-invalid {
            box-shadow: inset 0 0 0 1px var(--nri-red);
        }
        /* 「Format」浮在编辑框右上角，不占一行；往左让开滚动条 */
        ${t} .nri-rule-format {
            position: absolute;
            top: 4px;
            right: 18px;
            opacity: 0.85;
        }
        ${t} .nri-rule-format:hover {
            opacity: 1;
        }
        ${t} .nri-rule-error {
            margin-top: 4px;
            color: var(--nri-red);
            font-size: 11px;
            line-height: 1.4;
            user-select: text;
        }
        ${t} .nri-rule-note {
            margin-top: 6px;
            padding: 5px 8px;
            border-radius: 6px;
            background: var(--nri-fill);
            color: var(--nri-label-secondary);
            font-size: 11px;
            line-height: 1.4;
        }
        ${t} .nri-rule-note.nri-danger {
            background: color-mix(in srgb, var(--nri-red) 14%, transparent);
            color: var(--nri-red);
        }
        ${t} .nri-rule-error .nri-text-btn,
        ${t} .nri-rule-note .nri-text-btn {
            margin-left: 6px;
            font-weight: 600;
        }
        ${t} .nri-text-btn.nri-danger {
            color: var(--nri-red);
            font-weight: 600;
        }
    `}function q(e,t,n){let r=document.createElement(e);return t!==void 0&&(r.className=t),n!==void 0&&(r.textContent=n),r}function J(e,t,n,r){let i=q(`button`,e,t);return i.type=`button`,i.title=n,i.addEventListener(`click`,r),i}function dr(e){return e.times>0?`Hits ${e.hits} / ${e.times}${xe(e)?` — spent`:``}`:`Hits ${e.hits}`}function fr(e){if(e===`rewrite`)return{text:`The request is really sent and executed; only the response the page sees is replaced. Orders, payments and approvals still take effect.`,danger:!0};if(e===`hang`)return{text:`The request is not sent and never completes: use it to check loading states and the page's own timeout. Status, body and delay are ignored.`,danger:!1}}function pr(e,t){if(t.kind===`move`){e.setSelectionRange(t.to,t.to);return}t.select!==void 0&&e.setSelectionRange(t.select[0],t.select[1]);let n=!1;try{n=document.execCommand(t.text===``?`delete`:`insertText`,!1,t.text)}catch{}if(n||(e.setRangeText(t.text,e.selectionStart,e.selectionEnd,`end`),e.dispatchEvent(new Event(`input`))),t.caretBack!==void 0){let n=e.selectionStart-t.caretBack;e.setSelectionRange(n,n)}}function mr(e,t){let n=e,r=!1;function i(e,t=!1){n={...n,...e},r=t,Le(n),r=!1}let a=q(`div`,`nri-rule`),o=q(`input`,`nri-check`);o.type=`checkbox`,o.title=`Enable this rule`,o.addEventListener(`change`,()=>i({on:o.checked}));let s=q(`select`,`nri-field`);s.title=`Request method`;for(let e of ge){let t=q(`option`,void 0,e);t.value=e,s.appendChild(t)}s.addEventListener(`change`,()=>i({method:s.value}));let c=q(`input`,`nri-field nri-field-grow`);c.type=`text`,c.spellcheck=!1,c.autocomplete=`off`,c.placeholder=`Part of the URL, e.g. /api/transfers; start with re: for a regex`,c.setAttribute(`aria-label`,`URL match`),c.addEventListener(`input`,()=>i({match:c.value}));let l=J(`nri-btn`,`✕`,`Delete this rule`,()=>Re(n.id)),u=q(`div`,`nri-rule-row`);u.append(o,s,c,l);function d(e,t){let r=q(`input`,`nri-field nri-field-num`);return r.type=`number`,r.min=`0`,r.title=t,r.addEventListener(`change`,()=>{let t=ye({...n,[e]:r.value})[e];r.value=String(t),i({[e]:t})}),r}let f=d(`status`,`HTTP status, 200–599; 0 = network error`),p=d(`delay`,`Wait this many milliseconds before responding`),m=d(`times`,`Apply at most this many times, then let requests through; 0 = no limit`),h=q(`select`,`nri-field`);h.title=`Block: not sent, the rule answers. Pass through: really sent and executed, the page sees the rule's response. Hang: not sent, never answers`;for(let{value:e,label:t}of cr){let n=q(`option`,void 0,t);n.value=e,h.appendChild(n)}h.addEventListener(`change`,()=>i({mode:h.value},!0));let g=q(`span`,`nri-rule-hits`),_=J(`nri-text-btn`,`Reset`,`Set the hit count back to 0`,()=>i({hits:0})),v=q(`div`,`nri-rule-row`);v.append(q(`span`,`nri-rule-label`,`Respond`),f,h,g,_);let y=q(`div`,`nri-rule-row`);y.append(q(`span`,`nri-rule-label`,`Delay`),p,q(`span`,`nri-rule-label`,`ms`),q(`span`,`nri-rule-label`,`Max hits`),m,q(`span`,`nri-rule-label`,`(0 = no limit)`));function ee(e){`error`in e?M(`info`,e.error,4e3):(ne.hidden=!0,i(e.rule,!0))}let b=q(`div`,`nri-chips`);b.append(q(`span`,`nri-rule-label`,`Presets`));for(let e of rr)b.append(J(`nri-chip`,e.label,e.title,()=>ee(or(n,e))));b.append(J(`nri-chip nri-chip-end`,`↺ Reset`,`Back to the captured response: restore status and body, block mode, no delay`,()=>ee(sr(n,t.findRealResponse(n)))));let x=q(`textarea`,`nri-field nri-rule-body`);x.spellcheck=!1,x.placeholder=`Response body`,x.setAttribute(`aria-label`,`Response body`);let te=q(`div`,`nri-rule-error`),ne=q(`div`,`nri-rule-note`);ne.hidden=!0;let re=q(`div`,`nri-rule-note`);function ie(){let e=n.body.split(`
`).length;x.style.height=`${Math.min(260,Math.max(44,e*16.5+12))}px`}let ae=J(`nri-text-btn`,`Auto-fix`,`Add missing quotes, commas and brackets, drop stray commas, then re-indent. Can be undone`,ce);function oe(){let e=Vn(n.body);te.hidden=e===``,te.replaceChildren(...e===``?[]:[`The body is not valid JSON, so the page will fail to parse it: ${e}`,ae]),x.classList.toggle(`nri-invalid`,e!==``)}function se(e){x.value=e,i({body:e}),oe(),ie()}function ce(){let e=qn(n.body);if(`error`in e){M(`info`,e.error,3e3);return}if(e.text===n.body){M(`info`,`Already formatted`,1500);return}let t=n.body;se(e.text),ne.replaceChildren(e.fixed===void 0?`Re-indented.`:`Fixed ${e.fixed}. Check that the result is what you meant.`,J(`nri-text-btn`,`Undo`,`Put the body back the way it was`,()=>{se(t),ne.hidden=!0})),ne.hidden=!1}x.addEventListener(`input`,()=>{ne.hidden=!0,i({body:x.value}),oe()}),x.addEventListener(`keydown`,e=>{if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;let t=tr({value:x.value,start:x.selectionStart,end:x.selectionEnd},{key:e.key,shiftKey:e.shiftKey});t!==void 0&&(e.preventDefault(),pr(x,t))});let le=J(`nri-push-btn nri-rule-format`,`Format`,`Re-indent the JSON; broken JSON (missing quotes, commas, brackets) is repaired first`,ce),ue=q(`div`,`nri-rule-bodywrap`);ue.append(x,le),a.append(u,v,y,b,ue,te,ne,re);function S(e,t){(r||document.activeElement!==e)&&e.value!==t&&(e.value=t)}function de(e){let t=e.body!==x.value;n=e,a.classList.toggle(`nri-rule-off`,!n.on),o.checked=n.on,S(s,n.method),S(c,n.match),S(f,String(n.status)),S(h,n.mode),S(p,String(n.delay)),S(m,String(n.times)),S(x,n.body),g.textContent=dr(n),g.classList.toggle(`nri-spent`,xe(n));let r=fr(n.mode);re.hidden=r===void 0,re.textContent=r?.text??``,re.classList.toggle(`nri-danger`,r?.danger===!0),t&&x.value===n.body&&(oe(),ie())}return x.value=n.body,oe(),ie(),de(n),{id:n.id,el:a,sync:de}}function hr(e){let t=q(`div`,`nri-rules`);t.hidden=!0;let n=J(`nri-push-btn`,`+ New Rule`,`Add an empty rule`,()=>{let e=Ie({});h(e.id),f.get(e.id)?.el.querySelector(`input[type="text"]`)?.focus()}),r=q(`input`,`nri-check`);r.type=`checkbox`,r.addEventListener(`change`,()=>E(r.checked));let i=q(`label`);i.title=`Turn every rule off for now; the rules themselves are kept`,i.append(r,`Pause All`);let a;function o(){a!==void 0&&(clearTimeout(a),a=void 0),s.textContent=`Clear All`,s.classList.remove(`nri-danger`)}let s=J(`nri-text-btn`,`Clear All`,`Delete every rule`,()=>{if(a===void 0){let e=Ne().length;s.textContent=`Click again to delete ${e===1?`the rule`:`all ${e} rules`}`,s.classList.add(`nri-danger`),a=setTimeout(o,3e3)}else o(),ze()}),c=q(`div`,`nri-rules-bar`);c.append(n,i,q(`span`,`nri-spacer`),s);let l=q(`div`,`nri-rules-hint`,`Rule bodies are stored and shown unredacted — the page must receive the real content.`),u=q(`div`,`nri-rules-list`),d=q(`div`,`nri-rules-empty`,`No rules yet. Select a request and choose Mock, or add a rule by hand.`);t.append(c,l,u);let f=/* @__PURE__ */ new Map,p=[];function m(){let t=Ne(),n=t.map(e=>e.id);if(n.length!==p.length||n.some((e,t)=>e!==p.at(t))){for(let e of p)n.includes(e)||f.delete(e);for(let n of t)f.has(n.id)||f.set(n.id,mr(n,e));p=n;let r=n.flatMap(e=>{let t=f.get(e);return t===void 0?[]:[t.el]});u.replaceChildren(...r.length===0?[d]:r),o()}for(let e of t)f.get(e.id)?.sync(e);let a=Pe();r.checked=a,i.classList.toggle(`nri-paused`,a),s.hidden=t.length===0,l.hidden=t.length===0}function h(e){let t=f.get(e);if(t===void 0)return;let n=u.getBoundingClientRect(),r=t.el.getBoundingClientRect();r.top<n.top?u.scrollTop-=n.top-r.top+8:r.bottom>n.bottom&&(u.scrollTop+=Math.min(r.top-n.top-8,r.bottom-n.bottom+8)),t.el.classList.add(`nri-rule-flash`),setTimeout(()=>t.el.classList.remove(`nri-rule-flash`),1200)}return u.replaceChildren(d),m(),Fe(m),{el:t,reveal:h,focus:()=>{n.focus({preventScroll:!0})}}}let gr={code:`KeyH`,alt:!1,ctrl:!1,meta:!1,shift:!1},_r=/* @__PURE__ */ new Set([`ShiftLeft`,`ShiftRight`,`ControlLeft`,`ControlRight`,`AltLeft`,`AltRight`,`MetaLeft`,`MetaRight`,`OSLeft`,`OSRight`,`CapsLock`,`Fn`]),vr=/* @__PURE__ */ new Set([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`Home`,`End`,`Enter`,`NumpadEnter`,`Tab`,`Escape`]),yr=/* @__PURE__ */ new Set([`KeyA`,`KeyC`,`KeyF`,`KeyK`,`KeyV`,`KeyX`,`KeyZ`]),br={Space:`Space`,Backquote:"`",Minus:`-`,Equal:`=`,BracketLeft:`[`,BracketRight:`]`,Backslash:`\\`,Semicolon:`;`,Quote:`'`,Comma:`,`,Period:`.`,Slash:`/`,ArrowUp:`↑`,ArrowDown:`↓`,ArrowLeft:`←`,ArrowRight:`→`,PageUp:`PgUp`,PageDown:`PgDn`,Insert:`Ins`},xr=e=>{if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.code==`string`&&t.code!==``&&typeof t.alt==`boolean`&&typeof t.ctrl==`boolean`&&typeof t.meta==`boolean`&&typeof t.shift==`boolean`};function Sr(){try{let t=R(e.toggleShortcutStorageKey);if(t===null)return gr;let n=JSON.parse(t);if(typeof n==`object`&&n&&`shortcut`in n){let e=n.shortcut;if(e===null)return null;if(xr(e))return e}}catch{}return gr}function Cr(t){try{z(e.toggleShortcutStorageKey,JSON.stringify({shortcut:t}))}catch{}}function wr(e,t){return e===null||t===null?e===t:e.code===t.code&&e.alt===t.alt&&e.ctrl===t.ctrl&&e.meta===t.meta&&e.shift===t.shift}function Tr(e){if(!(e.code===``||_r.has(e.code)))return{code:e.code,alt:e.altKey,ctrl:e.ctrlKey,meta:e.metaKey,shift:e.shiftKey}}function Er(e,t){return e.code===t.code&&e.altKey===t.alt&&e.ctrlKey===t.ctrl&&e.metaKey===t.meta&&e.shiftKey===t.shift}function Dr(e){return!e.alt&&!e.ctrl&&!e.meta}function Or(e,t){if(Dr(e)&&vr.has(e.code))return`used to navigate the panel`;let n=t?e.meta:e.ctrl,r=t?e.ctrl:e.meta;if(n&&!r&&!e.alt&&!e.shift&&yr.has(e.code))return`used by the panel or for editing`}function Y(e){let t=br[e];if(t!==void 0)return t;let n=/^(?:Key|Digit|Numpad)(.+)$/.exec(e);return n?.[1]===void 0?e:n[1]}function kr(e,t){let n=Y(e.code);return t?[e.ctrl?`⌃`:``,e.alt?`⌥`:``,e.shift?`⇧`:``,e.meta?`⌘`:``,n].join(``):[e.ctrl?`Ctrl`:``,e.alt?`Alt`:``,e.shift?`Shift`:``,e.meta?`Win`:``,n].filter(e=>e!==``).join(`+`)}let Ar=/* @__PURE__ */ new Set([`text`,`search`,`email`,`url`,`tel`,`password`,`number`,`date`,`datetime-local`,`month`,`week`,`time`]);function jr(e){let t=e.composedPath()[0]??e.target;return t instanceof Element?t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement?!0:t instanceof HTMLInputElement?Ar.has(t.type):t instanceof HTMLElement&&t.isContentEditable:!1}let Mr=/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,Nr=/^\d+$/;function X(e){let t=Mr.exec(e.trim());return t===null?null:{major:Number(t[1]),minor:Number(t[2]),patch:Number(t[3]),prerelease:t[4]===void 0?[]:t[4].split(`.`)}}function Pr(e,t){let n=Nr.test(e),r=Nr.test(t);return n&&r?Math.sign(Number(e)-Number(t)):n===r?e===t?0:e<t?-1:1:n?-1:1}function Fr(e,t){let n=X(e),r=X(t);if(n===null||r===null)throw Error(`Invalid version: ${JSON.stringify(n===null?e:t)}`);for(let e of[`major`,`minor`,`patch`])if(n[e]!==r[e])return n[e]<r[e]?-1:1;if(n.prerelease.length===0||r.prerelease.length===0)return Math.sign(r.prerelease.length-n.prerelease.length);let i=Math.min(n.prerelease.length,r.prerelease.length);for(let e=0;e<i;e+=1){let t=Pr(n.prerelease.at(e)??``,r.prerelease.at(e)??``);if(t!==0)return t}return Math.sign(n.prerelease.length-r.prerelease.length)}function Ir({body:e,currentVersion:t}){let n;try{n=JSON.parse(e)}catch{return{status:`failed`,reason:`Update manifest is not valid JSON`}}let r=typeof n==`object`&&n?n.version:void 0;if(typeof r!=`string`)return{status:`failed`,reason:`Update manifest has no version`};try{return Fr(r,t)>0?{status:`available`,version:r}:{status:`up-to-date`}}catch{return{status:`failed`,reason:`Invalid version ${JSON.stringify(r)}`}}}function Lr({manifestUrl:e,currentVersion:t}){return new Promise(n=>{typeof GM_xmlhttpRequest==`function`?GM_xmlhttpRequest({method:`GET`,url:e,timeout:1e4,headers:{"Cache-Control":`no-cache`},onload:e=>{e.status===200?n(Ir({body:e.responseText,currentVersion:t})):n({status:`failed`,reason:`Update server returned HTTP ${e.status}`})},onerror:()=>n({status:`failed`,reason:`Could not reach the update server`}),ontimeout:()=>n({status:`failed`,reason:`Update check timed out`})}):n({status:`failed`,reason:`Update check is unavailable in this build`})})}function Rr(){try{return R(e.includeBetaStorageKey)===`true`}catch{return!1}}function zr(t){try{z(e.includeBetaStorageKey,String(t))}catch{}}function Br(e){return e?`beta`:`latest`}function Vr(e){let t=String(e.getMonth()+1).padStart(2,`0`),n=String(e.getDate()).padStart(2,`0`);return`${e.getFullYear()}-${t}-${n}`}function Hr(t=/* @__PURE__ */ new Date){let n=Vr(t);try{return R(e.betaCheckDateStorageKey)!==n&&(z(e.betaCheckDateStorageKey,n),R(e.betaCheckDateStorageKey)===n)}catch{return!1}}function Ur({pointerY:e,targetLeft:t,width:n,height:r,viewportWidth:i,viewportHeight:a}){let o=e+12;o+r>a-4&&(o=e-12-r);let s=Math.min(Math.max(t,4),i-4-n);return{top:Math.max(o,4),left:Math.max(s,4)}}function Wr(e,t){return e instanceof Element?e.closest(t):null}function Gr(e){let t,n,r=[],i=0,a,o=-1/0,s=()=>t!==void 0&&!t.hidden,c=(n,r)=>{t?.isConnected!==!0&&(t=document.createElement(`div`),t.className=`nri-tooltip`,t.setAttribute(`role`,`tooltip`),e.appendChild(t)),t.textContent=r,t.hidden=!1;let{width:a,height:o}=t.getBoundingClientRect(),{top:s,left:c}=Ur({pointerY:i,targetLeft:n.getBoundingClientRect().left,width:a,height:o,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight});t.style.top=`${s}px`,t.style.left=`${c}px`},l=()=>{window.clearTimeout(a),a=void 0,s()&&(o=Date.now()),t!==void 0&&(t.hidden=!0)},u=e=>{let t=e.getAttribute(`title`);t!==null&&(e.dataset.nriTooltip=t,e.removeAttribute(`title`),r.includes(e)||r.push(e))},d=()=>{l();for(let e of r){let t=e.dataset.nriTooltip;t!==void 0&&(e.setAttribute(`title`,t),delete e.dataset.nriTooltip)}r=[],n?.classList.remove(`nri-tooltip-active`),n=void 0},f=(t,r)=>{let l=t.getAttribute(`title`)??t.dataset.nriTooltip??``;if(l===``)return;let f=s()||Date.now()-o<200;d(),n=t,i=r,t.classList.add(`nri-tooltip-active`);for(let n=t;n!==null&&e.contains(n);n=n.parentElement)u(n);let p=()=>{a=void 0,n===t&&t.isConnected&&c(t,t.dataset.nriTooltip??l)};f?p():a=window.setTimeout(p,1500)},p=e=>{let t=Wr(e.target,`[title], .nri-tooltip-active`);t!==null&&t!==n&&f(t,e.clientY)},m=e=>{i=e.clientY;for(let e of r){let r=e.getAttribute(`title`);r!==null&&(u(e),e===n&&t!==void 0&&s()&&(t.textContent=r))}},h=t=>{if(n===void 0||Wr(t.target,`.nri-tooltip-active`)!==n||t.relatedTarget instanceof Node&&n.contains(t.relatedTarget))return;d();let r=Wr(t.relatedTarget,`[title]`);r!==null&&e.contains(r)&&f(r,t.clientY)},g=()=>{l(),o=-1/0};e.addEventListener(`mouseenter`,p,!0),e.addEventListener(`mousemove`,m,!0),e.addEventListener(`mouseover`,m,!0),e.addEventListener(`mouseleave`,h,!0),e.addEventListener(`mousedown`,g,!0),e.addEventListener(`scroll`,g,!0),window.addEventListener(`keydown`,g,!0)}let Kr={version:`0.0.0`,dev:!0};function qr(){try{if(typeof __NRI_BUILD__==`object`&&__NRI_BUILD__!==null)return __NRI_BUILD__}catch{}return Kr}function Jr(){let{version:e,dev:t}=qr();return t?`v${e} (dev)`:`v${e}`}function Yr(e){return e.replace(/\[([^\]]+)\]\([^)]*\)/g,`$1`).split(/(`[^`]+`|\*\*[^*]+\*\*)/).filter(e=>e!==``).map(e=>e.length>2&&e.startsWith("`")&&e.endsWith("`")?{kind:`code`,text:e.slice(1,-1)}:e.length>4&&e.startsWith(`**`)&&e.endsWith(`**`)?{kind:`strong`,text:e.slice(2,-2)}:{kind:`text`,text:e})}function Xr(e,t){try{return Fr(e,t)>0}catch{return!1}}function Zr(e){let t=X(e);return t===null?void 0:`${t.major}.${t.minor}.${t.patch}`}function Qr({changelog:e,current:t,since:n}){let r=e.filter(e=>X(e.version)!==null&&!Xr(e.version,t)&&(n===void 0||Xr(e.version,n))),i=new Set(r.filter(e=>X(e.version)?.prerelease.length===0).map(e=>e.version));return r.filter(e=>{let t=Zr(e.version);return t===e.version||t===void 0||!i.has(t)}).sort((e,t)=>Fr(t.version,e.version))}function $r({changelog:t,current:n}){let r;try{r=R(e.seenVersionStorageKey)}catch{return}if(r===n)return;try{if(z(e.seenVersionStorageKey,n),R(e.seenVersionStorageKey)!==n)return}catch{return}if(r===null||!Xr(n,r))return;let i=Qr({changelog:t,current:n,since:r});return i.length>0?{from:r,entries:i}:void 0}let ei=`nri-root`,ti=`nri-panel-style`,Z=`#${ei}`,ni=[`body`,`headers`,`request`],ri=`button, svg, .nri-json-tail, .nri-section-title, .nri-empty-hint, .nri-truncated`,ii=1e3;function ai(){if(document.getElementById(ti)!==null)return;let t=document.createElement(`style`);t.id=ti,t.textContent=`
        /* macOS 系统色 token：默认深色；data-nri-theme=light 覆盖为浅色 */
        ${Z} {
            /* 取自 VS Code 默认主题 Dark 2026（参考界面 sower-tools-vscode Request Runner 的配色来源） */
            --nri-label: #bfbfbf;
            --nri-label-strong: #bfbfbf;
            --nri-label-secondary: #8c8c8c;
            --nri-label-tertiary: #555555;
            --nri-separator: #2a2b2c;
            --nri-fill: rgba(191, 191, 191, 0.1);
            --nri-fill-pressed: rgba(191, 191, 191, 0.18);
            --nri-row-alt: rgba(191, 191, 191, 0.04);
            /* VS Code 经典蓝 #007ACC：焦点、选中与菜单高亮 */
            --nri-focus-border: #007acc;
            --nri-focus-ring: rgba(0, 122, 204, 0.55);
            /* 选中：经典蓝底 + 白字；失焦退为灰色 */
            --nri-selection: #007acc;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(191, 191, 191, 0.16);
            /* 结构参数：VS Code 风格为不透明面板、1px 分隔线 */
            --nri-hairline: 1px;
            --nri-panel-radius: 10px;
            --nri-panel-backdrop: none;
            --nri-green: #73c991;
            --nri-blue: #3794ff;
            --nri-orange: #cca700;
            --nri-red: #f48771;
            --nri-json-key: #bfbfbf;
            --nri-json-string: #ce9178;
            --nri-json-number: #b5cea8;
            --nri-json-boolean: #4e94ce;
            /* 面板不透明，避免宿主页面透出导致发灰 */
            --nri-window: #121314;
            --nri-sidebar: #191a1b;
            --nri-window-edge: #2a2b2c;
            --nri-window-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
            --nri-menu: rgba(32, 33, 34, 0.82);
            --nri-menu-opaque: rgb(32, 33, 34);
            --nri-menu-edge: #2a2b2c;
            --nri-menu-shadow: rgba(0, 0, 0, 0.45);
            --nri-hud: rgba(32, 33, 34, 0.88);
            --nri-hud-hover: rgba(32, 33, 34, 0.98);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px #2a2b2c;
            --nri-segment-selected: rgba(191, 191, 191, 0.22);
            --nri-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            --nri-scrollbar-thumb: rgba(191, 191, 191, 0.28);
            --nri-scrollbar-thumb-hover: rgba(191, 191, 191, 0.45);
            /* 贴边态：两主题统一用深色胶囊，叠加透明度后观感一致 */
            --nri-toggle-bg-idle: rgba(18, 19, 20, 0.9);
            --nri-toggle-fg-idle: #e0e0e0;
            --nri-toggle-idle-opacity: 0.32;
            /* 面板始终使用自带字体，不继承宿主页面 */
            --nri-font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", Roboto, Arial, sans-serif;
            --nri-font-mono: "SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace;

            position: fixed;
            right: 16px;
            /* bottom 由 JS 写入 --nri-panel-bottom，折叠/展开共用同一锚点 */
            bottom: var(--nri-panel-bottom, ${e.panelDefaultBottom}px);
            z-index: 2147483645;
            font-size: 12px;
            font-weight: 400;
            font-style: normal;
            line-height: 1.35;
            color: var(--nri-label);
            text-align: left;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
            user-select: none;
            /* 根节点宽度由角标决定，面板绝对定位，展开不挤动角标 */
            width: max-content;
        }
        ${Z}[data-nri-theme="light"] {
            /* 取自 VS Code 默认主题 Light 2026 */
            --nri-label: #202020;
            --nri-label-strong: #202020;
            --nri-label-secondary: #606060;
            --nri-label-tertiary: #999999;
            --nri-separator: #eeeef1;
            --nri-fill: rgba(32, 32, 32, 0.1);
            --nri-fill-pressed: rgba(32, 32, 32, 0.18);
            --nri-row-alt: rgba(32, 32, 32, 0.04);
            --nri-focus-border: #007acc;
            --nri-focus-ring: rgba(0, 122, 204, 0.45);
            --nri-selection: #007acc;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(32, 32, 32, 0.16);
            --nri-green: #73c991;
            --nri-blue: #006ab1;
            --nri-orange: #bf8803;
            --nri-red: #ad0707;
            --nri-json-key: #202020;
            --nri-json-string: #a31515;
            --nri-json-number: #098658;
            --nri-json-boolean: #0000ff;
            --nri-window: #ffffff;
            --nri-sidebar: #fafafd;
            --nri-window-edge: #e4e5e6;
            --nri-window-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
            --nri-menu: rgba(250, 250, 253, 0.82);
            --nri-menu-opaque: rgb(250, 250, 253);
            --nri-menu-edge: #e4e5e6;
            --nri-menu-shadow: rgba(0, 0, 0, 0.16);
            --nri-hud: rgba(250, 250, 253, 0.9);
            --nri-hud-hover: rgba(250, 250, 253, 0.98);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.14), 0 0 0 1px #e4e5e6;
            --nri-segment-selected: rgba(32, 32, 32, 0.22);
            --nri-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            --nri-scrollbar-thumb: rgba(32, 32, 32, 0.28);
            --nri-scrollbar-thumb-hover: rgba(32, 32, 32, 0.45);
        }

        /* macOS 风格：苹果系统色、毛玻璃半透明面板、0.5px 细线（深色） */
        ${Z}[data-nri-theme="dark"][data-nri-palette="macos"] {
            --nri-label: rgba(255, 255, 255, 0.85);
            --nri-label-strong: rgba(255, 255, 255, 0.95);
            --nri-label-secondary: rgba(255, 255, 255, 0.55);
            --nri-label-tertiary: rgba(255, 255, 255, 0.28);
            --nri-separator: rgba(255, 255, 255, 0.1);
            --nri-fill: rgba(255, 255, 255, 0.08);
            --nri-fill-pressed: rgba(255, 255, 255, 0.16);
            --nri-row-alt: rgba(255, 255, 255, 0.035);
            --nri-focus-border: #0a84ff;
            --nri-focus-ring: rgba(10, 132, 255, 0.5);
            --nri-selection: #0a84ff;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(255, 255, 255, 0.1);
            --nri-green: #30d158;
            --nri-blue: #64a8ff;
            --nri-orange: #ff9f0a;
            --nri-red: #ff453a;
            --nri-json-key: #9cdcfe;
            --nri-json-string: #ce9178;
            --nri-json-number: #b5cea8;
            --nri-json-boolean: #569cd6;
            --nri-window: rgba(36, 36, 40, 0.84);
            --nri-sidebar: rgba(0, 0, 0, 0.14);
            --nri-window-edge: rgba(255, 255, 255, 0.14);
            --nri-window-shadow: 0 22px 60px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(0, 0, 0, 0.7);
            --nri-menu: rgba(40, 40, 44, 0.82);
            --nri-menu-opaque: rgb(40, 40, 44);
            --nri-menu-edge: rgba(255, 255, 255, 0.14);
            --nri-menu-shadow: rgba(0, 0, 0, 0.45);
            --nri-hud: rgba(44, 44, 48, 0.78);
            --nri-hud-hover: rgba(52, 52, 56, 0.9);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 0.5px rgba(0, 0, 0, 0.6);
            --nri-segment-selected: rgba(255, 255, 255, 0.22);
            --nri-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            --nri-scrollbar-thumb: rgba(255, 255, 255, 0.22);
            --nri-scrollbar-thumb-hover: rgba(255, 255, 255, 0.4);
            --nri-hairline: 0.5px;
            --nri-panel-radius: 12px;
            --nri-panel-backdrop: blur(30px) saturate(1.8);
        }
        /* macOS 风格（浅色） */
        ${Z}[data-nri-theme="light"][data-nri-palette="macos"] {
            --nri-label: rgba(0, 0, 0, 0.85);
            --nri-label-strong: rgba(0, 0, 0, 0.92);
            --nri-label-secondary: rgba(0, 0, 0, 0.5);
            --nri-label-tertiary: rgba(0, 0, 0, 0.26);
            --nri-separator: rgba(0, 0, 0, 0.1);
            --nri-fill: rgba(0, 0, 0, 0.05);
            --nri-fill-pressed: rgba(0, 0, 0, 0.12);
            --nri-row-alt: rgba(0, 0, 0, 0.03);
            --nri-focus-border: #007aff;
            --nri-focus-ring: rgba(0, 122, 255, 0.45);
            --nri-selection: #007aff;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(0, 0, 0, 0.08);
            --nri-green: #1a8f34;
            --nri-blue: #0a66d8;
            --nri-orange: #c97800;
            --nri-red: #e5302a;
            --nri-json-key: #0451a5;
            --nri-json-string: #a31515;
            --nri-json-number: #098658;
            --nri-json-boolean: #0000ff;
            --nri-window: rgba(250, 250, 250, 0.88);
            --nri-sidebar: rgba(0, 0, 0, 0.03);
            --nri-window-edge: rgba(255, 255, 255, 0.6);
            --nri-window-shadow: 0 22px 60px rgba(0, 0, 0, 0.22), 0 0 0 0.5px rgba(0, 0, 0, 0.2);
            --nri-menu: rgba(246, 246, 246, 0.82);
            --nri-menu-opaque: rgb(246, 246, 246);
            --nri-menu-edge: rgba(255, 255, 255, 0.6);
            --nri-menu-shadow: rgba(0, 0, 0, 0.2);
            --nri-hud: rgba(246, 246, 246, 0.82);
            --nri-hud-hover: rgba(252, 252, 252, 0.94);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.16);
            --nri-segment-selected: #ffffff;
            --nri-segment-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.16);
            --nri-scrollbar-thumb: rgba(0, 0, 0, 0.22);
            --nri-scrollbar-thumb-hover: rgba(0, 0, 0, 0.4);
            --nri-hairline: 0.5px;
            --nri-panel-radius: 12px;
            --nri-panel-backdrop: blur(30px) saturate(1.8);
        }

        /* ---- 字体与排版隔离：宿主页面的字体/字号/行高规则一律不生效 ---- */
        ${Z},
        ${Z} * {
            font-family: var(--nri-font-ui) !important;
        }
        ${Z} * {
            box-sizing: border-box;
            font-size: inherit;
            font-weight: inherit;
            font-style: normal;
            font-variant: normal;
            line-height: inherit;
            letter-spacing: normal;
            word-spacing: normal;
            text-transform: none;
            text-decoration: none;
            text-shadow: none;
        }
        /* 代码类内容统一等宽 */
        ${Z} .nri-detail-error,
        ${Z} .nri-kv,
        ${Z} .nri-kv *,
        ${Z} .nri-json,
        ${Z} .nri-json *,
        ${Z} .nri-source {
            font-family: var(--nri-font-mono) !important;
        }
        ${Z} .nri-json .nri-json-more {
            font-family: var(--nri-font-ui) !important;
        }
        ${Z} button {
            margin: 0;
            color: inherit;
            /* macOS 控件不使用手型指针 */
            cursor: default;
        }
        ${Z} button:focus {
            outline: none !important;
        }
        ${Z} button:focus-visible {
            outline: none !important;
            box-shadow: 0 0 0 3px var(--nri-focus-ring);
        }
        ${Z} svg {
            display: block;
            flex: 0 0 auto;
            pointer-events: none;
        }
        ${Z} [hidden] {
            display: none !important;
        }

        /* ---- 状态色调与方法颜色 ---- */
        ${Z} .nri-tone-success {
            color: var(--nri-green);
        }
        ${Z} .nri-tone-info {
            color: var(--nri-blue);
        }
        ${Z} .nri-tone-warning {
            color: var(--nri-orange);
        }
        ${Z} .nri-tone-error {
            color: var(--nri-red);
        }
        ${Z} .nri-method {
            flex: 0 0 auto;
            font-weight: 600;
        }
        ${Z} .nri-method-GET {
            color: var(--nri-green);
        }
        ${Z} .nri-method-POST,
        ${Z} .nri-method-PUT,
        ${Z} .nri-method-PATCH {
            color: var(--nri-orange);
        }
        ${Z} .nri-method-DELETE {
            color: var(--nri-red);
        }

        /* ---- 角标：Dock 风格毛玻璃胶囊 ---- */
        ${Z} .nri-toggle {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            height: 30px;
            padding: 0 6px 0 12px;
            border: 0;
            border-radius: 15px;
            background: var(--nri-hud);
            -webkit-backdrop-filter: blur(24px) saturate(1.8);
            backdrop-filter: blur(24px) saturate(1.8);
            box-shadow: var(--nri-hud-shadow);
            color: var(--nri-label-strong);
            font-size: 12px;
            font-weight: 600;
            touch-action: none;
            transition:
                opacity 0.2s ease,
                background 0.2s ease,
                border-radius 0.2s ease,
                box-shadow 0.2s ease,
                transform 0.2s ease;
        }
        ${Z} .nri-toggle:hover {
            background: var(--nri-hud-hover);
        }
        ${Z} .nri-toggle:active {
            transform: scale(0.97);
        }
        /*
         * While the panel is open the toggle turns into a round chevron
         * pointing where the panel goes, like a chat launcher; the list
         * already shows the count.
         */
        ${Z} .nri-toggle-chevron {
            display: none;
        }
        ${Z} .nri-toggle[aria-expanded="true"] {
            justify-content: center;
            width: 30px;
            padding: 0;
        }
        ${Z} .nri-toggle[aria-expanded="true"] > :not(.nri-toggle-chevron) {
            display: none;
        }
        ${Z} .nri-toggle[aria-expanded="true"] .nri-toggle-chevron {
            display: inline-flex;
            animation: nri-chevron-in 0.15s ease-out;
        }
        ${Z} .nri-toggle-chevron svg {
            width: 16px;
            height: 16px;
        }
        @keyframes nri-chevron-in {
            from {
                opacity: 0;
                transform: translateY(-3px);
            }
        }
        ${Z} .nri-dock {
            position: relative;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 0;
            min-height: 0;
        }
        ${Z}.nri-idle {
            right: 0;
        }
        ${Z}.nri-idle .nri-dock {
            min-width: 28px;
            padding-left: 8px;
            padding-right: 0;
        }
        ${Z}.nri-idle .nri-toggle {
            opacity: var(--nri-toggle-idle-opacity);
            background: var(--nri-toggle-bg-idle);
            color: var(--nri-toggle-fg-idle);
            border-radius: 15px 0 0 15px;
            box-shadow: none;
            transform: translateX(calc(100% - 14px));
        }
        ${Z}.nri-idle:hover .nri-dock,
        ${Z}.nri-idle:focus-within .nri-dock {
            padding-right: 16px;
        }
        ${Z}.nri-idle:hover .nri-toggle,
        ${Z}.nri-idle:focus-within .nri-toggle {
            opacity: 1;
            border-radius: 15px;
            box-shadow: var(--nri-hud-shadow);
            transform: none;
            background: var(--nri-hud-hover);
            color: var(--nri-label-strong);
        }
        ${Z} .nri-badge {
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            border-radius: 9px;
            background: var(--nri-fill-pressed);
            color: var(--nri-label-strong);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }
        /* 与 Dock 角标一致：有失败请求时变红 */
        ${Z} .nri-badge.nri-badge-alert {
            background: color-mix(in srgb, var(--nri-red) 22%, transparent);
            color: var(--nri-red);
        }

        /* ---- 面板 ---- */
        @keyframes nri-panel-in {
            from {
                opacity: 0;
                transform: translateY(6px) scale(0.98);
            }
        }
        ${Z} .nri-panel {
            position: absolute;
            right: 0;
            bottom: calc(100% + 10px);
            width: var(--nri-panel-w, ${e.panelDefaultWidth}px);
            height: var(--nri-panel-h, ${e.panelDefaultHeight}px);
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 80px);
            border-radius: var(--nri-panel-radius);
            background: var(--nri-window);
            -webkit-backdrop-filter: var(--nri-panel-backdrop);
            backdrop-filter: var(--nri-panel-backdrop);
            box-shadow: var(--nri-window-shadow);
            display: none;
            flex-direction: column;
            overflow: hidden;
            color: var(--nri-label);
            transform-origin: bottom right;
        }
        /* 内缘细线画在内容之上，列表背景不会盖住 */
        ${Z} .nri-panel::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-window-edge);
            pointer-events: none;
            z-index: 3;
        }
        ${Z} .nri-panel.nri-open {
            display: flex;
            animation: nri-panel-in 0.18s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        ${Z} .nri-resize {
            position: absolute;
            z-index: 4;
            touch-action: none;
        }
        ${Z} .nri-resize-l {
            left: 0;
            top: 8px;
            bottom: 0;
            width: 5px;
            cursor: ew-resize;
        }
        ${Z} .nri-resize-t {
            top: 0;
            left: 8px;
            right: 0;
            height: 5px;
            cursor: ns-resize;
        }
        ${Z} .nri-resize-tl {
            top: 0;
            left: 0;
            width: 8px;
            height: 8px;
            cursor: nwse-resize;
        }

        /* ---- 工具栏 ---- */
        ${Z} .nri-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 34px;
            padding: 0 6px 0 12px;
            flex-shrink: 0;
        }
        ${Z} .nri-title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
            color: var(--nri-label-strong);
        }
        ${Z} .nri-actions {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
        }
        /* macOS 工具栏按钮：静止无底，悬停浅色圆角底，按下加深 */
        ${Z} .nri-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 22px;
            padding: 0;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: var(--nri-label-secondary);
            flex-shrink: 0;
        }
        ${Z} .nri-btn:hover,
        ${Z} .nri-btn[aria-pressed="true"] {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${Z} .nri-btn:active {
            background: var(--nri-fill-pressed);
        }
        ${Z} .nri-btn:disabled {
            opacity: 0.35;
            background: transparent;
        }
        ${Z} .nri-btn svg {
            width: 15px;
            height: 15px;
        }
        ${Z} .nri-toolbar-sep {
            width: 1px;
            height: 14px;
            margin: 0 3px;
            background: var(--nri-separator);
        }

        /* ---- 分段控件 ---- */
        ${Z} .nri-segmented {
            display: inline-flex;
            flex-shrink: 0;
            padding: 1px;
            border-radius: 6px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 0.5px var(--nri-separator);
        }
        ${Z} .nri-segment {
            min-width: 44px;
            height: 18px;
            padding: 0 8px;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
        }
        ${Z} .nri-segment:hover:not([aria-pressed="true"]) {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${Z} .nri-segment[aria-pressed="true"] {
            background: var(--nri-segment-selected);
            box-shadow: var(--nri-segment-shadow);
            color: var(--nri-label-strong);
        }
        /* 需要留意的状态：Raw 暴露凭据、Failed 隐藏了正常请求 */
        ${Z} .nri-segment[data-value="raw"][aria-pressed="true"] {
            color: var(--nri-orange);
            background: color-mix(in srgb, var(--nri-orange) 20%, transparent);
        }
        ${Z} .nri-segment[data-value="failed"][aria-pressed="true"] {
            color: var(--nri-red);
            background: color-mix(in srgb, var(--nri-red) 20%, transparent);
        }
        ${Z} .nri-actions .nri-segmented {
            margin-right: 4px;
        }

        /* ---- 筛选栏：搜索框 + 范围 ---- */
        ${Z} .nri-searchbar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${Z} .nri-search-field {
            display: flex;
            align-items: center;
            gap: 5px;
            flex: 1;
            min-width: 0;
            height: 22px;
            padding: 0 4px 0 6px;
            border-radius: 6px;
            background: var(--nri-fill);
            color: var(--nri-label-secondary);
            cursor: text;
        }
        ${Z} .nri-search-field:focus-within {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${Z} .nri-search-field > svg {
            width: 13px;
            height: 13px;
        }
        ${Z} .nri-search-input {
            flex: 1;
            min-width: 0;
            height: 100%;
            margin: 0;
            padding: 0;
            border: 0 !important;
            /* 页面常会给 input 设白底、边框和字号（甚至 !important），面板主题必须优先 */
            background: transparent !important;
            box-shadow: none !important;
            color: var(--nri-label) !important;
            font-size: 12px !important;
            line-height: normal !important;
            outline: none !important;
            -webkit-appearance: none;
            appearance: none;
        }
        ${Z} .nri-search-input::placeholder {
            color: var(--nri-label-tertiary) !important;
            opacity: 1;
        }
        ${Z} .nri-search-input::-webkit-search-decoration,
        ${Z} .nri-search-input::-webkit-search-cancel-button {
            -webkit-appearance: none;
            appearance: none;
        }
        ${Z} .nri-search-count {
            flex-shrink: 0;
            font-size: 11px;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${Z} .nri-search-clear {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: var(--nri-label-tertiary);
            color: var(--nri-window);
            flex-shrink: 0;
        }
        ${Z} .nri-search-clear:hover {
            background: var(--nri-label-secondary);
        }
        ${Z} .nri-search-clear svg {
            width: 8px;
            height: 8px;
        }

        /* ---- 类型过滤：DevTools 式胶囊，⌘ 单击多选 ---- */
        ${Z} .nri-typebar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${Z} .nri-type-chip {
            height: 18px;
            padding: 0 7px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
        }
        ${Z} .nri-type-chip:hover:not([aria-pressed="true"]) {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${Z} .nri-type-chip[aria-pressed="true"] {
            background: var(--nri-segment-selected);
            box-shadow: var(--nri-segment-shadow);
            color: var(--nri-label-strong);
        }
        /* 尚未捕获该类型：变暗，仍可选中 */
        ${Z} .nri-type-chip[data-empty="true"]:not([aria-pressed="true"]) {
            color: var(--nri-label-tertiary);
        }
        ${Z} .nri-typebar-sep {
            width: 1px;
            height: 12px;
            margin: 0 2px;
            background: var(--nri-separator);
        }

        /* ---- 请求列表：紧凑行、斑马纹、无行分隔线 ---- */
        ${Z} .nri-list {
            overflow: auto;
            flex: 1;
            min-height: 44px;
            padding: 4px 6px 6px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
            background: var(--nri-sidebar);
            outline: none;
        }
        /* 细滚动条：窄、圆角、半透明，悬停加深 */
        ${Z} .nri-list::-webkit-scrollbar,
        ${Z} .nri-detail-content::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ${Z} .nri-list::-webkit-scrollbar-track,
        ${Z} .nri-list::-webkit-scrollbar-corner,
        ${Z} .nri-detail-content::-webkit-scrollbar-track,
        ${Z} .nri-detail-content::-webkit-scrollbar-corner {
            background: transparent;
        }
        ${Z} .nri-list::-webkit-scrollbar-thumb,
        ${Z} .nri-detail-content::-webkit-scrollbar-thumb {
            border: 3px solid transparent;
            border-radius: 5px;
            background: var(--nri-scrollbar-thumb) padding-box;
        }
        ${Z} .nri-list::-webkit-scrollbar-thumb:hover,
        ${Z} .nri-detail-content::-webkit-scrollbar-thumb:hover {
            background-color: var(--nri-scrollbar-thumb-hover);
        }
        ${Z} .nri-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            height: 100%;
            padding: 12px;
            text-align: center;
            color: var(--nri-label-secondary);
        }
        ${Z} .nri-placeholder-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--nri-label);
        }
        ${Z} .nri-row {
            display: flex;
            align-items: center;
            gap: 6px;
            height: 22px;
            padding: 0 6px;
            border-radius: 5px;
            font-variant-numeric: tabular-nums;
        }
        ${Z} .nri-row.nri-alt {
            background: var(--nri-row-alt);
        }
        ${Z} .nri-row-status {
            flex: 0 0 auto;
            min-width: 28px;
            font-weight: 600;
        }
        ${Z} .nri-row .nri-method {
            min-width: 40px;
            font-size: 11px;
        }
        ${Z} .nri-row-path {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${Z} .nri-row-meta {
            flex: 0 0 auto;
            color: var(--nri-label-secondary);
            white-space: nowrap;
        }
        /* 选中行：列表有焦点（或右键菜单打开）时为强调色加白字，失焦后退为灰色 */
        ${Z} .nri-row.nri-selected {
            background: var(--nri-selection-inactive);
        }
        ${Z} .nri-list:focus-within .nri-row.nri-selected,
        ${Z}:has(> .nri-menu) .nri-row.nri-selected {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
        }
        ${Z} .nri-list:focus-within .nri-row.nri-selected > span,
        ${Z}:has(> .nri-menu) .nri-row.nri-selected > span {
            color: inherit !important;
        }

        /* ---- What's New：替换工具栏下方的内容，列出更新说明 ---- */
        ${Z} .nri-panel[data-view="whats-new"] > :is(.nri-searchbar, .nri-typebar, .nri-list, .nri-detail) {
            display: none;
        }
        ${Z} .nri-whats-new {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Z} .nri-whats-new[hidden] {
            display: none;
        }
        ${Z} .nri-whats-new-header {
            padding: 12px 14px 8px;
        }
        ${Z} .nri-whats-new-title {
            margin: 0;
            color: var(--nri-label-strong);
            font-size: 15px;
            font-weight: 700;
        }
        ${Z} .nri-whats-new-subtitle {
            margin: 2px 0 0;
            color: var(--nri-label-secondary);
            font-size: 12px;
        }
        ${Z} .nri-whats-new-notes {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 14px 8px;
            outline: none;
            user-select: text;
        }
        ${Z} .nri-whats-new-version + .nri-whats-new-version {
            margin-top: 10px;
            padding-top: 10px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Z} .nri-whats-new-version h4 {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin: 0 0 4px;
            color: var(--nri-label-strong);
            font-size: 13px;
            font-weight: 600;
        }
        ${Z} .nri-whats-new-date {
            color: var(--nri-label-tertiary);
            font-size: 11px;
            font-weight: 400;
            font-variant-numeric: tabular-nums;
        }
        ${Z} .nri-whats-new-section {
            margin: 6px 0 2px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
        }
        /* Host resets often strip list markers, on ul or li; restate them on li */
        ${Z} .nri-whats-new ul {
            margin: 0;
            padding: 0 0 0 16px;
            font-size: 12px;
            line-height: 1.5;
        }
        ${Z} .nri-whats-new li {
            display: list-item;
            margin: 0;
            padding: 0;
            list-style: disc outside;
        }
        ${Z} .nri-whats-new li li {
            list-style-type: circle;
        }
        ${Z} .nri-whats-new li + li {
            margin-top: 2px;
        }
        ${Z} .nri-whats-new code {
            padding: 0 3px;
            border-radius: 3px;
            background: var(--nri-fill);
            font-family: var(--nri-font-mono);
            font-size: 11px;
        }
        ${Z} .nri-whats-new strong {
            color: var(--nri-label-strong);
            font-weight: 600;
        }
        ${Z} .nri-whats-new-actions {
            display: flex;
            justify-content: flex-end;
            padding: 8px 14px 10px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }

        /* ---- 设置浮层：外观、显示/隐藏快捷键、更新；锚定在工具栏齿轮按钮下方 ---- */
        ${Z} .nri-settings {
            position: fixed;
            z-index: 4;
            width: 264px;
            padding: 4px 0;
            border-radius: 10px;
            background: var(--nri-menu);
            -webkit-backdrop-filter: blur(24px) saturate(1.6);
            backdrop-filter: blur(24px) saturate(1.6);
            box-shadow:
                inset 0 0 0 var(--nri-hairline) var(--nri-menu-edge),
                0 10px 30px var(--nri-menu-shadow);
            color: var(--nri-label);
            font-size: 12px;
            outline: none;
            user-select: none;
        }
        ${Z} .nri-settings[hidden] {
            display: none;
        }
        ${Z} .nri-settings-section + .nri-settings-section {
            margin-top: 4px;
            padding-top: 4px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Z} .nri-settings-heading {
            padding: 4px 12px 2px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
        }
        ${Z} .nri-settings-row {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 26px;
            padding: 0 12px;
        }
        ${Z} .nri-settings-row[hidden] {
            display: none;
        }
        ${Z} .nri-settings-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${Z} .nri-settings-value {
            color: var(--nri-label-secondary);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${Z} .nri-settings-hint {
            padding: 0 12px 4px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
        }
        ${Z} .nri-settings-hint:empty {
            display: none;
        }
        /* 推按钮：与分段控件同一层级的浅底圆角 */
        ${Z} .nri-push-btn {
            height: 20px;
            padding: 0 8px;
            border: 0;
            border-radius: 5px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            color: var(--nri-label);
            font: inherit;
            font-size: 11px;
            white-space: nowrap;
        }
        ${Z} .nri-push-btn:hover {
            background: var(--nri-fill-pressed);
        }
        /* Default button: accent-filled, as Return or Esc would press it */
        ${Z} .nri-push-btn.nri-primary {
            background: var(--nri-selection);
            box-shadow: none;
            color: var(--nri-selection-fg);
        }
        ${Z} .nri-push-btn.nri-primary:hover {
            background: color-mix(in srgb, var(--nri-selection) 85%, black);
        }
        ${Z} .nri-push-btn:disabled {
            color: var(--nri-label-tertiary);
            background: var(--nri-fill);
        }
        ${Z} .nri-update-status[hidden] {
            display: none;
        }
        ${Z} .nri-update-status,
        ${Z} .nri-link {
            margin-left: auto;
        }
        ${Z} .nri-update-status {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nri-label-secondary);
            text-align: right;
        }
        ${Z} .nri-link {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--nri-selection);
            white-space: nowrap;
        }
        ${Z} .nri-link:hover {
            text-decoration: underline;
        }
        ${Z} .nri-link[hidden] {
            display: none;
        }
        /* macOS 开关：灰色轨道，打开时强调色，圆形滑块左右滑动 */
        ${Z} .nri-switch {
            position: relative;
            width: 26px;
            height: 15px;
            padding: 0;
            border: 0;
            border-radius: 8px;
            background: var(--nri-fill-pressed);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            flex-shrink: 0;
            transition: background-color 0.15s ease;
        }
        ${Z} .nri-switch::after {
            content: "";
            position: absolute;
            top: 1px;
            left: 1px;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow:
                0 0 0 0.5px rgba(0, 0, 0, 0.12),
                0 1px 2px rgba(0, 0, 0, 0.25);
            transition: transform 0.15s ease;
        }
        ${Z} .nri-switch[aria-checked="true"] {
            background: var(--nri-selection);
            box-shadow: none;
        }
        ${Z} .nri-switch[aria-checked="true"]::after {
            transform: translateX(11px);
        }
        /* 齿轮上的更新提示圆点 */
        ${Z} .nri-btn[data-badge="true"]::after {
            content: "";
            position: absolute;
            top: 2px;
            right: 3px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--nri-selection);
        }
        ${Z} .nri-keycap {
            min-width: 20px;
            height: 17px;
            padding: 0 6px;
            border: 0;
            border-radius: 4px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            color: var(--nri-label);
            font: inherit;
            font-family: var(--nri-font-mono);
            white-space: nowrap;
        }
        ${Z} .nri-keycap:hover {
            background: var(--nri-fill-pressed);
        }
        ${Z} .nri-keycap[data-empty="true"] {
            color: var(--nri-label-tertiary);
            font-family: inherit;
        }
        ${Z} .nri-keycap[aria-pressed="true"] {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
            box-shadow: none;
            font-family: inherit;
        }
        ${Z} .nri-text-btn {
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--nri-selection);
            font: inherit;
            white-space: nowrap;
        }
        ${Z} .nri-text-btn:hover {
            text-decoration: underline;
        }
        ${Z} .nri-text-btn[hidden] {
            display: none;
        }

        /* ---- 详情区：分隔线 + 固定头部 + 滚动内容 ---- */
        ${Z} .nri-detail {
            display: flex;
            flex-direction: column;
            /*
             * The saved height is only the preferred size: when the panel is
             * short the detail pane shrinks (down to its header) so the list
             * keeps its minimum and the pane stays inside the panel.
             */
            flex: 0 1 var(--nri-detail-h, ${e.detailDefaultHeight}px);
            /* Without this the content's height becomes the flex minimum and blocks shrinking */
            min-height: 0;
            position: relative;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        /* 1px 分隔线配更宽的隐形热区，悬停时高亮 */
        ${Z} .nri-detail-resize {
            position: absolute;
            top: -4px;
            left: 0;
            right: 0;
            height: 8px;
            cursor: ns-resize;
            touch-action: none;
            z-index: 2;
        }
        ${Z} .nri-detail-resize:hover::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: 3.5px;
            height: 1px;
            background: var(--nri-focus-border);
        }
        ${Z} .nri-detail-header {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 7px 10px 6px 12px;
            flex-shrink: 0;
            border-bottom: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Z} .nri-detail-titlebar {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }
        /* Round dismiss button, distinct from the transparent toolbar buttons */
        ${Z} .nri-close-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: var(--nri-fill);
            color: var(--nri-label-secondary);
            flex-shrink: 0;
        }
        ${Z} .nri-close-btn:hover {
            background: color-mix(in srgb, var(--nri-label) 22%, transparent);
            color: var(--nri-label);
        }
        ${Z} .nri-close-btn:active {
            background: var(--nri-fill-pressed);
        }
        ${Z} .nri-close-btn svg {
            width: 11px;
            height: 11px;
            stroke-width: 2.5;
        }
        ${Z} .nri-detail-summary {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
        }
        ${Z} .nri-status-pill {
            flex: 0 0 auto;
            padding: 1px 7px;
            border-radius: 5px;
            background: color-mix(in srgb, currentColor 14%, transparent);
            font-size: 12px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }
        ${Z} .nri-summary-meta {
            flex: 0 0 auto;
            color: var(--nri-label-secondary);
            font-variant-numeric: tabular-nums;
        }
        ${Z} .nri-detail-url {
            display: flex;
            align-items: baseline;
            gap: 7px;
            min-width: 0;
        }
        ${Z} .nri-detail-url-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nri-label);
            user-select: text;
        }
        ${Z} .nri-detail-error {
            color: var(--nri-red);
            font-size: 11px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            user-select: text;
        }
        ${Z} .nri-detail-bar {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-top: 3px;
        }
        ${Z} .nri-detail-bar .nri-segment {
            min-width: 58px;
        }
        /* 查找栏：详情区内容中的文本查找 */
        ${Z} .nri-find-bar {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-top: 3px;
        }
        ${Z} .nri-find-bar .nri-search-field {
            margin-right: 4px;
        }
        ${Z} .nri-find-bar .nri-close-btn {
            margin-left: 4px;
        }
        /* 命中项用不透明底色与深色文字，四种配色组合下都清晰；当前项为橙色 */
        ${Z} ::highlight(nri-find) {
            background-color: #ffe066;
            color: #1d1d1f;
        }
        ${Z} ::highlight(nri-find-current) {
            background-color: #ff9f0a;
            color: #000000;
        }
        ${Z} .nri-spacer {
            flex: 1;
        }
        ${Z} .nri-detail-content {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 6px 12px 12px;
            outline: none;
            user-select: text;
            cursor: text;
        }
        ${Z} .nri-section-title {
            margin: 12px 0 4px;
            padding: 0;
            border: 0;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
            user-select: none;
        }
        ${Z} .nri-section-title:first-child {
            margin-top: 2px;
        }
        ${Z} .nri-empty-hint {
            padding: 3px 0;
            color: var(--nri-label-secondary);
        }
        ${Z} .nri-truncated {
            margin-top: 6px;
            color: var(--nri-label-secondary);
            font-size: 11px;
        }

        /* ---- 键值表：等宽、斑马纹、无分隔线 ---- */
        ${Z} .nri-kv {
            width: 100%;
            margin: 0;
            border: 0;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 11px;
            line-height: 1.5;
            background: transparent;
        }
        ${Z} .nri-kv tr {
            background: transparent;
        }
        ${Z} .nri-kv tr:nth-child(even) {
            background: var(--nri-row-alt);
        }
        ${Z} .nri-kv td {
            padding: 2px 8px;
            border: 0;
            vertical-align: top;
            color: var(--nri-label);
        }
        ${Z} .nri-kv td.nri-kv-key {
            width: 30%;
            color: var(--nri-json-key);
            white-space: nowrap;
        }
        ${Z} .nri-kv td.nri-kv-value {
            word-break: break-all;
        }

        /* ---- JSON 树与源码 ---- */
        ${Z} .nri-json,
        ${Z} .nri-source {
            margin: 0;
            font-size: 11px;
            line-height: 1.5;
            color: var(--nri-label);
        }
        ${Z} .nri-source {
            white-space: pre-wrap;
            word-break: break-all;
        }
        ${Z} .nri-json-line {
            position: relative;
            padding-left: 14px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        ${Z} .nri-json-toggle {
            border-radius: 4px;
            cursor: default;
        }
        ${Z} .nri-json-toggle:hover {
            background: var(--nri-row-alt);
        }
        ${Z} .nri-json-chevron {
            position: absolute;
            left: 1px;
            top: 4px;
            color: var(--nri-label-secondary);
        }
        ${Z} .nri-json-chevron svg {
            width: 9px;
            height: 9px;
            transition: transform 0.12s ease;
        }
        ${Z} .nri-json-open > .nri-json-toggle .nri-json-chevron svg {
            transform: rotate(90deg);
        }
        ${Z} .nri-json-children {
            padding-left: 14px;
        }
        ${Z} .nri-json-key {
            color: var(--nri-json-key);
        }
        ${Z} .nri-json-string {
            color: var(--nri-json-string);
        }
        ${Z} .nri-json-number {
            color: var(--nri-json-number);
        }
        ${Z} .nri-json-boolean {
            color: var(--nri-json-boolean);
        }
        ${Z} .nri-json-null,
        ${Z} .nri-json-punct {
            color: var(--nri-label-secondary);
        }
        ${Z} .nri-json-summary {
            margin: 0 4px;
            color: var(--nri-label-secondary);
            font-style: italic;
        }
        ${Z} .nri-json-more {
            margin: 2px 0 2px 14px;
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--nri-blue);
            font-size: 11px;
        }
        ${Z} .nri-json-more:hover {
            text-decoration: underline;
        }

        /* ---- 右键菜单 ---- */
        ${Z} .nri-menu {
            position: fixed;
            z-index: 5;
            min-width: 200px;
            max-width: 320px;
            width: max-content;
            padding: 5px;
            border-radius: 10px;
            background: var(--nri-menu);
            -webkit-backdrop-filter: blur(24px) saturate(1.6);
            backdrop-filter: blur(24px) saturate(1.6);
            box-shadow:
                inset 0 0 0 var(--nri-hairline) var(--nri-menu-edge),
                0 10px 30px var(--nri-menu-shadow);
            color: var(--nri-label);
            font-size: 13px;
            outline: none;
            user-select: none;
        }
        ${Z} .nri-menu-item {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            height: 22px;
            padding: 0 10px;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: var(--nri-label);
            text-align: left;
        }
        ${Z} .nri-menu-item.nri-menu-active {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
        }
        ${Z} .nri-menu-item:focus-visible {
            box-shadow: none;
        }
        ${Z} .nri-menu-item.nri-menu-danger {
            color: var(--nri-red);
        }
        ${Z} .nri-menu-item.nri-menu-danger.nri-menu-active {
            color: var(--nri-selection-fg);
        }
        ${Z} .nri-menu-item:disabled {
            color: var(--nri-label-tertiary);
        }
        ${Z} .nri-menu-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${Z} .nri-menu-shortcut {
            flex-shrink: 0;
            color: var(--nri-label-secondary);
        }
        ${Z} .nri-menu-active .nri-menu-shortcut {
            color: var(--nri-selection-fg-muted);
        }
        ${Z} .nri-menu-separator {
            height: 1px;
            margin: 5px 10px;
            background: var(--nri-separator);
        }

        /* ---- Tooltips: the panel's titles, shown after a rest ---- */
        ${Z} .nri-tooltip {
            position: fixed;
            z-index: 6;
            max-width: 400px;
            padding: 3px 7px;
            border-radius: 5px;
            background: var(--nri-menu-opaque);
            box-shadow:
                inset 0 0 0 1px var(--nri-menu-edge),
                0 4px 12px var(--nri-menu-shadow);
            color: var(--nri-label);
            font-size: 11px;
            line-height: 1.4;
            text-align: left;
            white-space: pre-line;
            overflow-wrap: anywhere;
            pointer-events: none;
        }
        ${Z} .nri-tooltip[hidden] {
            display: none;
        }

        @media (prefers-reduced-transparency: reduce) {
            ${Z}[data-nri-theme="dark"][data-nri-palette="macos"] {
                --nri-window: rgb(36, 36, 40);
                --nri-panel-backdrop: none;
            }
            ${Z}[data-nri-theme="light"][data-nri-palette="macos"] {
                --nri-window: rgb(250, 250, 250);
                --nri-panel-backdrop: none;
            }
            ${Z} .nri-menu,
            ${Z} .nri-settings {
                background: var(--nri-menu-opaque);
            }
            ${Z} .nri-menu,
            ${Z} .nri-settings,
            ${Z} .nri-toggle {
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            ${Z} .nri-panel.nri-open,
            ${Z} .nri-toggle[aria-expanded="true"] .nri-toggle-chevron {
                animation: none;
            }
            ${Z} .nri-json-chevron svg,
            ${Z} .nri-switch,
            ${Z} .nri-switch::after {
                transition: none;
            }
        }

        /* ---- Mock ---- */
        ${ur(Z)}
        ${Z} .nri-panel[data-view="whats-new"] > .nri-rules {
            display: none;
        }
        ${Z} .nri-title .nri-segment {
            min-width: 0;
        }
        ${Z} .nri-view-count {
            margin-left: 4px;
            padding: 0 5px;
            border-radius: 7px;
            background: var(--nri-fill-pressed);
            font-size: 10px;
            font-variant-numeric: tabular-nums;
        }
        ${Z} .nri-view-count.nri-live {
            background: var(--nri-red);
            color: #fff;
        }
        ${Z} .nri-row-separator {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 20px;
            padding: 0 6px;
            color: var(--nri-label-tertiary);
            font-size: 10px;
        }
        ${Z} .nri-row-separator::before,
        ${Z} .nri-row-separator::after {
            content: "";
            flex: 1;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Z} .nri-row-mock {
            flex: 0 0 auto;
            padding: 0 5px;
            border-radius: 4px;
            background: color-mix(in srgb, var(--nri-orange) 22%, transparent);
            color: var(--nri-orange);
            font-size: 10px;
            font-weight: 700;
            line-height: 15px;
        }
        ${Z} .nri-row.nri-selected .nri-row-mock {
            background: rgba(255, 255, 255, 0.22);
        }
        ${Z} .nri-detail-mock {
            color: var(--nri-orange);
            font-size: 11px;
            overflow-wrap: anywhere;
            user-select: text;
        }
        ${Z} .nri-detail-mock .nri-text-btn {
            margin-left: 6px;
        }
        ${Z} .nri-btn.nri-mock-has {
            color: var(--nri-orange);
        }
        ${Z} .nri-toggle-mock {
            height: 18px;
            padding: 0 7px;
            border-radius: 9px;
            background: var(--nri-red);
            color: #fff;
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
        }
        ${Z} .nri-toggle-mock.nri-paused {
            background: var(--nri-orange);
        }
        /* 贴边时只露出一小截：有规则生效就把这一截染红并不透明，免得忘了关 */
        ${Z}.nri-idle .nri-toggle.nri-mock-live {
            opacity: 1;
            background: var(--nri-red);
            color: #fff;
        }
        `,document.head.appendChild(t)}let Q=(e,t=1.5)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`,oi={clear:Q(`<path d="M4 6.5h16"/><path d="M9 6.5V4.5h6v2"/><path d="M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>`),copy:Q(`<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>`),braces:Q(`<path d="M8.5 3.5h-1A2.5 2.5 0 0 0 5 6v3.5A2.5 2.5 0 0 1 2.5 12 2.5 2.5 0 0 1 5 14.5V18a2.5 2.5 0 0 0 2.5 2.5h1"/><path d="M15.5 3.5h1A2.5 2.5 0 0 1 19 6v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5h-1"/>`),terminal:Q(`<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5"/><path d="M12.5 15h4.5"/>`),tree:Q(`<path d="M4 5h7"/><path d="M8 12h12"/><path d="M8 19h12"/><path d="M6 5v14"/><path d="M6 12h2"/><path d="M6 19h2"/>`),code:Q(`<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13.5 4-3 16"/>`),gear:Q(`<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`),chevronDown:Q(`<path d="m6 9.5 6 6 6-6"/>`,2.2),chevronUp:Q(`<path d="m6 14.5 6-6 6 6"/>`,2.2),search:Q(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>`,2),xmark:Q(`<path d="m6 6 12 12"/><path d="M18 6 6 18"/>`,3.5),mock:Q(`<path d="m4 20 11-11"/><path d="m13.5 7.5 3 3"/><path d="M18 3v3"/><path d="M16.5 4.5h3"/><path d="M20.5 9v2"/><path d="M19.5 10h2"/><path d="M9 3v2"/><path d="M8 4h2"/>`)};function si(e){e.addEventListener(`mousedown`,e=>{e.preventDefault()})}function $(e,t,n=`nri-btn`){let r=document.createElement(`button`);return r.type=`button`,r.className=n,r.title=t,r.setAttribute(`aria-label`,t),r.innerHTML=oi[e],si(r),r}function ci(e,t,n){let r=document.createElement(`div`);r.className=`nri-segmented`,r.setAttribute(`role`,`group`),r.setAttribute(`aria-label`,e);let i=t.map(e=>{let t=document.createElement(`button`);return t.type=`button`,t.className=`nri-segment`,t.dataset.value=e.value,t.textContent=e.label,t.title=e.title,si(t),t.addEventListener(`click`,()=>{t.getAttribute(`aria-pressed`)!==`true`&&n(e.value)}),r.appendChild(t),t});return{el:r,setValue:e=>{for(let t of i)t.setAttribute(`aria-pressed`,t.dataset.value===e?`true`:`false`)}}}function li(e){let t=/* @__PURE__ */ new Set,n=document.createElement(`div`);n.className=`nri-typebar`,n.setAttribute(`role`,`group`),n.setAttribute(`aria-label`,`Response type`);let r=(e,t)=>{let r=document.createElement(`button`);return r.type=`button`,r.className=`nri-type-chip`,r.textContent=e,r.title=t,si(r),n.appendChild(r),r},i=r(`All`,`Show all response types`);i.addEventListener(`click`,()=>{e(/* @__PURE__ */ new Set)});let a=document.createElement(`span`);a.className=`nri-typebar-sep`,n.appendChild(a);let o=`${rn()?`⌘`:`Ctrl`}-click to select multiple`,s=On.map(n=>{let i=r(n.label,n.title);return i.addEventListener(`click`,r=>{if(!(r.metaKey||r.ctrlKey)){e(/* @__PURE__ */ new Set([n.value]));return}let i=new Set(t);i.delete(n.value)||i.add(n.value),e(i)}),{type:n,chip:i}});return{el:n,setValue:e=>{t=e,i.setAttribute(`aria-pressed`,e.size===0?`true`:`false`);for(let{type:t,chip:n}of s)n.setAttribute(`aria-pressed`,e.has(t.value)?`true`:`false`)},setCounts:e=>{for(let{type:t,chip:n}of s){let r=e.get(t.value)??0;n.dataset.empty=r===0?`true`:`false`,n.title=`${t.title} (${r}) · ${o}`}}}}function ui(e){return e.error===void 0?e.status===void 0?`warning`:e.status===0?`error`:e.status<300?`success`:e.status<400?`info`:`error`:`error`}function di(e){return e.error===void 0?e.status===void 0?`…`:String(e.status):`ERR`}function fi(e){if(e.error!==void 0)return`Error`;if(e.status===void 0)return`Pending`;if(e.status===0)return`0 No Response`;let t=ce(e.status);return t===``?String(e.status):`${e.status} ${t}`}function pi(e){return e.error!==void 0||e.status!==void 0&&(e.status===0||e.status>=400)}function mi(e){return`nri-method nri-method-${e.toUpperCase()}`}function hi(e,t){let n=new Date(e),r=(e,t=2)=>String(e).padStart(t,`0`),i=`${r(n.getHours())}:${r(n.getMinutes())}:${r(n.getSeconds())}`;return t?`${i}.${r(n.getMilliseconds(),3)}`:i}function gi(e){try{let t=new URL(e,location.href);return`${t.pathname}${t.search}`}catch{return e}}function _i(e){try{return new URL(e,location.href).href}catch{return e}}function vi(e){return e!=null&&e!==``}async function yi(e,t){try{await nt(e),M(`success`,t,2e3)}catch(e){console.error(`[NRI] copy failed:`,e),M(`error`,`Copy failed`,2500)}}function bi(e,t,n,r){let i=t.trim().toLowerCase();return i===``&&n===`all`&&r.size===0?e:e.filter(e=>(n===`all`||(n===`failed`?pi(e):e.mock!==void 0))&&(r.size===0||r.has(Nn(e)))&&(i===``||e.url.toLowerCase().includes(i)))}function xi(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Nn(n);t.set(e,(t.get(e)??0)+1)}return t}function Si(e,t){let n=document.createElement(`div`);n.className=`nri-placeholder`;let r=document.createElement(`div`);r.className=`nri-placeholder-title`,r.textContent=e;let i=document.createElement(`div`);return i.textContent=t,n.append(r,i),n}function Ci(e){let t=document.createElement(`div`);return t.className=`nri-empty-hint`,t.textContent=e,t}function wi(e){let t=document.createElement(`h4`);return t.className=`nri-section-title`,t.textContent=e,t}function Ti(e,t){if(e.length===0)return Ci(`None`);let n=t?[...e].sort((e,t)=>e[0].localeCompare(t[0])):e,r=document.createElement(`table`);r.className=`nri-kv`;let i=document.createElement(`tbody`);for(let[e,t]of n){let n=document.createElement(`tr`),r=document.createElement(`td`);r.className=`nri-kv-key`,r.textContent=e;let a=document.createElement(`td`);a.className=`nri-kv-value`,a.textContent=t,n.append(r,a),i.appendChild(n)}return r.appendChild(i),r}function Ei(e,t,n){let r=document.createDocumentFragment();if(!vi(e))return r.appendChild(Ci(`None`)),r;if(n===`tree`){let t=typeof e==`string`?it(e):e;if(typeof t==`object`&&t)return r.appendChild(H(t)),r}let i=g(e,t),a=document.createElement(`pre`);if(a.className=`nri-source`,a.textContent=i.text,r.appendChild(a),i.truncated){let e=document.createElement(`div`);e.className=`nri-truncated`,e.textContent=`Truncated: ${i.totalChars} characters total`,r.appendChild(e)}return r}function Di(e,t,n){let r=document.createDocumentFragment();switch(t){case`body`:e.error===void 0?e.status===void 0?r.appendChild(Ci(`Waiting for response…`)):r.appendChild(Ei(e.responseBody,e.responseHeaders,n)):r.appendChild(Ci(`No response: the request failed.`));break;case`headers`:r.appendChild(Ti(Object.entries(e.responseHeaders??{}),!0));break;case`request`:r.append(wi(`Query`),Ti(le(e.url),!1),wi(`Headers`),Ti(Object.entries(e.requestHeaders??{}),!0),wi(`Body`),Ei(e.requestBody,e.requestHeaders,n))}return r}function Oi(e){return`nri-row-${e}`}function ki(e){let{listEl:t,records:n,emptyTitle:r,emptyHint:i,selectedIds:a,onRowPress:o,onRowContextMenu:s,copyMode:c}=e;if(t.replaceChildren(),n.length===0){t.appendChild(Si(r,i));return}let l=!1;n.forEach((e,n)=>{if(e.restored===!0&&!l){l=!0;let e=document.createElement(`div`);e.className=`nri-row-separator`,e.textContent=`Before reload`,e.title=`Requests captured before the page was reloaded`,t.appendChild(e)}let r=v(e,c),i=a.has(e.id),u=document.createElement(`div`);u.className=`nri-row`,u.dataset.recordId=e.id,u.id=Oi(e.id),u.title=r.url,u.setAttribute(`role`,`option`),u.setAttribute(`aria-selected`,i?`true`:`false`),u.classList.toggle(`nri-alt`,n%2==1),u.classList.toggle(`nri-selected`,i);let d=document.createElement(`span`);d.className=`nri-row-status nri-tone-${ui(r)}`,d.textContent=di(r);let f=document.createElement(`span`);f.className=mi(r.method),f.textContent=r.method.toUpperCase();let p=document.createElement(`span`);p.className=`nri-row-path`,p.textContent=gi(r.url);let m=document.createElement(`span`);m.className=`nri-row-meta`,m.textContent=e.durationMs===void 0?``:`${e.durationMs} ms`;let h=document.createElement(`span`);if(h.className=`nri-row-meta`,h.textContent=hi(e.startedAt,!1),u.append(d,f,p),e.mock!==void 0){let t=document.createElement(`span`);t.className=`nri-row-mock`,t.textContent=`MOCK`,t.title=`Response from a mock rule (${lr(e.mock.mode)})`,u.append(t)}u.append(m,h),u.addEventListener(`mousedown`,t=>{t.button===0&&o(e.id,t)}),u.addEventListener(`contextmenu`,t=>{t.preventDefault(),t.stopPropagation(),s(e,t)}),t.appendChild(u)})}function Ai(e,t){let n=e.getBoundingClientRect(),r=t.getBoundingClientRect();r.top<n.top?e.scrollTop-=n.top-r.top+4:r.bottom>n.bottom&&(e.scrollTop+=r.bottom-n.bottom+4)}function ji(e){let t=document.documentElement??document.body;t===null?document.addEventListener(`DOMContentLoaded`,()=>{document.documentElement.appendChild(e)},{once:!0}):t.appendChild(e)}function Mi(){if(document.getElementById(ei)!==null)return;ai();let t=fn(),n=``,r=`all`,i=/* @__PURE__ */ new Set,a=[],o=[],s=on,c=`body`,l=`requests`,u=`tree`,d=yn(),f=e.panelDefaultBottom,p=Nt(),m=Lt(),h=document.createElement(`div`);h.id=ei;let _=e=>{f=e,h.style.setProperty(`--nri-panel-bottom`,`${e}px`)},y=document.createElement(`div`);y.className=`nri-panel`,y.setAttribute(`role`,`dialog`),y.setAttribute(`aria-label`,`Network Requests`);let ee=e=>{d=e,y.style.setProperty(`--nri-panel-w`,`${e.width}px`),y.style.setProperty(`--nri-panel-h`,`${e.height}px`)};ee(d);let b=()=>o.find(e=>e.id===s.focusId),x=()=>o.filter(e=>s.ids.has(e.id)),te=e=>{yi(ne(e,m),`Request and response copied`)},ie=e=>{let t=v(e,m);return ae({...t,url:_i(t.url)},`raw`)},se=e=>_i(v(e,m).url),ce=e=>{yi(ie(e),`cURL command copied`)},le=e=>{yi(se(e),`URL copied`)},ue=e=>{let t=v(e,m);yi(g(t.responseBody,t.responseHeaders).text,`Response body copied`)},S=()=>{o.length===0?M(`info`,`No requests to copy`,1500):yi(re(o,m),`Copied ${o.length} requests and responses`)},de=e=>{yi(re(e,m),`Copied ${e.length} requests and responses`)},fe=e=>{yi(e.map(ie).join(`

`),`Copied ${e.length} cURL commands`)},pe=e=>{yi(e.map(se).join(`
`),`Copied ${e.length} URLs`)},me=()=>{qe(),M(`info`,`Cleared`,1500)},he=document.createElement(`div`);he.className=`nri-toolbar`;let ge=document.createElement(`div`);ge.className=`nri-title`;let C=ci(`Panel view`,[{value:`requests`,label:`Requests`,title:`Captured requests`},{value:`rules`,label:`Rules`,title:`Mock rules for this site`}],e=>{er(e,!0)});C.setValue(l);let _e=document.createElement(`span`);_e.className=`nri-view-count`,C.el.querySelector(`[data-value="rules"]`)?.append(_e),ge.append(C.el);let ve=document.createElement(`div`);ve.className=`nri-actions`;let ye=ci(`Copy and details mode`,[{value:`redacted`,label:`Redacted`,title:`Hide credentials in details and copies`},{value:`raw`,label:`Raw`,title:`Show captured values unredacted`}],e=>{m=e,ye.setValue(e),Rt(e),Xt()});ye.setValue(m);let be=$(`copy`,`Copy all visible requests`);be.addEventListener(`click`,S);let xe=$(`clear`,`Clear requests (${an(`k`)})`);xe.addEventListener(`click`,me);let Se=document.createElement(`span`);Se.className=`nri-toolbar-sep`;let w=$(`gear`,`Settings`);w.setAttribute(`aria-haspopup`,`dialog`),w.setAttribute(`aria-expanded`,`false`);let we=En(),Te=ci(`Style`,[{value:`vscode`,label:`VS Code`,title:`VS Code colors`},{value:`macos`,label:`macOS`,title:`macOS system colors with translucency`}],e=>{Ee(e),Dn(e)}),Ee=e=>{we=e,h.dataset.nriPalette=e,Qe(wn(De),e),Te.setValue(e)},De=Sn(),Oe=ci(`Theme`,[{value:`system`,label:`System`,title:`Follow the browser's appearance`},{value:`light`,label:`Light`,title:`Always light`},{value:`dark`,label:`Dark`,title:`Always dark`}],e=>{ke(e),Cn(e)}),ke=e=>{De=e;let t=wn(e);h.dataset.nriTheme=t,Qe(t,we),Oe.setValue(e)};ke(De),Ee(we);let Ae=window.matchMedia(`(prefers-color-scheme: dark)`),je=()=>{De===`system`&&ke(`system`)};typeof Ae.addEventListener==`function`?Ae.addEventListener(`change`,je):Ae.addListener(je),ve.append(ye.el,be,xe,Se,w),he.append(ge,ve);let T=document.createElement(`div`);T.className=`nri-searchbar`;let Me=document.createElement(`label`);Me.className=`nri-search-field`,Me.innerHTML=oi.search;let E=document.createElement(`input`);E.type=`search`,E.className=`nri-search-input`,E.placeholder=`Filter URL (${an(`f`)})`,E.spellcheck=!1,E.autocomplete=`off`,E.setAttribute(`aria-label`,`Filter by URL`);let Le=document.createElement(`span`);Le.className=`nri-search-count`,Le.hidden=!0;let Re=$(`xmark`,`Clear filter`,`nri-search-clear`);Re.tabIndex=-1,Re.hidden=!0,Me.append(E,Le,Re);let ze=ci(`Request scope`,[{value:`all`,label:`All`,title:`Show all requests`},{value:`failed`,label:`Failed`,title:`Show only failed requests (status 0, 4xx, 5xx, network errors)`},{value:`mocked`,label:`Mocked`,title:`Show only requests whose response came from a mock rule`}],e=>{r=e,ze.setValue(e),Xt()});ze.setValue(r),T.append(Me,ze.el);let Be=li(e=>{i=e,Be.setValue(e),Xt()});Be.setValue(i);let D=document.createElement(`div`);D.className=`nri-list`,D.tabIndex=0,D.setAttribute(`role`,`listbox`),D.setAttribute(`aria-multiselectable`,`true`),D.setAttribute(`aria-label`,`Requests`);let O=document.createElement(`div`);O.className=`nri-detail`;let He=e=>{p=e,O.style.setProperty(`--nri-detail-h`,`${e}px`)};He(p);let k=Ft(()=>Math.round(O.getBoundingClientRect().height)||p,He),Ue=document.createElement(`div`);Ue.className=`nri-detail-header`;let We=document.createElement(`div`);We.className=`nri-detail-summary`;let Ge=document.createElement(`span`),A=document.createElement(`span`);A.className=`nri-summary-meta`;let Ke=document.createElement(`span`);Ke.className=`nri-summary-meta`,Ke.title=`Response body size`;let Ye=document.createElement(`span`);Ye.className=`nri-summary-meta`,Ye.title=`Started at`;let j=document.createElement(`span`);j.className=`nri-summary-meta`,We.append(Ge,A,Ke,Ye,j);let Xe=$(`xmark`,`Close details (Esc)`,`nri-close-btn`);Xe.addEventListener(`click`,()=>{B(on,!1),D.focus({preventScroll:!0})});let Ze=document.createElement(`div`);Ze.className=`nri-detail-titlebar`,Ze.append(We,Xe);let $e=document.createElement(`div`);$e.className=`nri-detail-url`;let et=document.createElement(`span`),tt=document.createElement(`span`);tt.className=`nri-detail-url-text`,$e.append(et,tt);let nt=document.createElement(`div`);nt.className=`nri-detail-error`;let rt=document.createElement(`div`);rt.className=`nri-detail-mock`,rt.hidden=!0;let it=document.createElement(`div`);it.className=`nri-detail-bar`;let at=ci(`Detail view`,[{value:`body`,label:`Body`,title:`Response body`},{value:`headers`,label:`Headers`,title:`Response headers`},{value:`request`,label:`Request`,title:`Request query, headers, and body`}],e=>{Bt(e)});at.setValue(c);let ot=document.createElement(`span`);ot.className=`nri-spacer`;let N=$(`code`,`Show source`),st=e=>{u=e;let t=e===`tree`?`Show source`:`Show as tree`;N.innerHTML=oi[e===`tree`?`code`:`tree`],N.title=t,N.setAttribute(`aria-label`,t),N.setAttribute(`aria-pressed`,e===`source`?`true`:`false`)};st(u),N.addEventListener(`click`,()=>{st(u===`tree`?`source`:`tree`),It()});let ct=e=>()=>{let t=b();t!==void 0&&e(t)},lt=$(`copy`,`Copy request and response as Markdown (${an(`c`)})`);lt.addEventListener(`click`,ct(te));let ut=$(`braces`,`Copy response body`);ut.addEventListener(`click`,ct(ue));let dt=$(`terminal`,`Copy as cURL`);dt.addEventListener(`click`,ct(ce));let ft=$(`mock`,`Mock this request`);ft.addEventListener(`click`,ct(e=>tr(e)));let pt=$(`search`,`Find (${an(`f`)})`),mt=document.createElement(`div`);mt.className=`nri-find-bar`,mt.hidden=!0;let ht=document.createElement(`label`);ht.className=`nri-search-field`,ht.innerHTML=oi.search;let P=document.createElement(`input`);P.type=`search`,P.className=`nri-search-input`,P.placeholder=`Find`,P.spellcheck=!1,P.autocomplete=`off`,P.setAttribute(`aria-label`,`Find in details`);let gt=document.createElement(`span`);gt.className=`nri-search-count`,gt.setAttribute(`aria-live`,`polite`),ht.append(P,gt);let _t=$(`chevronUp`,`Previous match (⇧Return)`),vt=$(`chevronDown`,`Next match (Return)`),yt=$(`xmark`,`Close find (Esc)`,`nri-close-btn`);mt.append(ht,_t,vt,yt),it.append(at.el,ot,pt,N,ft,lt,ut,dt),Ue.append(Ze,$e,nt,rt,it,mt);let F=document.createElement(`div`);F.className=`nri-detail-content`,F.tabIndex=0,F.setAttribute(`role`,`region`),F.setAttribute(`aria-label`,`Request details`),O.append(k.top,Ue,F);let I=[],L=0,bt,xt=()=>!mt.hidden,Tt=()=>xt()&&!O.hidden?zt(P.value):void 0,Et=typeof CSS<`u`?CSS.highlights:void 0,Dt=()=>{if(Et===void 0)return;let e=Tt();if(e===void 0){Et.delete(`nri-find`),Et.delete(`nri-find-current`);return}Et.set(`nri-find`,new Highlight(...Ht(F,e,ri,ii)));let t=new Highlight(...bt===void 0?[]:[bt]);t.priority=1,Et.set(`nri-find-current`,t)};new MutationObserver(Dt).observe(F,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`hidden`]});let Ot=()=>{let e=I.length,t=e>=ii?`+`:``;gt.textContent=P.value===``?``:e===0?`No matches`:`${L+1} of ${e}${t}`,_t.disabled=e===0,vt.disabled=e===0,pt.setAttribute(`aria-pressed`,xt()?`true`:`false`)},kt=(e,t)=>{let n=I.length;L=n===0?0:(e+n)%n,bt=I.at(L)?.(),Dt(),t&&bt!==void 0&&Wt(F,bt),Ot()},At=e=>{let t=[];for(let n of F.children){let r=ii-t.length;if(r<=0)break;let i=$t(n,e,r);if(i===void 0)for(let i of Ht(n,e,ri,r))t.push(()=>i);else for(let r of i)t.push(()=>{let t=n instanceof HTMLElement?en(n,r):void 0;return t===void 0?void 0:Ht(t,e,ri).at(r.occurrence)})}return t},R=e=>{let t=Tt();I=t===void 0?[]:At(t),kt(e?Math.min(L,I.length-1):0,!e)},z=()=>{mt.hidden=!1,P.focus({preventScroll:!0}),P.select(),R(!1)},jt=()=>{mt.hidden=!0,R(!1),F.focus({preventScroll:!0})};pt.addEventListener(`click`,()=>{xt()?jt():z()}),P.addEventListener(`input`,()=>{R(!1)}),_t.addEventListener(`click`,()=>{kt(L-1,!0)}),vt.addEventListener(`click`,()=>{kt(L+1,!0)}),yt.addEventListener(`click`,jt),Ot();let Pt,It=()=>{let e=b();if(O.hidden=e===void 0,e===void 0){Pt=void 0,F.replaceChildren(),R(!1);return}if(Pt?.record===e&&Pt.copyMode===m&&Pt.tab===c&&Pt.view===u)return;let t=Pt?.record.id===e.id&&Pt.tab===c,n=F.scrollTop,r=v(e,m);Ge.className=`nri-status-pill nri-tone-${ui(r)}`,Ge.textContent=fi(r),A.textContent=r.durationMs===void 0?`— ms`:`${r.durationMs} ms`,Ke.textContent=oe(r.responseBody),Ye.textContent=hi(r.startedAt,!0),j.textContent=r.source===`xhr`?`XHR`:`Fetch`,et.className=mi(r.method),et.textContent=r.method.toUpperCase(),tt.textContent=_i(r.url),tt.title=tt.textContent,nt.hidden=r.error===void 0,nt.textContent=r.error??``,nr(r),rr(),N.hidden=c===`headers`,ut.disabled=!vi(r.responseBody),F.replaceChildren(Di(r,c,u)),F.scrollTop=t?n:0,Pt={record:e,copyMode:m,tab:c,view:u},R(t)},Bt=e=>{c=e,at.setValue(e),It()},Vt=e=>{let t=ni.indexOf(c)+e,n=ni[Math.max(0,Math.min(ni.length-1,t))];n!==void 0&&Bt(n)},Ut=e=>{for(let e of D.querySelectorAll(`.nri-row`)){let t=e.dataset.recordId!==void 0&&s.ids.has(e.dataset.recordId);e.classList.toggle(`nri-selected`,t),e.setAttribute(`aria-selected`,t?`true`:`false`)}let t=O.hidden;It();let{focusId:n}=s;if(n===void 0)D.removeAttribute(`aria-activedescendant`);else{D.setAttribute(`aria-activedescendant`,Oi(n));let r=e||t&&!O.hidden?document.getElementById(Oi(n)):null;r!==null&&Ai(D,r)}},B=(e,t)=>{s=e,Ut(t)},Gt=()=>o.map(e=>e.id),V=()=>{let e=n.trim()!==``||r!==`all`||i.size>0;Re.hidden=n===``,Le.hidden=!e,Le.textContent=e?`${o.length} of ${a.length}`:``},Kt=()=>{if(a.length===0)return[`No Requests`,`Static assets are filtered`];if(n.trim()!==``)return[`No Results`,`No URL matches “${n.trim()}”`];if(i.size>0){let e=On.filter(e=>i.has(e.value)).map(e=>e.label).join(`, `);return[`No Results`,`No ${r===`failed`?`failed `:r===`mocked`?`mocked `:``}${e} requests`]}return r===`mocked`?[`No Mocked Requests`,`Requests answered by a mock rule show up here`]:[`No Failed Requests`,`Everything succeeded so far`]},qt=()=>[{label:`Copy All Visible Requests`,onSelect:S,disabled:o.length===0},{label:`Clear Requests`,shortcut:an(`k`),onSelect:me,disabled:a.length===0}],Jt=e=>[{label:`Copy ${e.length} Requests and Responses`,shortcut:an(`c`),onSelect:()=>de(e)},{label:`Copy ${e.length} as cURL`,onSelect:()=>fe(e)},{label:`Copy ${e.length} URLs`,onSelect:()=>pe(e)},`separator`,...qt()],Yt=e=>[{label:Ve(e.method,e.url)===void 0?`Mock This Request`:`Edit Mock Rule`,onSelect:()=>tr(e)},`separator`,{label:`Copy Request and Response`,shortcut:an(`c`),onSelect:()=>te(e)},{label:`Copy as cURL`,onSelect:()=>ce(e)},{label:`Copy URL`,onSelect:()=>le(e)},{label:`Copy Response Body`,disabled:!vi(e.responseBody),onSelect:()=>ue(e)},`separator`,...qt()],Xt=()=>{o=bi(a,n,r,i),Be.setCounts(xi(a)),s=dn(Gt(),s),V();let[e,t]=Kt();zn(D,()=>{ki({listEl:D,records:o,emptyTitle:e,emptyHint:t,selectedIds:s.ids,onRowPress:(e,t)=>{let n=rn();n&&t.ctrlKey||((n?t.metaKey:t.ctrlKey)?B(cn(s,e),!1):t.shiftKey?(t.preventDefault(),D.focus({preventScroll:!0}),B(ln(Gt(),s,e),!1)):B(sn(e),!1))},onRowContextMenu:(e,t)=>{s.ids.has(e.id)||B(sn(e.id),!1),D.focus({preventScroll:!0});let n=x();wt(h,n.length>1?Jt(n):Yt(e),t.clientX,t.clientY)},copyMode:m})}),Ut(!1)};D.addEventListener(`mousedown`,e=>{e.button===0&&e.target instanceof Element&&e.target.closest(`.nri-row`)===null&&B(on,!1)}),D.addEventListener(`contextmenu`,e=>{e.preventDefault(),D.focus({preventScroll:!0}),wt(h,qt(),e.clientX,e.clientY)});let Zt=e=>{E.value=e,n=e,Xt()};E.addEventListener(`input`,()=>{n=E.value,Xt()}),Re.addEventListener(`click`,e=>{e.preventDefault(),Zt(``),E.focus()});let H=document.createElement(`div`);H.className=`nri-settings`,H.setAttribute(`role`,`dialog`),H.setAttribute(`aria-label`,`Settings`),H.tabIndex=-1,H.hidden=!0;let Qt=(e,...t)=>{let n=document.createElement(`div`);n.className=`nri-settings-section`;let r=document.createElement(`div`);return r.className=`nri-settings-heading`,r.textContent=e,n.append(r,...t),n},mn=(e,...t)=>{let n=document.createElement(`div`);n.className=`nri-settings-row`;let r=document.createElement(`span`);return r.className=`nri-settings-label`,r.textContent=e,n.append(r,...t),n},U=Sr(),W=!1,G=document.createElement(`button`);G.type=`button`,G.className=`nri-keycap`;let xn=document.createElement(`button`);xn.type=`button`,xn.className=`nri-text-btn`,xn.textContent=`Reset`,si(xn);let Tn=document.createElement(`div`);Tn.className=`nri-settings-hint`;let kn=()=>U===null?`None`:kr(U,rn()),An=()=>{G.setAttribute(`aria-pressed`,W?`true`:`false`),G.dataset.empty=U===null?`true`:`false`,G.textContent=W?`Press keys…`:kn();let e=W?`Recording shortcut`:`Show/Hide panel shortcut: ${kn()}. Click to change`;G.title=e,G.setAttribute(`aria-label`,e),xn.hidden=W||wr(U,gr),xn.title=`Reset to ${kr(gr,rn())}`,Tn.textContent=W?`Esc cancels · Delete disables`:U===null?`Click to set a shortcut`:Dr(U)?`Ignored while typing`:``},jn=e=>{U=e,Cr(e),An(),Ir()},Mn=()=>{W&&(W=!1,An())};G.addEventListener(`click`,()=>{W?Mn():(W=!0,An(),G.focus({preventScroll:!0}))}),G.addEventListener(`blur`,Mn),G.addEventListener(`keydown`,e=>{if(!W||e.isComposing)return;e.preventDefault(),e.stopPropagation();let t=!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey;if(t&&e.key===`Escape`){Mn();return}if(t&&(e.key===`Backspace`||e.key===`Delete`)){W=!1,jn(null),M(`info`,`Show/Hide shortcut disabled`,1800);return}let n=Tr(e);if(n===void 0)return;let r=Or(n,rn());r===void 0?(W=!1,jn(n),M(`success`,`Show/Hide shortcut set to ${kn()}`,1800)):M(`warning`,`${kr(n,rn())} is ${r}`,2200)}),xn.addEventListener(`click`,()=>{jn(gr),M(`success`,`Show/Hide shortcut set to ${kn()}`,1800)}),An();let Nn=qr(),Pn=Rr(),Fn=document.createElement(`span`);Fn.className=`nri-settings-value`,Fn.textContent=Jr();let In=document.createElement(`button`);In.type=`button`,In.className=`nri-text-btn`,In.textContent=`What's New`,In.title=`Show the release notes of every version up to this one`,si(In);let Ln=document.createElement(`button`);Ln.type=`button`,Ln.className=`nri-switch`,Ln.setAttribute(`role`,`switch`),Ln.setAttribute(`aria-label`,`Include beta versions`),si(Ln);let Rn=document.createElement(`button`);Rn.type=`button`,Rn.className=`nri-push-btn`,si(Rn);let Bn=document.createElement(`span`);Bn.className=`nri-update-status`;let Vn=document.createElement(`a`);Vn.className=`nri-link`,Vn.target=`_blank`,Vn.rel=`noopener noreferrer`;let Hn=mn(`Beta Versions`,Ln);Hn.title=`Also offer beta versions; while on, checks once a day`;let Un=document.createElement(`div`);Un.className=`nri-settings-row`,Un.append(Rn,Bn,Vn),Hn.hidden=Nn.update===void 0,Un.hidden=Nn.update===void 0,H.append(Qt(`Appearance`,mn(`Style`,Te.el),mn(`Theme`,Oe.el)),Qt(`Keyboard`,mn(`Show/Hide Panel`,xn,G),Tn),Qt(`Updates`,mn(`Version`,In,Fn),Hn,Un));let Wn,Gn=e=>{window.clearTimeout(Wn),Rn.disabled=e.status===`checking`,Rn.textContent=e.status===`checking`?`Checking…`:`Check for Updates`,Vn.hidden=e.status!==`available`,Bn.hidden=e.status===`available`,w.dataset.badge=e.status===`available`?`true`:`false`,Bn.title=e.status===`failed`?e.reason:``,e.status===`available`?(Vn.textContent=`Install v${e.version}`,Vn.title=`Install v${e.version} with Tampermonkey`):e.status===`up-to-date`||e.status===`failed`?(Bn.textContent=e.status===`up-to-date`?`Up to date`:`Update check failed`,Wn=window.setTimeout(()=>Gn({status:`idle`}),e.status===`up-to-date`?3e3:5e3)):Bn.textContent=``},Kn=()=>{Ln.setAttribute(`aria-checked`,Pn?`true`:`false`)},qn=0,Jn=({background:e})=>{let t=Nn.update;if(t===void 0)return;let n=t[Br(Pn)],r=++qn;e||Gn({status:`checking`}),Lr({manifestUrl:n.manifestUrl,currentVersion:Nn.version}).then(t=>{r===qn&&(t.status===`available`&&(Vn.href=n.installUrl,e&&M(`info`,`Network Request Inspector v${t.version} is available`,4e3)),(!e||t.status===`available`)&&Gn(t))})};Rn.addEventListener(`click`,()=>{Jn({background:!1})}),Ln.addEventListener(`click`,()=>{Pn=!Pn,zr(Pn),Kn(),Pn?(Hr(),Jn({background:!1})):(qn++,Gn({status:`idle`}))}),Kn(),Gn({status:`idle`}),Pn&&Nn.update!==void 0&&Hr()&&Jn({background:!0});let Yn=Nn.changelog??[],Xn=hr({findRealResponse:e=>Zn(a,e)}),Qn=()=>{K.hidden&&(l===`rules`?y.dataset.view=`rules`:delete y.dataset.view)};function er(e,n){l=e,C.setValue(e),Xn.el.hidden=e!==`rules`,Qn(),St(),n&&!t&&(e===`rules`?Xn.focus():D.focus({preventScroll:!0}))}function tr(e){let t=Ve(e.method,e.url),n=t??Ie($n({record:e,records:a,pageOrigin:location.origin}));er(`rules`,!1),Xn.reveal(n.id),t===void 0&&M(`success`,n.orig===void 0?`Rule created with a default 500 response (no captured response to copy)`:`Rule created from the captured response; edit it below`,2500)}function nr(e){let t=e.mock;if(rt.hidden=t===void 0,t===void 0){rt.replaceChildren();return}let n;n=t.mode===`block`?`Answered by a mock rule — the request never reached the server.`:t.mode===`hang`?`Held by a mock rule — the request was not sent and never completes.`:t.real===void 0?`Response replaced by a mock rule (pass-through) — waiting for the server.`:t.real.error===void 0?`Response replaced by a mock rule (pass-through). The server really answered ${fi({...e,error:void 0,status:t.real.status})}.`:`Response replaced by a mock rule (pass-through). The real request failed: ${t.real.error}.`;let r=document.createElement(`button`);r.type=`button`,r.className=`nri-text-btn`,r.textContent=`Show rule`,r.addEventListener(`click`,()=>{let e=Ne().some(e=>e.id===t.ruleId);er(`rules`,!1),e?Xn.reveal(t.ruleId):M(`info`,`That rule has been deleted`,2e3)}),rt.replaceChildren(n,r)}function rr(){let e=b(),t=e!==void 0&&Ve(e.method,e.url)!==void 0,n=t?`Edit the mock rule for this request`:`Mock this request`;ft.title=n,ft.setAttribute(`aria-label`,n),ft.classList.toggle(`nri-mock-has`,t)}let K=document.createElement(`div`);K.className=`nri-whats-new`,K.setAttribute(`role`,`region`),K.setAttribute(`aria-label`,`What's New`),K.hidden=!0;let ir=document.createElement(`div`);ir.className=`nri-whats-new-header`;let ar=document.createElement(`h3`);ar.className=`nri-whats-new-title`,ar.textContent=`What's New`;let or=document.createElement(`p`);or.className=`nri-whats-new-subtitle`,ir.append(ar,or);let sr=document.createElement(`div`);sr.className=`nri-whats-new-notes`,sr.tabIndex=0;let cr=document.createElement(`button`);cr.type=`button`,cr.className=`nri-push-btn nri-primary`,cr.textContent=`Done`;let lr=document.createElement(`div`);lr.className=`nri-whats-new-actions`,lr.append(cr),K.append(ir,sr,lr);let ur=(e,t)=>{for(let n of Yr(t)){if(n.kind===`text`){e.append(n.text);continue}let t=document.createElement(n.kind===`code`?`code`:`strong`);t.textContent=n.text,e.append(t)}},q=e=>{let t=document.createElement(`section`);t.className=`nri-whats-new-version`;let n=document.createElement(`h4`);n.textContent=`v${e.version}`;let r=document.createElement(`span`);r.className=`nri-whats-new-date`,r.textContent=e.date,n.append(r),t.append(n);for(let n of e.sections){let e=document.createElement(`div`);e.className=`nri-whats-new-section`,e.textContent=n.title;let r=document.createElement(`ul`);for(let e of n.items){let t=document.createElement(`li`);if(ur(t,e.text),e.children.length>0){let n=document.createElement(`ul`);for(let t of e.children){let e=document.createElement(`li`);ur(e,t),n.append(e)}t.append(n)}r.append(t)}t.append(e,r)}return t},J=()=>!K.hidden,dr=({from:e,entries:n})=>{or.textContent=e===void 0?`Network Request Inspector ${Jr()}`:`Updated from v${e} to ${Jr()}`,sr.replaceChildren(...n.map(q)),sr.scrollTop=0,K.hidden=!1,y.dataset.view=`whats-new`,t||cr.focus({preventScroll:!0})},fr=()=>{if(!J())return;let e=K.contains(document.activeElement);K.hidden=!0,Qn(),e&&!t&&(l===`rules`?Xn.focus():D.focus({preventScroll:!0}))},pr=()=>{let e=$r({changelog:Yn,current:Nn.version});e!==void 0&&dr(e)};cr.addEventListener(`click`,fr);let mr,_r=()=>!H.hidden,vr=()=>{let e=w.getBoundingClientRect(),t=H.getBoundingClientRect(),n=Math.min(Math.max(4,e.right-t.width),window.innerWidth-t.width-4),r=e.bottom+4;r+t.height>window.innerHeight-4&&(r=Math.max(4,e.top-4-t.height)),H.style.left=`${n}px`,H.style.top=`${r}px`},yr=e=>{e.target instanceof Node&&(H.contains(e.target)||w.contains(e.target))||br(!1)},br=e=>{_r()&&(Mn(),H.hidden=!0,w.setAttribute(`aria-expanded`,`false`),w.setAttribute(`aria-pressed`,`false`),window.removeEventListener(`pointerdown`,yr,!0),window.removeEventListener(`resize`,vr),e&&mr?.isConnected===!0&&mr.focus({preventScroll:!0}))},xr=()=>{St(),mr=document.activeElement instanceof HTMLElement?document.activeElement:void 0,H.hidden=!1,w.setAttribute(`aria-expanded`,`true`),w.setAttribute(`aria-pressed`,`true`),vr(),H.focus({preventScroll:!0}),window.addEventListener(`pointerdown`,yr,!0),window.addEventListener(`resize`,vr)};w.addEventListener(`click`,()=>{_r()?br(!0):xr()}),In.addEventListener(`click`,()=>{br(!1),dr({entries:Qr({changelog:Yn,current:Nn.version})})}),H.addEventListener(`keydown`,e=>{e.key===`Escape`&&(e.preventDefault(),br(!0)),e.stopPropagation()}),y.append(he,T,Be.el,D,O,K,Xn.el),bn(y,()=>d,e=>{ee(e)});let Y=document.createElement(`button`);Y.type=`button`,Y.className=`nri-toggle`;let Ar=document.createElement(`span`);Ar.textContent=`NRI`;let Mr=document.createElement(`span`);Mr.className=`nri-badge`,Mr.textContent=`0`;let Nr=document.createElement(`span`);Nr.className=`nri-toggle-chevron`,Nr.innerHTML=oi.chevronDown;let X=document.createElement(`span`);X.className=`nri-toggle-mock`,X.hidden=!0,Y.append(Ar,Mr,X,Nr);let Pr=()=>{let e=Ne();if(e.length===0)return``;if(Pe())return`Mock rules: ${e.length} (paused)`;let t=Ce(e,!1);return t>0?`Mock rules: ${t} active`:`Mock rules: ${e.length} (none active)`},Fr=()=>{let e=Ne(),t=Pe()&&e.length>0,n=Ce(e,Pe());X.hidden=n===0&&!t,X.textContent=t?`Paused`:`Mock ${n}`,X.classList.toggle(`nri-paused`,t),Y.classList.toggle(`nri-mock-live`,n>0),_e.textContent=String(e.length),_e.hidden=e.length===0,_e.classList.toggle(`nri-live`,n>0),Ir()},Ir=()=>{let e=a.filter(pi).length,n=e>0?`Network Requests: ${a.length} (${e} failed)`:`Network Requests: ${a.length}`,r=t?`Show Panel`:`Hide Panel`,i=U===null?``:` (${kn()})`,o=Pr();Y.title=`${r}${i}\n${n}${o===``?``:`\n${o}`}`,Y.setAttribute(`aria-label`,`${r}${i} — ${n}${o===``?``:` — ${o}`}`),Y.setAttribute(`aria-expanded`,t?`false`:`true`)},Vr=document.createElement(`div`);Vr.className=`nri-dock`,Vr.appendChild(Y);let Ur=()=>{t?(y.classList.remove(`nri-open`),h.classList.add(`nri-idle`)):(y.classList.add(`nri-open`),h.classList.remove(`nri-idle`)),Ir()},Wr=e=>{if(t===e)return;let n=y.contains(document.activeElement)||H.contains(document.activeElement);St(),br(!1),e&&fr(),t=e,Ur(),pn(t),t?n&&Y.focus({preventScroll:!0}):(D.focus({preventScroll:!0}),pr())};Y.addEventListener(`click`,()=>{Wr(!t)}),window.addEventListener(`keydown`,e=>{U===null||W||e.repeat||e.isComposing||Ct()||_r()||!Er(e,U)||Dr(U)&&jr(e)||(e.preventDefault(),e.stopPropagation(),Wr(!t))},!0);let Kr=(e,t=!1)=>{let n=Gt(),r=tn(n,s.focusId,e);B(t?ln(n,s,r):sn(r),!0)};y.addEventListener(`keydown`,e=>{if(Ct())return;if(J()){e.key===`Escape`&&(e.preventDefault(),fr()),e.stopPropagation();return}if(l===`rules`){e.key===`Escape`&&!e.isComposing&&(e.preventDefault(),jr(e)&&e.target instanceof HTMLElement?(e.target.blur(),Xn.focus()):er(`requests`,!0)),e.stopPropagation();return}let t=e.target===E,n=e.target===D,r=e.target===F,i=e.target===P,a=e.target instanceof Node&&O.contains(e.target),o=b(),c=x(),u=!0;if(nn(e,`f`))a&&o!==void 0?z():(E.focus(),E.select());else if(i&&e.key===`Escape`)jt();else if(i&&e.key===`Enter`&&!e.isComposing)kt(L+(e.shiftKey?-1:1),!0);else if(nn(e,`k`))me();else if(nn(e,`c`)&&(n||r)&&c.length>0&&(window.getSelection()?.toString()??``)===``)c.length>1?de(c):te(c[0]);else if(nn(e,`a`)&&n)B(un(Gt(),s),!1);else if(e.key===`Escape`)t&&E.value!==``?Zt(``):t||r?D.focus({preventScroll:!0}):s.ids.size>0?B(on,!1):Wr(!0);else if(t)e.key===`ArrowDown`||e.key===`Enter`?(D.focus({preventScroll:!0}),s.focusId===void 0&&Kr(`first`)):u=!1;else if(n){let t=e.altKey||e.metaKey,n=e.shiftKey;switch(e.key){case`ArrowDown`:Kr(t?`last`:`next`,n);break;case`ArrowUp`:Kr(t?`first`:`previous`,n);break;case`Home`:Kr(`first`,n);break;case`End`:Kr(`last`,n);break;case`ArrowLeft`:Vt(-1);break;case`ArrowRight`:Vt(1);break;case`Enter`:o!==void 0&&F.focus({preventScroll:!0});break;default:u=!1}}else u=!1;u&&e.preventDefault(),e.stopPropagation()});let Xr=()=>Y.getBoundingClientRect().height||30;_n(Y,Xr,()=>f,e=>{_(e)}),h.append(y,Vr,H),Gr(h),Ur(),ji(h),t||pr(),_(gn(Xr())),window.addEventListener(`resize`,()=>{ee(vn(d)),_(hn(f,Xr())),He(Mt(p))}),Fr(),Fe(()=>{Fr(),rr()}),Je(e=>{a=e;let t=e.filter(pi).length;Mr.textContent=String(e.length),Mr.classList.toggle(`nri-badge-alert`,t>0),Ir(),Xt()})}let Ni=`__NRI_BOOTED__`;function Pi(){try{return window.self===window.top}catch{return!1}}function Fi(){let e=()=>{N().__apiMockErr===!0&&M(`warning`,`The old standalone mock script is still installed. Remove it in Tampermonkey — its rules have been moved here.`,8e3)};document.readyState===`complete`?e():window.addEventListener(`load`,e,{once:!0})}function Ii(){if(!Pi())return;let e=N();if(e[Ni]===!0)return;e[Ni]=!0,ht(),He(),Ke(F()),window.addEventListener(`pagehide`,()=>{vt(Ge())});let t=()=>{Mi(),Fi()};document.documentElement===null?document.addEventListener(`DOMContentLoaded`,t,{once:!0}):t(),console.log(`[NRI] Network Request Inspector loaded`)}Ii()})();