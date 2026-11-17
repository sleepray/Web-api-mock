// ==UserScript==
// @name         Network Request Inspector + Mock
// @namespace    https://github.com/sleepray/Web-api-mock
// @version      0.5.4
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

const __NRI_BUILD__ = {"version":"0.5.4","changelog":[{"version":"0.5.4","date":"2026-11-17","sections":[{"title":"Fixed","items":[{"text":"网页开着弹窗时，在面板里选中请求按 ⌘C / Ctrl+C 不复制：很多弹窗会锁住焦点，点进面板的焦点马上被抢回弹窗，按键到不了面板。现在面板不让页面察觉焦点离开了弹窗，焦点还是被抢走时，只要最后点的是面板，⌘C 照样复制选中的请求；方向键等其它按键也能正常用","children":[]}]}]},{"version":"0.5.3","date":"2026-11-17","sections":[{"title":"Added","items":[{"text":"规则的响应体可以切换成可折叠的 JSON 树，和请求详情区的 </> 按钮一样：点响应体上方的树形图标切换，再点切回可编辑的原文。树是只读的；响应体被预设、复原、格式化改了时树跟着更新；不是 JSON 对象或数组时会提示，不切换。查找在树里也能用，命中在折叠的节点里时会自动展开","children":[]}]},{"title":"Fixed","items":[{"text":"选中一个请求后按 ⌘C / Ctrl+C 有时不复制：页面上残留着之前选中的文字时（点请求行不会清掉它），按键交给了浏览器去复制那段文字；点过详情区的标签、标题行或 URL 之后焦点不在列表上，按键也没反应。现在只要焦点在面板里（输入框除外）就复制选中的请求，只有在详情区里选了文字时才复制选中的文字","children":[]}]}]},{"version":"0.5.2","date":"2026-11-12","sections":[{"title":"Added","items":[{"text":"规则的响应体编辑框可以查找，和请求详情区的查找一样：点响应体上方的放大镜或按 ⌘F / Ctrl+F 打开查找栏，命中处全部标黄、当前一处标橙，显示「第几处 / 共几处」，Return / ⇧Return 跳到下一处 / 上一处，Esc 收起。在编辑框里先选中一段文字再按 ⌘F，会直接拿它来查","children":[]}]},{"title":"Changed","items":[{"text":"规则视图的配色和请求列表一致：方法按 GET 绿、POST/PUT/PATCH 橙、DELETE 红着色，状态码按 2xx 绿、3xx 蓝、其它红着色，响应体编辑框里的 JSON 按详情区的颜色高亮（键、字符串、数字、布尔、null），编辑框底色也和详情区一样用面板底色，不再是灰色","children":[]}]}]},{"version":"0.5.1","date":"2026-11-12","sections":[{"title":"Changed","items":[{"text":"规则列表的外观和请求列表统一：启用和全部暂停改为开关，模式改为分段选择，预设改为和类型筛选一样的标签，规则之间用细线分隔；下拉框、数字框和响应体编辑框跟随面板的深浅色，滚动条与请求列表一致","children":[]}]},{"title":"Fixed","items":[{"text":"规则响应体编辑框右上角的格式化按钮会挡住内容：移到编辑框上方","children":[]}]}]},{"version":"0.5.0","date":"2026-11-12","sections":[{"title":"Added","items":[{"text":"界面支持中文：在设置的 **Appearance** 一栏选择 **Language**（自动 / English / 中文），默认跟随浏览器语言，所有网站共用；切换后立即生效，不用刷新页面。复制出去的 Markdown、cURL 保持英文","children":[]}]},{"title":"Changed","items":[{"text":"按钮、分段控件和筛选标签的悬停说明更快出现（约 0.4 秒），说明文字也写得更具体；请求行上显示完整 URL 的提示仍在停留约 1.5 秒后出现","children":[]}]}]},{"version":"0.4.0","date":"2026-11-12","sections":[{"title":"Added","items":[{"text":"Mock：按规则改写接口的返回，用来测前端的异常处理。工具栏的 **Requests | Rules** 切换到规则列表，每条规则按「方法 + 地址里的一段」匹配（以 `re:` 开头按正则），可以设状态码（`0` 为网络错误）、响应体、延迟和最多命中次数","children":[]},{"text":"三种模式：**Block** 不发到服务器、直接返回规则的内容；**Pass through** 请求照常发出并执行，只替换页面看到的返回；**Hang** 不发也一直不返回，用来看加载状态和前端自己的超时","children":[]},{"text":"在详情区点魔杖按钮或在右键菜单里选 **Mock This Request**，带着这个请求真实的状态码和响应体建规则，在它上面改；已有规则的请求改为 **Edit Mock Rule**，跳到那条规则","children":[]},{"text":"规则卡上的预设：`500`、`502`、`504`、`401`、`403`、**Offline**、**Slow 3s**、**Empty list**、**Never respond**，以及回到真实返回的 **Reset**","children":[]},{"text":"响应体编辑：输入时自动补上配对的引号和括号、回车保持缩进；**Format** 重新排版，写坏的 JSON 可以 **Auto-fix**（补引号、逗号、括号，去掉多余的逗号），改完说明修了几处并可撤销","children":[]},{"text":"被规则改过的请求在列表里带 **MOCK** 标记，筛选新增 **Mocked**；详情区说明是哪种模式改的，Pass through 模式下显示服务器真正的返回","children":[]},{"text":"有规则生效时角标显示条数，面板收起贴边时露出的那一截变红；**Pause All** 临时停用全部规则","children":[]},{"text":"刷新页面后请求列表仍在，刷新前的请求排在 **Before reload** 分隔线下面，照样可以查看和建规则；关掉标签页或清空请求后不再保留。存下来的请求头、请求参数和请求体已脱敏","children":[]},{"text":"规则按网站保存，刷新后仍然生效，同一网站的其它标签页同步生效；旧版独立 mock 脚本的规则会自动迁移过来，旧脚本还装着时会提示卸载","children":[]}]},{"title":"Changed","items":[{"text":"安装和更新改为从 GitHub 仓库获取，需要按 README 重新安装一次","children":[]}]}]},{"version":"0.3.0-beta.9","date":"2026-11-09","sections":[{"title":"Added","items":[{"text":"详情区可查找文本：点放大镜或在详情区按 `⌘F` 打开查找栏，高亮全部命中，`Return` / `⇧Return` 在命中之间跳转；JSON 树中折叠的节点会自动展开","children":[]}]}]},{"version":"0.3.0-beta.8","date":"2026-10-19","sections":[{"title":"Fixed","items":[{"text":"面板内按钮、筛选和请求行的悬停提示不显示：现在以面板配色显示，鼠标停留约 1.5 秒后出现，沿工具栏移到相邻按钮时立即切换","children":[]}]}]},{"version":"0.3.0-beta.7","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"详情区只在选中请求时显示，未选中时列表占满面板；点详情区右上角的 `×` 或在列表中按 `Esc` 可关闭详情区，再点任意请求即重新打开。`Esc` 改为先关闭详情区，再按一次才隐藏面板","children":[]}]}]},{"version":"0.3.0-beta.6","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"面板打开时 **NRI** 按钮变为向下箭头，一眼可见再点一次即可收起","children":[]}]},{"title":"Fixed","items":[{"text":"What's New 的条目在部分网站上缺少列表圆点","children":[]}]}]},{"version":"0.3.0-beta.5","date":"2026-10-12","sections":[{"title":"Added","items":[{"text":"更新后第一次打开面板时显示 **What's New**，列出从上一个版本到当前版本之间的全部变更，可跨多个版本；也可以随时在设置中查看所有版本的变更","children":[]}]},{"title":"Changed","items":[{"text":"面板打开时 **NRI** 按钮呈按下状态，悬停提示先说明点击的作用与快捷键，再显示请求数","children":[]}]}]},{"version":"0.3.0-beta.4","date":"2026-10-12","sections":[{"title":"Changed","items":[{"text":"配色、主题、显示 / 隐藏快捷键与更新相关设置收进工具栏右端的齿轮设置浮层，面板底部状态栏移除，列表可多显示一行","children":[]},{"text":"配色与主题改为在设置中直接选择，不再需要逐个点击切换","children":[]},{"text":"测试版开关改为 macOS 风格的开关；有可安装的新版本时齿轮上显示圆点","children":[]}]}]},{"version":"0.3.0-beta.3","date":"2026-10-11","sections":[{"title":"Added","items":[{"text":"面板底部新增 **Beta** 开关，可选择接收测试版：打开后立即检查一次，此后每天自动检查一次，发现新版本时弹出提示并可直接安装","children":[]}]},{"title":"Changed","items":[{"text":"安装地址统一为正式版地址，Tampermonkey 只自动安装正式版；不再提供单独的测试版安装地址，已安装测试版的用户如需继续接收测试版，请在面板底部打开 **Beta**","children":[]},{"text":"面板较窄时底部隐藏 “Show/Hide” 文字标签，快捷键与版本信息不再被截断","children":[]}]}]},{"version":"0.3.0-beta.2","date":"2026-10-11","sections":[{"title":"Changed","items":[{"text":"安装与更新地址迁移到 `https://updates.sower.site/network-request-inspector/`；已安装 0.3.0-beta.1 的用户需要从新地址重新安装一次，之后照常自动更新","children":[]}]}]},{"version":"0.3.0-beta.1","date":"2026-10-11","sections":[{"title":"Added","items":[{"text":"在线安装与自动更新：通过固定地址安装正式版，Tampermonkey 会定期检查并安装新版本","children":[]},{"text":"测试版通道：通过单独的地址安装测试版，正式版发布后测试版会自动升级到正式版","children":[]},{"text":"面板底部显示当前完整版本号，可手动检查更新，发现新版本时可直接安装","children":[]},{"text":"详情区显示状态码及原因短语、耗时、响应大小、开始时间与来源（Fetch / XHR），并分为响应体、响应头、请求三个视图","children":[]},{"text":"JSON 响应体以可折叠树展示，可切换为格式化源码；响应头与查询参数以键值表展示","children":[]},{"text":"复制为 cURL、复制 URL、复制响应体、复制全部可见请求","children":[]},{"text":"复制模式 Redacted / Raw：默认隐藏认证类请求头、Cookie、API Key、敏感 URL 参数，以及 JSON 和表单中名为 token、secret、password、key、session 等的字段；列表、详情与所有复制方式都遵循该模式","children":[]},{"text":"按 All / Failed 筛选，Failed 包含 4xx、5xx 与网络错误","children":[]},{"text":"按响应类型筛选（JSON、Doc、Text、JS、CSS、Img、Media、Font、Other），⌘ 点击可多选，没有对应请求的类型会变暗","children":[]},{"text":"多选请求：⌘ 点击切换、Shift 点击或 Shift + 方向键连续选择、⌘A 全选可见请求，可将所选请求按列表顺序复制为 Markdown、cURL 或 URL","children":[]},{"text":"右键菜单：复制请求与响应、复制为 cURL、复制 URL、复制响应体、复制全部可见请求、清空请求","children":[]},{"text":"键盘操作：方向键选择请求、← / → 切换详情视图、⌘C 复制、⌘F 聚焦筛选框、⌘K 清空、Esc 逐级退出；面板内的按键不会触发宿主页面的快捷键","children":[]},{"text":"显示 / 隐藏面板的全局快捷键，默认 `H`，可录制新组合、禁用或重置；在输入框中只响应带 ⌘ / Ctrl / ⌥ 的组合，与面板已占用的按键冲突时会被拒绝","children":[]},{"text":"VS Code 与 macOS 两套配色，各有深色与浅色变体，与主题切换相互独立","children":[]}]},{"title":"Changed","items":[{"text":"面板改为上方请求列表、下方可调整高度的详情区，取代在列表中展开详情的方式；面板高度不足时详情区自动收缩，工具栏、列表、详情头部与底部栏始终完整显示","children":[]},{"text":"面板最小高度提高到 260px","children":[]},{"text":"主题、配色、面板尺寸、垂直位置、详情高度、复制模式与显示 / 隐藏快捷键在所有网站间同步；面板的打开 / 隐藏状态仍按网站分别保存","children":[]},{"text":"面板始终使用自带的界面字体与等宽字体，不受宿主页面样式影响","children":[]},{"text":"操作提示改为跟随面板风格的通知横幅","children":[]}]},{"title":"Removed","items":[{"text":"紧凑密度开关，面板始终使用紧凑布局","children":[]}]},{"title":"Fixed","items":[{"text":"新请求到达时列表与详情的滚动位置不再跳动","children":[]},{"text":"页面包含 iframe 时不再出现多个面板；同时安装多个版本时只会启动一个","children":[]}]}]},{"version":"0.2.0","date":"2026-07-30","sections":[{"title":"Added","items":[{"text":"面板停靠在页面边缘，鼠标移到边缘时显示","children":[]},{"text":"在列表中展开请求即可预览详情","children":[]},{"text":"拖动面板左侧与顶部边缘调整面板尺寸，拖动详情区边缘调整详情高度，调整结果会被记住","children":[]},{"text":"主题可选深色、浅色或跟随系统，选择会被记住","children":[]},{"text":"紧凑密度开关","children":[]}]},{"title":"Changed","items":[{"text":"加宽请求方法列","children":[]},{"text":"打开 / 隐藏面板时不再有边缘滑动动画","children":[]},{"text":"面板开关按钮在深色与浅色主题下使用一致的半透明底色","children":[]}]},{"title":"Fixed","items":[{"text":"XHR 请求完成后请求体丢失","children":[]},{"text":"开关按钮可以上下拖动，展开或收起时不再跳动","children":[]}]}]},{"version":"0.1.0","date":"2026-07-21","sections":[{"title":"Added","items":[{"text":"拦截页面的 fetch 与 XHR 请求，在浮动面板中按时间列出","children":[]},{"text":"按 URL 模糊搜索请求","children":[]},{"text":"一键复制请求与响应（Markdown）","children":[]},{"text":"深色主题列表","children":[]}]}]}],"update":{"latest":{"manifestUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/update.json","installUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/main/dist/prod/network-request-inspector.user.js"},"beta":{"manifestUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/beta/dist/prod/update.json","installUrl":"https://raw.githubusercontent.com/sleepray/Web-api-mock/beta/dist/prod/network-request-inspector.user.js"}}};
(function(){let e={maxEntries:80,maxBodyChars:2e5,ignoreUrlPatterns:[/\.(js|css|map|png|jpe?g|gif|svg|webp|woff2?|ttf|ico)(\?|$)/i],panelDefaultCollapsed:!0,panelDefaultWidth:440,panelDefaultHeight:560,panelMinWidth:280,panelMinHeight:236,panelSizeStorageKey:`nri-panel-size`,panelDefaultBottom:16,panelMinBottom:8,panelOffsetStorageKey:`nri-panel-offset`,detailDefaultHeight:300,detailMinHeight:120,detailMaxHeight:720,detailHeightStorageKey:`nri-detail-height`,panelCollapsedStorageKey:`nri-panel-collapsed`,panelModeStorageKey:`nri-panel-mode`,panelDefaultTheme:`system`,panelThemeStorageKey:`nri-panel-theme`,panelDefaultPalette:`vscode`,panelPaletteStorageKey:`nri-panel-palette`,copyModeDefault:`redacted`,copyModeStorageKey:`nri-copy-mode`,toggleShortcutStorageKey:`nri-toggle-shortcut`,includeBetaStorageKey:`nri-include-beta`,betaCheckDateStorageKey:`nri-beta-check-date`,seenVersionStorageKey:`nri-seen-version`,languageStorageKey:`nri-language`,mockRulesStorageKey:`nri-mock-rules`,mockLegacyStorageKeys:[`__api_mock_err__`,`__fomo_mock_err__`],sessionRecordsStorageKey:`nri-session-records`,sessionRecordsBudgetChars:1e6},t=()=>{try{let e=globalThis;return e.__NRI_STORAGE_BRIDGE__??e.unsafeWindow?.__NRI_STORAGE_BRIDGE__??null}catch{return null}},n=()=>{try{return typeof GM_getValue==`function`}catch{return!1}},r=()=>{try{return typeof GM_setValue==`function`}catch{return!1}},i=e=>{if(e==null)return null;if(typeof e==`string`)return e;try{return JSON.stringify(e)}catch{return null}},a=e=>{try{return localStorage.getItem(e)}catch{return null}},o=(e,t)=>{try{localStorage.setItem(e,t)}catch{}};function s(e){if(n())try{let t=GM_getValue(e),n=i(t);if(n!==null)return n}catch{}let r=t();if(r!==null)try{let t=r.get(e),n=i(t);if(n!==null)return n}catch{}let o=a(e);return o===null?null:(c(e,o),o)}function c(e,n){if(r())try{GM_setValue(e,n)}catch{}let i=t();if(i!==null)try{i.set(e,n)}catch{}o(e,n)}let l=[`auto`,`en`,`zh`],u=`en`;function d(){try{let t=s(e.languageStorageKey);return l.includes(t)?t:`auto`}catch{return`auto`}}function f(t){try{c(e.languageStorageKey,t)}catch{}}function p(e,t=typeof navigator>`u`?[]:navigator.languages??[navigator.language]){return e===`auto`?(t.at(0)??``).toLowerCase().startsWith(`zh`)?`zh`:`en`:e}function m(e){u=e}function h(){return u}function g(e,t){return u===`zh`?t:e}let _=`[REDACTED]`,v=/* @__PURE__ */ new Set([`authorization`,`proxyauthorization`,`cookie`,`setcookie`,`apikey`,`xapikey`,`token`,`authtoken`,`xauthtoken`,`xsessiontoken`]),y=/* @__PURE__ */ new Set([`token`,`accesstoken`,`refreshtoken`,`idtoken`,`apikey`,`xapikey`,`key`,`secret`,`clientsecret`,`password`,`passwd`,`credential`,`session`,`sessionid`,`sid`]);function b(e){return e.toLowerCase().replace(/[^a-z0-9]/g,``)}function ee(e){return v.has(b(e))}function te(e){return y.has(b(e))}function ne(e){if(e===void 0)return``;for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.toLowerCase();return``}function x(e){if(e===void 0)return;let t={};for(let[n,r]of Object.entries(e))t[n]=ee(n)?_:r;return t}function S(e){try{let t=new URL(e),n=Array.from(t.searchParams.entries());if(!n.some(([e])=>te(e)))return e;t.search=``;for(let[e,r]of n)t.searchParams.append(e,te(e)?_:r);return t.href}catch{return e}}function C(e){if(Array.isArray(e))return e.map(C);if(typeof e!=`object`||!e)return e;let t={};for(let[n,r]of Object.entries(e))t[n]=te(n)?_:C(r);return t}function re(e){let t=new URLSearchParams(e),n=Array.from(t.entries());if(!n.some(([e])=>te(e)))return e;let r=new URLSearchParams;for(let[e,t]of n)r.append(e,te(e)?_:t);return r.toString()}function w(e,t){return typeof e==`string`?ne(t).includes(`application/x-www-form-urlencoded`)?re(e):e:C(e)}function ie(e){let t=x(e.requestHeaders),n=x(e.responseHeaders),r={...e,url:S(e.url),requestHeaders:t,responseHeaders:n,requestBody:w(e.requestBody,t),responseBody:w(e.responseBody,n)},i=e.mock?.real;if(e.mock!==void 0&&i!==void 0){let t=x(i.responseHeaders);r.mock={...e.mock,real:{...i,responseHeaders:t,responseBody:w(i.responseBody,t)}}}return r}function ae(e){if(e===void 0)return``;for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.toLowerCase();return``}function oe(e,t){if(typeof e==`object`&&e)return`json`;let n=String(e).trim().toLowerCase(),r=ae(t);return r.includes(`text/html`)||r.includes(`application/xhtml+xml`)||n.startsWith(`<!doctype html`)||n.startsWith(`<html`)?`html`:r.includes(`xml`)||n.startsWith(`<?xml`)||n.startsWith(`<svg`)?`xml`:`text`}function se(t,n){if(t==null)return{text:``,language:`text`,empty:!0,truncated:!1,totalChars:0};let r;try{r=typeof t==`string`?t:JSON.stringify(t,null,2)}catch{r=String(t)}let i=r.length,a=i>e.maxBodyChars;return{text:a?r.slice(0,e.maxBodyChars):r,language:a?`text`:oe(t,n),empty:!1,truncated:a,totalChars:i}}function ce(e){return e===void 0||Object.keys(e).length===0?`(none)`:Object.entries(e).map(([e,t])=>`${e}: ${t}`).join(`
`)}function le(e,t){return t===`redacted`?ie(e):e}function ue(e){return`\`${e.replace(/`/g,"\\`")}\``}function de(e,t){let n=e.match(/`+/g)??[],r=Math.max(3,...n.map(e=>e.length+1)),i="`".repeat(r);return`${i}${t}\n${e}\n${i}`}function fe(e){if(e.empty)return`*(empty)*`;let t=de(e.text,e.language);return e.truncated?`${t}\n\n> Truncated: ${e.totalChars} characters total.`:t}function pe(e){let t=se(e.requestBody,e.requestHeaders),n=[`- Method: ${ue(e.method)}`,`- URL: ${ue(e.url)}`,`- Source: ${ue(e.source)}`];return e.durationMs!==void 0&&n.push(`- Duration: ${e.durationMs}ms`),[`## Request`,``,...n,``,`### Headers`,``,de(ce(e.requestHeaders),`http`),``,`### Body`,``,fe(t)].join(`
`)}function me(e){let t=se(e.responseBody,e.responseHeaders);return[`## Response`,``,...e.status===void 0?e.error===void 0?[`- Status: *(pending)*`]:[`- Error: ${ue(e.error)}`]:[`- Status: ${e.status}`],``,`### Headers`,``,de(ce(e.responseHeaders),`http`),``,`### Body`,``,fe(t)].join(`
`)}function he(e,t=`redacted`){let n=le(e,t);return[pe(n),``,me(n)].join(`
`)}function ge(e,t=`redacted`){return e.map((n,r)=>`# Request ${r+1} of ${e.length}\n\n${he(n,t)}`).join(`

---

`)}function T(e){return`'${e.replace(/'/g,`'\\''`)}'`}function _e(e,t=`redacted`){let n=le(e,t),r=n.method.toUpperCase(),i=[`curl ${T(n.url)}`];r!==`GET`&&i.push(`-X ${r}`);for(let[e,t]of Object.entries(n.requestHeaders??{}))i.push(`-H ${T(`${e}: ${t}`)}`);let a=n.requestBody;if(a!=null&&a!==``){let e;try{e=typeof a==`string`?a:JSON.stringify(a)}catch{e=String(a)}i.push(`--data-raw ${T(e)}`)}return i.join(` \\
  `)}function E(e){if(e==null)return`—`;let t;try{t=typeof e==`string`?e:JSON.stringify(e)}catch{t=String(e)}let n=new TextEncoder().encode(t).length;return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(1)} MB`}let ve={200:`OK`,201:`Created`,202:`Accepted`,204:`No Content`,206:`Partial Content`,301:`Moved Permanently`,302:`Found`,303:`See Other`,304:`Not Modified`,307:`Temporary Redirect`,308:`Permanent Redirect`,400:`Bad Request`,401:`Unauthorized`,403:`Forbidden`,404:`Not Found`,405:`Method Not Allowed`,408:`Request Timeout`,409:`Conflict`,410:`Gone`,413:`Payload Too Large`,415:`Unsupported Media Type`,422:`Unprocessable Entity`,429:`Too Many Requests`,500:`Internal Server Error`,501:`Not Implemented`,502:`Bad Gateway`,503:`Service Unavailable`,504:`Gateway Timeout`};function ye(e){return ve[e]??``}function be(e){try{return Array.from(new URL(e,`http://localhost`).searchParams.entries())}catch{return[]}}function xe(e,t){return new Promise((n,r)=>{if(t!=null){let e=()=>{r(t.reason===void 0?new DOMException(`The user aborted a request.`,`AbortError`):t.reason)};if(t.aborted){e();return}t.addEventListener(`abort`,e,{once:!0})}e!==1/0&&setTimeout(n,e)})}function D(e){let t=e.trim().charAt(0);return t===`{`||t===`[`?`application/json`:`text/plain;charset=utf-8`}function O(e){return e===204||e===205||e===304}function k({status:e,body:t,url:n,ResponseCtor:r=Response}){let i=new r(O(e)?null:t,{status:e,statusText:ye(e),headers:{"content-type":D(t)}});try{Object.defineProperty(i,"url",{value:n})}catch{}return i}function Se(e,t){return e===0?{}:{"content-type":D(t)}}let Ce={status:0,body:``};function we(e){let t=e.XMLHttpRequest.prototype;function n(e){let n=Object.getOwnPropertyDescriptor(t,e)?.get;return e=>n===void 0?void 0:n.call(e)}let r=n(`readyState`),i=n(`status`),a=n(`statusText`),o=n(`response`),s=n(`responseText`),c=n(`responseURL`),l=n(`responseType`),u=n(`timeout`),d=t.getResponseHeader,f=t.getAllResponseHeaders;function p(t,n){switch(l(t)){case`json`:try{return JSON.parse(n)}catch{return null}case`blob`:return new(e.Blob??Blob)([n],{type:D(n)});case`arraybuffer`:return new(e.TextEncoder??TextEncoder)().encode(n).buffer;case`document`:return null;default:return n}}function m(e){try{let t=l(e);if(t===``||t===`text`||t===void 0)return s(e);if(t===`json`){let t=o(e);return t==null?void 0:JSON.stringify(t)}}catch{}}return{readReal(e){let t=``;try{t=f.call(e)}catch{}return{status:i(e)??0,body:m(e),headers:t}},readTimeout(e){return u(e)??0},mask(e,t,n,l){let u=()=>!l||r(e)===4,m=t.status===0,h=m?``:t.body,g=D(h);function _(t,n,r){Object.defineProperty(e,t,{configurable:!0,get:()=>u()?n():r(e)})}l||Object.defineProperty(e,"readyState",{configurable:!0,get:()=>4}),_(`status`,()=>t.status,i),_(`statusText`,()=>ye(t.status),a),_(`responseText`,()=>h,s),_(`response`,()=>p(e,h),o),_(`responseURL`,()=>m?``:n,c),e.getResponseHeader=t=>u()?!m&&t.toLowerCase()===`content-type`?g:null:d.call(e,t),e.getAllResponseHeaders=()=>u()?m?``:`content-type: ${g}\r\n`:f.call(e)}}}let Te=[`ANY`,`GET`,`POST`,`PUT`,`PATCH`,`DELETE`];function Ee(e){let t=typeof e==`number`?e:parseInt(String(e),10);return Number.isFinite(t)?Math.trunc(t):NaN}function De(e){let t=Ee(e);return t===0||t>=200&&t<=599}function Oe(){return Math.random().toString(36).slice(2,10)}function ke(e){let t=typeof e==`object`&&e?e:{},n=String(t.method??``).toUpperCase(),r=typeof t.orig==`object`&&t.orig!==null?t.orig:void 0,i={id:typeof t.id==`string`&&t.id!==``?t.id:Oe(),on:t.on!==!1,method:Te.includes(n)?n:`ANY`,match:typeof t.match==`string`?t.match:``,status:De(t.status)?Ee(t.status):500,body:typeof t.body==`string`?t.body:`{"code":500,"message":"Internal Server Error (mock)"}`,mode:t.mode===`rewrite`||t.mode===`hang`?t.mode:`block`,delay:Math.max(0,Ee(t.delay)||0),times:Math.max(0,Ee(t.times)||0),hits:Math.max(0,Ee(t.hits)||0)};return r!==void 0&&typeof r.body==`string`&&(i.orig={status:De(r.status)?Ee(r.status):200,body:r.body}),i}function A(e,t){let n=e.trim();if(n===``)return!1;if(n.startsWith(`re:`))try{return new RegExp(n.slice(3)).test(t)}catch{return!1}return t.includes(n)}function Ae(e){return e.times>0&&e.hits>=e.times}function je(e,t,n){return(e.method===`ANY`||e.method===t.toUpperCase())&&A(e.match,n)}function Me({rules:e,paused:t,method:n,url:r}){if(!t)return e.find(e=>e.on&&!Ae(e)&&je(e,n,r))}function j(e,t){return t?0:e.filter(e=>e.on&&e.match.trim()!==``&&!Ae(e)).length}function Ne(e){return e.mode===`rewrite`&&e.status===0?`block`:e.mode}let Pe,Fe=/* @__PURE__ */ new Set;function Ie(e){try{return localStorage.getItem(e)}catch{return null}}function Le(e){if(e!==null)try{let t=JSON.parse(e);if(typeof t!=`object`||!t)return;let{paused:n,rules:r}=t;return{paused:n===!0,rules:Array.isArray(r)?r.map(ke):[]}}catch{return}}function Re(){let t;for(let n of e.mockLegacyStorageKeys){let e=Le(Ie(n));if(e!==void 0){t??=e;try{localStorage.removeItem(n)}catch{}}}return t}function ze(){let t=Le(Ie(e.mockRulesStorageKey)),n=Re(),r=t??n??{paused:!1,rules:[]};return t===void 0&&n!==void 0&&M(r),r}function M(t){try{localStorage.setItem(e.mockRulesStorageKey,JSON.stringify(t))}catch{}}function N(){return Pe??=ze(),Pe}function P(e){Pe=e,M(e);for(let e of Fe)e()}function Be(){return N().rules}function Ve(){return N().paused}function He(e){return Fe.add(e),()=>{Fe.delete(e)}}function Ue(e){P({...N(),paused:e})}function We(e={}){let t=ke(e);return P({...N(),rules:[...N().rules,t]}),t}function Ge(e){let{rules:t}=N();t.some(t=>t.id===e.id)&&P({...N(),rules:t.map(t=>t.id===e.id?ke(e):t)})}function F(e){P({...N(),rules:N().rules.filter(t=>t.id!==e)})}function Ke(){P({...N(),rules:[]})}function qe(e){let{rules:t}=N();P({...N(),rules:t.map(t=>t.id===e?{...t,hits:t.hits+1}:t)})}function Je(e,t){try{let{rules:n,paused:r}=N();return r||n.length===0?void 0:Me({rules:n,paused:r,method:e,url:t})}catch{return}}function Ye(e,t){return N().rules.find(n=>je(n,e,t))}function Xe(){Pe=ze();for(let e of Fe)e()}function Ze(t=window){t.addEventListener(`storage`,t=>{t.key===e.mockRulesStorageKey&&Xe()})}let I=[],Qe=/* @__PURE__ */ new Set;function $e(){let e=I.slice();for(let t of Qe)t(e)}function et(){return I}function L(t){let n=I.findIndex(e=>e.id===t.id);n>=0?I=[...I.slice(0,n),t,...I.slice(n+1)]:(I=[t,...I],I.length>e.maxEntries&&(I=I.slice(0,e.maxEntries))),$e()}function tt(t){if(t.length===0)return;let n=new Set(I.map(e=>e.id));I=[...I,...t.filter(e=>!n.has(e.id))].slice(0,e.maxEntries),$e()}function nt(){I=[],$e()}function rt(e){return Qe.add(e),e(I.slice()),()=>{Qe.delete(e)}}let it=`nri-toast-style`,R=`nri-toast-container`,at=`dark`,ot=`vscode`;function st(e,t){at=e,ot=t;let n=document.getElementById(R);n!==null&&(n.dataset.nriTheme=e,n.dataset.nriPalette=t)}let ct={success:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m4.8 8.2 2.1 2.1 4.3-4.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,error:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m5.5 5.5 5 5m0-5-5 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,warning:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M8 4.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.4" r="1" fill="#fff"/></svg>`,info:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><circle cx="8" cy="4.8" r="1" fill="#fff"/><path d="M8 7.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`};function lt(){if(document.getElementById(it)!==null)return;let e=document.createElement(`style`);e.id=it,e.textContent=`
        /* macOS 通知横幅：右上角毛玻璃卡片，从右侧滑入 */
        #${R} {
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
        #${R}[data-nri-theme="light"] {
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
        #${R}[data-nri-palette="macos"] {
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
        #${R}[data-nri-theme="light"][data-nri-palette="macos"] {
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
        #${R} .nri-toast {
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
        #${R} .nri-toast * {
            margin: 0;
            padding: 0;
            font: inherit !important;
            letter-spacing: inherit !important;
            text-transform: inherit !important;
            color: inherit;
        }
        #${R} .nri-toast-show {
            opacity: 1;
            transform: none;
        }
        #${R} .nri-toast-icon {
            flex: 0 0 auto;
            width: 18px;
            height: 18px;
        }
        #${R} .nri-toast-icon svg {
            display: block;
            width: 100%;
            height: 100%;
        }
        #${R} .nri-toast-success .nri-toast-icon {
            color: var(--nri-toast-success);
        }
        #${R} .nri-toast-error .nri-toast-icon {
            color: var(--nri-toast-error);
        }
        #${R} .nri-toast-warning .nri-toast-icon {
            color: var(--nri-toast-warning);
        }
        #${R} .nri-toast-info .nri-toast-icon {
            color: var(--nri-toast-info);
        }
        @media (prefers-reduced-transparency: reduce) {
            #${R} .nri-toast {
                background: var(--nri-toast-opaque);
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            #${R} .nri-toast {
                transform: none;
                transition: opacity 0.2s ease;
            }
        }
    `,document.head.appendChild(e)}function ut(){let e=document.getElementById(R);if(e instanceof HTMLDivElement)return e;let t=document.createElement(`div`);return t.id=R,t.dataset.nriTheme=at,t.dataset.nriPalette=ot,t.setAttribute(`role`,`status`),t.setAttribute(`aria-live`,`polite`),document.documentElement.appendChild(t),t}function z(e,t,n=2500){lt();let r=ut(),i=document.createElement(`div`);i.className=`nri-toast nri-toast-${e}`;let a=document.createElement(`span`);a.className=`nri-toast-icon`,a.innerHTML=ct[e];let o=document.createElement(`span`);o.textContent=t,i.append(a,o),r.appendChild(i),i.offsetWidth,i.classList.add(`nri-toast-show`),window.setTimeout(()=>{i.classList.remove(`nri-toast-show`),window.setTimeout(()=>{i.remove()},300)},n)}async function dt(e){let t=navigator.clipboard;if(t!==void 0&&typeof t.writeText==`function`){await t.writeText(e);return}let n=document.createElement(`textarea`);n.value=e,n.style.cssText=`position:fixed;left:-9999px;top:-9999px;opacity:0;`,document.body.appendChild(n),n.focus(),n.select();let r=document.execCommand(`copy`);if(n.remove(),!r)throw Error(`Clipboard copy failed`)}function ft(){return typeof crypto<`u`&&typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function B(e){let t=e.trim();if(t.startsWith(`{`)&&t.endsWith(`}`)||t.startsWith(`[`)&&t.endsWith(`]`))try{return JSON.parse(t)}catch{return e}return e}function pt(e){if(e!==void 0){if(e instanceof Headers){let t={};return e.forEach((e,n)=>{t[n]=e}),t}return{...e}}}function mt(e,t){return t.some(t=>t.test(e))}function ht(){return globalThis.unsafeWindow??window}function gt(e,t){if(e==null)return;if(typeof e==`string`)return B(e);let n=t??ht();if(e instanceof URLSearchParams||n.URLSearchParams&&e instanceof n.URLSearchParams||Object.prototype.toString.call(e)===`[object URLSearchParams]`)return e.toString();if(typeof Blob<`u`&&e instanceof Blob||n.Blob&&e instanceof n.Blob||Object.prototype.toString.call(e)===`[object Blob]`||Object.prototype.toString.call(e)===`[object File]`){let t=e;return`[Blob type=${t.type||`unknown`} size=${t.size}]`}if(typeof FormData<`u`&&e instanceof FormData||n.FormData&&e instanceof n.FormData||Object.prototype.toString.call(e)===`[object FormData]`){let t=[];return e.forEach((e,n)=>{typeof e==`string`?t.push(`${n}=${e}`):t.push(`${n}=[File name=${e.name} size=${e.size}]`)}),t.join(`&`)}if(e instanceof ArrayBuffer||n.ArrayBuffer&&e instanceof n.ArrayBuffer||Object.prototype.toString.call(e)===`[object ArrayBuffer]`)return`[ArrayBuffer byteLength=${e.byteLength}]`;if(ArrayBuffer.isView(e)||n.ArrayBuffer?.isView&&n.ArrayBuffer.isView(e))return`[TypedArray byteLength=${e.byteLength}]`;try{return String(e)}catch{return`[unreadable body]`}}async function _t(e,t,n){let r=n??ht();if(e instanceof Request||r.Request&&e instanceof r.Request||Object.prototype.toString.call(e)===`[object Request]`){let n=e,i=(t?.method??n.method??`GET`).toUpperCase(),a=n.url,o=r.Headers??Headers,s=new o(n.headers);t?.headers!==void 0&&new o(t.headers).forEach((e,t)=>{s.set(t,e)});let c;if(t?.body!==void 0)c=gt(t.body,r);else try{let e=await n.clone().text();c=e===``?void 0:B(e)}catch{c=`[unreadable Request body]`}return{method:i,url:a,requestHeaders:pt(s),requestBody:c}}let i=typeof e==`string`?e:e instanceof URL||r.URL&&e instanceof r.URL?e.href:String(e),a=r.Headers??Headers;return{method:(t?.method??`GET`).toUpperCase(),url:new URL(i,location.href).href,requestHeaders:pt(t?.headers===void 0?void 0:new a(t.headers)),requestBody:gt(t?.body,r)}}function vt(e){let t={};for(let n of e.trim().split(/[\r\n]+/)){let e=n.indexOf(`:`);if(e<=0)continue;let r=n.slice(0,e).trim(),i=n.slice(e+1).trim();r!==``&&(t[r]=i)}return t}function yt(e){return e===void 0||e===``?void 0:B(e)}function bt(e,t){if(t?.signal!==void 0&&t.signal!==null)return t.signal;let n=e.signal;return typeof n==`object`&&n?n:void 0}async function xt({rule:e,base:t,input:n,init:r,originalFetch:i,pageWindow:a}){let o={...e},s=Ne(o),c={ruleId:o.id,mode:s},l=()=>Date.now()-t.startedAt;qe(o.id),L({...t,mock:c});try{let e=bt(n,r);if(s===`rewrite`){let t=i(n,r).then(async e=>{let t;try{t=yt(await e.text())}catch{t=`[unreadable response body]`}c.real={status:e.status,responseHeaders:pt(e.headers),responseBody:t}},e=>{c.real={error:e instanceof Error?e.message:String(e)}});await Promise.all([t,xe(o.delay,e)])}else await xe(s===`hang`?1/0:o.delay,e)}catch(e){throw L({...t,mock:c,durationMs:l(),error:`Aborted`}),e}if(o.status===0)throw L({...t,mock:c,durationMs:l(),error:`Failed to fetch`}),new a.TypeError(`Failed to fetch`);return L({...t,mock:c,durationMs:l(),status:o.status,responseHeaders:Se(o.status,o.body),responseBody:yt(o.body)}),k({status:o.status,body:o.body,url:t.url,ResponseCtor:a.Response})}function V(t){let n=t.fetch.bind(t);t.fetch=async(r,i)=>{let a=Date.now(),o=ft(),s;try{let e=await _t(r,i,t);s={id:o,method:e.method,url:e.url,startedAt:a,requestHeaders:e.requestHeaders,requestBody:e.requestBody,source:`fetch`}}catch{s={id:o,method:`GET`,url:String(r),startedAt:a,source:`fetch`}}let c=Je(s.method,s.url);if(c!==void 0)return xt({rule:c,base:s,input:r,init:i,originalFetch:n,pageWindow:t});if(mt(s.url,e.ignoreUrlPatterns))return n(r,i);L({...s});try{let e=await n(r,i),t;try{let n=await e.clone().text();t=n===``?void 0:B(n)}catch{t=`[unreadable response body]`}return L({...s,durationMs:Date.now()-a,status:e.status,responseHeaders:pt(e.headers),responseBody:t}),e}catch(e){throw L({...s,durationMs:Date.now()-a,error:e instanceof Error?e.message:String(e)}),e}}}function St(t){let n=t.XMLHttpRequest,r=n.prototype.open,i=n.prototype.send,a=n.prototype.setRequestHeader,o=n.prototype.abort,s=we(t),c=/* @__PURE__ */ new WeakMap;n.prototype.open=function(t,n,i,a,o){let s=typeof n==`string`?new URL(n,location.href).href:n.href;return c.set(this,{method:t.toUpperCase(),url:s,requestHeaders:{},id:ft(),startedAt:Date.now(),ignored:mt(s,e.ignoreUrlPatterns),aborted:!1,mockDone:!1}),r.call(this,t,n,i??!0,a,o)},n.prototype.setRequestHeader=function(e,t){let n=c.get(this);return n!==void 0&&(n.requestHeaders[e]=t),a.call(this,e,t)},n.prototype.abort=function(){let e=c.get(this);return e!==void 0&&(e.aborted=!0,e.onMockAbort?.()),o.call(this)};function l(e,n,r,a){let o={...r},c=Ne(o),l={ruleId:o.id,mode:c};qe(o.id),n.startedAt=Date.now(),n.requestBody=gt(a,t);let u=()=>({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,source:`xhr`,mock:l}),d=()=>({...u(),durationMs:Date.now()-n.startedAt}),f=(e,t=`Network error`)=>{L(e.status===0?{...d(),error:t}:{...d(),status:e.status,responseHeaders:Se(e.status,e.body),responseBody:yt(e.body)})};if(L(u()),c===`rewrite`)return s.mask(e,o,n.url,!0),e.addEventListener(`loadend`,()=>{if(n.aborted){L({...d(),error:`Aborted`});return}let t=s.readReal(e);l.real=t.status===0?{error:`Network error`}:{status:t.status,responseHeaders:vt(t.headers),responseBody:yt(t.body)},f(o)}),i.call(e,a);let p=r=>{if(n.aborted||n.mockDone)return;n.mockDone=!0;let i=r===`timeout`?Ce:o;s.mask(e,i,n.url,!1),f(i,r===`timeout`?`Timeout`:`Network error`),e.dispatchEvent(new t.Event(`readystatechange`)),e.dispatchEvent(new t.ProgressEvent(r)),e.dispatchEvent(new t.ProgressEvent(`loadend`))};n.onMockAbort=()=>{n.mockDone||(n.mockDone=!0,L({...d(),error:`Aborted`}))};let m=s.readTimeout(e);m>0&&(c===`hang`||o.delay>m)&&setTimeout(()=>p(`timeout`),m),c!==`hang`&&setTimeout(()=>p(o.status===0?`error`:`load`),o.delay)}n.prototype.send=function(e){let n=c.get(this);if(n===void 0)return i.call(this,e);let r=Je(n.method,n.url);if(r!==void 0)return l(this,n,r,e);if(n.ignored)return i.call(this,e);let a=Date.now();return n.startedAt=a,n.requestBody=gt(e,t),L({id:n.id,method:n.method,url:n.url,startedAt:a,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,source:`xhr`}),this.addEventListener(`loadend`,()=>{let e;try{let t=this.responseText;e=t===``?void 0:B(t)}catch{e=yt(s.readReal(this).body)??`[unreadable response body]`}L({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,status:this.status,responseHeaders:vt(this.getAllResponseHeaders()),responseBody:e,source:`xhr`})}),this.addEventListener(`error`,()=>{L({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,error:`Network error`,source:`xhr`})}),this.addEventListener(`abort`,()=>{L({id:n.id,method:n.method,url:n.url,startedAt:n.startedAt,durationMs:Date.now()-n.startedAt,requestHeaders:{...n.requestHeaders},requestBody:n.requestBody,error:`Aborted`,source:`xhr`})}),i.call(this,e)}}function Ct(){let e=ht();V(e),St(e)}function wt(e){if(e===void 0)return 0;if(typeof e==`string`)return e.length;try{return JSON.stringify(e)?.length??0}catch{return 1/0}}function Tt(e){return e.status!==void 0||e.error!==void 0}function H(t,n=e.sessionRecordsBudgetChars){let r=n;return t.filter(Tt).map(e=>{let t=x(e.requestHeaders),n=x(e.responseHeaders),i=wt(e.responseBody)+wt(e.mock?.real?.responseBody),a=i<=r;a&&(r-=i);let o={...e,url:S(e.url),requestHeaders:t,requestBody:w(e.requestBody,t),responseHeaders:n,responseBody:a?e.responseBody:void 0};if(e.mock?.real!==void 0){let t=x(e.mock.real.responseHeaders);o.mock={...e.mock,real:{...e.mock.real,responseHeaders:t,responseBody:a?e.mock.real.responseBody:void 0}}}return delete o.restored,o})}function Et(t,n=sessionStorage){let r=H(t);try{n.setItem(e.sessionRecordsStorageKey,JSON.stringify(r))}catch{try{n.setItem(e.sessionRecordsStorageKey,JSON.stringify(H(t,0)))}catch{}}}function Dt(e){if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.id==`string`&&typeof t.method==`string`&&typeof t.url==`string`&&typeof t.startedAt==`number`&&(t.source===`fetch`||t.source===`xhr`)}function Ot(t=sessionStorage){try{let n=JSON.parse(t.getItem(e.sessionRecordsStorageKey)??`[]`);return Array.isArray(n)?n.filter(Dt).slice(0,e.maxEntries).map(e=>({...e,restored:!0})):[]}catch{return[]}}let kt;function At(e){return e!==void 0&&e!==`separator`&&e.disabled!==!0}function jt(e,t,n){for(let r=1;r<=e.length;r++){let i=(t+n*r+e.length*2)%e.length;if(At(e[i]))return i}}function Mt(e,t,n){let r=t.length===1?(n??-1)+1:n??0,i=t.toLowerCase();for(let t=0;t<e.length;t++){let n=(r+t)%e.length,a=e[n];if(At(a)&&a.label.toLowerCase().startsWith(i))return n}}function Nt(){kt?.()}function Pt(){return kt!==void 0}function Ft(e,t,n,r){Nt();let i=document.activeElement instanceof HTMLElement?document.activeElement:void 0,a=document.createElement(`div`);a.className=`nri-menu`,a.setAttribute(`role`,`menu`),a.tabIndex=-1;let o=[],s,c=``,l,u=e=>{s=e,o.forEach((t,n)=>{t?.classList.toggle(`nri-menu-active`,n===e)})},d=e=>{kt===f&&(kt=void 0,window.removeEventListener(`pointerdown`,m,!0),window.removeEventListener(`contextmenu`,m,!0),window.removeEventListener(`blur`,h),window.removeEventListener(`resize`,h),window.removeEventListener(`scroll`,g,!0),window.clearTimeout(l),a.remove(),e&&i?.isConnected===!0&&i.focus({preventScroll:!0}))},f=()=>{d(!0)},p=e=>{let n=t[e];At(n)&&(d(!0),n.onSelect())};t.forEach((e,t)=>{if(e===`separator`){let e=document.createElement(`div`);e.className=`nri-menu-separator`,e.setAttribute(`role`,`separator`),a.appendChild(e),o.push(void 0);return}let n=document.createElement(`button`);n.type=`button`,n.className=`nri-menu-item`,n.tabIndex=-1,n.setAttribute(`role`,`menuitem`),n.disabled=e.disabled===!0,e.danger===!0&&n.classList.add(`nri-menu-danger`);let r=document.createElement(`span`);if(r.className=`nri-menu-label`,r.textContent=e.label,n.appendChild(r),e.shortcut!==void 0){let t=document.createElement(`span`);t.className=`nri-menu-shortcut`,t.textContent=e.shortcut,n.appendChild(t)}n.addEventListener(`pointermove`,()=>{At(e)&&s!==t&&u(t)}),n.addEventListener(`click`,e=>{e.stopPropagation(),p(t)}),a.appendChild(n),o.push(n)}),a.addEventListener(`pointerleave`,()=>{u(void 0)}),a.addEventListener(`contextmenu`,e=>{e.preventDefault()}),a.addEventListener(`keydown`,e=>{e.stopPropagation();let{key:n}=e;if(n===`ArrowDown`||n===`ArrowUp`){e.preventDefault();let r=n===`ArrowDown`?1:-1,i=s??(r===1?-1:t.length);u(jt(t,i,r))}else if(n===`Home`||n===`End`)e.preventDefault(),u(n===`Home`?jt(t,-1,1):jt(t,t.length,-1));else if(n===`Enter`||n===` `)e.preventDefault(),s!==void 0&&p(s);else if(n===`Escape`||n===`Tab`)e.preventDefault(),d(!0);else if(n.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault(),window.clearTimeout(l),c+=n,l=window.setTimeout(()=>{c=``},800);let r=Mt(t,c,s);r!==void 0&&u(r)}});let m=e=>{e.target instanceof Node&&a.contains(e.target)||d(!1)},h=()=>{d(!1)},g=e=>{e.target instanceof Node&&a.contains(e.target)||d(!1)};e.appendChild(a),kt=f;let _=a.getBoundingClientRect(),v=n,y=r;v+_.width>window.innerWidth-4&&(v=Math.max(4,n-_.width)),y+_.height>window.innerHeight-4&&(y=Math.max(4,r-_.height)),a.style.left=`${v}px`,a.style.top=`${y}px`,a.focus({preventScroll:!0}),window.setTimeout(()=>{kt===f&&(window.addEventListener(`pointerdown`,m,!0),window.addEventListener(`contextmenu`,m,!0),window.addEventListener(`blur`,h),window.addEventListener(`resize`,h),window.addEventListener(`scroll`,g,!0))},0)}let It=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function Lt(t){let n=Math.max(e.detailMinHeight,Math.floor(window.innerHeight*.6)),r=Math.min(e.detailMaxHeight,n);return Math.min(r,Math.max(e.detailMinHeight,Math.round(t)))}function Rt(){let t=e.detailDefaultHeight;try{let n=s(e.detailHeightStorageKey);if(n===null)return Lt(t);let r=JSON.parse(n);return typeof r==`object`&&r&&It(r.height)?Lt(r.height):It(r)?Lt(r):Lt(t)}catch{return Lt(t)}}function zt(t){try{c(e.detailHeightStorageKey,JSON.stringify({height:Lt(t)}))}catch{}}function Bt(e,t){let n=(n,r)=>{let i=document.createElement(`div`);return i.className=r,i.dataset.nriDetailResize=n,i.addEventListener(`pointerdown`,r=>{if(r.button!==0)return;r.preventDefault(),r.stopPropagation();let a=r.clientY,o=e(),s=r.pointerId;try{i.setPointerCapture(s)}catch{}let c=e=>{let r=n===`top`?a-e.clientY:e.clientY-a;t(Lt(o+r))},l=()=>{window.removeEventListener(`pointermove`,c),window.removeEventListener(`pointerup`,l),window.removeEventListener(`pointercancel`,l),document.body.style.removeProperty(`cursor`),document.body.style.removeProperty(`user-select`);try{i.releasePointerCapture(s)}catch{}zt(e())};document.body.style.cursor=`ns-resize`,document.body.style.userSelect=`none`,window.addEventListener(`pointermove`,c),window.addEventListener(`pointerup`,l),window.addEventListener(`pointercancel`,l)}),i};return{top:n(`top`,`nri-detail-resize nri-detail-resize-t`),bottom:n(`bottom`,`nri-detail-resize nri-detail-resize-b`)}}let Vt=e=>e===`redacted`||e===`raw`;function Ht(){try{let t=s(e.copyModeStorageKey);if(t===null)return e.copyModeDefault;let n=JSON.parse(t);if(typeof n==`object`&&n&&Vt(n.mode))return n.mode;if(Vt(n))return n}catch{}return e.copyModeDefault}function Ut(t){try{c(e.copyModeStorageKey,JSON.stringify({mode:t}))}catch{}}function Wt(e){if(e!==``)return new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),`gi`)}function Gt(e,t){return Array.from(e.matchAll(t),e=>[e.index,e.index+e[0].length])}function Kt(e){let t=e.parentElement;for(;t!==null&&t.tagName===`SPAN`;)t=t.parentElement;return t}function qt(e,t,n,r=1/0){let i=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(e){return e instanceof Element?e instanceof HTMLElement&&e.hidden||e.matches(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP:NodeFilter.FILTER_ACCEPT}}),a=[],o=null,s=[],c=()=>{if(s.length===0)return;let e=s.map(e=>e.data).join(``);for(let[n,i]of Gt(e,t)){if(a.length>=r)break;let e=Jt(s,n,!1),t=Jt(s,i,!0);if(e===void 0||t===void 0)continue;let o=document.createRange();o.setStart(e[0],e[1]),o.setEnd(t[0],t[1]),a.push(o)}s=[]};for(let e=i.nextNode();e!==null;e=i.nextNode()){if(!(e instanceof Text)||e.length===0)continue;let t=Kt(e);t!==o&&(c(),o=t),s.push(e)}return c(),a}function Jt(e,t,n){let r=t;for(let t of e){if(n?r<=t.length:r<t.length)return[t,r];r-=t.length}}function Yt(e,t){let n=t.getBoundingClientRect(),r=e.getBoundingClientRect();(n.top<r.top||n.bottom>r.bottom)&&(e.scrollTop+=n.top-r.top-(r.height-n.height)/2),(n.left<r.left||n.right>r.right)&&(e.scrollLeft+=n.left-r.left-(r.width-n.width)/2)}let Xt=/* @__PURE__ */ new WeakMap,Zt=/* @__PURE__ */ new WeakMap;function Qt(e,t){let n=document.createElement(`span`);return n.className=e,n.textContent=t,n}function $t(e){if(e===null)return[`nri-json-null`,`null`];switch(typeof e){case`string`:return[`nri-json-string`,JSON.stringify(e)];case`number`:case`bigint`:return[`nri-json-number`,String(e)];case`boolean`:return[`nri-json-boolean`,String(e)];default:return[`nri-json-null`,typeof e]}}function en(e){return e===void 0?[]:[Qt(`nri-json-key`,JSON.stringify(e)),Qt(`nri-json-punct`,`: `)]}function U(e){return e===void 0?``:`${JSON.stringify(e)}: `}function tn(e){if(typeof e==`object`&&e)return Array.isArray(e)?e.map((e,t)=>[String(t),e]):Object.entries(e)}function nn(e){return Array.isArray(e)?[`[`,`]`]:[`{`,`}`]}function rn(e,t,n,r){let i=r?``:`,`,a=tn(t);if(a===void 0){let n=document.createElement(`div`);return n.className=`nri-json-line`,n.append(...en(e),Qt(...$t(t)),Qt(`nri-json-punct`,i)),n}let o=Array.isArray(t),[s,c]=nn(t);if(a.length===0){let t=document.createElement(`div`);return t.className=`nri-json-line`,t.append(...en(e),Qt(`nri-json-punct`,`${s}${c}${i}`)),t}let l=document.createElement(`div`),u=document.createElement(`div`);u.className=`nri-json-line nri-json-toggle`;let d=document.createElement(`span`);d.className=`nri-json-chevron`,d.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;let f=o?`item`:`key`,p=document.createElement(`span`);p.className=`nri-json-tail`,p.append(Qt(`nri-json-summary`,g(`${a.length} ${f}${a.length===1?``:`s`}`,`${a.length} ${f===`key`?`个字段`:`项`}`)),Qt(`nri-json-punct`,`${c}${i}`)),u.append(d,...en(e),Qt(`nri-json-punct`,s),p);let m=document.createElement(`div`);m.className=`nri-json-children`;let h=document.createElement(`div`);h.className=`nri-json-line`,h.appendChild(Qt(`nri-json-punct`,`${c}${i}`));let _=0,v,y=()=>{let e=Math.min(a.length,_+200),t=document.createDocumentFragment();a.slice(_,e).forEach(([e,r],i)=>{let s=_+i;t.appendChild(rn(o?void 0:e,r,n+1,s===a.length-1))}),_=e,v?.remove(),m.appendChild(t),_<a.length&&(v=document.createElement(`button`),v.type=`button`,v.className=`nri-json-more`,v.textContent=g(`Show More (${a.length-_} remaining)`,`显示更多（还有 ${a.length-_} 项）`),v.addEventListener(`click`,y),m.appendChild(v))},b=e=>{e&&_===0&&y(),l.classList.toggle(`nri-json-open`,e),p.hidden=e,m.hidden=!e,h.hidden=!e};return u.addEventListener(`click`,()=>{(window.getSelection()?.toString()??``)===``&&b(!l.classList.contains(`nri-json-open`))}),Xt.set(l,{header:u,footer:h,revealChild:e=>{for(b(!0);_<=e&&_<a.length;)y();let t=m.children.item(e);return t instanceof HTMLElement?t:void 0}}),l.append(u,m,h),b(n<2),l}function an(e){if(typeof e==`string`){let t=document.createElement(`pre`);return t.className=`nri-source`,t.textContent=e,t}let t=document.createElement(`div`);return t.className=`nri-json`,t.appendChild(rn(void 0,e,0,!0)),Zt.set(t,e),t}function on(e,t,n){let r=[],i=(e,i,a)=>{let o=Math.min(Gt(e,t).length,n-r.length);for(let e=0;e<o;e++)r.push({path:i,part:a,occurrence:e})},a=(e,t,o,s)=>{if(r.length>=n)return;let c=o?``:`,`,l=tn(t);if(l===void 0){i(`${U(e)}${$t(t)[1]}${c}`,s,`line`);return}let[u,d]=nn(t);if(l.length===0){i(`${U(e)}${u}${d}${c}`,s,`line`);return}i(`${U(e)}${u}`,s,`header`);let f=Array.isArray(t);l.forEach(([e,t],n)=>{a(f?void 0:e,t,n===l.length-1,[...s,n])}),i(`${d}${c}`,s,`footer`)};return a(void 0,e,!0,[]),r}function sn(e,t,n){if(e instanceof HTMLElement&&Zt.has(e))return on(Zt.get(e),t,n)}function cn(e,{path:t,part:n}){let r=e.firstElementChild;for(let e of t)r=(r instanceof HTMLElement?Xt.get(r):void 0)?.revealChild(e)??null;if(!(r instanceof HTMLElement))return;if(n===`line`)return r;let i=Xt.get(r);if(i!==void 0)return n===`header`?i.header:(i.revealChild(0),i.footer)}function ln(e,t,n){if(e.length===0)return;let r=e.length-1;if(n===`first`)return e[0];if(n===`last`)return e[r];let i=t===void 0?-1:e.indexOf(t);return i<0?n===`next`?e[0]:e[r]:e[n===`next`?Math.min(r,i+1):Math.max(0,i-1)]}function un(e,t){return(W()?e.metaKey:e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(W()?!e.ctrlKey:!e.metaKey)&&e.key.toLowerCase()===t}function W(){if(typeof navigator>`u`)return!1;let e=navigator.userAgentData?.platform??navigator.platform;return/mac|iphone|ipad/i.test(e)}function G(e){return W()?`⌘${e.toUpperCase()}`:`Ctrl+${e.toUpperCase()}`}let dn={ids:/* @__PURE__ */ new Set,focusId:void 0,anchorId:void 0};function fn(e){return e===void 0?dn:{ids:/* @__PURE__ */ new Set([e]),focusId:e,anchorId:e}}function pn(e,t){let n=new Set(e.ids);if(!n.delete(t))return n.add(t),{ids:n,focusId:t,anchorId:t};let r=Array.from(n),i=e.focusId===t?r.at(-1):e.focusId;return{ids:n,focusId:i,anchorId:i}}function mn(e,t,n){if(n===void 0)return t;let r=e.indexOf(n);if(r<0)return t;let i=t.anchorId??t.focusId??n,a=e.indexOf(i);if(a<0)return fn(n);let[o,s]=a<=r?[a,r]:[r,a];return{ids:new Set(e.slice(o,s+1)),focusId:n,anchorId:i}}function hn(e,t){if(e.length===0)return dn;let n=t.focusId!==void 0&&e.includes(t.focusId)?t.focusId:e[0];return{ids:new Set(e),focusId:n,anchorId:n}}function gn(e,t){let n=new Set(e),r=new Set(Array.from(t.ids).filter(e=>n.has(e)));if(r.size===t.ids.size)return t;if(r.size===0)return dn;let i=t.focusId!==void 0&&r.has(t.focusId)?t.focusId:Array.from(r).at(-1);return{ids:r,focusId:i,anchorId:t.anchorId!==void 0&&n.has(t.anchorId)?t.anchorId:i}}function _n(){try{let t=localStorage.getItem(e.panelCollapsedStorageKey);if(t!==null){let e=JSON.parse(t);if(typeof e==`object`&&e&&typeof e.collapsed==`boolean`)return e.collapsed;if(typeof e==`boolean`)return e}let n=localStorage.getItem(e.panelModeStorageKey);if(n!==null){let e=JSON.parse(n);if(typeof e==`object`&&e&&typeof e.collapsed==`boolean`)return e.collapsed}}catch{}return e.panelDefaultCollapsed}function vn(t){try{localStorage.setItem(e.panelCollapsedStorageKey,JSON.stringify({collapsed:t}))}catch{}}let yn=e=>typeof e==`number`&&Number.isFinite(e);function bn(t,n){let r=e.panelMinBottom,i=Math.max(r,window.innerHeight-Math.max(1,n)-e.panelMinBottom);return Math.min(i,Math.max(r,Math.round(t)))}function xn(t){let n=e.panelDefaultBottom;try{let r=s(e.panelOffsetStorageKey);if(r===null)return bn(n,t);let i=JSON.parse(r);return typeof i!=`object`||!i||!yn(i.bottom)?yn(i)?bn(i,t):bn(n,t):bn(i.bottom,t)}catch{return bn(n,t)}}function Sn(t,n){try{c(e.panelOffsetStorageKey,JSON.stringify({bottom:bn(t,n)}))}catch{}}function Cn(e,t,n,r){let i=!1;e.addEventListener(`click`,e=>{i&&(i=!1,e.preventDefault(),e.stopImmediatePropagation())},!0),e.addEventListener(`pointerdown`,a=>{if(a.button!==0)return;let o=a.clientY,s=n(),c=!1,l=n=>{let a=o-n.clientY;if(!c){if(Math.abs(a)<4)return;c=!0,i=!0,e.setPointerCapture(n.pointerId),document.body.style.userSelect=`none`,document.body.style.cursor=`ns-resize`}r(bn(s+a,t()))},u=r=>{if(window.removeEventListener(`pointermove`,l),window.removeEventListener(`pointerup`,u),window.removeEventListener(`pointercancel`,u),document.body.style.removeProperty(`user-select`),document.body.style.removeProperty(`cursor`),c){try{e.releasePointerCapture(r.pointerId)}catch{}Sn(n(),t()),window.setTimeout(()=>{i=!1},0)}};window.addEventListener(`pointermove`,l),window.addEventListener(`pointerup`,u),window.addEventListener(`pointercancel`,u)})}let wn=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function Tn(t){let n=Math.max(e.panelMinWidth,window.innerWidth-32),r=Math.max(e.panelMinHeight,window.innerHeight-80);return{width:Math.min(n,Math.max(e.panelMinWidth,Math.round(t.width))),height:Math.min(r,Math.max(e.panelMinHeight,Math.round(t.height)))}}function En(){let t={width:e.panelDefaultWidth,height:e.panelDefaultHeight};try{let n=s(e.panelSizeStorageKey);if(n===null)return Tn(t);let r=JSON.parse(n);return typeof r!=`object`||!r||!wn(r.width)||!wn(r.height)?Tn(t):Tn({width:r.width,height:r.height})}catch{return Tn(t)}}function K(t){try{c(e.panelSizeStorageKey,JSON.stringify(Tn(t)))}catch{}}function Dn(e,t,n){let r=(e,r)=>{let i=document.createElement(`div`);return i.className=r,i.dataset.nriResize=e,i.addEventListener(`pointerdown`,r=>{if(r.button!==0)return;r.preventDefault(),r.stopPropagation();let i=t(),a={edge:e,startX:r.clientX,startY:r.clientY,startWidth:i.width,startHeight:i.height},o=t=>{let r=a.startX-t.clientX,i=a.startY-t.clientY;n(Tn({width:e===`top`?a.startWidth:a.startWidth+r,height:e===`left`?a.startHeight:a.startHeight+i}))},s=()=>{window.removeEventListener(`pointermove`,o),window.removeEventListener(`pointerup`,s),window.removeEventListener(`pointercancel`,s),document.body.style.removeProperty(`cursor`),document.body.style.removeProperty(`user-select`),K(t())};document.body.style.cursor=e===`left`?`ew-resize`:e===`top`?`ns-resize`:`nwse-resize`,document.body.style.userSelect=`none`,window.addEventListener(`pointermove`,o),window.addEventListener(`pointerup`,s),window.addEventListener(`pointercancel`,s)}),i};e.append(r(`left`,`nri-resize nri-resize-l`),r(`top`,`nri-resize nri-resize-t`),r(`top-left`,`nri-resize nri-resize-tl`))}let On=e=>e===`dark`||e===`light`||e===`system`;function kn(){try{let t=s(e.panelThemeStorageKey);if(t===null)return e.panelDefaultTheme;let n=JSON.parse(t);return typeof n==`object`&&n&&On(n.theme)?n.theme:On(n)?n:e.panelDefaultTheme}catch{return e.panelDefaultTheme}}function An(t){try{c(e.panelThemeStorageKey,JSON.stringify({theme:t}))}catch{}}function jn(e){return e===`dark`||e===`light`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`}let Mn=e=>e===`vscode`||e===`macos`;function Nn(){try{let t=s(e.panelPaletteStorageKey);if(t===null)return e.panelDefaultPalette;let n=JSON.parse(t),r=typeof n==`object`&&n?n.palette:n;return Mn(r)?r:e.panelDefaultPalette}catch{return e.panelDefaultPalette}}function Pn(t){try{c(e.panelPaletteStorageKey,JSON.stringify({palette:t}))}catch{}}let Fn=[{value:`json`,label:`JSON`,title:`JSON`},{value:`doc`,label:`Doc`,title:`HTML and XML documents`},{value:`text`,label:`Text`,title:`Plain text, CSV, and event streams`},{value:`js`,label:`JS`,title:`JavaScript`},{value:`css`,label:`CSS`,title:`Stylesheets`},{value:`img`,label:`Img`,title:`Images`},{value:`media`,label:`Media`,title:`Audio and video`},{value:`font`,label:`Font`,title:`Fonts`},{value:`other`,label:`Other`,title:`Binary, empty, pending, and failed responses`}],In=[[/\.json$/,`json`],[/\.(html?|xhtml|xml)$/,`doc`],[/\.(txt|csv|md)$/,`text`],[/\.(m?js|cjs)$/,`js`],[/\.css$/,`css`],[/\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/,`img`],[/\.(mp4|webm|ogg|mp3|wav|m4a|aac|flac|m3u8|mpd)$/,`media`],[/\.(woff2?|ttf|otf|eot)$/,`font`]];function q(e){if(e!==void 0){for(let[t,n]of Object.entries(e))if(t.toLowerCase()===`content-type`)return n.split(`;`)[0].trim().toLowerCase()}}function J(e){if(e.includes(`json`))return`json`;if(e.includes(`javascript`)||e.includes(`ecmascript`))return`js`;if(e===`text/css`)return`css`;if(e.startsWith(`image/`))return`img`;if(e.startsWith(`audio/`)||e.startsWith(`video/`)||e.includes(`mpegurl`)||e===`application/dash+xml`)return`media`;if(e.startsWith(`font/`)||e.includes(`font`))return`font`;if(e===`text/html`||e.includes(`xml`))return`doc`;if(e.startsWith(`text/`))return`text`}function Ln(e){let t;try{t=new URL(e,`http://localhost/`).pathname.toLowerCase()}catch{return}return In.find(([e])=>e.test(t))?.[1]}function Rn(e){let t=e.responseBody;if(typeof t==`object`&&t)return`json`;let n=q(e.responseHeaders);return(n===void 0?void 0:J(n))??Ln(e.url)??`other`}function zn(e,t){return t.getBoundingClientRect().top-e.getBoundingClientRect().top+e.scrollTop}function Bn(e){let t=e.scrollTop;for(let n of e.children){if(!(n instanceof HTMLElement))continue;let r=n.dataset.recordId;if(r===void 0)continue;let i=zn(e,n);if(i+n.offsetHeight>t)return{id:r,top:i}}return null}function Vn(e){let t=e.closest(`.nri-item`);return t instanceof HTMLElement?t.dataset.recordId:void 0}function Hn(e){let t=/* @__PURE__ */ new Map;for(let n of e.querySelectorAll(`.nri-detail-body`)){let e=Vn(n);e!==void 0&&t.set(e,{top:n.scrollTop,left:n.scrollLeft})}return t}function Un(e,t){for(let n of e.querySelectorAll(`.nri-detail-body`)){let e=Vn(n);if(e===void 0)continue;let r=t.get(e);r!==void 0&&(n.scrollTop=r.top,n.scrollLeft=r.left)}}function Wn(e,t){let n=e.scrollTop,r=Bn(e),i=Hn(e);if(t(),Un(e,i),r===null){e.scrollTop=n;return}let a=Array.from(e.children).find(e=>e instanceof HTMLElement&&e.dataset.recordId===r.id);e.scrollTop=a instanceof HTMLElement?n+(zn(e,a)-r.top):n}function Gn(e){let t=e.trim().charAt(0);return t===`{`||t===`[`}function Kn(e){if(!Gn(e))return``;try{return JSON.parse(e.trim()),``}catch(e){return e instanceof Error?e.message:String(e)}}let qn=[[`quote`,`quote`,`quotes`,`引号`],[`comma`,`missing comma`,`missing commas`,`补逗号`],[`extra`,`extra comma`,`extra commas`,`去掉多余的逗号`],[`bracket`,`bracket`,`brackets`,`补括号`],[`colon`,`colon`,`colons`,`补冒号`],[`other`,`other fix`,`other fixes`,`其它`]];function Jn(e){let t=qn.filter(([t])=>(e[t]??0)>0);return g(t.map(([t,n,r])=>`${e[t]} ${e[t]===1?n:r}`).join(`, `),t.map(([t,,,n])=>`${n} ${e[t]} 处`).join(`、`))}let Yn={'"':`"`,"\\":`\\`,"/":`/`,b:`\b`,f:`\f`,n:`
`,r:`\r`,t:`	`,"'":`'`};function Xn(e){return e===`"`?1:e===`“`||e===`”`?2:e===`'`?3:e===`‘`||e===`’`?4:0}function Zn(e){let t=e.length,n={},r=0;function i(e){n[e]=(n[e]??0)+1}function a(){for(;;){for(;r<t&&/\s/.test(e[r]);)r++;if(e[r]===`/`&&e[r+1]===`/`){for(;r<t&&e[r]!==`
`;)r++;i(`other`)}else if(e[r]===`/`&&e[r+1]===`*`){let n=e.indexOf(`*/`,r+2);r=n<0?t:n+2,i(`other`)}else return}}function o(){let n=Xn(e[r]);e[r]!==`"`&&i(`quote`),r++;let a=``;for(;;){let o=e[r];if(r>=t||o===`
`||o===`\r`){let n=r>=t?/[\s}\],]/:/[ \t,]/,o=r-1;for(;o>=0&&n.test(e[o]);)o--;return a=a.slice(0,Math.max(0,a.length-(r-1-o))),r=o+1,i(`quote`),a}let s=Xn(o);if(s!==0&&(s===n||s===n-1&&(n===2||n===4)))return r++,a;if(o===`\\`){let t=e[r+1],n=e.slice(r+2,r+6);if(t===`u`&&/^[0-9a-fA-F]{4}$/.test(n)){a+=String.fromCharCode(parseInt(n,16)),r+=6;continue}if(t!==void 0&&Object.prototype.hasOwnProperty.call(Yn,t)){a+=Yn[t],r+=2;continue}a+=t??``,r+=2,i(`other`)}else a+=o,r++}}function s(){let n=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=[ \t])/.exec(e.slice(r,r+64));if(n!==null){let e=n[0];return r+=e.length,e===`true`||e===`false`?e===`true`:e===`null`?null:Number(e)}let a=r;for(;r<t&&!/[,\]}\n\r"]/.test(e[r]);)r++;let o=e.slice(a,r).trim();if(o===``)throw Error(`empty value`);if(e[r]===`"`&&/^"[ \t]*([,}\]\n\r]|$)/.test(e.slice(r,r+40)))return r++,i(`quote`),o;if(o===`true`||o===`false`)return o===`true`;if(o===`null`)return null;if(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(o))return Number(o);let s=o.toLowerCase();return s===`true`||s===`false`?(i(`other`),s===`true`):s===`null`||s===`none`||s===`nil`||s===`undefined`?(i(`other`),null):/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(o)?(i(`other`),Number(o)):(i(`quote`),o)}function c(){let n=r;for(;r<t&&!/[:=\n\r,}\]]/.test(e[r]);)r++;return e.slice(n,r).trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,``)}function l(t){if(t>200)throw Error(`too deep`);a();let n=e[r];return n===`{`?u(t):n===`[`?d(t):Xn(n)===0?s():o()}function u(n){let s={};for(r++;;){let u=r;if(a(),r>=t)return i(`bracket`),s;let d=e[r];if(d===`}`)return r++,s;if(d===`]`)return i(`bracket`),s;if(d===`,`){r++,i(`extra`);continue}let f;if(Xn(d)!==0)f=o();else{if(f=c(),f===``){r++,i(`other`);continue}i(`quote`)}a(),e[r]===`:`?r++:(e[r]===`=`&&(r+=e[r+1]===`>`?2:1),i(`colon`)),a();let p;r>=t||e[r]===`,`||e[r]===`}`||e[r]===`]`?(p=null,i(`other`)):p=l(n+1),Object.defineProperty(s,f,{value:p,enumerable:!0,writable:!0,configurable:!0}),a(),e[r]===`,`?(r++,a(),(e[r]===`}`||r>=t)&&i(`extra`)):r<t&&e[r]!==`}`&&e[r]!==`]`&&i(`comma`),r===u&&r++}}function d(n){let o=[];for(r++;;){let s=r;if(a(),r>=t)return i(`bracket`),o;let c=e[r];if(c===`]`)return r++,o;if(c===`}`)return i(`bracket`),o;c===`,`?(r++,i(`extra`)):c===`:`?(r++,i(`other`)):(o.push(l(n+1)),a(),e[r]===`,`?(r++,a(),(e[r]===`]`||r>=t)&&i(`extra`)):r<t&&e[r]!==`]`&&e[r]!==`}`&&i(`comma`),r===s&&r++)}}let f;try{if(a(),e[r]!==`{`&&e[r]!==`[`)return;for(f=l(0),a();r<t&&/[\]}\s,;]/.test(e[r]);)/\s/.test(e[r])||i(`other`),r++;if(r<t)return}catch{return}return{text:JSON.stringify(f,null,2),fixes:n,summary:Jn(n)}}function Qn(e){let t=e.trim();if(!Gn(t))return{error:g(`The body is not JSON, so there is nothing to format`,`响应体不是 JSON，没有可以排版的`)};try{return{text:JSON.stringify(JSON.parse(t),null,2)}}catch{let e=Zn(t);return e===void 0?{error:g(`This JSON cannot be repaired automatically; fix it by hand`,`这段 JSON 自动修不了，得照着提示手动改`)}:{text:e.text,fixed:e.summary}}}function $n(e){try{return JSON.stringify(JSON.parse(e),null,2)}catch{return e}}function er(e){if(e===void 0)return``;if(e!==`[unreadable response body]`){if(typeof e==`string`)return $n(e);try{return JSON.stringify(e,null,2)}catch{return}}}function tr(e){let t=e.mock===void 0?e:e.mock.real;if(t===void 0||t.status===void 0||t.status===0)return;let n=er(t.responseBody);return n===void 0?void 0:{status:t.status,body:n}}function nr(e,t){for(let n of e){if(!je(t,n.method,n.url))continue;let e=tr(n);if(e!==void 0)return e}}function rr(e,t){try{let n=new URL(e,t);return`${n.origin===t?``:n.origin}${n.pathname}`}catch{return e}}function ir({record:e,records:t,pageOrigin:n}){let r=e.method.toUpperCase(),i=rr(e.url,n),a={method:r,match:i},o=tr(e)??t.map(tr).find((e,a)=>e!==void 0&&t[a].method.toUpperCase()===r&&rr(t[a].url,n)===i);return o!==void 0&&(a.status=o.status,a.body=o.body,a.orig=o),a}function ar(e,t){let n=t===`}`?`{`:`[`,r=0,i=!1;for(let a=0;a<e.length;a++){let o=e[a];i?o===`\\`?a++:(o===`"`||o===`
`)&&(i=!1):o===`"`?i=!0:o===n?r++:o===t&&r--}return r<=0}function or({value:e,start:t,end:n},{key:r,shiftKey:i}){if(e.trim()!==``&&!/^\s*[[{]/.test(e))return;let a=t!==n,o=e.charAt(t-1),s=e.charAt(n),c=e.slice(e.lastIndexOf(`
`,t-1)+1,t),l=(c.replace(/\\./g,``).match(/"/g)??[]).length%2==1,u=s===``||/[\s,\]}:]/.test(s);if(r===`Tab`&&!i)return{kind:`insert`,text:`  `};if(r===`Enter`&&!i){let e=/^[ \t]*/.exec(c)?.[0]??``,t=/[[{][ \t]*$/.test(c),n=t&&!a&&(s===`}`||s===`]`);return{kind:`insert`,text:`\n${e}${t?`  `:``}${n?`\n${e}`:``}`,caretBack:n?e.length+1:void 0}}if(r===`Backspace`){let e=o+s;return!a&&(e===`""`||e===`{}`||e===`[]`)?{kind:`insert`,text:``,select:[t-1,t+1]}:void 0}if(r===`"`)return o===`\\`?void 0:a?{kind:`insert`,text:`"${e.slice(t,n)}"`}:l?s===`"`?{kind:`move`,to:t+1}:void 0:u?{kind:`insert`,text:`""`,caretBack:1}:void 0;if(r===`{`||r===`[`){if(l)return;let i=r===`{`?`}`:`]`;return a?{kind:`insert`,text:`${r}${e.slice(t,n)}${i}`}:u?{kind:`insert`,text:`${r}${i}`,caretBack:1}:void 0}if((r===`}`||r===`]`)&&!a&&s===r&&!l&&ar(e,r))return{kind:`move`,to:t+1}}let sr=/("(?:[^"\\\n]|\\.)*"?)(\s*:)?|(?<![\w.])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w.])|\b(true|false)\b|\b(null)\b|([{}[\],:])/g;function cr(e){return e.replace(/[&<>]/g,e=>e===`&`?`&amp;`:e===`<`?`&lt;`:`&gt;`)}function lr(e,t){return`<span class="nri-json-${e}">${cr(t)}</span>`}function ur(e){let t=``,n=0;for(let r of e.matchAll(sr)){let i=r.index;t+=cr(e.slice(n,i));let[a,o,s,c,l,u,d]=r;o===void 0?c===void 0?l===void 0?u===void 0?d!==void 0&&(t+=lr(`punct`,d)):t+=lr(`null`,u):t+=lr(`boolean`,l):t+=lr(`number`,c):(t+=lr(s===void 0?`string`:`key`,o),s!==void 0&&(t+=cr(s.slice(0,-1))+lr(`punct`,`:`))),n=i+a.length}return t+cr(e.slice(n))}function dr(){let e=g(`the body becomes an error payload`,`响应体换成对应的报错内容`);return[{label:`500`,status:500,title:g(`Internal Server Error; ${e}`,`服务器内部错误，${e}`)},{label:`502`,status:502,title:g(`Bad Gateway; ${e}`,`网关错误，${e}`)},{label:`504`,status:504,title:g(`Gateway Timeout; ${e}`,`网关超时，${e}`)},{label:`401`,status:401,title:g(`Unauthorized or session expired; ${e}`,`未登录或登录失效，${e}`)},{label:`403`,status:403,title:g(`Forbidden; ${e}`,`没有权限，${e}`)},{label:g(`Offline`,`断网`),status:0,title:g(`Network error: the request never reaches the server`,`网络错误：请求发不出去`)},{label:g(`Slow 3s`,`慢 3 秒`),delay:3e3,title:g(`Keep everything else and respond after 3 seconds`,`其它不变，等 3 秒再返回`)},{label:g(`Empty list`,`空列表`),empty:!0,title:g(`Respond 200 with the lists in the body emptied (needs the captured response)`,`返回 200，把响应体里的列表清空（需要先带入真实返回）`)},{label:g(`Never respond`,`不返回`),hang:!0,title:g(`Leave the request pending to check loading states and the page's own timeout`,`请求一直挂着：看加载中的样子和前端自己的超时处理`)}]}function fr(e,t){let n=!1;try{let t=JSON.parse(e);n=typeof t==`object`&&!!t&&typeof t.code==`string`}catch{}let r=ye(t);return JSON.stringify({code:n?String(t):t,message:`${r===``?`Error`:r} (mock)`},null,2)}let pr=/^(total|count|totalCount|totalElements|totalPages)$/i;function mr(e){let t;try{t=JSON.parse(e)}catch{return}if(Array.isArray(t))return`[]`;if(typeof t!=`object`||!t)return;let n=0;function r(e,t){for(let i of Object.keys(e)){let a=e[i];Array.isArray(a)?(e[i]=[],n+=1):typeof a==`object`&&a?t<2&&r(a,t+1):typeof a==`number`&&pr.test(i)&&(e[i]=0)}}return r(t,1),n>0?JSON.stringify(t,null,2):void 0}function hr(e,t){if(t.hang===!0)return{rule:{...e,mode:`hang`}};let n={...e};if(t.empty===!0){let t=mr(e.body);if(t===void 0)return{error:g(`No list found in the response body. Create the rule from a captured request, then use Empty list.`,`响应体里没找到列表。先从抓到的请求建规则，再点「空列表」。`)};n.status=200,n.body=t}return n.mode===`hang`&&(n.mode=`block`),t.status!==void 0&&(n.status=t.status,t.status>=400&&(n.body=fr(e.body,t.status))),t.delay!==void 0&&(n.delay=t.delay),{rule:n}}function gr(e,t){let n=e.orig??t;return n===void 0?{error:g(`No original response for this request yet. Disable the rule, let the page make the real request once, then reset.`,`还没有这个接口的真实返回。先取消勾选这条规则，让页面真实请求一次，再点「复原」。`)}:{rule:{...e,status:n.status,body:n.body,mode:`block`,delay:0,orig:n}}}function _r(){return[{value:`block`,label:g(`Block`,`拦截`),title:g(`Not sent to the server; the page gets the rule's response`,`不发到服务器，页面直接拿到规则的返回`)},{value:`rewrite`,label:g(`Pass through`,`放行`),title:g(`Really sent and executed; only the response the page sees is replaced`,`真的发出并执行，只把页面看到的返回换掉`)},{value:`hang`,label:g(`Hang`,`挂起`),title:g(`Not sent and never answered`,`不发，也一直不返回`)}]}function vr(e){return e===`rewrite`?g(`pass-through`,`放行`):e===`hang`?g(`hang`,`挂起`):g(`block`,`拦截`)}function yr(e){let t=e;return`
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
        /* 方法、状态码和请求列表同色：GET 绿、POST/PUT/PATCH 橙、DELETE 红；2xx 绿、3xx 蓝、其它红 */
        ${t} .nri-field.nri-method-GET,
        ${t} .nri-field.nri-tone-success {
            color: var(--nri-green) !important;
        }
        ${t} .nri-field.nri-method-POST,
        ${t} .nri-field.nri-method-PUT,
        ${t} .nri-field.nri-method-PATCH {
            color: var(--nri-orange) !important;
        }
        ${t} .nri-field.nri-method-DELETE,
        ${t} .nri-field.nri-tone-error {
            color: var(--nri-red) !important;
        }
        ${t} .nri-field.nri-tone-info {
            color: var(--nri-blue) !important;
        }
        ${t} select.nri-field.nri-method,
        ${t} .nri-field.nri-rule-status {
            font-weight: 600;
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
            font-size: 11px;
        }
        ${t} .nri-rule-bodyhead .nri-rule-find-btn {
            margin-left: auto;
        }
        /* 树视图：和编辑框同样的框，内容是详情区那棵可折叠的 JSON 树（只读） */
        ${t} .nri-rule-treebox {
            min-height: 44px;
            padding: 6px 8px;
            overflow: auto;
            resize: vertical;
            border-radius: 6px;
            background: var(--nri-window);
            box-shadow: inset 0 0 0 1px var(--nri-separator);
            outline: none;
            user-select: text;
            scrollbar-color: var(--nri-scrollbar-thumb) transparent;
        }
        ${t} .nri-rule-findbar {
            margin: 0 0 4px;
        }
        /* 查找命中的颜色和详情区一致：全部黄色，当前一处橙色 */
        ${t} ::highlight(nri-rule-find) {
            background-color: #ffe066;
            color: #1d1d1f;
        }
        ${t} ::highlight(nri-rule-find-current) {
            background-color: #ff9f0a;
            color: #000000;
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
        /* 编辑框本身的字透明，底下垫一层着了色的同样文字，颜色和详情区的 JSON 一致。
           两层的字体、字号、行高、内边距、tab 宽必须完全相同，否则字会错位 */
        /* 响应体和详情区一样直接铺在面板底色上（不用输入框的灰色填充），加一圈细线表示可编辑 */
        ${t} .nri-rule-editor {
            position: relative;
            border-radius: 6px;
            background: var(--nri-window);
            box-shadow: inset 0 0 0 1px var(--nri-separator);
        }
        ${t} .nri-rule-hl {
            position: absolute;
            inset: 0;
            margin: 0;
            /* 右、下多留的内边距让着色层能滚到和编辑框一样远（编辑框有滚动条占位） */
            padding: 6px 24px 24px 8px;
            overflow: hidden;
            border-radius: 6px;
            color: var(--nri-label);
            font-size: 11px;
            line-height: 1.5;
            white-space: pre;
            tab-size: 4;
            pointer-events: none;
        }
        /* 面板给所有元素都强制了界面字体（!important），着色层和里面的 span 要同样强制回等宽，
           字距、连字、渲染方式也和编辑框对齐 */
        ${t} .nri-rule-hl,
        ${t} .nri-rule-hl *,
        ${t} .nri-rule-editor textarea.nri-rule-body {
            font-family: var(--nri-font-mono) !important;
            font-kerning: none;
            font-variant-ligatures: none;
            text-rendering: auto;
        }
        ${t} .nri-rule-editor textarea.nri-rule-body {
            position: relative;
            background: transparent !important;
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
            caret-color: var(--nri-label);
            tab-size: 4;
        }
        ${t} .nri-rule-editor textarea.nri-rule-body::selection {
            background: color-mix(in srgb, var(--nri-blue) 28%, transparent);
        }
        ${t} .nri-rule-editor textarea.nri-rule-body::placeholder {
            color: var(--nri-label-tertiary) !important;
            -webkit-text-fill-color: var(--nri-label-tertiary) !important;
        }
        /* 太长的响应体不着色，直接显示编辑框自己的字，免得每敲一个键都重排几十万字 */
        ${t} .nri-rule-editor.nri-plain .nri-rule-hl {
            display: none;
        }
        ${t} .nri-rule-editor.nri-plain textarea.nri-rule-body {
            color: var(--nri-label) !important;
            -webkit-text-fill-color: var(--nri-label) !important;
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
    `}function Y(e,t,n){let r=document.createElement(e);return t!==void 0&&(r.className=t),n!==void 0&&(r.textContent=n),r}function X(e,t,n,r){let i=Y(`button`,e,t);return i.type=`button`,i.title=n,i.addEventListener(`click`,r),i}let br=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>`,xr=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7"/><path d="M8 12h12"/><path d="M8 19h12"/><path d="M6 5v14"/><path d="M6 12h2"/><path d="M6 19h2"/></svg>`,Sr=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12"/><path d="M18 6 6 18"/></svg>`;function Cr(e,t,n,r){let i=X(e,``,n,r);return i.innerHTML=t,i.setAttribute(`aria-label`,n),wr(i),i}function wr(e){e.addEventListener(`mousedown`,e=>{e.preventDefault()})}function Tr(e,t){let n=Y(`button`,`nri-switch`);return n.type=`button`,n.setAttribute(`role`,`switch`),n.title=e,n.setAttribute(`aria-label`,e),wr(n),n.addEventListener(`click`,()=>t(n.getAttribute(`aria-checked`)!==`true`)),{el:n,set:e=>{n.setAttribute(`aria-checked`,e?`true`:`false`)}}}function Er(e,t,n){let r=Y(`div`,`nri-segmented`);r.setAttribute(`role`,`group`),r.setAttribute(`aria-label`,e);let i=t.map(e=>{let t=Y(`button`,`nri-segment`,e.label);return t.type=`button`,t.dataset.value=e.value,t.title=e.title,wr(t),t.addEventListener(`click`,()=>{t.getAttribute(`aria-pressed`)!==`true`&&n(e.value)}),r.appendChild(t),t});return{el:r,set:e=>{for(let t of i)t.setAttribute(`aria-pressed`,t.dataset.value===e?`true`:`false`)}}}function Dr(e){return e>0&&e<300?`success`:e>=300&&e<400?`info`:`error`}let Or=1e3,kr=`button, svg, .nri-json-tail`;function Ar(e){try{let t=JSON.parse(e);return typeof t==`object`&&t?t:void 0}catch{return}}let jr=typeof CSS<`u`&&`highlights`in CSS?CSS.highlights:void 0;function Mr(e,t){let n=[],r=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);for(let e=r.nextNode();e!==null;e=r.nextNode())e instanceof Text&&n.push(e);let i=[],a=0,o=0;function s(e,t){for(;a<n.length;){let r=n[a];if(r===void 0)return;if(t?e<=o+r.length:e<o+r.length)return[r,e-o];o+=r.length,a+=1}}for(let[e,n]of t){let t=s(e,!1),r=s(n,!0);if(t===void 0||r===void 0)break;let a=document.createRange();a.setStart(t[0],t[1]),a.setEnd(r[0],r[1]),i.push(a)}return i}function Z(e){return e.times>0?g(`Hits ${e.hits} / ${e.times}${Ae(e)?` — spent`:``}`,`已命中 ${e.hits} / ${e.times}${Ae(e)?`，已用完`:``}`):g(`Hits ${e.hits}`,`已命中 ${e.hits} 次`)}function Nr(e){if(e===`rewrite`)return{text:g(`The request is really sent and executed; only the response the page sees is replaced. Orders, payments and approvals still take effect.`,`请求会真的发到服务器并执行，页面只是看到被改过的返回。下单、支付、审批这类接口照样会真的生效。`),danger:!0};if(e===`hang`)return{text:g(`The request is not sent and never completes: use it to check loading states and the page's own timeout. Status, body and delay are ignored.`,`请求不发到服务器，页面会一直等：用来看加载中的样子和前端自己的超时提示。状态码、响应体、延迟这时都不起作用。`),danger:!1}}function Pr(e,t){if(t.kind===`move`){e.setSelectionRange(t.to,t.to);return}t.select!==void 0&&e.setSelectionRange(t.select[0],t.select[1]);let n=!1;try{n=document.execCommand(t.text===``?`delete`:`insertText`,!1,t.text)}catch{}if(n||(e.setRangeText(t.text,e.selectionStart,e.selectionEnd,`end`),e.dispatchEvent(new Event(`input`))),t.caretBack!==void 0){let n=e.selectionStart-t.caretBack;e.setSelectionRange(n,n)}}function Fr(e,t,n){let r=e,i=!1;function a(e,t=!1){r={...r,...e},i=t,Ge(r),i=!1}let o=Y(`div`,`nri-rule`),s=Tr(g(`Enable this rule`,`启用这条规则`),e=>a({on:e})),c=Y(`select`,`nri-field`);c.title=g(`Request method`,`请求方法`);for(let e of Te){let t=Y(`option`,void 0,e);t.value=e,c.appendChild(t)}c.addEventListener(`change`,()=>a({method:c.value}));function l(){c.className=`nri-field nri-method nri-method-${c.value}`}let u=Y(`input`,`nri-field nri-field-grow`);u.type=`text`,u.spellcheck=!1,u.autocomplete=`off`,u.placeholder=g(`Part of the URL, e.g. /api/transfers; start with re: for a regex`,`URL 里包含的一段，如 /api/transfers；以 re: 开头按正则匹配`),u.title=u.placeholder,u.setAttribute(`aria-label`,g(`URL match`,`URL 匹配`)),u.addEventListener(`input`,()=>a({match:u.value}));let d=X(`nri-close-btn`,``,g(`Delete this rule`,`删除这条规则`),()=>F(r.id));d.innerHTML=Sr,d.setAttribute(`aria-label`,d.title),wr(d);let f=Y(`div`,`nri-rule-row`);f.append(s.el,c,u,d);function p(e,t){let n=Y(`input`,`nri-field nri-field-num`);return n.type=`number`,n.min=`0`,n.title=t,n.addEventListener(`change`,()=>{let t=ke({...r,[e]:n.value})[e];n.value=String(t),a({[e]:t})}),n}let m=p(`status`,g(`HTTP status, 200–599; 0 = network error`,`HTTP 状态码，200–599；0 = 网络错误`));function h(){let e=Number(m.value);m.className=`nri-field nri-field-num nri-rule-status nri-tone-${Dr(Number.isFinite(e)?e:0)}`}m.addEventListener(`input`,h);let _=p(`delay`,g(`Wait this many milliseconds before responding`,`等多少毫秒再返回`)),v=p(`times`,g(`Apply at most this many times, then let requests through; 0 = no limit`,`最多命中几次，之后放行；0 = 不限`)),y=Er(g(`Mode`,`模式`),_r(),e=>a({mode:e},!0)),b=Y(`span`,`nri-rule-hits`),ee=X(`nri-text-btn`,g(`Reset`,`清零`),g(`Set the hit count back to 0`,`命中次数清零`),()=>a({hits:0})),te=Y(`div`,`nri-rule-row`);te.append(Y(`span`,`nri-rule-label`,g(`Respond`,`返回`)),m,y.el,b,ee);let ne=Y(`div`,`nri-rule-row`);ne.append(Y(`span`,`nri-rule-label`,g(`Delay`,`延迟`)),_,Y(`span`,`nri-rule-label`,`ms`),Y(`span`,`nri-rule-label`,g(`Max hits`,`最多命中`)),v,Y(`span`,`nri-rule-label`,g(`(0 = no limit)`,`次（0 = 不限）`)));function x(e){`error`in e?z(`info`,e.error,4e3):(ce.hidden=!0,a(e.rule,!0))}let S=Y(`div`,`nri-chips`);S.append(Y(`span`,`nri-rule-label`,g(`Presets`,`预设`)));for(let e of dr())S.append(X(`nri-type-chip`,e.label,e.title,()=>x(hr(r,e))));S.append(X(`nri-text-btn`,g(`↺ Reset`,`↺ 复原`),g(`Back to the captured response: restore status and body, block mode, no delay`,`回到真实返回：状态码和响应体恢复，模式回到拦截，延迟清零`),()=>x(gr(r,t.findRealResponse(r)))));let C=Y(`textarea`,`nri-field nri-rule-body`);C.spellcheck=!1,C.placeholder=g(`Response body`,`返回的响应体`),C.setAttribute(`aria-label`,g(`Response body`,`响应体`));let re=Y(`pre`,`nri-rule-hl`);re.setAttribute(`aria-hidden`,`true`);let w=Y(`div`,`nri-rule-editor`);w.append(re,C);let ie;function ae(){re.scrollTop=C.scrollTop,re.scrollLeft=C.scrollLeft}function oe(){if(ie===C.value)return;ie=C.value;let e=ie.length>2e5;w.classList.toggle(`nri-plain`,e),re.innerHTML=e?``:`${ur(ie)}\n`,ae(),!T.hidden&&D===`source`&&Le(!0)}C.addEventListener(`scroll`,ae);let se=Y(`div`,`nri-rule-error`),ce=Y(`div`,`nri-rule-note`);ce.hidden=!0;let le=Y(`div`,`nri-rule-note`);function ue(){let e=r.body.split(`
`).length;C.style.height=`${Math.min(260,Math.max(44,e*16.5+12))}px`}let de=X(`nri-text-btn`,g(`Auto-fix`,`自动修复`),g(`Add missing quotes, commas and brackets, drop stray commas, then re-indent. Can be undone`,`补上缺的引号、逗号、括号，去掉多余的逗号，再重新排版。可以撤销`),me);function fe(){let e=Kn(r.body);se.hidden=e===``,se.replaceChildren(...e===``?[]:[g(`The body is not valid JSON, so the page will fail to parse it: ${e}`,`响应体不是合法的 JSON，页面拿到后会解析失败：${e}`),de]),C.classList.toggle(`nri-invalid`,e!==``)}function pe(e){C.value=e,a({body:e}),fe(),ue()}function me(){let e=Qn(r.body);if(`error`in e){z(`info`,e.error,3e3);return}if(e.text===r.body){z(`info`,g(`Already formatted`,`已经是排好版的了`),1500);return}let t=r.body;pe(e.text),ce.replaceChildren(e.fixed===void 0?g(`Re-indented.`,`已重新排版。`):g(`Fixed ${e.fixed}. Check that the result is what you meant.`,`已自动修复：${e.fixed}。请确认内容是你要的。`),X(`nri-text-btn`,g(`Undo`,`撤销`),g(`Put the body back the way it was`,`恢复成修改前的样子`),()=>{pe(t),ce.hidden=!0})),ce.hidden=!1}C.addEventListener(`input`,()=>{ce.hidden=!0,oe(),a({body:C.value}),fe()}),C.addEventListener(`keydown`,e=>{if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;let t=or({value:C.value,start:C.selectionStart,end:C.selectionEnd},{key:e.key,shiftKey:e.shiftKey});t!==void 0&&(e.preventDefault(),Pr(C,t))});let he=X(`nri-text-btn`,g(`Format`,`格式化`),g(`Re-indent the JSON; broken JSON (missing quotes, commas, brackets) is repaired first`,`把 JSON 重新排版；写坏了的（少引号、逗号、括号）会先试着修好`),me),ge=Cr(`nri-btn nri-rule-find-btn`,br,g(`Find in the response body (${G(`f`)})`,`在响应体里查找（${G(`f`)}）`),()=>{T.hidden?ze():M(!0)}),T=Y(`div`,`nri-find-bar nri-rule-findbar`);T.hidden=!0;let _e=Y(`label`,`nri-search-field`);_e.innerHTML=br;let E=Y(`input`,`nri-search-input`);E.type=`search`,E.placeholder=g(`Find`,`查找`),E.spellcheck=!1,E.autocomplete=`off`,E.setAttribute(`aria-label`,g(`Find in the response body`,`在响应体里查找`));let ve=Y(`span`,`nri-search-count`);ve.setAttribute(`aria-live`,`polite`),_e.append(E,ve);let ye=Cr(`nri-btn`,`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14.5 6-6 6 6"/></svg>`,g(`Previous match (⇧Return)`,`上一个（⇧Return）`),()=>Ie(j-1,!0)),be=Cr(`nri-btn`,`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg>`,g(`Next match (Return)`,`下一个（Return）`),()=>Ie(j+1,!0)),xe=Cr(`nri-close-btn`,Sr,g(`Close find (Esc)`,`关闭查找（Esc）`),()=>M(!0));T.append(_e,ye,be,xe);let D=`source`,O=Y(`div`,`nri-rule-treebox`);O.hidden=!0,O.tabIndex=0,O.setAttribute(`role`,`region`),O.setAttribute(`aria-label`,g(`Response body as a JSON tree`,`响应体的 JSON 树`));let k,Se;function Ce(){if(k!==void 0&&Se===r.body)return!0;let e=Ar(r.body);return e!==void 0&&(k=an(e),Se=r.body,O.replaceChildren(k),!0)}let we=Cr(`nri-btn`,xr,``,()=>{De(D===`tree`?`source`:`tree`,!0)});function Ee(){let e=D===`tree`?g(`Show as editable text instead of a tree`,`改为显示可编辑的原文`):g(`Show as a collapsible JSON tree (read-only)`,`改为显示可折叠的 JSON 树（只读）`);we.innerHTML=D===`tree`?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13.5 4-3 16"/></svg>`:xr,we.title=e,we.setAttribute(`aria-label`,e),we.setAttribute(`aria-pressed`,D===`tree`?`true`:`false`)}function De(e,t){e===`tree`&&!Ce()&&(t&&z(`info`,g(`The body is not a JSON object or array, so it cannot be shown as a tree.`,`响应体不是 JSON 对象或数组，没法显示成树。`),3e3),e=`source`),e===`tree`&&D===`source`&&(O.style.height=`${Math.max(44,C.offsetHeight)}px`),D=e,w.hidden=e===`tree`,O.hidden=e!==`tree`,Ee(),T.hidden||Le(!1)}let Oe,A=[],je=[],Me,j=0;function Ne(){return D===`tree`?je.length:A.length}function Pe(){let e=Ne(),t=e>=Or?`+`:``;ve.textContent=E.value===``?``:e===0?g(`No matches`,`没有匹配`):g(`${j+1} of ${e}${t}`,`${j+1} / ${e}${t}`),ye.disabled=e===0,be.disabled=e===0,ge.setAttribute(`aria-pressed`,T.hidden?`false`:`true`)}function Fe(){if(jr===void 0)return Me;let e=Oe,t=D===`source`&&w.classList.contains(`nri-plain`);if(T.hidden||e===void 0||Ne()===0||t)return jr.delete(`nri-rule-find`),jr.delete(`nri-rule-find-current`),D===`tree`?Me:void 0;let n;D===`tree`?n=k===void 0?[]:qt(k,e,kr,Or):(n=Mr(re,A),Me=n.at(j)),jr.set(`nri-rule-find`,new Highlight(...n));let r=new Highlight(...Me===void 0?[]:[Me]);return r.priority=1,jr.set(`nri-rule-find-current`,r),Me}new MutationObserver(()=>{!T.hidden&&D===`tree`&&Fe()}).observe(O,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`hidden`]});function Ie(e,t){let n=Ne();if(j=n===0?0:(e+n)%n,D===`tree`){let e=je.at(j),t=e===void 0||k===void 0?void 0:cn(k,e);Me=t===void 0||Oe===void 0||e===void 0?void 0:qt(t,Oe,kr).at(e.occurrence)}let r=Fe();if(t&&n>0){if(D===`tree`)r!==void 0&&Yt(O,r);else if(r!==void 0)Yt(C,r),ae();else{let e=A.at(j)?.[0]??0,t=C.value.slice(0,e).split(`
`).length-1;C.scrollTop=Math.max(0,t*16.5-C.clientHeight/2)}let e=o.closest(`.nri-rules-list`);if(e!==null){let t=r;t===void 0&&(t=document.createRange(),t.selectNode(D===`tree`?O:w)),Yt(e,t)}}Pe()}function Le(e){Oe=T.hidden?void 0:Wt(E.value),Me=void 0,A=[],je=[],Oe!==void 0&&(D===`tree`?je=k===void 0?[]:sn(k,Oe,Or)??[]:A=Gt(C.value,Oe).slice(0,Or)),Ie(e?Math.min(j,Math.max(0,Ne()-1)):0,!e)}function Re(){if(D===`source`)return document.activeElement===C?C.value.slice(C.selectionStart,C.selectionEnd):``;let e=window.getSelection();return e!==null&&e.rangeCount>0&&O.contains(e.anchorNode)?e.toString():``}function ze(){n(Ve);let e=Re();e!==``&&!e.includes(`
`)&&(E.value=e),T.hidden=!1,E.focus({preventScroll:!0}),E.select(),Le(!1)}function M(e){T.hidden||(T.hidden=!0,Le(!1),e&&(D===`tree`?O:C).focus({preventScroll:!0}))}E.addEventListener(`input`,()=>Le(!1)),E.addEventListener(`keydown`,e=>{e.isComposing||(e.key===`Enter`?(e.preventDefault(),Ie(j+(e.shiftKey?-1:1),!0)):e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),M(!0)))});let N=Y(`div`,`nri-rule-bodyhead`);N.append(Y(`span`,`nri-rule-label`,g(`Response body`,`响应体`)),ge,we,he),o.append(f,te,ne,S,N,T,w,O,se,ce,le);function P(e,t){(i||document.activeElement!==e)&&e.value!==t&&(e.value=t)}function Be(e){let t=e.body!==C.value;r=e,o.classList.toggle(`nri-rule-off`,!r.on),s.set(r.on),P(c,r.method),l(),P(u,r.match),P(m,String(r.status)),h(),y.set(r.mode),P(_,String(r.delay)),P(v,String(r.times)),P(C,r.body),oe(),b.textContent=Z(r),b.classList.toggle(`nri-spent`,Ae(r));let n=Nr(r.mode);le.hidden=n===void 0,le.textContent=n?.text??``,le.classList.toggle(`nri-danger`,n?.danger===!0),t&&C.value===r.body&&(fe(),ue()),D===`tree`&&Se!==r.body&&(Ce()?T.hidden||Le(!0):De(`source`,!1))}C.value=r.body,fe(),ue(),Ee(),Be(r);let Ve={id:r.id,el:o,sync:Be,openFind:ze,closeFind:M};return Ve}function Ir(e){let t=Y(`div`,`nri-rules`);t.hidden=!0;let n=X(`nri-push-btn`,g(`+ New Rule`,`+ 新增规则`),g(`Add an empty rule`,`新增一条空规则`),()=>{let e=We({});b(e.id),m.get(e.id)?.el.querySelector(`input[type="text"]`)?.focus()}),r=g(`Turn every rule off for now; the rules themselves are kept`,`所有规则临时失效，规则本身保留`),i=Tr(r,e=>Ue(e)),a=Y(`span`,`nri-rules-pause`),o=Y(`span`,void 0,g(`Pause All`,`全部暂停`));o.title=r,o.addEventListener(`click`,()=>Ue(!Ve())),a.append(o,i.el);let s;function c(){s!==void 0&&(clearTimeout(s),s=void 0),l.textContent=g(`Clear All`,`清空`),l.classList.remove(`nri-danger`)}let l=X(`nri-text-btn`,g(`Clear All`,`清空`),g(`Delete every rule`,`删除全部规则`),()=>{if(s===void 0){let e=Be().length;l.textContent=g(`Click again to delete ${e===1?`the rule`:`all ${e} rules`}`,`再点一次，删除全部 ${e} 条规则`),l.classList.add(`nri-danger`),s=setTimeout(c,3e3)}else c(),Ke()}),u=Y(`div`,`nri-rules-bar`);u.append(n,a,Y(`span`,`nri-spacer`),l);let d=Y(`div`,`nri-rules-hint`,g(`Rule bodies are stored and shown unredacted — the page must receive the real content.`,`规则里的响应体按原文保存和显示，不脱敏——页面要拿到的就是原文。`)),f=Y(`div`,`nri-rules-list`),p=Y(`div`,`nri-rules-empty`,g(`No rules yet. Select a request and choose Mock, or add a rule by hand.`,`还没有规则。在请求列表里选中一个请求点魔杖按钮，或者手动新增。`));t.append(u,d,f);let m=/* @__PURE__ */ new Map,h=[],_;function v(e){_!==void 0&&_!==e&&_.closeFind(!1),_=e}function y(){let t=Be(),n=t.map(e=>e.id);if(n.length!==h.length||n.some((e,t)=>e!==h.at(t))){for(let e of h)n.includes(e)||(m.get(e)?.closeFind(!1),m.delete(e));for(let n of t)m.has(n.id)||m.set(n.id,Fr(n,e,v));h=n;let r=n.flatMap(e=>{let t=m.get(e);return t===void 0?[]:[t.el]});f.replaceChildren(...r.length===0?[p]:r),c()}for(let e of t)m.get(e.id)?.sync(e);let r=Ve();i.set(r),a.classList.toggle(`nri-paused`,r),l.hidden=t.length===0,d.hidden=t.length===0}function b(e){let t=m.get(e);if(t===void 0)return;let n=f.getBoundingClientRect(),r=t.el.getBoundingClientRect();r.top<n.top?f.scrollTop-=n.top-r.top+8:r.bottom>n.bottom&&(f.scrollTop+=Math.min(r.top-n.top-8,r.bottom-n.bottom+8)),t.el.classList.add(`nri-rule-flash`),setTimeout(()=>t.el.classList.remove(`nri-rule-flash`),1200)}f.replaceChildren(p),y();let ee=He(y);return{el:t,dispose:()=>{ee(),_?.closeFind(!1)},reveal:b,focus:()=>{n.focus({preventScroll:!0})},openFind:e=>{let t=h.find(t=>e instanceof Node&&m.get(t)?.el.contains(e))??h.at(0);t!==void 0&&m.get(t)?.openFind()}}}let Lr={code:`KeyH`,alt:!1,ctrl:!1,meta:!1,shift:!1},Rr=/* @__PURE__ */ new Set([`ShiftLeft`,`ShiftRight`,`ControlLeft`,`ControlRight`,`AltLeft`,`AltRight`,`MetaLeft`,`MetaRight`,`OSLeft`,`OSRight`,`CapsLock`,`Fn`]),zr=/* @__PURE__ */ new Set([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`Home`,`End`,`Enter`,`NumpadEnter`,`Tab`,`Escape`]),Br=/* @__PURE__ */ new Set([`KeyA`,`KeyC`,`KeyF`,`KeyK`,`KeyV`,`KeyX`,`KeyZ`]),Vr={Space:`Space`,Backquote:"`",Minus:`-`,Equal:`=`,BracketLeft:`[`,BracketRight:`]`,Backslash:`\\`,Semicolon:`;`,Quote:`'`,Comma:`,`,Period:`.`,Slash:`/`,ArrowUp:`↑`,ArrowDown:`↓`,ArrowLeft:`←`,ArrowRight:`→`,PageUp:`PgUp`,PageDown:`PgDn`,Insert:`Ins`},Hr=e=>{if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.code==`string`&&t.code!==``&&typeof t.alt==`boolean`&&typeof t.ctrl==`boolean`&&typeof t.meta==`boolean`&&typeof t.shift==`boolean`};function Ur(){try{let t=s(e.toggleShortcutStorageKey);if(t===null)return Lr;let n=JSON.parse(t);if(typeof n==`object`&&n&&`shortcut`in n){let e=n.shortcut;if(e===null)return null;if(Hr(e))return e}}catch{}return Lr}function Wr(t){try{c(e.toggleShortcutStorageKey,JSON.stringify({shortcut:t}))}catch{}}function Gr(e,t){return e===null||t===null?e===t:e.code===t.code&&e.alt===t.alt&&e.ctrl===t.ctrl&&e.meta===t.meta&&e.shift===t.shift}function Kr(e){if(!(e.code===``||Rr.has(e.code)))return{code:e.code,alt:e.altKey,ctrl:e.ctrlKey,meta:e.metaKey,shift:e.shiftKey}}function qr(e,t){return e.code===t.code&&e.altKey===t.alt&&e.ctrlKey===t.ctrl&&e.metaKey===t.meta&&e.shiftKey===t.shift}function Jr(e){return!e.alt&&!e.ctrl&&!e.meta}function Yr(e,t){if(Jr(e)&&zr.has(e.code))return`used to navigate the panel`;let n=t?e.meta:e.ctrl,r=t?e.ctrl:e.meta;if(n&&!r&&!e.alt&&!e.shift&&Br.has(e.code))return`used by the panel or for editing`}function Xr(e){let t=Vr[e];if(t!==void 0)return t;let n=/^(?:Key|Digit|Numpad)(.+)$/.exec(e);return n?.[1]===void 0?e:n[1]}function Zr(e,t){let n=Xr(e.code);return t?[e.ctrl?`⌃`:``,e.alt?`⌥`:``,e.shift?`⇧`:``,e.meta?`⌘`:``,n].join(``):[e.ctrl?`Ctrl`:``,e.alt?`Alt`:``,e.shift?`Shift`:``,e.meta?`Win`:``,n].filter(e=>e!==``).join(`+`)}let Qr=/* @__PURE__ */ new Set([`text`,`search`,`email`,`url`,`tel`,`password`,`number`,`date`,`datetime-local`,`month`,`week`,`time`]);function $r(e){let t=e.composedPath()[0]??e.target;return t instanceof Element?t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement?!0:t instanceof HTMLInputElement?Qr.has(t.type):t instanceof HTMLElement&&t.isContentEditable:!1}let ei=/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,ti=/^\d+$/;function ni(e){let t=ei.exec(e.trim());return t===null?null:{major:Number(t[1]),minor:Number(t[2]),patch:Number(t[3]),prerelease:t[4]===void 0?[]:t[4].split(`.`)}}function ri(e,t){let n=ti.test(e),r=ti.test(t);return n&&r?Math.sign(Number(e)-Number(t)):n===r?e===t?0:e<t?-1:1:n?-1:1}function ii(e,t){let n=ni(e),r=ni(t);if(n===null||r===null)throw Error(`Invalid version: ${JSON.stringify(n===null?e:t)}`);for(let e of[`major`,`minor`,`patch`])if(n[e]!==r[e])return n[e]<r[e]?-1:1;if(n.prerelease.length===0||r.prerelease.length===0)return Math.sign(r.prerelease.length-n.prerelease.length);let i=Math.min(n.prerelease.length,r.prerelease.length);for(let e=0;e<i;e+=1){let t=ri(n.prerelease.at(e)??``,r.prerelease.at(e)??``);if(t!==0)return t}return Math.sign(n.prerelease.length-r.prerelease.length)}function ai({body:e,currentVersion:t}){let n;try{n=JSON.parse(e)}catch{return{status:`failed`,reason:g(`Update manifest is not valid JSON`,`版本清单不是合法的 JSON`)}}let r=typeof n==`object`&&n?n.version:void 0;if(typeof r!=`string`)return{status:`failed`,reason:g(`Update manifest has no version`,`版本清单里没有版本号`)};try{return ii(r,t)>0?{status:`available`,version:r}:{status:`up-to-date`}}catch{return{status:`failed`,reason:g(`Invalid version ${JSON.stringify(r)}`,`版本号不合法：${JSON.stringify(r)}`)}}}function oi({manifestUrl:e,currentVersion:t}){return new Promise(n=>{typeof GM_xmlhttpRequest==`function`?GM_xmlhttpRequest({method:`GET`,url:e,timeout:1e4,headers:{"Cache-Control":`no-cache`},onload:e=>{e.status===200?n(ai({body:e.responseText,currentVersion:t})):n({status:`failed`,reason:g(`Update server returned HTTP ${e.status}`,`更新服务器返回了 HTTP ${e.status}`)})},onerror:()=>n({status:`failed`,reason:g(`Could not reach the update server`,`连不上更新服务器`)}),ontimeout:()=>n({status:`failed`,reason:g(`Update check timed out`,`检查更新超时`)})}):n({status:`failed`,reason:g(`Update check is unavailable in this build`,`这个构建不支持检查更新`)})})}function si(){try{return s(e.includeBetaStorageKey)===`true`}catch{return!1}}function ci(t){try{c(e.includeBetaStorageKey,String(t))}catch{}}function li(e){return e?`beta`:`latest`}function ui(e){let t=String(e.getMonth()+1).padStart(2,`0`),n=String(e.getDate()).padStart(2,`0`);return`${e.getFullYear()}-${t}-${n}`}function di(t=/* @__PURE__ */ new Date){let n=ui(t);try{return s(e.betaCheckDateStorageKey)!==n&&(c(e.betaCheckDateStorageKey,n),s(e.betaCheckDateStorageKey)===n)}catch{return!1}}function fi({pointerY:e,targetLeft:t,width:n,height:r,viewportWidth:i,viewportHeight:a}){let o=e+12;o+r>a-4&&(o=e-12-r);let s=Math.min(Math.max(t,4),i-4-n);return{top:Math.max(o,4),left:Math.max(s,4)}}function pi(e,t){return e instanceof Element?e.closest(t):null}function mi(e,t){let n,r,i=[],a=0,o,s=-1/0,c=()=>n!==void 0&&!n.hidden,l=(t,r)=>{n?.isConnected!==!0&&(n=document.createElement(`div`),n.className=`nri-tooltip`,n.setAttribute(`role`,`tooltip`),e.appendChild(n)),n.textContent=r,n.hidden=!1;let{width:i,height:o}=n.getBoundingClientRect(),{top:s,left:c}=fi({pointerY:a,targetLeft:t.getBoundingClientRect().left,width:i,height:o,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight});n.style.top=`${s}px`,n.style.left=`${c}px`},u=()=>{window.clearTimeout(o),o=void 0,c()&&(s=Date.now()),n!==void 0&&(n.hidden=!0)},d=e=>{let t=e.getAttribute(`title`);t!==null&&(e.dataset.nriTooltip=t,e.removeAttribute(`title`),i.includes(e)||i.push(e))},f=()=>{u();for(let e of i){let t=e.dataset.nriTooltip;t!==void 0&&(e.setAttribute(`title`,t),delete e.dataset.nriTooltip)}i=[],r?.classList.remove(`nri-tooltip-active`),r=void 0},p=(t,n)=>{let i=t.getAttribute(`title`)??t.dataset.nriTooltip??``;if(i===``)return;let u=c()||Date.now()-s<200;f(),r=t,a=n,t.classList.add(`nri-tooltip-active`);for(let n=t;n!==null&&e.contains(n);n=n.parentElement)d(n);let p=()=>{o=void 0,r===t&&t.isConnected&&l(t,t.dataset.nriTooltip??i)};u?p():o=window.setTimeout(p,t.matches(`button, .nri-segment, .nri-type-chip, .nri-keycap, label`)?400:1500)},m=e=>{let t=pi(e.target,`[title], .nri-tooltip-active`);t!==null&&t!==r&&p(t,e.clientY)},h=e=>{a=e.clientY;for(let e of i){let t=e.getAttribute(`title`);t!==null&&(d(e),e===r&&n!==void 0&&c()&&(n.textContent=t))}},g=t=>{if(r===void 0||pi(t.target,`.nri-tooltip-active`)!==r||t.relatedTarget instanceof Node&&r.contains(t.relatedTarget))return;f();let n=pi(t.relatedTarget,`[title]`);n!==null&&e.contains(n)&&p(n,t.clientY)},_=()=>{u(),s=-1/0};e.addEventListener(`mouseenter`,m,!0),e.addEventListener(`mousemove`,h,!0),e.addEventListener(`mouseover`,h,!0),e.addEventListener(`mouseleave`,g,!0),e.addEventListener(`mousedown`,_,!0),e.addEventListener(`scroll`,_,!0),window.addEventListener(`keydown`,_,{capture:!0,signal:t})}let hi={version:`0.0.0`,dev:!0};function gi(){try{if(typeof __NRI_BUILD__==`object`&&__NRI_BUILD__!==null)return __NRI_BUILD__}catch{}return hi}function _i(){let{version:e,dev:t}=gi();return t?`v${e} (dev)`:`v${e}`}function vi(e){return e.replace(/\[([^\]]+)\]\([^)]*\)/g,`$1`).split(/(`[^`]+`|\*\*[^*]+\*\*)/).filter(e=>e!==``).map(e=>e.length>2&&e.startsWith("`")&&e.endsWith("`")?{kind:`code`,text:e.slice(1,-1)}:e.length>4&&e.startsWith(`**`)&&e.endsWith(`**`)?{kind:`strong`,text:e.slice(2,-2)}:{kind:`text`,text:e})}function yi(e,t){try{return ii(e,t)>0}catch{return!1}}function bi(e){let t=ni(e);return t===null?void 0:`${t.major}.${t.minor}.${t.patch}`}function xi({changelog:e,current:t,since:n}){let r=e.filter(e=>ni(e.version)!==null&&!yi(e.version,t)&&(n===void 0||yi(e.version,n))),i=new Set(r.filter(e=>ni(e.version)?.prerelease.length===0).map(e=>e.version));return r.filter(e=>{let t=bi(e.version);return t===e.version||t===void 0||!i.has(t)}).sort((e,t)=>ii(t.version,e.version))}function Si({changelog:t,current:n}){let r;try{r=s(e.seenVersionStorageKey)}catch{return}if(r===n)return;try{if(c(e.seenVersionStorageKey,n),s(e.seenVersionStorageKey)!==n)return}catch{return}if(r===null||!yi(n,r))return;let i=xi({changelog:t,current:n,since:r});return i.length>0?{from:r,entries:i}:void 0}let Ci=`nri-root`,wi=`nri-panel-style`,Q=`#${Ci}`,Ti={json:{label:`JSON`,title:`JSON`},doc:{label:`文档`,title:`HTML 和 XML 文档`},text:{label:`文本`,title:`纯文本`},js:{label:`JS`,title:`JavaScript`},css:{label:`CSS`,title:`样式表`},img:{label:`图片`,title:`图片`},media:{label:`媒体`,title:`音频和视频`},font:{label:`字体`,title:`字体`},other:{label:`其他`,title:`二进制、空响应、进行中和失败的请求`}},Ei=[`body`,`headers`,`request`],Di=`button, svg, .nri-json-tail, .nri-section-title, .nri-empty-hint, .nri-truncated`,Oi=1e3;function ki(){if(document.getElementById(wi)!==null)return;let t=document.createElement(`style`);t.id=wi,t.textContent=`
        /* macOS 系统色 token：默认深色；data-nri-theme=light 覆盖为浅色 */
        ${Q} {
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
        ${Q}[data-nri-theme="light"] {
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
        ${Q}[data-nri-theme="dark"][data-nri-palette="macos"] {
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
        ${Q}[data-nri-theme="light"][data-nri-palette="macos"] {
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
        ${Q},
        ${Q} * {
            font-family: var(--nri-font-ui) !important;
        }
        ${Q} * {
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
        ${Q} .nri-detail-error,
        ${Q} .nri-kv,
        ${Q} .nri-kv *,
        ${Q} .nri-json,
        ${Q} .nri-json *,
        ${Q} .nri-source {
            font-family: var(--nri-font-mono) !important;
        }
        ${Q} .nri-json .nri-json-more {
            font-family: var(--nri-font-ui) !important;
        }
        ${Q} button {
            margin: 0;
            color: inherit;
            /* macOS 控件不使用手型指针 */
            cursor: default;
        }
        ${Q} button:focus {
            outline: none !important;
        }
        /* 面板本身可聚焦只是为了接住点在空白处、标题、URL 上的焦点，不显示焦点框 */
        ${Q} .nri-panel:focus {
            outline: none;
        }
        ${Q} button:focus-visible {
            outline: none !important;
            box-shadow: 0 0 0 3px var(--nri-focus-ring);
        }
        ${Q} svg {
            display: block;
            flex: 0 0 auto;
            pointer-events: none;
        }
        ${Q} [hidden] {
            display: none !important;
        }

        /* ---- 状态色调与方法颜色 ---- */
        ${Q} .nri-tone-success {
            color: var(--nri-green);
        }
        ${Q} .nri-tone-info {
            color: var(--nri-blue);
        }
        ${Q} .nri-tone-warning {
            color: var(--nri-orange);
        }
        ${Q} .nri-tone-error {
            color: var(--nri-red);
        }
        ${Q} .nri-method {
            flex: 0 0 auto;
            font-weight: 600;
        }
        ${Q} .nri-method-GET {
            color: var(--nri-green);
        }
        ${Q} .nri-method-POST,
        ${Q} .nri-method-PUT,
        ${Q} .nri-method-PATCH {
            color: var(--nri-orange);
        }
        ${Q} .nri-method-DELETE {
            color: var(--nri-red);
        }

        /* ---- 角标：Dock 风格毛玻璃胶囊 ---- */
        ${Q} .nri-toggle {
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
        ${Q} .nri-toggle:hover {
            background: var(--nri-hud-hover);
        }
        ${Q} .nri-toggle:active {
            transform: scale(0.97);
        }
        /*
         * While the panel is open the toggle turns into a round chevron
         * pointing where the panel goes, like a chat launcher; the list
         * already shows the count.
         */
        ${Q} .nri-toggle-chevron {
            display: none;
        }
        ${Q} .nri-toggle[aria-expanded="true"] {
            justify-content: center;
            width: 30px;
            padding: 0;
        }
        ${Q} .nri-toggle[aria-expanded="true"] > :not(.nri-toggle-chevron) {
            display: none;
        }
        ${Q} .nri-toggle[aria-expanded="true"] .nri-toggle-chevron {
            display: inline-flex;
            animation: nri-chevron-in 0.15s ease-out;
        }
        ${Q} .nri-toggle-chevron svg {
            width: 16px;
            height: 16px;
        }
        @keyframes nri-chevron-in {
            from {
                opacity: 0;
                transform: translateY(-3px);
            }
        }
        ${Q} .nri-dock {
            position: relative;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 0;
            min-height: 0;
        }
        ${Q}.nri-idle {
            right: 0;
        }
        ${Q}.nri-idle .nri-dock {
            min-width: 28px;
            padding-left: 8px;
            padding-right: 0;
        }
        ${Q}.nri-idle .nri-toggle {
            opacity: var(--nri-toggle-idle-opacity);
            background: var(--nri-toggle-bg-idle);
            color: var(--nri-toggle-fg-idle);
            border-radius: 15px 0 0 15px;
            box-shadow: none;
            transform: translateX(calc(100% - 14px));
        }
        ${Q}.nri-idle:hover .nri-dock,
        ${Q}.nri-idle:focus-within .nri-dock {
            padding-right: 16px;
        }
        ${Q}.nri-idle:hover .nri-toggle,
        ${Q}.nri-idle:focus-within .nri-toggle {
            opacity: 1;
            border-radius: 15px;
            box-shadow: var(--nri-hud-shadow);
            transform: none;
            background: var(--nri-hud-hover);
            color: var(--nri-label-strong);
        }
        ${Q} .nri-badge {
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
        ${Q} .nri-badge.nri-badge-alert {
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
        ${Q} .nri-panel {
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
        ${Q} .nri-panel::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-window-edge);
            pointer-events: none;
            z-index: 3;
        }
        ${Q} .nri-panel.nri-open {
            display: flex;
            animation: nri-panel-in 0.18s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        ${Q} .nri-resize {
            position: absolute;
            z-index: 4;
            touch-action: none;
        }
        ${Q} .nri-resize-l {
            left: 0;
            top: 8px;
            bottom: 0;
            width: 5px;
            cursor: ew-resize;
        }
        ${Q} .nri-resize-t {
            top: 0;
            left: 8px;
            right: 0;
            height: 5px;
            cursor: ns-resize;
        }
        ${Q} .nri-resize-tl {
            top: 0;
            left: 0;
            width: 8px;
            height: 8px;
            cursor: nwse-resize;
        }

        /* ---- 工具栏 ---- */
        ${Q} .nri-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 34px;
            padding: 0 6px 0 12px;
            flex-shrink: 0;
        }
        ${Q} .nri-title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
            color: var(--nri-label-strong);
        }
        ${Q} .nri-actions {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
        }
        /* macOS 工具栏按钮：静止无底，悬停浅色圆角底，按下加深 */
        ${Q} .nri-btn {
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
        ${Q} .nri-btn:hover,
        ${Q} .nri-btn[aria-pressed="true"] {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${Q} .nri-btn:active {
            background: var(--nri-fill-pressed);
        }
        ${Q} .nri-btn:disabled {
            opacity: 0.35;
            background: transparent;
        }
        ${Q} .nri-btn svg {
            width: 15px;
            height: 15px;
        }
        ${Q} .nri-toolbar-sep {
            width: 1px;
            height: 14px;
            margin: 0 3px;
            background: var(--nri-separator);
        }

        /* ---- 分段控件 ---- */
        ${Q} .nri-segmented {
            display: inline-flex;
            flex-shrink: 0;
            padding: 1px;
            border-radius: 6px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 0.5px var(--nri-separator);
        }
        ${Q} .nri-segment {
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
        ${Q} .nri-segment:hover:not([aria-pressed="true"]) {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${Q} .nri-segment[aria-pressed="true"] {
            background: var(--nri-segment-selected);
            box-shadow: var(--nri-segment-shadow);
            color: var(--nri-label-strong);
        }
        /* 需要留意的状态：Raw 暴露凭据、Failed 隐藏了正常请求 */
        ${Q} .nri-segment[data-value="raw"][aria-pressed="true"] {
            color: var(--nri-orange);
            background: color-mix(in srgb, var(--nri-orange) 20%, transparent);
        }
        ${Q} .nri-segment[data-value="failed"][aria-pressed="true"] {
            color: var(--nri-red);
            background: color-mix(in srgb, var(--nri-red) 20%, transparent);
        }
        ${Q} .nri-actions .nri-segmented {
            margin-right: 4px;
        }

        /* ---- 筛选栏：搜索框 + 范围 ---- */
        ${Q} .nri-searchbar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${Q} .nri-search-field {
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
        ${Q} .nri-search-field:focus-within {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${Q} .nri-search-field > svg {
            width: 13px;
            height: 13px;
        }
        ${Q} .nri-search-input {
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
        ${Q} .nri-search-input::placeholder {
            color: var(--nri-label-tertiary) !important;
            opacity: 1;
        }
        ${Q} .nri-search-input::-webkit-search-decoration,
        ${Q} .nri-search-input::-webkit-search-cancel-button {
            -webkit-appearance: none;
            appearance: none;
        }
        ${Q} .nri-search-count {
            flex-shrink: 0;
            font-size: 11px;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${Q} .nri-search-clear {
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
        ${Q} .nri-search-clear:hover {
            background: var(--nri-label-secondary);
        }
        ${Q} .nri-search-clear svg {
            width: 8px;
            height: 8px;
        }

        /* ---- 类型过滤：DevTools 式胶囊，⌘ 单击多选 ---- */
        ${Q} .nri-typebar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${Q} .nri-type-chip {
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
        ${Q} .nri-type-chip:hover:not([aria-pressed="true"]) {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${Q} .nri-type-chip[aria-pressed="true"] {
            background: var(--nri-segment-selected);
            box-shadow: var(--nri-segment-shadow);
            color: var(--nri-label-strong);
        }
        /* 尚未捕获该类型：变暗，仍可选中 */
        ${Q} .nri-type-chip[data-empty="true"]:not([aria-pressed="true"]) {
            color: var(--nri-label-tertiary);
        }
        ${Q} .nri-typebar-sep {
            width: 1px;
            height: 12px;
            margin: 0 2px;
            background: var(--nri-separator);
        }

        /* ---- 请求列表：紧凑行、斑马纹、无行分隔线 ---- */
        ${Q} .nri-list {
            overflow: auto;
            flex: 1;
            min-height: 44px;
            padding: 4px 6px 6px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
            background: var(--nri-sidebar);
            outline: none;
        }
        /* 细滚动条：窄、圆角、半透明，悬停加深 */
        ${Q} .nri-list::-webkit-scrollbar,
        ${Q} .nri-detail-content::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ${Q} .nri-list::-webkit-scrollbar-track,
        ${Q} .nri-list::-webkit-scrollbar-corner,
        ${Q} .nri-detail-content::-webkit-scrollbar-track,
        ${Q} .nri-detail-content::-webkit-scrollbar-corner {
            background: transparent;
        }
        ${Q} .nri-list::-webkit-scrollbar-thumb,
        ${Q} .nri-detail-content::-webkit-scrollbar-thumb {
            border: 3px solid transparent;
            border-radius: 5px;
            background: var(--nri-scrollbar-thumb) padding-box;
        }
        ${Q} .nri-list::-webkit-scrollbar-thumb:hover,
        ${Q} .nri-detail-content::-webkit-scrollbar-thumb:hover {
            background-color: var(--nri-scrollbar-thumb-hover);
        }
        ${Q} .nri-placeholder {
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
        ${Q} .nri-placeholder-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--nri-label);
        }
        ${Q} .nri-row {
            display: flex;
            align-items: center;
            gap: 6px;
            height: 22px;
            padding: 0 6px;
            border-radius: 5px;
            font-variant-numeric: tabular-nums;
        }
        ${Q} .nri-row.nri-alt {
            background: var(--nri-row-alt);
        }
        ${Q} .nri-row-status {
            flex: 0 0 auto;
            min-width: 28px;
            font-weight: 600;
        }
        ${Q} .nri-row .nri-method {
            min-width: 40px;
            font-size: 11px;
        }
        ${Q} .nri-row-path {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${Q} .nri-row-meta {
            flex: 0 0 auto;
            color: var(--nri-label-secondary);
            white-space: nowrap;
        }
        /* 选中行：列表有焦点（或右键菜单打开）时为强调色加白字，失焦后退为灰色 */
        ${Q} .nri-row.nri-selected {
            background: var(--nri-selection-inactive);
        }
        ${Q} .nri-list:focus-within .nri-row.nri-selected,
        ${Q}:has(> .nri-menu) .nri-row.nri-selected {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
        }
        ${Q} .nri-list:focus-within .nri-row.nri-selected > span,
        ${Q}:has(> .nri-menu) .nri-row.nri-selected > span {
            color: inherit !important;
        }

        /* ---- What's New：替换工具栏下方的内容，列出更新说明 ---- */
        ${Q} .nri-panel[data-view="whats-new"] > :is(.nri-searchbar, .nri-typebar, .nri-list, .nri-detail) {
            display: none;
        }
        ${Q} .nri-whats-new {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Q} .nri-whats-new[hidden] {
            display: none;
        }
        ${Q} .nri-whats-new-header {
            padding: 12px 14px 8px;
        }
        ${Q} .nri-whats-new-title {
            margin: 0;
            color: var(--nri-label-strong);
            font-size: 15px;
            font-weight: 700;
        }
        ${Q} .nri-whats-new-subtitle {
            margin: 2px 0 0;
            color: var(--nri-label-secondary);
            font-size: 12px;
        }
        ${Q} .nri-whats-new-notes {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 14px 8px;
            outline: none;
            user-select: text;
        }
        ${Q} .nri-whats-new-version + .nri-whats-new-version {
            margin-top: 10px;
            padding-top: 10px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Q} .nri-whats-new-version h4 {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin: 0 0 4px;
            color: var(--nri-label-strong);
            font-size: 13px;
            font-weight: 600;
        }
        ${Q} .nri-whats-new-date {
            color: var(--nri-label-tertiary);
            font-size: 11px;
            font-weight: 400;
            font-variant-numeric: tabular-nums;
        }
        ${Q} .nri-whats-new-section {
            margin: 6px 0 2px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
        }
        /* Host resets often strip list markers, on ul or li; restate them on li */
        ${Q} .nri-whats-new ul {
            margin: 0;
            padding: 0 0 0 16px;
            font-size: 12px;
            line-height: 1.5;
        }
        ${Q} .nri-whats-new li {
            display: list-item;
            margin: 0;
            padding: 0;
            list-style: disc outside;
        }
        ${Q} .nri-whats-new li li {
            list-style-type: circle;
        }
        ${Q} .nri-whats-new li + li {
            margin-top: 2px;
        }
        ${Q} .nri-whats-new code {
            padding: 0 3px;
            border-radius: 3px;
            background: var(--nri-fill);
            font-family: var(--nri-font-mono);
            font-size: 11px;
        }
        ${Q} .nri-whats-new strong {
            color: var(--nri-label-strong);
            font-weight: 600;
        }
        ${Q} .nri-whats-new-actions {
            display: flex;
            justify-content: flex-end;
            padding: 8px 14px 10px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }

        /* ---- 设置浮层：外观、显示/隐藏快捷键、更新；锚定在工具栏齿轮按钮下方 ---- */
        ${Q} .nri-settings {
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
        ${Q} .nri-settings[hidden] {
            display: none;
        }
        ${Q} .nri-settings-section + .nri-settings-section {
            margin-top: 4px;
            padding-top: 4px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Q} .nri-settings-heading {
            padding: 4px 12px 2px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
        }
        ${Q} .nri-settings-row {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 26px;
            padding: 0 12px;
        }
        ${Q} .nri-settings-row[hidden] {
            display: none;
        }
        ${Q} .nri-settings-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${Q} .nri-settings-value {
            color: var(--nri-label-secondary);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${Q} .nri-settings-hint {
            padding: 0 12px 4px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
        }
        ${Q} .nri-settings-hint:empty {
            display: none;
        }
        /* 推按钮：与分段控件同一层级的浅底圆角 */
        ${Q} .nri-push-btn {
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
        ${Q} .nri-push-btn:hover {
            background: var(--nri-fill-pressed);
        }
        /* Default button: accent-filled, as Return or Esc would press it */
        ${Q} .nri-push-btn.nri-primary {
            background: var(--nri-selection);
            box-shadow: none;
            color: var(--nri-selection-fg);
        }
        ${Q} .nri-push-btn.nri-primary:hover {
            background: color-mix(in srgb, var(--nri-selection) 85%, black);
        }
        ${Q} .nri-push-btn:disabled {
            color: var(--nri-label-tertiary);
            background: var(--nri-fill);
        }
        ${Q} .nri-update-status[hidden] {
            display: none;
        }
        ${Q} .nri-update-status,
        ${Q} .nri-link {
            margin-left: auto;
        }
        ${Q} .nri-update-status {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nri-label-secondary);
            text-align: right;
        }
        ${Q} .nri-link {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--nri-selection);
            white-space: nowrap;
        }
        ${Q} .nri-link:hover {
            text-decoration: underline;
        }
        ${Q} .nri-link[hidden] {
            display: none;
        }
        /* macOS 开关：灰色轨道，打开时强调色，圆形滑块左右滑动 */
        ${Q} .nri-switch {
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
        ${Q} .nri-switch::after {
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
        ${Q} .nri-switch[aria-checked="true"] {
            background: var(--nri-selection);
            box-shadow: none;
        }
        ${Q} .nri-switch[aria-checked="true"]::after {
            transform: translateX(11px);
        }
        /* 齿轮上的更新提示圆点 */
        ${Q} .nri-btn[data-badge="true"]::after {
            content: "";
            position: absolute;
            top: 2px;
            right: 3px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--nri-selection);
        }
        ${Q} .nri-keycap {
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
        ${Q} .nri-keycap:hover {
            background: var(--nri-fill-pressed);
        }
        ${Q} .nri-keycap[data-empty="true"] {
            color: var(--nri-label-tertiary);
            font-family: inherit;
        }
        ${Q} .nri-keycap[aria-pressed="true"] {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
            box-shadow: none;
            font-family: inherit;
        }
        ${Q} .nri-text-btn {
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--nri-selection);
            font: inherit;
            white-space: nowrap;
        }
        ${Q} .nri-text-btn:hover {
            text-decoration: underline;
        }
        ${Q} .nri-text-btn[hidden] {
            display: none;
        }

        /* ---- 详情区：分隔线 + 固定头部 + 滚动内容 ---- */
        ${Q} .nri-detail {
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
        ${Q} .nri-detail-resize {
            position: absolute;
            top: -4px;
            left: 0;
            right: 0;
            height: 8px;
            cursor: ns-resize;
            touch-action: none;
            z-index: 2;
        }
        ${Q} .nri-detail-resize:hover::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: 3.5px;
            height: 1px;
            background: var(--nri-focus-border);
        }
        ${Q} .nri-detail-header {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 7px 10px 6px 12px;
            flex-shrink: 0;
            border-bottom: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Q} .nri-detail-titlebar {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }
        /* Round dismiss button, distinct from the transparent toolbar buttons */
        ${Q} .nri-close-btn {
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
        ${Q} .nri-close-btn:hover {
            background: color-mix(in srgb, var(--nri-label) 22%, transparent);
            color: var(--nri-label);
        }
        ${Q} .nri-close-btn:active {
            background: var(--nri-fill-pressed);
        }
        ${Q} .nri-close-btn svg {
            width: 11px;
            height: 11px;
            stroke-width: 2.5;
        }
        ${Q} .nri-detail-summary {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
        }
        ${Q} .nri-status-pill {
            flex: 0 0 auto;
            padding: 1px 7px;
            border-radius: 5px;
            background: color-mix(in srgb, currentColor 14%, transparent);
            font-size: 12px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }
        ${Q} .nri-summary-meta {
            flex: 0 0 auto;
            color: var(--nri-label-secondary);
            font-variant-numeric: tabular-nums;
        }
        ${Q} .nri-detail-url {
            display: flex;
            align-items: baseline;
            gap: 7px;
            min-width: 0;
        }
        ${Q} .nri-detail-url-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nri-label);
            user-select: text;
        }
        ${Q} .nri-detail-error {
            color: var(--nri-red);
            font-size: 11px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            user-select: text;
        }
        ${Q} .nri-detail-bar {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-top: 3px;
        }
        ${Q} .nri-detail-bar .nri-segment {
            min-width: 58px;
        }
        /* 查找栏：详情区内容中的文本查找 */
        ${Q} .nri-find-bar {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-top: 3px;
        }
        ${Q} .nri-find-bar .nri-search-field {
            margin-right: 4px;
        }
        ${Q} .nri-find-bar .nri-close-btn {
            margin-left: 4px;
        }
        /* 命中项用不透明底色与深色文字，四种配色组合下都清晰；当前项为橙色 */
        ${Q} ::highlight(nri-find) {
            background-color: #ffe066;
            color: #1d1d1f;
        }
        ${Q} ::highlight(nri-find-current) {
            background-color: #ff9f0a;
            color: #000000;
        }
        ${Q} .nri-spacer {
            flex: 1;
        }
        ${Q} .nri-detail-content {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 6px 12px 12px;
            outline: none;
            user-select: text;
            cursor: text;
        }
        ${Q} .nri-section-title {
            margin: 12px 0 4px;
            padding: 0;
            border: 0;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
            user-select: none;
        }
        ${Q} .nri-section-title:first-child {
            margin-top: 2px;
        }
        ${Q} .nri-empty-hint {
            padding: 3px 0;
            color: var(--nri-label-secondary);
        }
        ${Q} .nri-truncated {
            margin-top: 6px;
            color: var(--nri-label-secondary);
            font-size: 11px;
        }

        /* ---- 键值表：等宽、斑马纹、无分隔线 ---- */
        ${Q} .nri-kv {
            width: 100%;
            margin: 0;
            border: 0;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 11px;
            line-height: 1.5;
            background: transparent;
        }
        ${Q} .nri-kv tr {
            background: transparent;
        }
        ${Q} .nri-kv tr:nth-child(even) {
            background: var(--nri-row-alt);
        }
        ${Q} .nri-kv td {
            padding: 2px 8px;
            border: 0;
            vertical-align: top;
            color: var(--nri-label);
        }
        ${Q} .nri-kv td.nri-kv-key {
            width: 30%;
            color: var(--nri-json-key);
            white-space: nowrap;
        }
        ${Q} .nri-kv td.nri-kv-value {
            word-break: break-all;
        }

        /* ---- JSON 树与源码 ---- */
        ${Q} .nri-json,
        ${Q} .nri-source {
            margin: 0;
            font-size: 11px;
            line-height: 1.5;
            color: var(--nri-label);
        }
        ${Q} .nri-source {
            white-space: pre-wrap;
            word-break: break-all;
        }
        ${Q} .nri-json-line {
            position: relative;
            padding-left: 14px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        ${Q} .nri-json-toggle {
            border-radius: 4px;
            cursor: default;
        }
        ${Q} .nri-json-toggle:hover {
            background: var(--nri-row-alt);
        }
        ${Q} .nri-json-chevron {
            position: absolute;
            left: 1px;
            top: 4px;
            color: var(--nri-label-secondary);
        }
        ${Q} .nri-json-chevron svg {
            width: 9px;
            height: 9px;
            transition: transform 0.12s ease;
        }
        ${Q} .nri-json-open > .nri-json-toggle .nri-json-chevron svg {
            transform: rotate(90deg);
        }
        ${Q} .nri-json-children {
            padding-left: 14px;
        }
        ${Q} .nri-json-key {
            color: var(--nri-json-key);
        }
        ${Q} .nri-json-string {
            color: var(--nri-json-string);
        }
        ${Q} .nri-json-number {
            color: var(--nri-json-number);
        }
        ${Q} .nri-json-boolean {
            color: var(--nri-json-boolean);
        }
        ${Q} .nri-json-null,
        ${Q} .nri-json-punct {
            color: var(--nri-label-secondary);
        }
        ${Q} .nri-json-summary {
            margin: 0 4px;
            color: var(--nri-label-secondary);
            font-style: italic;
        }
        ${Q} .nri-json-more {
            margin: 2px 0 2px 14px;
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--nri-blue);
            font-size: 11px;
        }
        ${Q} .nri-json-more:hover {
            text-decoration: underline;
        }

        /* ---- 右键菜单 ---- */
        ${Q} .nri-menu {
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
        ${Q} .nri-menu-item {
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
        ${Q} .nri-menu-item.nri-menu-active {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
        }
        ${Q} .nri-menu-item:focus-visible {
            box-shadow: none;
        }
        ${Q} .nri-menu-item.nri-menu-danger {
            color: var(--nri-red);
        }
        ${Q} .nri-menu-item.nri-menu-danger.nri-menu-active {
            color: var(--nri-selection-fg);
        }
        ${Q} .nri-menu-item:disabled {
            color: var(--nri-label-tertiary);
        }
        ${Q} .nri-menu-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${Q} .nri-menu-shortcut {
            flex-shrink: 0;
            color: var(--nri-label-secondary);
        }
        ${Q} .nri-menu-active .nri-menu-shortcut {
            color: var(--nri-selection-fg-muted);
        }
        ${Q} .nri-menu-separator {
            height: 1px;
            margin: 5px 10px;
            background: var(--nri-separator);
        }

        /* ---- Tooltips: the panel's titles, shown after a rest ---- */
        ${Q} .nri-tooltip {
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
        ${Q} .nri-tooltip[hidden] {
            display: none;
        }

        @media (prefers-reduced-transparency: reduce) {
            ${Q}[data-nri-theme="dark"][data-nri-palette="macos"] {
                --nri-window: rgb(36, 36, 40);
                --nri-panel-backdrop: none;
            }
            ${Q}[data-nri-theme="light"][data-nri-palette="macos"] {
                --nri-window: rgb(250, 250, 250);
                --nri-panel-backdrop: none;
            }
            ${Q} .nri-menu,
            ${Q} .nri-settings {
                background: var(--nri-menu-opaque);
            }
            ${Q} .nri-menu,
            ${Q} .nri-settings,
            ${Q} .nri-toggle {
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            ${Q} .nri-panel.nri-open,
            ${Q} .nri-toggle[aria-expanded="true"] .nri-toggle-chevron {
                animation: none;
            }
            ${Q} .nri-json-chevron svg,
            ${Q} .nri-switch,
            ${Q} .nri-switch::after {
                transition: none;
            }
        }

        /* ---- Mock ---- */
        ${yr(Q)}
        ${Q} .nri-panel[data-view="whats-new"] > .nri-rules {
            display: none;
        }
        ${Q} .nri-title .nri-segment {
            min-width: 0;
        }
        ${Q} .nri-view-count {
            margin-left: 4px;
            padding: 0 5px;
            border-radius: 7px;
            background: var(--nri-fill-pressed);
            font-size: 10px;
            font-variant-numeric: tabular-nums;
        }
        ${Q} .nri-view-count.nri-live {
            background: var(--nri-red);
            color: #fff;
        }
        ${Q} .nri-row-separator {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 20px;
            padding: 0 6px;
            color: var(--nri-label-tertiary);
            font-size: 10px;
        }
        ${Q} .nri-row-separator::before,
        ${Q} .nri-row-separator::after {
            content: "";
            flex: 1;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${Q} .nri-row-mock {
            flex: 0 0 auto;
            padding: 0 5px;
            border-radius: 4px;
            background: color-mix(in srgb, var(--nri-orange) 22%, transparent);
            color: var(--nri-orange);
            font-size: 10px;
            font-weight: 700;
            line-height: 15px;
        }
        ${Q} .nri-row.nri-selected .nri-row-mock {
            background: rgba(255, 255, 255, 0.22);
        }
        ${Q} .nri-detail-mock {
            color: var(--nri-orange);
            font-size: 11px;
            overflow-wrap: anywhere;
            user-select: text;
        }
        ${Q} .nri-detail-mock .nri-text-btn {
            margin-left: 6px;
        }
        ${Q} .nri-btn.nri-mock-has {
            color: var(--nri-orange);
        }
        ${Q} .nri-toggle-mock {
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
        ${Q} .nri-toggle-mock.nri-paused {
            background: var(--nri-orange);
        }
        /* 贴边时只露出一小截：有规则生效就把这一截染红并不透明，免得忘了关 */
        ${Q}.nri-idle .nri-toggle.nri-mock-live {
            opacity: 1;
            background: var(--nri-red);
            color: #fff;
        }
        `,document.head.appendChild(t)}let Ai=(e,t=1.5)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`,ji={clear:Ai(`<path d="M4 6.5h16"/><path d="M9 6.5V4.5h6v2"/><path d="M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>`),copy:Ai(`<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>`),braces:Ai(`<path d="M8.5 3.5h-1A2.5 2.5 0 0 0 5 6v3.5A2.5 2.5 0 0 1 2.5 12 2.5 2.5 0 0 1 5 14.5V18a2.5 2.5 0 0 0 2.5 2.5h1"/><path d="M15.5 3.5h1A2.5 2.5 0 0 1 19 6v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5h-1"/>`),terminal:Ai(`<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5"/><path d="M12.5 15h4.5"/>`),tree:Ai(`<path d="M4 5h7"/><path d="M8 12h12"/><path d="M8 19h12"/><path d="M6 5v14"/><path d="M6 12h2"/><path d="M6 19h2"/>`),code:Ai(`<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13.5 4-3 16"/>`),gear:Ai(`<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`),chevronDown:Ai(`<path d="m6 9.5 6 6 6-6"/>`,2.2),chevronUp:Ai(`<path d="m6 14.5 6-6 6 6"/>`,2.2),search:Ai(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>`,2),xmark:Ai(`<path d="m6 6 12 12"/><path d="M18 6 6 18"/>`,3.5),mock:Ai(`<path d="m4 20 11-11"/><path d="m13.5 7.5 3 3"/><path d="M18 3v3"/><path d="M16.5 4.5h3"/><path d="M20.5 9v2"/><path d="M19.5 10h2"/><path d="M9 3v2"/><path d="M8 4h2"/>`)};function Mi(e){e.addEventListener(`mousedown`,e=>{e.preventDefault()})}function $(e,t,n=`nri-btn`){let r=document.createElement(`button`);return r.type=`button`,r.className=n,r.title=t,r.setAttribute(`aria-label`,t),r.innerHTML=ji[e],Mi(r),r}function Ni(e,t,n){let r=document.createElement(`div`);r.className=`nri-segmented`,r.setAttribute(`role`,`group`),r.setAttribute(`aria-label`,e);let i=t.map(e=>{let t=document.createElement(`button`);return t.type=`button`,t.className=`nri-segment`,t.dataset.value=e.value,t.textContent=e.label,t.title=e.title,Mi(t),t.addEventListener(`click`,()=>{t.getAttribute(`aria-pressed`)!==`true`&&n(e.value)}),r.appendChild(t),t});return{el:r,setValue:e=>{for(let t of i)t.setAttribute(`aria-pressed`,t.dataset.value===e?`true`:`false`)}}}function Pi(e){let t=/* @__PURE__ */ new Set,n=document.createElement(`div`);n.className=`nri-typebar`,n.setAttribute(`role`,`group`),n.setAttribute(`aria-label`,g(`Response type`,`响应类型`));let r=(e,t)=>{let r=document.createElement(`button`);return r.type=`button`,r.className=`nri-type-chip`,r.textContent=e,r.title=t,Mi(r),n.appendChild(r),r},i=r(g(`All`,`全部`),g(`Show all response types`,`显示全部响应类型`));i.addEventListener(`click`,()=>{e(/* @__PURE__ */ new Set)});let a=document.createElement(`span`);a.className=`nri-typebar-sep`,n.appendChild(a);let o=g(`${W()?`⌘`:`Ctrl`}-click to select multiple`,`${W()?`⌘`:`Ctrl`} + 点击可多选`),s=Fn.map(n=>{let i=Ti[n.value],a=r(g(n.label,i.label),g(n.title,i.title));return a.addEventListener(`click`,r=>{if(!(r.metaKey||r.ctrlKey)){e(/* @__PURE__ */ new Set([n.value]));return}let i=new Set(t);i.delete(n.value)||i.add(n.value),e(i)}),{type:n,chip:a}});return{el:n,setValue:e=>{t=e,i.setAttribute(`aria-pressed`,e.size===0?`true`:`false`);for(let{type:t,chip:n}of s)n.setAttribute(`aria-pressed`,e.has(t.value)?`true`:`false`)},setCounts:e=>{for(let{type:t,chip:n}of s){let r=e.get(t.value)??0;n.dataset.empty=r===0?`true`:`false`,n.title=`${t.title} (${r}) · ${o}`}}}}function Fi(e){return e.error===void 0?e.status===void 0?`warning`:e.status===0?`error`:e.status<300?`success`:e.status<400?`info`:`error`:`error`}function Ii(e){return e.error===void 0?e.status===void 0?`…`:String(e.status):`ERR`}function Li(e){if(e.error!==void 0)return g(`Error`,`错误`);if(e.status===void 0)return g(`Pending`,`进行中`);if(e.status===0)return g(`0 No Response`,`0 无响应`);let t=ye(e.status);return t===``?String(e.status):`${e.status} ${t}`}function Ri(e){return e.error!==void 0||e.status!==void 0&&(e.status===0||e.status>=400)}function zi(e){return`nri-method nri-method-${e.toUpperCase()}`}function Bi(e,t){let n=new Date(e),r=(e,t=2)=>String(e).padStart(t,`0`),i=`${r(n.getHours())}:${r(n.getMinutes())}:${r(n.getSeconds())}`;return t?`${i}.${r(n.getMilliseconds(),3)}`:i}function Vi(e){try{let t=new URL(e,location.href);return`${t.pathname}${t.search}`}catch{return e}}function Hi(e){try{return new URL(e,location.href).href}catch{return e}}function Ui(e){return e!=null&&e!==``}async function Wi(e,t){try{await dt(e),z(`success`,t,2e3)}catch(e){console.error(`[NRI] copy failed:`,e),z(`error`,g(`Copy failed`,`复制失败`),2500)}}function Gi(e,t,n,r){let i=t.trim().toLowerCase();return i===``&&n===`all`&&r.size===0?e:e.filter(e=>(n===`all`||(n===`failed`?Ri(e):e.mock!==void 0))&&(r.size===0||r.has(Rn(e)))&&(i===``||e.url.toLowerCase().includes(i)))}function Ki(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Rn(n);t.set(e,(t.get(e)??0)+1)}return t}function qi(e,t){let n=document.createElement(`div`);n.className=`nri-placeholder`;let r=document.createElement(`div`);r.className=`nri-placeholder-title`,r.textContent=e;let i=document.createElement(`div`);return i.textContent=t,n.append(r,i),n}function Ji(e){let t=document.createElement(`div`);return t.className=`nri-empty-hint`,t.textContent=e,t}function Yi(e){let t=document.createElement(`h4`);return t.className=`nri-section-title`,t.textContent=e,t}function Xi(e,t){if(e.length===0)return Ji(g(`None`,`无`));let n=t?[...e].sort((e,t)=>e[0].localeCompare(t[0])):e,r=document.createElement(`table`);r.className=`nri-kv`;let i=document.createElement(`tbody`);for(let[e,t]of n){let n=document.createElement(`tr`),r=document.createElement(`td`);r.className=`nri-kv-key`,r.textContent=e;let a=document.createElement(`td`);a.className=`nri-kv-value`,a.textContent=t,n.append(r,a),i.appendChild(n)}return r.appendChild(i),r}function Zi(e,t,n){let r=document.createDocumentFragment();if(!Ui(e))return r.appendChild(Ji(g(`None`,`无`))),r;if(n===`tree`){let t=typeof e==`string`?B(e):e;if(typeof t==`object`&&t)return r.appendChild(an(t)),r}let i=se(e,t),a=document.createElement(`pre`);if(a.className=`nri-source`,a.textContent=i.text,r.appendChild(a),i.truncated){let e=document.createElement(`div`);e.className=`nri-truncated`,e.textContent=g(`Truncated: ${i.totalChars} characters total`,`已截断：共 ${i.totalChars} 个字符`),r.appendChild(e)}return r}function Qi(e,t,n){let r=document.createDocumentFragment();switch(t){case`body`:e.error===void 0?e.status===void 0?r.appendChild(Ji(g(`Waiting for response…`,`等待响应…`))):r.appendChild(Zi(e.responseBody,e.responseHeaders,n)):r.appendChild(Ji(g(`No response: the request failed.`,`没有响应：请求失败了。`)));break;case`headers`:r.appendChild(Xi(Object.entries(e.responseHeaders??{}),!0));break;case`request`:r.append(Yi(g(`Query`,`查询参数`)),Xi(be(e.url),!1),Yi(g(`Headers`,`请求头`)),Xi(Object.entries(e.requestHeaders??{}),!0),Yi(g(`Body`,`请求体`)),Zi(e.requestBody,e.requestHeaders,n))}return r}function $i(e){return`nri-row-${e}`}function ea(e){let{listEl:t,records:n,emptyTitle:r,emptyHint:i,selectedIds:a,onRowPress:o,onRowContextMenu:s,copyMode:c}=e;if(t.replaceChildren(),n.length===0){t.appendChild(qi(r,i));return}let l=!1;n.forEach((e,n)=>{if(e.restored===!0&&!l){l=!0;let e=document.createElement(`div`);e.className=`nri-row-separator`,e.textContent=g(`Before reload`,`刷新之前`),e.title=g(`Requests captured before the page was reloaded`,`刷新页面之前抓到的请求`),t.appendChild(e)}let r=le(e,c),i=a.has(e.id),u=document.createElement(`div`);u.className=`nri-row`,u.dataset.recordId=e.id,u.id=$i(e.id),u.title=r.url,u.setAttribute(`role`,`option`),u.setAttribute(`aria-selected`,i?`true`:`false`),u.classList.toggle(`nri-alt`,n%2==1),u.classList.toggle(`nri-selected`,i);let d=document.createElement(`span`);d.className=`nri-row-status nri-tone-${Fi(r)}`,d.textContent=Ii(r);let f=document.createElement(`span`);f.className=zi(r.method),f.textContent=r.method.toUpperCase();let p=document.createElement(`span`);p.className=`nri-row-path`,p.textContent=Vi(r.url);let m=document.createElement(`span`);m.className=`nri-row-meta`,m.textContent=e.durationMs===void 0?``:`${e.durationMs} ms`;let h=document.createElement(`span`);if(h.className=`nri-row-meta`,h.textContent=Bi(e.startedAt,!1),u.append(d,f,p),e.mock!==void 0){let t=document.createElement(`span`);t.className=`nri-row-mock`,t.textContent=`MOCK`,t.title=g(`Response from a mock rule (${vr(e.mock.mode)})`,`返回来自 Mock 规则（${vr(e.mock.mode)}）`),u.append(t)}u.append(m,h),u.addEventListener(`mousedown`,t=>{t.button===0&&o(e.id,t)}),u.addEventListener(`contextmenu`,t=>{t.preventDefault(),t.stopPropagation(),s(e,t)}),t.appendChild(u)})}function ta(e,t){let n=e.getBoundingClientRect(),r=t.getBoundingClientRect();r.top<n.top?e.scrollTop-=n.top-r.top+4:r.bottom>n.bottom&&(e.scrollTop+=r.bottom-n.bottom+4)}function na(e){let t=document.documentElement??document.body;t===null?document.addEventListener(`DOMContentLoaded`,()=>{document.documentElement.appendChild(e)},{once:!0}):t.appendChild(e)}function ra({initialView:t=`requests`,settingsOpen:n=!1}={}){if(document.getElementById(Ci)!==null)return;let r=new AbortController,{signal:i}=r,a=[];ki();let o=_n(),s=``,c=`all`,l=/* @__PURE__ */ new Set,u=[],_=[],v=dn,y=`body`,b=`requests`,ee=`tree`,te=En(),ne=e.panelDefaultBottom,x=Rt(),S=Ht(),C=document.createElement(`div`);C.id=Ci;let re=e=>{ne=e,C.style.setProperty(`--nri-panel-bottom`,`${e}px`)},w=document.createElement(`div`);w.className=`nri-panel`,w.tabIndex=-1,w.setAttribute(`role`,`dialog`),w.setAttribute(`aria-label`,g(`Network Requests`,`网络请求`));let ie=e=>{te=e,w.style.setProperty(`--nri-panel-w`,`${e.width}px`),w.style.setProperty(`--nri-panel-h`,`${e.height}px`)};ie(te);let ae=()=>_.find(e=>e.id===v.focusId),oe=()=>_.filter(e=>v.ids.has(e.id)),ce=()=>{let e=window.getSelection();if(e===null||e.isCollapsed||e.toString()===``)return!1;for(let t=0;t<e.rangeCount;t+=1)if(w.contains(e.getRangeAt(t).commonAncestorContainer))return!0;return!1},ue=e=>{Wi(he(e,S),g(`Request and response copied`,`已复制请求和响应`))},de=e=>{let t=le(e,S);return _e({...t,url:Hi(t.url)},`raw`)},fe=e=>Hi(le(e,S).url),pe=e=>{Wi(de(e),g(`cURL command copied`,`已复制 cURL 命令`))},me=e=>{Wi(fe(e),g(`URL copied`,`已复制 URL`))},T=e=>{let t=le(e,S);Wi(se(t.responseBody,t.responseHeaders).text,g(`Response body copied`,`已复制响应体`))},ve=()=>{_.length===0?z(`info`,g(`No requests to copy`,`没有可复制的请求`),1500):Wi(ge(_,S),g(`Copied ${_.length} requests and responses`,`已复制 ${_.length} 个请求和响应`))},ye=e=>{Wi(ge(e,S),g(`Copied ${e.length} requests and responses`,`已复制 ${e.length} 个请求和响应`))},be=e=>{e.length>1?ye(e):e[0]!==void 0&&ue(e[0])},xe=e=>{Wi(e.map(de).join(`

`),g(`Copied ${e.length} cURL commands`,`已复制 ${e.length} 条 cURL 命令`))},D=e=>{Wi(e.map(fe).join(`
`),g(`Copied ${e.length} URLs`,`已复制 ${e.length} 个 URL`))},O=()=>{nt(),z(`info`,g(`Cleared`,`已清空`),1500)},k=document.createElement(`div`);k.className=`nri-toolbar`;let Se=document.createElement(`div`);Se.className=`nri-title`;let Ce=Ni(g(`Panel view`,`面板视图`),[{value:`requests`,label:g(`Requests`,`请求`),title:g(`Requests captured on this page`,`这个页面抓到的请求`)},{value:`rules`,label:g(`Rules`,`规则`),title:g(`Mock rules for this site: change the responses of matching requests`,`这个网站的 Mock 规则：改写匹配请求的返回`)}],e=>{fr(e,!0)});Ce.setValue(b);let we=document.createElement(`span`);we.className=`nri-view-count`,Ce.el.querySelector(`[data-value="rules"]`)?.append(we),Se.append(Ce.el);let Te=document.createElement(`div`);Te.className=`nri-actions`;let Ee=Ni(g(`Copy and details mode`,`复制和详情的显示方式`),[{value:`redacted`,label:g(`Redacted`,`脱敏`),title:g(`Hide credentials (tokens, cookies, passwords) in details and copies`,`详情和复制内容里隐藏凭证（token、cookie、密码等）`)},{value:`raw`,label:g(`Raw`,`原文`),title:g(`Show captured values unredacted`,`按抓到的原样显示，不脱敏`)}],e=>{S=e,Ee.setValue(e),Ut(e),Sn()});Ee.setValue(S);let De=$(`copy`,g(`Copy all visible requests and responses as Markdown`,`把列表里看得到的全部请求和响应复制为 Markdown`));De.addEventListener(`click`,ve);let Oe=$(`clear`,g(`Clear the request list (${G(`k`)})`,`清空请求列表（${G(`k`)}）`));Oe.addEventListener(`click`,O);let ke=document.createElement(`span`);ke.className=`nri-toolbar-sep`;let A=$(`gear`,g(`Settings: appearance, language, shortcut, updates`,`设置：外观、语言、快捷键、更新`));A.setAttribute(`aria-haspopup`,`dialog`),A.setAttribute(`aria-expanded`,`false`);let Ae=Nn(),je=Ni(g(`Style`,`配色`),[{value:`vscode`,label:`VS Code`,title:g(`VS Code colors`,`VS Code 配色`)},{value:`macos`,label:`macOS`,title:g(`macOS system colors with translucency`,`macOS 系统配色，半透明毛玻璃`)}],e=>{Me(e),Pn(e)}),Me=e=>{Ae=e,C.dataset.nriPalette=e,st(jn(Ne),e),je.setValue(e)},Ne=kn(),Pe=Ni(g(`Theme`,`主题`),[{value:`system`,label:g(`System`,`跟随系统`),title:g(`Follow the browser's appearance`,`跟随浏览器的明暗设置`)},{value:`light`,label:g(`Light`,`浅色`),title:g(`Always light`,`始终浅色`)},{value:`dark`,label:g(`Dark`,`深色`),title:g(`Always dark`,`始终深色`)}],e=>{Fe(e),An(e)}),Fe=e=>{Ne=e;let t=jn(e);C.dataset.nriTheme=t,st(t,Ae),Pe.setValue(e)};Fe(Ne),Me(Ae);let Ie=window.matchMedia(`(prefers-color-scheme: dark)`),Le=()=>{Ne===`system`&&Fe(`system`)};typeof Ie.addEventListener==`function`?Ie.addEventListener(`change`,Le,{signal:i}):(Ie.addListener(Le),a.push(()=>Ie.removeListener(Le))),Te.append(Ee.el,De,Oe,ke,A),k.append(Se,Te);let Re=document.createElement(`div`);Re.className=`nri-searchbar`;let ze=document.createElement(`label`);ze.className=`nri-search-field`,ze.innerHTML=ji.search;let M=document.createElement(`input`);M.type=`search`,M.className=`nri-search-input`,M.placeholder=g(`Filter URL (${G(`f`)})`,`筛选 URL（${G(`f`)}）`),M.spellcheck=!1,M.autocomplete=`off`,M.setAttribute(`aria-label`,g(`Filter by URL`,`按 URL 筛选`));let N=document.createElement(`span`);N.className=`nri-search-count`,N.hidden=!0;let P=$(`xmark`,g(`Clear filter`,`清除筛选`),`nri-search-clear`);P.tabIndex=-1,P.hidden=!0,ze.append(M,N,P);let Ue=Ni(g(`Request scope`,`请求范围`),[{value:`all`,label:g(`All`,`全部`),title:g(`Show all requests`,`显示全部请求`)},{value:`failed`,label:g(`Failed`,`失败`),title:g(`Show only failed requests (status 0, 4xx, 5xx, network errors)`,`只看失败的请求（状态码 0、4xx、5xx、网络错误）`)},{value:`mocked`,label:g(`Mocked`,`已模拟`),title:g(`Show only requests whose response came from a mock rule`,`只看返回被 Mock 规则改过的请求`)}],e=>{c=e,Ue.setValue(e),Sn()});Ue.setValue(c),Re.append(ze,Ue.el);let Ge=Pi(e=>{l=e,Ge.setValue(e),Sn()});Ge.setValue(l);let F=document.createElement(`div`);F.className=`nri-list`,F.tabIndex=0,F.setAttribute(`role`,`listbox`),F.setAttribute(`aria-multiselectable`,`true`),F.setAttribute(`aria-label`,g(`Requests`,`请求`));let Ke=document.createElement(`div`);Ke.className=`nri-detail`;let qe=e=>{x=e,Ke.style.setProperty(`--nri-detail-h`,`${e}px`)};qe(x);let Je=Bt(()=>Math.round(Ke.getBoundingClientRect().height)||x,qe),Xe=document.createElement(`div`);Xe.className=`nri-detail-header`;let Ze=document.createElement(`div`);Ze.className=`nri-detail-summary`;let I=document.createElement(`span`),Qe=document.createElement(`span`);Qe.className=`nri-summary-meta`;let $e=document.createElement(`span`);$e.className=`nri-summary-meta`,$e.title=g(`Response body size`,`响应体大小`);let et=document.createElement(`span`);et.className=`nri-summary-meta`,et.title=g(`Started at`,`开始时间`);let L=document.createElement(`span`);L.className=`nri-summary-meta`,Ze.append(I,Qe,$e,et,L);let tt=$(`xmark`,g(`Close details (Esc)`,`关闭详情（Esc）`),`nri-close-btn`);tt.addEventListener(`click`,()=>{U(dn,!1),F.focus({preventScroll:!0})});let it=document.createElement(`div`);it.className=`nri-detail-titlebar`,it.append(Ze,tt);let R=document.createElement(`div`);R.className=`nri-detail-url`;let at=document.createElement(`span`),ot=document.createElement(`span`);ot.className=`nri-detail-url-text`,R.append(at,ot);let ct=document.createElement(`div`);ct.className=`nri-detail-error`;let lt=document.createElement(`div`);lt.className=`nri-detail-mock`,lt.hidden=!0;let ut=document.createElement(`div`);ut.className=`nri-detail-bar`;let dt=Ni(g(`Detail view`,`详情视图`),[{value:`body`,label:g(`Body`,`响应体`),title:g(`Response body`,`响应体`)},{value:`headers`,label:g(`Headers`,`响应头`),title:g(`Response headers`,`响应头`)},{value:`request`,label:g(`Request`,`请求`),title:g(`Request query, headers, and body`,`请求的查询参数、请求头和请求体`)}],e=>{Qt(e)});dt.setValue(y);let ft=document.createElement(`span`);ft.className=`nri-spacer`;let B=$(`code`,``),pt=e=>{ee=e;let t=e===`tree`?g(`Show as formatted text instead of a tree`,`改为显示格式化后的原文`):g(`Show as a collapsible JSON tree`,`改为显示可折叠的 JSON 树`);B.innerHTML=ji[e===`tree`?`code`:`tree`],B.title=t,B.setAttribute(`aria-label`,t),B.setAttribute(`aria-pressed`,e===`source`?`true`:`false`)};pt(ee),B.addEventListener(`click`,()=>{pt(ee===`tree`?`source`:`tree`),Zt()});let mt=e=>()=>{let t=ae();t!==void 0&&e(t)},ht=$(`copy`,g(`Copy this request and its response as Markdown (${G(`c`)})`,`把这个请求和它的响应复制为 Markdown（${G(`c`)}）`));ht.addEventListener(`click`,mt(ue));let gt=$(`braces`,g(`Copy the response body`,`复制响应体`));gt.addEventListener(`click`,mt(T));let _t=$(`terminal`,g(`Copy as a cURL command to replay it in a terminal`,`复制为 cURL 命令，可在终端里重放`));_t.addEventListener(`click`,mt(pe));let vt=$(`mock`,``);vt.addEventListener(`click`,mt(e=>pr(e)));let yt=$(`search`,g(`Find text in the details (${G(`f`)})`,`在详情里查找文字（${G(`f`)}）`)),bt=document.createElement(`div`);bt.className=`nri-find-bar`,bt.hidden=!0;let xt=document.createElement(`label`);xt.className=`nri-search-field`,xt.innerHTML=ji.search;let V=document.createElement(`input`);V.type=`search`,V.className=`nri-search-input`,V.placeholder=g(`Find`,`查找`),V.spellcheck=!1,V.autocomplete=`off`,V.setAttribute(`aria-label`,g(`Find in details`,`在详情里查找`));let St=document.createElement(`span`);St.className=`nri-search-count`,St.setAttribute(`aria-live`,`polite`),xt.append(V,St);let Ct=$(`chevronUp`,g(`Previous match (⇧Return)`,`上一个（⇧Return）`)),wt=$(`chevronDown`,g(`Next match (Return)`,`下一个（Return）`)),Tt=$(`xmark`,g(`Close find (Esc)`,`关闭查找（Esc）`),`nri-close-btn`);bt.append(xt,Ct,wt,Tt),ut.append(dt.el,ft,yt,B,vt,ht,gt,_t),Xe.append(it,R,ct,lt,ut,bt);let H=document.createElement(`div`);H.className=`nri-detail-content`,H.tabIndex=0,H.setAttribute(`role`,`region`),H.setAttribute(`aria-label`,g(`Request details`,`请求详情`)),Ke.append(Je.top,Xe,H);let Et=[],Dt=0,Ot,kt=()=>!bt.hidden,At=()=>kt()&&!Ke.hidden?Wt(V.value):void 0,jt=typeof CSS<`u`?CSS.highlights:void 0,Mt=()=>{if(jt===void 0)return;let e=At();if(e===void 0){jt.delete(`nri-find`),jt.delete(`nri-find-current`);return}jt.set(`nri-find`,new Highlight(...qt(H,e,Di,Oi)));let t=new Highlight(...Ot===void 0?[]:[Ot]);t.priority=1,jt.set(`nri-find-current`,t)};new MutationObserver(Mt).observe(H,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`hidden`]});let It=()=>{let e=Et.length,t=e>=Oi?`+`:``;St.textContent=V.value===``?``:e===0?g(`No matches`,`没有匹配`):g(`${Dt+1} of ${e}${t}`,`${Dt+1} / ${e}${t}`),Ct.disabled=e===0,wt.disabled=e===0,yt.setAttribute(`aria-pressed`,kt()?`true`:`false`)},zt=(e,t)=>{let n=Et.length;Dt=n===0?0:(e+n)%n,Ot=Et.at(Dt)?.(),Mt(),t&&Ot!==void 0&&Yt(H,Ot),It()},Vt=e=>{let t=[];for(let n of H.children){let r=Oi-t.length;if(r<=0)break;let i=sn(n,e,r);if(i===void 0)for(let i of qt(n,e,Di,r))t.push(()=>i);else for(let r of i)t.push(()=>{let t=n instanceof HTMLElement?cn(n,r):void 0;return t===void 0?void 0:qt(t,e,Di).at(r.occurrence)})}return t},Gt=e=>{let t=At();Et=t===void 0?[]:Vt(t),zt(e?Math.min(Dt,Et.length-1):0,!e)},Kt=()=>{bt.hidden=!1,V.focus({preventScroll:!0}),V.select(),Gt(!1)},Jt=()=>{bt.hidden=!0,Gt(!1),H.focus({preventScroll:!0})};yt.addEventListener(`click`,()=>{kt()?Jt():Kt()}),V.addEventListener(`input`,()=>{Gt(!1)}),Ct.addEventListener(`click`,()=>{zt(Dt-1,!0)}),wt.addEventListener(`click`,()=>{zt(Dt+1,!0)}),Tt.addEventListener(`click`,Jt),It();let Xt,Zt=()=>{let e=ae();if(Ke.hidden=e===void 0,e===void 0){Xt=void 0,H.replaceChildren(),Gt(!1);return}if(Xt?.record===e&&Xt.copyMode===S&&Xt.tab===y&&Xt.view===ee)return;let t=Xt?.record.id===e.id&&Xt.tab===y,n=H.scrollTop,r=le(e,S);I.className=`nri-status-pill nri-tone-${Fi(r)}`,I.textContent=Li(r),Qe.textContent=r.durationMs===void 0?`— ms`:`${r.durationMs} ms`,$e.textContent=E(r.responseBody),et.textContent=Bi(r.startedAt,!0),L.textContent=r.source===`xhr`?`XHR`:`Fetch`,at.className=zi(r.method),at.textContent=r.method.toUpperCase(),ot.textContent=Hi(r.url),ot.title=ot.textContent,ct.hidden=r.error===void 0,ct.textContent=r.error??``,mr(r),hr(),B.hidden=y===`headers`,gt.disabled=!Ui(r.responseBody),H.replaceChildren(Qi(r,y,ee)),H.scrollTop=t?n:0,Xt={record:e,copyMode:S,tab:y,view:ee},Gt(t)},Qt=e=>{y=e,dt.setValue(e),Zt()},$t=e=>{let t=Ei.indexOf(y)+e,n=Ei[Math.max(0,Math.min(Ei.length-1,t))];n!==void 0&&Qt(n)},en=e=>{for(let e of F.querySelectorAll(`.nri-row`)){let t=e.dataset.recordId!==void 0&&v.ids.has(e.dataset.recordId);e.classList.toggle(`nri-selected`,t),e.setAttribute(`aria-selected`,t?`true`:`false`)}let t=Ke.hidden;Zt();let{focusId:n}=v;if(n===void 0)F.removeAttribute(`aria-activedescendant`);else{F.setAttribute(`aria-activedescendant`,$i(n));let r=e||t&&!Ke.hidden?document.getElementById($i(n)):null;r!==null&&ta(F,r)}},U=(e,t)=>{v=e,en(t)},tn=()=>_.map(e=>e.id),nn=()=>{let e=s.trim()!==``||c!==`all`||l.size>0;P.hidden=s===``,N.hidden=!e,N.textContent=e?g(`${_.length} of ${u.length}`,`${_.length} / ${u.length}`):``},rn=()=>{if(u.length===0)return[g(`No Requests`,`还没有请求`),g(`Static assets are filtered`,`静态资源不会记录`)];if(s.trim()!==``)return[g(`No Results`,`没有结果`),g(`No URL matches “${s.trim()}”`,`没有 URL 包含“${s.trim()}”`)];if(l.size>0){let e=Fn.filter(e=>l.has(e.value)).map(e=>g(e.label,Ti[e.value].label)).join(`, `),t=c===`failed`?`failed `:c===`mocked`?`mocked `:``,n=c===`failed`?`失败的`:c===`mocked`?`已模拟的`:``;return[g(`No Results`,`没有结果`),g(`No ${t}${e} requests`,`没有${n} ${e} 请求`)]}return c===`mocked`?[g(`No Mocked Requests`,`没有被模拟的请求`),g(`Requests answered by a mock rule show up here`,`返回被 Mock 规则改过的请求会显示在这里`)]:[g(`No Failed Requests`,`没有失败的请求`),g(`Everything succeeded so far`,`目前都成功了`)]},an=()=>[{label:g(`Copy All Visible Requests`,`复制全部可见请求`),onSelect:ve,disabled:_.length===0},{label:g(`Clear Requests`,`清空请求`),shortcut:G(`k`),onSelect:O,disabled:u.length===0}],on=e=>[{label:g(`Copy ${e.length} Requests and Responses`,`复制这 ${e.length} 个请求和响应`),shortcut:G(`c`),onSelect:()=>ye(e)},{label:g(`Copy ${e.length} as cURL`,`复制这 ${e.length} 个为 cURL`),onSelect:()=>xe(e)},{label:g(`Copy ${e.length} URLs`,`复制这 ${e.length} 个 URL`),onSelect:()=>D(e)},`separator`,...an()],yn=e=>[{label:Ye(e.method,e.url)===void 0?g(`Mock This Request`,`Mock 这个请求`):g(`Edit Mock Rule`,`编辑 Mock 规则`),onSelect:()=>pr(e)},`separator`,{label:g(`Copy Request and Response`,`复制请求和响应`),shortcut:G(`c`),onSelect:()=>ue(e)},{label:g(`Copy as cURL`,`复制为 cURL`),onSelect:()=>pe(e)},{label:g(`Copy URL`,`复制 URL`),onSelect:()=>me(e)},{label:g(`Copy Response Body`,`复制响应体`),disabled:!Ui(e.responseBody),onSelect:()=>T(e)},`separator`,...an()],Sn=()=>{_=Gi(u,s,c,l),Ge.setCounts(Ki(u)),v=gn(tn(),v),nn();let[e,t]=rn();Wn(F,()=>{ea({listEl:F,records:_,emptyTitle:e,emptyHint:t,selectedIds:v.ids,onRowPress:(e,t)=>{let n=W();n&&t.ctrlKey||((n?t.metaKey:t.ctrlKey)?U(pn(v,e),!1):t.shiftKey?(t.preventDefault(),F.focus({preventScroll:!0}),U(mn(tn(),v,e),!1)):U(fn(e),!1))},onRowContextMenu:(e,t)=>{v.ids.has(e.id)||U(fn(e.id),!1),F.focus({preventScroll:!0});let n=oe();Ft(C,n.length>1?on(n):yn(e),t.clientX,t.clientY)},copyMode:S})}),en(!1)};F.addEventListener(`mousedown`,e=>{e.button===0&&e.target instanceof Element&&e.target.closest(`.nri-row`)===null&&U(dn,!1)}),F.addEventListener(`contextmenu`,e=>{e.preventDefault(),F.focus({preventScroll:!0}),Ft(C,an(),e.clientX,e.clientY)});let wn=e=>{M.value=e,s=e,Sn()};M.addEventListener(`input`,()=>{s=M.value,Sn()}),P.addEventListener(`click`,e=>{e.preventDefault(),wn(``),M.focus()});let K=document.createElement(`div`);K.className=`nri-settings`,K.setAttribute(`role`,`dialog`),K.setAttribute(`aria-label`,g(`Settings`,`设置`)),K.tabIndex=-1,K.hidden=!0;let On=(e,...t)=>{let n=document.createElement(`div`);n.className=`nri-settings-section`;let r=document.createElement(`div`);return r.className=`nri-settings-heading`,r.textContent=e,n.append(r,...t),n},Mn=(e,...t)=>{let n=document.createElement(`div`);n.className=`nri-settings-row`;let r=document.createElement(`span`);return r.className=`nri-settings-label`,r.textContent=e,n.append(r,...t),n},In=Ur(),q=!1,J=document.createElement(`button`);J.type=`button`,J.className=`nri-keycap`;let Ln=document.createElement(`button`);Ln.type=`button`,Ln.className=`nri-text-btn`,Ln.textContent=g(`Reset`,`恢复默认`),Mi(Ln);let Rn=document.createElement(`div`);Rn.className=`nri-settings-hint`;let zn=()=>In===null?g(`None`,`无`):Zr(In,W()),Bn=()=>{J.setAttribute(`aria-pressed`,q?`true`:`false`),J.dataset.empty=In===null?`true`:`false`,J.textContent=q?g(`Press keys…`,`请按键…`):zn();let e=q?g(`Recording shortcut`,`正在录制快捷键`):g(`Show/Hide panel shortcut: ${zn()}. Click to change`,`显示 / 隐藏面板的快捷键：${zn()}。点击修改`);J.title=e,J.setAttribute(`aria-label`,e),Ln.hidden=q||Gr(In,Lr),Ln.title=g(`Reset to ${Zr(Lr,W())}`,`恢复为 ${Zr(Lr,W())}`),Rn.textContent=q?g(`Esc cancels · Delete disables`,`Esc 取消 · Delete 停用`):In===null?g(`Click to set a shortcut`,`点击设置快捷键`):Jr(In)?g(`Ignored while typing`,`在输入框里打字时不生效`):``},Vn=e=>{In=e,Wr(e),Bn(),Vr()},Hn=()=>{q&&(q=!1,Bn())};J.addEventListener(`click`,()=>{q?Hn():(q=!0,Bn(),J.focus({preventScroll:!0}))}),J.addEventListener(`blur`,Hn),J.addEventListener(`keydown`,e=>{if(!q||e.isComposing)return;e.preventDefault(),e.stopPropagation();let t=!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey;if(t&&e.key===`Escape`){Hn();return}if(t&&(e.key===`Backspace`||e.key===`Delete`)){q=!1,Vn(null),z(`info`,g(`Show/Hide shortcut disabled`,`已停用显示 / 隐藏快捷键`),1800);return}let n=Kr(e);if(n===void 0)return;let r=Yr(n,W());r===void 0?(q=!1,Vn(n),z(`success`,g(`Show/Hide shortcut set to ${zn()}`,`显示 / 隐藏快捷键已设为 ${zn()}`),1800)):z(`warning`,g(`${Zr(n,W())} is ${r}`,`${Zr(n,W())} ${r===`used to navigate the panel`?`用于在面板里移动`:`已被面板或编辑操作占用`}`),2200)}),Ln.addEventListener(`click`,()=>{Vn(Lr),z(`success`,g(`Show/Hide shortcut set to ${zn()}`,`显示 / 隐藏快捷键已设为 ${zn()}`),1800)}),Bn();let Un=gi(),Gn=si(),Kn=document.createElement(`span`);Kn.className=`nri-settings-value`,Kn.textContent=_i();let qn=document.createElement(`button`);qn.type=`button`,qn.className=`nri-text-btn`,qn.textContent=g(`What's New`,`更新说明`),qn.title=g(`Show the release notes of every version up to this one`,`查看到当前版本为止每个版本的更新说明`),Mi(qn);let Jn=document.createElement(`button`);Jn.type=`button`,Jn.className=`nri-switch`,Jn.setAttribute(`role`,`switch`),Jn.setAttribute(`aria-label`,g(`Include beta versions`,`接收测试版`)),Mi(Jn);let Yn=document.createElement(`button`);Yn.type=`button`,Yn.className=`nri-push-btn`,Mi(Yn);let Xn=document.createElement(`span`);Xn.className=`nri-update-status`;let Zn=document.createElement(`a`);Zn.className=`nri-link`,Zn.target=`_blank`,Zn.rel=`noopener noreferrer`;let Qn=Mn(g(`Beta Versions`,`测试版`),Jn);Qn.title=g(`Also offer beta versions; while on, checks once a day`,`同时提示测试版；打开后每天自动检查一次`);let $n=document.createElement(`div`);$n.className=`nri-settings-row`,$n.append(Yn,Xn,Zn),Qn.hidden=Un.update===void 0,$n.hidden=Un.update===void 0;let er=d(),tr=Ni(g(`Language`,`语言`),[{value:`auto`,label:g(`Auto`,`自动`),title:g(`Follow the browser's language`,`跟随浏览器语言`)},{value:`en`,label:`English`,title:`English`},{value:`zh`,label:`中文`,title:`简体中文`}],e=>{f(e);let t=p(e);tr.setValue(e),t!==h()&&(m(t),ai({view:b,settingsOpen:!0}))});tr.setValue(er),K.append(On(g(`Appearance`,`外观`),Mn(g(`Style`,`配色`),je.el),Mn(g(`Theme`,`主题`),Pe.el),Mn(g(`Language`,`语言`),tr.el)),On(g(`Keyboard`,`键盘`),Mn(g(`Show/Hide Panel`,`显示 / 隐藏面板`),Ln,J),Rn),On(g(`Updates`,`更新`),Mn(g(`Version`,`版本`),qn,Kn),Qn,$n));let rr,ar=e=>{window.clearTimeout(rr),Yn.disabled=e.status===`checking`,Yn.textContent=e.status===`checking`?g(`Checking…`,`正在检查…`):g(`Check for Updates`,`检查更新`),Zn.hidden=e.status!==`available`,Xn.hidden=e.status===`available`,A.dataset.badge=e.status===`available`?`true`:`false`,Xn.title=e.status===`failed`?e.reason:``,e.status===`available`?(Zn.textContent=g(`Install v${e.version}`,`安装 v${e.version}`),Zn.title=g(`Install v${e.version} with Tampermonkey`,`用 Tampermonkey 安装 v${e.version}`)):e.status===`up-to-date`||e.status===`failed`?(Xn.textContent=e.status===`up-to-date`?g(`Up to date`,`已是最新版本`):g(`Update check failed`,`检查更新失败`),rr=window.setTimeout(()=>ar({status:`idle`}),e.status===`up-to-date`?3e3:5e3)):Xn.textContent=``},or=()=>{Jn.setAttribute(`aria-checked`,Gn?`true`:`false`)},sr=0,cr=({background:e})=>{let t=Un.update;if(t===void 0)return;let n=t[li(Gn)],r=++sr;e||ar({status:`checking`}),oi({manifestUrl:n.manifestUrl,currentVersion:Un.version}).then(t=>{r===sr&&(t.status===`available`&&(Zn.href=n.installUrl,e&&z(`info`,g(`Network Request Inspector v${t.version} is available`,`有新版本 v${t.version} 可以安装`),4e3)),(!e||t.status===`available`)&&ar(t))})};Yn.addEventListener(`click`,()=>{cr({background:!1})}),Jn.addEventListener(`click`,()=>{Gn=!Gn,ci(Gn),or(),Gn?(di(),cr({background:!1})):(sr++,ar({status:`idle`}))}),or(),ar({status:`idle`}),Gn&&Un.update!==void 0&&di()&&cr({background:!0});let lr=Un.changelog??[],ur=Ir({findRealResponse:e=>nr(u,e)}),dr=()=>{gr.hidden&&(b===`rules`?w.dataset.view=`rules`:delete w.dataset.view)};function fr(e,t){b=e,Ce.setValue(e),ur.el.hidden=e!==`rules`,dr(),Nt(),t&&!o&&(e===`rules`?ur.focus():F.focus({preventScroll:!0}))}function pr(e){let t=Ye(e.method,e.url),n=t??We(ir({record:e,records:u,pageOrigin:location.origin}));fr(`rules`,!1),ur.reveal(n.id),t===void 0&&z(`success`,n.orig===void 0?g(`Rule created with a default 500 response (no captured response to copy)`,`已建规则，使用默认的 500 返回（没有抓到可带入的真实返回）`):g(`Rule created from the captured response; edit it below`,`已按抓到的真实返回建好规则，在下面修改`),2500)}function mr(e){let t=e.mock;if(lt.hidden=t===void 0,t===void 0){lt.replaceChildren();return}let n;if(t.mode===`block`)n=g(`Answered by a mock rule — the request never reached the server.`,`返回来自 Mock 规则，请求没有发到服务器。`);else if(t.mode===`hang`)n=g(`Held by a mock rule — the request was not sent and never completes.`,`被 Mock 规则挂起：请求没有发出，也不会返回。`);else if(t.real===void 0)n=g(`Response replaced by a mock rule (pass-through) — waiting for the server.`,`返回被 Mock 规则替换（放行），正在等服务器响应。`);else if(t.real.error!==void 0)n=g(`Response replaced by a mock rule (pass-through). The real request failed: ${t.real.error}.`,`返回被 Mock 规则替换（放行）。真实请求失败了：${t.real.error}。`);else{let r=Li({...e,error:void 0,status:t.real.status});n=g(`Response replaced by a mock rule (pass-through). The server really answered ${r}.`,`返回被 Mock 规则替换（放行）。服务器真实返回的是 ${r}。`)}let r=document.createElement(`button`);r.type=`button`,r.className=`nri-text-btn`,r.textContent=g(`Show rule`,`查看规则`),r.addEventListener(`click`,()=>{let e=Be().some(e=>e.id===t.ruleId);fr(`rules`,!1),e?ur.reveal(t.ruleId):z(`info`,g(`That rule has been deleted`,`这条规则已经删除了`),2e3)}),lt.replaceChildren(n,r)}function hr(){let e=ae(),t=e!==void 0&&Ye(e.method,e.url)!==void 0,n=t?g(`Edit the mock rule for this request (it is already mocked)`,`编辑这个请求的 Mock 规则（已经有规则了）`):g(`Mock this request: create a rule from its real response, then change the status or body`,`Mock 这个请求：按它的真实返回建一条规则，再改状态码或响应体`);vt.title=n,vt.setAttribute(`aria-label`,n),vt.classList.toggle(`nri-mock-has`,t)}let gr=document.createElement(`div`);gr.className=`nri-whats-new`,gr.setAttribute(`role`,`region`),gr.setAttribute(`aria-label`,g(`What's New`,`更新说明`)),gr.hidden=!0;let _r=document.createElement(`div`);_r.className=`nri-whats-new-header`;let vr=document.createElement(`h3`);vr.className=`nri-whats-new-title`,vr.textContent=g(`What's New`,`更新说明`);let yr=document.createElement(`p`);yr.className=`nri-whats-new-subtitle`,_r.append(vr,yr);let Y=document.createElement(`div`);Y.className=`nri-whats-new-notes`,Y.tabIndex=0;let X=document.createElement(`button`);X.type=`button`,X.className=`nri-push-btn nri-primary`,X.textContent=g(`Done`,`完成`);let br=document.createElement(`div`);br.className=`nri-whats-new-actions`,br.append(X),gr.append(_r,Y,br);let xr=(e,t)=>{for(let n of vi(t)){if(n.kind===`text`){e.append(n.text);continue}let t=document.createElement(n.kind===`code`?`code`:`strong`);t.textContent=n.text,e.append(t)}},Sr=e=>{let t=document.createElement(`section`);t.className=`nri-whats-new-version`;let n=document.createElement(`h4`);n.textContent=`v${e.version}`;let r=document.createElement(`span`);r.className=`nri-whats-new-date`,r.textContent=e.date,n.append(r),t.append(n);for(let n of e.sections){let e=document.createElement(`div`);e.className=`nri-whats-new-section`,e.textContent=n.title;let r=document.createElement(`ul`);for(let e of n.items){let t=document.createElement(`li`);if(xr(t,e.text),e.children.length>0){let n=document.createElement(`ul`);for(let t of e.children){let e=document.createElement(`li`);xr(e,t),n.append(e)}t.append(n)}r.append(t)}t.append(e,r)}return t},Cr=()=>!gr.hidden,wr=({from:e,entries:t})=>{yr.textContent=e===void 0?`Network Request Inspector ${_i()}`:g(`Updated from v${e} to ${_i()}`,`已从 v${e} 更新到 ${_i()}`),Y.replaceChildren(...t.map(Sr)),Y.scrollTop=0,gr.hidden=!1,w.dataset.view=`whats-new`,o||X.focus({preventScroll:!0})},Tr=()=>{if(!Cr())return;let e=gr.contains(document.activeElement);gr.hidden=!0,dr(),e&&!o&&(b===`rules`?ur.focus():F.focus({preventScroll:!0}))},Er=()=>{let e=Si({changelog:lr,current:Un.version});e!==void 0&&wr(e)};X.addEventListener(`click`,Tr);let Dr,Or=()=>!K.hidden,kr=()=>{let e=A.getBoundingClientRect(),t=K.getBoundingClientRect(),n=Math.min(Math.max(4,e.right-t.width),window.innerWidth-t.width-4),r=e.bottom+4;r+t.height>window.innerHeight-4&&(r=Math.max(4,e.top-4-t.height)),K.style.left=`${n}px`,K.style.top=`${r}px`},Ar=e=>{e.target instanceof Node&&(K.contains(e.target)||A.contains(e.target))||jr(!1)},jr=e=>{Or()&&(Hn(),K.hidden=!0,A.setAttribute(`aria-expanded`,`false`),A.setAttribute(`aria-pressed`,`false`),window.removeEventListener(`pointerdown`,Ar,!0),window.removeEventListener(`resize`,kr),e&&Dr?.isConnected===!0&&Dr.focus({preventScroll:!0}))},Mr=()=>{Nt(),Dr=document.activeElement instanceof HTMLElement?document.activeElement:void 0,K.hidden=!1,A.setAttribute(`aria-expanded`,`true`),A.setAttribute(`aria-pressed`,`true`),kr(),K.focus({preventScroll:!0}),window.addEventListener(`pointerdown`,Ar,!0),window.addEventListener(`resize`,kr)};A.addEventListener(`click`,()=>{Or()?jr(!0):Mr()}),qn.addEventListener(`click`,()=>{jr(!1),wr({entries:xi({changelog:lr,current:Un.version})})}),K.addEventListener(`keydown`,e=>{e.key===`Escape`&&(e.preventDefault(),jr(!0)),e.stopPropagation()}),w.append(k,Re,Ge.el,F,Ke,gr,ur.el),Dn(w,()=>te,e=>{ie(e)});let Z=document.createElement(`button`);Z.type=`button`,Z.className=`nri-toggle`;let Nr=document.createElement(`span`);Nr.textContent=`NRI`;let Pr=document.createElement(`span`);Pr.className=`nri-badge`,Pr.textContent=`0`;let Fr=document.createElement(`span`);Fr.className=`nri-toggle-chevron`,Fr.innerHTML=ji.chevronDown;let Rr=document.createElement(`span`);Rr.className=`nri-toggle-mock`,Rr.hidden=!0,Z.append(Nr,Pr,Rr,Fr);let zr=()=>{let e=Be();if(e.length===0)return``;if(Ve())return g(`Mock rules: ${e.length} (paused)`,`Mock 规则：${e.length} 条（已暂停）`);let t=j(e,!1);return t>0?g(`Mock rules: ${t} active`,`Mock 规则：${t} 条生效中`):g(`Mock rules: ${e.length} (none active)`,`Mock 规则：${e.length} 条（都没生效）`)},Br=()=>{let e=Be(),t=Ve()&&e.length>0,n=j(e,Ve());Rr.hidden=n===0&&!t,Rr.textContent=t?g(`Paused`,`已暂停`):`Mock ${n}`,Rr.classList.toggle(`nri-paused`,t),Z.classList.toggle(`nri-mock-live`,n>0),we.textContent=String(e.length),we.hidden=e.length===0,we.classList.toggle(`nri-live`,n>0),Vr()},Vr=()=>{let e=u.filter(Ri).length,t=e>0?g(`Network Requests: ${u.length} (${e} failed)`,`网络请求：${u.length} 个（${e} 个失败）`):g(`Network Requests: ${u.length}`,`网络请求：${u.length} 个`),n=o?g(`Show Panel`,`显示面板`):g(`Hide Panel`,`隐藏面板`),r=In===null?``:` (${zn()})`,i=zr();Z.title=`${n}${r}\n${t}${i===``?``:`\n${i}`}`,Z.setAttribute(`aria-label`,`${n}${r} — ${t}${i===``?``:` — ${i}`}`),Z.setAttribute(`aria-expanded`,o?`false`:`true`)},Hr=document.createElement(`div`);Hr.className=`nri-dock`,Hr.appendChild(Z);let Xr=()=>{o?(w.classList.remove(`nri-open`),C.classList.add(`nri-idle`)):(w.classList.add(`nri-open`),C.classList.remove(`nri-idle`)),Vr()},Qr=e=>{if(o===e)return;let t=w.contains(document.activeElement)||K.contains(document.activeElement);Nt(),jr(!1),e&&Tr(),o=e,Xr(),vn(o),o?t&&Z.focus({preventScroll:!0}):(F.focus({preventScroll:!0}),Er())};Z.addEventListener(`click`,()=>{Qr(!o)}),window.addEventListener(`keydown`,e=>{In===null||q||e.repeat||e.isComposing||Pt()||Or()||!qr(e,In)||Jr(In)&&$r(e)||(e.preventDefault(),e.stopPropagation(),Qr(!o))},{capture:!0,signal:i});let ei=(e,t=!1)=>{let n=tn(),r=ln(n,v.focusId,e);U(t?mn(n,v,r):fn(r),!0)},ti=e=>e instanceof Node&&C.contains(e),ni=e=>{let{target:t}=e,n=e instanceof FocusEvent?e.relatedTarget:null;(e.type===`focus`||e.type===`focusin`?ti(t):!ti(t)&&ti(n))&&e.stopImmediatePropagation()};for(let e of[`focus`,`focusin`,`blur`,`focusout`])window.addEventListener(e,ni,{capture:!0,signal:i});let ri=!1;window.addEventListener(`pointerdown`,e=>{ri=ti(e.target)},{capture:!0,signal:i}),window.addEventListener(`keydown`,e=>{if(!ri||o||b!==`requests`||Pt()||ti(e.target)||!un(e,`c`))return;let t=oe();t.length===0||ce()||(e.preventDefault(),e.stopImmediatePropagation(),be(t))},{capture:!0,signal:i}),w.addEventListener(`keydown`,e=>{if(Pt())return;if(Cr()){e.key===`Escape`&&(e.preventDefault(),Tr()),e.stopPropagation();return}if(b===`rules`){un(e,`f`)?(e.preventDefault(),ur.openFind(e.target)):e.key===`Escape`&&!e.isComposing&&(e.preventDefault(),$r(e)&&e.target instanceof HTMLElement?(e.target.blur(),ur.focus()):fr(`requests`,!0)),e.stopPropagation();return}let t=e.target===M,n=e.target===F,r=e.target===H,i=e.target===V,a=e.target instanceof Node&&Ke.contains(e.target),o=ae(),s=oe(),c=!0;if(un(e,`f`))a&&o!==void 0?Kt():(M.focus(),M.select());else if(i&&e.key===`Escape`)Jt();else if(i&&e.key===`Enter`&&!e.isComposing)zt(Dt+(e.shiftKey?-1:1),!0);else if(un(e,`k`))O();else if(un(e,`c`)&&s.length>0&&!$r(e)&&(n||!ce()))be(s);else if(un(e,`a`)&&n)U(hn(tn(),v),!1);else if(e.key===`Escape`)t&&M.value!==``?wn(``):t||r?F.focus({preventScroll:!0}):v.ids.size>0?U(dn,!1):Qr(!0);else if(t)e.key===`ArrowDown`||e.key===`Enter`?(F.focus({preventScroll:!0}),v.focusId===void 0&&ei(`first`)):c=!1;else if(n){let t=e.altKey||e.metaKey,n=e.shiftKey;switch(e.key){case`ArrowDown`:ei(t?`last`:`next`,n);break;case`ArrowUp`:ei(t?`first`:`previous`,n);break;case`Home`:ei(`first`,n);break;case`End`:ei(`last`,n);break;case`ArrowLeft`:$t(-1);break;case`ArrowRight`:$t(1);break;case`Enter`:o!==void 0&&H.focus({preventScroll:!0});break;default:c=!1}}else c=!1;c&&e.preventDefault(),e.stopPropagation()});let ii=()=>Z.getBoundingClientRect().height||30;Cn(Z,ii,()=>ne,e=>{re(e)}),C.append(w,Hr,K),mi(C,i),Xr(),na(C),o||Er(),re(xn(ii())),window.addEventListener(`resize`,()=>{ie(Tn(te)),re(bn(ne,ii())),qe(Lt(x))},{signal:i}),Br(),a.push(He(()=>{Br(),hr()}),ur.dispose),t===`rules`&&fr(`rules`,!1),n&&!o&&Mr(),a.push(rt(e=>{u=e;let t=e.filter(Ri).length;Pr.textContent=String(e.length),Pr.classList.toggle(`nri-badge-alert`,t>0),Vr(),Sn()}));function ai(e){Nt(),jr(!1),r.abort();for(let e of a)e();C.remove(),ra({initialView:e.view,settingsOpen:e.settingsOpen})}}let ia=`__NRI_BOOTED__`;function aa(){try{return window.self===window.top}catch{return!1}}function oa(){let e=()=>{ht().__apiMockErr===!0&&z(`warning`,g(`The old standalone mock script is still installed. Remove it in Tampermonkey — its rules have been moved here.`,`旧版独立的接口报错模拟脚本还装着，请在 Tampermonkey 里删掉它；它的规则已经搬到这里了。`),8e3)};document.readyState===`complete`?e():window.addEventListener(`load`,e,{once:!0})}function sa(){if(!aa())return;let e=ht();if(e[ia]===!0)return;e[ia]=!0,m(p(d())),Ct(),Ze(),tt(Ot()),window.addEventListener(`pagehide`,()=>{Et(et())});let t=()=>{ra(),oa()};document.documentElement===null?document.addEventListener(`DOMContentLoaded`,t,{once:!0}):t(),console.log(`[NRI] Network Request Inspector loaded`)}sa()})();