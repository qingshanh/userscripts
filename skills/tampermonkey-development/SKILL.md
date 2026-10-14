---
name: tampermonkey-development
description: Build, debug, test, maintain, and publish Tampermonkey / Violentmonkey / ScriptCat userscripts in this workspace, with strict metadata standards, local testing gates, catalog synchronization, and GitHub distribution workflows. Use whenever writing, modifying, reviewing, testing, or committing userscripts (*.user.js).
---

# 油猴脚本开发与 GitHub 自动化发布全景规范 (Tampermonkey Skill)

本规范沉淀了在 Windows 环境下开发、调试、测试、打包与发布浏览器用户脚本（Tampermonkey / Violentmonkey / ScriptCat / 手机端浏览器）的全流程工程准则、元数据标准与硬性发布门禁。

---

## 1. 仓库架构与目录划分

工作区根目录为 GitHub 仓库根目录，组织结构统一遵循如下规范：

```text
D:\Lance\hh\code\油猴\ (Git 仓库根目录)
├── dist/                                     # 发布目录：仅存放经测试通过的可一键安装纯净脚本
│   ├── url-to-qrcode.user.js
│   └── webpage-to-pdf.user.js
├── scripts/
│   └── sync-catalog.ps1                      # 目录自动化同步与元数据校验脚本
├── skills/tampermonkey-development/          # 本工程配套的规范技能
│   └── SKILL.md
├── [功能模块子目录]/                          # 开发工程目录 (例如 网页生成二维码/)
│   ├── xxx.user.js                           # 核心脚本开发源码
│   ├── test-page.html                        # 本地免安装测试沙盒 (双击即可测试交互)
│   └── README.md                             # 模块专属文档与测试要点
├── README.md                                 # 仓库总目录：包含所有脚本的介绍、版本与直链
└── .gitignore
```

---

## 2. 三阶段生命周期与硬性测试门禁 (Core Invariants)

后续 AI 在处理任何油猴脚本编写与维护任务时，必须严格执行三阶段生命周期：

### 阶段一：开发与本地沙盒构建 (Development & Local Test)
1. 在独立的子目录（如 `网页xxx/`）中编写或更新 `xxx.user.js`。
2. 同步编写或更新对应的 `test-page.html` 本地测试页，确保用户可以脱离油猴扩展、直接在浏览器中双击打开测试所有手势、点击和状态。
3. 执行静态语法验证（如 `Get-Content xxx.user.js | node --check`）。
4. **【硬性铁律 1：禁止自行提交】**
   - AI **严禁**在此阶段自行执行 `git commit` 或 `git push`！
   - AI 必须向用户汇报开发成果，说明修改点与本地测试方法，并明确提示：“**请在本地进行测试，待你验证可用并下达提交指令后，我才会执行发布与提交。**”

### 阶段二：用户验收门禁 (Human Verification Gate)
1. 必须由用户亲自在真实浏览器环境（桌面端 Tampermonkey 或手机端 Via/Kiwi/Safari）中测试功能可用性。
2. 若用户反馈缺陷，AI 回到子开发目录进行修复与回归测试，直至用户满意。
3. **【硬性铁律 2：只有用户下令才提交】**
   - 只有当用户明确给出提交许可（例如：“测试通过，提交”、“已验证可用，提交到GitHub”等）时，AI 方可进入阶段三。

### 阶段三：自动化分发打包与 GitHub 提交 (Dist Sync & GitHub Push)
1. 运行 `& ".\scripts\sync-catalog.ps1"`：
   - 自动扫描所有模块子目录；
   - 校验并更新元数据（`@updateURL`、`@downloadURL`、`@namespace`、`@homepageURL`、`@supportURL`）；
   - 自动复制最新版 `.user.js` 到根目录 `dist/` 目录；
   - 自动重新生成根目录 `README.md` 中的脚本清单表格、最新版本号与直链。
2. 确认 `git status` 无误后，规范化执行 `git add .`、`git commit -m "..."` 并推送到 GitHub 远程仓库。

---

## 3. 元数据规范 (Metadata Standards)

每一个 `.user.js` 的 `// ==UserScript==` 元数据块必须遵循统一的标准，链接必须为真实的 GitHub 仓库与 Raw 直链：

```javascript
// ==UserScript==
// @name         脚本中文名称 (特性标识)
// @namespace    https://github.com/qingshanh/userscripts
// @version      1.0.1
// @description  准确详实的中文功能描述
// @author       Lance
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @homepageURL  https://github.com/qingshanh/userscripts
// @supportURL   https://github.com/qingshanh/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/qingshanh/userscripts/main/dist/脚本文件名.user.js
// @downloadURL  https://raw.githubusercontent.com/qingshanh/userscripts/main/dist/脚本文件名.user.js
// ==/UserScript==
```

- **语义化版本递增**：修复 Bug 递增补丁号（如 `1.0.0` -> `1.0.1`），新增功能递增次版本号（如 `1.0.1` -> `1.1.0`）。
- **真实可访问直链**：`@updateURL` 与 `@downloadURL` 必须指向 `main` 分支的 `dist/` 文件。

---

## 4. 根目录 README.md 与油猴直链安装机制

油猴扩展拦截安装的机制是：**当浏览器访问后缀为 `.user.js` 且内容为 JavaScript 脚本的 URL 时，扩展会自动弹出安装确认面板。**

根目录 `README.md` 必须维护规范的 Markdown 表格，并提供双通道安装超链接：
1. **GitHub 原生 Raw 直链**：
   `https://raw.githubusercontent.com/qingshanh/userscripts/main/dist/xxx.user.js`
2. **国内加速安装直链**：
   `https://ghproxy.net/https://raw.githubusercontent.com/qingshanh/userscripts/main/dist/xxx.user.js`

表格样例：
```markdown
| 序号 | 脚本名称 | 功能简介 | 最新版本 | 油猴直链安装 | 国内加速安装 | 源码工程 |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| 1 | **网页链接二维码生成器** | 悬浮小图标点击展开，再次点击收起... | `v1.0.1` | [🚀 立即安装](https://raw.githubusercontent.com/qingshanh/userscripts/main/dist/url-to-qrcode.user.js) | [⚡ 加速安装](https://ghproxy.net/https://raw.githubusercontent.com/qingshanh/userscripts/main/dist/url-to-qrcode.user.js) | [查看源码](网页生成二维码/) |
```

---

## 5. 油猴脚本前端开发避坑铁律与最佳实践

1. **Shadow DOM 样式隔离铁律**：
   - 任何插入页面的悬浮窗、弹窗、面板，必须挂载在 `host.attachShadow({ mode: 'open' })` 内部；
   - 外部页面的 Bootstrap、Tailwind、重置样式绝对不能影响插件 UI，插件内部样式也绝不污染网页。
2. **绘图引擎与图像渲染分离 (防双图撑爆容器)**：
   - 使用包含内部 Canvas 绘图的库（如 qrcode.js、chart.js）时，严禁使用通配规则 `img, canvas { display: block !important; }`，否则会导致后台绘图 Canvas 与最终生成的 Image 并排渲染，撑爆弹窗容器；
   - 铁律：底层的 Canvas 缓冲层必须强制隐藏（`display: none !important; width: 0; height: 0;`），只展示单一的 `<img>`，容器外层必须设置 `overflow: hidden !important;`。
3. **全端触控与手势防误触 (Mobile & Desktop Gesture Guard)**：
   - 悬浮拖拽元素必须声明 `touch-action: none !important;` 与 `-webkit-user-select: none !important;`，防止拖拽带动网页上下滚动；
   - 必须设置移动距离阈值（`Math.hypot(dx, dy) > 6`）区分「点击」与「拖拽」；
   - 拖拽松手瞬间必须设置防误触延时标记（`justDragged = true`，120ms 后重置），避免拖动松手触发点击展开；
   - 移动端视口宽度 $\le$ 640px 时，弹窗必须居中自适应，触控热区必须 $\ge$ 44px。
4. **单页应用 (SPA) 动态路由感知**：
   - 现代网站无刷新切换路由常见，每次展开面板时必须实时读取最新 `window.location.href`，支持动态检测链接变更。
5. **离线化与零 CDN 依赖**：
   - 脚本所需的核心工具库优先内联打包，避免依赖 `@require` 外部 CDN，确保在无网络或严格 CSP 环境下 100% 稳定运行。