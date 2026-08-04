# 军师模块接口文档（Sage API）

> **模块名称：** 军师（Sage）
> **模块定位：** 运营策略顾问
> **基础路径：** `/api/sage`
> **认证方式：** Bearer Token（通过 `Authorization` 请求头传递）
> **协议：** HTTPS
> **数据格式：** JSON

---

## 目录

- [1. 通用说明](#1-通用说明)
  - [1.1 认证方式](#11-认证方式)
  - [1.2 统一响应格式](#12-统一响应格式)
  - [1.3 通用错误码](#13-通用错误码)
  - [1.4 数据模型](#14-数据模型)
- [2. 接口列表](#2-接口列表)
  - [2.1 GET /documents - 策略文档列表](#21-get-documents---策略文档列表)
  - [2.2 POST /documents - 创建策略文档](#22-post-documents---创建策略文档)
  - [2.3 GET /documents/{id} - 文档详情（含章节）](#23-get-documentsid---文档详情含章节)
  - [2.4 PUT /documents/{id} - 更新文档](#24-put-documentsid---更新文档)
  - [2.5 DELETE /documents/{id} - 删除文档](#25-delete-documentsid---删除文档)
  - [2.6 POST /documents/{id}/generate - AI 生成章节](#26-post-documentsidgenerate---ai-生成章节)
  - [2.7 POST /documents/{id}/review - AI 审阅文档](#27-post-documentsidreview---ai-审阅文档)
  - [2.8 POST /analyze - 提交数据分析任务](#28-post-analyze---提交数据分析任务)
  - [2.9 GET /analyze/{taskId} - 获取分析结果](#29-get-analyzetaskid---获取分析结果)

---

## 1. 通用说明

### 1.1 认证方式

所有接口均需在请求头中携带 Bearer Token 进行身份认证：

```
Authorization: Bearer <token>
```

未携带或携带无效 Token 时，接口将返回 `401 Unauthorized`。

### 1.2 统一响应格式

所有接口均使用 `ApiResponse` 统一包装格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 业务状态码，`200` 表示成功 |
| message | String | 状态描述信息 |
| data | Object | 业务数据，失败时为 `null` |

### 1.3 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| 200 | 200 | 操作成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证或 Token 已过期 |
| 403 | 403 | 无权限访问该资源 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源状态冲突（如文档正在生成中） |
| 500 | 500 | 服务器内部错误 |

### 1.4 数据模型

#### StrategyDocument（策略文档）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否（创建时自动生成） | 文档唯一标识 |
| userId | Long | 否（自动取当前用户） | 所属用户 ID |
| title | String(200) | 是 | 文档标题，最大 200 字符 |
| type | String(Enum) | 是 | 文档类型：`STRATEGY`（运营策略）、`MARKETING`（营销方案）、`GROWTH`（增长策略）、`BENCHMARK`（行业对标） |
| templateId | Long | 否 | 关联模板 ID |
| content | Text | 否 | 文档完整内容（富文本） |
| status | String(Enum) | 否（默认 `DRAFT`） | 文档状态：`DRAFT`（草稿）、`GENERATING`（生成中）、`COMPLETED`（已完成） |
| version | Integer | 否（默认 1） | 文档版本号 |
| createdAt | DateTime | 否（自动生成） | 创建时间 |
| updatedAt | DateTime | 否（自动更新） | 更新时间 |

#### DocumentSection（文档章节）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否（自动生成） | 章节唯一标识 |
| documentId | Long | 是 | 所属文档 ID |
| sectionKey | String(100) | 是 | 章节标识键，最大 100 字符 |
| title | String(200) | 是 | 章节标题，最大 200 字符 |
| content | Text | 否 | 章节内容（富文本） |
| aiGenerated | Boolean | 否（默认 false） | 是否由 AI 生成 |
| orderNum | Integer | 否（默认 0） | 章节排序号 |
| status | String(Enum) | 否（默认 `DRAFT`） | 章节状态：`DRAFT`（草稿）、`GENERATING`（生成中）、`EDITED`（已编辑） |
| createdAt | DateTime | 否（自动生成） | 创建时间 |
| updatedAt | DateTime | 否（自动更新） | 更新时间 |

#### DataAnalysisTask（数据分析任务）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否（自动生成） | 任务唯一标识 |
| userId | Long | 否（自动取当前用户） | 所属用户 ID |
| title | String(200) | 是 | 分析任务标题，最大 200 字符 |
| filePath | String(500) | 否 | 数据文件路径，最大 500 字符 |
| status | String(Enum) | 否（默认 `PENDING`） | 任务状态：`PENDING`（待处理）、`PROCESSING`（处理中）、`COMPLETED`（已完成）、`FAILED`（失败） |
| result | Text | 否 | 分析结果（JSON 格式） |
| errorMessage | String(500) | 否 | 错误信息 |
| createdAt | DateTime | 否（自动生成） | 创建时间 |
| updatedAt | DateTime | 否（自动更新） | 更新时间 |

---

## 2. 接口列表

### 2.1 GET /documents - 策略文档列表

获取当前用户的策略文档分页列表，支持按文档类型筛选。

**请求**

- **方法：** `GET`
- **路径：** `/api/sage/documents`

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | String | 否 | 无 | 按文档类型筛选，可选值：`STRATEGY`、`MARKETING`、`GROWTH`、`BENCHMARK` |
| page | Integer | 否 | 0 | 页码，从 0 开始 |
| size | Integer | 否 | 10 | 每页条数，最大 100 |

**请求示例**

```
GET /api/sage/documents?type=STRATEGY&page=0&size=10
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**成功响应**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": 1001,
        "userId": 100,
        "title": "2026年Q2运营策略方案",
        "type": "STRATEGY",
        "templateId": null,
        "content": null,
        "status": "COMPLETED",
        "version": 2,
        "createdAt": "2026-04-20T10:30:00+08:00",
        "updatedAt": "2026-04-22T15:45:00+08:00"
      },
      {
        "id": 1002,
        "userId": 100,
        "title": "618大促营销方案",
        "type": "MARKETING",
        "templateId": 501,
        "content": null,
        "status": "DRAFT",
        "version": 1,
        "createdAt": "2026-04-23T09:00:00+08:00",
        "updatedAt": "2026-04-23T09:00:00+08:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3,
    "last": false
  }
}
```

**错误响应**

```json
// 参数错误
{
  "code": 400,
  "message": "参数错误：page 不能为负数",
  "data": null
}

// 未认证
{
  "code": 401,
  "message": "未认证或 Token 已过期",
  "data": null
}
```

**备注**

- 列表按 `updatedAt` 降序排列，最近更新的文档排在前面。
- `content` 字段在列表接口中不返回，需通过详情接口获取。
- `size` 最大值为 100，超过时自动截断为 100。

---

### 2.2 POST /documents - 创建策略文档

创建一份新的策略文档，初始状态为 `DRAFT`。

**请求**

- **方法：** `POST`
- **路径：** `/api/sage/documents`
- **Content-Type：** `application/json`

**请求体（StrategyDocument）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String(200) | 是 | 文档标题 |
| type | String(Enum) | 是 | 文档类型 |
| templateId | Long | 否 | 关联模板 ID |
| content | Text | 否 | 文档内容 |

**请求示例**

```json
POST /api/sage/documents
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "title": "2026年Q2运营策略方案",
  "type": "STRATEGY",
  "templateId": 501
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1003,
    "userId": 100,
    "title": "2026年Q2运营策略方案",
    "type": "STRATEGY",
    "templateId": 501,
    "content": null,
    "status": "DRAFT",
    "version": 1,
    "createdAt": "2026-04-24T14:00:00+08:00",
    "updatedAt": "2026-04-24T14:00:00+08:00"
  }
}
```

**错误响应**

```json
// 标题为空
{
  "code": 400,
  "message": "参数错误：title 不能为空",
  "data": null
}

// 标题超长
{
  "code": 400,
  "message": "参数错误：title 长度不能超过 200 个字符",
  "data": null
}

// 类型无效
{
  "code": 400,
  "message": "参数错误：type 必须为 STRATEGY、MARKETING、GROWTH 或 BENCHMARK",
  "data": null
}
```

**备注**

- `userId` 自动取当前认证用户 ID，无需手动传入。
- `id`、`status`、`version`、`createdAt`、`updatedAt` 由服务端自动生成，传入无效。
- 若指定了 `templateId`，系统将自动根据模板创建初始章节结构。

---

### 2.3 GET /documents/{id} - 文档详情（含章节）

获取指定文档的完整信息，包括文档基本信息及所有章节内容。

**请求**

- **方法：** `GET`
- **路径：** `/api/sage/documents/{id}`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 文档 ID |

**请求示例**

```
GET /api/sage/documents/1001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**成功响应**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1001,
    "userId": 100,
    "title": "2026年Q2运营策略方案",
    "type": "STRATEGY",
    "templateId": null,
    "content": "# 2026年Q2运营策略方案\n\n## 市场分析\n...",
    "status": "COMPLETED",
    "version": 2,
    "createdAt": "2026-04-20T10:30:00+08:00",
    "updatedAt": "2026-04-22T15:45:00+08:00",
    "sections": [
      {
        "id": 2001,
        "documentId": 1001,
        "sectionKey": "market_analysis",
        "title": "市场分析",
        "content": "根据最新市场调研数据...",
        "aiGenerated": true,
        "orderNum": 1,
        "status": "EDITED",
        "createdAt": "2026-04-20T10:35:00+08:00",
        "updatedAt": "2026-04-22T14:00:00+08:00"
      },
      {
        "id": 2002,
        "documentId": 1001,
        "sectionKey": "target_audience",
        "title": "目标用户画像",
        "content": "核心目标用户群体为...",
        "aiGenerated": true,
        "orderNum": 2,
        "status": "EDITED",
        "createdAt": "2026-04-20T10:36:00+08:00",
        "updatedAt": "2026-04-21T11:20:00+08:00"
      },
      {
        "id": 2003,
        "documentId": 1001,
        "sectionKey": "action_plan",
        "title": "行动计划",
        "content": "第一阶段（4-5月）：...",
        "aiGenerated": true,
        "orderNum": 3,
        "status": "DRAFT",
        "createdAt": "2026-04-20T10:37:00+08:00",
        "updatedAt": "2026-04-20T10:37:00+08:00"
      }
    ]
  }
}
```

**错误响应**

```json
// 文档不存在
{
  "code": 404,
  "message": "文档不存在或已被删除",
  "data": null
}

// 无权访问
{
  "code": 403,
  "message": "无权访问该文档",
  "data": null
}
```

**备注**

- 章节列表按 `orderNum` 升序排列。
- 仅返回当前用户所属的文档，访问他人文档将返回 `403`。

---

### 2.4 PUT /documents/{id} - 更新文档

更新指定文档的基本信息。更新成功后 `version` 自动加 1。

**请求**

- **方法：** `PUT`
- **路径：** `/api/sage/documents/{id}`
- **Content-Type：** `application/json`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 文档 ID |

**请求体（StrategyDocument）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String(200) | 否 | 文档标题 |
| type | String(Enum) | 否 | 文档类型 |
| templateId | Long | 否 | 关联模板 ID |
| content | Text | 否 | 文档内容 |

**请求示例**

```json
PUT /api/sage/documents/1001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "title": "2026年Q2运营策略方案（修订版）",
  "content": "# 2026年Q2运营策略方案（修订版）\n\n## 修订说明\n..."
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1001,
    "userId": 100,
    "title": "2026年Q2运营策略方案（修订版）",
    "type": "STRATEGY",
    "templateId": null,
    "content": "# 2026年Q2运营策略方案（修订版）\n\n## 修订说明\n...",
    "status": "COMPLETED",
    "version": 3,
    "createdAt": "2026-04-20T10:30:00+08:00",
    "updatedAt": "2026-04-24T14:30:00+08:00"
  }
}
```

**错误响应**

```json
// 文档不存在
{
  "code": 404,
  "message": "文档不存在或已被删除",
  "data": null
}

// 文档正在生成中，不可编辑
{
  "code": 409,
  "message": "文档正在生成中，请稍后再试",
  "data": null
}

// 标题超长
{
  "code": 400,
  "message": "参数错误：title 长度不能超过 200 个字符",
  "data": null
}
```

**备注**

- 当文档状态为 `GENERATING` 时，不允许更新操作，返回 `409` 状态冲突。
- 每次成功更新后，`version` 字段自动加 1。
- 仅传入需要更新的字段即可，未传入字段保持原值不变（部分更新）。

---

### 2.5 DELETE /documents/{id} - 删除文档

对指定文档执行软删除操作，删除后文档不再出现在列表中，但数据保留用于审计。

**请求**

- **方法：** `DELETE`
- **路径：** `/api/sage/documents/{id}`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 文档 ID |

**请求示例**

```
DELETE /api/sage/documents/1001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**成功响应**

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

**错误响应**

```json
// 文档不存在
{
  "code": 404,
  "message": "文档不存在或已被删除",
  "data": null
}

// 文档正在生成中，不可删除
{
  "code": 409,
  "message": "文档正在生成中，请稍后再试",
  "data": null
}

// 无权访问
{
  "code": 403,
  "message": "无权访问该文档",
  "data": null
}
```

**备注**

- 采用软删除机制，数据库中标记 `deleted` 字段为 `true`，不物理删除数据。
- 文档状态为 `GENERATING` 时，不允许删除操作。
- 关联的章节数据将一并软删除。

---

### 2.6 POST /documents/{id}/generate - AI 生成章节

调用 AI 模型为指定文档的某个章节生成内容。生成过程为异步操作，提交后文档状态变为 `GENERATING`。

**请求**

- **方法：** `POST`
- **路径：** `/api/sage/documents/{id}/generate`
- **Content-Type：** `application/json`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 文档 ID |

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sectionKey | String(100) | 是 | 需要生成的章节标识键 |

**请求示例**

```json
POST /api/sage/documents/1001/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "sectionKey": "market_analysis"
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "章节生成任务已提交",
  "data": {
    "documentId": 1001,
    "sectionKey": "market_analysis",
    "status": "GENERATING",
    "estimatedTime": 30
  }
}
```

**错误响应**

```json
// sectionKey 为空
{
  "code": 400,
  "message": "参数错误：sectionKey 不能为空",
  "data": null
}

// 文档不存在
{
  "code": 404,
  "message": "文档不存在或已被删除",
  "data": null
}

// 文档已在生成中
{
  "code": 409,
  "message": "文档正在生成中，请等待当前任务完成",
  "data": null
}

// 章节标识不存在
{
  "code": 400,
  "message": "章节标识 market_analysis_invalid 不存在于该文档模板中",
  "data": null
}
```

**备注**

- 该接口为异步操作，返回后需通过轮询文档详情接口（GET /documents/{id}）获取生成进度。
- 同一文档同一时间只允许一个生成任务，重复提交将返回 `409`。
- `estimatedTime` 为预估生成时间（秒），实际时间可能因 AI 模型负载而变化。
- 生成完成后，文档状态将自动更新为 `COMPLETED`（所有章节均已生成时）或保持 `DRAFT`（仍有未生成章节时）。
- 生成过程中，对应章节的 `status` 为 `GENERATING`，完成后变为 `DRAFT`。

---

### 2.7 POST /documents/{id}/review - AI 审阅文档

调用 AI 模型对指定文档进行全面审阅，返回审阅评分和改进建议。

**请求**

- **方法：** `POST`
- **路径：** `/api/sage/documents/{id}/review`
- **Content-Type：** `application/json`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 文档 ID |

**请求示例**

```
POST /api/sage/documents/1001/review
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

**成功响应**

```json
{
  "code": 200,
  "message": "审阅完成",
  "data": {
    "documentId": 1001,
    "overallScore": 82,
    "reviewDetails": [
      {
        "sectionKey": "market_analysis",
        "sectionTitle": "市场分析",
        "score": 85,
        "suggestions": [
          "建议补充竞品分析数据，增强说服力",
          "可增加行业趋势图表以提升可读性"
        ]
      },
      {
        "sectionKey": "target_audience",
        "sectionTitle": "目标用户画像",
        "score": 78,
        "suggestions": [
          "用户画像维度不够丰富，建议增加消费习惯和行为偏好分析",
          "缺少用户痛点描述，建议补充"
        ]
      },
      {
        "sectionKey": "action_plan",
        "sectionTitle": "行动计划",
        "score": 83,
        "suggestions": [
          "建议为每个行动项指定明确的负责人和时间节点",
          "缺少预算分配方案"
        ]
      }
    ],
    "overallSuggestions": [
      "文档整体结构清晰，逻辑连贯",
      "建议增加风险评估章节",
      "数据支撑可进一步强化"
    ],
    "reviewedAt": "2026-04-24T14:35:00+08:00"
  }
}
```

**错误响应**

```json
// 文档不存在
{
  "code": 404,
  "message": "文档不存在或已被删除",
  "data": null
}

// 文档正在生成中
{
  "code": 409,
  "message": "文档正在生成中，请等待生成完成后再审阅",
  "data": null
}

// 文档内容为空
{
  "code": 400,
  "message": "文档内容为空，无法进行审阅",
  "data": null
}
```

**备注**

- 审阅为同步操作，响应时间取决于文档篇幅，通常在 5-15 秒之间。
- `overallScore` 为综合评分（0-100 分），由各章节评分加权计算得出。
- 每个章节的 `score` 为独立评分（0-100 分）。
- `suggestions` 为具体的改进建议列表，按优先级排列。
- 文档状态为 `GENERATING` 时，不允许审阅操作。

---

### 2.8 POST /analyze - 提交数据分析任务

提交一个数据分析任务，系统将使用 AI 对上传的数据文件进行分析诊断。

**请求**

- **方法：** `POST`
- **路径：** `/api/sage/analyze`
- **Content-Type：** `application/json`

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String(200) | 是 | 分析任务标题 |
| filePath | String(500) | 否 | 数据文件路径（已上传文件的存储路径） |

**请求示例**

```json
POST /api/sage/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "title": "2026年Q1用户增长数据分析",
  "filePath": "/uploads/data/2026-q1-growth.csv"
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "分析任务已提交",
  "data": {
    "id": 3001,
    "userId": 100,
    "title": "2026年Q1用户增长数据分析",
    "filePath": "/uploads/data/2026-q1-growth.csv",
    "status": "PENDING",
    "result": null,
    "errorMessage": null,
    "createdAt": "2026-04-24T15:00:00+08:00",
    "updatedAt": "2026-04-24T15:00:00+08:00"
  }
}
```

**错误响应**

```json
// title 为空
{
  "code": 400,
  "message": "参数错误：title 不能为空",
  "data": null
}

// title 超长
{
  "code": 400,
  "message": "参数错误：title 长度不能超过 200 个字符",
  "data": null
}

// 文件不存在
{
  "code": 400,
  "message": "文件不存在：/uploads/data/invalid.csv",
  "data": null
}

// 文件格式不支持
{
  "code": 400,
  "message": "不支持的文件格式，仅支持 CSV、Excel 格式",
  "data": null
}
```

**备注**

- 分析任务为异步操作，提交后状态为 `PENDING`，系统将自动调度执行。
- `filePath` 指向已通过文件上传接口上传的文件存储路径。
- 支持的文件格式：CSV（`.csv`）、Excel（`.xlsx`、`.xls`）。
- 文件大小限制：最大 50MB。
- 同一用户同时最多允许 3 个进行中的分析任务。

---

### 2.9 GET /analyze/{taskId} - 获取分析结果

获取指定数据分析任务的当前状态及分析结果。

**请求**

- **方法：** `GET`
- **路径：** `/api/sage/analyze/{taskId}`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 分析任务 ID |

**请求示例**

```
GET /api/sage/analyze/3001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**成功响应（已完成）**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 3001,
    "userId": 100,
    "title": "2026年Q1用户增长数据分析",
    "filePath": "/uploads/data/2026-q1-growth.csv",
    "status": "COMPLETED",
    "result": {
      "summary": "Q1 用户总量达到 150 万，环比增长 23.5%，主要增长来源为社交裂变渠道。",
      "keyMetrics": {
        "totalUsers": 1500000,
        "newUsers": 285000,
        "growthRate": "23.5%",
        "retentionRate": "68.2%",
        "activeRate": "45.7%"
      },
      "trends": [
        {
          "period": "1月",
          "newUsers": 85000,
          "growthRate": "18.2%"
        },
        {
          "period": "2月",
          "newUsers": 92000,
          "growthRate": "22.1%"
        },
        {
          "period": "3月",
          "newUsers": 108000,
          "growthRate": "28.7%"
        }
      ],
      "insights": [
        "社交裂变渠道贡献了 45% 的新增用户，是增长主力",
        "3月增长率显著提升，与春季营销活动高度相关",
        "用户留存率较上季度下降 3.2 个百分点，需关注新用户引导流程"
      ],
      "recommendations": [
        "加大社交裂变渠道投入，优化分享机制",
        "改进新用户 Onboarding 流程，提升 7 日留存",
        "针对活跃用户设计召回策略，提升活跃率"
      ]
    },
    "errorMessage": null,
    "createdAt": "2026-04-24T15:00:00+08:00",
    "updatedAt": "2026-04-24T15:05:00+08:00"
  }
}
```

**成功响应（处理中）**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 3001,
    "userId": 100,
    "title": "2026年Q1用户增长数据分析",
    "filePath": "/uploads/data/2026-q1-growth.csv",
    "status": "PROCESSING",
    "result": null,
    "errorMessage": null,
    "createdAt": "2026-04-24T15:00:00+08:00",
    "updatedAt": "2026-04-24T15:01:00+08:00"
  }
}
```

**成功响应（失败）**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 3001,
    "userId": 100,
    "title": "2026年Q1用户增长数据分析",
    "filePath": "/uploads/data/2026-q1-growth.csv",
    "status": "FAILED",
    "result": null,
    "errorMessage": "数据文件格式异常：第 15 行数据列数不匹配",
    "createdAt": "2026-04-24T15:00:00+08:00",
    "updatedAt": "2026-04-24T15:02:00+08:00"
  }
}
```

**错误响应**

```json
// 任务不存在
{
  "code": 404,
  "message": "分析任务不存在",
  "data": null
}

// 无权访问
{
  "code": 403,
  "message": "无权访问该分析任务",
  "data": null
}
```

**备注**

- 仅返回当前用户所属的分析任务，访问他人任务将返回 `403`。
- 当 `status` 为 `PENDING` 或 `PROCESSING` 时，`result` 为 `null`。
- 当 `status` 为 `FAILED` 时，`errorMessage` 包含具体失败原因。
- 建议客户端采用轮询机制（间隔 3-5 秒）查询任务状态，直到状态变为 `COMPLETED` 或 `FAILED`。
- 分析结果 `result` 为 JSON 结构化数据，包含摘要、关键指标、趋势分析、洞察和建议。

---

## 附录

### A. 文档类型枚举

| 枚举值 | 说明 |
|--------|------|
| STRATEGY | 运营策略 |
| MARKETING | 营销方案 |
| GROWTH | 增长策略 |
| BENCHMARK | 行业对标 |

### B. 文档状态枚举

| 枚举值 | 说明 |
|--------|------|
| DRAFT | 草稿 |
| GENERATING | 生成中 |
| COMPLETED | 已完成 |

### C. 章节状态枚举

| 枚举值 | 说明 |
|--------|------|
| DRAFT | 草稿 |
| GENERATING | 生成中 |
| EDITED | 已编辑 |

### D. 分析任务状态枚举

| 枚举值 | 说明 |
|--------|------|
| PENDING | 待处理 |
| PROCESSING | 处理中 |
| COMPLETED | 已完成 |
| FAILED | 失败 |

### E. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2026-04-24 | 初始版本，包含 9 个接口定义 |
