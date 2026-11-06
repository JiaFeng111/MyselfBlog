# 嘉丰的小小博客

基于现有 Spring Boot 接口制作的蓝、绿、黄卡通风格博客。前端使用原生 HTML、CSS、JavaScript，无需安装 Node.js 或单独启动前端项目。

## 启动和查看

首次从 GitHub 克隆后，需要先创建本地配置文件（已有配置时保留原文件）：

```powershell
Copy-Item src/main/resources/application-example.yml src/main/resources/application.yml
$env:DB_PASSWORD = "你的本机数据库密码"
```

然后在同一个终端运行下方的 Maven 命令。使用 IDEA 启动时，可在 Run Configuration 的环境变量中设置 `DB_PASSWORD`。示例默认连接本机 `blogmessage` 数据库，账号为 `root`；也可以通过 `DB_USERNAME`、`DB_URL`、`BLOG_UPLOAD_DIR` 和 `PORT` 调整配置。

真实的 `application.yml`、上传目录、编译产物和 IDE 配置不进入版本库。GitHub 中保留 `application-example.yml`，不包含你的数据库密码。项目需要已有数据库表，当前仓库中的 `schema-test.sql` 仅用于测试，不能当作完整的生产建表脚本。

1. 确认 MySQL 已启动，数据库连接与 `src/main/resources/application.yml` 保持一致。
2. 在 IDE 中运行 `MyselfBlogApplication`，或在项目根目录执行：

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

3. 正常博客地址：<http://localhost:9191/>。
4. 完整示例界面：<http://localhost:9191/?demo=1>。示例文章只用于预览，不会自动写入数据库；从提示条可返回真实博客。
5. 管理后台：<http://localhost:9191/admin/index.html>。后台复用登录 Session，仅管理员 `access = "1"` 可进入。

正常博客读取 MySQL 中的真实数据。数据库没有文章或分类时显示空状态，不会伪造真实文章。请通过 HTTP 地址查看页面，不要直接双击 `index.html`，否则相对路径和接口请求无法正常工作。

## 已有界面和功能

- 首页、分类页、时光归档、关于我，以及手机端布局。
- 文章搜索、分类筛选、分页、网格和列表视图。
- 文章详情、Markdown 基础排版、阅读次数、点赞与取消点赞、评论分页、复制文章链接。
- 注册、登录、退出，以及刷新后恢复 Session 登录态。
- 管理功能集中在独立后台：新建文章、文章编辑/删除/置顶、草稿保存/续写/发布/删除、封面上传、分类管理、按文章管理公开评论、按 ID 查询用户。

游客无需登录即可浏览前台。普通用户和管理员登录后都留在前台，管理员额外显示顶部“进入后台”按钮，点击后才进入后台。后台顶部的“查看博客”可以直接返回前台，前后台共享 Session，退出状态也会同步。后台编辑已发布文章预留了 `GET /admin/essays/{id}`，需要你自行实现；未接通时会显示待接入提示。完整的现有接口表、新接口返回示例、鉴权规则和后续可选功能见 [后台接口对接清单](docs/backend-admin-contract.md)。这次后台拆分没有修改 Java 代码或数据库角色。

普通用户可以阅读、点赞和评论；写文章、管理草稿和上传图片沿用后端的管理员权限规则，即 `usermessage.access = '1'`。前端不会自动把新注册用户设为管理员。文章分类来自现有分类接口，编辑器也支持“暂不分类”。

封面上传支持 JPG / PNG，不超过 5 MB，图片宽高不超过 5000 像素。正文支持标题、加粗、列表、引用和代码块；原始 HTML 会转义成文字。

## 前端文件怎么找

| 文件 | 作用 | 常见修改场景 |
| --- | --- | --- |
| `src/main/resources/static/index.html` | 页面骨架、导航、首页介绍、侧边栏 | 修改博客名称、欢迎语、公告 |
| `src/main/resources/static/css/style.css` | 配色、布局、卡片、弹窗、响应式样式 | 修改主色、字号和手机端排版 |
| `src/main/resources/static/js/app.js` | 请求接口、页面路由、数据渲染、表单提交 | 对接新接口、修改示例文章、修改“关于我” |
| `src/main/resources/static/js/common.js` | 前后台共用的请求、转义、图标和 Markdown 工具 | 修改统一请求处理或正文排版 |
| `src/main/resources/static/admin/index.html` | 后台页面骨架、侧栏和登录区域 | 修改后台名称和导航 |
| `src/main/resources/static/css/admin.css` | 后台工作台、表格、编辑器和手机布局 | 调整后台样式 |
| `src/main/resources/static/js/admin.js` | 后台全部管理操作，顶部集中定义 API 地址 | 对接后台接口 |
| `src/main/resources/static/assets/` | SVG 手绘素材、头像和本地风景照片 | 替换封面或头像 |

CSS 顶部 `:root` 中集中定义了主色，例如 `--blue`、`--green` 和 `--yellow`。

## 一个请求怎样变成页面

以文章列表为例：

```text
浏览器打开首页
  → app.js 调用 fetch('/essay/essays?pageNum=1&pageSize=4')
  → EssayController 接收分页参数
  → EssayService / Mapper 查询数据库
  → 后端返回 { success, message, data }
  → app.js 用 data.records 渲染文章卡片
```

前端与后端由同一个 Spring Boot 项目提供，使用同源相对地址，无需配置跨域。登录后浏览器自动携带 Session Cookie；前端不保存密码。列表接口补充返回了作者、发布时间、创建时间和置顶状态，方便页面展示；新增的 `GET /user/me` 用来恢复登录态。用户和文章的自增主键采用 `Long`，新对象的 ID 为 `null`，由数据库生成。

## 图片来源

两张风景照片均已保存到本地，打开博客时无需访问图片站点：

- `green-hills.jpg`：[Shibin Joseph / Unsplash](https://unsplash.com/photos/rolling-green-hills-under-a-bright-blue-sky-KvlCSWbsiR0)。
- `quiet-lake.jpg`：[Cătălin Todosia / Pexels](https://www.pexels.com/photo/lush-green-mountain-by-tranquil-lake-36856732/)。

其他插图为项目内的 SVG 矢量素材。

## 验证说明

本次后台拆分已进行 JavaScript 语法检查和浏览器验证，覆盖未登录、普通账号拦截、管理员进入、文章编辑/置顶/删除、草稿保存/发布/删除、封面上传、分类管理、评论管理、用户查询及手机布局。管理写操作在独立模拟接口上测试，不会写入你的 MySQL；这不代表待新增的 `GET /admin/essays/{id}` 已由后端实现。Java 源文件内容在本次拆分前后保持一致。

前端 JavaScript 语法检查和跳过旧测试的 Maven 打包已通过；浏览器检查覆盖首页、搜索、分类、分页、阅读、登录、草稿保存与发布、点赞、评论和手机端布局。隔离的 H2 测试服务用于验证写操作，测试内容不写入现有 MySQL。

原有 `mvn test` 存在测试源码编译问题：部分测试仍用两个参数调用 `getAllEssay(pageNum, pageSize)`，当前方法已需要四个参数（增加 `keyword` 和 `categoryId`）。这次没有改动这些旧测试，也不能把跳过测试的构建当成完整测试通过。
