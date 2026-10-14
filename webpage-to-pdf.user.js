// ==UserScript==
// @name         网页智能转PDF (选区/自适应宽度/Adobe级矢量排版)
// @namespace    https://github.com/qingshanh/userscripts
// @version      2.5.0
// @description  通用高质量网页转 PDF 工具：突破严格 CSP 页面样式拦截，彻底解决样式错乱变形、单页截断、内容丢失；极速秒开、零卡顿；悬浮按钮可自由拖拽、面板默认折叠；自适应剔除留白、修复论坛与长列表断页；支持自由点选起止元素、原生高清矢量打印。
// @author       Lance
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @homepageURL  https://github.com/qingshanh/userscripts
// @supportURL   https://github.com/qingshanh/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/qingshanh/userscripts/main/webpage-to-pdf.user.js
// @downloadURL  https://raw.githubusercontent.com/qingshanh/userscripts/main/webpage-to-pdf.user.js
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self) return;

  // 1. 页面物理尺寸度量
  function getDocDimensions() {
    const body = document.body;
    const html = document.documentElement;
    const width = Math.max(
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0,
      html ? html.clientWidth : 0,
      html ? html.scrollWidth : 0,
      html ? html.offsetWidth : 0,
      window.innerWidth
    );
    const height = Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.clientHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0,
      window.innerHeight
    );
    return { width, height };
  }

  // 2. 全局状态
  const state = {
    startElement: null,
    endElement: null,
    customStartY: null,
    customEndY: null,

    customX: null,
    customWidth: null,
    widthPreset: "auto", // "auto" | "750" | "850" | "1050" | "100%" | "custom"

    engine: "vector",    // "vector" (推荐) | "canvas"
    format: "a4",
    smartBreak: true,
    pageMargin: 10,

    pickerMode: null,    // "start" | "end" | null
    isOverlayOpen: false,
    isProcessing: false
  };

  // 3. 智能查找关键块级容器（确保序号、卡片、段落整体被选中）
  function getSignificantBlock(el) {
    if (!el || el === document.body || el === document.documentElement) return el;
    
    // 如果处于独立卡片或论坛楼层内部，选中该卡片/楼层整体
    const cardOrFloor = el.closest(".topic-post, [data-post-number], [id^=\"post_\"], .l_post, .card, [class*=\"card\"], section");
    if (cardOrFloor && cardOrFloor !== document.body) return cardOrFloor;

    const li = el.closest("li");
    if (li) return li;

    const block = el.closest("p, h1, h2, h3, h4, h5, h6, pre, blockquote, table, figure, dt, dd, tr");
    if (block) return block;

    let curr = el;
    while (curr && curr !== document.body) {
      const display = window.getComputedStyle(curr).display;
      if (display === "block" || display === "flex" || display === "grid" || display === "list-item" || display === "table-row") {
        return curr;
      }
      curr = curr.parentElement;
    }
    return el;
  }

  // 4. 计算最近公共祖先 (LCA)
  function getLowestCommonAncestor(nodeA, nodeB) {
    if (!nodeA || !nodeB) return nodeA || nodeB;
    const ancestors = new Set();
    let curr = nodeA;
    while (curr) {
      ancestors.add(curr);
      curr = curr.parentElement;
    }
    curr = nodeB;
    while (curr) {
      if (ancestors.has(curr)) return curr;
      curr = curr.parentElement;
    }
    return document.body;
  }

  // 5. 通用正文宽度探测（只用于计算自适应排版宽度，绝不丢弃任何内容节点！）
  function detectVisualContentWidth() {
    const docW = getDocDimensions().width;

    const containerSelectors = [
      ".container", ".main-content", "#main-content",
      "main", "[role=\"main\"]", "article",
      ".markdown-body", ".post-stream", ".topic-list",
      ".content", "#content", ".page-wrapper", ".seller-main"
    ];

    for (const sel of containerSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width >= 480 && r.width < docW * 0.96) {
          const absLeft = r.left + window.scrollX;
          const x = Math.max(0, Math.floor(absLeft - 16));
          const w = Math.min(docW - x, Math.ceil(r.width + 32));
          return { x, width: w, info: "容器对齐 (" + sel + ")" };
        }
      }
    }

    if (docW >= 1280) {
      const targetW = 1000;
      const x = Math.floor((docW - targetW) / 2);
      return { x, width: targetW, info: "自适应居中 (1000px)" };
    }

    return { x: 0, width: docW, info: "全宽自适应" };
  }

  // 6. 获取当前有效裁剪几何体
  function getEffectiveCrop() {
    const doc = getDocDimensions();
    const startY = state.customStartY !== null ? state.customStartY : 0;
    const endY = state.customEndY !== null ? state.customEndY : doc.height;
    const safeHeight = Math.max(50, endY - startY);

    let x, width, info;

    if (state.customWidth !== null && state.customX !== null) {
      x = state.customX;
      width = state.customWidth;
      info = "手动宽度 (" + width + "px)";
    } else {
      const detected = detectVisualContentWidth();
      x = detected.x;
      width = detected.width;
      info = detected.info;
    }

    x = Math.max(0, Math.min(x, doc.width - 40));
    width = Math.min(width, doc.width - x);

    return {
      x,
      y: startY,
      width,
      height: safeHeight,
      info,
      docWidth: doc.width,
      docHeight: doc.height
    };
  }

  // 6. UI 与交互层（彻底突破 CSP 限制的双模渲染引擎）
  let shadowRoot = null;
  let hostElement = null;
  let uiContainer = null;

  function initUI() {
    if (document.getElementById("smart-pdf-exporter-host")) return;

    hostElement = document.createElement("div");
    hostElement.id = "smart-pdf-exporter-host";
    hostElement.style.cssText = "position: static !important; width: 0 !important; height: 0 !important; z-index: 2147483647 !important;";
    (document.body || document.documentElement).appendChild(hostElement);

    const cssContent = `
      #smart-pdf-exporter-host, #smart-pdf-exporter-host * {
        box-sizing: border-box !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }
      
      /* Adobe 风格可拖拽悬浮胶囊 */
      #pdf-fab {
        position: fixed !important;
        right: 20px !important;
        bottom: 75px !important;
        height: 38px !important;
        padding: 0 14px !important;
        border-radius: 19px !important;
        background: #e11d48 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4) !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        cursor: grab !important;
        user-select: none !important;
        touch-action: none !important;
        transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s !important;
        z-index: 2147483647 !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        line-height: 1 !important;
        border: none !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      #pdf-fab:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 6px 18px rgba(225, 29, 72, 0.5) !important;
      }
      #pdf-fab.dragging {
        cursor: grabbing !important;
        transform: scale(1.08) !important;
        box-shadow: 0 8px 24px rgba(225, 29, 72, 0.6) !important;
        background: #be123c !important;
      }
      #pdf-fab svg { width: 18px !important; height: 18px !important; fill: currentColor !important; pointer-events: none !important; }
      #pdf-fab span { pointer-events: none !important; color: #ffffff !important; font-size: 13px !important; }

      /* 控制面板：默认折叠隐藏！固定 360px 宽度，带白底与边框 */
      #pdf-panel {
        position: fixed !important;
        right: 20px !important;
        bottom: 125px !important;
        width: 360px !important;
        min-width: 360px !important;
        background: #ffffff !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0,0,0,0.06) !important;
        border: 1px solid #e2e8f0 !important;
        overflow: hidden !important;
        z-index: 2147483646 !important;
        display: flex !important;
        flex-direction: column !important;
        color: #1e293b !important;
        font-size: 13px !important;
        transition: opacity 0.15s ease !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      #pdf-panel.hidden {
        display: none !important;
      }

      .panel-header {
        background: #f8fafc !important;
        padding: 10px 14px !important;
        border-bottom: 1px solid #e2e8f0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        cursor: move !important;
        user-select: none !important;
      }
      .panel-title {
        font-size: 13px !important;
        font-weight: 600 !important;
        color: #0f172a !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .panel-close {
        background: transparent !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: #94a3b8 !important;
        padding: 0 4px !important;
        line-height: 1 !important;
      }
      .panel-close:hover { color: #0f172a !important; }

      .panel-body {
        padding: 12px 14px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
        background: #ffffff !important;
      }

      .card {
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 6px !important;
        padding: 8px 10px !important;
      }
      .card-header {
        font-weight: 600 !important;
        font-size: 12px !important;
        color: #475569 !important;
        margin-bottom: 6px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
      .badge {
        font-size: 11px !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        background: #e2e8f0 !important;
        color: #334155 !important;
      }
      .badge.active {
        background: #fee2e2 !important;
        color: #e11d48 !important;
        font-weight: 600 !important;
      }

      .btn-row {
        display: flex !important;
        gap: 6px !important;
        margin-top: 5px !important;
      }
      .btn {
        flex: 1 !important;
        padding: 5px 6px !important;
        font-size: 11px !important;
        border-radius: 4px !important;
        border: 1px solid #cbd5e1 !important;
        background: #ffffff !important;
        color: #334155 !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        transition: all 0.15s !important;
        white-space: nowrap !important;
      }
      .btn:hover {
        background: #f1f5f9 !important;
        border-color: #94a3b8 !important;
      }
      .btn.active {
        background: #fee2e2 !important;
        border-color: #e11d48 !important;
        color: #e11d48 !important;
        font-weight: 600 !important;
      }

      .width-presets {
        display: flex !important;
        gap: 4px !important;
        margin-top: 5px !important;
      }
      .preset-btn {
        flex: 1 !important;
        padding: 4px 2px !important;
        font-size: 10px !important;
        text-align: center !important;
        border-radius: 4px !important;
        border: 1px solid #cbd5e1 !important;
        background: #fff !important;
        color: #334155 !important;
        cursor: pointer !important;
      }
      .preset-btn:hover { background: #f1f5f9 !important; }
      .preset-btn.active {
        background: #e0e7ff !important;
        border-color: #6366f1 !important;
        color: #4338ca !important;
        font-weight: 600 !important;
      }

      .radio-row {
        display: flex !important;
        gap: 10px !important;
        margin-top: 4px !important;
        font-size: 12px !important;
      }
      .radio-label {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        cursor: pointer !important;
        color: #1e293b !important;
      }

      .export-btn {
        padding: 9px !important;
        font-size: 13px !important;
        border-radius: 6px !important;
        background: linear-gradient(135deg, #e11d48, #be123c) !important;
        color: #ffffff !important;
        border: none !important;
        cursor: pointer !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        box-shadow: 0 4px 10px rgba(225, 29, 72, 0.3) !important;
        transition: transform 0.15s, opacity 0.15s !important;
      }
      .export-btn:hover {
        opacity: 0.95 !important;
        transform: translateY(-1px) !important;
      }
      .export-btn:disabled {
        background: #9ca3af !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: none !important;
      }

      .progress-container {
        margin-top: 4px !important;
        display: none !important;
      }
      .progress-container.active { display: block !important; }
      .progress-bar-bg {
        width: 100% !important;
        height: 5px !important;
        background: #e2e8f0 !important;
        border-radius: 3px !important;
        overflow: hidden !important;
      }
      .progress-bar-fill {
        height: 100% !important;
        width: 0% !important;
        background: #e11d48 !important;
        transition: width 0.2s !important;
      }
      .progress-text {
        font-size: 11px !important;
        color: #64748b !important;
        margin-top: 3px !important;
        text-align: center !important;
      }

      #picker-hover-rect {
        position: absolute !important;
        pointer-events: none !important;
        border-radius: 3px !important;
        z-index: 2147483640 !important;
      }
      #picker-tooltip {
        position: absolute !important;
        background: rgba(15, 23, 42, 0.92) !important;
        color: #ffffff !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        font-size: 11px !important;
        pointer-events: none !important;
        z-index: 2147483641 !important;
        white-space: nowrap !important;
      }

      #crop-overlay-wrap {
        position: fixed !important;
        inset: 0 !important;
        pointer-events: none !important;
        z-index: 2147483630 !important;
      }
      .crop-guide-line {
        position: absolute !important;
        background: rgba(225, 29, 72, 0.9) !important;
        z-index: 2147483635 !important;
      }
      .crop-guide-line.horizontal {
        left: 0 !important;
        right: 0 !important;
        height: 2px !important;
        cursor: row-resize !important;
        pointer-events: auto !important;
      }
      .crop-guide-line.vertical {
        top: 0 !important;
        bottom: 0 !important;
        width: 2px !important;
        cursor: col-resize !important;
        pointer-events: auto !important;
      }
      .crop-handle-badge {
        position: absolute !important;
        background: #be123c !important;
        color: #ffffff !important;
        font-size: 10px !important;
        padding: 2px 5px !important;
        border-radius: 3px !important;
        user-select: none !important;
        pointer-events: auto !important;
        white-space: nowrap !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.25) !important;
      }
    `;

    // 关键突破 1：使用 Tampermonkey 的 GM_addStyle 全局特权注入（彻底无视网站 CSP style-src-elem 限制）
    if (typeof GM_addStyle !== "undefined") {
      try {
        GM_addStyle(cssContent);
      } catch (e) {
        console.warn("[PDF工具] GM_addStyle 异常:", e);
      }
    }

    // 关键突破 2：在 Shadow DOM 中采用 Constructable StyleSheets (CSSStyleSheet.replaceSync)，不产生内联 <style> 标签，CSP 绝不拦截！
    let shadowStyled = false;
    try {
      shadowRoot = hostElement.attachShadow({ mode: "open" });
      if (document.adoptedStyleSheets && typeof CSSStyleSheet === "function") {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssContent.replace(/#smart-pdf-exporter-host\s+/g, ""));
        shadowRoot.adoptedStyleSheets = [sheet];
        shadowStyled = true;
      }
    } catch (e) {
      console.warn("[PDF工具] Shadow DOM 初始化异常，平滑降级至 Light DOM:", e);
    }

    // 如果未成功附加样式表，使用降级方案直接在 Light DOM 运行（受 GM_addStyle 100% 保护）
    if (!shadowRoot || !shadowStyled) {
      uiContainer = hostElement;
    } else {
      uiContainer = shadowRoot;
    }

    const template = document.createElement("div");
    template.innerHTML = `
      <div id="pdf-fab" title="拖动可移动位置 / 点击打开控制面板">
        <svg viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
        <span>转 PDF</span>
      </div>

      <div id="pdf-panel" class="hidden">
        <div class="panel-header" id="panel-drag-bar">
          <div class="panel-title">
            <svg style="width:16px;height:16px;fill:#e11d48;" viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
            <span>网页转 PDF (Adobe 架构)</span>
          </div>
          <button class="panel-close" id="panel-close-btn" title="收起面板">×</button>
        </div>

        <div class="panel-body">
          <div class="card">
            <div class="card-header">
              <span>📍 截取起终点</span>
              <span class="badge active" id="range-badge">默认全页全部内容</span>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;" id="range-text">
              起点: 网页顶部 (0px) | 终点: 页面最底端
            </div>
            <div class="btn-row">
              <button class="btn" id="pick-start-btn">📌 选取起点元素</button>
              <button class="btn" id="pick-end-btn">🏁 选取终点元素</button>
            </div>
            <div class="btn-row">
              <button class="btn" id="reset-range-btn">🔄 重置为整页</button>
              <button class="btn" id="scroll-preload-btn" title="自动快速滚屏触发懒加载图片与动态内容">⬇️ 预加载动态内容</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span>📐 宽度与留白排版</span>
              <span class="badge active" id="width-badge">自适应居中</span>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;" id="width-text">
              全量保留所有章节内容，仅约束两侧空白
            </div>
            <div class="width-presets">
              <button class="preset-btn active" data-w="auto">🎯 智能自适应</button>
              <button class="preset-btn" data-w="750">750px</button>
              <button class="preset-btn" data-w="850">850px</button>
              <button class="preset-btn" data-w="1050">1050px</button>
              <button class="preset-btn" data-w="100%">100% 全宽</button>
            </div>
            <div class="btn-row">
              <button class="btn" id="toggle-overlay-btn">📐 显示/隐藏拖拽参考线</button>
              <button class="btn" id="reset-width-btn">🔄 恢复智能宽度</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span>⚙️ 导出格式与引擎</span>
            </div>
            <div class="radio-row">
              <label class="radio-label" title="Adobe式矢量提取打印：极速秒出、绝不卡死、文字可复制、排版完美">
                <input type="radio" name="pdf-engine" value="vector" checked>
                <span style="font-weight:600; color:#0f172a;">A4 矢量打印 (推荐)</span>
              </label>
              <label class="radio-label" title="通过Canvas生成的图片版单页长图">
                <input type="radio" name="pdf-engine" value="canvas">
                <span>单页长图 (图片版)</span>
              </label>
            </div>
          </div>

          <button class="export-btn" id="start-export-btn">
            <span>🚀 立即转换并导出 PDF</span>
          </button>

          <div class="progress-container" id="progress-wrap">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" id="progress-fill"></div>
            </div>
            <div class="progress-text" id="progress-label">准备中...</div>
          </div>
        </div>
      </div>

      <div id="picker-hover-rect" style="display: none;"></div>
      <div id="picker-tooltip" style="display: none;"></div>

      <div id="crop-overlay-wrap" style="display: none;">
        <div class="crop-guide-line horizontal" id="guide-top">
          <div class="crop-handle-badge" style="top: -20px; left: 10px;">▲ 起点线 (可拖动)</div>
        </div>
        <div class="crop-guide-line horizontal" id="guide-bottom">
          <div class="crop-handle-badge" style="bottom: -20px; left: 10px;">▼ 终点线 (可拖动)</div>
        </div>
        <div class="crop-guide-line vertical" id="guide-left">
          <div class="crop-handle-badge" style="top: 20px; left: -70px;">◀ 左切线</div>
        </div>
        <div class="crop-guide-line vertical" id="guide-right">
          <div class="crop-handle-badge" style="top: 20px; right: -70px;">右切线 ▶</div>
        </div>
      </div>
    `;
    uiContainer.appendChild(template);

    bindEvents();
    updateUI();
  }

  // 7. 事件绑定与可拖拽悬浮球
  function bindEvents() {
    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);

    const fab = $("pdf-fab");
    const panel = $("pdf-panel");
    const closeBtn = $("panel-close-btn");

    try {
      const savedPos = localStorage.getItem("smart_pdf_fab_pos");
      if (savedPos) {
        const { left, top } = JSON.parse(savedPos);
        const l = parseFloat(left);
        const t = parseFloat(top);
        if (!isNaN(l) && !isNaN(t) && l < window.innerWidth && t < window.innerHeight) {
          fab.style.left = Math.max(10, Math.min(window.innerWidth - 80, l)) + "px";
          fab.style.top = Math.max(10, Math.min(window.innerHeight - 50, t)) + "px";
          fab.style.right = "auto";
          fab.style.bottom = "auto";
        }
      }
    } catch (e) {}

    // 智能定位面板在悬浮按钮附近，且强制约束在可视窗口内，绝不掉出左侧或右侧
    function positionPanelNearFab() {
      const fabR = fab.getBoundingClientRect();
      let pLeft;
      if (fabR.left < window.innerWidth / 2) {
        // 如果悬浮按钮在屏幕左侧，面板向右展开
        pLeft = fabR.left;
      } else {
        // 如果悬浮按钮在屏幕右侧，面板向左展开
        pLeft = fabR.right - 360;
      }
      let pTop = fabR.top - 460;

      if (pTop < 20) pTop = fabR.bottom + 12;
      if (pLeft < 15) pLeft = 15;
      if (pLeft + 360 > window.innerWidth - 15) {
        pLeft = window.innerWidth - 375;
      }

      panel.style.width = "360px";
      panel.style.minWidth = "360px";
      panel.style.maxWidth = "calc(100vw - 30px)";
      panel.style.left = Math.max(15, pLeft) + "px";
      panel.style.top = Math.max(15, pTop) + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }

    let fabDragging = false;
    let fabMoved = false;
    let fabStartX = 0, fabStartY = 0;
    let fabInitLeft = 0, fabInitTop = 0;

    fab.addEventListener("mousedown", (e) => {
      fabDragging = true;
      fabMoved = false;
      fabStartX = e.clientX;
      fabStartY = e.clientY;
      const rect = fab.getBoundingClientRect();
      fabInitLeft = rect.left;
      fabInitTop = rect.top;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!fabDragging) return;
      const dx = e.clientX - fabStartX;
      const dy = e.clientY - fabStartY;

      if (Math.hypot(dx, dy) > 4) {
        fabMoved = true;
        fab.classList.add("dragging");

        let newLeft = fabInitLeft + dx;
        let newTop = fabInitTop + dy;
        newLeft = Math.max(10, Math.min(window.innerWidth - fab.offsetWidth - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - fab.offsetHeight - 10, newTop));

        fab.style.left = newLeft + "px";
        fab.style.top = newTop + "px";
        fab.style.right = "auto";
        fab.style.bottom = "auto";
      }
    });

    window.addEventListener("mouseup", () => {
      if (!fabDragging) return;
      fabDragging = false;
      fab.classList.remove("dragging");

      if (fabMoved) {
        try {
          localStorage.setItem("smart_pdf_fab_pos", JSON.stringify({
            left: fab.style.left,
            top: fab.style.top
          }));
        } catch (e) {}
      } else {
        const isHidden = panel.classList.contains("hidden");
        if (isHidden) {
          positionPanelNearFab();
          panel.classList.remove("hidden");
        } else {
          panel.classList.add("hidden");
        }
      }
    });

    closeBtn.addEventListener("click", () => {
      panel.classList.add("hidden");
    });

    const dragBar = $("panel-drag-bar");
    let panelDragging = false;
    let pDragOffX = 0, pDragOffY = 0;

    dragBar.addEventListener("mousedown", (e) => {
      if (e.target === closeBtn) return;
      panelDragging = true;
      const rect = panel.getBoundingClientRect();
      pDragOffX = e.clientX - rect.left;
      pDragOffY = e.clientY - rect.top;
      panel.style.transition = "none";
    });

    window.addEventListener("mousemove", (e) => {
      if (!panelDragging) return;
      const x = Math.max(10, Math.min(window.innerWidth - panel.offsetWidth - 10, e.clientX - pDragOffX));
      const y = Math.max(10, Math.min(window.innerHeight - panel.offsetHeight - 10, e.clientY - pDragOffY));
      panel.style.left = x + "px";
      panel.style.top = y + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    });

    window.addEventListener("mouseup", () => {
      if (panelDragging) {
        panelDragging = false;
        panel.style.transition = "";
      }
    });

    const engineRadios = uiContainer.querySelectorAll("input[name=\"pdf-engine\"]");
    engineRadios.forEach(radio => {
      radio.addEventListener("change", () => {
        state.engine = radio.value;
      });
    });

    const presetBtns = uiContainer.querySelectorAll(".preset-btn");
    presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        presetBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const val = btn.getAttribute("data-w");
        state.widthPreset = val;

        const docW = getDocDimensions().width;
        if (val === "auto") {
          state.customX = null;
          state.customWidth = null;
        } else if (val === "100%") {
          state.customX = 0;
          state.customWidth = docW;
        } else {
          const targetW = parseInt(val, 10);
          state.customWidth = Math.min(targetW, docW);
          state.customX = Math.max(0, Math.floor((docW - state.customWidth) / 2));
        }
        updateUI();
        syncGuides();
      });
    });

    $("pick-start-btn").addEventListener("click", () => startPicker("start"));
    $("pick-end-btn").addEventListener("click", () => startPicker("end"));

    $("reset-range-btn").addEventListener("click", () => {
      state.startElement = null;
      state.endElement = null;
      state.customStartY = null;
      state.customEndY = null;
      updateUI();
      syncGuides();
    });

    $("scroll-preload-btn").addEventListener("click", smoothPreload);

    $("toggle-overlay-btn").addEventListener("click", () => {
      state.isOverlayOpen = !state.isOverlayOpen;
      const overlay = $("crop-overlay-wrap");
      overlay.style.display = state.isOverlayOpen ? "block" : "none";
      $("toggle-overlay-btn").classList.toggle("active", state.isOverlayOpen);
      if (state.isOverlayOpen) syncGuides();
    });

    $("reset-width-btn").addEventListener("click", () => {
      state.customX = null;
      state.customWidth = null;
      state.widthPreset = "auto";
      presetBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-w") === "auto"));
      updateUI();
      syncGuides();
    });

    $("start-export-btn").addEventListener("click", onExportClick);

    setupGuideDragging();
  }

  // 8. 元素吸附选取器
  function startPicker(mode) {
    state.pickerMode = mode;
    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
    const hoverRect = $("picker-hover-rect");
    const tooltip = $("picker-tooltip");
    const panel = $("pdf-panel");

    panel.classList.add("hidden");

    const isStart = mode === "start";
    hoverRect.style.border = isStart ? "2px solid #10b981" : "2px solid #e11d48";
    hoverRect.style.background = isStart ? "rgba(16, 185, 129, 0.12)" : "rgba(225, 29, 72, 0.12)";
    hoverRect.style.display = "block";
    tooltip.style.display = "block";

    const onMouseMove = (e) => {
      const rawTarget = document.elementFromPoint(e.clientX, e.clientY);
      if (!rawTarget || rawTarget.closest("#smart-pdf-exporter-host")) return;

      const target = getSignificantBlock(rawTarget);
      const rect = target.getBoundingClientRect();

      hoverRect.style.top = (rect.top + window.scrollY) + "px";
      hoverRect.style.left = (rect.left + window.scrollX) + "px";
      hoverRect.style.width = rect.width + "px";
      hoverRect.style.height = rect.height + "px";

      const tagDesc = target.tagName.toLowerCase();
      const snippet = (target.innerText || "").trim().slice(0, 15);

      tooltip.innerText = isStart
        ? "📌 设为【起点】: <" + tagDesc + "> \"" + snippet + "...\""
        : "🏁 设为【终点】: <" + tagDesc + "> \"" + snippet + "...\"";
      tooltip.style.top = Math.max(10, rect.top + window.scrollY - 30) + "px";
      tooltip.style.left = (rect.left + window.scrollX) + "px";
    };

    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rawTarget = document.elementFromPoint(e.clientX, e.clientY);
      if (rawTarget && !rawTarget.closest("#smart-pdf-exporter-host")) {
        const target = getSignificantBlock(rawTarget);
        const rect = target.getBoundingClientRect();
        if (isStart) {
          state.startElement = target;
          state.customStartY = Math.max(0, Math.floor(rect.top + window.scrollY));
        } else {
          state.endElement = target;
          state.customEndY = Math.ceil(rect.bottom + window.scrollY);
        }
      }

      cleanup();
      panel.classList.remove("hidden");
      updateUI();
      syncGuides();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        cleanup();
        panel.classList.remove("hidden");
      }
    };

    function cleanup() {
      state.pickerMode = null;
      hoverRect.style.display = "none";
      tooltip.style.display = "none";
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
    }

    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown, true);
  }

  // 9. 智能滚屏加载懒加载图片
  async function smoothPreload() {
    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
    const btn = $("scroll-preload-btn");
    btn.disabled = true;
    btn.innerText = "预加载中...";

    const origY = window.scrollY;
    const scrollH = document.documentElement.scrollHeight;
    const step = window.innerHeight * 0.85;

    for (let y = 0; y < scrollH; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo({ top: scrollH, behavior: "instant" });
    await new Promise(r => setTimeout(r, 150));

    window.scrollTo({ top: origY, behavior: "instant" });
    btn.disabled = false;
    btn.innerText = "⬇️ 预加载楼层与图片";
    updateUI();
  }

  // 10. 参考线拖动手柄与页面自由滚动联动
  function setupGuideDragging() {
    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
    const gTop = $("guide-top");
    const gBottom = $("guide-bottom");
    const gLeft = $("guide-left");
    const gRight = $("guide-right");

    function makeDraggable(el, type) {
      let active = false;

      el.addEventListener("mousedown", (e) => {
        active = true;
        e.preventDefault();
        e.stopPropagation();
      });

      window.addEventListener("mousemove", (e) => {
        if (!active) return;
        const crop = getEffectiveCrop();

        if (type === "top") {
          state.customStartY = Math.max(0, Math.round(e.clientY + window.scrollY));
        } else if (type === "bottom") {
          state.customEndY = Math.max(20, Math.round(e.clientY + window.scrollY));
        } else if (type === "left") {
          const docX = Math.round(e.clientX + window.scrollX);
          const right = crop.x + crop.width;
          state.customWidth = Math.max(100, right - docX);
          state.customX = docX;
          state.widthPreset = "custom";
        } else if (type === "right") {
          const docX = Math.round(e.clientX + window.scrollX);
          state.customWidth = Math.max(100, docX - crop.x);
          state.customX = crop.x;
          state.widthPreset = "custom";
        }
        updateUI();
        syncGuides();
      });

      window.addEventListener("mouseup", () => {
        if (active) active = false;
      });
    }

    makeDraggable(gTop, "top");
    makeDraggable(gBottom, "bottom");
    makeDraggable(gLeft, "left");
    makeDraggable(gRight, "right");

    window.addEventListener("scroll", () => {
      if (state.isOverlayOpen) syncGuides();
    }, { passive: true });
    window.addEventListener("resize", () => {
      if (state.isOverlayOpen) syncGuides();
    }, { passive: true });
  }

  function syncGuides() {
    if (!state.isOverlayOpen) return;
    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
    const crop = getEffectiveCrop();

    const viewTop = crop.y - window.scrollY;
    const viewBottom = (crop.y + crop.height) - window.scrollY;
    const viewLeft = crop.x - window.scrollX;
    const viewRight = (crop.x + crop.width) - window.scrollX;

    const gTop = $("guide-top");
    const gBottom = $("guide-bottom");
    const gLeft = $("guide-left");
    const gRight = $("guide-right");

    gTop.style.top = Math.max(0, Math.min(window.innerHeight - 2, viewTop)) + "px";
    gTop.style.left = viewLeft + "px";
    gTop.style.width = crop.width + "px";

    gBottom.style.top = Math.max(0, Math.min(window.innerHeight - 2, viewBottom)) + "px";
    gBottom.style.left = viewLeft + "px";
    gBottom.style.width = crop.width + "px";

    gLeft.style.left = Math.max(0, Math.min(window.innerWidth - 2, viewLeft)) + "px";
    gLeft.style.top = Math.max(0, viewTop) + "px";
    gLeft.style.height = Math.max(10, Math.min(window.innerHeight, viewBottom) - Math.max(0, viewTop)) + "px";

    gRight.style.left = Math.max(0, Math.min(window.innerWidth - 2, viewRight)) + "px";
    gRight.style.top = Math.max(0, viewTop) + "px";
    gRight.style.height = Math.max(10, Math.min(window.innerHeight, viewBottom) - Math.max(0, viewTop)) + "px";
  }

  // 11. 刷新面板状态文字
  function updateUI() {
    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
    const crop = getEffectiveCrop();

    const rangeBadge = $("range-badge");
    const rangeText = $("range-text");

    if (state.startElement && state.endElement) {
      rangeBadge.innerText = "已设起终点";
      rangeBadge.className = "badge active";
      rangeText.innerText = "已框选自 <" + state.startElement.tagName.toLowerCase() + "> 至 <" + state.endElement.tagName.toLowerCase() + ">";
    } else if (state.startElement) {
      rangeBadge.innerText = "已设起点 (至末尾)";
      rangeBadge.className = "badge active";
      rangeText.innerText = "起点: <" + state.startElement.tagName.toLowerCase() + "> (Y:" + crop.y + "px) | 终点: 页面末尾";
    } else if (state.endElement) {
      rangeBadge.innerText = "已设终点 (从顶部起)";
      rangeBadge.className = "badge active";
      rangeText.innerText = "起点: 网页顶部 (0px) | 终点: <" + state.endElement.tagName.toLowerCase() + ">";
    } else {
      rangeBadge.innerText = "默认全页完整导出";
      rangeBadge.className = "badge active";
      rangeText.innerText = "从顶部至底部全量内容（全长 " + crop.docHeight + "px）";
    }

    const widthBadge = $("width-badge");
    const widthText = $("width-text");

    if (state.customWidth !== null) {
      widthBadge.innerText = "手动宽度 (" + crop.width + "px)";
      widthBadge.className = "badge active";
      widthText.innerText = "选区宽度: " + crop.width + "px";
    } else {
      widthBadge.innerText = "自适应 (" + crop.info + ")";
      widthBadge.className = "badge active";
      widthText.innerText = "排版约束宽度: " + crop.width + "px (保留全部章节内容)";
    }
  }

  // 12. 提取起止内容（通用设计：默认全量保留整页，决不丢失后文章节）
  function extractRangeContent(crop) {
    let targetStart = state.startElement;
    let targetEnd = state.endElement;

    // 核心铁律：未指定起点和终点时，代表全量导出整个页面！
    // 直接克隆整个 document.body，保留页面上所有 Section、卡片、表格，绝对不随意挑一个 div 截断后文！
    if (!targetStart && !targetEnd) {
      const clone = document.body.cloneNode(true);
      cleanInteractiveNoise(clone);
      return clone.innerHTML;
    }

    // 指定了起点或终点时，以顶级 body 为大树，确保后续所有章节完整存在
    const container = document.body;

    if (!targetStart) {
      targetStart = container.firstElementChild || container;
    }
    if (!targetEnd) {
      targetEnd = container.lastElementChild || container;
    }

    targetStart.setAttribute("data-pdf-start-marker", "true");
    targetEnd.setAttribute("data-pdf-end-marker", "true");

    const clone = container.cloneNode(true);

    targetStart.removeAttribute("data-pdf-start-marker");
    targetEnd.removeAttribute("data-pdf-end-marker");

    const cloneStart = clone.querySelector("[data-pdf-start-marker]");
    const cloneEnd = clone.querySelector("[data-pdf-end-marker]");

    // 修复列表有序编号
    if (targetStart.tagName.toLowerCase() === "li") {
      const parentOl = targetStart.closest("ol");
      if (parentOl) {
        let count = 1;
        let sib = targetStart.previousElementSibling;
        while (sib) {
          if (sib.tagName.toLowerCase() === "li") count++;
          sib = sib.previousElementSibling;
        }
        const baseStart = parentOl.hasAttribute("start") ? parseInt(parentOl.getAttribute("start"), 10) : 1;
        const cloneOl = cloneStart?.closest("ol");
        if (cloneOl) {
          cloneOl.setAttribute("start", (baseStart + count - 1).toString());
        }
      }
    }

    if (cloneStart) {
      let curr = cloneStart;
      while (curr && curr !== clone) {
        let prev = curr.previousSibling;
        while (prev) {
          const toRemove = prev;
          prev = prev.previousSibling;
          toRemove.remove();
        }
        curr = curr.parentElement;
      }
      cloneStart.removeAttribute("data-pdf-start-marker");
    }

    if (cloneEnd) {
      let curr = cloneEnd;
      while (curr && curr !== clone) {
        let next = curr.nextSibling;
        while (next) {
          const toRemove = next;
          next = next.nextSibling;
          toRemove.remove();
        }
        curr = curr.parentElement;
      }
      cloneEnd.removeAttribute("data-pdf-end-marker");
    }

    cleanInteractiveNoise(clone);
    return clone.innerHTML;
  }

  function cleanInteractiveNoise(container) {
    const actionSelectors = [
      "button", "[role=\"button\"]",
      "[data-testid*=\"action\"]", "[data-testid*=\"turn-action\"]",
      ".action-buttons", ".toolbar", ".feedback", ".copy-btn",
      ".post-action-menu", ".post-controls", ".post-menu-area",
      ".topic-map", ".timeline-container", ".topic-navigation", ".post-links-container",
      "[class*=\"action-bar\"]", "[class*=\"feedback\"]", "[class*=\"copy-button\"]",
      "[class*=\"turn-action\"]", ".text-token-text-secondary", ".text-gray-400",
      "#smart-pdf-exporter-host", "script", "noscript"
    ];

    container.querySelectorAll(actionSelectors.join(", ")).forEach(el => {
      if (el.matches("button, [role=\"button\"]") || (el.querySelector("button, svg") && (el.innerText || "").trim().length < 40)) {
        el.remove();
      }
    });
  }

  // 13. 统一导出入口
  async function onExportClick() {
    if (state.isProcessing) return;
    state.isProcessing = true;

    const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
    const exportBtn = $("start-export-btn");
    const progressWrap = $("progress-wrap");
    const progressFill = $("progress-fill");
    const progressLabel = $("progress-label");

    exportBtn.disabled = true;
    progressWrap.classList.add("active");

    const updateProgress = (pct, msg) => {
      progressFill.style.width = pct + "%";
      progressLabel.innerText = msg;
    };

    try {
      if (state.engine === "vector") {
        updateProgress(30, "正在提取全页内容并装配矢量排版...");
        await executeVectorPrint(updateProgress);
        updateProgress(100, "🎉 已调起系统打印，请选择「另存为 PDF」");
      } else {
        updateProgress(20, "正在按需加载图像渲染库...");
        await executeCanvasExport(updateProgress);
        updateProgress(100, "🎉 导出成功！已触发浏览器下载。");
      }

      setTimeout(() => {
        progressWrap.classList.remove("active");
        progressFill.style.width = "0%";
        exportBtn.disabled = false;
        state.isProcessing = false;
      }, 3000);

    } catch (err) {
      console.error("[PDF导出错误]:", err);
      updateProgress(100, "导出异常: " + err.message);
      exportBtn.disabled = false;
      state.isProcessing = false;
    }
  }

  // 14. Adobe 级原生矢量排版引擎（彻底根治通用页面截断与只出一页纸问题）
  async function executeVectorPrint(updateProgress) {
    const crop = getEffectiveCrop();
    const docTitle = (document.title || "网页文档").replace(/[\\/:*?\"<>|]/g, "_").trim();

    const contentHtml = extractRangeContent(crop);

    updateProgress(60, "正在解除溢出截断限制并优化打印排版...");

    let stylesHtml = "";
    document.querySelectorAll("link[rel=\"stylesheet\"], style").forEach(node => {
      if (node.closest("#smart-pdf-exporter-host")) return;
      stylesHtml += node.outerHTML + "\n";
    });

    const existingIframe = document.getElementById("smart-pdf-print-frame");
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "smart-pdf-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-99999px";
    iframe.style.left = "-99999px";
    iframe.style.width = "1000px";
    iframe.style.height = "1000px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const targetWidth = crop.width || 1000;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${docTitle}</title>
          <base href="${window.location.href}">
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            /* 核心突破：强制解除所有容器的 overflow:hidden 与 100% / 100vh 高度限制，彻底消灭 Chromium 只打印 1 页的严重截断缺陷！ */
            html, body, #app, #root, #__next, div, main, section, article, .container, .wrapper, .main-content {
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              overflow-x: visible !important;
              overflow-y: visible !important;
              position: static !important;
            }
            body {
              background: #ffffff !important;
              color: #1a1a1a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              line-height: 1.6 !important;
            }
            .pdf-vector-container {
              width: ${targetWidth}px !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              display: block !important;
            }
            /* 允许所有通用区块、卡片容器、表格自由跨页排版 */
            section, div, article, main, table, ul, ol, .grid, .flex, .topic-list, .post-stream {
              break-inside: auto !important;
              page-break-inside: auto !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
            /* 保证卡片单元、表格行、图片不被横切腰斩 */
            .card, [class*="card"], tr, img, pre, figure, .highlight {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            .topic-post, article[id^="post_"], .comment, .reply, [data-post-number] {
              break-inside: auto !important;
              page-break-inside: auto !important;
              margin-bottom: 24px !important;
              padding-bottom: 16px !important;
              border-bottom: 1px solid #e2e8f0 !important;
              display: block !important;
              height: auto !important;
              min-height: 0 !important;
            }
            .topic-meta-data, .names, .post-info, .author {
              break-after: avoid !important;
              page-break-after: avoid !important;
              margin-bottom: 8px !important;
            }
            tbody {
              break-inside: auto !important;
              page-break-inside: auto !important;
            }
            ol {
              list-style-type: decimal !important;
              padding-left: 28px !important;
            }
            ul {
              list-style-type: disc !important;
              padding-left: 28px !important;
            }
            li {
              display: list-item !important;
              margin-bottom: 6px !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            h1, h2, h3, h4, h5, h6 {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
            button, [role="button"], 
            [data-testid*="action"], [data-testid*="turn-action"],
            .action-buttons, .toolbar, .feedback,
            nav, header, footer, .sidebar,
            [class*="feedback"], [class*="copy-btn"] {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="pdf-vector-container">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    updateProgress(85, "正在调起浏览器原生打印...");
    await new Promise(r => setTimeout(r, 600));

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  // 15. Canvas 模式（按需加载，单页长图）
  async function loadLibraryOnDemand(url, checkGlobal) {
    if (checkGlobal()) return true;
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("CDN 加载失败: " + url));
      document.head.appendChild(s);
    });
  }

  async function executeCanvasExport(updateProgress) {
    updateProgress(25, "按需加载 html2canvas 与 jsPDF...");
    await loadLibraryOnDemand("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", () => !!window.html2canvas);
    await loadLibraryOnDemand("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", () => !!(window.jspdf?.jsPDF || window.jsPDF));

    updateProgress(45, "正在测量安全渲染高度...");
    const crop = getEffectiveCrop();
    const renderScale = crop.height > 6000 ? 1.2 : 1.5;

    hostElement.style.display = "none";
    updateProgress(60, "正在生成长图画布...");

    const canvas = await window.html2canvas(document.body, {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      scrollY: 0,
      scrollX: 0,
      useCORS: true,
      allowTaint: false,
      scale: renderScale,
      logging: false
    });

    hostElement.style.display = "block";
    updateProgress(85, "正在组装单页 PDF...");

    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    const ptW = crop.width * 0.75;
    const ptH = crop.height * 0.75;
    const pdf = new jsPDF({
      orientation: ptW > ptH ? "landscape" : "portrait",
      unit: "pt",
      format: [ptW, ptH]
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    pdf.addImage(imgData, "JPEG", 0, 0, ptW, ptH);

    const cleanTitle = (document.title || "网页文档").replace(/[\\/:*?\"<>|]/g, "_").trim().slice(0, 35);
    pdf.save(cleanTitle + "_长图.pdf");
  }

  // 16. 注册油猴菜单与入口
  if (typeof GM_registerMenuCommand !== "undefined") {
    GM_registerMenuCommand("📑 打开转 PDF 控制台", () => {
      initUI();
      const $ = (id) => uiContainer.getElementById ? uiContainer.getElementById(id) : uiContainer.querySelector("#" + id);
      const panel = $("pdf-panel");
      if (panel) panel.classList.remove("hidden");
    });
  }

  if (document.readyState === "complete") {
    setTimeout(initUI, 300);
  } else {
    window.addEventListener("load", () => setTimeout(initUI, 300));
  }

})();
