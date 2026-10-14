# 油猴脚本合集 (Tampermonkey Scripts)

本仓库专门维护个人原创开发的高质量浏览器用户脚本（支持 Tampermonkey / ScriptCat / Violentmonkey / 手机端浏览器）。

所有脚本均经过真实环境严格测试，采用独立 Shadow DOM 样式隔离、全端触控与手势适配、以及无外部 CDN 依赖的轻量设计。

---

## 📋 脚本清单与安装直链

点击下表中的 **「🚀 立即安装」**，浏览器油猴扩展将自动弹出脚本安装界面；若国内网络访问 GitHub 较慢，可点击 **「⚡ 加速安装」**。

| 序号 | 脚本名称 | 功能简介 | 最新版本 | 油猴直链安装 | 国内免翻加速安装 |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | **网页链接二维码生成器 (可移动/手机端适配)** | 在网页侧面生成可自由拖拽的悬浮二维码小图标，点击后展开高清二维码，再次点击二维码立即收起并恢复小图标。完美适配手机端与PC端浏览器，支持拖拽定位、位置记忆、SPA无刷新链接动态更新、一键复制链接。 | `v1.0.1` | [🚀 立即安装](https://raw.githubusercontent.com/qingshanh/userscripts/main/url-to-qrcode.user.js) | [⚡ 加速安装](https://ghproxy.net/https://raw.githubusercontent.com/qingshanh/userscripts/main/url-to-qrcode.user.js) |
| 2 | **网页智能转PDF (选区/自适应宽度/Adobe级矢量排版)** | 通用高质量网页转 PDF 工具：突破严格 CSP 页面样式拦截，彻底解决样式错乱变形、单页截断、内容丢失；极速秒开、零卡顿；悬浮按钮可自由拖拽、面板默认折叠；自适应剔除留白、修复论坛与长列表断页；支持自由点选起止元素、原生高清矢量打印。 | `v2.5.0` | [🚀 立即安装](https://raw.githubusercontent.com/qingshanh/userscripts/main/webpage-to-pdf.user.js) | [⚡ 加速安装](https://ghproxy.net/https://raw.githubusercontent.com/qingshanh/userscripts/main/webpage-to-pdf.user.js) |

---

## 📱 手机端浏览器使用指引

- **Android (Via 浏览器 / X 浏览器)**：
  - 打开浏览器「设置」->「脚本」->「新建脚本」；
  - 复制对应脚本的「国内加速安装」或「立即安装」直链直接导入，或在浏览器中直接打开该链接自动触发安装。
- **Android (Kiwi / Firefox 移动版)**：
  - 安装 Tampermonkey 扩展插件后，直接在浏览器中点击上表中的安装链接即可。
- **iOS (Safari)**：
  - App Store 安装 **Userscripts** 或 **Stay** 扩展，点击安装直链导入使用。

---

## 📄 开源许可

[MIT License](LICENSE)
