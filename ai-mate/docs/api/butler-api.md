# 管家模块接口文档（Butler API）

> **模块定位：** 管家是 AI Mate 平台的客户服务管家模块，提供 FAQ 管理、新手引导、用户反馈等功能，确保用户获得优质的使用体验。

## 基本信息

| 项目 | 说明 |
|------|------|
| Base URL | `/api/butler` |
| 认证方式 | Bearer Token |
| 内容类型 | `application/json` |
| 版本 | v1.0 |

## 通用响应结构

所有接口均使用统一的 `ApiResponse` 包装器：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1714000000000
}
```

### 通用错误响应

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null,
  "timestamp": 1714000000000
}
```

### HTTP 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（Token 无效或过期） |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 数据模型

### FAQ（常见问题）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键，自增 | FAQ ID |
| question | TEXT | 非空 | 问题内容 |
| answer | TEXT | 非空 | 回答内容 |
| category | String(100) | 可选 | 分类（如：账户管理、功能使用、计费相关等） |
| keywords | TEXT | 可选 | 关键词，多个关键词用逗号分隔 |
| viewCount | Integer | 默认 0 | 浏览次数 |
| helpfulCount | Integer | 默认 0 | 有帮助次数（用户点击"有帮助"计数） |
| sortOrder | Integer | 默认 0 | 排序权重，值越大越靠前 |
| status | String | 默认 "ACTIVE" | 状态：`ACTIVE`（启用）、`INACTIVE`（停用） |
| createdAt | DateTime | 自动生成 | 创建时间 |
| updatedAt | DateTime | 自动更新 | 更新时间 |

### OnboardingProgress（引导进度）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键，自增 | 记录 ID |
| userId | Long | 非空，唯一 | 用户 ID，每个用户仅一条记录 |
| currentStep | Integer | 默认 0 | 当前步骤编号（0 表示尚未开始） |
| completedSteps | TEXT | 默认 "[]" | 已完成的步骤列表，JSON 数组格式 |
| status | String | 默认 "IN_PROGRESS" | 状态：`IN_PROGRESS`（进行中）、`COMPLETED`（已完成）、`SKIPPED`（已跳过） |
| createdAt | DateTime | 自动生成 | 创建时间 |
| updatedAt | DateTime | 自动更新 | 更新时间 |

### Feedback（用户反馈）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键，自增 | 反馈 ID |
| userId | Long | 非空 | 提交用户 ID |
| type | String(20) | 非空 | 反馈类型（如：BUG、SUGGESTION、COMPLAINT、OTHER） |
| content | TEXT | 非空 | 反馈内容 |
| contact | String(100) | 可选 | 联系方式 |
| status | String | 默认 "PENDING" | 状态：`PENDING`（待处理）、`PROCESSING`（处理中）、`RESOLVED`（已解决）、`CLOSED`（已关闭） |
| reply | TEXT | 可选 | 官方回复内容 |
| createdAt | DateTime | 自动生成 | 创建时间 |
| updatedAt | DateTime | 自动更新 | 更新时间 |

---

## 接口列表

### 1. 获取 FAQ 列表

获取 FAQ 列表，支持按关键词搜索、分类筛选和分页。结果按 `sortOrder` 降序、`viewCount` 降序排列。

- **URL:** `GET /api/butler/faq`
- **认证:** 需要 Bearer Token

#### 请求参数（Query Parameters）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| keyword | String | 否 | 无 | 按关键词搜索，匹配 question、answer 和 keywords 字段 |
| category | String | 否 | 无 | 按分类筛选 |
| page | Integer | 否 | 0 | 页码（从 0 开始） |
| size | Integer | 否 | 10 | 每页数量（最大 50） |

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": 1,
        "question": "如何创建第一条营销文案？",
        "answer": "进入「工匠」模块，点击「创建内容」按钮，选择内容类型为「营销文案」，填写标题、目标平台和受众信息后，即可开始创作。您可以使用 AI 辅助功能快速生成初稿。",
        "category": "功能使用",
        "keywords": "创建,文案,营销,新手",
        "viewCount": 1520,
        "helpfulCount": 890,
        "sortOrder": 100,
        "status": "ACTIVE",
        "createdAt": "2026-03-01T10:00:00",
        "updatedAt": "2026-04-15T09:30:00"
      },
      {
        "id": 2,
        "question": "如何重置密码？",
        "answer": "在登录页面点击「忘记密码」链接，输入注册时使用的邮箱地址，系统将发送密码重置链接到您的邮箱。请在 30 分钟内完成密码重置操作。",
        "category": "账户管理",
        "keywords": "密码,重置,忘记密码,登录",
        "viewCount": 2340,
        "helpfulCount": 1560,
        "sortOrder": 90,
        "status": "ACTIVE",
        "createdAt": "2026-03-01T10:00:00",
        "updatedAt": "2026-04-10T14:00:00"
      },
      {
        "id": 3,
        "question": "AI Mate 的订阅套餐有哪些？",
        "answer": "AI Mate 提供三种套餐：1. 免费版：每月 10 次 AI 生成额度；2. 专业版（¥99/月）：每月 500 次 AI 生成额度，支持团队协作；3. 企业版（定制价格）：无限额度，专属客服支持。",
        "category": "计费相关",
        "keywords": "套餐,价格,订阅,会员",
        "viewCount": 3100,
        "helpfulCount": 2100,
        "sortOrder": 80,
        "status": "ACTIVE",
        "createdAt": "2026-03-05T11:00:00",
        "updatedAt": "2026-04-20T16:00:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 3,
      "totalPages": 1,
      "first": true,
      "last": true
    }
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 401,
  "message": "认证失败，Token 无效或已过期",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "分页参数错误：size 不能超过 50",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 2. 创建 FAQ

创建一条新的 FAQ 记录。通常由管理员操作。

- **URL:** `POST /api/butler/faq`
- **认证:** 需要 Bearer Token（需要管理员权限）

#### 请求体（Request Body）

```json
{
  "question": "如何邀请团队成员加入协作空间？",
  "answer": "进入协作空间详情页，点击「成员管理」按钮，输入被邀请人的邮箱地址或用户名，选择成员角色后发送邀请。被邀请人将在通知中心收到邀请消息，确认后即可加入空间。",
  "category": "功能使用",
  "keywords": "邀请,团队,协作空间,成员",
  "sortOrder": 70
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | String | 是 | 问题内容 |
| answer | String | 是 | 回答内容 |
| category | String(100) | 否 | 分类 |
| keywords | String | 否 | 关键词，多个用逗号分隔 |
| sortOrder | Integer | 否 | 排序权重，默认 0 |

#### 成功响应（201 Created）

```json
{
  "code": 201,
  "message": "FAQ 创建成功",
  "data": {
    "id": 4,
    "question": "如何邀请团队成员加入协作空间？",
    "answer": "进入协作空间详情页，点击「成员管理」按钮，输入被邀请人的邮箱地址或用户名，选择成员角色后发送邀请。被邀请人将在通知中心收到邀请消息，确认后即可加入空间。",
    "category": "功能使用",
    "keywords": "邀请,团队,协作空间,成员",
    "viewCount": 0,
    "helpfulCount": 0,
    "sortOrder": 70,
    "status": "ACTIVE",
    "createdAt": "2026-04-24T10:00:00",
    "updatedAt": "2026-04-24T10:00:00"
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 400,
  "message": "问题内容不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "回答内容不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 403,
  "message": "无权限执行此操作，需要管理员权限",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 3. 获取 FAQ 详情

获取指定 FAQ 的详细信息。

- **URL:** `GET /api/butler/faq/{id}`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | FAQ ID |

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "question": "如何创建第一条营销文案？",
    "answer": "进入「工匠」模块，点击「创建内容」按钮，选择内容类型为「营销文案」，填写标题、目标平台和受众信息后，即可开始创作。您可以使用 AI 辅助功能快速生成初稿。",
    "category": "功能使用",
    "keywords": "创建,文案,营销,新手",
    "viewCount": 1521,
    "helpfulCount": 891,
    "sortOrder": 100,
    "status": "ACTIVE",
    "createdAt": "2026-03-01T10:00:00",
    "updatedAt": "2026-04-15T09:30:00"
  },
  "timestamp": 1714000000000
}
```

> **注意：** 每次查看 FAQ 详情时，`viewCount` 自动 +1。

#### 错误响应

```json
{
  "code": 404,
  "message": "FAQ 不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 4. 更新 FAQ

更新指定 FAQ 的信息。通常由管理员操作。

- **URL:** `PUT /api/butler/faq/{id}`
- **认证:** 需要 Bearer Token（需要管理员权限）

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | FAQ ID |

#### 请求体（Request Body）

```json
{
  "question": "如何创建第一条营销文案？（更新版）",
  "answer": "进入「工匠」模块，点击右上角的「+ 新建」按钮，选择内容类型为「营销文案」。填写标题、目标平台、目标受众和产品信息后，系统将自动生成初稿。您可以在编辑器中对初稿进行修改和优化，满意后点击「保存」即可。",
  "category": "功能使用",
  "keywords": "创建,文案,营销,新手,新建",
  "sortOrder": 100,
  "status": "ACTIVE"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | String | 否 | 问题内容 |
| answer | String | 否 | 回答内容 |
| category | String(100) | 否 | 分类 |
| keywords | String | 否 | 关键词 |
| sortOrder | Integer | 否 | 排序权重 |
| status | String | 否 | 状态：ACTIVE / INACTIVE |

#### 成功响应

```json
{
  "code": 200,
  "message": "FAQ 更新成功",
  "data": {
    "id": 1,
    "question": "如何创建第一条营销文案？（更新版）",
    "answer": "进入「工匠」模块，点击右上角的「+ 新建」按钮，选择内容类型为「营销文案」。填写标题、目标平台、目标受众和产品信息后，系统将自动生成初稿。您可以在编辑器中对初稿进行修改和优化，满意后点击「保存」即可。",
    "category": "功能使用",
    "keywords": "创建,文案,营销,新手,新建",
    "viewCount": 1521,
    "helpfulCount": 891,
    "sortOrder": 100,
    "status": "ACTIVE",
    "createdAt": "2026-03-01T10:00:00",
    "updatedAt": "2026-04-24T11:00:00"
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "FAQ 不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 403,
  "message": "无权限执行此操作，需要管理员权限",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 5. 删除 FAQ

对指定 FAQ 执行软删除操作。

- **URL:** `DELETE /api/butler/faq/{id}`
- **认证:** 需要 Bearer Token（需要管理员权限）

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | FAQ ID |

#### 成功响应

```json
{
  "code": 200,
  "message": "FAQ 已删除",
  "data": null,
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "FAQ 不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 403,
  "message": "无权限执行此操作，需要管理员权限",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 6. 获取引导进度

获取当前用户的新手引导进度。如果用户尚未开始引导，系统会自动创建一条默认记录。

- **URL:** `GET /api/butler/onboarding/status`
- **认证:** 需要 Bearer Token

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "userId": 1001,
    "currentStep": 3,
    "completedSteps": "[1, 2, 3]",
    "status": "IN_PROGRESS",
    "createdAt": "2026-04-20T08:00:00",
    "updatedAt": "2026-04-22T15:30:00"
  },
  "timestamp": 1714000000000
}
```

**字段说明：**
- `currentStep`: 当前应进行的步骤编号（已完成最后一步的值 + 1）
- `completedSteps`: JSON 数组字符串，记录已完成的步骤编号列表
- `status`: 引导状态

#### 错误响应

```json
{
  "code": 401,
  "message": "认证失败，Token 无效或已过期",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 7. 完成引导步骤

标记当前用户完成指定的引导步骤。系统会自动更新 `currentStep` 和 `completedSteps`。

- **URL:** `POST /api/butler/onboarding/step`
- **认证:** 需要 Bearer Token

#### 请求体（Request Body）

```json
{
  "step": 4
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| step | Integer | 是 | 完成的步骤编号（1-6） |

#### 成功响应

```json
{
  "code": 200,
  "message": "引导步骤已完成",
  "data": {
    "id": 1,
    "userId": 1001,
    "currentStep": 4,
    "completedSteps": "[1, 2, 3, 4]",
    "status": "IN_PROGRESS",
    "createdAt": "2026-04-20T08:00:00",
    "updatedAt": "2026-04-24T12:00:00"
  },
  "timestamp": 1714000000000
}
```

> **注意：** 当完成第 6 步（最后一步）时，`status` 自动变更为 `COMPLETED`。

#### 错误响应

```json
{
  "code": 400,
  "message": "步骤编号不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "无效的步骤编号，有效范围为 1-6",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "该步骤已完成，请勿重复提交",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "引导流程已完成或已跳过",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 8. 获取反馈列表

获取当前用户提交的反馈列表，支持分页。

- **URL:** `GET /api/butler/feedback`
- **认证:** 需要 Bearer Token

#### 请求参数（Query Parameters）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | Integer | 否 | 0 | 页码（从 0 开始） |
| size | Integer | 否 | 10 | 每页数量（最大 50） |

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": 1,
        "userId": 1001,
        "type": "BUG",
        "content": "在创建短视频脚本时，如果内容超过 5000 字，保存按钮会变为不可点击状态。",
        "contact": "user@example.com",
        "status": "PROCESSING",
        "reply": "感谢您的反馈！我们已确认该问题，技术团队正在修复中，预计下个版本解决。",
        "createdAt": "2026-04-15T10:00:00",
        "updatedAt": "2026-04-18T14:00:00"
      },
      {
        "id": 2,
        "userId": 1001,
        "type": "SUGGESTION",
        "content": "希望增加内容模板功能，可以保存常用的文案格式，方便快速复用。",
        "contact": null,
        "status": "PENDING",
        "reply": null,
        "createdAt": "2026-04-20T16:00:00",
        "updatedAt": "2026-04-20T16:00:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 2,
      "totalPages": 1,
      "first": true,
      "last": true
    }
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 401,
  "message": "认证失败，Token 无效或已过期",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 9. 提交反馈

提交一条新的用户反馈。

- **URL:** `POST /api/butler/feedback`
- **认证:** 需要 Bearer Token

#### 请求体（Request Body）

```json
{
  "type": "SUGGESTION",
  "content": "建议在协作空间中增加评论功能，方便团队成员对内容进行讨论和评审。",
  "contact": "zhangsan@company.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String(20) | 是 | 反馈类型：`BUG`（Bug 报告）、`SUGGESTION`（功能建议）、`COMPLAINT`（投诉）、`OTHER`（其他） |
| content | String | 是 | 反馈内容 |
| contact | String(100) | 否 | 联系方式（邮箱或手机号） |

#### 成功响应（201 Created）

```json
{
  "code": 201,
  "message": "反馈提交成功",
  "data": {
    "id": 3,
    "userId": 1001,
    "type": "SUGGESTION",
    "content": "建议在协作空间中增加评论功能，方便团队成员对内容进行讨论和评审。",
    "contact": "zhangsan@company.com",
    "status": "PENDING",
    "reply": null,
    "createdAt": "2026-04-24T13:00:00",
    "updatedAt": "2026-04-24T13:00:00"
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 400,
  "message": "反馈类型不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "反馈内容不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "反馈类型不合法，可选值：BUG, SUGGESTION, COMPLAINT, OTHER",
  "data": null,
  "timestamp": 1714000000000
}
```

---

## 附录

### 枚举值汇总

#### FAQ 状态（FAQ.status）

| 值 | 说明 |
|----|------|
| ACTIVE | 启用 |
| INACTIVE | 停用 |

#### 引导状态（OnboardingProgress.status）

| 值 | 说明 |
|----|------|
| IN_PROGRESS | 进行中 |
| COMPLETED | 已完成 |
| SKIPPED | 已跳过 |

#### 反馈类型（Feedback.type）

| 值 | 说明 |
|----|------|
| BUG | Bug 报告 |
| SUGGESTION | 功能建议 |
| COMPLAINT | 投诉 |
| OTHER | 其他 |

#### 反馈状态（Feedback.status）

| 值 | 说明 |
|----|------|
| PENDING | 待处理 |
| PROCESSING | 处理中 |
| RESOLVED | 已解决 |
| CLOSED | 已关闭 |

### 引导步骤定义

| 步骤编号 | 步骤名称 | 说明 |
|----------|----------|------|
| 1 | 欢迎介绍 | 了解 AI Mate 平台的核心功能 |
| 2 | 创建账户 | 完善个人资料和偏好设置 |
| 3 | 首次创作 | 在工匠模块创建第一条内容 |
| 4 | AI 体验 | 体验 AI 辅助创作功能 |
| 5 | 协作空间 | 了解团队协作功能 |
| 6 | 查看帮助 | 了解管家模块的 FAQ 和反馈功能 |
