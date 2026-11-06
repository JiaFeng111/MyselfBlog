# 后台接口对接清单（后端由你实现）

这次修改的是前端页面、样式和 JavaScript，未修改 Java、MySQL 数据或用户角色。已有接口继续复用。需要你新增的接口和以后可以扩展的功能分别列在下面，避免把“已有接口”重复实现一遍。

## 1. 页面地址和职责

| 地址 | 页面 | 功能 |
| --- | --- | --- |
| `/` | 博客前台 | 阅读、搜索、分类浏览、注册登录、点赞、评论 |
| `/admin/index.html` | 博客后台 | 工作台、文章管理、草稿管理、分类管理、按文章管理公开评论、按 ID 查询用户 |

游客无需登录即可浏览前台。普通用户与管理员登录后都停留在前台；管理员会额外看到顶部的“进入后台”按钮，点击后才进入后台。管理入口只对管理员显示。后台顶部提供“查看博客”，切换到前台时保留登录状态。

后台没有演示登录和本地管理员开关。它会请求 `GET /user/me`：

- `data = null`：跳转前台的统一登录弹窗，管理员登录后通过“进入后台”按钮进入原来的后台目标页。
- `data.access = "0"` 或其他非 `"1"` 值：显示普通账号无权限提示。
- `data.access = "1"`：加载管理界面。

这些是界面展示规则。真正的权限控制仍需要后端对每一个管理接口进行校验。

登录不会强制跳页，原本正在阅读的文章会保留。前后台共用 `/user/login`、`/user/me` 和 `/user/logout`，不需要新增另一套登录接口。后台退出会返回前台；多标签页通过同源通知及服务端身份重查同步登录状态，前端只保存变更通知，不保存密码或登录凭据。

## 2. 当前必须新增：后台文章编辑详情

**接口：`GET /admin/essays/{id}`**

用途：管理员点击文章管理中的“编辑”按钮时，读取标题、正文、摘要、分类和封面。前端已按这个地址写好调用，接口实现后即可继续打开编辑器。

为什么单独增加：当前 `GET /essay/{id}` 面向读者，调用时会执行 `viewCount + 1`。后台查看编辑内容时不应该增加阅读次数，所以不能直接复用这段带计数的读取逻辑。

| 项目 | 约定 |
| --- | --- |
| 请求方式 | GET |
| 路径参数 | `id`，正整数，表示已发布文章 ID |
| 请求体 | 无 |
| 登录方式 | 沿用 Session 中的 `loginUserId` |
| 权限 | 管理员，`access = "1"` |
| 副作用 | 不更新文章、不增加阅读次数 |

成功响应示例：

```json
{
  "success": true,
  "message": "文章编辑详情查询成功",
  "data": {
    "id": 12,
    "title": "我的 Spring Boot 学习笔记",
    "essay": "# 今天学到了什么\n\n这里是完整正文。",
    "summary": "记录今天学到的知识。",
    "categoryId": 3,
    "coverUrl": "/images/example.jpg",
    "status": 1,
    "isTop": 0,
    "author": "嘉丰",
    "publishTime": "2026-11-06T15:00:00",
    "createTime": "2026-11-06T14:30:00",
    "updateTime": "2026-11-06T15:00:00",
    "viewCount": 18,
    "likeCount": 2
  }
}
```

`id`、`title`、`essay`、`summary`、`categoryId`、`coverUrl` 是编辑器需要的字段。`essay` 必须返回完整正文字符串，不能只有摘要。未填写分类、摘要或封面时，相关值可以为 `null`。

错误响应沿用 `Result`，并使用对应的 HTTP 状态码：

| 情况 | HTTP 状态码 | 建议 message |
| --- | --- | --- |
| ID 不合法 | 400 | 文章 ID 必须为正整数 |
| 未登录、Session 中的用户已不存在 | 401 | 请先登录 |
| 普通用户 | 403 | 只有管理员可以读取文章编辑详情 |
| 文章不存在，或者不是已发布状态 | 404 | 已发布文章不存在 |

未实现这个接口时，前端会显示“编辑详情接口待接入”，不会调用读者详情接口来代替，也不会用列表中的空正文覆盖文章。

建议按已有分层自己完成：

1. 新增后台 Controller，映射 `/admin/essays`。
2. 从 Session 获取 `loginUserId`，根据 ID 查询当前用户并校验管理员角色。
3. 新增 Service 的“查询编辑详情”方法，校验文章 ID。
4. 用 Mapper 查询文章，校验存在且 `status = 1`。
5. 返回详情数据。这里不要执行增加阅读数的 SQL，也不要调用当前带阅读计数的 `getEssay` 方法。

推荐验证场景：匿名访问返回 401；普通用户返回 403；管理员读取存在文章返回 200；不存在文章返回 404；同一文章连续读取两次，数据库中的 `view_count` 保持原值。

## 3. 后台已经对接的现有接口（不用重复开发）

前端接口地址统一集中在 `src/main/resources/static/js/admin.js` 顶部的 `API` 对象。以下保留你现有的接口命名，包括 `delect` 和 `ToEssay` 的写法。

### 身份与登录

| 功能 | 方法和地址 | 请求 / 返回 |
| --- | --- | --- |
| 获取当前用户 | `GET /user/me` | `data` 为当前用户，未登录时为 `null`；需要返回 `id/name/account/access` |
| 登录 | `POST /user/login` | JSON：`account`、`password`；成功后由服务端建立 Session |
| 退出 | `POST /user/logout` | 使当前 Session 失效 |

前后台处于同一个站点，共享 Session；不需要重新设计一套后台密码，也不需要让前端保存密码或传入角色来证明权限。

### 文章与封面

| 功能 | 方法和地址 | 请求 / 返回 |
| --- | --- | --- |
| 查询已发布文章 | `GET /essay/essays` | 查询参数：`pageNum/pageSize/keyword/categoryId`；返回分页对象 |
| 新建并发布文章 | `POST /essay/add` | JSON：`title/essay/summary/categoryId/coverUrl` |
| 保存已发布文章修改 | `POST /essay/update/{id}` | 同上；只接受允许修改的内容字段 |
| 置顶 / 取消置顶 | `POST /essay/isTop/{id}` | JSON：`{"isTop":1}` 或 `{"isTop":0}` |
| 删除文章 | `POST /essay/delect/{id}` | 路径参数为文章 ID |
| 上传封面 | `POST /upload/image` | `multipart/form-data`，字段名 `file`；`data` 返回图片地址字符串 |

文章列表需要返回 `id/title/summary/categoryId/coverUrl/isTop/publishTime/createTime/viewCount/likeCount`，已发布文章分页固定按现有接口的顺序展示。工作台的文章数取 `data.total`，不是把当前页数组长度当成总数。

内容表单沿用当前限制：标题最多 120 字，摘要最多 200 字，封面地址最多 500 字；发布时标题、正文不能为空白；分类可以为 `null`。图片支持 JPG/PNG，最多 5 MB，宽高不超过 5000 像素，后端仍要独立检查实际图片内容。

### 草稿

| 功能 | 方法和地址 | 请求 / 返回 |
| --- | --- | --- |
| 查询全部草稿 | `GET /draft/get` | `data` 为数组，需要包含正文 |
| 新建草稿 | `POST /draft/add` | 与文章表单相同；`data` 必须返回新草稿的正整数 ID |
| 保存现有草稿 | `PUT /draft/update/{id}` | 与文章表单相同 |
| 发布草稿 | `POST /draft/ToEssay/{id}` | 改变状态并设置发布时间 |
| 删除草稿 | `POST /draft/delect/{id}` | 只删除对应草稿 |

前端允许先保存空标题、空正文的草稿；发布时才要求完整内容。第一次保存后使用返回的 ID 更新原草稿，后续点“保存草稿”不会反复新建。

### 分类

| 功能 | 方法和地址 | 请求 / 返回 |
| --- | --- | --- |
| 查询分类 | `GET /category/get` | `data` 为 `[{"id":1,"name":"技术手记"}]` |
| 新建分类 | `POST /category/add` | JSON：`{"name":"技术手记"}` |
| 重命名分类 | `POST /category/update/{id}` | JSON：`{"name":"新的分类名"}` |
| 删除分类 | `POST /category/delect/{id}` | 被文章或草稿引用时应返回 409 |

分类名称最多 50 字，不能为空白，重名时返回 409。后台编辑成功后，前台重新查询分类就能看到变更。

### 评论与用户

| 功能 | 方法和地址 | 当前范围 |
| --- | --- | --- |
| 查看一篇文章的公开评论 | `GET /comment/comments/{essayId}` | 查询参数：`pageNum/pageSize`，当前只返回公开评论 |
| 删除评论 | `POST /comment/delect/{commentId}` | 后台管理员可删除；原接口允许作者删除自己的评论，这条规则可以保留 |
| 按 ID 查询用户资料 | `GET /user/{id}` | 仅管理员；返回基础资料，不返回明文密码或密码哈希 |

后台评论页目前需要输入文章 ID；用户页目前需要输入用户 ID。没有接入不存在的全站列表，也没有提供未经后端支持的修改角色按钮。

## 4. 你需要保留 / 检查的服务端规则

这些规则多数已有实现，迁移前端入口不意味着要重写它们：

- 每个管理请求都根据服务端 Session 和数据库中的用户角色鉴权。不要相信请求体中的 `access`、`userId` 或前端页面显示状态。
- 普通注册接口创建普通用户。初始化管理员账号由你在后端 / 数据库管理流程中完成，前端不会自动给当前账号提权。
- `access` 当前是字符串：管理员 `"1"`，普通读者 `"0"`。`GET /user/me` 返回类型应保持一致。
- 返回用户资料时隐藏 `passwordHash`，保持当前的 `@JsonIgnore` 或使用不包含密码字段的响应 DTO。
- `User.signTime`、`User.updateTime` 对应数据库的 `sign_time`、`update_time`。前一轮已修正的映射需要保留。
- 对外只返回统一业务错误，不把 SQL、堆栈和数据库密码放进响应。HTTP 状态码要正确，否则前端不能区分登录失效、权限不足和参数错误。
- 当前删除接口没有回收站。前端已增加二次确认；若以后增加回收站，需要你先补充软删除和恢复规则。

统一分页响应示例：

```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "records": [],
    "total": 0,
    "current": 1,
    "size": 8,
    "pages": 0
  }
}
```

统一错误响应示例（HTTP 403）：

```json
{
  "success": false,
  "message": "只有管理员可以执行此操作",
  "data": null
}
```

## 5. 以后想扩展时，再增加的接口（本次后台不依赖）

| 可选功能 | 可考虑的接口 | 参数 / 返回建议 |
| --- | --- | --- |
| 全站评论与审核 | `GET /admin/comments` | `pageNum/pageSize/essayId/status/keyword`；返回分页评论，包括文章标题、用户昵称、状态、创建时间 |
| 评论审核 | `PATCH /admin/comments/{id}/status` | JSON：`status`；明确哪些状态公开，哪些状态只允许后台查看 |
| 用户分页搜索 | `GET /admin/users` | `pageNum/pageSize/keyword/access`；返回不含密码的用户资料分页 |
| 用户角色修改 | `PATCH /admin/users/{id}/access` | JSON：`access`；需要你定义谁可以授权、能否修改自己、如何防止最后一个管理员被撤销 |
| 全站阅读 / 点赞 / 评论总数 | `GET /admin/statistics` | 返回实际汇总值；不要用一页文章的合计冒充全站统计 |
| 草稿很多时分页 | `GET /admin/drafts` | `pageNum/pageSize/keyword/categoryId`；现有 `/draft/get` 是完整数组 |

这些只是后续接口设计建议，前端没有假装它们已经实现。先完成第 2 节的后台文章详情接口，就能补齐当前“编辑已发布文章”的流程。
