/* 原生 JavaScript：先通过 api() 请求 Spring Boot，再把数据渲染成卡片。 */
"use strict";

const {
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
  signalSessionChange,
  watchSession,
} = window.BlogUI;

const demoCategories = [
  { id: 1, name: "技术手记" },
  { id: 2, name: "生活碎片" },
  { id: 3, name: "风景在路上" },
];
const demoArticles = [
  {
    id: "demo-1",
    title: "我的 Spring Boot 第一课：从 Hello World 开始",
    categoryId: 1,
    summary:
      "从零搭建第一个 Spring Boot 项目，把学过的 Java 知识串起来。每一小步，都算数。",
    coverUrl: "/assets/code-notes.svg",
    publishTime: "2026-11-06T09:30:00",
    viewCount: 128,
    likeCount: 16,
    isTop: 1,
    essay:
      '# 从一个小小的 Hello World 开始\n\n学完 Java 和 MySQL 后，我开始学习 Spring Boot。刚开始看到好多注解，确实有一点点迷茫。不过，先让程序跑起来，事情就会变得清楚一些。\n\n## 1. 写一个最简单的接口\n\n```java\n@RestController\npublic class HelloController {\n    @GetMapping("/hello")\n    public String hello() {\n        return "Hello, Spring Boot!";\n    }\n}\n```\n\n`@RestController` 告诉 Spring：这个类用来处理请求，并直接把结果写到响应中。`@GetMapping` 则说明这个方法对应哪个 GET 请求地址。\n\n## 2. 去浏览器看看结果\n\n启动项目后，在浏览器输入项目地址，再加上 `/hello`，就能看到返回的文字。这个博客项目的端口是 `9191`。\n\n## 3. 下一步学什么？\n\n- 学会把 Controller、Service 和 Mapper 分层。\n- 用请求对象接收前端的 JSON。\n- 连接 MySQL，把数据真正存下来。\n\n> 不用一次理解全部知识。今天比昨天多懂一点，就是很棒的开始。',
  },
  {
    id: "demo-2",
    title: "去山野里，给生活放一个小小的假",
    categoryId: 3,
    summary:
      "把烦恼暂时留在身后，去看看绿色的山、蓝色的天。原来快乐，有时候真的很简单。",
    coverUrl: "/assets/green-hills.jpg",
    publishTime: "2026-11-04T15:00:00",
    viewCount: 86,
    likeCount: 12,
    essay:
      "# 去山野里，给生活放个假\n\n写代码写累了，就去外面走一走。风从草坡上慢慢吹过来，云朵轻轻飘着，屏幕上的那些小问题，好像也没那么着急了。\n\n## 收集一点绿色\n\n今天没有安排满满的行程，只是沿着小路往前走，看看路边的花，听听树上的鸟叫。\n\n- 带一瓶水，还有一点点零食。\n- 找个舒服的地方坐一会儿。\n- 留下照片，也把好心情带回家。\n\n> 生活需要认真，也需要偶尔放空。\n\n这是用于展示页面效果的示例随笔，愿你也有一段属于自己的轻松时光。",
  },
  {
    id: "demo-3",
    title: "湖边散步计划：把周末还给自己",
    categoryId: 2,
    summary:
      "不赶路，不打卡。在湖边慢慢走，看一场云和山的相遇，顺便收集一些平凡的幸福。",
    coverUrl: "/assets/quiet-lake.jpg",
    publishTime: "2026-11-02T10:00:00",
    viewCount: 64,
    likeCount: 9,
    essay:
      "# 把周末还给自己\n\n这一周学了不少新知识，也遇到了几个难解的小 bug。周末决定先合上电脑，去湖边走走。\n\n## 今天的快乐清单\n\n- 一杯温温的茶。\n- 看到山倒映在水里。\n- 一次没有目的的散步。\n- 给自己做一顿喜欢的饭。\n\n原来不一定要发生什么特别的事，平凡的一天也值得被记录。\n\n> 好好休息，也是认真生活的一部分。",
  },
  {
    id: "demo-4",
    title: "关于学习这件事，慢一点也没关系",
    categoryId: 2,
    summary:
      "今天弄懂了一个知识点，解决了一个小问题。虽然走得不快，但每一步都在靠近想成为的自己。",
    coverUrl: "/assets/life-notes.svg",
    publishTime: "2026-10-30T18:00:00",
    viewCount: 92,
    likeCount: 18,
    essay:
      "# 慢一点，也没关系\n\n以前总想一下子学会所有东西，现在慢慢发现，理解需要时间，熟练需要练习。\n\n## 我的学习小习惯\n\n1. 每次只给自己定一个小目标。\n2. 看完例子，一定亲手写一遍。\n3. 把遇到的问题记下来，写清楚原因和解决方法。\n4. 学累了就休息一下。\n\n比如学习 MySQL 时，不只是记住 SQL 的写法，还要自己建表、插入数据、执行查询，看看结果是不是和想象的一样。\n\n> 把复杂的事情拆成小步骤，就没有那么害怕了。\n\n记录这篇示例文章，送给正在学习的你。",
  },
  {
    id: "demo-5",
    title: "MySQL 学习笔记：让每一次查询都更清楚",
    categoryId: 1,
    summary:
      "从 SELECT 到 WHERE，再到分页查询。用几个简单的例子，把数据库知识一点点捡起来。",
    coverUrl: "/assets/code-notes.svg",
    publishTime: "2026-10-26T11:00:00",
    viewCount: 109,
    likeCount: 14,
    essay:
      "# 让每一次查询都更清楚\n\nMySQL 里最常用的语句就是查询。先明确自己想要什么数据，再把条件一步步写出来。\n\n```sql\nSELECT id, title, summary\nFROM essay_message\nWHERE status = 1\nORDER BY id DESC\nLIMIT 0, 4;\n```\n\n这段 SQL 查询已发布的文章，按 ID 从大到小排序，只取前四条。\n\n## 分页的小提醒\n\n`LIMIT` 的第一个数是偏移量，从 0 开始。第二页每页四条时，偏移量就是 `(2 - 1) * 4`，也就是 4。\n\n在这个项目中，分页通过 MyBatis Plus 的 `Page` 来完成。",
  },
  {
    id: "demo-6",
    title: "今天的天空，是喜欢的蓝色",
    categoryId: 3,
    summary:
      "散步时抬起头，刚好遇见一片很温柔的云。把这个小瞬间，放进今天的记忆口袋里。",
    coverUrl: "/assets/green-hills.jpg",
    publishTime: "2026-10-23T16:00:00",
    viewCount: 45,
    likeCount: 7,
    essay:
      "# 今天的天空，是喜欢的蓝色\n\n忙碌的日子里，别忘记偶尔抬头看看天空。也许是一朵奇怪形状的云，也许是落日给树叶镀上的光。\n\n## 留住小瞬间\n\n不需要特别的设备，也不需要走很远。用手机拍一张照片，写下一句话，就能把今天留住一点点。\n\n> 愿我们都有发现小美好的眼睛。",
  },
].map((item) => ({ ...item, author: "嘉丰", status: 1 }));

const state = {
  demo: new URLSearchParams(location.search).get("demo") === "1",
  forcedDemo: new URLSearchParams(location.search).get("demo") === "1",
  categories: [],
  records: [],
  total: 0,
  globalTotal: 0,
  page: 1,
  pageSize: 4,
  category: "",
  keyword: "",
  view: "grid",
  route: "home",
  user: null,
  requestId: 0,
  articleId: null,
  article: null,
  commentPage: 1,
  adminReturnView: "dashboard",
};
let toastTimer;
function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.toggle("error", error);
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.hidden = true;
  }, 4200);
}

// 后端统一返回 { success, message, data }。Cookie 中的 Session 由浏览器自动携带。
async function api(path, options) {
  try {
    return await request(path, options);
  } catch (error) {
    if (error.status === 401) {
      state.user = null;
      renderAccount();
    }
    throw error;
  }
}

function categoryName(id) {
  return (
    state.categories.find((c) => String(c.id) === String(id))?.name || "未分类"
  );
}
function fallbackCover(article) {
  return Number(article.categoryId) % 2 === 0
    ? "/assets/life-notes.svg"
    : "/assets/code-notes.svg";
}
function renderAccount() {
  const admin = state.user?.access === "1";
  $("#account-label").textContent = state.user?.name || "登录 / 注册";
  $("#account-button").title = state.user ? "查看我的账号" : "登录或注册";
  $("#account-button").setAttribute(
    "aria-label",
    state.user
      ? `我的账号：${state.user.name || state.user.account}`
      : "登录 / 注册",
  );
  $("#header-admin-link").hidden = !admin;
  $("#header-admin-link").href = adminUrl(state.adminReturnView);
  $("#footer-admin-link").hidden = !admin;
  document.body.classList.toggle("has-admin-access", admin);
}
function renderNotice() {
  const el = $("#connection-notice");
  el.hidden = !state.demo;
  if (state.demo)
    el.innerHTML = `<span>✿ ${state.forcedDemo ? "正在逛示例小天地 · 示例文章用于展示界面效果。" : "暂时没有连上博客，先逛逛示例小天地吧。"} 点赞演示只保留在当前页面。</span><button id="retry-connection">${state.forcedDemo ? "返回真实博客" : "重新连接"}</button>`;
}
function renderTabs() {
  $("#category-tabs").innerHTML =
    `<button class="${!state.category ? "active" : ""}" data-category="" aria-pressed="${!state.category}">全部文章</button>` +
    state.categories
      .map(
        (c) =>
          `<button class="${String(c.id) === String(state.category) ? "active" : ""}" data-category="${esc(c.id)}" aria-pressed="${String(c.id) === String(state.category)}">${esc(c.name)}</button>`,
      )
      .join("");
  $("#stat-categories").textContent = state.categories.length;
}
function card(article) {
  const date = dateText(article.publishTime || article.createTime);
  const cover = imageUrl(article.coverUrl, fallbackCover(article));
  return `<article class="article-card"><a class="card-cover-link" href="#article/${encodeURIComponent(article.id)}" tabindex="-1" aria-hidden="true"><img class="card-cover" src="${esc(cover)}" alt="" loading="lazy" data-fallback="${fallbackCover(article)}">${article.isTop === 1 ? `<span class="card-pin">${icon("pin")} 置顶小记</span>` : ""}</a><div class="card-body"><div class="card-meta"><span class="category-label">${esc(categoryName(article.categoryId))}</span>${date ? `<time datetime="${esc(article.publishTime || article.createTime)}">${date}</time>` : ""}${state.demo ? '<span class="demo-label">示例</span>' : ""}</div><h3><a href="#article/${encodeURIComponent(article.id)}">${esc(article.title || "无题小记")}</a></h3><p class="card-summary">${esc(article.summary || "这一篇小记，等你来慢慢读。")}</p><div class="card-footer"><span>${icon("eye")}${countText(article.viewCount)}</span><span>${icon("heart")}${countText(article.likeCount)}</span><a class="read-link" href="#article/${encodeURIComponent(article.id)}">读一读 ${icon("arrow-right")}</a></div></div></article>`;
}
function renderPagination() {
  const pages = Math.ceil(state.total / state.pageSize);
  const el = $("#pagination");
  el.hidden = pages <= 1 || ["article", "about"].includes(state.route);
  if (el.hidden) {
    el.innerHTML = "";
    return;
  }
  const numbers = new Set(
    [1, pages, state.page - 1, state.page, state.page + 1].filter(
      (n) => n > 0 && n <= pages,
    ),
  );
  let last = 0;
  el.innerHTML =
    `<button data-page="${state.page - 1}" aria-label="上一页" ${state.page === 1 ? "disabled" : ""}>${icon("arrow-left")}</button>` +
    [...numbers]
      .sort((a, b) => a - b)
      .map((n) => {
        const gap = n - last > 1 ? '<span aria-hidden="true">…</span>' : "";
        last = n;
        return `${gap}<button data-page="${n}" class="${n === state.page ? "active" : ""}" ${n === state.page ? 'aria-current="page"' : ""} aria-label="第 ${n} 页">${n}</button>`;
      })
      .join("") +
    `<button data-page="${state.page + 1}" aria-label="下一页" ${state.page >= pages ? "disabled" : ""}>${icon("arrow-right")}</button><span class="page-count">共 ${pages} 页</span>`;
}
function renderSearchSummary() {
  const el = $("#search-summary");
  el.hidden = !state.keyword;
  if (!el.hidden)
    el.innerHTML = `<span>关于「${esc(state.keyword)}」的小记录，共 ${state.total} 篇</span><button id="clear-search">清除搜索</button>`;
}
function emptyState() {
  return `<div class="empty-state"><span>✿</span><h3>${state.keyword ? "还没有找到这篇小美好" : "这里的小故事，正在发芽"}</h3><p>${state.keyword ? "换个关键词，或看看其他文章吧。" : "暂时还没有文章，期待第一篇记录。"}</p><button class="button" id="${state.keyword ? "reset-search" : "show-demo"}">${state.keyword ? "清除关键词" : "先逛逛示例界面"}</button></div>`;
}
function renderArchive() {
  let previousYear;
  $("#article-grid").innerHTML = state.records.length
    ? `<div class="archive-list">${state.records
        .map((article) => {
          const date = article.publishTime || article.createTime;
          const year = dateText(date)
            ? new Date(date).getFullYear()
            : "未记录日期";
          let heading =
            year !== previousYear
              ? `<h3 class="archive-year">${esc(year)}</h3>`
              : "";
          previousYear = year;
          return `${heading}<div class="archive-row"><time>${dateText(date, true) || "—"}</time><a href="#article/${encodeURIComponent(article.id)}">${esc(article.title)}</a><span class="category-label">${esc(categoryName(article.categoryId))}</span></div>`;
        })
        .join("")}</div>`
    : emptyState();
}
async function loadArticles({ refreshStats = false } = {}) {
  const requestId = ++state.requestId;
  $("#article-grid").setAttribute("aria-busy", "true");
  $("#article-grid").innerHTML =
    '<div class="loading-card"></div><div class="loading-card"></div>';
  try {
    let data;
    if (state.demo) {
      const filtered = demoArticles.filter(
        (a) =>
          (!state.category ||
            String(a.categoryId) === String(state.category)) &&
          (!state.keyword ||
            `${a.title} ${a.essay}`
              .toLowerCase()
              .includes(state.keyword.toLowerCase())),
      );
      data = {
        records: filtered.slice(
          (state.page - 1) * state.pageSize,
          state.page * state.pageSize,
        ),
        total: filtered.length,
      };
      state.globalTotal = demoArticles.length;
    } else {
      const query = new URLSearchParams({
        pageNum: state.page,
        pageSize: state.pageSize,
      });
      if (state.keyword) query.set("keyword", state.keyword);
      if (state.category) query.set("categoryId", state.category);
      data = await api(`/essay/essays?${query}`);
      if (!state.keyword && !state.category)
        state.globalTotal = Number(data.total) || 0;
      else if (refreshStats) {
        const overall = await api("/essay/essays?pageNum=1&pageSize=1");
        state.globalTotal = Number(overall.total) || 0;
      }
    }
    if (requestId !== state.requestId) return;
    state.records = data.records || [];
    state.total = Number(data.total) || 0;
    if (state.page > 1 && !state.records.length) {
      state.page = 1;
      return loadArticles();
    }
    $("#stat-articles").textContent = state.globalTotal;
    if (state.route === "archive") renderArchive();
    else
      $("#article-grid").innerHTML = state.records.length
        ? state.records.map(card).join("")
        : emptyState();
    renderPagination();
    renderSearchSummary();
  } catch (error) {
    if (requestId !== state.requestId) return;
    $("#article-grid").innerHTML =
      `<div class="empty-state"><span>☁</span><h3>小记录暂时没有送达</h3><p>${esc(error.message)}</p><button class="button" id="retry-articles">再试一次</button></div>`;
    $("#pagination").hidden = true;
  } finally {
    if (requestId === state.requestId)
      $("#article-grid").setAttribute("aria-busy", "false");
  }
}

function renderIntro() {
  $("#page-intro").innerHTML =
    state.route === "categories"
      ? `<div class="page-intro-card"><span class="section-kicker">FIND YOUR LITTLE INTEREST</span><h1>把喜欢的，分门别类。</h1><p>知识、日常，还有沿途的风景。挑一个小角落，开始今天的阅读吧。</p><div class="category-overview">${state.categories.map((c, i) => `<button data-category="${esc(c.id)}"><span>${["⌨", "☀", "♧"][i % 3]} &nbsp; ${esc(c.name)}</span>${icon("arrow-up-right")}</button>`).join("") || "<p>分类正在等待管理员添加。</p>"}</div></div>`
      : state.route === "archive"
        ? '<div class="page-intro-card"><span class="section-kicker">EVERY LITTLE MOMENT COUNTS</span><h1>时光慢慢，故事一篇篇。</h1><p>按文章发布顺序，翻一翻走过的小脚印。置顶文章优先展示。</p></div>'
        : "";
}
function renderAbout() {
  $("#article-grid").innerHTML =
    `<article class="about-page"><div class="about-banner"><img src="/assets/avatar.svg" alt="嘉丰的卡通头像"><div><span class="section-kicker">NICE TO MEET YOU</span><h1>嗨，我是嘉丰！</h1><p>一个在代码和生活里，慢慢长大的小同学。</p></div></div><div class="about-content"><h2>在这里，记录一点热爱。 🌱</h2><p>我刚刚学完 Java 和 MySQL，现在正在学习 Spring Boot。这个博客就是我的小小练习场，也是一份慢慢积累的成长记录。</p><p>遇到不懂的知识，就多查一点资料；碰到解决不了的问题，就拆成更小的步骤。希望以后回头看时，能发现自己已经悄悄走了很远。</p><h2>正在探索的小世界</h2><div class="skill-row"><span>Java</span><span>MySQL</span><span>Spring Boot</span><span>生活记录</span><span>沿途风景</span></div><h2>不只写代码，也认真生活。</h2><p>喜欢蓝色的天空、绿色的山野，还有那些微不足道却让人开心的小事。希望这个小小角落，既能装下学习的收获，也能留下生活的温度。</p><div class="about-quote">不用着急成为很厉害的人。保持好奇，一步一步来。 ♡</div><div class="asset-credit">风景摄影：<a href="https://unsplash.com/photos/rolling-green-hills-under-a-bright-blue-sky-KvlCSWbsiR0" target="_blank" rel="noopener noreferrer">Shibin Joseph / Unsplash</a> · <a href="https://www.pexels.com/photo/lush-green-mountain-by-tranquil-lake-36856732/" target="_blank" rel="noopener noreferrer">Cătălin Todosia / Pexels</a></div></div></article>`;
}

function likedKey(id) {
  return `blog-liked-${state.user?.id || "guest"}-${id}`;
}
function liked(id) {
  return state.demo
    ? Boolean(demoArticles.find((a) => a.id === id)?._liked)
    : safeSession(likedKey(id)) === "1";
}
async function openArticle(id) {
  const requestId = ++state.requestId;
  state.articleId = id;
  state.commentPage = 1;
  state.article = null;
  $("#article-grid").innerHTML =
    '<div class="loading-card"></div><div class="loading-card"></div>';
  $("#article-grid").setAttribute("aria-busy", "true");
  try {
    if (!state.demo && !/^\d+$/.test(id))
      throw new Error("这篇示例小记需要在示例模式下打开。");
    const article = state.demo
      ? demoArticles.find((a) => a.id === id)
      : await api(`/essay/${encodeURIComponent(id)}`);
    if (requestId !== state.requestId) return;
    if (!article) throw new Error("这篇小记还没有找到。");
    state.article = article;
    document.title = `${article.title} · 嘉丰的小小博客`;
    $("#article-grid").innerHTML =
      `<article class="article-detail"><img class="detail-cover" src="${esc(imageUrl(article.coverUrl, fallbackCover(article)))}" alt="文章封面" data-fallback="${fallbackCover(article)}"><div class="detail-content"><a href="#home" class="detail-back">${icon("arrow-left")} 回到小记录</a><span class="category-label">${esc(categoryName(article.categoryId))}</span>${state.demo ? ' <span class="demo-label">示例文章</span>' : ""}<h1>${esc(article.title)}</h1><div class="detail-meta"><span>${esc(article.author || "博主")}</span><span>${dateText(article.publishTime || article.createTime) || "日期未记录"}</span><span>${countText(article.viewCount)} 次阅读</span></div><div class="prose">${markdown(article.essay)}</div><div class="detail-actions"><button class="button like-button ${liked(id) ? "liked" : ""}" id="like-article">${icon("heart")} <span>${liked(id) ? "喜欢过啦" : "喜欢这篇"} · ${Number(article.likeCount) || 0}</span></button><button class="share-button" id="share-article">${icon("share")} 复制文章链接</button></div><div id="adjacent-articles" class="adjacent-articles" hidden></div></div><section class="comments-section"><h2>聊两句吧 <span aria-hidden="true">☁</span></h2><form id="comment-form"><textarea name="content" maxlength="1000" required aria-label="评论内容" placeholder="留下一点想法，让小小的相遇有回声…"></textarea><div class="comment-submit-row"><span>${state.demo ? "示例文章仅供阅读" : "友善交流，分享你的想法（最多 1000 字）"}</span><button class="button" type="submit">${icon("pen")} 发送评论</button></div><div class="form-error" id="comment-error" hidden role="alert"></div></form><div id="comments-list" aria-live="polite"><p class="comments-empty">正在收集小回声…</p></div><button class="comments-more" id="comments-more" hidden>再读一些评论</button></section></article>`;
    if (state.demo)
      $("#comments-list").innerHTML =
        '<p class="comments-empty">这是示例小记。真实文章发布后，就可以在这里交流啦。</p>';
    else {
      loadComments();
      loadAdjacent(id, requestId);
    }
  } catch (error) {
    if (requestId === state.requestId)
      $("#article-grid").innerHTML =
        `<div class="empty-state"><span>☁</span><h3>这篇小记暂时打不开</h3><p>${esc(error.message)}</p><a class="button" href="#home">回到首页</a></div>`;
  } finally {
    if (requestId === state.requestId)
      $("#article-grid").setAttribute("aria-busy", "false");
  }
}
async function loadAdjacent(id, requestId) {
  const results = await Promise.allSettled([
    api(`/essay/front/${id}`),
    api(`/essay/under/${id}`),
  ]);
  if (requestId !== state.requestId) return;
  const el = $("#adjacent-articles");
  if (!el) return;
  const [previous, next] = results.map((r) =>
    r.status === "fulfilled" ? r.value : null,
  );
  el.hidden = !previous && !next;
  el.innerHTML = `<div>${previous ? `<button data-open-article="${esc(previous.id)}">← 上一篇<br>${esc(previous.title)}</button>` : ""}</div><div>${next ? `<button data-open-article="${esc(next.id)}">下一篇 →<br>${esc(next.title)}</button>` : ""}</div>`;
}
async function loadComments(append = false) {
  const id = state.articleId,
    page = state.commentPage;
  try {
    const data = await api(
      `/comment/comments/${id}?pageNum=${page}&pageSize=10`,
    );
    if (state.articleId !== id || state.route !== "article") return;
    const el = $("#comments-list");
    const html = (data.records || [])
      .map(
        (c) =>
          `<article class="comment-item"><div><strong>小伙伴 #${esc(c.userId)}</strong><time>${dateText(c.createTime)}</time></div><p>${esc(c.content)}</p></article>`,
      )
      .join("");
    if (append) el.insertAdjacentHTML("beforeend", html);
    else
      el.innerHTML =
        html ||
        '<p class="comments-empty">还没有小回声，来留下第一条评论吧。</p>';
    $("#comments-more").hidden = page * 10 >= Number(data.total);
  } catch (error) {
    if (state.articleId === id && $("#comments-list")) {
      if (append) {
        state.commentPage = Math.max(1, page - 1);
        toast("更多评论暂时没有送达，再试一次吧。", true);
      } else
        $("#comments-list").innerHTML =
          '<p class="comments-empty">评论暂时没能加载。<button id="retry-comments">点击重试</button></p>';
    }
  }
}

function showModal(
  title,
  html,
  { editor = false, kicker = "WELCOME TO MY LITTLE WORLD" } = {},
) {
  const dialog = $("#modal");
  $("#modal-title").textContent = title;
  $("#modal-kicker").textContent = kicker;
  $("#modal-body").innerHTML = html;
  dialog.classList.toggle("editor-modal", editor);
  if (!dialog.open) dialog.showModal();
  icons(dialog);
}
function formError(message, selector = "#modal-error") {
  const el = $(selector);
  if (el) {
    el.textContent = message;
    el.hidden = false;
  } else toast(message, true);
}
function errorBox(id = "modal-error") {
  return `<div class="form-error" id="${id}" hidden role="alert"></div>`;
}
function field(label, name, type = "text", extra = "") {
  return `<div class="form-field"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" ${extra}></div>`;
}
function openAuth(mode = "login") {
  const registering = mode === "register";
  showModal(
    registering ? "成为新的小伙伴" : "欢迎回来，小伙伴！",
    `<p class="auth-welcome">${registering ? "留一个名字，一起记录生活里的小美好。" : "登录后，就能为喜欢的文章点赞、留下评论啦。"}</p><form id="auth-form" data-mode="${mode}">${errorBox()}${field("账号", "account", "text", 'required maxlength="50" autocomplete="username" placeholder="请输入你的账号"')}${registering ? field("昵称", "name", "text", 'required maxlength="20" autocomplete="nickname" placeholder="在这里，怎么称呼你？"') : ""}${field("密码", "password", "password", `required autocomplete="${registering ? "new-password" : "current-password"}" placeholder="请输入密码"`)}${registering ? `<div class="form-row"><div class="form-field"><label for="field-sex">性别</label><select id="field-sex" name="sex" required><option value="男">男</option><option value="女">女</option></select></div>${field("年龄", "year", "number", 'required min="0" max="120" value="18"')}</div><p class="form-hint">密码按 UTF-8 编码最多 72 字节。注册账号默认是普通读者，可以点赞和评论。</p>` : ""}<button class="button form-submit" type="submit">${registering ? "注册，一起慢慢长大" : "登录，回到小天地"} ${icon("arrow-right")}</button></form><p class="auth-switch">${registering ? "已经是小伙伴了？" : "第一次来这里？"}<button data-auth-mode="${registering ? "login" : "register"}">${registering ? "去登录" : "注册一个账号"}</button></p>`,
  );
}
function requireUser() {
  if (state.user) return true;
  openAuth("login");
  return false;
}
function openAccount() {
  if (!state.user) return openAuth("login");
  showModal(
    "我的小角落",
    `<div class="account-summary"><img src="/assets/avatar.svg" alt=""><div><h3>${esc(state.user.name)}</h3><p>${state.user.access === "1" ? "博客管理员" : "快乐的小读者"} · ${esc(state.user.account)}</p></div></div><div class="account-links">${state.user.access === "1" ? `<a class="button" href="/admin/index.html">进入管理后台 ${icon("arrow-up-right")}</a>` : ""}<button class="button logout-button" id="logout-button">退出当前账号 ${icon("arrow-right")}</button></div>`,
  );
}
async function submitAuth(form) {
  const button = $('[type="submit"]', form);
  button.disabled = true;
  $("#modal-error").hidden = true;
  const data = Object.fromEntries(new FormData(form));
  if (new TextEncoder().encode(data.password).length > 72) {
    formError("密码过长了，UTF-8 编码后不能超过 72 字节。");
    button.disabled = false;
    return;
  }
  try {
    if (form.dataset.mode === "register") {
      data.year = Number(data.year);
      await api("/user/add", { method: "POST", body: data });
      openAuth();
      $("#field-account").value = data.account;
      toast("注册成功！用刚才的账号登录吧。");
      return;
    }
    await api("/user/login", {
      method: "POST",
      body: { account: data.account, password: data.password },
    });
    state.user = await api("/user/me");
    if (!state.user) throw new Error("登录状态没有建立，请稍后重试。");
    renderAccount();
    signalSessionChange();
    $("#modal").close();
    toast(
      state.user.access === "1"
        ? "登录成功！需要管理内容时，点击右上角“进入后台”。"
        : `欢迎回来，${state.user.name || "小伙伴"}！`,
    );
  } catch (error) {
    formError(error.message);
  } finally {
    button.disabled = false;
  }
}
async function likeArticle() {
  if (!state.article) return;
  if (!state.demo && !requireUser()) return;
  const article = state.article,
    id = state.articleId,
    wasLiked = liked(id),
    button = $("#like-article");
  button.disabled = true;
  try {
    if (state.demo) {
      article._liked = !wasLiked;
      article.likeCount = Math.max(
        0,
        (Number(article.likeCount) || 0) + (wasLiked ? -1 : 1),
      );
    } else {
      await api(`/essay/like/${id}`, { method: wasLiked ? "DELETE" : "POST" });
      safeSession(likedKey(id), wasLiked ? "0" : "1");
      article.likeCount = Math.max(
        0,
        (Number(article.likeCount) || 0) + (wasLiked ? -1 : 1),
      );
    }
    button.classList.toggle("liked", !wasLiked);
    $("span", button).textContent =
      `${!wasLiked ? "喜欢过啦" : "喜欢这篇"} · ${article.likeCount}`;
    if (state.demo) toast("收到这份喜欢啦！这是当前页面的演示互动。");
  } catch (error) {
    if (error.status === 409) {
      safeSession(likedKey(id), "1");
      button.classList.add("liked");
      $("span", button).textContent = `喜欢过啦 · ${article.likeCount}`;
    }
    toast(error.message, true);
  } finally {
    button.disabled = false;
  }
}
async function submitComment(form) {
  if (state.demo)
    return toast("这是一篇示例文章。真实文章发布后，就可以评论啦。");
  if (!requireUser()) return;
  const content = form.elements.content.value.trim();
  if (!content) return formError("写一点想说的话吧。", "#comment-error");
  const id = state.articleId,
    button = $('[type="submit"]', form);
  button.disabled = true;
  $("#comment-error").hidden = true;
  try {
    await api(`/comment/add/${id}`, { method: "POST", body: { content } });
    if (state.articleId === id) {
      form.reset();
      state.commentPage = 1;
      await loadComments();
    }
    toast("收到你的小回声啦！");
  } catch (error) {
    formError(error.message, "#comment-error");
  } finally {
    button.disabled = false;
  }
}

function route() {
  const hash = location.hash.slice(1) || "home";
  if (hash === "feed" || hash === "main") return;
  ++state.requestId;
  const previousRoute = state.route;
  state.route = hash.startsWith("article/")
    ? "article"
    : ["home", "categories", "archive", "about"].includes(hash)
      ? hash
      : "home";
  document.title = "嘉丰的小小博客 · 把热爱慢慢收藏";
  document.body.classList.toggle("view-page", state.route !== "home");
  $$(".desktop-nav a").forEach((a) => {
    const active = a.dataset.nav === state.route;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $(".desktop-nav").classList.remove("open");
  $("#menu-button").setAttribute("aria-expanded", "false");
  const detail = ["about", "article"].includes(state.route);
  $(".section-heading").hidden = detail;
  $(".feed-toolbar").hidden = detail;
  $("#pagination").hidden = true;
  $("#search-summary").hidden = true;
  $("#end-note").hidden = detail;
  $("#article-grid").classList.toggle(
    "list-layout",
    state.view === "list" && !detail && state.route !== "archive",
  );
  $("#feed-title").innerHTML =
    `${state.route === "archive" ? "时光里的小脚印" : "最近的小记录"} <span class="heading-sprout" aria-hidden="true">⌁</span>`;
  if (previousRoute !== state.route) state.page = 1;
  renderIntro();
  renderTabs();
  if (state.route === "about") {
    renderAbout();
    $("#article-grid").setAttribute("aria-busy", "false");
  } else if (state.route === "article") {
    openArticle(decodeURIComponent(hash.slice(8)));
  } else loadArticles();
  if (state.route !== "home" || previousRoute !== state.route)
    window.scrollTo({ top: 0, behavior: "instant" });
}
function setCategory(id) {
  state.category = id;
  state.page = 1;
  renderTabs();
  loadArticles();
  $("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
}
function search(keyword) {
  state.keyword = keyword.trim();
  state.page = 1;
  $("#search-input").value = state.keyword;
  if (["home", "categories", "archive"].includes(state.route)) {
    loadArticles();
    $("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    location.hash = "home";
    setTimeout(
      () => $("#feed").scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
  }
}
async function connectRealBlog() {
  const button = $("#retry-connection");
  if (button) button.disabled = true;
  try {
    const [categories, data] = await Promise.all([
      api("/category/get"),
      api("/essay/essays?pageNum=1&pageSize=1"),
    ]);
    state.demo = false;
    state.forcedDemo = false;
    state.categories = categories || [];
    state.globalTotal = Number(data.total) || 0;
    state.page = 1;
    state.category = "";
    state.keyword = "";
    $("#search-input").value = "";
    const url = new URL(location.href);
    url.searchParams.delete("demo");
    url.hash = "home";
    history.replaceState(null, "", url);
    renderNotice();
    route();
    toast("已经回到真实博客啦。");
  } catch (error) {
    toast(error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
}
function showDemo() {
  state.demo = true;
  state.forcedDemo = true;
  state.categories = demoCategories;
  state.page = 1;
  state.category = "";
  state.keyword = "";
  $("#search-input").value = "";
  const url = new URL(location.href);
  url.searchParams.set("demo", "1");
  url.hash = "home";
  history.replaceState(null, "", url);
  renderNotice();
  route();
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!["search-form", "auth-form", "comment-form"].includes(form.id)) return;
  event.preventDefault();
  if (form.id === "search-form") search($("#search-input").value);
  if (form.id === "auth-form") submitAuth(form);
  if (form.id === "comment-form") submitComment(form);
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.category !== undefined)
    return setCategory(button.dataset.category);
  if (button.dataset.page) {
    state.page = Number(button.dataset.page);
    await loadArticles();
    $("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (button.dataset.search) return search(button.dataset.search);
  if (button.dataset.authMode) return openAuth(button.dataset.authMode);
  if (button.dataset.openArticle) {
    location.hash = `article/${button.dataset.openArticle}`;
    return;
  }
  switch (button.id) {
    case "account-button":
      openAccount();
      break;
    case "close-modal":
      $("#modal").close();
      break;
    case "menu-button": {
      const open = $(".desktop-nav").classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      break;
    }
    case "grid-view":
    case "list-view": {
      state.view = button.id === "grid-view" ? "grid" : "list";
      $("#article-grid").classList.toggle(
        "list-layout",
        state.view === "list" && state.route !== "archive",
      );
      $("#grid-view").classList.toggle("active", state.view === "grid");
      $("#list-view").classList.toggle("active", state.view === "list");
      $("#grid-view").setAttribute(
        "aria-pressed",
        String(state.view === "grid"),
      );
      $("#list-view").setAttribute(
        "aria-pressed",
        String(state.view === "list"),
      );
      break;
    }
    case "clear-search":
    case "reset-search":
      search("");
      break;
    case "show-demo":
      showDemo();
      break;
    case "retry-connection":
      connectRealBlog();
      break;
    case "retry-articles":
      loadArticles();
      break;
    case "like-article":
      likeArticle();
      break;
    case "retry-comments":
      loadComments();
      break;
    case "comments-more":
      button.disabled = true;
      state.commentPage++;
      await loadComments(true);
      button.disabled = false;
      break;
    case "share-article":
      try {
        await navigator.clipboard.writeText(location.href);
        toast("文章链接复制好了，分享给小伙伴吧。");
      } catch {
        toast("浏览器暂不允许复制，可以从地址栏复制文章链接。");
      }
      break;
    case "logout-button":
      button.disabled = true;
      try {
        await api("/user/logout", { method: "POST" });
        state.user = null;
        renderAccount();
        signalSessionChange();
        $("#modal").close();
        toast("已经退出啦，下次见！");
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
      }
      break;
  }
});
$("#search-form > span").addEventListener("click", () =>
  $("#search-input").focus(),
);
$("#explore-button").addEventListener("click", (event) => {
  event.preventDefault();
  $("#feed").scrollIntoView({ behavior: "smooth" });
  $("#feed").focus({ preventScroll: true });
});
$("#back-top").addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (
      img instanceof HTMLImageElement &&
      img.dataset.fallback &&
      !img.dataset.failed
    ) {
      img.dataset.failed = "1";
      img.src = img.dataset.fallback;
    }
  },
  true,
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
    !$("#modal").open
  ) {
    event.preventDefault();
    $("#search-input").focus();
  }
});
window.addEventListener("hashchange", route);
$("#modal").addEventListener("click", (event) => {
  if (event.target === $("#modal")) {
    const r = event.target.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      event.target.close();
  }
});

let sessionRefreshPending = false;
async function refreshSession() {
  if (sessionRefreshPending) return;
  sessionRefreshPending = true;
  try {
    state.user = await request("/user/me");
    renderAccount();
  } catch {
  } finally {
    sessionRefreshPending = false;
  }
}

async function init() {
  icons();
  const navigation = new URLSearchParams(location.search);
  const requestedLogin = navigation.get("login") === "1";
  state.adminReturnView = navigation.get("view") || "dashboard";
  const notice = navigation.get("notice");
  const signedOut = navigation.get("signedOut") === "1";
  for (const name of ["login", "next", "view", "notice", "signedOut"])
    navigation.delete(name);
  const remainingQuery = navigation.toString();
  if (requestedLogin || signedOut)
    history.replaceState(
      null,
      "",
      `${location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${location.hash}`,
    );
  $("#copyright-year").textContent = new Date().getFullYear();
  $("#article-grid").innerHTML =
    '<div class="loading-card"></div><div class="loading-card"></div>';
  if (["#main", "#feed"].includes(location.hash))
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#home`,
    );
  const userPromise = api("/user/me")
    .then((user) => {
      state.user = user;
      renderAccount();
    })
    .catch(() => {});
  if (state.demo) state.categories = demoCategories;
  else {
    try {
      const [categories, data] = await Promise.all([
        api("/category/get"),
        api("/essay/essays?pageNum=1&pageSize=1"),
      ]);
      state.categories = categories || [];
      state.globalTotal = Number(data.total) || 0;
    } catch {
      state.demo = true;
      state.categories = demoCategories;
    }
  }
  $("#stat-articles").textContent = state.demo
    ? demoArticles.length
    : state.globalTotal;
  renderNotice();
  route();
  await userPromise;
  watchSession(refreshSession);
  if (requestedLogin && !state.user) {
    openAuth("login");
    $(".auth-welcome", $("#modal")).textContent =
      "游客可以直接浏览前台。管理员登录后，右上角会显示“进入后台”按钮。";
    if (notice === "expired") formError("登录已失效，请重新登录。");
  }
  if (signedOut) toast("已退出登录，回到博客前台啦。");
}
init();
