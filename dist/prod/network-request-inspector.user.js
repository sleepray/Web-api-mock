// ==UserScript==
// @name         Network Request Inspector + Mock
// @namespace    https://github.com/sleepray/Web-api-mock
// @version      0.5.1
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

const __NRI_BUILD__ = {"version":"0.5.1","changelog":[{"version":"0.5.1","date":"2026-11-12","sections":[{"title":"Changed","items":[{"text":"规则列表的外观和请求列表统一：启用和全部暂停改为开关，模式改为分段选择，预设改为和类型筛选一样的标签，规则之间用细线分隔；下拉框、数字框和响应体编辑框跟随面板的深浅色，滚动条与请求列表一致","children":[]}]},{"title":"Fixed","items":[{"text":"规则响应体编辑框右上角的格式化按钮会挡住内容：移到编辑框上方","children":[]}]}]},{"version":"0.5.0","date":"2026-11-12","sections":[{"title":"Added","items":[{"text":"界面支持中文：在设置的 **Appearance** 一栏选择 **Language**（自动 / English / 中文），默认跟随浏览器语言，所有网站共用；切换后立即生效，不用刷新页面。复制出去的 Markdown、cURL 保持英文","children":[]}]},{"title":"Changed","items":[{"text":"按钮、分段控件和筛选标签的悬停说明更快出现（约 0.4 秒），说明文字也写得更具体；请求行上显示完整 URL 的提示仍在停留约 1.5 秒后出现","children":[]}]}]},{"version":"0.4.0","date":"2026-11-12","sections":[{"title":"Added","items":[{"text":"Mock：按规则改写接口的返回，用来测前端的异常处理。工具栏的 **Requests | Rules** 切换到规则列表，每条规则按「方法 + 地址里的一段」匹配（以 `re:` 开头按正则），可以设状态码（`0` 为网络错误）、响应体、延迟和最多命中次数","children":[]},{"text":"三种模式：**Block** 不发到服务器、直接返回规则的内容；**Pass through** 请求照常发出并执行，只替换页面看到的返回；**Hang** 不发也一直不返回，用来看加载状态和前端自己的超时","children":[]},{"text":"在详情区点魔杖按钮或在右键菜单里选 **Mock This Request**，带着这个请求真实的状态码和响应体建规则，在它上面改；已有规则的请求改为 **Edit Mock Rule**，跳到那条规则","children":[]},{"text":"规则卡上的预设：`500`、`502`、`504`、`401`、`403`、**Offline**、**Slow 3s**、**Empty list**、**Never respond**，以及回到真实返回的 **Reset**","children":[]},{"text":"响应体编辑：输入时自动补上配对的引号和括号、回车保持缩进；**Format** 重新排版，写坏的 JSON 可以 **Auto-fix**（补引号、逗号、括号，去掉多余的逗号），改完说明修了几处并可撤销","children":[]},{"text":"被规则改过的请求在列表里带 **MOCK** 标记，筛选新增 **Mocked**；详情区说明是哪种模式改的，Pass through 模式下显示服务器真正的返回","children":[]},{"text":"有规则生效时角标显示条数，面板收起贴边时露出的那一截变红；**Pause All** 临时停用全部规则","children":[]},{"text":"刷新页面后请求列表仍在，刷新前的请求排在 **Before reload** 分隔线下面，照样可以查看和建规则；关掉标签页或清空请求后不再保留。存下来的请求头、请求参数和请求体已脱敏","children":[]},{"text":"规则按网站保存，刷新后仍然生效，同一网站的其它标签页同步生效；旧版独立 mock 脚本的规则会自动迁移过来，旧脚本还装着时会提示卸载","children":[]}]},{"title":"Changed","items":[{"text":"安装和更新改为从 GitHub 仓库获取，需要按 README 重新安装一次","children":[]}]}]},{"version":"0.3.0-beta.9","date":"2026-11-09","sections":[{"title":"Added","items":[{"text":"详情区可查找文本：点放大镜或在详情区按 `⌘F` 打开查找栏，高亮全部命中，`Return` / `⇧Return` 在命中之间跳转；JSON 树中折叠的节点会自动展开","children":[]}]}]},{"version":"0.3.0-beta.8","date":"2026-10-19","sections":[{"title":"Fixed","items":[{"text":"面板内按钮、筛选和请求行的悬停提示不显示：现在以面板配色显示，鼠标停留约 1.5 秒后出现，沿工具栏移到相邻按钮时立即切换","children":[]}]}]},{"version":"0.3.0-beta.7","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"详情区只在选中请求时显示，未选中时列表占满面板；点详情区右上角的 `×` 或在列表中按 `Esc` 可关闭详情区，再点任意请求即重新打开。`Esc` 改为先关闭详情区，再按一次才隐藏面板","children":[]}]}]},{"version":"0.3.0-beta.6","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"面板打开时 **NRI** 按钮变为向下箭头，一眼可见再点一次即可收起","children":[]}]},{"title":"Fixed","items":[{"text":"What's New 的条目在部分网站上缺少列表圆点","children":[]}]}]},{"version":"0.3.0-beta.5","date":"2026-10-12","sections":[{"title":"Added","items":[{"text":"更新后第一次打开面板时显示 **What's New**，列出从上一个版本到当前版本之间的全部变更，可跨多个版本；也可以随时在设置中查看所有版本的变更","children":[]}]},{"title":"Changed","items":[{"text":"面板打开时 **NRI** 按钮呈按下状态，悬停提示先说明点击的作用与快捷键，再显示请求数","children":[]}]}]},{"version":"0.3.0-beta.4","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"配色、主题、显示 / 隐藏快捷键与更新相关设置收进工具栏右端的齿轮设置浮层，面板底部状态栏移除，列表可多显示一行","children":[]},{"text":"配色与主题改为在设置中直接选择，不再需要逐个点击切换","children":[]},{"text":"测试版开关改为 macOS 风格的开关；有可安装的新版本时齿轮上显示圆点","children":[]}]}]},{"version":"0.3.0-beta.3","date":"2026-10-11","sections":[{"title":"Added","items":[{"text":"面板底部新增 **Beta** 开关，可选择接收测试版：打开后立即检查一次，此后每天自动检查一次，发现新版本时弹出提示并可直接安装","children":[]}]},{"title":"Changed","items":[{"text":"安装地址统一为正式版地址，Tampermonkey 只自动安装正式版；不再提供单独的测试版安装地址，已安装测试版的用户如需继续接收测试版，请在面板底部打开 **Beta**","children":[]},{"text":"面板较窄时底部隐藏 “Show/Hide” 文字标签，快捷键与版本信息不再被截断","children":[]}]}]},{"version":"0.3.0-beta.2","date":"2026-10-11","sections":[{"title":"Changed","items":[{"text":"安装与更新地址迁移到 `https://updates.sower.site/network-request-inspector/`；已安装 0.3.0-beta.1 的用户需要从新地址重新安装一次，之后照常自动更新","children":[]}]}]},{"version":"0.3.0-beta.1","date":"2026-10-11","sections":[{"title":"Added","items":[{"text":"在线安装与自动更新：通过固定地址安装正式版，Tampermonkey 会定期检查并安装新版本","children":[]},{"text":"测试版通道：通过单独的地址安装测试版，正式版发布后测试版会自动升级到正式版","children":[]},{"text":"面板底部显示当前完整版本号，可手动检查更新，发现新版本时可直接安装","children":[]},{"text":"详情区显示状态码及原因短语、耗时、响应大小、开始时间与来源（Fetch / XHR），并分为响应体、响应头、请求三个视图","children":[]},{"text":"JSON 响应体以可折叠树展示，可切换为格式化源码；响应头与查询参数以键值表展示","children":[]},{"text":"复制为 cURL、复制 URL、复制响应体、复制全部可见请求","children":[]},{"text":"复制模式 Redacted / Raw：默认隐藏认证类请求头、Cookie、API Key、敏感 URL 参数，以及 JSON 和表单中名为 token、secret、password、key、session 等的字段；列表、详情与所有复制方式都遵循该模式","children":[]},{"text":"按 All / Failed 筛选，Failed 包含 4xx、5xx 与网络错误","children":[]},{"text":"按响应类型筛选（JSON、Doc、Text、JS、CSS、Img、Media、Font、Other），⌘ 点击可多选，没有对应请求的类型会变暗","children":[]},{"text":"多选请求：⌘ 点击切换、Shift 点击或 Shift + 方向键连续选择、⌘A 全选可见请求，可将所选请求按列表顺序复制为 Markdown、cURL 或 URL","children":[]},{"text":"右键菜单：复制请求与响应、复制为 cURL、复制 URL、复制响应体、复制全部可见请求、清空请求","children":[]},{"text":"键盘操作：方向键选择请求、← / → 切换详情视图、⌘C 复制、⌘F 聚焦筛选框、⌘K 清空、Esc 逐级退出；面板内的按键不会触发宿主页面的快捷键","children":[]},{"text":"显示 / 隐藏面板的全局快捷键，默认 `H`，可录制新组合、禁用或重置；在输入框中只响应带 ⌘ / Ctrl / ⌥ 的组合，与面板已占用的按键冲突时会被拒绝","children":[]},{"text":"VS Code 与 macOS 两套配色，各有深色与浅色变体，与主题切换相互独立","children":[]}]},{"title":"Changed","items":[{"text":"面板改为上方请求列表、下方可调整高度的详情区，取代在列表中展开详情的方式；面板高度不足时详情区自动收缩，工具栏、列表、详情头部与底部栏始终完整显示","children":[]},{"text":"面板最小高度提高到 260px","children":[]},{"text":"主题、配色、面板尺寸、垂直位置、详情高度、复制模式与显示 / 隐藏快捷键在所有网站间同步；面板的打开 / 隐藏状态仍按网站分别保存","children":[]},{"text":"面板始终使用自带的界面字体与等宽字体，不受宿主页面样式影响","children":[]},{"text":"操作提示改为跟随面板风格的通知横幅","children":[]}]},{"title":"Removed","items":[{"text":"紧凑密度开关，面板始终使用紧凑布局","children":[]}]},{"title":"Fixed","items":[{"text":"新请求到达时列表与详情的滚动位置不再跳动","children":[]},{"text":"页面包含 iframe 时不再出现多个面板；同时安装多个版本时只会启动一个","children":[]}]}]},{"version":"0.2.0","date":"2026-07-30","sections":[{"title":"Added","items":[{"text":"面板停靠在页面边缘，鼠标移到边缘时显示","children":[]},{"text":"在列表中展开请求即可预览详情","children":[]},{"text":"拖动面板左侧与顶部边缘调整面板尺寸，拖动详情区边缘调整详情高度，调整结果会被记住","children":[]},{"text":"主题可选深色、浅色或跟随系统，选择会被记住","children":[]},{"text":"紧凑密度开关","children":[]}]},{"title":"Changed","items":[{"text":"加宽请求方法列","children":[]},{"text":"打开 / 隐藏面板时不再有边缘滑动动画","children":[]},{"text":"面板开关按钮在深色与浅色主题下使用一致的半透明底色","children":[]}]},{"title":"Fixed","items":[{"text":"XHR 请求完成后请求体丢失","children":[]},{"text":"开关按钮可以上下拖动，展开或收起时不再跳动","children":[]}]}]},{"version":"0.1.0","date":"2026-07-21","sections":[{"title":"Added","items":[{"text":"拦截页面的 fetch 与 XHR 请求，在浮动面板中按时间列出","children":[]},{"text":"按 URL 模糊搜索请求","children":[]},{"text":"一键复制请求与响应（Markdown）","children":[]},{"text":"深色主题列表","children":[]}]}]}],"update":{"latest":{"manifestUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/update.json","installUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/network-request-inspector.user.js"},"beta":{"manifestUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/beta/dist/prod/update.json","installUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/beta/dist/prod/network-request-inspector.user.js"}}};
(function(){let e={maxEntries:80,maxBodyChars:2e5,ignoreUrlPatterns:[/\.(js|css|map|png|jpe?g|gif|svg|webp|woff2?|ttf|ico)(\?|$)/i],panelDefaultCollapsed:!0,panelDefaultWidth:440,panelDefaultHeight:560,panelMinWidth:280,panelMinHeight:236,panelSizeStorageKey:`nri-panel-size`,panelDefaultBottom:16,panelMinBottom:8,panelOffsetStorageKey:`nri-panel-offset`,detailDefaultHeight:300,detailMinHeight:120,detailMaxHeight:720,detailHeightStorageKey:`nri-detail-height`,panelCollapsedStorageKey:`nri-panel-collapsed`,panelModeStorageKey:`nri-panel-mode`,panelDefaultTheme:`system`,panelThemeStorageKey:`nri-panel-theme`,panelDefaultPalette:`vscode`,panelPaletteStorageKey:`nri-panel-palette`,copyModeDefault:`redacted`,copyModeStorageKey:`nri-copy-mode`,toggleShortcutStorageKey:`nri-toggle-shortcut`,includeBetaStorageKey:`nri-include-beta`,betaCheckDateStorageKey:`nri-beta-check-date`,seenVersionStorageKey:`nri-seen-version`,languageStorageKey:`nri-language`,mockRulesStorageKey:`nri-mock-rules`,mockLegacyStorageKeys:[`__api_mock_err__`,`__fomo_mock_err__`],sessionRecordsStorageKey:`nri-session-records`,sessionRecordsBudgetChars:1e6},t=()=>{try{let e=globalThis;return e.__NRI_STORAGE_BRIDGE__??e.unsafeWindow?.__NRI_STORAGE_BRIDGE__??null}catch{return null}},n=()=>{try{return typeof GM_getValue==`function`}catch{return!1}},r=()=>{try{return typeof GM_setValue==`function`}catch{return!1}},i=e=>{if(e==null)return null;if(typeof e==`string`)return e;try{return JSON.stringify(e)}catch{return null}},a=e=>{try{return localStorage.getItem(e)}catch{return null}},o=(e,t)=>{try{localStorage.setItem(e,t)}catch{}};function s(e){if(n())try{let t=GM_getValue(e),n=i(t);if(n!==null)return n}catch{}let r=t();if(r!==null)try{let t=r.get(e),n=i(t);if(n!==null)return n}catch{}let o=a(e);return o===null?null:(c(e,o),o)}function c(e,n){if(r())try{GM_setValue(e,n)}catch{}let i=t();if(i!==null)try{i.set(e,n)}catch{}o(e,n)}let l=[`auto`,`en`,`zh`],u=`en`;function d(){try{let t=s(e.languageStorageKey);return l.includes(t)?t:`auto`}catch{return`auto`}}function f(t){try{c(e.languageStorageKey,t)}catch{}}function p(e,t=typeof navigator>`u`?[]:navigator.languages??[navigator.language]){return e===`auto`?(t.at(0)??``).toLowerCase().startsWith(`zh`)?`zh`:`en`:e}function m(e){u=e}function h(){return u}function g(e,t){return u===`zh`?t:e}let _=`[REDACTED]`,v=/* @__PURE__ */ new Set([`authorization`,`proxyauthorization`,`cookie`,`setcookie`,`apikey`,`xapikey`,`token`,`authtoken`,`xauthtoken`,`xsessiontoken`]),y=/* @__PURE__ */ new Set([`token`,`accesstoken`,`refreshtoken`,`idtoken`,`apikey`,`xapikey`,`key`,`secret`,`clientsecret`,`password`,`passwd`,`credential`,`session`,`sessionid`,`sid`]);function b(e){return e.toLowerCase().replace(/[^a-z0-9]/g,``)}function ee(e){return v.has(b(e))}function x(e){return y.has(b(e))}function S(e){if(e===void 0)return``;for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.toLowerCase();return``}function C(e){if(e===void 0)return;let t={};for(let[n,r]of Object.entries(e))t[n]=ee(n)?_:r;return t}function w(e){try{let t=new URL(e),n=Array.from(t.searchParams.entries());if(!n.some(([e])=>x(e)))return e;t.search=``;for(let[e,r]of n)t.searchParams.append(e,x(e)?_:r);return t.href}catch{return e}}function T(e){if(Array.isArray(e))return e.map(T);if(typeof e!=`object`||!e)return e;let t={};for(let[n,r]of Object.entries(e))t[n]=x(n)?_:T(r);return t}function te(e){let t=new URLSearchParams(e),n=Array.from(t.entries());if(!n.some(([e])=>x(e)))return e;let r=new URLSearchParams;for(let[e,t]of n)r.append(e,x(e)?_:t);return r.toString()}function E(e,t){return typeof e==`string`?S(t).includes(`application/x-www-form-urlencoded`)?te(e):e:T(e)}function ne(e){let t=C(e.requestHeaders),n=C(e.responseHeaders),r={...e,url:w(e.url),requestHeaders:t,responseHeaders:n,requestBody:E(e.requestBody,t),responseBody:E(e.responseBody,n)},i=e.mock?.real;if(e.mock!==void 0&&i!==void 0){let t=C(i.responseHeaders);r.mock={...e.mock,real:{...i,responseHeaders:t,responseBody:E(i.responseBody,t)}}}return r}function re(e){if(e===void 0)return``;for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.toLowerCase();return``}function ie(e,t){if(typeof e==`object`&&e)return`json`;let n=String(e).trim().toLowerCase(),r=re(t);return r.includes(`text/html`)||r.includes(`application/xhtml+xml`)||n.startsWith(`<!doctype html`)||n.startsWith(`<html`)?`html`:r.includes(`xml`)||n.startsWith(`<?xml`)||n.startsWith(`<svg`)?`xml`:`text`}function ae(t,n){if(t==null)return{text:``,language:`text`,empty:!0,truncated:!1,totalChars:0};let r;try{r=typeof t==`string`?t:JSON.stringify(t,null,2)}catch{r=String(t)}let i=r.length,a=i>e.maxBodyChars;return{text:a?r.slice(0,e.maxBodyChars):r,language:a?`text`:ie(t,n),empty:!1,truncated:a,totalChars:i}}function oe(e){return e===void 0||Object.keys(e).length===0?`(none)`:Object.entries(e).map(([e,t])=>`${e}: ${t}`).join(`
`)}function D(e,t){return t===`redacted`?ne(e):e}function se(e){return`\`${e.replace(/`/g,"\\`")}\``}function ce(e,t){let n=e.match(/`+/g)??[],r=Math.max(3,...n.map(e=>e.length+1)),i="`".repeat(r);return`${i}${t}\n${e}\n${i}`}function le(e){if(e.empty)return`*(empty)*`;let t=ce(e.text,e.language);return e.truncated?`${t}\n\n> Truncated: ${e.totalChars} characters total.`:t}function ue(e){let t=ae(e.requestBody,e.requestHeaders),n=[`- Method: ${se(e.method)}`,`- URL: ${se(e.url)}`,`- Source: ${se(e.source)}`];return e.durationMs!==void 0&&n.push(`- Duration: ${e.durationMs}ms`),[`## Request`,``,...n,``,`### Headers`,``,ce(oe(e.requestHeaders),`http`),``,`### Body`,``,le(t)].join(`
`)}function de(e){let t=ae(e.responseBody,e.responseHeaders);return[`## Response`,``,...e.status===void 0?e.error===void 0?[`- Status: *(pending)*`]:[`- Error: ${se(e.error)}`]:[`- Status: ${e.status}`],``,`### Headers`,``,ce(oe(e.responseHeaders),`http`),``,`### Body`,``,le(t)].join(`
`)}function fe(e,t=`redacted`){let n=D(e,t);return[ue(n),``,de(n)].join(`
`)}function pe(e,t=`redacted`){return e.map((n,r)=>`# Request ${r+1} of ${e.length}\n\n${fe(n,t)}`).join(`

---

`)}function me(e){return`'${e.replace(/'/g,`'\\''`)}'`}function he(e,t=`redacted`){let n=D(e,t),r=n.method.toUpperCase(),i=[`curl ${me(n.url)}`];r!==`GET`&&i.push(`-X ${r}`);for(let[e,t]of Object.entries(n.requestHeaders??{}))i.push(`-H ${me(`${e}: ${t}`)}`);let a=n.requestBody;if(a!=null&&a!==``){let e;try{e=typeof a==`string`?a:JSON.stringify(a)}catch{e=String(a)}i.push(`--data-raw ${me(e)}`)}return i.join(` \\
  `)}function ge(e){if(e==null)return`—`;let t;try{t=typeof e==`string`?e:JSON.stringify(e)}catch{t=String(e)}let n=new TextEncoder().encode(t).length;return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(1)} MB`}let _e={200:`OK`,201:`Created`,202:`Accepted`,204:`No Content`,206:`Partial Content`,301:`Moved Permanently`,302:`Found`,303:`See Other`,304:`Not Modified`,307:`Temporary Redirect`,308:`Permanent Redirect`,400:`Bad Request`,401:`Unauthorized`,403:`Forbidden`,404:`Not Found`,405:`Method Not Allowed`,408:`Request Timeout`,409:`Conflict`,410:`Gone`,413:`Payload Too Large`,415:`Unsupported Media Type`,422:`Unprocessable Entity`,429:`Too Many Requests`,500:`Internal Server Error`,501:`Not Implemented`,502:`Bad Gateway`,503:`Service Unavailable`,504:`Gateway Timeout`};function ve(e){return _e[e]??``}function ye(e){try{return Array.from(new URL(e,`http://localhost`).searchParams.entries())}catch{return[]}}function be(e,t){return new Promise((n,r)=>{if(t!=null){let e=()=>{r(t.reason===void 0?new DOMException(`The user aborted a request.`,`AbortError`):t.reason)};if(t.aborted){e();return}t.addEventListener(`abort`,e,{once:!0})}e!==1/0&&setTimeout(n,e)})}function xe(e){let t=e.trim().charAt(0);return t===`{`||t===`[`?`application/json`:`text/plain;charset=utf-8`}function Se(e){return e===204||e===205||e===304}function Ce({status:e,body:t,url:n,ResponseCtor:r=Response}){let i=new r(Se(e)?null:t,{status:e,statusText:ve(e),headers:{"content-type":xe(t)}});try{Object.defineProperty(i,"url",{value:n})}catch{}return i}function we(e,t){return e===0?{}:{"content-type":xe(t)}}let Te={status:0,body:``};function Ee(e){let t=e.XMLHttpRequest.prototype;function n(e){let n=Object.getOwnPropertyDescriptor(t,e)?.get;return e=>n===void 0?void 0:n.call(e)}let r=n(`readyState`),i=n(`status`),a=n(`statusText`),o=n(`response`),s=n(`responseText`),c=n(`responseURL`),l=n(`responseType`),u=n(`timeout`),d=t.getResponseHeader,f=t.getAllResponseHeaders;function p(t,n){switch(l(t)){case`json`:try{return JSON.parse(n)}catch{return null}case`blob`:return new(e.Blob??Blob)([n],{type:xe(n)});case`arraybuffer`:return new(e.TextEncoder??TextEncoder)().encode(n).buffer;case`document`:return null;default:return n}}function m(e){try{let t=l(e);if(t===``||t===`text`||t===void 0)return s(e);if(t===`json`){let t=o(e);return t==null?void 0:JSON.stringify(t)}}catch{}}return{readReal(e){let t=``;try{t=f.call(e)}catch{}return{status:i(e)??0,body:m(e),headers:t}},readTimeout(e){return u(e)??0},mask(e,t,n,l){let u=()=>!l||r(e)===4,m=t.status===0,h=m?``:t.body,g=xe(h);function _(t,n,r){Object.defineProperty(e,t,{configurable:!0,get:()=>u()?n():r(e)})}l||Object.defineProperty(e,"readyState",{configurable:!0,get:()=>4}),_(`status`,()=>t.status,i),_(`statusText`,()=>ve(t.status),a),_(`responseText`,()=>h,s),_(`response`,()=>p(e,h),o),_(`responseURL`,()=>m?``:n,c),e.getResponseHeader=t=>u()?!m&&t.toLowerCase()===`content-type`?g:null:d.call(e,t),e.getAllResponseHeaders=()=>u()?m?``:`content-type: ${g}\r\n`:f.call(e)}}}let De=[`ANY`,`GET`,`POST`,`PUT`,`PATCH`,`DELETE`];function Oe(e){let t=typeof e==`number`?e:parseInt(String(e),10);return Number.isFinite(t)?Math.trunc(t):NaN}function ke(e){let t=Oe(e);return t===0||t>=200&&t<=599}function O(){return Math.random().toString(36).slice(2,10)}function Ae(e){let t=typeof e==`object`&&e?e:{},n=String(t.method??``).toUpperCase(),r=typeof t.orig==`object`&&t.orig!==null?t.orig:void 0,i={id:typeof t.id==`string`&&t.id!==``?t.id:O(),on:t.on!==!1,method:De.includes(n)?n:`ANY`,match:typeof t.match==`string`?t.match:``,status:ke(t.status)?Oe(t.status):500,body:typeof t.body==`string`?t.body:`{"code":500,"message":"Internal Server Error (mock)"}`,mode:t.mode===`rewrite`||t.mode===`hang`?t.mode:`block`,delay:Math.max(0,Oe(t.delay)||0),times:Math.max(0,Oe(t.times)||0),hits:Math.max(0,Oe(t.hits)||0)};return r!==void 0&&typeof r.body==`string`&&(i.orig={status:ke(r.status)?Oe(r.status):200,body:r.body}),i}function je(e,t){let n=e.trim();if(n===``)return!1;if(n.startsWith(`re:`))try{return new RegExp(n.slice(3)).test(t)}catch{return!1}return t.includes(n)}function Me(e){return e.times>0&&e.hits>=e.times}function Ne(e,t,n){return(e.method===`ANY`||e.method===t.toUpperCase())&&je(e.match,n)}function Pe({rules:e,paused:t,method:n,url:r}){if(!t)return e.find(e=>e.on&&!Me(e)&&Ne(e,n,r))}function Fe(e,t){return t?0:e.filter(e=>e.on&&e.match.trim()!==``&&!Me(e)).length}function Ie(e){return e.mode===`rewrite`&&e.status===0?`block`:e.mode}let Le,Re=/* @__PURE__ */ new Set;function ze(e){try{return localStorage.getItem(e)}catch{return null}}function Be(e){if(e!==null)try{let t=JSON.parse(e);if(typeof t!=`object`||!t)return;let{paused:n,rules:r}=t;return{paused:n===!0,rules:Array.isArray(r)?r.map(Ae):[]}}catch{return}}function k(){let t;for(let n of e.mockLegacyStorageKeys){let e=Be(ze(n));if(e!==void 0){t??=e;try{localStorage.removeItem(n)}catch{}}}return t}function Ve(){let t=Be(ze(e.mockRulesStorageKey)),n=k(),r=t??n??{paused:!1,rules:[]};return t===void 0&&n!==void 0&&He(r),r}function He(t){try{localStorage.setItem(e.mockRulesStorageKey,JSON.stringify(t))}catch{}}function A(){return Le??=Ve(),Le}function Ue(e){Le=e,He(e);for(let e of Re)e()}function We(){return A().rules}function Ge(){return A().paused}function Ke(e){return Re.add(e),()=>{Re.delete(e)}}function j(e){Ue({...A(),paused:e})}function qe(e={}){let t=Ae(e);return Ue({...A(),rules:[...A().rules,t]}),t}function M(e){let{rules:t}=A();t.some(t=>t.id===e.id)&&Ue({...A(),rules:t.map(t=>t.id===e.id?Ae(e):t)})}function Je(e){Ue({...A(),rules:A().rules.filter(t=>t.id!==e)})}function Ye(){Ue({...A(),rules:[]})}function Xe(e){let{rules:t}=A();Ue({...A(),rules:t.map(t=>t.id===e?{...t,hits:t.hits+1}:t)})}function Ze(e,t){try{let{rules:n,paused:r}=A();return r||n.length===0?void 0:Pe({rules:n,paused:r,method:e,url:t})}catch{return}}function Qe(e,t){return A().rules.find(n=>Ne(n,e,t))}function $e(){Le=Ve();for(let e of Re)e()}function et(t=window){t.addEventListener(`storage`,t=>{t.key===e.mockRulesStorageKey&&$e()})}let N=[],tt=/* @__PURE__ */ new Set;function nt(){let e=N.slice();for(let t of tt)t(e)}function rt(){return N}function P(t){let n=N.findIndex(e=>e.id===t.id);n>=0?N=[...N.slice(0,n),t,...N.slice(n+1)]:(N=[t,...N],N.length>e.maxEntries&&(N=N.slice(0,e.maxEntries))),nt()}function it(t){if(t.length===0)return;let n=new Set(N.map(e=>e.id));N=[...N,...t.filter(e=>!n.has(e.id))].slice(0,e.maxEntries),nt()}function at(){N=[],nt()}function ot(e){return tt.add(e),e(N.slice()),()=>{tt.delete(e)}}let st=`nri-toast-style`,F=`nri-toast-container`,ct=`dark`,lt=`vscode`;function ut(e,t){ct=e,lt=t;let n=document.getElementById(F);n!==null&&(n.dataset.nriTheme=e,n.dataset.nriPalette=t)}let dt={success:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m4.8 8.2 2.1 2.1 4.3-4.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,error:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m5.5 5.5 5 5m0-5-5 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,warning:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M8 4.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.4" r="1" fill="#fff"/></svg>`,info:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><circle cx="8" cy="4.8" r="1" fill="#fff"/><path d="M8 7.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`};function ft(){if(document.getElementById(st)!==null)return;let e=document.createElement(`style`);e.id=st,e.textContent=`
        /* macOS 通知横幅：右上角毛玻璃卡片，从右侧滑入 */
        #${F} {
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
        #${F}[data-nri-theme="light"] {
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
        #${F}[data-nri-palette="macos"] {
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
        #${F}[data-nri-theme="light"][data-nri-palette="macos"] {
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
        #${F} .nri-toast {
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
        #${F} .nri-toast * {
            margin: 0;
            padding: 0;
            font: inherit !important;
            letter-spacing: inherit !important;
            text-transform: inherit !important;
            color: inherit;
        }
        #${F} .nri-toast-show {
            opacity: 1;
            transform: none;
        }
        #${F} .nri-toast-icon {
            flex: 0 0 auto;
            width: 18px;
            height: 18px;
        }
        #${F} .nri-toast-icon svg {
            display: block;
            width: 100%;
            height: 100%;
        }
        #${F} .nri-toast-success .nri-toast-icon {
            color: var(--nri-toast-success);
        }
        #${F} .nri-toast-error .nri-toast-icon {
            color: var(--nri-toast-error);
        }
        #${F} .nri-toast-warning .nri-toast-icon {
            color: var(--nri-toast-warning);
        }
        #${F} .nri-toast-info .nri-toast-icon {
            color: var(--nri-toast-info);
        }
        @media (prefers-reduced-transparency: reduce) {
            #${F} .nri-toast {
                background: var(--nri-toast-opaque);
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            #${F} .nri-toast {
                transform: none;
                transition: opacity 0.2s ease;
            }
        }
    `,document.head.appendChild(e)}function pt(){let e=document.getElementById(F);if(e instanceof HTMLDivElement)return e;let t=document.createElement(`div`);return t.id=F,t.dataset.nriTheme=ct,t.dataset.nriPalette=lt,t.setAttribute(`role`,`status`),t.setAttribute(`aria-live`,`polite`),document.documentElement.appendChild(t),t}function I(e,t,n=2500){ft();let r=pt(),i=document.createElement(`div`);i.className=`nri-toast nri-toast-${e}`;let a=document.createElement(`span`);a.className=`nri-toast-icon`,a.innerHTML=dt[e];let o=document.createElement(`span`);o.textContent=t,i.append(a,o),r.appendChild(i),i.offsetWidth,i.classList.add(`nri-toast-show`),window.setTimeout(()=>{i.classList.remove(`nri-toast-show`),window.setTimeout(()=>{i.remove()},300)},n)}async function mt(e){let t=navigator.clipboard;if(t!==void 0&&typeof t.writeText==`function`){await t.writeText(e);return}let n=document.createElement(`textarea`);n.value=e,n.style.cssText=`position:fixed;left:-9999px;top:-9999px;opacity:0;`,document.body.appendChild(n),n.focus(),n.select();let r=document.execCommand(`copy`);if(n.remove(),!r)throw Error(`Clipboard copy failed`)}function ht(){return typeof crypto<`u`&&typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function gt(e){let t=e.trim();if(t.startsWith(`{`)&&t.endsWith(`}`)||t.startsWith(`[`)&&t.endsWith(`]`))try{return JSON.parse(t)}catch{return e}return e}function _t(e){if(e!==void 0){if(e instanceof Headers){let t={};return e.forEach((e,n)=>{t[n]=e}),t}return{...e}}}function vt(e,t){return t.some(t=>t.test(e))}function yt(){return globalThis.unsafeWindow??window}function bt(e,t){if(e==null)return;if(typeof e==`string`)return gt(e);let n=t??yt();if(e instanceof URLSearchParams||n.URLSearchParams&&e instanceof n.URLSearchParams||Object.prototype.toString.call(e)===`[object URLSearchParams]`)return e.toString();if(typeof Blob<`u`&&e instanceof Blob||n.Blob&&e instanceof n.Blob||Object.prototype.toString.call(e)===`[object Blob]`||Object.prototype.toString.call(e)===`[object File]`){let t=e;return`[Blob type=${t.type||`unknown`} size=${t.size}]`}if(typeof FormData<`u`&&e instanceof FormData||n.FormData&&e instanceof n.FormData||Object.prototype.toString.call(e)===`[object FormData]`){let t=[];return e.forEach((e,n)=>{typeof e==`string`?t.push(`${n}=${e}`):t.push(`${n}=[File name=${e.name} size=${e.size}]`)}),t.join(`&`)}if(e instanceof ArrayBuffer||n.ArrayBuffer&&e instanceof n.ArrayBuffer||Object.prototype.toString.call(e)===`[object ArrayBuffer]`)return`[ArrayBuffer byteLength=${e.byteLength}]`;if(ArrayBuffer.isView(e)||n.ArrayBuffer?.isView&&n.ArrayBuffer.isView(e))return`[TypedArray byteLength=${e.byteLength}]`;try{return String(e)}catch{return`[unreadable body]`}}async function xt(e,t,n){let r=n??yt();if(e instanceof Request||r.Request&&e instanceof r.Request||Object.prototype.toString.call(e)===`[object Request]`){let n=e,i=(t?.method??n.method??`GET`).toUpperCase(),a=n.url,o=r.Headers??Headers,s=new o(n.headers);t?.headers!==void 0&&new o(t.headers).forEach((e,t)=>{s.set(t,e)});let c;if(t?.body!==void 0)c=bt(t.body,r);else try{let e=await n.clone().text();c=e===``?void 0:gt(e)}catch{c=`[unreadable Request body]`}return{method:i,url:a,requestHeaders:_t(s),requestBody:c}}let i=typeof e==`string`?e:e instanceof URL||r.URL&&e instanceof r.URL?e.href:String(e),a=r.Headers??Headers;return{method:(t?.method??`GET`).toUpperCase(),url:new URL(i,location.href).href,requestHeaders:_t(t?.headers===void 0?void 0:new a(t.headers)),requestBody:bt(t?.body,r)}}function St(e){let t={};for(let n of e.trim().split(/[\r\n]+/)){let e=n.indexOf(`:`);if(e<=0)continue;let r=n.slice(0,e).trim(),i=n.slice(e+1).trim();r!==``&&(t[r]=i)}return t}function Ct(e){return e===void 0||e===``?void 0:gt(e)}function L(e,t){if(t?.signal!==void 0&&t.signal!==null)return t.signal;let n=e.signal;return typeof n==`object`&&n?n:void 0}async function wt({rule:e,base:t,input:n,init:r,originalFetch:i,pageWindow:a}){let o={...e},s=Ie(o),c={ruleId:o.id,mode:s},l=()=>Date.now()-t.startedAt;Xe(o.id),P({...t,mock:c});try{let e=L(n,r);if(s===`rewrite`){let t=i(n,r).then(async e=>{let t;try{t=Ct(await e.text())}catch{t=`[unreadable response body]`}c.real={status:e.status,responseHeaders:_t(e.headers),responseBody:t}},e=>{c.real={error:e instanceof Error?e.message:String(e)}});await Promise.all([t,be(o.delay,e)])}else await be(s===`hang`?1/0:o.delay,e)}catch(e){throw P({...t,mock:c,durationMs:l(),error:`Aborted`}),e}if(o.status===0)throw P({...t,mock:c,durationMs:l(),error:`Failed to fetch`}),new a.TypeError(`Failed to fetch`);return P({...t,mock:c,durationMs:l(),status:o.status,responseHeaders:we(o.status,o.body),responseBody:Ct(o.body)}),Ce({status:o.status,body:o.body,url:t.url,ResponseCtor:a.Response})}function Tt(t){let n=t.fetch.bind(t);t.fetch=async(r,i)=>{let a=Date.now(),o=ht(),s;try{let e=await xt(r,i,t);s={id:o,method:e.method,url:e.url,startedAt:a,requestHeaders:e.requestHeaders,requestBody:e.requestBody,source:`fetch`}}catch{s={id:o,method:`GET`,url:String(r),startedAt:a,source:`fetch`}}let c=Ze(s.method,s.url);if(c!==void 0)return wt({rule:c,base:s,input:r,init:i,originalFetch:n,pageWindow:t});if(vt(s.url,e.ignoreUrlPatterns))return n(r,i);P({...s});try{let e=await n(r,i),t;try{let n=await e.clone().text();t=n===``?void 0:gt(n)}catch{t=`[unreadable response body]`}return P({...s,durationMs:Date.now()-a,status:e.status,responseHeaders:_t(e.headers),responseBody:t}),e}catch(e){throw P({...s,durationMs:Date.now()-a,error:e instanceof Error?e.message:String(e)}),e}}}function Et(t){let n=t.XMLHttpRequest,r=n.prototype.open,i=n.prototype.send,a=n.prototype.setRequestHeader,o=n.prototype.abort,s=Ee(t),c=/* @__PURE__ */ new WeakMap;n.prototype.open=function(t,n,i,a,o){let s=typeof n==`string`?new URL(n,location.href).href:n.href;return c.set(this,{method:t.toUpperCase(),url:s,requestHeaders:{},id:ht(),startedAt:Date.now(),ignored:vt(s,e.ignoreUrlPatterns),aborted:!1,mockDone:!1}),r.call(this,t,n,i??!0,a,o)},n.prototype.setRequestHeader=function(e,t){let n=c.get(this);return n!==void 0&&(n.requestHeaders[e]=t),a.call(this,e,t)},n.prototype.abort=function(){let e=c.get(this);return e!==void 0&&(e.aborted=!0,e.onMockAbort?.()),o.call(this)};function l(e,n,r,a){let o={...r},c=Ie(o),l={ruleId:o.id,mode:c};Xe(o.id),n.startedAt=Date.now(),n.requestBody=bt(a,t);let u=()=>({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,source:`xhr`,mock:l}),d=()=>({...u(),durationMs:Date.now()-n.startedAt}),f=(e,t=`Network error`)=>{P(e.status===0?{...d(),error:t}:{...d(),status:e.status,responseHeaders:we(e.status,e.body),responseBody:Ct(e.body)})};if(P(u()),c===`rewrite`)return s.mask(e,o,n.url,!0),e.addEventListener(`loadend`,()=>{if(n.aborted){P({...d(),error:`Aborted`});return}let t=s.readReal(e);l.real=t.status===0?{error:`Network error`}:{status:t.status,responseHeaders:St(t.headers),responseBody:Ct(t.body)},f(o)}),i.call(e,a);let p=r=>{if(n.aborted||n.mockDone)return;n.mockDone=!0;let i=r===`timeout`?Te:o;s.mask(e,i,n.url,!1),f(i,r===`timeout`?`Timeout`:`Network error`),e.dispatchEvent(new t.Event(`readystatechange`)),e.dispatchEvent(new t.ProgressEvent(r)),e.dispatchEvent(new t.ProgressEvent(`loadend`))};n.onMockAbort=()=>{n.mockDone||(n.mockDone=!0,P({...d(),error:`Aborted`}))};let m=s.readTimeout(e);m>0&&(c===`hang`||o.delay>m)&&setTimeout(()=>p(`timeout`),m),c!==`hang`&&setTimeout(()=>p(o.status===0?`error`:`load`),o.delay)}n.prototype.send=function(e){let n=c.get(this);if(n===void 0)return i.call(this,e);let r=Ze(n.method,n.url);if(r!==void 0)return l(this,n,r,e);if(n.ignored)return i.call(this,e);let a=Date.now();return n.startedAt=a,n.requestBody=bt(e,t),P({id:n.id,method:n.method,url:n.url,startedAt:a,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,source:`xhr`}),this.addEventListener(`loadend`,()=>{let e;try{let t=this.responseText;e=t===``?void 0:gt(t)}catch{e=Ct(s.readReal(this).body)??`[unreadable response body]`}P({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,status:this.status,responseHeaders:St(this.getAllResponseHeaders()),responseBody:e,source:`xhr`})}),this.addEventListener(`error`,()=>{P({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,error:`Network error`,source:`xhr`})}),this.addEventListener(`abort`,()=>{P({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,error:`Aborted`,source:`xhr`})}),i.call(this,e)}}function Dt(){let e=yt();Tt(e),Et(e)}function R(e){if(e===void 0)return 0;if(typeof e==`string`)return e.length;try{return JSON.stringify(e)?.length??0}catch{return 1/0}}function Ot(e){return e.status!==void 0||e.error!==void 0}function kt(t,n=e.sessionRecordsBudgetChars){let r=n;return t.filter(Ot).map(e=>{let t=C(e.requestHeaders),n=C(e.responseHeaders),i=R(e.responseBody)+R(e.mock?.real?.responseBody),a=i<=r;a&&(r-=i);let o={...e,url:w(e.url),requestHeaders:t,requestBody:E(e.requestBody,t),responseHeaders:n,responseBody:a?e.responseBody:void 0};if(e.mock?.real!==void 0){let t=C(e.mock.real.responseHeaders);o.mock={...e.mock,real:{...e.mock.real,responseHeaders:t,responseBody:a?e.mock.real.responseBody:void 0}}}return delete o.restored,o})}function At(t,n=sessionStorage){let r=kt(t);try{n.setItem(e.sessionRecordsStorageKey,JSON.stringify(r))}catch{try{n.setItem(e.sessionRecordsStorageKey,JSON.stringify(kt(t,0)))}catch{}}}function jt(e){if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.id==`string`&&typeof t.method==`string`&&typeof t.url==`string`&&typeof t.startedAt==`number`&&(t.source===`fetch`||t.source===`xhr`)}function Mt(t=sessionStorage){try{let n=JSON.parse(t.getItem(e.sessionRecordsStorageKey)??`[]`);return Array.isArray(n)?n.filter(jt).slice(0,e.maxEntries).map(e=>({...e,restored:!0})):[]}catch{return[]}}let z;function Nt(e){return e!==void 0&&e!==`separator`&&e.disabled!==!0}function Pt(e,t,n){for(let r=1;r<=e.length;r++){let i=(t+n*r+e.length*2)%e.length;if(Nt(e[i]))return i}}function Ft(e,t,n){let r=t.length===1?(n??-1)+1:n??0,i=t.toLowerCase();for(let t=0;t<e.length;t++){let n=(r+t)%e.length,a=e[n];if(Nt(a)&&a.label.toLowerCase().startsWith(i))return n}}function It(){z?.()}function Lt(){return z!==void 0}function Rt(e,t,n,r){It();let i=document.activeElement instanceof HTMLElement?document.activeElement:void 0,a=document.createElement(`div`);a.className=`nri-menu`,a.setAttribute(`role`,`menu`),a.tabIndex=-1;let o=[],s,c=``,l,u=e=>{s=e,o.forEach((t,n)=>{t?.classList.toggle(`nri-menu-active`,n===e)})},d=e=>{z===f&&(z=void 0,window.removeEventListener(`pointerdown`,m,!0),window.removeEventListener(`contextmenu`,m,!0),window.removeEventListener(`blur`,h),window.removeEventListener(`resize`,h),window.removeEventListener(`scroll`,g,!0),window.clearTimeout(l),a.remove(),e&&i?.isConnected===!0&&i.focus({preventScroll:!0}))},f=()=>{d(!0)},p=e=>{let n=t[e];Nt(n)&&(d(!0),n.onSelect())};t.forEach((e,t)=>{if(e===`separator`){let e=document.createElement(`div`);e.className=`nri-menu-separator`,e.setAttribute(`role`,`separator`),a.appendChild(e),o.push(void 0);return}let n=document.createElement(`button`);n.type=`button`,n.className=`nri-menu-item`,n.tabIndex=-1,n.setAttribute(`role`,`menuitem`),n.disabled=e.disabled===!0,e.danger===!0&&n.classList.add(`nri-menu-danger`);let r=document.createElement(`span`);if(r.className=`nri-menu-label`,r.textContent=e.label,n.appendChild(r),e.shortcut!==void 0){let t=document.createElement(`span`);t.className=`nri-menu-shortcut`,t.textContent=e.shortcut,n.appendChild(t)}n.addEventListener(`pointermove`,()=>{Nt(e)&&s!==t&&u(t)}),n.addEventListener(`click`,e=>{e.stopPropagation(),p(t)}),a.appendChild(n),o.push(n)}),a.addEventListener(`pointerleave`,()=>{u(void 0)}),a.addEventListener(`contextmenu`,e=>{e.preventDefault()}),a.addEventListener(`keydown`,e=>{e.stopPropagation();let{key:n}=e;if(n===`ArrowDown`||n===`ArrowUp`){e.preventDefault();let r=n===`ArrowDown`?1:-1,i=s??(r===1?-1:t.length);u(Pt(t,i,r))}else if(n===`Home`||n===`End`)e.preventDefault(),u(n===`Home`?Pt(t,-1,1):Pt(t,t.length,-1));else if(n===`Enter`||n===` `)e.preventDefault(),s!==void 0&&p(s);else if(n===`Escape`||n===`Tab`)e.preventDefault(),d(!0);else if(n.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault(),window.clearTimeout(l),c+=n,l=window.setTimeout(()=>{c=``},800);let r=Ft(t,c,s);r!==void 0&&u(r)}});let m=e=>{e.target instanceof Node&&a.contains(e.target)||d(!1)},h=()=>{d(!1)},g=e=>{e.target instanceof Node&&a.contains(e.target)||d(!1)};e.appendChild(a),z=f;let _=a.getBoundingClientRect(),v=n,y=r;v+_.width>window.innerWidth-4&&(v=Math.max(4,n-_.width)),y+_.height>window.innerHeight-4&&(y=Math.max(4,r-_.height)),a.style.left=`${v}px`,a.style.top=`${y}px`,a.focus({preventScroll:!0}),window.setTimeout(()=>{z===f&&(window.addEventListener(`pointerdown`,m,!0),window.addEventListener(`contextmenu`,m,!0),window.addEventListener(`blur`,h),window.addEventListener(`resize`,h),window.addEventListener(`scroll`,g,!0))},0)}let zt=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function Bt(t){let n=Math.max(e.detailMinHeight,Math.floor(window.innerHeight*.6)),r=Math.min(e.detailMaxHeight,n);return Math.min(r,Math.max(e.detailMinHeight,Math.round(t)))}function Vt(){let t=e.detailDefaultHeight;try{let n=s(e.detailHeightStorageKey);if(n===null)return Bt(t);let r=JSON.parse(n);return typeof r==`object`&&r&&zt(r.height)?Bt(r.height):zt(r)?Bt(r):Bt(t)}catch{return Bt(t)}}function Ht(t){try{c(e.detailHeightStorageKey,JSON.stringify({height:Bt(t)}))}catch{}}function Ut(e,t){let n=(n,r)=>{let i=document.createElement(`div`);return i.className=r,i.dataset.nriDetailResize=n,i.addEventListener(`pointerdown`,r=>{if(r.button!==0)return;r.preventDefault(),r.stopPropagation();let a=r.clientY,o=e(),s=r.pointerId;try{i.setPointerCapture(s)}catch{}let c=e=>{let r=n===`top`?a-e.clientY:e.clientY-a;t(Bt(o+r))},l=()=>{window.removeEventListener(`pointermove`,c),window.removeEventListener(`pointerup`,l),window.removeEventListener(`pointercancel`,l),document.body.style.removeProperty(`cursor`),document.body.style.removeProperty(`user-select`);try{i.releasePointerCapture(s)}catch{}Ht(e())};document.body.style.cursor=`ns-resize`,document.body.style.userSelect=`none`,window.addEventListener(`pointermove`,c),window.addEventListener(`pointerup`,l),window.addEventListener(`pointercancel`,l)}),i};return{top:n(`top`,`nri-detail-resize nri-detail-resize-t`),bottom:n(`bottom`,`nri-detail-resize nri-detail-resize-b`)}}let Wt=e=>e===`redacted`||e===`raw`;function Gt(){try{let t=s(e.copyModeStorageKey);if(t===null)return e.copyModeDefault;let n=JSON.parse(t);if(typeof n==`object`&&n&&Wt(n.mode))return n.mode;if(Wt(n))return n}catch{}return e.copyModeDefault}function Kt(t){try{c(e.copyModeStorageKey,JSON.stringify({mode:t}))}catch{}}function qt(e){if(e!==``)return new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),`gi`)}function Jt(e,t){return Array.from(e.matchAll(t),e=>[e.index,e.index+e[0].length])}function Yt(e){let t=e.parentElement;for(;t!==null&&t.tagName===`SPAN`;)t=t.parentElement;return t}function Xt(e,t,n,r=1/0){let i=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(e){return e instanceof Element?e instanceof HTMLElement&&e.hidden||e.matches(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP:NodeFilter.FILTER_ACCEPT}}),a=[],o=null,s=[],c=()=>{if(s.length===0)return;let e=s.map(e=>e.data).join(``);for(let[n,i]of Jt(e,t)){if(a.length>=r)break;let e=Zt(s,n,!1),t=Zt(s,i,!0);if(e===void 0||t===void 0)continue;let o=document.createRange();o.setStart(e[0],e[1]),o.setEnd(t[0],t[1]),a.push(o)}s=[]};for(let e=i.nextNode();e!==null;e=i.nextNode()){if(!(e instanceof Text)||e.length===0)continue;let t=Yt(e);t!==o&&(c(),o=t),s.push(e)}return c(),a}function Zt(e,t,n){let r=t;for(let t of e){if(n?r<=t.length:r<t.length)return[t,r];r-=t.length}}function Qt(e,t){let n=t.getBoundingClientRect(),r=e.getBoundingClientRect();(n.top<r.top||n.bottom>r.bottom)&&(e.scrollTop+=n.top-r.top-(r.height-n.height)/2),(n.left<r.left||n.right>r.right)&&(e.scrollLeft+=n.left-r.left-(r.width-n.width)/2)}let $t=/* @__PURE__ */ new WeakMap,en=/* @__PURE__ */ new WeakMap;function B(e,t){let n=document.createElement(`span`);return n.className=e,n.textContent=t,n}function tn(e){if(e===null)return[`nri-json-null`,`null`];switch(typeof e){case`string`:return[`nri-json-string`,JSON.stringify(e)];case`number`:case`bigint`:return[`nri-json-number`,String(e)];case`boolean`:return[`nri-json-boolean`,String(e)];default:return[`nri-json-null`,typeof e]}}function nn(e){return e===void 0?[]:[B(`nri-json-key`,JSON.stringify(e)),B(`nri-json-punct`,`: `)]}function rn(e){return e===void 0?``:`${JSON.stringify(e)}: `}function an(e){if(typeof e==`object`&&e)return Array.isArray(e)?e.map((e,t)=>[String(t),e]):Object.entries(e)}function on(e){return Array.isArray(e)?[`[`,`]`]:[`{`,`}`]}function sn(e,t,n,r){let i=r?``:`,`,a=an(t);if(a===void 0){let n=document.createElement(`div`);return n.className=`nri-json-line`,n.append(...nn(e),B(...tn(t)),B(`nri-json-punct`,i)),n}let o=Array.isArray(t),[s,c]=on(t);if(a.length===0){let t=document.createElement(`div`);return t.className=`nri-json-line`,t.append(...nn(e),B(`nri-json-punct`,`${s}${c}${i}`)),t}let l=document.createElement(`div`),u=document.createElement(`div`);u.className=`nri-json-line nri-json-toggle`;let d=document.createElement(`span`);d.className=`nri-json-chevron`,d.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;let f=o?`item`:`key`,p=document.createElement(`span`);p.className=`nri-json-tail`,p.append(B(`nri-json-summary`,g(`${a.length} ${f}${a.length===1?``:`s`}`,`${a.length} ${f===`key`?`个字段`:`项`}`)),B(`nri-json-punct`,`${c}${i}`)),u.append(d,...nn(e),B(`nri-json-punct`,s),p);let m=document.createElement(`div`);m.className=`nri-json-children`;let h=document.createElement(`div`);h.className=`nri-json-line`,h.appendChild(B(`nri-json-punct`,`${c}${i}`));let _=0,v,y=()=>{let e=Math.min(a.length,_+200),t=document.createDocumentFragment();a.slice(_,e).forEach(([e,r],i)=>{let s=_+i;t.appendChild(sn(o?void 0:e,r,n+1,s===a.length-1))}),_=e,v?.remove(),m.appendChild(t),_<a.length&&(v=document.createElement(`button`),v.type=`button`,v.className=`nri-json-more`,v.textContent=g(`Show More (${a.length-_} remaining)`,`显示更多（还有 ${a.length-_} 项）`),v.addEventListener(`click`,y),m.appendChild(v))},b=e=>{e&&_===0&&y(),l.classList.toggle(`nri-json-open`,e),p.hidden=e,m.hidden=!e,h.hidden=!e};return u.addEventListener(`click`,()=>{(window.getSelection()?.toString()??``)===``&&b(!l.classList.contains(`nri-json-open`))}),$t.set(l,{header:u,footer:h,revealChild:e=>{for(b(!0);_<=e&&_<a.length;)y();let t=m.children.item(e);return t instanceof HTMLElement?t:void 0}}),l.append(u,m,h),b(n<2),l}function cn(e){if(typeof e==`string`){let t=document.createElement(`pre`);return t.className=`nri-source`,t.textContent=e,t}let t=document.createElement(`div`);return t.className=`nri-json`,t.appendChild(sn(void 0,e,0,!0)),en.set(t,e),t}function ln(e,t,n){let r=[],i=(e,i,a)=>{let o=Math.min(Jt(e,t).length,n-r.length);for(let e=0;e<o;e++)r.push({path:i,part:a,occurrence:e})},a=(e,t,o,s)=>{if(r.length>=n)return;let c=o?``:`,`,l=an(t);if(l===void 0){i(`${rn(e)}${tn(t)[1]}${c}`,s,`line`);return}let[u,d]=on(t);if(l.length===0){i(`${rn(e)}${u}${d}${c}`,s,`line`);return}i(`${rn(e)}${u}`,s,`header`);let f=Array.isArray(t);l.forEach(([e,t],n)=>{a(f?void 0:e,t,n===l.length-1,[...s,n])}),i(`${d}${c}`,s,`footer`)};return a(void 0,e,!0,[]),r}function un(e,t,n){if(e instanceof HTMLElement&&en.has(e))return ln(en.get(e),t,n)}function dn(e,{path:t,part:n}){let r=e.firstElementChild;for(let e of t)r=(r instanceof HTMLElement?$t.get(r):void 0)?.revealChild(e)??null;if(!(r instanceof HTMLElement))return;if(n===`line`)return r;let i=$t.get(r);if(i!==void 0)return n===`header`?i.header:(i.revealChild(0),i.footer)}function fn(e,t,n){if(e.length===0)return;let r=e.length-1;if(n===`first`)return e[0];if(n===`last`)return e[r];let i=t===void 0?-1:e.indexOf(t);return i<0?n===`next`?e[0]:e[r]:e[n===`next`?Math.min(r,i+1):Math.max(0,i-1)]}function pn(e,t){return(V()?e.metaKey:e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(V()?!e.ctrlKey:!e.metaKey)&&e.key.toLowerCase()===t}function V(){if(typeof navigator>`u`)return!1;let e=navigator.userAgentData?.platform??navigator.platform;return/mac|iphone|ipad/i.test(e)}function H(e){return V()?`⌘${e.toUpperCase()}`:`Ctrl+${e.toUpperCase()}`}let mn={ids:/* @__PURE__ */ new Set,focusId:void 0,anchorId:void 0};function hn(e){return e===void 0?mn:{ids:/* @__PURE__ */ new Set([e]),focusId:e,anchorId:e}}function gn(e,t){let n=new Set(e.ids);if(!n.delete(t))return n.add(t),{ids:n,focusId:t,anchorId:t};let r=Array.from(n),i=e.focusId===t?r.at(-1):e.focusId;return{ids:n,focusId:i,anchorId:i}}function _n(e,t,n){if(n===void 0)return t;let r=e.indexOf(n);if(r<0)return t;let i=t.anchorId??t.focusId??n,a=e.indexOf(i);if(a<0)return hn(n);let[o,s]=a<=r?[a,r]:[r,a];return{ids:new Set(e.slice(o,s+1)),focusId:n,anchorId:i}}function vn(e,t){if(e.length===0)return mn;let n=t.focusId!==void 0&&e.includes(t.focusId)?t.focusId:e[0];return{ids:new Set(e),focusId:n,anchorId:n}}function yn(e,t){let n=new Set(e),r=new Set(Array.from(t.ids).filter(e=>n.has(e)));if(r.size===t.ids.size)return t;if(r.size===0)return mn;let i=t.focusId!==void 0&&r.has(t.focusId)?t.focusId:Array.from(r).at(-1);return{ids:r,focusId:i,anchorId:t.anchorId!==void 0&&n.has(t.anchorId)?t.anchorId:i}}function bn(){try{let t=localStorage.getItem(e.panelCollapsedStorageKey);if(t!==null){let e=JSON.parse(t);if(typeof e==`object`&&e&&typeof e.collapsed==`boolean`)return e.collapsed;if(typeof e==`boolean`)return e}let n=localStorage.getItem(e.panelModeStorageKey);if(n!==null){let e=JSON.parse(n);if(typeof e==`object`&&e&&typeof e.collapsed==`boolean`)return e.collapsed}}catch{}return e.panelDefaultCollapsed}function xn(t){try{localStorage.setItem(e.panelCollapsedStorageKey,JSON.stringify({collapsed:t}))}catch{}}let Sn=e=>typeof e==`number`&&Number.isFinite(e);function Cn(t,n){let r=e.panelMinBottom,i=Math.max(r,window.innerHeight-Math.max(1,n)-e.panelMinBottom);return Math.min(i,Math.max(r,Math.round(t)))}function wn(t){let n=e.panelDefaultBottom;try{let r=s(e.panelOffsetStorageKey);if(r===null)return Cn(n,t);let i=JSON.parse(r);return typeof i!=`object`||!i||!Sn(i.bottom)?Sn(i)?Cn(i,t):Cn(n,t):Cn(i.bottom,t)}catch{return Cn(n,t)}}function U(t,n){try{c(e.panelOffsetStorageKey,JSON.stringify({bottom:Cn(t,n)}))}catch{}}function Tn(e,t,n,r){let i=!1;e.addEventListener(`click`,e=>{i&&(i=!1,e.preventDefault(),e.stopImmediatePropagation())},!0),e.addEventListener(`pointerdown`,a=>{if(a.button!==0)return;let o=a.clientY,s=n(),c=!1,l=n=>{let a=o-n.clientY;if(!c){if(Math.abs(a)<4)return;c=!0,i=!0,e.setPointerCapture(n.pointerId),document.body.style.userSelect=`none`,document.body.style.cursor=`ns-resize`}r(Cn(s+a,t()))},u=r=>{if(window.removeEventListener(`pointermove`,l),window.removeEventListener(`pointerup`,u),window.removeEventListener(`pointercancel`,u),document.body.style.removeProperty(`user-select`),document.body.style.removeProperty(`cursor`),c){try{e.releasePointerCapture(r.pointerId)}catch{}U(n(),t()),window.setTimeout(()=>{i=!1},0)}};window.addEventListener(`pointermove`,l),window.addEventListener(`pointerup`,u),window.addEventListener(`pointercancel`,u)})}let En=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function Dn(t){let n=Math.max(e.panelMinWidth,window.innerWidth-32),r=Math.max(e.panelMinHeight,window.innerHeight-80);return{width:Math.min(n,Math.max(e.panelMinWidth,Math.round(t.width))),height:Math.min(r,Math.max(e.panelMinHeight,Math.round(t.height)))}}function On(){let t={width:e.panelDefaultWidth,height:e.panelDefaultHeight};try{let n=s(e.panelSizeStorageKey);if(n===null)return Dn(t);let r=JSON.parse(n);return typeof r!=`object`||!r||!En(r.width)||!En(r.height)?Dn(t):Dn({width:r.width,height:r.height})}catch{return Dn(t)}}function kn(t){try{c(e.panelSizeStorageKey,JSON.stringify(Dn(t)))}catch{}}function An(e,t,n){let r=(e,r)=>{let i=document.createElement(`div`);return i.className=r,i.dataset.nriResize=e,i.addEventListener(`pointerdown`,r=>{if(r.button!==0)return;r.preventDefault(),r.stopPropagation();let i=t(),a={edge:e,startX:r.clientX,startY:r.clientY,startWidth:i.width,startHeight:i.height},o=t=>{let r=a.startX-t.clientX,i=a.startY-t.clientY;n(Dn({width:e===`top`?a.startWidth:a.startWidth+r,height:e===`left`?a.startHeight:a.startHeight+i}))},s=()=>{window.removeEventListener(`pointermove`,o),window.removeEventListener(`pointerup`,s),window.removeEventListener(`pointercancel`,s),document.body.style.removeProperty(`cursor`),document.body.style.removeProperty(`user-select`),kn(t())};document.body.style.cursor=e===`left`?`ew-resize`:e===`top`?`ns-resize`:`nwse-resize`,document.body.style.userSelect=`none`,window.addEventListener(`pointermove`,o),window.addEventListener(`pointerup`,s),window.addEventListener(`pointercancel`,s)}),i};e.append(r(`left`,`nri-resize nri-resize-l`),r(`top`,`nri-resize nri-resize-t`),r(`top-left`,`nri-resize nri-resize-tl`))}let W=e=>e===`dark`||e===`light`||e===`system`;function jn(){try{let t=s(e.panelThemeStorageKey);if(t===null)return e.panelDefaultTheme;let n=JSON.parse(t);return typeof n==`object`&&n&&W(n.theme)?n.theme:W(n)?n:e.panelDefaultTheme}catch{return e.panelDefaultTheme}}function Mn(t){try{c(e.panelThemeStorageKey,JSON.stringify({theme:t}))}catch{}}function Nn(e){return e===`dark`||e===`light`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`}let G=e=>e===`vscode`||e===`macos`;function Pn(){try{let t=s(e.panelPaletteStorageKey);if(t===null)return e.panelDefaultPalette;let n=JSON.parse(t),r=typeof n==`object`&&n?n.palette:n;return G(r)?r:e.panelDefaultPalette}catch{return e.panelDefaultPalette}}function Fn(t){try{c(e.panelPaletteStorageKey,JSON.stringify({palette:t}))}catch{}}let In=[{value:`json`,label:`JSON`,title:`JSON`},{value:`doc`,label:`Doc`,title:`HTML and XML documents`},{value:`text`,label:`Text`,title:`Plain text, CSV, and event streams`},{value:`js`,label:`JS`,title:`JavaScript`},{value:`css`,label:`CSS`,title:`Stylesheets`},{value:`img`,label:`Img`,title:`Images`},{value:`media`,label:`Media`,title:`Audio and video`},{value:`font`,label:`Font`,title:`Fonts`},{value:`other`,label:`Other`,title:`Binary, empty, pending, and failed responses`}],K=[[/\.json$/,`json`],[/\.(html?|xhtml|xml)$/,`doc`],[/\.(txt|csv|md)$/,`text`],[/\.(m?js|cjs)$/,`js`],[/\.css$/,`css`],[/\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/,`img`],[/\.(mp4|webm|ogg|mp3|wav|m4a|aac|flac|m3u8|mpd)$/,`media`],[/\.(woff2?|ttf|otf|eot)$/,`font`]];function Ln(e){if(e!==void 0){for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.split(`;`)[0].trim().toLowerCase()}}function Rn(e){if(e.includes(`json`))return`json`;if(e.includes(`javascript`)||e.includes(`ecmascript`))return`js`;if(e===`text/css`)return`css`;if(e.startsWith(`image/`))return`img`;if(e.startsWith(`audio/`)||e.startsWith(`video/`)||e.includes(`mpegurl`)||e===`application/dash+xml`)return`media`;if(e.startsWith(`font/`)||e.includes(`font`))return`font`;if(e===`text/html`||e.includes(`xml`))return`doc`;if(e.startsWith(`text/`))return`text`}function zn(e){let t;try{t=new URL(e,`http://localhost/`).pathname.toLowerCase()}catch{return}return K.find(([e])=>e.test(t))?.[1]}function Bn(e){let t=e.responseBody;if(typeof t==`object`&&t)return`json`;let n=Ln(e.responseHeaders);return(n===void 0?void 0:Rn(n))??zn(e.url)??`other`}function Vn(e,t){return t.getBoundingClientRect().top-e.getBoundingClientRect().top+e.scrollTop}function Hn(e){let t=e.scrollTop;for(let n of e.children){if(!(n instanceof HTMLElement))continue;let r=n.dataset.recordId;if(r===void 0)continue;let i=Vn(e,n);if(i+n.offsetHeight>t)return{id:r,top:i}}return null}function Un(e){let t=e.closest(`.nri-item`);return t instanceof HTMLElement?t.dataset.recordId:void 0}function Wn(e){let t=/* @__PURE__ */ new Map;for(let n of e.querySelectorAll(`.nri-detail-body`)){let e=Un(n);e!==void 0&&t.set(e,{top:n.scrollTop,left:n.scrollLeft})}return t}function Gn(e,t){for(let n of e.querySelectorAll(`.nri-detail-body`)){let e=Un(n);if(e===void 0)continue;let r=t.get(e);r!==void 0&&(n.scrollTop=r.top,n.scrollLeft=r.left)}}function Kn(e,t){let n=e.scrollTop,r=Hn(e),i=Wn(e);if(t(),Gn(e,i),r===null){e.scrollTop=n;return}let a=Array.from(e.children).find(e=>e instanceof HTMLElement&&e.dataset.recordId===r.id);e.scrollTop=a instanceof HTMLElement?n+(Vn(e,a)-r.top):n}function qn(e){let t=e.trim().charAt(0);return t===`{`||t===`[`}function Jn(e){if(!qn(e))return``;try{return JSON.parse(e.trim()),``}catch(e){return e instanceof Error?e.message:String(e)}}let Yn=[[`quote`,`quote`,`quotes`,`引号`],[`comma`,`missing comma`,`missing commas`,`补逗号`],[`extra`,`extra comma`,`extra commas`,`去掉多余的逗号`],[`bracket`,`bracket`,`brackets`,`补括号`],[`colon`,`colon`,`colons`,`补冒号`],[`other`,`other fix`,`other fixes`,`其它`]];function Xn(e){let t=Yn.filter(([t])=>(e[t]??0)>0);return g(t.map(([t,n,r])=>`${e[t]} ${e[t]===1?n:r}`).join(`, `),t.map(([t,,,n])=>`${n} ${e[t]} 处`).join(`、`))}let Zn={'"':`"`,"\\":`\\`,"/":`/`,b:`\b`,f:`\f`,n:`
`,r:`\r`,t:`	`,"'":`'`};function Qn(e){return e===`"`?1:e===`“`||e===`”`?2:e===`'`?3:e===`‘`||e===`’`?4:0}function $n(e){let t=e.length,n={},r=0;function i(e){n[e]=(n[e]??0)+1}function a(){for(;;){for(;r<t&&/\s/.test(e[r]);)r++;if(e[r]===`/`&&e[r+1]===`/`){for(;r<t&&e[r]!==`
`;)r++;i(`other`)}else if(e[r]===`/`&&e[r+1]===`*`){let n=e.indexOf(`*/`,r+2);r=n<0?t:n+2,i(`other`)}else return}}function o(){let n=Qn(e[r]);e[r]!==`"`&&i(`quote`),r++;let a=``;for(;;){let o=e[r];if(r>=t||o===`
`||o===`\r`){let n=r>=t?/[\s}\],]/:/[ \t,]/,o=r-1;for(;o>=0&&n.test(e[o]);)o--;return a=a.slice(0,Math.max(0,a.length-(r-1-o))),r=o+1,i(`quote`),a}let s=Qn(o);if(s!==0&&(s===n||s===n-1&&(n===2||n===4)))return r++,a;if(o===`\\`){let t=e[r+1],n=e.slice(r+2,r+6);if(t===`u`&&/^[0-9a-fA-F]{4}$/.test(n)){a+=String.fromCharCode(parseInt(n,16)),r+=6;continue}if(t!==void 0&&Object.prototype.hasOwnProperty.call(Zn,t)){a+=Zn[t],r+=2;continue}a+=t??``,r+=2,i(`other`)}else a+=o,r++}}function s(){let n=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=[ \t])/.exec(e.slice(r,r+64));if(n!==null){let e=n[0];return r+=e.length,e===`true`||e===`false`?e===`true`:e===`null`?null:Number(e)}let a=r;for(;r<t&&!/[,\]}\n\r"]/.test(e[r]);)r++;let o=e.slice(a,r).trim();if(o===``)throw Error(`empty value`);if(e[r]===`"`&&/^"[ \t]*([,}\]\n\r]|$)/.test(e.slice(r,r+40)))return r++,i(`quote`),o;if(o===`true`||o===`false`)return o===`true`;if(o===`null`)return null;if(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(o))return Number(o);let s=o.toLowerCase();return s===`true`||s===`false`?(i(`other`),s===`true`):s===`null`||s===`none`||s===`nil`||s===`undefined`?(i(`other`),null):/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(o)?(i(`other`),Number(o)):(i(`quote`),o)}function c(){let n=r;for(;r<t&&!/[:=\n\r,}\]]/.test(e[r]);)r++;return e.slice(n,r).trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,``)}function l(t){if(t>200)throw Error(`too deep`);a();let n=e[r];return n===`{`?u(t):n===`[`?d(t):Qn(n)===0?s():o()}function u(n){let s={};for(r++;;){let u=r;if(a(),r>=t)return i(`bracket`),s;let d=e[r];if(d===`}`)return r++,s;if(d===`]`)return i(`bracket`),s;if(d===`,`){r++,i(`extra`);continue}let f;if(Qn(d)!==0)f=o();else{if(f=c(),f===``){r++,i(`other`);continue}i(`quote`)}a(),e[r]===`:`?r++:(e[r]===`=`&&(r+=e[r+1]===`>`?2:1),i(`colon`)),a();let p;r>=t||e[r]===`,`||e[r]===`}`||e[r]===`]`?(p=null,i(`other`)):p=l(n+1),Object.defineProperty(s,f,{value:p,enumerable:!0,writable:!0,configurable:!0}),a(),e[r]===`,`?(r++,a(),(e[r]===`}`||r>=t)&&i(`extra`)):r<t&&e[r]!==`}`&&e[r]!==`]`&&i(`comma`),r===u&&r++}}function d(n){let o=[];for(r++;;){let s=r;if(a(),r>=t)return i(`bracket`),o;let c=e[r];if(c===`]`)return r++,o;if(c===`}`)return i(`bracket`),o;c===`,`?(r++,i(`extra`)):c===`:`?(r++,i(`other`)):(o.push(l(n+1)),a(),e[r]===`,`?(r++,a(),(e[r]===`]`||r>=t)&&i(`extra`)):r<t&&e[r]!==`]`&&e[r]!==`}`&&i(`comma`),r===s&&r++)}}let f;try{if(a(),e[r]!==`{`&&e[r]!==`[`)return;for(f=l(0),a();r<t&&/[\]}\s,;]/.test(e[r]);)/\s/.test(e[r])||i(`other`),r++;if(r<t)return}catch{return}return{text:JSON.stringify(f,null,2),fixes:n,summary:Xn(n)}}function er(e){let t=e.trim();if(!qn(t))return{error:g(`The body is not JSON, so there is nothing to format`,`响应体不是 JSON，没有可以排版的`)};try{return{text:JSON.stringify(JSON.parse(t),null,2)}}catch{let e=$n(t);return e===void 0?{error:g(`This JSON cannot be repaired automatically; fix it by hand`,`这段 JSON 自动修不了，得照着提示手动改`)}:{text:e.text,fixed:e.summary}}}function tr(e){try{return JSON.stringify(JSON.parse(e),null,2)}catch{return e}}function nr(e){if(e===void 0)return``;if(e!==`[unreadable response body]`){if(typeof e==`string`)return tr(e);try{return JSON.stringify(e,null,2)}catch{return}}}function rr(e){let t=e.mock===void 0?e:e.mock.real;if(t===void 0||t.status===void 0||t.status===0)return;let n=nr(t.responseBody);return n===void 0?void 0:{status:t.status,body:n}}function ir(e,t){for(let n of e){if(!Ne(t,n.method,n.url))continue;let e=rr(n);if(e!==void 0)return e}}function ar(e,t){try{let n=new URL(e,t);return`${n.origin===t?``:n.origin}${n.pathname}`}catch{return e}}function or({record:e,records:t,pageOrigin:n}){let r=e.method.toUpperCase(),i=ar(e.url,n),a={method:r,match:i},o=rr(e)??t.map(rr).find((e,a)=>e!==void 0&&t[a].method.toUpperCase()===r&&ar(t[a].url,n)===i);return o!==void 0&&(a.status=o.status,a.body=o.body,a.orig=o),a}function sr(e,t){let n=t===`}`?`{`:`[`,r=0,i=!1;for(let a=0;a<e.length;a++){let o=e[a];i?o===`\\`?a++:(o===`"`||o===`
`)&&(i=!1):o===`"`?i=!0:o===n?r++:o===t&&r--}return r<=0}function cr({value:e,start:t,end:n},{key:r,shiftKey:i}){if(e.trim()!==``&&!/^\s*[[{]/.test(e))return;let a=t!==n,o=e.charAt(t-1),s=e.charAt(n),c=e.slice(e.lastIndexOf(`
`,t-1)+1,t),l=(c.replace(/\\./g,``).match(/"/g)??[]).length%2==1,u=s===``||/[\s,\]}:]/.test(s);if(r===`Tab`&&!i)return{kind:`insert`,text:`  `};if(r===`Enter`&&!i){let e=/^[ \t]*/.exec(c)?.[0]??``,t=/[[{][ \t]*$/.test(c),n=t&&!a&&(s===`}`||s===`]`);return{kind:`insert`,text:`\n${e}${t?`  `:``}${n?`\n${e}`:``}`,caretBack:n?e.length+1:void 0}}if(r===`Backspace`){let e=o+s;return!a&&(e===`""`||e===`{}`||e===`[]`)?{kind:`insert`,text:``,select:[t-1,t+1]}:void 0}if(r===`"`)return o===`\\`?void 0:a?{kind:`insert`,text:`"${e.slice(t,n)}"`}:l?s===`"`?{kind:`move`,to:t+1}:void 0:u?{kind:`insert`,text:`""`,caretBack:1}:void 0;if(r===`{`||r===`[`){if(l)return;let i=r===`{`?`}`:`]`;return a?{kind:`insert`,text:`${r}${e.slice(t,n)}${i}`}:u?{kind:`insert`,text:`${r}${i}`,caretBack:1}:void 0}if((r===`}`||r===`]`)&&!a&&s===r&&!l&&sr(e,r))return{kind:`move`,to:t+1}}function lr(){let e=g(`the body becomes an error payload`,`响应体换成对应的报错内容`);return[{label:`500`,status:500,title:g(`Internal Server Error; ${e}`,`服务器内部错误，${e}`)},{label:`502`,status:502,title:g(`Bad Gateway; ${e}`,`网关错误，${e}`)},{label:`504`,status:504,title:g(`Gateway Timeout; ${e}`,`网关超时，${e}`)},{label:`401`,status:401,title:g(`Unauthorized or session expired; ${e}`,`未登录或登录失效，${e}`)},{label:`403`,status:403,title:g(`Forbidden; ${e}`,`没有权限，${e}`)},{label:g(`Offline`,`断网`),status:0,title:g(`Network error: the request never reaches the server`,`网络错误：请求发不出去`)},{label:g(`Slow 3s`,`慢 3 秒`),delay:3e3,title:g(`Keep everything else and respond after 3 seconds`,`其它不变，等 3 秒再返回`)},{label:g(`Empty list`,`空列表`),empty:!0,title:g(`Respond 200 with the lists in the body emptied (needs the captured response)`,`返回 200，把响应体里的列表清空（需要先带入真实返回）`)},{label:g(`Never respond`,`不返回`),hang:!0,title:g(`Leave the request pending to check loading states and the page's own timeout`,`请求一直挂着：看加载中的样子和前端自己的超时处理`)}]}function ur(e,t){let n=!1;try{let t=JSON.parse(e);n=typeof t==`object`&&!!t&&typeof t.code==`string`}catch{}let r=ve(t);return JSON.stringify({code:n?String(t):t,message:`${r===``?`Error`:r} (mock)`},null,2)}let dr=/^(total|count|totalCount|totalElements|totalPages)$/i;function fr(e){let t;try{t=JSON.parse(e)}catch{return}if(Array.isArray(t))return`[]`;if(typeof t!=`object`||!t)return;let n=0;function r(e,t){for(let i of Object.keys(e)){let a=e[i];Array.isArray(a)?(e[i]=[],n+=1):typeof a==`object`&&a?t<2&&r(a,t+1):typeof a==`number`&&dr.test(i)&&(e[i]=0)}}return r(t,1),n>0?JSON.stringify(t,null,2):void 0}function pr(e,t){if(t.hang===!0)return{rule:{...e,mode:`hang`}};let n={...e};if(t.empty===!0){let t=fr(e.body);if(t===void 0)return{error:g(`No list found in the response body. Create the rule from a captured request, then use Empty list.`,`响应体里没找到列表。先从抓到的请求建规则，再点「空列表」。`)};n.status=200,n.body=t}return n.mode===`hang`&&(n.mode=`block`),t.status!==void 0&&(n.status=t.status,t.status>=400&&(n.body=ur(e.body,t.status))),t.delay!==void 0&&(n.delay=t.delay),{rule:n}}function mr(e,t){let n=e.orig??t;return n===void 0?{error:g(`No original response for this request yet. Disable the rule, let the page make the real request once, then reset.`,`还没有这个接口的真实返回。先取消勾选这条规则，让页面真实请求一次，再点「复原」。`)}:{rule:{...e,status:n.status,body:n.body,mode:`block`,delay:0,orig:n}}}function hr(){return[{value:`block`,label:g(`Block`,`拦截`),title:g(`Not sent to the server; the page gets the rule's response`,`不发到服务器，页面直接拿到规则的返回`)},{value:`rewrite`,label:g(`Pass through`,`放行`),title:g(`Really sent and executed; only the response the page sees is replaced`,`真的发出并执行，只把页面看到的返回换掉`)},{value:`hang`,label:g(`Hang`,`挂起`),title:g(`Not sent and never answered`,`不发，也一直不返回`)}]}function q(e){return e===`rewrite`?g(`pass-through`,`放行`):e===`hang`?g(`hang`,`挂起`):g(`block`,`拦截`)}function gr(e){let t=e;return`
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
        /* 顶栏和请求列表的筛选栏一样：同样的内边距和控件高度 */
        ${t} .nri-rules-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${t} .nri-rules-pause {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            white-space: nowrap;
        }
        ${t} .nri-rules-pause.nri-paused {
            color: var(--nri-orange);
            font-weight: 600;
        }
        ${t} .nri-rules-hint {
            padding: 0 12px 6px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
            flex-shrink: 0;
        }
        /* 列表区和请求列表同底色、同分隔线、同滚动条 */
        ${t} .nri-rules-list {
            flex: 1;
            min-height: 44px;
            overflow: auto;
            padding: 0 12px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
            background: var(--nri-sidebar);
        }
        ${t} .nri-rules-list::-webkit-scrollbar,
        ${t} textarea.nri-rule-body::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ${t} .nri-rules-list::-webkit-scrollbar-track,
        ${t} .nri-rules-list::-webkit-scrollbar-corner,
        ${t} textarea.nri-rule-body::-webkit-scrollbar-track,
        ${t} textarea.nri-rule-body::-webkit-scrollbar-corner,
        ${t} textarea.nri-rule-body::-webkit-resizer {
            background: transparent;
        }
        ${t} .nri-rules-list::-webkit-scrollbar-thumb,
        ${t} textarea.nri-rule-body::-webkit-scrollbar-thumb {
            border: 3px solid transparent;
            border-radius: 5px;
            background: var(--nri-scrollbar-thumb) padding-box;
        }
        ${t} .nri-rules-list::-webkit-scrollbar-thumb:hover,
        ${t} textarea.nri-rule-body::-webkit-scrollbar-thumb:hover {
            background-color: var(--nri-scrollbar-thumb-hover);
        }
        ${t} .nri-rules-empty {
            padding: 18px 8px;
            color: var(--nri-label-secondary);
            text-align: center;
            line-height: 1.5;
        }
        /* 一条规则一节，用细分隔线隔开，不再套圆角卡片 */
        ${t} .nri-rule {
            padding: 10px 0;
            border-bottom: var(--nri-hairline) solid var(--nri-separator);
            transition: background-color 0.3s ease;
        }
        ${t} .nri-rule:last-child {
            border-bottom: 0;
        }
        ${t} .nri-rule.nri-rule-off > :not(:first-child) {
            opacity: 0.5;
        }
        /* 定位到某条规则时整节闪一下底色；用阴影铺满左右留白，不改布局 */
        ${t} .nri-rule.nri-rule-flash {
            background: var(--nri-selection-inactive);
            box-shadow:
                -12px 0 0 var(--nri-selection-inactive),
                12px 0 0 var(--nri-selection-inactive);
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
        /* 页面常会给 input / select / textarea 设白底、边框和字号（甚至 !important），面板主题必须优先。
           外观和请求列表的筛选框一致 */
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
        ${t} .nri-field::placeholder {
            color: var(--nri-label-tertiary);
        }
        ${t} .nri-field:focus {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        /* 下拉框、数字框、编辑框的原生部件（下拉列表、滚动条）跟着面板的明暗走 */
        ${t}[data-nri-theme="dark"] .nri-field {
            color-scheme: dark;
        }
        ${t}[data-nri-theme="light"] .nri-field {
            color-scheme: light;
        }
        ${t} select.nri-field {
            -webkit-appearance: none;
            appearance: none;
            padding: 0 20px 0 7px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238c8c8c' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9.5 6 6 6-6'/%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: right 6px center !important;
            background-size: 10px !important;
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
            width: 52px;
            -moz-appearance: textfield;
            appearance: textfield;
            font-variant-numeric: tabular-nums;
        }
        ${t} .nri-field-num::-webkit-inner-spin-button,
        ${t} .nri-field-num::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
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
            margin-bottom: 8px;
        }
        ${t} .nri-chips .nri-text-btn {
            margin-left: auto;
            font-size: 11px;
        }
        ${t} .nri-rule-bodyhead {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }
        ${t} .nri-rule-bodyhead .nri-text-btn {
            margin-left: auto;
            font-size: 11px;
        }
        /* 编辑框和详情区的源码视图一致：等宽 11px、行高 1.5 */
        ${t} textarea.nri-rule-body {
            display: block;
            width: 100%;
            height: 44px;
            min-height: 44px;
            padding: 6px 8px;
            resize: vertical;
            overflow: auto;
            white-space: pre;
            font-family: var(--nri-font-mono) !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            scrollbar-color: var(--nri-scrollbar-thumb) transparent;
            user-select: text;
        }
        ${t} textarea.nri-rule-body.nri-invalid {
            box-shadow: inset 0 0 0 1px var(--nri-red);
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
    `}function J(e,t,n){let r=document.createElement(e);return t!==void 0&&(r.className=t),n!==void 0&&(r.textContent=n),r}function Y(e,t,n,r){let i=J(`button`,e,t);return i.type=`button`,i.title=n,i.addEventListener(`click`,r),i}function _r(e){e.addEventListener(`mousedown`,e=>{e.preventDefault()})}function vr(e,t){let n=J(`button`,`nri-switch`);return n.type=`button`,n.setAttribute(`role`,`switch`),n.title=e,n.setAttribute(`aria-label`,e),_r(n),n.addEventListener(`click`,()=>t(n.getAttribute(`aria-checked`)!==`true`)),{el:n,set:e=>{n.setAttribute(`aria-checked`,e?`true`:`false`)}}}function yr(e,t,n){let r=J(`div`,`nri-segmented`);r.setAttribute(`role`,`group`),r.setAttribute(`aria-label`,e);let i=t.map(e=>{let t=J(`button`,`nri-segment`,e.label);return t.type=`button`,t.dataset.value=e.value,t.title=e.title,_r(t),t.addEventListener(`click`,()=>{t.getAttribute(`aria-pressed`)!==`true`&&n(e.value)}),r.appendChild(t),t});return{el:r,set:e=>{for(let t of i)t.setAttribute(`aria-pressed`,t.dataset.value===e?`true`:`false`)}}}function br(e){return e.times>0?g(`Hits ${e.hits} / ${e.times}${Me(e)?` — spent`:``}`,`已命中 ${e.hits} / ${e.times}${Me(e)?`，已用完`:``}`):g(`Hits ${e.hits}`,`已命中 ${e.hits} 次`)}function xr(e){if(e===`rewrite`)return{text:g(`The request is really sent and executed; only the response the page sees is replaced. Orders, payments and approvals still take effect.`,`请求会真的发到服务器并执行，页面只是看到被改过的返回。下单、支付、审批这类接口照样会真的生效。`),danger:!0};if(e===`hang`)return{text:g(`The request is not sent and never completes: use it to check loading states and the page's own timeout. Status, body and delay are ignored.`,`请求不发到服务器，页面会一直等：用来看加载中的样子和前端自己的超时提示。状态码、响应体、延迟这时都不起作用。`),danger:!1}}function Sr(e,t){if(t.kind===`move`){e.setSelectionRange(t.to,t.to);return}t.select!==void 0&&e.setSelectionRange(t.select[0],t.select[1]);let n=!1;try{n=document.execCommand(t.text===``?`delete`:`insertText`,!1,t.text)}catch{}if(n||(e.setRangeText(t.text,e.selectionStart,e.selectionEnd,`end`),e.dispatchEvent(new Event(`input`))),t.caretBack!==void 0){let n=e.selectionStart-t.caretBack;e.setSelectionRange(n,n)}}function Cr(e,t){let n=e,r=!1;function i(e,t=!1){n={...n,...e},r=t,M(n),r=!1}let a=J(`div`,`nri-rule`),o=vr(g(`Enable this rule`,`启用这条规则`),e=>i({on:e})),s=J(`select`,`nri-field`);s.title=g(`Request method`,`请求方法`);for(let e of De){let t=J(`option`,void 0,e);t.value=e,s.appendChild(t)}s.addEventListener(`change`,()=>i({method:s.value}));let c=J(`input`,`nri-field nri-field-grow`);c.type=`text`,c.spellcheck=!1,c.autocomplete=`off`,c.placeholder=g(`Part of the URL, e.g. /api/transfers; start with re: for a regex`,`URL 里包含的一段，如 /api/transfers；以 re: 开头按正则匹配`),c.title=c.placeholder,c.setAttribute(`aria-label`,g(`URL match`,`URL 匹配`)),c.addEventListener(`input`,()=>i({match:c.value}));let l=Y(`nri-close-btn`,``,g(`Delete this rule`,`删除这条规则`),()=>Je(n.id));l.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12"/><path d="M18 6 6 18"/></svg>`,l.setAttribute(`aria-label`,l.title),_r(l);let u=J(`div`,`nri-rule-row`);u.append(o.el,s,c,l);function d(e,t){let r=J(`input`,`nri-field nri-field-num`);return r.type=`number`,r.min=`0`,r.title=t,r.addEventListener(`change`,()=>{let t=Ae({...n,[e]:r.value})[e];r.value=String(t),i({[e]:t})}),r}let f=d(`status`,g(`HTTP status, 200–599; 0 = network error`,`HTTP 状态码，200–599；0 = 网络错误`)),p=d(`delay`,g(`Wait this many milliseconds before responding`,`等多少毫秒再返回`)),m=d(`times`,g(`Apply at most this many times, then let requests through; 0 = no limit`,`最多命中几次，之后放行；0 = 不限`)),h=yr(g(`Mode`,`模式`),hr(),e=>i({mode:e},!0)),_=J(`span`,`nri-rule-hits`),v=Y(`nri-text-btn`,g(`Reset`,`清零`),g(`Set the hit count back to 0`,`命中次数清零`),()=>i({hits:0})),y=J(`div`,`nri-rule-row`);y.append(J(`span`,`nri-rule-label`,g(`Respond`,`返回`)),f,h.el,_,v);let b=J(`div`,`nri-rule-row`);b.append(J(`span`,`nri-rule-label`,g(`Delay`,`延迟`)),p,J(`span`,`nri-rule-label`,`ms`),J(`span`,`nri-rule-label`,g(`Max hits`,`最多命中`)),m,J(`span`,`nri-rule-label`,g(`(0 = no limit)`,`次（0 = 不限）`)));function ee(e){`error`in e?I(`info`,e.error,4e3):(w.hidden=!0,i(e.rule,!0))}let x=J(`div`,`nri-chips`);x.append(J(`span`,`nri-rule-label`,g(`Presets`,`预设`)));for(let e of lr())x.append(Y(`nri-type-chip`,e.label,e.title,()=>ee(pr(n,e))));x.append(Y(`nri-text-btn`,g(`↺ Reset`,`↺ 复原`),g(`Back to the captured response: restore status and body, block mode, no delay`,`回到真实返回：状态码和响应体恢复，模式回到拦截，延迟清零`),()=>ee(mr(n,t.findRealResponse(n)))));let S=J(`textarea`,`nri-field nri-rule-body`);S.spellcheck=!1,S.placeholder=g(`Response body`,`返回的响应体`),S.setAttribute(`aria-label`,g(`Response body`,`响应体`));let C=J(`div`,`nri-rule-error`),w=J(`div`,`nri-rule-note`);w.hidden=!0;let T=J(`div`,`nri-rule-note`);function te(){let e=n.body.split(`
`).length;S.style.height=`${Math.min(260,Math.max(44,e*16.5+12))}px`}let E=Y(`nri-text-btn`,g(`Auto-fix`,`自动修复`),g(`Add missing quotes, commas and brackets, drop stray commas, then re-indent. Can be undone`,`补上缺的引号、逗号、括号，去掉多余的逗号，再重新排版。可以撤销`),ie);function ne(){let e=Jn(n.body);C.hidden=e===``,C.replaceChildren(...e===``?[]:[g(`The body is not valid JSON, so the page will fail to parse it: ${e}`,`响应体不是合法的 JSON，页面拿到后会解析失败：${e}`),E]),S.classList.toggle(`nri-invalid`,e!==``)}function re(e){S.value=e,i({body:e}),ne(),te()}function ie(){let e=er(n.body);if(`error`in e){I(`info`,e.error,3e3);return}if(e.text===n.body){I(`info`,g(`Already formatted`,`已经是排好版的了`),1500);return}let t=n.body;re(e.text),w.replaceChildren(e.fixed===void 0?g(`Re-indented.`,`已重新排版。`):g(`Fixed ${e.fixed}. Check that the result is what you meant.`,`已自动修复：${e.fixed}。请确认内容是你要的。`),Y(`nri-text-btn`,g(`Undo`,`撤销`),g(`Put the body back the way it was`,`恢复成修改前的样子`),()=>{re(t),w.hidden=!0})),w.hidden=!1}S.addEventListener(`input`,()=>{w.hidden=!0,i({body:S.value}),ne()}),S.addEventListener(`keydown`,e=>{if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;let t=cr({value:S.value,start:S.selectionStart,end:S.selectionEnd},{key:e.key,shiftKey:e.shiftKey});t!==void 0&&(e.preventDefault(),Sr(S,t))});let ae=Y(`nri-text-btn`,g(`Format`,`格式化`),g(`Re-indent the JSON; broken JSON (missing quotes, commas, brackets) is repaired first`,`把 JSON 重新排版；写坏了的（少引号、逗号、括号）会先试着修好`),ie),oe=J(`div`,`nri-rule-bodyhead`);oe.append(J(`span`,`nri-rule-label`,g(`Response body`,`响应体`)),ae),a.append(u,y,b,x,oe,S,C,w,T);function D(e,t){(r||document.activeElement!==e)&&e.value!==t&&(e.value=t)}function se(e){let t=e.body!==S.value;n=e,a.classList.toggle(`nri-rule-off`,!n.on),o.set(n.on),D(s,n.method),D(c,n.match),D(f,String(n.status)),h.set(n.mode),D(p,String(n.delay)),D(m,String(n.times)),D(S,n.body),_.textContent=br(n),_.classList.toggle(`nri-spent`,Me(n));let r=xr(n.mode);T.hidden=r===void 0,T.textContent=r?.text??``,T.classList.toggle(`nri-danger`,r?.danger===!0),t&&S.value===n.body&&(ne(),te())}return S.value=n.body,ne(),te(),se(n),{id:n.id,el:a,sync:se}}function wr(e){let t=J(`div`,`nri-rules`);t.hidden=!0;let n=Y(`nri-push-btn`,g(`+ New Rule`,`+ 新增规则`),g(`Add an empty rule`,`新增一条空规则`),()=>{let e=qe({});v(e.id),m.get(e.id)?.el.querySelector(`input[type="text"]`)?.focus()}),r=g(`Turn every rule off for now; the rules themselves are kept`,`所有规则临时失效，规则本身保留`),i=vr(r,e=>j(e)),a=J(`span`,`nri-rules-pause`),o=J(`span`,void 0,g(`Pause All`,`全部暂停`));o.title=r,o.addEventListener(`click`,()=>j(!Ge())),a.append(o,i.el);let s;function c(){s!==void 0&&(clearTimeout(s),s=void 0),l.textContent=g(`Clear All`,`清空`),l.classList.remove(`nri-danger`)}let l=Y(`nri-text-btn`,g(`Clear All`,`清空`),g(`Delete every rule`,`删除全部规则`),()=>{if(s===void 0){let e=We().length;l.textContent=g(`Click again to delete ${e===1?`the rule`:`all ${e} rules`}`,`再点一次，删除全部 ${e} 条规则`),l.classList.add(`nri-danger`),s=setTimeout(c,3e3)}else c(),Ye()}),u=J(`div`,`nri-rules-bar`);u.append(n,a,J(`span`,`nri-spacer`),l);let d=J(`div`,`nri-rules-hint`,g(`Rule bodies are stored and shown unredacted — the page must receive the real content.`,`规则里的响应体按原文保存和显示，不脱敏——页面要拿到的就是原文。`)),f=J(`div`,`nri-rules-list`),p=J(`div`,`nri-rules-empty`,g(`No rules yet. Select a request and choose Mock, or add a rule by hand.`,`还没有规则。在请求列表里选中一个请求点魔杖按钮，或者手动新增。`));t.append(u,d,f);let m=/* @__PURE__ */ new Map,h=[];function _(){let t=We(),n=t.map(e=>e.id);if(n.length!==h.length||n.some((e,t)=>e!==h.at(t))){for(let e of h)n.includes(e)||m.delete(e);for(let n of t)m.has(n.id)||m.set(n.id,Cr(n,e));h=n;let r=n.flatMap(e=>{let t=m.get(e);return t===void 0?[]:[t.el]});f.replaceChildren(...r.length===0?[p]:r),c()}for(let e of t)m.get(e.id)?.sync(e);let r=Ge();i.set(r),a.classList.toggle(`nri-paused`,r),l.hidden=t.length===0,d.hidden=t.length===0}function v(e){let t=m.get(e);if(t===void 0)return;let n=f.getBoundingClientRect(),r=t.el.getBoundingClientRect();r.top<n.top?f.scrollTop-=n.top-r.top+8:r.bottom>n.bottom&&(f.scrollTop+=Math.min(r.top-n.top-8,r.bottom-n.bottom+8)),t.el.classList.add(`nri-rule-flash`),setTimeout(()=>t.el.classList.remove(`nri-rule-flash`),1200)}return f.replaceChildren(p),_(),{el:t,dispose:Ke(_),reveal:v,focus:()=>{n.focus({preventScroll:!0})}}}let Tr={code:`KeyH`,alt:!1,ctrl:!1,meta:!1,shift:!1},Er=/* @__PURE__ */ new Set([`ShiftLeft`,`ShiftRight`,`ControlLeft`,`ControlRight`,`AltLeft`,`AltRight`,`MetaLeft`,`MetaRight`,`OSLeft`,`OSRight`,`CapsLock`,`Fn`]),Dr=/* @__PURE__ */ new Set([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`Home`,`End`,`Enter`,`NumpadEnter`,`Tab`,`Escape`]),Or=/* @__PURE__ */ new Set([`KeyA`,`KeyC`,`KeyF`,`KeyK`,`KeyV`,`KeyX`,`KeyZ`]),kr={Space:`Space`,Backquote:"`",Minus:`-`,Equal:`=`,BracketLeft:`[`,BracketRight:`]`,Backslash:`\\`,Semicolon:`;`,Quote:`'`,Comma:`,`,Period:`.`,Slash:`/`,ArrowUp:`↑`,ArrowDown:`↓`,ArrowLeft:`←`,ArrowRight:`→`,PageUp:`PgUp`,PageDown:`PgDn`,Insert:`Ins`},Ar=e=>{if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.code==`string`&&t.code!==``&&typeof t.alt==`boolean`&&typeof t.ctrl==`boolean`&&typeof t.meta==`boolean`&&typeof t.shift==`boolean`};function jr(){try{let t=s(e.toggleShortcutStorageKey);if(t===null)return Tr;let n=JSON.parse(t);if(typeof n==`object`&&n&&`shortcut`in n){let e=n.shortcut;if(e===null)return null;if(Ar(e))return e}}catch{}return Tr}function Mr(t){try{c(e.toggleShortcutStorageKey,JSON.stringify({shortcut:t}))}catch{}}function Nr(e,t){return e===null||t===null?e===t:e.code===t.code&&e.alt===t.alt&&e.ctrl===t.ctrl&&e.meta===t.meta&&e.shift===t.shift}function Pr(e){if(!(e.code===``||Er.has(e.code)))return{code:e.code,alt:e.altKey,ctrl:e.ctrlKey,meta:e.metaKey,shift:e.shiftKey}}function Fr(e,t){return e.code===t.code&&e.altKey===t.alt&&e.ctrlKey===t.ctrl&&e.metaKey===t.meta&&e.shiftKey===t.shift}function Ir(e){return!e.alt&&!e.ctrl&&!e.meta}function Lr(e,t){if(Ir(e)&&Dr.has(e.code))return`used to navigate the panel`;let n=t?e.meta:e.ctrl,r=t?e.ctrl:e.meta;if(n&&!r&&!e.alt&&!e.shift&&Or.has(e.code))return`used by the panel or for editing`}function Rr(e){let t=kr[e];if(t!==void 0)return t;let n=/^(?:Key|Digit|Numpad)(.+)$/.exec(e);return n?.[1]===void 0?e:n[1]}function zr(e,t){let n=Rr(e.code);return t?[e.ctrl?`⌃`:``,e.alt?`⌥`:``,e.shift?`⇧`:``,e.meta?`⌘`:``,n].join(``):[e.ctrl?`Ctrl`:``,e.alt?`Alt`:``,e.shift?`Shift`:``,e.meta?`Win`:``,n].filter(e=>e!==``).join(`+`)}let Br=/* @__PURE__ */ new Set([`text`,`search`,`email`,`url`,`tel`,`password`,`number`,`date`,`datetime-local`,`month`,`week`,`time`]);function Vr(e){let t=e.composedPath()[0]??e.target;return t instanceof Element?t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement?!0:t instanceof HTMLInputElement?Br.has(t.type):t instanceof HTMLElement&&t.isContentEditable:!1}let Hr=/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,X=/^\d+$/;function Ur(e){let t=Hr.exec(e.trim());return t===null?null:{major:Number(t[1]),minor:Number(t[2]),patch:Number(t[3]),prerelease:t[4]===void 0?[]:t[4].split(`.`)}}function Wr(e,t){let n=X.test(e),r=X.test(t);return n&&r?Math.sign(Number(e)-Number(t)):n===r?e===t?0:e<t?-1:1:n?-1:1}function Gr(e,t){let n=Ur(e),r=Ur(t);if(n===null||r===null)throw Error(`Invalid version: ${JSON.stringify(n===null?e:t)}`);for(let e of[`major`,`minor`,`patch`])if(n[e]!==r[e])return n[e]<r[e]?-1:1;if(n.prerelease.length===0||r.prerelease.length===0)return Math.sign(r.prerelease.length-n.prerelease.length);let i=Math.min(n.prerelease.length,r.prerelease.length);for(let e=0;e<i;e+=1){let t=Wr(n.prerelease.at(e)??``,r.prerelease.at(e)??``);if(t!==0)return t}return Math.sign(n.prerelease.length-r.prerelease.length)}function Kr({body:e,currentVersion:t}){let n;try{n=JSON.parse(e)}catch{return{status:`failed`,reason:g(`Update manifest is not valid JSON`,`版本清单不是合法的 JSON`)}}let r=typeof n==`object`&&n?n.version:void 0;if(typeof r!=`string`)return{status:`failed`,reason:g(`Update manifest has no version`,`版本清单里没有版本号`)};try{return Gr(r,t)>0?{status:`available`,version:r}:{status:`up-to-date`}}catch{return{status:`failed`,reason:g(`Invalid version ${JSON.stringify(r)}`,`版本号不合法：${JSON.stringify(r)}`)}}}function qr({manifestUrl:e,currentVersion:t}){return new Promise(n=>{typeof GM_xmlhttpRequest==`function`?GM_xmlhttpRequest({method:`GET`,url:e,timeout:1e4,headers:{"Cache-Control":`no-cache`},onload:e=>{e.status===200?n(Kr({body:e.responseText,currentVersion:t})):n({status:`failed`,reason:g(`Update server returned HTTP ${e.status}`,`更新服务器返回了 HTTP ${e.status}`)})},onerror:()=>n({status:`failed`,reason:g(`Could not reach the update server`,`连不上更新服务器`)}),ontimeout:()=>n({status:`failed`,reason:g(`Update check timed out`,`检查更新超时`)})}):n({status:`failed`,reason:g(`Update check is unavailable in this build`,`这个构建不支持检查更新`)})})}function Jr(){try{return s(e.includeBetaStorageKey)===`true`}catch{return!1}}function Yr(t){try{c(e.includeBetaStorageKey,String(t))}catch{}}function Xr(e){return e?`beta`:`latest`}function Zr(e){let t=String(e.getMonth()+1).padStart(2,`0`),n=String(e.getDate()).padStart(2,`0`);return`${e.getFullYear()}-${t}-${n}`}function Qr(t=/* @__PURE__ */ new Date){let n=Zr(t);try{return s(e.betaCheckDateStorageKey)!==n&&(c(e.betaCheckDateStorageKey,n),s(e.betaCheckDateStorageKey)===n)}catch{return!1}}function $r({pointerY:e,targetLeft:t,width:n,height:r,viewportWidth:i,viewportHeight:a}){let o=e+12;o+r>a-4&&(o=e-12-r);let s=Math.min(Math.max(t,4),i-4-n);return{top:Math.max(o,4),left:Math.max(s,4)}}function ei(e,t){return e instanceof Element?e.closest(t):null}function ti(e,t){let n,r,i=[],a=0,o,s=-1/0,c=()=>n!==void 0&&!n.hidden,l=(t,r)=>{n?.isConnected!==!0&&(n=document.createElement(`div`),n.className=`nri-tooltip`,n.setAttribute(`role`,`tooltip`),e.appendChild(n)),n.textContent=r,n.hidden=!1;let{width:i,height:o}=n.getBoundingClientRect(),{top:s,left:c}=$r({pointerY:a,targetLeft:t.getBoundingClientRect().left,width:i,height:o,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight});n.style.top=`${s}px`,n.style.left=`${c}px`},u=()=>{window.clearTimeout(o),o=void 0,c()&&(s=Date.now()),n!==void 0&&(n.hidden=!0)},d=e=>{let t=e.getAttribute(`title`);t!==null&&(e.dataset.nriTooltip=t,e.removeAttribute(`title`),i.includes(e)||i.push(e))},f=()=>{u();for(let e of i){let t=e.dataset.nriTooltip;t!==void 0&&(e.setAttribute(`title`,t),delete e.dataset.nriTooltip)}i=[],r?.classList.remove(`nri-tooltip-active`),r=void 0},p=(t,n)=>{let i=t.getAttribute(`title`)??t.dataset.nriTooltip??``;if(i===``)return;let u=c()||Date.now()-s<200;f(),r=t,a=n,t.classList.add(`nri-tooltip-active`);for(let n=t;n!==null&&e.contains(n);n=n.parentElement)d(n);let p=()=>{o=void 0,r===t&&t.isConnected&&l(t,t.dataset.nriTooltip??i)};u?p():o=window.setTimeout(p,t.matches(`button, .nri-segment, .nri-type-chip, .nri-keycap, label`)?400:1500)},m=e=>{let t=ei(e.target,`[title], .nri-tooltip-active`);t!==null&&t!==r&&p(t,e.clientY)},h=e=>{a=e.clientY;for(let e of i){let t=e.getAttribute(`title`);t!==null&&(d(e),e===r&&n!==void 0&&c()&&(n.textContent=t))}},g=t=>{if(r===void 0||ei(t.target,`.nri-tooltip-active`)!==r||t.relatedTarget instanceof Node&&r.contains(t.relatedTarget))return;f();let n=ei(t.relatedTarget,`[title]`);n!==null&&e.contains(n)&&p(n,t.clientY)},_=()=>{u(),s=-1/0};e.addEventListener(`mouseenter`,m,!0),e.addEventListener(`mousemove`,h,!0),e.addEventListener(`mouseover`,h,!0),e.addEventListener(`mouseleave`,g,!0),e.addEventListener(`mousedown`,_,!0),e.addEventListener(`scroll`,_,!0),window.addEventListener(`keydown`,_,{capture:!0,signal:t})}let ni={version:`0.0.0`,dev:!0};function ri(){try{if(typeof __NRI_BUILD__==`object`&&__NRI_BUILD__!==null)return __NRI_BUILD__}catch{}return ni}function ii(){let{version:e,dev:t}=ri();return t?`v${e} (dev)`:`v${e}`}function ai(e){return e.replace(/\[([^\]]+)\]\([^)]*\)/g,`$1`).split(/(`[^`]+`|\*\*[^*]+\*\*)/).filter(e=>e!==``).map(e=>e.length>2&&e.startsWith("`")&&e.endsWith("`")?{kind:`code`,text:e.slice(1,-1)}:e.length>4&&e.startsWith(`**`)&&e.endsWith(`**`)?{kind:`strong`,text:e.slice(2,-2)}:{kind:`text`,text:e})}function oi(e,t){try{return Gr(e,t)>0}catch{return!1}}function si(e){let t=Ur(e);return t===null?void 0:`${t.major}.${t.minor}.${t.patch}`}function ci({changelog:e,current:t,since:n}){let r=e.filter(e=>Ur(e.version)!==null&&!oi(e.version,t)&&(n===void 0||oi(e.version,n))),i=new Set(r.filter(e=>Ur(e.version)?.prerelease.length===0).map(e=>e.version));return r.filter(e=>{let t=si(e.version);return t===e.version||t===void 0||!i.has(t)}).sort((e,t)=>Gr(t.version,e.version))}function li({changelog:t,current:n}){let r;try{r=s(e.seenVersionStorageKey)}catch{return}if(r===n)return;try{if(c(e.seenVersionStorageKey,n),s(e.seenVersionStorageKey)!==n)return}catch{return}if(r===null||!oi(n,r))return;let i=ci({changelog:t,current:n,since:r});return i.length>0?{from:r,entries:i}:void 0}let ui=`nri-root`,di=`nri-panel-style`,Z=`#${ui}`,fi={json:{label:`JSON`,title:`JSON`},doc:{label:`文档`,title:`HTML 和 XML 文档`},text:{label:`文本`,title:`纯文本`},js:{label:`JS`,title:`JavaScript`},css:{label:`CSS`,title:`样式表`},img:{label:`图片`,title:`图片`},media:{label:`媒体`,title:`音频和视频`},font:{label:`字体`,title:`字体`},other:{label:`其他`,title:`二进制、空响应、进行中和失败的请求`}},pi=[`body`,`headers`,`request`],mi=`button, svg, .nri-json-tail, .nri-section-title, .nri-empty-hint, .nri-truncated`,hi=1e3;function gi(){if(document.getElementById(di)!==null)return;let t=document.createElement(`style`);t.id=di,t.textContent=`
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
        ${gr(Z)}
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
        `,document.head.appendChild(t)}let Q=(e,t=1.5)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`,_i={clear:Q(`<path d="M4 6.5h16"/><path d="M9 6.5V4.5h6v2"/><path d="M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>`),copy:Q(`<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>`),braces:Q(`<path d="M8.5 3.5h-1A2.5 2.5 0 0 0 5 6v3.5A2.5 2.5 0 0 1 2.5 12 2.5 2.5 0 0 1 5 14.5V18a2.5 2.5 0 0 0 2.5 2.5h1"/><path d="M15.5 3.5h1A2.5 2.5 0 0 1 19 6v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5h-1"/>`),terminal:Q(`<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5"/><path d="M12.5 15h4.5"/>`),tree:Q(`<path d="M4 5h7"/><path d="M8 12h12"/><path d="M8 19h12"/><path d="M6 5v14"/><path d="M6 12h2"/><path d="M6 19h2"/>`),code:Q(`<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13.5 4-3 16"/>`),gear:Q(`<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`),chevronDown:Q(`<path d="m6 9.5 6 6 6-6"/>`,2.2),chevronUp:Q(`<path d="m6 14.5 6-6 6 6"/>`,2.2),search:Q(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>`,2),xmark:Q(`<path d="m6 6 12 12"/><path d="M18 6 6 18"/>`,3.5),mock:Q(`<path d="m4 20 11-11"/><path d="m13.5 7.5 3 3"/><path d="M18 3v3"/><path d="M16.5 4.5h3"/><path d="M20.5 9v2"/><path d="M19.5 10h2"/><path d="M9 3v2"/><path d="M8 4h2"/>`)};function vi(e){e.addEventListener(`mousedown`,e=>{e.preventDefault()})}function $(e,t,n=`nri-btn`){let r=document.createElement(`button`);return r.type=`button`,r.className=n,r.title=t,r.setAttribute(`aria-label`,t),r.innerHTML=_i[e],vi(r),r}function yi(e,t,n){let r=document.createElement(`div`);r.className=`nri-segmented`,r.setAttribute(`role`,`group`),r.setAttribute(`aria-label`,e);let i=t.map(e=>{let t=document.createElement(`button`);return t.type=`button`,t.className=`nri-segment`,t.dataset.value=e.value,t.textContent=e.label,t.title=e.title,vi(t),t.addEventListener(`click`,()=>{t.getAttribute(`aria-pressed`)!==`true`&&n(e.value)}),r.appendChild(t),t});return{el:r,setValue:e=>{for(let t of i)t.setAttribute(`aria-pressed`,t.dataset.value===e?`true`:`false`)}}}function bi(e){let t=/* @__PURE__ */ new Set,n=document.createElement(`div`);n.className=`nri-typebar`,n.setAttribute(`role`,`group`),n.setAttribute(`aria-label`,g(`Response type`,`响应类型`));let r=(e,t)=>{let r=document.createElement(`button`);return r.type=`button`,r.className=`nri-type-chip`,r.textContent=e,r.title=t,vi(r),n.appendChild(r),r},i=r(g(`All`,`全部`),g(`Show all response types`,`显示全部响应类型`));i.addEventListener(`click`,()=>{e(/* @__PURE__ */ new Set)});let a=document.createElement(`span`);a.className=`nri-typebar-sep`,n.appendChild(a);let o=g(`${V()?`⌘`:`Ctrl`}-click to select multiple`,`${V()?`⌘`:`Ctrl`} + 点击可多选`),s=In.map(n=>{let i=fi[n.value],a=r(g(n.label,i.label),g(n.title,i.title));return a.addEventListener(`click`,r=>{if(!(r.metaKey||r.ctrlKey)){e(/* @__PURE__ */ new Set([n.value]));return}let i=new Set(t);i.delete(n.value)||i.add(n.value),e(i)}),{type:n,chip:a}});return{el:n,setValue:e=>{t=e,i.setAttribute(`aria-pressed`,e.size===0?`true`:`false`);for(let{type:t,chip:n}of s)n.setAttribute(`aria-pressed`,e.has(t.value)?`true`:`false`)},setCounts:e=>{for(let{type:t,chip:n}of s){let r=e.get(t.value)??0;n.dataset.empty=r===0?`true`:`false`,n.title=`${t.title} (${r}) · ${o}`}}}}function xi(e){return e.error===void 0?e.status===void 0?`warning`:e.status===0?`error`:e.status<300?`success`:e.status<400?`info`:`error`:`error`}function Si(e){return e.error===void 0?e.status===void 0?`…`:String(e.status):`ERR`}function Ci(e){if(e.error!==void 0)return g(`Error`,`错误`);if(e.status===void 0)return g(`Pending`,`进行中`);if(e.status===0)return g(`0 No Response`,`0 无响应`);let t=ve(e.status);return t===``?String(e.status):`${e.status} ${t}`}function wi(e){return e.error!==void 0||e.status!==void 0&&(e.status===0||e.status>=400)}function Ti(e){return`nri-method nri-method-${e.toUpperCase()}`}function Ei(e,t){let n=new Date(e),r=(e,t=2)=>String(e).padStart(t,`0`),i=`${r(n.getHours())}:${r(n.getMinutes())}:${r(n.getSeconds())}`;return t?`${i}.${r(n.getMilliseconds(),3)}`:i}function Di(e){try{let t=new URL(e,location.href);return`${t.pathname}${t.search}`}catch{return e}}function Oi(e){try{return new URL(e,location.href).href}catch{return e}}function ki(e){return e!=null&&e!==``}async function Ai(e,t){try{await mt(e),I(`success`,t,2e3)}catch(e){console.error(`[NRI] copy failed:`,e),I(`error`,g(`Copy failed`,`复制失败`),2500)}}function ji(e,t,n,r){let i=t.trim().toLowerCase();return i===``&&n===`all`&&r.size===0?e:e.filter(e=>(n===`all`||(n===`failed`?wi(e):e.mock!==void 0))&&(r.size===0||r.has(Bn(e)))&&(i===``||e.url.toLowerCase().includes(i)))}function Mi(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Bn(n);t.set(e,(t.get(e)??0)+1)}return t}function Ni(e,t){let n=document.createElement(`div`);n.className=`nri-placeholder`;let r=document.createElement(`div`);r.className=`nri-placeholder-title`,r.textContent=e;let i=document.createElement(`div`);return i.textContent=t,n.append(r,i),n}function Pi(e){let t=document.createElement(`div`);return t.className=`nri-empty-hint`,t.textContent=e,t}function Fi(e){let t=document.createElement(`h4`);return t.className=`nri-section-title`,t.textContent=e,t}function Ii(e,t){if(e.length===0)return Pi(g(`None`,`无`));let n=t?[...e].sort((e,t)=>e[0].localeCompare(t[0])):e,r=document.createElement(`table`);r.className=`nri-kv`;let i=document.createElement(`tbody`);for(let[e,t]of n){let n=document.createElement(`tr`),r=document.createElement(`td`);r.className=`nri-kv-key`,r.textContent=e;let a=document.createElement(`td`);a.className=`nri-kv-value`,a.textContent=t,n.append(r,a),i.appendChild(n)}return r.appendChild(i),r}function Li(e,t,n){let r=document.createDocumentFragment();if(!ki(e))return r.appendChild(Pi(g(`None`,`无`))),r;if(n===`tree`){let t=typeof e==`string`?gt(e):e;if(typeof t==`object`&&t)return r.appendChild(cn(t)),r}let i=ae(e,t),a=document.createElement(`pre`);if(a.className=`nri-source`,a.textContent=i.text,r.appendChild(a),i.truncated){let e=document.createElement(`div`);e.className=`nri-truncated`,e.textContent=g(`Truncated: ${i.totalChars} characters total`,`已截断：共 ${i.totalChars} 个字符`),r.appendChild(e)}return r}function Ri(e,t,n){let r=document.createDocumentFragment();switch(t){case`body`:e.error===void 0?e.status===void 0?r.appendChild(Pi(g(`Waiting for response…`,`等待响应…`))):r.appendChild(Li(e.responseBody,e.responseHeaders,n)):r.appendChild(Pi(g(`No response: the request failed.`,`没有响应：请求失败了。`)));break;case`headers`:r.appendChild(Ii(Object.entries(e.responseHeaders??{}),!0));break;case`request`:r.append(Fi(g(`Query`,`查询参数`)),Ii(ye(e.url),!1),Fi(g(`Headers`,`请求头`)),Ii(Object.entries(e.requestHeaders??{}),!0),Fi(g(`Body`,`请求体`)),Li(e.requestBody,e.requestHeaders,n))}return r}function zi(e){return`nri-row-${e}`}function Bi(e){let{listEl:t,records:n,emptyTitle:r,emptyHint:i,selectedIds:a,onRowPress:o,onRowContextMenu:s,copyMode:c}=e;if(t.replaceChildren(),n.length===0){t.appendChild(Ni(r,i));return}let l=!1;n.forEach((e,n)=>{if(e.restored===!0&&!l){l=!0;let e=document.createElement(`div`);e.className=`nri-row-separator`,e.textContent=g(`Before reload`,`刷新之前`),e.title=g(`Requests captured before the page was reloaded`,`刷新页面之前抓到的请求`),t.appendChild(e)}let r=D(e,c),i=a.has(e.id),u=document.createElement(`div`);u.className=`nri-row`,u.dataset.recordId=e.id,u.id=zi(e.id),u.title=r.url,u.setAttribute(`role`,`option`),u.setAttribute(`aria-selected`,i?`true`:`false`),u.classList.toggle(`nri-alt`,n%2==1),u.classList.toggle(`nri-selected`,i);let d=document.createElement(`span`);d.className=`nri-row-status nri-tone-${xi(r)}`,d.textContent=Si(r);let f=document.createElement(`span`);f.className=Ti(r.method),f.textContent=r.method.toUpperCase();let p=document.createElement(`span`);p.className=`nri-row-path`,p.textContent=Di(r.url);let m=document.createElement(`span`);m.className=`nri-row-meta`,m.textContent=e.durationMs===void 0?``:`${e.durationMs} ms`;let h=document.createElement(`span`);if(h.className=`nri-row-meta`,h.textContent=Ei(e.startedAt,!1),u.append(d,f,p),e.mock!==void 0){let t=document.createElement(`span`);t.className=`nri-row-mock`,t.textContent=`MOCK`,t.title=g(`Response from a mock rule (${q(e.mock.mode)})`,`返回来自 Mock 规则（${q(e.mock.mode)}）`),u.append(t)}u.append(m,h),u.addEventListener(`mousedown`,t=>{t.button===0&&o(e.id,t)}),u.addEventListener(`contextmenu`,t=>{t.preventDefault(),t.stopPropagation(),s(e,t)}),t.appendChild(u)})}function Vi(e,t){let n=e.getBoundingClientRect(),r=t.getBoundingClientRect();r.top<n.top?e.scrollTop-=n.top-r.top+4:r.bottom>n.bottom&&(e.scrollTop+=r.bottom-n.bottom+4)}function Hi(e){let t=document.documentElement??document.body;t===null?document.addEventListener(`DOMContentLoaded`,()=>{document.documentElement.appendChild(e)},{once:!0}):t.appendChild(e)}function Ui({initialView:t=`requests`,settingsOpen:n=!1}={}){if(document.getElementById(ui)!==null)return;let r=new AbortController,{signal:i}=r,a=[];gi();let o=bn(),s=``,c=`all`,l=/* @__PURE__ */ new Set,u=[],_=[],v=mn,y=`body`,b=`requests`,ee=`tree`,x=On(),S=e.panelDefaultBottom,C=Vt(),w=Gt(),T=document.createElement(`div`);T.id=ui;let te=e=>{S=e,T.style.setProperty(`--nri-panel-bottom`,`${e}px`)},E=document.createElement(`div`);E.className=`nri-panel`,E.setAttribute(`role`,`dialog`),E.setAttribute(`aria-label`,g(`Network Requests`,`网络请求`));let ne=e=>{x=e,E.style.setProperty(`--nri-panel-w`,`${e.width}px`),E.style.setProperty(`--nri-panel-h`,`${e.height}px`)};ne(x);let re=()=>_.find(e=>e.id===v.focusId),ie=()=>_.filter(e=>v.ids.has(e.id)),oe=e=>{Ai(fe(e,w),g(`Request and response copied`,`已复制请求和响应`))},se=e=>{let t=D(e,w);return he({...t,url:Oi(t.url)},`raw`)},ce=e=>Oi(D(e,w).url),le=e=>{Ai(se(e),g(`cURL command copied`,`已复制 cURL 命令`))},ue=e=>{Ai(ce(e),g(`URL copied`,`已复制 URL`))},de=e=>{let t=D(e,w);Ai(ae(t.responseBody,t.responseHeaders).text,g(`Response body copied`,`已复制响应体`))},me=()=>{_.length===0?I(`info`,g(`No requests to copy`,`没有可复制的请求`),1500):Ai(pe(_,w),g(`Copied ${_.length} requests and responses`,`已复制 ${_.length} 个请求和响应`))},_e=e=>{Ai(pe(e,w),g(`Copied ${e.length} requests and responses`,`已复制 ${e.length} 个请求和响应`))},ve=e=>{Ai(e.map(se).join(`

`),g(`Copied ${e.length} cURL commands`,`已复制 ${e.length} 条 cURL 命令`))},ye=e=>{Ai(e.map(ce).join(`
`),g(`Copied ${e.length} URLs`,`已复制 ${e.length} 个 URL`))},be=()=>{at(),I(`info`,g(`Cleared`,`已清空`),1500)},xe=document.createElement(`div`);xe.className=`nri-toolbar`;let Se=document.createElement(`div`);Se.className=`nri-title`;let Ce=yi(g(`Panel view`,`面板视图`),[{value:`requests`,label:g(`Requests`,`请求`),title:g(`Requests captured on this page`,`这个页面抓到的请求`)},{value:`rules`,label:g(`Rules`,`规则`),title:g(`Mock rules for this site: change the responses of matching requests`,`这个网站的 Mock 规则：改写匹配请求的返回`)}],e=>{fr(e,!0)});Ce.setValue(b);let we=document.createElement(`span`);we.className=`nri-view-count`,Ce.el.querySelector(`[data-value="rules"]`)?.append(we),Se.append(Ce.el);let Te=document.createElement(`div`);Te.className=`nri-actions`;let Ee=yi(g(`Copy and details mode`,`复制和详情的显示方式`),[{value:`redacted`,label:g(`Redacted`,`脱敏`),title:g(`Hide credentials (tokens, cookies, passwords) in details and copies`,`详情和复制内容里隐藏凭证（token、cookie、密码等）`)},{value:`raw`,label:g(`Raw`,`原文`),title:g(`Show captured values unredacted`,`按抓到的原样显示，不脱敏`)}],e=>{w=e,Ee.setValue(e),Kt(e),ln()});Ee.setValue(w);let De=$(`copy`,g(`Copy all visible requests and responses as Markdown`,`把列表里看得到的全部请求和响应复制为 Markdown`));De.addEventListener(`click`,me);let Oe=$(`clear`,g(`Clear the request list (${H(`k`)})`,`清空请求列表（${H(`k`)}）`));Oe.addEventListener(`click`,be);let ke=document.createElement(`span`);ke.className=`nri-toolbar-sep`;let O=$(`gear`,g(`Settings: appearance, language, shortcut, updates`,`设置：外观、语言、快捷键、更新`));O.setAttribute(`aria-haspopup`,`dialog`),O.setAttribute(`aria-expanded`,`false`);let Ae=Pn(),je=yi(g(`Style`,`配色`),[{value:`vscode`,label:`VS Code`,title:g(`VS Code colors`,`VS Code 配色`)},{value:`macos`,label:`macOS`,title:g(`macOS system colors with translucency`,`macOS 系统配色，半透明毛玻璃`)}],e=>{Me(e),Fn(e)}),Me=e=>{Ae=e,T.dataset.nriPalette=e,ut(Nn(Ne),e),je.setValue(e)},Ne=jn(),Pe=yi(g(`Theme`,`主题`),[{value:`system`,label:g(`System`,`跟随系统`),title:g(`Follow the browser's appearance`,`跟随浏览器的明暗设置`)},{value:`light`,label:g(`Light`,`浅色`),title:g(`Always light`,`始终浅色`)},{value:`dark`,label:g(`Dark`,`深色`),title:g(`Always dark`,`始终深色`)}],e=>{Ie(e),Mn(e)}),Ie=e=>{Ne=e;let t=Nn(e);T.dataset.nriTheme=t,ut(t,Ae),Pe.setValue(e)};Ie(Ne),Me(Ae);let Le=window.matchMedia(`(prefers-color-scheme: dark)`),Re=()=>{Ne===`system`&&Ie(`system`)};typeof Le.addEventListener==`function`?Le.addEventListener(`change`,Re,{signal:i}):(Le.addListener(Re),a.push(()=>Le.removeListener(Re))),Te.append(Ee.el,De,Oe,ke,O),xe.append(Se,Te);let ze=document.createElement(`div`);ze.className=`nri-searchbar`;let Be=document.createElement(`label`);Be.className=`nri-search-field`,Be.innerHTML=_i.search;let k=document.createElement(`input`);k.type=`search`,k.className=`nri-search-input`,k.placeholder=g(`Filter URL (${H(`f`)})`,`筛选 URL（${H(`f`)}）`),k.spellcheck=!1,k.autocomplete=`off`,k.setAttribute(`aria-label`,g(`Filter by URL`,`按 URL 筛选`));let Ve=document.createElement(`span`);Ve.className=`nri-search-count`,Ve.hidden=!0;let He=$(`xmark`,g(`Clear filter`,`清除筛选`),`nri-search-clear`);He.tabIndex=-1,He.hidden=!0,Be.append(k,Ve,He);let A=yi(g(`Request scope`,`请求范围`),[{value:`all`,label:g(`All`,`全部`),title:g(`Show all requests`,`显示全部请求`)},{value:`failed`,label:g(`Failed`,`失败`),title:g(`Show only failed requests (status 0, 4xx, 5xx, network errors)`,`只看失败的请求（状态码 0、4xx、5xx、网络错误）`)},{value:`mocked`,label:g(`Mocked`,`已模拟`),title:g(`Show only requests whose response came from a mock rule`,`只看返回被 Mock 规则改过的请求`)}],e=>{c=e,A.setValue(e),ln()});A.setValue(c),ze.append(Be,A.el);let Ue=bi(e=>{l=e,Ue.setValue(e),ln()});Ue.setValue(l);let j=document.createElement(`div`);j.className=`nri-list`,j.tabIndex=0,j.setAttribute(`role`,`listbox`),j.setAttribute(`aria-multiselectable`,`true`),j.setAttribute(`aria-label`,g(`Requests`,`请求`));let M=document.createElement(`div`);M.className=`nri-detail`;let Je=e=>{C=e,M.style.setProperty(`--nri-detail-h`,`${e}px`)};Je(C);let Ye=Ut(()=>Math.round(M.getBoundingClientRect().height)||C,Je),Xe=document.createElement(`div`);Xe.className=`nri-detail-header`;let Ze=document.createElement(`div`);Ze.className=`nri-detail-summary`;let $e=document.createElement(`span`),et=document.createElement(`span`);et.className=`nri-summary-meta`;let N=document.createElement(`span`);N.className=`nri-summary-meta`,N.title=g(`Response body size`,`响应体大小`);let tt=document.createElement(`span`);tt.className=`nri-summary-meta`,tt.title=g(`Started at`,`开始时间`);let nt=document.createElement(`span`);nt.className=`nri-summary-meta`,Ze.append($e,et,N,tt,nt);let rt=$(`xmark`,g(`Close details (Esc)`,`关闭详情（Esc）`),`nri-close-btn`);rt.addEventListener(`click`,()=>{tn(mn,!1),j.focus({preventScroll:!0})});let P=document.createElement(`div`);P.className=`nri-detail-titlebar`,P.append(Ze,rt);let it=document.createElement(`div`);it.className=`nri-detail-url`;let st=document.createElement(`span`),F=document.createElement(`span`);F.className=`nri-detail-url-text`,it.append(st,F);let ct=document.createElement(`div`);ct.className=`nri-detail-error`;let lt=document.createElement(`div`);lt.className=`nri-detail-mock`,lt.hidden=!0;let dt=document.createElement(`div`);dt.className=`nri-detail-bar`;let ft=yi(g(`Detail view`,`详情视图`),[{value:`body`,label:g(`Body`,`响应体`),title:g(`Response body`,`响应体`)},{value:`headers`,label:g(`Headers`,`响应头`),title:g(`Response headers`,`响应头`)},{value:`request`,label:g(`Request`,`请求`),title:g(`Request query, headers, and body`,`请求的查询参数、请求头和请求体`)}],e=>{$t(e)});ft.setValue(y);let pt=document.createElement(`span`);pt.className=`nri-spacer`;let mt=$(`code`,``),ht=e=>{ee=e;let t=e===`tree`?g(`Show as formatted text instead of a tree`,`改为显示格式化后的原文`):g(`Show as a collapsible JSON tree`,`改为显示可折叠的 JSON 树`);mt.innerHTML=_i[e===`tree`?`code`:`tree`],mt.title=t,mt.setAttribute(`aria-label`,t),mt.setAttribute(`aria-pressed`,e===`source`?`true`:`false`)};ht(ee),mt.addEventListener(`click`,()=>{ht(ee===`tree`?`source`:`tree`),Zt()});let gt=e=>()=>{let t=re();t!==void 0&&e(t)},_t=$(`copy`,g(`Copy this request and its response as Markdown (${H(`c`)})`,`把这个请求和它的响应复制为 Markdown（${H(`c`)}）`));_t.addEventListener(`click`,gt(oe));let vt=$(`braces`,g(`Copy the response body`,`复制响应体`));vt.addEventListener(`click`,gt(de));let yt=$(`terminal`,g(`Copy as a cURL command to replay it in a terminal`,`复制为 cURL 命令，可在终端里重放`));yt.addEventListener(`click`,gt(le));let bt=$(`mock`,``);bt.addEventListener(`click`,gt(e=>pr(e)));let xt=$(`search`,g(`Find text in the details (${H(`f`)})`,`在详情里查找文字（${H(`f`)}）`)),St=document.createElement(`div`);St.className=`nri-find-bar`,St.hidden=!0;let Ct=document.createElement(`label`);Ct.className=`nri-search-field`,Ct.innerHTML=_i.search;let L=document.createElement(`input`);L.type=`search`,L.className=`nri-search-input`,L.placeholder=g(`Find`,`查找`),L.spellcheck=!1,L.autocomplete=`off`,L.setAttribute(`aria-label`,g(`Find in details`,`在详情里查找`));let wt=document.createElement(`span`);wt.className=`nri-search-count`,wt.setAttribute(`aria-live`,`polite`),Ct.append(L,wt);let Tt=$(`chevronUp`,g(`Previous match (⇧Return)`,`上一个（⇧Return）`)),Et=$(`chevronDown`,g(`Next match (Return)`,`下一个（Return）`)),Dt=$(`xmark`,g(`Close find (Esc)`,`关闭查找（Esc）`),`nri-close-btn`);St.append(Ct,Tt,Et,Dt),dt.append(ft.el,pt,xt,mt,bt,_t,vt,yt),Xe.append(P,it,ct,lt,dt,St);let R=document.createElement(`div`);R.className=`nri-detail-content`,R.tabIndex=0,R.setAttribute(`role`,`region`),R.setAttribute(`aria-label`,g(`Request details`,`请求详情`)),M.append(Ye.top,Xe,R);let Ot=[],kt=0,At,jt=()=>!St.hidden,Mt=()=>jt()&&!M.hidden?qt(L.value):void 0,z=typeof CSS<`u`?CSS.highlights:void 0,Nt=()=>{if(z===void 0)return;let e=Mt();if(e===void 0){z.delete(`nri-find`),z.delete(`nri-find-current`);return}z.set(`nri-find`,new Highlight(...Xt(R,e,mi,hi)));let t=new Highlight(...At===void 0?[]:[At]);t.priority=1,z.set(`nri-find-current`,t)};new MutationObserver(Nt).observe(R,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`hidden`]});let Pt=()=>{let e=Ot.length,t=e>=hi?`+`:``;wt.textContent=L.value===``?``:e===0?g(`No matches`,`没有匹配`):g(`${kt+1} of ${e}${t}`,`${kt+1} / ${e}${t}`),Tt.disabled=e===0,Et.disabled=e===0,xt.setAttribute(`aria-pressed`,jt()?`true`:`false`)},Ft=(e,t)=>{let n=Ot.length;kt=n===0?0:(e+n)%n,At=Ot.at(kt)?.(),Nt(),t&&At!==void 0&&Qt(R,At),Pt()},zt=e=>{let t=[];for(let n of R.children){let r=hi-t.length;if(r<=0)break;let i=un(n,e,r);if(i===void 0)for(let i of Xt(n,e,mi,r))t.push(()=>i);else for(let r of i)t.push(()=>{let t=n instanceof HTMLElement?dn(n,r):void 0;return t===void 0?void 0:Xt(t,e,mi).at(r.occurrence)})}return t},Ht=e=>{let t=Mt();Ot=t===void 0?[]:zt(t),Ft(e?Math.min(kt,Ot.length-1):0,!e)},Wt=()=>{St.hidden=!1,L.focus({preventScroll:!0}),L.select(),Ht(!1)},Jt=()=>{St.hidden=!0,Ht(!1),R.focus({preventScroll:!0})};xt.addEventListener(`click`,()=>{jt()?Jt():Wt()}),L.addEventListener(`input`,()=>{Ht(!1)}),Tt.addEventListener(`click`,()=>{Ft(kt-1,!0)}),Et.addEventListener(`click`,()=>{Ft(kt+1,!0)}),Dt.addEventListener(`click`,Jt),Pt();let Yt,Zt=()=>{let e=re();if(M.hidden=e===void 0,e===void 0){Yt=void 0,R.replaceChildren(),Ht(!1);return}if(Yt?.record===e&&Yt.copyMode===w&&Yt.tab===y&&Yt.view===ee)return;let t=Yt?.record.id===e.id&&Yt.tab===y,n=R.scrollTop,r=D(e,w);$e.className=`nri-status-pill nri-tone-${xi(r)}`,$e.textContent=Ci(r),et.textContent=r.durationMs===void 0?`— ms`:`${r.durationMs} ms`,N.textContent=ge(r.responseBody),tt.textContent=Ei(r.startedAt,!0),nt.textContent=r.source===`xhr`?`XHR`:`Fetch`,st.className=Ti(r.method),st.textContent=r.method.toUpperCase(),F.textContent=Oi(r.url),F.title=F.textContent,ct.hidden=r.error===void 0,ct.textContent=r.error??``,mr(r),hr(),mt.hidden=y===`headers`,vt.disabled=!ki(r.responseBody),R.replaceChildren(Ri(r,y,ee)),R.scrollTop=t?n:0,Yt={record:e,copyMode:w,tab:y,view:ee},Ht(t)},$t=e=>{y=e,ft.setValue(e),Zt()},en=e=>{let t=pi.indexOf(y)+e,n=pi[Math.max(0,Math.min(pi.length-1,t))];n!==void 0&&$t(n)},B=e=>{for(let e of j.querySelectorAll(`.nri-row`)){let t=e.dataset.recordId!==void 0&&v.ids.has(e.dataset.recordId);e.classList.toggle(`nri-selected`,t),e.setAttribute(`aria-selected`,t?`true`:`false`)}let t=M.hidden;Zt();let{focusId:n}=v;if(n===void 0)j.removeAttribute(`aria-activedescendant`);else{j.setAttribute(`aria-activedescendant`,zi(n));let r=e||t&&!M.hidden?document.getElementById(zi(n)):null;r!==null&&Vi(j,r)}},tn=(e,t)=>{v=e,B(t)},nn=()=>_.map(e=>e.id),rn=()=>{let e=s.trim()!==``||c!==`all`||l.size>0;He.hidden=s===``,Ve.hidden=!e,Ve.textContent=e?g(`${_.length} of ${u.length}`,`${_.length} / ${u.length}`):``},an=()=>{if(u.length===0)return[g(`No Requests`,`还没有请求`),g(`Static assets are filtered`,`静态资源不会记录`)];if(s.trim()!==``)return[g(`No Results`,`没有结果`),g(`No URL matches “${s.trim()}”`,`没有 URL 包含“${s.trim()}”`)];if(l.size>0){let e=In.filter(e=>l.has(e.value)).map(e=>g(e.label,fi[e.value].label)).join(`, `),t=c===`failed`?`failed `:c===`mocked`?`mocked `:``,n=c===`failed`?`失败的`:c===`mocked`?`已模拟的`:``;return[g(`No Results`,`没有结果`),g(`No ${t}${e} requests`,`没有${n} ${e} 请求`)]}return c===`mocked`?[g(`No Mocked Requests`,`没有被模拟的请求`),g(`Requests answered by a mock rule show up here`,`返回被 Mock 规则改过的请求会显示在这里`)]:[g(`No Failed Requests`,`没有失败的请求`),g(`Everything succeeded so far`,`目前都成功了`)]},on=()=>[{label:g(`Copy All Visible Requests`,`复制全部可见请求`),onSelect:me,disabled:_.length===0},{label:g(`Clear Requests`,`清空请求`),shortcut:H(`k`),onSelect:be,disabled:u.length===0}],sn=e=>[{label:g(`Copy ${e.length} Requests and Responses`,`复制这 ${e.length} 个请求和响应`),shortcut:H(`c`),onSelect:()=>_e(e)},{label:g(`Copy ${e.length} as cURL`,`复制这 ${e.length} 个为 cURL`),onSelect:()=>ve(e)},{label:g(`Copy ${e.length} URLs`,`复制这 ${e.length} 个 URL`),onSelect:()=>ye(e)},`separator`,...on()],cn=e=>[{label:Qe(e.method,e.url)===void 0?g(`Mock This Request`,`Mock 这个请求`):g(`Edit Mock Rule`,`编辑 Mock 规则`),onSelect:()=>pr(e)},`separator`,{label:g(`Copy Request and Response`,`复制请求和响应`),shortcut:H(`c`),onSelect:()=>oe(e)},{label:g(`Copy as cURL`,`复制为 cURL`),onSelect:()=>le(e)},{label:g(`Copy URL`,`复制 URL`),onSelect:()=>ue(e)},{label:g(`Copy Response Body`,`复制响应体`),disabled:!ki(e.responseBody),onSelect:()=>de(e)},`separator`,...on()],ln=()=>{_=ji(u,s,c,l),Ue.setCounts(Mi(u)),v=yn(nn(),v),rn();let[e,t]=an();Kn(j,()=>{Bi({listEl:j,records:_,emptyTitle:e,emptyHint:t,selectedIds:v.ids,onRowPress:(e,t)=>{let n=V();n&&t.ctrlKey||((n?t.metaKey:t.ctrlKey)?tn(gn(v,e),!1):t.shiftKey?(t.preventDefault(),j.focus({preventScroll:!0}),tn(_n(nn(),v,e),!1)):tn(hn(e),!1))},onRowContextMenu:(e,t)=>{v.ids.has(e.id)||tn(hn(e.id),!1),j.focus({preventScroll:!0});let n=ie();Rt(T,n.length>1?sn(n):cn(e),t.clientX,t.clientY)},copyMode:w})}),B(!1)};j.addEventListener(`mousedown`,e=>{e.button===0&&e.target instanceof Element&&e.target.closest(`.nri-row`)===null&&tn(mn,!1)}),j.addEventListener(`contextmenu`,e=>{e.preventDefault(),j.focus({preventScroll:!0}),Rt(T,on(),e.clientX,e.clientY)});let Sn=e=>{k.value=e,s=e,ln()};k.addEventListener(`input`,()=>{s=k.value,ln()}),He.addEventListener(`click`,e=>{e.preventDefault(),Sn(``),k.focus()});let U=document.createElement(`div`);U.className=`nri-settings`,U.setAttribute(`role`,`dialog`),U.setAttribute(`aria-label`,g(`Settings`,`设置`)),U.tabIndex=-1,U.hidden=!0;let En=(e,...t)=>{let n=document.createElement(`div`);n.className=`nri-settings-section`;let r=document.createElement(`div`);return r.className=`nri-settings-heading`,r.textContent=e,n.append(r,...t),n},kn=(e,...t)=>{let n=document.createElement(`div`);n.className=`nri-settings-row`;let r=document.createElement(`span`);return r.className=`nri-settings-label`,r.textContent=e,n.append(r,...t),n},W=jr(),G=!1,K=document.createElement(`button`);K.type=`button`,K.className=`nri-keycap`;let Ln=document.createElement(`button`);Ln.type=`button`,Ln.className=`nri-text-btn`,Ln.textContent=g(`Reset`,`恢复默认`),vi(Ln);let Rn=document.createElement(`div`);Rn.className=`nri-settings-hint`;let zn=()=>W===null?g(`None`,`无`):zr(W,V()),Bn=()=>{K.setAttribute(`aria-pressed`,G?`true`:`false`),K.dataset.empty=W===null?`true`:`false`,K.textContent=G?g(`Press keys…`,`请按键…`):zn();let e=G?g(`Recording shortcut`,`正在录制快捷键`):g(`Show/Hide panel shortcut: ${zn()}. Click to change`,`显示 / 隐藏面板的快捷键：${zn()}。点击修改`);K.title=e,K.setAttribute(`aria-label`,e),Ln.hidden=G||Nr(W,Tr),Ln.title=g(`Reset to ${zr(Tr,V())}`,`恢复为 ${zr(Tr,V())}`),Rn.textContent=G?g(`Esc cancels · Delete disables`,`Esc 取消 · Delete 停用`):W===null?g(`Click to set a shortcut`,`点击设置快捷键`):Ir(W)?g(`Ignored while typing`,`在输入框里打字时不生效`):``},Vn=e=>{W=e,Mr(e),Bn(),ei()},Hn=()=>{G&&(G=!1,Bn())};K.addEventListener(`click`,()=>{G?Hn():(G=!0,Bn(),K.focus({preventScroll:!0}))}),K.addEventListener(`blur`,Hn),K.addEventListener(`keydown`,e=>{if(!G||e.isComposing)return;e.preventDefault(),e.stopPropagation();let t=!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey;if(t&&e.key===`Escape`){Hn();return}if(t&&(e.key===`Backspace`||e.key===`Delete`)){G=!1,Vn(null),I(`info`,g(`Show/Hide shortcut disabled`,`已停用显示 / 隐藏快捷键`),1800);return}let n=Pr(e);if(n===void 0)return;let r=Lr(n,V());r===void 0?(G=!1,Vn(n),I(`success`,g(`Show/Hide shortcut set to ${zn()}`,`显示 / 隐藏快捷键已设为 ${zn()}`),1800)):I(`warning`,g(`${zr(n,V())} is ${r}`,`${zr(n,V())} ${r===`used to navigate the panel`?`用于在面板里移动`:`已被面板或编辑操作占用`}`),2200)}),Ln.addEventListener(`click`,()=>{Vn(Tr),I(`success`,g(`Show/Hide shortcut set to ${zn()}`,`显示 / 隐藏快捷键已设为 ${zn()}`),1800)}),Bn();let Un=ri(),Wn=Jr(),Gn=document.createElement(`span`);Gn.className=`nri-settings-value`,Gn.textContent=ii();let qn=document.createElement(`button`);qn.type=`button`,qn.className=`nri-text-btn`,qn.textContent=g(`What's New`,`更新说明`),qn.title=g(`Show the release notes of every version up to this one`,`查看到当前版本为止每个版本的更新说明`),vi(qn);let Jn=document.createElement(`button`);Jn.type=`button`,Jn.className=`nri-switch`,Jn.setAttribute(`role`,`switch`),Jn.setAttribute(`aria-label`,g(`Include beta versions`,`接收测试版`)),vi(Jn);let Yn=document.createElement(`button`);Yn.type=`button`,Yn.className=`nri-push-btn`,vi(Yn);let Xn=document.createElement(`span`);Xn.className=`nri-update-status`;let Zn=document.createElement(`a`);Zn.className=`nri-link`,Zn.target=`_blank`,Zn.rel=`noopener noreferrer`;let Qn=kn(g(`Beta Versions`,`测试版`),Jn);Qn.title=g(`Also offer beta versions; while on, checks once a day`,`同时提示测试版；打开后每天自动检查一次`);let $n=document.createElement(`div`);$n.className=`nri-settings-row`,$n.append(Yn,Xn,Zn),Qn.hidden=Un.update===void 0,$n.hidden=Un.update===void 0;let er=d(),tr=yi(g(`Language`,`语言`),[{value:`auto`,label:g(`Auto`,`自动`),title:g(`Follow the browser's language`,`跟随浏览器语言`)},{value:`en`,label:`English`,title:`English`},{value:`zh`,label:`中文`,title:`简体中文`}],e=>{f(e);let t=p(e);tr.setValue(e),t!==h()&&(m(t),Q({view:b,settingsOpen:!0}))});tr.setValue(er),U.append(En(g(`Appearance`,`外观`),kn(g(`Style`,`配色`),je.el),kn(g(`Theme`,`主题`),Pe.el),kn(g(`Language`,`语言`),tr.el)),En(g(`Keyboard`,`键盘`),kn(g(`Show/Hide Panel`,`显示 / 隐藏面板`),Ln,K),Rn),En(g(`Updates`,`更新`),kn(g(`Version`,`版本`),qn,Gn),Qn,$n));let nr,rr=e=>{window.clearTimeout(nr),Yn.disabled=e.status===`checking`,Yn.textContent=e.status===`checking`?g(`Checking…`,`正在检查…`):g(`Check for Updates`,`检查更新`),Zn.hidden=e.status!==`available`,Xn.hidden=e.status===`available`,O.dataset.badge=e.status===`available`?`true`:`false`,Xn.title=e.status===`failed`?e.reason:``,e.status===`available`?(Zn.textContent=g(`Install v${e.version}`,`安装 v${e.version}`),Zn.title=g(`Install v${e.version} with Tampermonkey`,`用 Tampermonkey 安装 v${e.version}`)):e.status===`up-to-date`||e.status===`failed`?(Xn.textContent=e.status===`up-to-date`?g(`Up to date`,`已是最新版本`):g(`Update check failed`,`检查更新失败`),nr=window.setTimeout(()=>rr({status:`idle`}),e.status===`up-to-date`?3e3:5e3)):Xn.textContent=``},ar=()=>{Jn.setAttribute(`aria-checked`,Wn?`true`:`false`)},sr=0,cr=({background:e})=>{let t=Un.update;if(t===void 0)return;let n=t[Xr(Wn)],r=++sr;e||rr({status:`checking`}),qr({manifestUrl:n.manifestUrl,currentVersion:Un.version}).then(t=>{r===sr&&(t.status===`available`&&(Zn.href=n.installUrl,e&&I(`info`,g(`Network Request Inspector v${t.version} is available`,`有新版本 v${t.version} 可以安装`),4e3)),(!e||t.status===`available`)&&rr(t))})};Yn.addEventListener(`click`,()=>{cr({background:!1})}),Jn.addEventListener(`click`,()=>{Wn=!Wn,Yr(Wn),ar(),Wn?(Qr(),cr({background:!1})):(sr++,rr({status:`idle`}))}),ar(),rr({status:`idle`}),Wn&&Un.update!==void 0&&Qr()&&cr({background:!0});let lr=Un.changelog??[],ur=wr({findRealResponse:e=>ir(u,e)}),dr=()=>{q.hidden&&(b===`rules`?E.dataset.view=`rules`:delete E.dataset.view)};function fr(e,t){b=e,Ce.setValue(e),ur.el.hidden=e!==`rules`,dr(),It(),t&&!o&&(e===`rules`?ur.focus():j.focus({preventScroll:!0}))}function pr(e){let t=Qe(e.method,e.url),n=t??qe(or({record:e,records:u,pageOrigin:location.origin}));fr(`rules`,!1),ur.reveal(n.id),t===void 0&&I(`success`,n.orig===void 0?g(`Rule created with a default 500 response (no captured response to copy)`,`已建规则，使用默认的 500 返回（没有抓到可带入的真实返回）`):g(`Rule created from the captured response; edit it below`,`已按抓到的真实返回建好规则，在下面修改`),2500)}function mr(e){let t=e.mock;if(lt.hidden=t===void 0,t===void 0){lt.replaceChildren();return}let n;if(t.mode===`block`)n=g(`Answered by a mock rule — the request never reached the server.`,`返回来自 Mock 规则，请求没有发到服务器。`);else if(t.mode===`hang`)n=g(`Held by a mock rule — the request was not sent and never completes.`,`被 Mock 规则挂起：请求没有发出，也不会返回。`);else if(t.real===void 0)n=g(`Response replaced by a mock rule (pass-through) — waiting for the server.`,`返回被 Mock 规则替换（放行），正在等服务器响应。`);else if(t.real.error!==void 0)n=g(`Response replaced by a mock rule (pass-through). The real request failed: ${t.real.error}.`,`返回被 Mock 规则替换（放行）。真实请求失败了：${t.real.error}。`);else{let r=Ci({...e,error:void 0,status:t.real.status});n=g(`Response replaced by a mock rule (pass-through). The server really answered ${r}.`,`返回被 Mock 规则替换（放行）。服务器真实返回的是 ${r}。`)}let r=document.createElement(`button`);r.type=`button`,r.className=`nri-text-btn`,r.textContent=g(`Show rule`,`查看规则`),r.addEventListener(`click`,()=>{let e=We().some(e=>e.id===t.ruleId);fr(`rules`,!1),e?ur.reveal(t.ruleId):I(`info`,g(`That rule has been deleted`,`这条规则已经删除了`),2e3)}),lt.replaceChildren(n,r)}function hr(){let e=re(),t=e!==void 0&&Qe(e.method,e.url)!==void 0,n=t?g(`Edit the mock rule for this request (it is already mocked)`,`编辑这个请求的 Mock 规则（已经有规则了）`):g(`Mock this request: create a rule from its real response, then change the status or body`,`Mock 这个请求：按它的真实返回建一条规则，再改状态码或响应体`);bt.title=n,bt.setAttribute(`aria-label`,n),bt.classList.toggle(`nri-mock-has`,t)}let q=document.createElement(`div`);q.className=`nri-whats-new`,q.setAttribute(`role`,`region`),q.setAttribute(`aria-label`,g(`What's New`,`更新说明`)),q.hidden=!0;let gr=document.createElement(`div`);gr.className=`nri-whats-new-header`;let J=document.createElement(`h3`);J.className=`nri-whats-new-title`,J.textContent=g(`What's New`,`更新说明`);let Y=document.createElement(`p`);Y.className=`nri-whats-new-subtitle`,gr.append(J,Y);let _r=document.createElement(`div`);_r.className=`nri-whats-new-notes`,_r.tabIndex=0;let vr=document.createElement(`button`);vr.type=`button`,vr.className=`nri-push-btn nri-primary`,vr.textContent=g(`Done`,`完成`);let yr=document.createElement(`div`);yr.className=`nri-whats-new-actions`,yr.append(vr),q.append(gr,_r,yr);let br=(e,t)=>{for(let n of ai(t)){if(n.kind===`text`){e.append(n.text);continue}let t=document.createElement(n.kind===`code`?`code`:`strong`);t.textContent=n.text,e.append(t)}},xr=e=>{let t=document.createElement(`section`);t.className=`nri-whats-new-version`;let n=document.createElement(`h4`);n.textContent=`v${e.version}`;let r=document.createElement(`span`);r.className=`nri-whats-new-date`,r.textContent=e.date,n.append(r),t.append(n);for(let n of e.sections){let e=document.createElement(`div`);e.className=`nri-whats-new-section`,e.textContent=n.title;let r=document.createElement(`ul`);for(let e of n.items){let t=document.createElement(`li`);if(br(t,e.text),e.children.length>0){let n=document.createElement(`ul`);for(let t of e.children){let e=document.createElement(`li`);br(e,t),n.append(e)}t.append(n)}r.append(t)}t.append(e,r)}return t},Sr=()=>!q.hidden,Cr=({from:e,entries:t})=>{Y.textContent=e===void 0?`Network Request Inspector ${ii()}`:g(`Updated from v${e} to ${ii()}`,`已从 v${e} 更新到 ${ii()}`),_r.replaceChildren(...t.map(xr)),_r.scrollTop=0,q.hidden=!1,E.dataset.view=`whats-new`,o||vr.focus({preventScroll:!0})},Er=()=>{if(!Sr())return;let e=q.contains(document.activeElement);q.hidden=!0,dr(),e&&!o&&(b===`rules`?ur.focus():j.focus({preventScroll:!0}))},Dr=()=>{let e=li({changelog:lr,current:Un.version});e!==void 0&&Cr(e)};vr.addEventListener(`click`,Er);let Or,kr=()=>!U.hidden,Ar=()=>{let e=O.getBoundingClientRect(),t=U.getBoundingClientRect(),n=Math.min(Math.max(4,e.right-t.width),window.innerWidth-t.width-4),r=e.bottom+4;r+t.height>window.innerHeight-4&&(r=Math.max(4,e.top-4-t.height)),U.style.left=`${n}px`,U.style.top=`${r}px`},Rr=e=>{e.target instanceof Node&&(U.contains(e.target)||O.contains(e.target))||Br(!1)},Br=e=>{kr()&&(Hn(),U.hidden=!0,O.setAttribute(`aria-expanded`,`false`),O.setAttribute(`aria-pressed`,`false`),window.removeEventListener(`pointerdown`,Rr,!0),window.removeEventListener(`resize`,Ar),e&&Or?.isConnected===!0&&Or.focus({preventScroll:!0}))},Hr=()=>{It(),Or=document.activeElement instanceof HTMLElement?document.activeElement:void 0,U.hidden=!1,O.setAttribute(`aria-expanded`,`true`),O.setAttribute(`aria-pressed`,`true`),Ar(),U.focus({preventScroll:!0}),window.addEventListener(`pointerdown`,Rr,!0),window.addEventListener(`resize`,Ar)};O.addEventListener(`click`,()=>{kr()?Br(!0):Hr()}),qn.addEventListener(`click`,()=>{Br(!1),Cr({entries:ci({changelog:lr,current:Un.version})})}),U.addEventListener(`keydown`,e=>{e.key===`Escape`&&(e.preventDefault(),Br(!0)),e.stopPropagation()}),E.append(xe,ze,Ue.el,j,M,q,ur.el),An(E,()=>x,e=>{ne(e)});let X=document.createElement(`button`);X.type=`button`,X.className=`nri-toggle`;let Ur=document.createElement(`span`);Ur.textContent=`NRI`;let Wr=document.createElement(`span`);Wr.className=`nri-badge`,Wr.textContent=`0`;let Gr=document.createElement(`span`);Gr.className=`nri-toggle-chevron`,Gr.innerHTML=_i.chevronDown;let Kr=document.createElement(`span`);Kr.className=`nri-toggle-mock`,Kr.hidden=!0,X.append(Ur,Wr,Kr,Gr);let Zr=()=>{let e=We();if(e.length===0)return``;if(Ge())return g(`Mock rules: ${e.length} (paused)`,`Mock 规则：${e.length} 条（已暂停）`);let t=Fe(e,!1);return t>0?g(`Mock rules: ${t} active`,`Mock 规则：${t} 条生效中`):g(`Mock rules: ${e.length} (none active)`,`Mock 规则：${e.length} 条（都没生效）`)},$r=()=>{let e=We(),t=Ge()&&e.length>0,n=Fe(e,Ge());Kr.hidden=n===0&&!t,Kr.textContent=t?g(`Paused`,`已暂停`):`Mock ${n}`,Kr.classList.toggle(`nri-paused`,t),X.classList.toggle(`nri-mock-live`,n>0),we.textContent=String(e.length),we.hidden=e.length===0,we.classList.toggle(`nri-live`,n>0),ei()},ei=()=>{let e=u.filter(wi).length,t=e>0?g(`Network Requests: ${u.length} (${e} failed)`,`网络请求：${u.length} 个（${e} 个失败）`):g(`Network Requests: ${u.length}`,`网络请求：${u.length} 个`),n=o?g(`Show Panel`,`显示面板`):g(`Hide Panel`,`隐藏面板`),r=W===null?``:` (${zn()})`,i=Zr();X.title=`${n}${r}\n${t}${i===``?``:`\n${i}`}`,X.setAttribute(`aria-label`,`${n}${r} — ${t}${i===``?``:` — ${i}`}`),X.setAttribute(`aria-expanded`,o?`false`:`true`)},ni=document.createElement(`div`);ni.className=`nri-dock`,ni.appendChild(X);let oi=()=>{o?(E.classList.remove(`nri-open`),T.classList.add(`nri-idle`)):(E.classList.add(`nri-open`),T.classList.remove(`nri-idle`)),ei()},si=e=>{if(o===e)return;let t=E.contains(document.activeElement)||U.contains(document.activeElement);It(),Br(!1),e&&Er(),o=e,oi(),xn(o),o?t&&X.focus({preventScroll:!0}):(j.focus({preventScroll:!0}),Dr())};X.addEventListener(`click`,()=>{si(!o)}),window.addEventListener(`keydown`,e=>{W===null||G||e.repeat||e.isComposing||Lt()||kr()||!Fr(e,W)||Ir(W)&&Vr(e)||(e.preventDefault(),e.stopPropagation(),si(!o))},{capture:!0,signal:i});let di=(e,t=!1)=>{let n=nn(),r=fn(n,v.focusId,e);tn(t?_n(n,v,r):hn(r),!0)};E.addEventListener(`keydown`,e=>{if(Lt())return;if(Sr()){e.key===`Escape`&&(e.preventDefault(),Er()),e.stopPropagation();return}if(b===`rules`){e.key===`Escape`&&!e.isComposing&&(e.preventDefault(),Vr(e)&&e.target instanceof HTMLElement?(e.target.blur(),ur.focus()):fr(`requests`,!0)),e.stopPropagation();return}let t=e.target===k,n=e.target===j,r=e.target===R,i=e.target===L,a=e.target instanceof Node&&M.contains(e.target),o=re(),s=ie(),c=!0;if(pn(e,`f`))a&&o!==void 0?Wt():(k.focus(),k.select());else if(i&&e.key===`Escape`)Jt();else if(i&&e.key===`Enter`&&!e.isComposing)Ft(kt+(e.shiftKey?-1:1),!0);else if(pn(e,`k`))be();else if(pn(e,`c`)&&(n||r)&&s.length>0&&(window.getSelection()?.toString()??``)===``)s.length>1?_e(s):oe(s[0]);else if(pn(e,`a`)&&n)tn(vn(nn(),v),!1);else if(e.key===`Escape`)t&&k.value!==``?Sn(``):t||r?j.focus({preventScroll:!0}):v.ids.size>0?tn(mn,!1):si(!0);else if(t)e.key===`ArrowDown`||e.key===`Enter`?(j.focus({preventScroll:!0}),v.focusId===void 0&&di(`first`)):c=!1;else if(n){let t=e.altKey||e.metaKey,n=e.shiftKey;switch(e.key){case`ArrowDown`:di(t?`last`:`next`,n);break;case`ArrowUp`:di(t?`first`:`previous`,n);break;case`Home`:di(`first`,n);break;case`End`:di(`last`,n);break;case`ArrowLeft`:en(-1);break;case`ArrowRight`:en(1);break;case`Enter`:o!==void 0&&R.focus({preventScroll:!0});break;default:c=!1}}else c=!1;c&&e.preventDefault(),e.stopPropagation()});let Z=()=>X.getBoundingClientRect().height||30;Tn(X,Z,()=>S,e=>{te(e)}),T.append(E,ni,U),ti(T,i),oi(),Hi(T),o||Dr(),te(wn(Z())),window.addEventListener(`resize`,()=>{ne(Dn(x)),te(Cn(S,Z())),Je(Bt(C))},{signal:i}),$r(),a.push(Ke(()=>{$r(),hr()}),ur.dispose),t===`rules`&&fr(`rules`,!1),n&&!o&&Hr(),a.push(ot(e=>{u=e;let t=e.filter(wi).length;Wr.textContent=String(e.length),Wr.classList.toggle(`nri-badge-alert`,t>0),ei(),ln()}));function Q(e){It(),Br(!1),r.abort();for(let e of a)e();T.remove(),Ui({initialView:e.view,settingsOpen:e.settingsOpen})}}let Wi=`__NRI_BOOTED__`;function Gi(){try{return window.self===window.top}catch{return!1}}function Ki(){let e=()=>{yt().__apiMockErr===!0&&I(`warning`,g(`The old standalone mock script is still installed. Remove it in Tampermonkey — its rules have been moved here.`,`旧版独立的接口报错模拟脚本还装着，请在 Tampermonkey 里删掉它；它的规则已经搬到这里了。`),8e3)};document.readyState===`complete`?e():window.addEventListener(`load`,e,{once:!0})}function qi(){if(!Gi())return;let e=yt();if(e[Wi]===!0)return;e[Wi]=!0,m(p(d())),Dt(),et(),it(Mt()),window.addEventListener(`pagehide`,()=>{At(rt())});let t=()=>{Ui(),Ki()};document.documentElement===null?document.addEventListener(`DOMContentLoaded`,t,{once:!0}):t(),console.log(`[NRI] Network Request Inspector loaded`)}qi()})();