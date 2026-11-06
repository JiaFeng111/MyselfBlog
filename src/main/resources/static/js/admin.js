/* 仅负责后台界面。API 路径集中定义；需要新增的后端接口见 docs/backend-admin-contract.md。 */
"use strict";
const {
  $,
  $$,
  icon,
  icons,
  esc,
  imageUrl,
  dateText,
  request,
  markdown,
  loginUrl,
  signalSessionChange,
  watchSession,
} = window.BlogUI;

const API = Object.freeze({
  me: "/user/me",
  logout: "/user/logout",
  categories: "/category/get",
  addCategory: "/category/add",
  updateCategory: (id) => `/category/update/${id}`,
  deleteCategory: (id) => `/category/delect/${id}`,
  articles: "/essay/essays",
  addArticle: "/essay/add",
  // 待你新增：管理员查看编辑详情时，不增加文章阅读次数。
  articleForEdit: (id) => `/admin/essays/${id}`,
  updateArticle: (id) => `/essay/update/${id}`,
  deleteArticle: (id) => `/essay/delect/${id}`,
  pinArticle: (id) => `/essay/isTop/${id}`,
  drafts: "/draft/get",
  addDraft: "/draft/add",
  updateDraft: (id) => `/draft/update/${id}`,
  deleteDraft: (id) => `/draft/delect/${id}`,
  publishDraft: (id) => `/draft/ToEssay/${id}`,
  upload: "/upload/image",
  comments: (id) => `/comment/comments/${id}`,
  deleteComment: (id) => `/comment/delect/${id}`,
  user: (id) => `/user/${id}`,
});
const viewNames = {
  dashboard: "工作台",
  articles: "文章管理",
  drafts: "草稿小抽屉",
  categories: "分类管理",
  comments: "评论管理",
  users: "用户查询",
};
const admin = {
  user: null,
  view: "dashboard",
  categories: [],
  articles: [],
  drafts: [],
  comments: [],
  page: 1,
  total: 0,
  pageSize: 8,
  keyword: "",
  category: "",
  commentEssayId: "",
  userId: "",
  loadId: 0,
  editor: null,
  confirmation: null,
};
let toastTimer;
function toast(message, error = false) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  el.classList.toggle("error", error);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4200);
}
function errorBox() {
  return '<div class="form-error" id="modal-error" role="alert" hidden></div>';
}
function formError(message, selector = "#modal-error") {
  const el = $(selector);
  if (el) {
    el.textContent = message;
    el.hidden = false;
  } else toast(message, true);
}
function showModal(title, body, editor = false) {
  const dialog = $("#modal");
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = body;
  dialog.classList.toggle("editor-modal", editor);
  if (!dialog.open) dialog.showModal();
  icons(dialog);
}
function field(label, name, value = "", extra = "") {
  return `<div class="form-field"><label for="admin-field-${name}">${label}</label><input id="admin-field-${name}" name="${name}" value="${esc(value)}" ${extra}></div>`;
}
function validId(value) {
  return /^[1-9]\d*$/.test(String(value));
}
function catName(id) {
  return (
    admin.categories.find((c) => String(c.id) === String(id))?.name || "未分类"
  );
}
function isAdmin() {
  return admin.user?.access === "1";
}
function gate(content) {
  ++admin.loadId;
  $("#admin-layout").hidden = true;
  $("#access-gate").hidden = false;
  $("#access-gate").innerHTML = `<div class="gate-card">${content}</div>`;
  icons($("#access-gate"));
}
function loginGate(message = "") {
  const target = loginUrl(
    location.hash.slice(1) || admin.view,
    Boolean(message),
  );
  gate(
    `<img src="/assets/avatar.svg" alt="" width="86" height="86"><h1>正在前往前台登录…</h1><p>管理员登录后，点击顶部“进入后台”即可管理内容。</p><a class="button form-submit" href="${esc(target)}">前往登录 ${icon("arrow-right")}</a>`,
  );
  location.replace(target);
}
function forbiddenGate() {
  gate(
    `<span class="gate-flower">✿</span><span class="section-kicker">THIS SPACE IS FOR THE BLOG OWNER</span><h1>这间小屋需要管理员钥匙</h1><p>当前账号已登录，管理功能需要服务端授予管理员权限。</p><div class="gate-account">${esc(admin.user?.name || admin.user?.account)} · 普通读者</div><button class="button form-submit" id="switch-account">换一个账号登录 ${icon("arrow-right")}</button><a class="gate-back" href="/">继续逛博客前台</a>`,
  );
}
function connectionGate(message) {
  gate(
    `<img src="/assets/avatar.svg" alt="" width="86" height="86"><h1>管理小屋暂时没连上</h1><p>${esc(message)}</p><button class="button form-submit" id="retry-access">重新连接</button><a class="gate-back" href="/">← 返回博客前台</a>`,
  );
}
function enter() {
  if (!admin.user) return loginGate();
  if (!isAdmin()) return forbiddenGate();
  $("#access-gate").hidden = true;
  $("#admin-layout").hidden = false;
  $("#admin-name").textContent = admin.user.name || admin.user.account;
  route();
}
async function api(path, options) {
  try {
    return await request(path, options);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      $("#modal").close();
      if (error.status === 401) {
        admin.user = null;
        loginGate("登录已失效，请重新登录。");
      } else {
        admin.user = { ...admin.user, access: "0" };
        forbiddenGate();
      }
    }
    throw error;
  }
}
async function init() {
  icons();
  try {
    admin.user = await request(API.me);
    enter();
  } catch (error) {
    connectionGate(error.message);
  }
}
async function logout(loginAgain = false) {
  try {
    await request(API.logout, { method: "POST" });
    admin.user = null;
    admin.editor = null;
    $("#modal").close();
    signalSessionChange();
    location.replace(
      loginAgain
        ? loginUrl(location.hash.slice(1) || admin.view)
        : "/?signedOut=1",
    );
  } catch (error) {
    toast(error.message, true);
  }
}

function heading(title, description, button = "") {
  return `<div class="admin-heading"><div><span class="section-kicker">A LITTLE CARE, EVERY DAY</span><h1>${title}</h1><p>${description}</p></div>${button}</div>`;
}
function newArticleButton() {
  return `<button class="button button-yellow" data-action="new-article">${icon("pen")} 写新文章</button>`;
}
function empty(title, description, action = "") {
  return `<div class="admin-empty"><span>✿</span><h2>${title}</h2><p>${description}</p>${action}</div>`;
}
function loading() {
  return '<div class="admin-loading">正在打开小抽屉…</div>';
}
function pagination() {
  const pages = Math.max(1, Math.ceil(admin.total / admin.pageSize));
  return `<div class="admin-pagination"><span>共 ${admin.total} 条 · 第 ${admin.page} / ${pages} 页</span><div><button data-admin-page="${admin.page - 1}" ${admin.page === 1 ? "disabled" : ""}>← 上一页</button><button data-admin-page="${admin.page + 1}" ${admin.page >= pages ? "disabled" : ""}>下一页 →</button></div></div>`;
}
function articleTable(records, { dashboard = false } = {}) {
  if (!records.length)
    return empty(
      "第一篇故事，等你来写",
      "新建文章并发布后，就会出现在这里和博客前台。",
      newArticleButton(),
    );
  return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>文章</th><th>分类</th><th>发布时间</th><th>阅读 / 喜欢</th><th>操作</th></tr></thead><tbody>${records.map((a) => `<tr><td class="title-cell"><strong>${esc(a.title || "无题文章")}</strong><small>${a.isTop === 1 ? "置顶 · " : ""}ID ${esc(a.id)}</small></td><td><span class="category-label">${esc(catName(a.categoryId))}</span></td><td class="date-cell">${dateText(a.publishTime || a.createTime) || "未记录日期"}</td><td class="number-cell">${Number(a.viewCount) || 0} / ${Number(a.likeCount) || 0}</td><td><div class="admin-row-actions"><a href="/#article/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">查看</a><button data-action="edit-article" data-id="${esc(a.id)}">编辑</button>${dashboard ? "" : `<button data-action="pin-article" data-id="${esc(a.id)}">${a.isTop === 1 ? "取消置顶" : "置顶"}</button><button class="danger" data-action="delete-article" data-id="${esc(a.id)}">删除</button>`}</div></td></tr>`).join("")}</tbody></table></div>`;
}
async function loadCategories() {
  admin.categories = (await api(API.categories)) || [];
  return admin.categories;
}
async function dashboard(loadId) {
  const results = await Promise.allSettled([
    api(`${API.articles}?pageNum=1&pageSize=4`),
    api(API.drafts),
    loadCategories(),
  ]);
  if (loadId !== admin.loadId) return;
  const [articles, drafts, categories] = results.map((r) =>
    r.status === "fulfilled" ? r.value : null,
  );
  admin.articles = articles?.records || [];
  admin.drafts = drafts || [];
  const failed = results.some((r) => r.status === "rejected");
  $("#admin-content").innerHTML =
    heading(
      `你好，${esc(admin.user.name || "博主")} <span aria-hidden="true">☀</span>`,
      "欢迎回到你的管理小屋，今天也记录一点热爱。",
      `<button class="button" data-action="refresh">${icon("refresh")} 刷新</button>`,
    ) +
    `<section class="admin-hero"><div class="admin-hero-copy"><span class="section-kicker">MAKE A LITTLE ROOM FOR YOUR IDEAS</span><h2>把小小博客，<br>打理成喜欢的样子。</h2><p>写下新故事，整理旧灵感，让每一份热爱都有归处。</p><div class="admin-hero-actions">${newArticleButton()}<a class="button" href="#drafts">打开草稿箱 ${icon("arrow-right")}</a></div></div><img src="/assets/little-world.svg" alt="坐在山丘上记录生活的小兔"></section>${failed ? '<div class="admin-inline-message">有部分数据暂时没有读到，下方以“—”显示。请稍后刷新。</div>' : ""}<div class="admin-stats">${[
      { icon: "pen", value: articles?.total, label: "篇已发布文章" },
      { icon: "archive", value: drafts?.length, label: "篇草稿，等待发芽" },
      { icon: "grid", value: categories?.length, label: "个内容分类" },
    ]
      .map(
        (s) =>
          `<div class="admin-stat"><span class="admin-stat-icon">${icon(s.icon)}</span><div><strong>${s.value ?? "—"}</strong><p>${s.label}</p></div></div>`,
      )
      .join(
        "",
      )}</div><div class="admin-dashboard-grid"><section class="admin-panel"><div class="admin-panel-header"><h2>${icon("pen")} 最近发布</h2><a href="#articles">管理全部 →</a></div><div class="admin-mini-list">${articles ? (admin.articles.length ? admin.articles.map((a) => `<div class="admin-mini-row"><img src="${esc(imageUrl(a.coverUrl))}" alt="" data-fallback="/assets/code-notes.svg"><div><h3>${esc(a.title)}</h3><p>${esc(catName(a.categoryId))} · ${dateText(a.publishTime || a.createTime) || "日期未记录"}</p></div><a href="/#article/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">去看看 ↗</a></div>`).join("") : empty("还没有发布的故事", "把今天的小想法写下来吧。")) : empty("文章暂时没有送达", "请检查服务连接后刷新。")}</div></section><section class="admin-panel"><div class="admin-note"><h2>${icon("sun")} 今天的小提醒</h2><ul><li>有灵感时，先存进草稿箱。</li><li>发布之前，记得看看正文预览。</li><li>分好类别，让好文章更容易找到。</li><li>友善回应每一份小小的回声。</li></ul><p>不慌不忙，一点一点生长。 ✿</p></div></section></div>`;
}
async function articlesView(loadId) {
  const query = new URLSearchParams({
    pageNum: admin.page,
    pageSize: admin.pageSize,
  });
  if (admin.keyword) query.set("keyword", admin.keyword);
  if (admin.category) query.set("categoryId", admin.category);
  const [data] = await Promise.all([
    api(`${API.articles}?${query}`),
    loadCategories(),
  ]);
  if (loadId !== admin.loadId) return;
  admin.articles = data.records || [];
  admin.total = Number(data.total) || 0;
  if (admin.page > 1 && !admin.articles.length) {
    admin.page--;
    return renderView();
  }
  $("#admin-content").innerHTML =
    heading(
      "管理每一篇小记录",
      "在这里编辑、置顶或删除已发布的文章。",
      newArticleButton(),
    ) +
    `<section class="admin-panel"><div class="admin-filters"><form id="article-filter-form" class="admin-search"><input type="search" name="keyword" aria-label="搜索文章标题或正文" maxlength="100" placeholder="搜索文章标题或正文…" value="${esc(admin.keyword)}"><select name="categoryId" aria-label="按分类筛选"><option value="">全部分类</option>${admin.categories.map((c) => `<option value="${esc(c.id)}" ${String(c.id) === admin.category ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select><button class="button" type="submit">${icon("search")} 查询</button><button class="admin-text-button" type="button" data-action="clear-filters">重置</button></form><span class="admin-filter-count">${admin.total} 篇已发布</span></div>${articleTable(admin.articles)}${pagination()}</section>`;
}
async function draftsView(loadId) {
  const [drafts] = await Promise.all([api(API.drafts), loadCategories()]);
  if (loadId !== admin.loadId) return;
  admin.drafts = drafts || [];
  $("#admin-content").innerHTML =
    heading(
      "还没写完的，也值得收藏。",
      "继续编辑、发布或整理草稿。草稿不会展示在博客前台。",
      newArticleButton(),
    ) +
    (admin.drafts.length
      ? `<div class="admin-draft-grid">${admin.drafts.map((d) => `<article class="admin-draft"><div class="admin-draft-top"><span class="category-label">${esc(catName(d.categoryId))}</span><span>${dateText(d.updateTime || d.createTime) || "日期未记录"}</span></div><h2>${esc(d.title || "还没取名的小记")}</h2><p>${esc(d.summary || d.essay || "故事正要开始，继续写下去吧。")}</p><div class="admin-row-actions"><button data-action="edit-draft" data-id="${esc(d.id)}">继续写 ${icon("pen")}</button><button data-action="publish-draft" data-id="${esc(d.id)}">发布</button><button class="danger" data-action="delete-draft" data-id="${esc(d.id)}">删除</button></div></article>`).join("")}</div>`
      : `<section class="admin-panel">${empty("小抽屉还是空的", "写下一个想法，保存草稿，留待下次慢慢完成。", newArticleButton())}</section>`);
}
async function categoriesView(loadId) {
  await loadCategories();
  if (loadId !== admin.loadId) return;
  $("#admin-content").innerHTML =
    heading(
      "给每一份热爱，找个位置。",
      "分类名称会同步显示在博客前台。",
      `<button class="button button-yellow" data-action="new-category">${icon("plus")} 新建分类</button>`,
    ) +
    (admin.categories.length
      ? `<div class="admin-category-grid">${admin.categories.map((c, i) => `<article class="admin-category-card"><div class="category-symbol">${["⌨", "☀", "♧"][i % 3]}</div><h2>${esc(c.name)}</h2><p>分类 ID · ${esc(c.id)}</p><div class="admin-row-actions"><button data-action="edit-category" data-id="${esc(c.id)}">重命名</button><button class="danger" data-action="delete-category" data-id="${esc(c.id)}">删除分类</button></div></article>`).join("")}</div>`
      : `<section class="admin-panel">${empty("先给故事分个类吧", "比如技术手记、生活碎片，或者你喜欢的任何名字。", '<button class="button" data-action="new-category">新建第一个分类</button>')}</section>`);
}
async function commentsView(loadId) {
  let data = null;
  let queryError = "";
  if (admin.commentEssayId) {
    try {
      data = await api(
        `${API.comments(admin.commentEssayId)}?pageNum=${admin.page}&pageSize=${admin.pageSize}`,
      );
    } catch (error) {
      if (error.status === 401 || error.status === 403) return;
      queryError = error.message;
    }
  }
  if (loadId !== admin.loadId) return;
  admin.comments = data?.records || [];
  admin.total = Number(data?.total) || 0;
  if (data && admin.page > 1 && !admin.comments.length) {
    admin.page--;
    return renderView();
  }
  $("#admin-content").innerHTML =
    heading(
      "认真回应，每一份小回声。",
      "按文章 ID 查看已公开评论，并处理不合适的留言。",
    ) +
    `<section class="admin-panel"><div class="admin-filters"><form id="comment-filter-form" class="admin-search"><label for="comment-essay-id">文章 ID</label><input id="comment-essay-id" name="essayId" type="number" min="1" step="1" required placeholder="输入要管理的文章 ID" value="${esc(admin.commentEssayId)}"><button class="button" type="submit">${icon("search")} 查看评论</button></form>${data ? `<span class="admin-filter-count">共 ${admin.total} 条公开评论</span>` : ""}</div>${queryError ? empty("这次评论没有送达", esc(queryError)) : data ? (admin.comments.length ? admin.comments.map((c) => `<article class="admin-comment"><div class="admin-comment-top"><strong>用户 #${esc(c.userId)}</strong><span>${dateText(c.createTime) || "日期未记录"}</span><span>评论 #${esc(c.id)}</span><button data-action="delete-comment" data-id="${esc(c.id)}">删除评论</button></div><p>${esc(c.content)}</p></article>`).join("") : empty("这篇文章还没有小回声", "目前没有可显示的公开评论。")) : empty("先选择一篇文章", "文章 ID 可以在文章管理列表中找到。输入后即可查看和删除公开评论。")}${data ? pagination() : ""}</section><p class="admin-capability-note">全站评论列表与待审核评论，需要新增后端接口后再扩展。当前页面只展示现有接口返回的公开评论。</p>`;
}
async function usersView(loadId) {
  let user = null;
  let queryError = "";
  if (admin.userId) {
    try {
      user = await api(API.user(admin.userId));
    } catch (error) {
      if (error.status === 401 || error.status === 403) return;
      queryError = error.message;
    }
  }
  if (loadId !== admin.loadId) return;
  $("#admin-content").innerHTML =
    heading(
      "认识来到这里的小伙伴。",
      "通过用户 ID 查询资料，账号密码不会显示在这里。",
    ) +
    `<section class="admin-panel"><div class="admin-filters"><form id="user-filter-form" class="admin-search"><label for="query-user-id">用户 ID</label><input id="query-user-id" name="userId" type="number" min="1" step="1" required placeholder="输入用户 ID" value="${esc(admin.userId)}"><button class="button" type="submit">${icon("search")} 查询用户</button></form></div>${
      user
        ? `<div class="admin-result-card"><div class="admin-user-profile"><img src="/assets/avatar.svg" alt=""><div><h2>${esc(user.name || "未设置昵称")}</h2><p>${esc(user.account)} · ${user.access === "1" ? "管理员" : "普通读者"}</p></div></div><dl class="admin-user-fields">${[
            ["用户 ID", user.id],
            ["账号", user.account],
            ["角色", user.access === "1" ? "管理员" : "普通读者"],
            ["性别", user.sex],
            ["年龄", user.year],
            ["注册日期", dateText(user.signTime) || "未记录日期"],
          ]
            .map(
              ([k, v]) => `<div><dt>${k}</dt><dd>${esc(v ?? "—")}</dd></div>`,
            )
            .join("")}</dl></div>`
        : queryError
          ? empty("暂时没有找到这位小伙伴", esc(queryError))
          : empty(
              "按 ID 找一位小伙伴",
              "填写用户 ID 后，可以查看该用户的基础资料。",
            )
    }</section><p class="admin-capability-note">用户分页搜索、角色修改等管理功能，需要由你补充后端接口和权限规则。</p>`;
}
async function renderView() {
  if (!isAdmin()) return enter();
  const loadId = ++admin.loadId;
  const content = $("#admin-content");
  content.setAttribute("aria-busy", "true");
  content.innerHTML = loading();
  try {
    await {
      dashboard,
      articles: articlesView,
      drafts: draftsView,
      categories: categoriesView,
      comments: commentsView,
      users: usersView,
    }[admin.view](loadId);
  } catch (error) {
    if (loadId === admin.loadId)
      content.innerHTML =
        heading(viewNames[admin.view], "请求暂时没有完成。") +
        `<section class="admin-panel">${empty("数据暂时没有送达", esc(error.message), '<button class="button" data-action="refresh">重新加载</button>')}</section>`;
  } finally {
    if (loadId === admin.loadId) content.setAttribute("aria-busy", "false");
  }
}
function route() {
  if (!isAdmin()) return;
  const next = location.hash.slice(1) || "dashboard";
  const view = viewNames[next] ? next : "dashboard";
  if (admin.view !== view) admin.page = 1;
  admin.view = view;
  $("#breadcrumb").textContent = viewNames[view];
  document.title = `${viewNames[view]} · 博客管理后台`;
  $$("[data-admin-nav]").forEach((el) => {
    const active = el.dataset.adminNav === view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  renderView();
}

async function openEditor({ kind = "new", record = null } = {}) {
  if (!isAdmin()) return enter();
  try {
    await loadCategories();
  } catch (error) {
    return toast(error.message, true);
  }
  admin.editor = { kind, id: record?.id || null };
  const options = admin.categories
    .map(
      (c) =>
        `<option value="${esc(c.id)}" ${String(record?.categoryId) === String(c.id) ? "selected" : ""}>${esc(c.name)}</option>`,
    )
    .join("");
  showModal(
    kind === "article"
      ? "编辑这篇小记录"
      : kind === "draft"
        ? "继续未完成的小故事"
        : "今天，想记录点什么？",
    `<form id="admin-editor-form">${errorBox()}${field("文章标题", "title", record?.title || "", 'required maxlength="120" placeholder="给这个故事起个名字"')}<div class="form-row"><div class="form-field"><label for="admin-field-categoryId">文章分类</label><select id="admin-field-categoryId" name="categoryId"><option value="">暂不分类</option>${options}</select></div>${field("一句话摘要", "summary", record?.summary || "", 'maxlength="200" placeholder="不超过 200 字"')}</div><div class="form-field"><label for="admin-field-coverUrl">封面图片</label><div class="cover-field-row"><input id="admin-field-coverUrl" name="coverUrl" maxlength="500" value="${esc(record?.coverUrl || "")}" placeholder="填写图片地址，或上传封面"><button type="button" class="upload-button" id="upload-cover">上传封面</button><input type="file" id="cover-file" accept="image/jpeg,image/png" hidden></div><p class="form-hint">支持 JPG / PNG，最大 5 MB，宽高不超过 5000 像素。</p><img id="cover-preview" class="admin-cover-preview" alt="封面预览" ${record?.coverUrl ? `src="${esc(imageUrl(record.coverUrl))}"` : "hidden"}></div><div class="form-field"><div class="editor-label-row"><label for="admin-field-essay">正文</label><button type="button" id="preview-toggle">预览排版</button></div><textarea id="admin-field-essay" class="editor-textarea" name="essay" required placeholder="从一个小想法开始…支持标题、加粗、列表、引用和代码块。">${esc(record?.essay || "")}</textarea><div id="editor-preview" class="prose editor-preview" hidden></div></div><p class="form-hint">${kind === "article" ? "保存后会更新已发布的文章。" : "还没写完也可以先保存草稿，发布时标题和正文都要有内容。"}</p><div class="editor-actions">${kind === "article" ? '<button class="button button-dark" type="submit" name="action" value="update">保存修改</button>' : '<button class="button" type="submit" name="action" value="draft" formnovalidate>保存草稿</button><button class="button button-dark" type="submit" name="action" value="publish">发布小记录 →</button>'}</div></form>`,
    true,
  );
}
async function editArticle(id) {
  showModal(
    "正在打开文章…",
    '<p class="admin-dialog-description">正在读取可编辑的文章内容。</p>',
  );
  try {
    const article = await api(API.articleForEdit(id));
    if (
      !article ||
      String(article.id) !== String(id) ||
      typeof article.essay !== "string"
    )
      throw new Error(
        "后台详情接口缺少文章 ID 或正文，请按接口清单补全返回数据。",
      );
    if (!$("#modal").open) return;
    await openEditor({ kind: "article", record: article });
  } catch (error) {
    if (!isAdmin()) return;
    if (error.status === 404 || error.status === 405) {
      $("#modal-title").textContent = "编辑详情接口待接入";
      $("#modal-body").innerHTML =
        `<p class="admin-dialog-description">编辑器已经准备好。请先实现 <code>GET /admin/essays/{id}</code>，返回包含正文的文章详情，并保持阅读次数不变。</p><div class="admin-inline-message">接口参数、返回示例和实现步骤，已写入项目中的 docs/backend-admin-contract.md。</div><button class="button" data-action="close-modal">知道了，稍后接入</button>`;
    } else {
      $("#modal-body").innerHTML =
        `<p class="form-error">${esc(error.message)}</p>`;
    }
  }
}
async function saveEditor(event, form) {
  const action = event.submitter?.value || "draft";
  if (action !== "draft" && !form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form));
  payload.categoryId = payload.categoryId ? Number(payload.categoryId) : null;
  if (action !== "draft" && (!payload.title.trim() || !payload.essay.trim()))
    return formError("标题和正文都要写一点内容哦。");
  const editor = admin.editor;
  if (!editor) return;
  const buttons = $$("button[type=submit]", form);
  buttons.forEach((b) => (b.disabled = true));
  $("#modal-error").hidden = true;
  try {
    if (editor.kind === "article")
      await api(API.updateArticle(editor.id), {
        method: "POST",
        body: payload,
      });
    else if (editor.id) {
      await api(API.updateDraft(editor.id), { method: "PUT", body: payload });
      if (action === "publish")
        await api(API.publishDraft(editor.id), { method: "POST" });
    } else if (action === "draft") {
      const id = await api(API.addDraft, { method: "POST", body: payload });
      if (!validId(id))
        throw new Error("草稿接口需要返回新建草稿的正整数 ID。");
      editor.id = id;
      editor.kind = "draft";
    } else await api(API.addArticle, { method: "POST", body: payload });
    if (action === "draft") {
      toast("草稿已保存，慢慢写就好。");
    } else {
      $("#modal").close();
      admin.editor = null;
      if (editor.kind !== "article" && admin.view === "articles")
        admin.page = 1;
      toast(
        editor.kind === "article" ? "文章修改已保存。" : "新的小记录发布成功！",
      );
    }
    renderView();
  } catch (error) {
    formError(error.message);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}
function openCategory(id = null) {
  const category = id
    ? admin.categories.find((c) => String(c.id) === String(id))
    : null;
  showModal(
    category ? "给分类换个名字" : "新建一个小分类",
    `<form id="category-form" data-id="${esc(id || "")}">${errorBox()}${field("分类名称", "name", category?.name || "", 'required maxlength="50" placeholder="例如：技术手记"')}<div class="editor-actions"><button class="button button-dark" type="submit">${category ? "保存名称" : "创建分类"}</button></div></form>`,
  );
}
async function saveCategory(form) {
  const name = form.elements.name.value.trim();
  if (!name) return formError("分类名称不能为空白。");
  const button = $("[type=submit]", form);
  button.disabled = true;
  try {
    await api(
      form.dataset.id ? API.updateCategory(form.dataset.id) : API.addCategory,
      { method: "POST", body: { name } },
    );
    $("#modal").close();
    toast("分类已经整理好了。");
    renderView();
  } catch (error) {
    formError(error.message);
  } finally {
    button.disabled = false;
  }
}
function confirmAction({
  title,
  subject,
  description,
  path,
  body,
  method = "POST",
  label = "确认删除",
}) {
  admin.confirmation = { path, body, method };
  showModal(
    title,
    `${errorBox()}<p class="admin-dialog-description">${description}</p><div class="admin-confirm-title">${esc(subject)}</div><div class="admin-modal-actions"><button class="button" data-action="close-modal">先保留</button><button class="button danger" data-action="confirm-mutation">${label}</button></div>`,
  );
}
async function confirmMutation(button) {
  const operation = admin.confirmation;
  if (!operation) return;
  button.disabled = true;
  try {
    await api(operation.path, {
      method: operation.method,
      body: operation.body,
    });
    admin.confirmation = null;
    $("#modal").close();
    toast("操作完成，小屋整理好了。");
    renderView();
  } catch (error) {
    formError(error.message);
  } finally {
    button.disabled = false;
  }
}
async function uploadCover(file) {
  if (!file) return;
  if (!["image/jpeg", "image/png"].includes(file.type))
    return formError("请选择 JPG 或 PNG 图片。");
  if (file.size > 5 * 1024 * 1024) return formError("图片不能超过 5 MB。");
  const button = $("#upload-cover");
  button.disabled = true;
  button.textContent = "上传中…";
  try {
    const data = new FormData();
    data.append("file", file);
    const url = await api(API.upload, { method: "POST", body: data });
    if (!url || typeof url !== "string")
      throw new Error("图片接口需要返回可访问的图片地址。");
    if (!$("#admin-field-coverUrl")) return;
    $("#admin-field-coverUrl").value = url;
    updateCoverPreview();
    toast("封面上传好了。");
  } catch (error) {
    formError(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "上传封面";
  }
}
function updateCoverPreview() {
  const input = $("#admin-field-coverUrl"),
    preview = $("#cover-preview");
  if (!input || !preview) return;
  preview.hidden = !input.value.trim();
  if (!preview.hidden) {
    preview.src = imageUrl(input.value.trim());
    delete preview.dataset.failed;
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (
    ![
      "admin-editor-form",
      "category-form",
      "article-filter-form",
      "comment-filter-form",
      "user-filter-form",
    ].includes(form.id)
  )
    return;
  event.preventDefault();
  if (!isAdmin()) return enter();
  if (form.id === "admin-editor-form") return saveEditor(event, form);
  if (form.id === "category-form") return saveCategory(form);
  if (form.id === "article-filter-form") {
    admin.keyword = form.elements.keyword.value.trim();
    admin.category = form.elements.categoryId.value;
    admin.page = 1;
    return renderView();
  }
  if (form.id === "comment-filter-form") {
    if (!validId(form.elements.essayId.value))
      return toast("文章 ID 必须是正整数。", true);
    admin.commentEssayId = form.elements.essayId.value;
    admin.page = 1;
    return renderView();
  }
  if (form.id === "user-filter-form") {
    if (!validId(form.elements.userId.value))
      return toast("用户 ID 必须是正整数。", true);
    admin.userId = form.elements.userId.value;
    return renderView();
  }
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.id === "retry-access") return init();
  if (button.id === "admin-logout" || button.id === "switch-account")
    return logout(button.id === "switch-account");
  if (button.id === "close-modal" || button.dataset.action === "close-modal")
    return $("#modal").close();
  if (!isAdmin()) return;
  if (button.dataset.adminPage) {
    admin.page = Number(button.dataset.adminPage);
    return renderView();
  }
  if (button.id === "upload-cover") return $("#cover-file").click();
  if (button.id === "preview-toggle") {
    const textarea = $("#admin-field-essay"),
      preview = $("#editor-preview");
    preview.hidden = !preview.hidden;
    textarea.hidden = !preview.hidden;
    textarea.required = preview.hidden;
    preview.innerHTML =
      markdown(textarea.value) ||
      '<p class="form-hint">写点文字后，排版就会出现在这里。</p>';
    button.textContent = preview.hidden ? "预览排版" : "继续编辑";
    return;
  }
  const action = button.dataset.action,
    id = button.dataset.id;
  switch (action) {
    case "refresh":
      return renderView();
    case "clear-filters":
      admin.keyword = "";
      admin.category = "";
      admin.page = 1;
      return renderView();
    case "new-article":
      return openEditor();
    case "edit-article":
      return editArticle(id);
    case "edit-draft":
      return openEditor({
        kind: "draft",
        record: admin.drafts.find((d) => String(d.id) === id),
      });
    case "new-category":
      return openCategory();
    case "edit-category":
      return openCategory(id);
    case "confirm-mutation":
      return confirmMutation(button);
    case "pin-article": {
      const article = admin.articles.find((a) => String(a.id) === id);
      if (!article) return;
      button.disabled = true;
      try {
        await api(API.pinArticle(id), {
          method: "POST",
          body: { isTop: article.isTop === 1 ? 0 : 1 },
        });
        toast(article.isTop === 1 ? "文章已取消置顶。" : "文章已经置顶啦。");
        renderView();
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
      }
      return;
    }
    case "delete-article": {
      const article = admin.articles.find((a) => String(a.id) === id);
      if (!article) return;
      return confirmAction({
        title: "删除这篇文章？",
        subject: article.title,
        description:
          "删除后，文章会从博客前台移除。当前接口没有回收站，请确认这篇记录已经不再需要。",
        path: API.deleteArticle(id),
      });
    }
    case "delete-draft": {
      const draft = admin.drafts.find((d) => String(d.id) === id);
      if (!draft) return;
      return confirmAction({
        title: "删除这份草稿？",
        subject: draft.title || "未命名草稿",
        description: "当前接口没有草稿回收站，确认后会删除这份未发布的记录。",
        path: API.deleteDraft(id),
      });
    }
    case "publish-draft": {
      const draft = admin.drafts.find((d) => String(d.id) === id);
      if (!draft) return;
      if (!draft.title?.trim() || !draft.essay?.trim())
        return toast("先补上标题和正文，再来发布吧。", true);
      return confirmAction({
        title: "把这份草稿发布出去？",
        subject: draft.title,
        description: "发布后，所有访客都能在博客前台读到这篇小记录。",
        path: API.publishDraft(id),
        label: "确认发布",
      });
    }
    case "delete-category": {
      const category = admin.categories.find((c) => String(c.id) === id);
      if (!category) return;
      return confirmAction({
        title: "删除这个分类？",
        subject: category.name,
        description:
          "该分类下有文章或草稿时，后端会拒绝删除。请先调整相关文章的分类。",
        path: API.deleteCategory(id),
      });
    }
    case "delete-comment": {
      const comment = admin.comments.find((c) => String(c.id) === id);
      if (!comment) return;
      return confirmAction({
        title: "删除这条评论？",
        subject: comment.content,
        description: "删除后，评论将不再显示在文章下方。",
        path: API.deleteComment(id),
      });
    }
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "cover-file") uploadCover(event.target.files[0]);
  if (event.target.id === "admin-field-coverUrl") updateCoverPreview();
});
document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (
      image instanceof HTMLImageElement &&
      image.dataset.fallback &&
      !image.dataset.failed
    ) {
      image.dataset.failed = "1";
      image.src = image.dataset.fallback;
    }
    if (image.id === "cover-preview") image.hidden = true;
  },
  true,
);
window.addEventListener("hashchange", route);
let sessionRefreshPending = false;
watchSession(async () => {
  if (sessionRefreshPending) return;
  sessionRefreshPending = true;
  try {
    const user = await request(API.me);
    const changed =
      user?.id !== admin.user?.id || user?.access !== admin.user?.access;
    admin.user = user;
    if (changed) {
      $("#modal").close();
      enter();
    } else if (user) $("#admin-name").textContent = user.name || user.account;
  } catch {
  } finally {
    sessionRefreshPending = false;
  }
});
init();
