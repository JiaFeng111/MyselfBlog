/* 前台和后台共用的请求、图标、转义和 Markdown 工具；不包含权限或业务操作。 */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const paths = {
    home: "M3 10 12 3l9 7M5 9v11h5v-6h4v6h5V9",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    archive: "M3 4h18v5H3zM5 9v11h14V9M9 13h6",
    smile: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M8 14q4 5 8 0M8 9h.01M16 9h.01",
    search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2",
    menu: "M4 6h16M4 12h16M4 18h16",
    "arrow-right": "M4 12h16m-6-6 6 6-6 6",
    "arrow-left": "M20 12H4m6-6-6 6 6 6",
    "arrow-up-right": "M5 19 19 5M5 5h14v14",
    "arrow-up": "M12 20V4m-6 6 6-6 6 6",
    sun: "M12 3V1m0 22v-2M3 12H1m22 0h-2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
    pen: "m14 4 6 6M3 21l5-1L21 7a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16z",
    list: "M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01",
    megaphone: "m4 10 15-6v16L4 14zM4 10H2v4h2m3 2 2 6h4l-2-5M22 8v8",
    hash: "M5 9h15M4 15h15M10 3 6 21M18 3l-4 18",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    heart: "M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 4 0 9 8 15 8-6 12-11 8-15Z",
    pin: "m9 3 9 6-4 2v5l-3 1-3-5-4 1 5-10ZM9 16l-5 6",
    x: "m6 6 12 12M6 18 18 6",
    share: "M12 16V3m-5 5 5-5 5 5M5 12H3v9h18v-9h-2",
    chevron: "m9 5 7 7-7 7",
    calendar: "M4 5h16v16H4zM4 10h16M8 2v6m8-6v6",
  };
  function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.smile}"/></svg>`;
  }
  function icons(root = document) {
    $$("[data-icon]", root).forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });
  }
  // 所有来自数据库的文字都要转义，避免文章标题或评论被当作 HTML 执行。
  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function imageUrl(value, fallback = "/assets/code-notes.svg") {
    if (!value) return fallback;
    try {
      const url = new URL(value, location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  }
  function dateText(value, short = false) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return short
      ? `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`
      : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  }
  function countText(value) {
    const n = Number(value) || 0;
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }
  function safeSession(key, value) {
    try {
      if (value === undefined) return sessionStorage.getItem(key);
      sessionStorage.setItem(key, value);
    } catch {
      return null;
    }
  }

  async function request(path, { method = "GET", body, signal } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response;
    try {
      response = await fetch(path, {
        method,
        credentials: "same-origin",
        headers:
          body && !(body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {},
        body:
          body instanceof FormData
            ? body
            : body === undefined
              ? undefined
              : JSON.stringify(body),
        signal: signal || controller.signal,
      });
    } catch (cause) {
      const error = new Error(
        cause.name === "AbortError"
          ? "请求超时了，请稍后再试。"
          : "暂时连不上博客服务，请确认项目已经启动。",
      );
      error.network = true;
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    let result;
    try {
      result = await response.json();
    } catch {
      const error = new Error("博客服务暂时没有正确响应，请稍后再试。");
      error.network = true;
      throw error;
    }
    if (!response.ok || !result.success) {
      const error = new Error(
        response.status >= 500
          ? "服务暂时忙碌，请检查后端和数据库后重试。"
          : result.message || "操作没有完成，请重试。",
      );
      error.status = response.status;
      error.network = response.status >= 500;
      throw error;
    }
    return result.data;
  }

  // 一个轻量的 Markdown 子集：支持标题、列表、引用、行内代码和代码块，不执行原始 HTML。
  function inlineMarkdown(text) {
    return esc(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }
  function markdown(text) {
    const lines = String(text || "")
      .replace(/\r/g, "")
      .split("\n");
    let result = "",
      code = false,
      buffer = [],
      list = "";
    const closeList = () => {
      if (list) {
        result += `</${list}>`;
        list = "";
      }
    };
    for (const line of lines) {
      if (/^```/.test(line)) {
        closeList();
        if (code) {
          result += `<pre><code>${esc(buffer.join("\n"))}</code></pre>`;
          buffer = [];
        }
        code = !code;
        continue;
      }
      if (code) {
        buffer.push(line);
        continue;
      }
      if (/^#{1,6}\s/.test(line)) {
        closeList();
        const level = Math.min(3, line.match(/^#+/)[0].length + 1);
        result += `<h${level}>${inlineMarkdown(line.replace(/^#+\s/, ""))}</h${level}>`;
        continue;
      }
      const unordered = line.match(/^\s*[-*]\s+(.+)$/),
        ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        const kind = unordered ? "ul" : "ol";
        if (list !== kind) {
          closeList();
          list = kind;
          result += `<${kind}>`;
        }
        result += `<li>${inlineMarkdown((unordered || ordered)[1])}</li>`;
        continue;
      }
      closeList();
      if (/^>\s?/.test(line)) {
        result += `<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`;
        continue;
      }
      if (line.trim()) result += `<p>${inlineMarkdown(line)}</p>`;
    }
    closeList();
    if (code) result += `<pre><code>${esc(buffer.join("\n"))}</code></pre>`;
    return result;
  }

  const adminViews = new Set([
    "dashboard",
    "articles",
    "drafts",
    "categories",
    "comments",
    "users",
  ]);
  function adminUrl(view = "dashboard") {
    return `/admin/index.html#${adminViews.has(view) ? view : "dashboard"}`;
  }
  function loginUrl(view = "dashboard", expired = false) {
    const params = new URLSearchParams({
      login: "1",
      next: "admin",
      view: adminViews.has(view) ? view : "dashboard",
    });
    if (expired) params.set("notice", "expired");
    return `/?${params}`;
  }
  // 只广播“身份可能变化”的信号；实际用户资料始终重新向服务端查询。
  function signalSessionChange() {
    try {
      localStorage.setItem(
        "blog-session-change",
        `${Date.now()}-${Math.random()}`,
      );
    } catch {}
  }
  function watchSession(callback) {
    window.addEventListener("storage", (event) => {
      if (event.key === "blog-session-change") callback();
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) callback();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") callback();
    });
  }

  Object.assign(paths, {
    plus: "M12 4v16M4 12h16",
    refresh:
      "M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 7M19 17a8 8 0 0 1-13 2l-2-7",
    message: "M21 4H3v13h5l4 4 4-4h5ZM7 9h10M7 13h6",
  });
  window.BlogUI = Object.freeze({
    $,
    $$,
    icon,
    icons,
    esc,
    imageUrl,
    dateText,
    countText,
    safeSession,
    request,
    markdown,
    adminUrl,
    loginUrl,
    signalSessionChange,
    watchSession,
  });
})();
