# 探路者接口文档 (Scout API Reference)

> **模块名称**: 探路者 (Scout)
> **版本**: v1.0.0
> **Base URL**: `/api/scout`
> **认证方式**: Bearer Token（通过 `Authorization` 请求头传递）

---

## 目录

- [1. 认证说明](#1-认证说明)
- [2. 通用响应格式](#2-通用响应格式)
- [3. 通用错误码](#3-通用错误码)
- [4. 数据模型](#4-数据模型)
- [5. 接口列表](#5-接口列表)
  - [5.1 投资商列表](#51-get-suppliers---投资商列表)
  - [5.2 创建投资商](#52-post-suppliers---创建投资商)
  - [5.3 投资商详情](#53-get-suppliersid---投资商详情)
  - [5.4 更新投资商](#54-put-suppliersid---更新投资商)
  - [5.5 删除投资商](#55-delete-suppliersid---删除投资商)
  - [5.6 搜索投资商](#56-post-supplierssearch---搜索投资商)
  - [5.7 对比投资商](#57-post-compare---对比投资商)
  - [5.8 行业报告列表](#58-get-reports---行业报告列表)

---

## 1. 认证说明

所有接口均需要在请求头中携带 Bearer Token 进行身份认证：

```
Authorization: Bearer <token>
```

> **注意**: 若未携带 Token 或 Token 已过期，接口将返回 `401 Unauthorized` 错误。

---

## 2. 通用响应格式

所有接口统一使用 `ApiResponse<T>` 包装响应数据：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 业务状态码，`200` 表示成功 |
| message | String | 状态描述信息 |
| data | Object / Array / null | 响应数据载体 |

---

## 3. 通用错误码

| HTTP 状态码 | 业务码 | 说明 |
|-------------|--------|------|
| 200 | 200 | 请求成功 |
| 400 | 400 | 请求参数错误（参数缺失、格式不合法等） |
| 401 | 401 | 未认证或 Token 已过期 |
| 403 | 403 | 无权限访问该资源 |
| 404 | 404 | 资源不存在 |
| 500 | 500 | 服务器内部错误 |

---

## 4. 数据模型

### 4.1 Supplier（投资商）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | Long | 否（创建时自动生成） | - | 投资商唯一标识 |
| userId | Long | 是 | - | 关联用户ID |
| name | String(200) | 是 | - | 投资商名称 |
| category | String(100) | 否 | - | 投资类别（如：天使投资、VC、PE、战略投资等） |
| region | String(100) | 否 | - | 所在区域（如：北京、上海、硅谷等） |
| description | TEXT | 否 | - | 投资商简介 |
| priceRange | String(100) | 否 | - | 投资规模范围（如：500万-2000万） |
| qualification | TEXT | 否 | - | 资质与投资偏好说明 |
| contactInfo | TEXT | 否 | - | 联系方式 |
| rating | Double | 否 | 0.0 | 综合评分（0.0 ~ 5.0） |
| cooperationCount | Integer | 否 | 0 | 累计合作次数 |
| status | String | 否 | "ACTIVE" | 状态：`ACTIVE` / `INACTIVE` / `DELETED` |
| createdAt | DateTime | 否（自动生成） | - | 创建时间 |
| updatedAt | DateTime | 否（自动更新） | - | 更新时间 |

### 4.2 IndustryReport（行业报告）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | Long | 否（自动生成） | - | 报告唯一标识 |
| title | String(300) | 是 | - | 报告标题 |
| industry | String(100) | 否 | - | 所属行业 |
| summary | TEXT | 否 | - | 报告摘要 |
| content | TEXT | 否 | - | 报告正文内容 |
| publishDate | LocalDate | 否 | - | 发布日期 |
| source | String(200) | 否 | - | 报告来源 |
| knowledgeBaseId | Long | 否 | - | 关联知识库ID |
| viewCount | Integer | 否 | 0 | 浏览次数 |
| createdAt | DateTime | 否（自动生成） | - | 创建时间 |
| updatedAt | DateTime | 否（自动更新） | - | 更新时间 |

---

## 5. 接口列表

---

### 5.1 GET /suppliers - 投资商列表

获取投资商分页列表，支持按类别和区域筛选。

#### 请求参数（Query String）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| category | String | 否 | - | 投资类别筛选（如：VC、天使投资、PE） |
| region | String | 否 | - | 区域筛选（如：北京、上海、深圳） |
| page | Integer | 否 | 0 | 页码（从 0 开始） |
| size | Integer | 否 | 10 | 每页条数（最大 100） |

#### 请求示例

```http
GET /api/scout/suppliers?category=VC&region=北京&page=0&size=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "userId": 1001,
        "name": "红杉资本中国基金",
        "category": "VC",
        "region": "北京",
        "description": "红杉资本中国基金专注于科技、消费和医疗健康领域的早期及成长期投资。",
        "priceRange": "1000万-5亿",
        "qualification": "偏好A轮及以后阶段，单笔投资500万-2亿人民币",
        "contactInfo": "contact@sequoiacap.cn",
        "rating": 4.8,
        "cooperationCount": 156,
        "status": "ACTIVE",
        "createdAt": "2025-06-15T10:30:00",
        "updatedAt": "2026-03-20T14:22:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 42,
    "totalPages": 5,
    "last": false
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `size` 超过最大值 100，或 `page` 为负数 |
| 401 | Token 缺失或已过期 |

```json
{
  "code": 400,
  "message": "参数错误：size 不能超过 100",
  "data": null
}
```

#### 备注

- 默认按 `createdAt` 降序排列
- 仅返回状态为 `ACTIVE` 的投资商
- 分页从 `0` 开始计数

---

### 5.2 POST /suppliers - 创建投资商

创建一条新的投资商记录。

#### 请求参数

无 Query 参数，数据通过 Request Body 传递。

#### 请求体

```json
{
  "userId": 1001,
  "name": "深创投集团",
  "category": "PE",
  "region": "深圳",
  "description": "深圳市创新投资集团是国内领先的创投机构，管理基金规模超4000亿元。",
  "priceRange": "5000万-10亿",
  "qualification": "重点投资新能源、半导体、生物医药等硬科技领域",
  "contactInfo": "info@szvc.com.cn",
  "rating": 0.0,
  "cooperationCount": 0
}
```

#### 请求示例

```http
POST /api/scout/suppliers
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "userId": 1001,
  "name": "深创投集团",
  "category": "PE",
  "region": "深圳",
  "description": "深圳市创新投资集团是国内领先的创投机构，管理基金规模超4000亿元。",
  "priceRange": "5000万-10亿",
  "qualification": "重点投资新能源、半导体、生物医药等硬科技领域",
  "contactInfo": "info@szvc.com.cn"
}
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 2,
    "userId": 1001,
    "name": "深创投集团",
    "category": "PE",
    "region": "深圳",
    "description": "深圳市创新投资集团是国内领先的创投机构，管理基金规模超4000亿元。",
    "priceRange": "5000万-10亿",
    "qualification": "重点投资新能源、半导体、生物医药等硬科技领域",
    "contactInfo": "info@szvc.com.cn",
    "rating": 0.0,
    "cooperationCount": 0,
    "status": "ACTIVE",
    "createdAt": "2026-04-24T09:00:00",
    "updatedAt": "2026-04-24T09:00:00"
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `name` 为空或超过 200 字符；`userId` 缺失 |
| 401 | Token 缺失或已过期 |
| 500 | 服务端创建失败（如数据库异常） |

```json
{
  "code": 400,
  "message": "参数错误：name 不能为空",
  "data": null
}
```

#### 备注

- `id`、`status`、`createdAt`、`updatedAt` 由服务端自动生成，无需传入
- `rating` 和 `cooperationCount` 若不传则默认为 `0`
- 同一 `userId` 下 `name` 不建议重复，但接口层面不做唯一性强制校验

---

### 5.3 GET /suppliers/{id} - 投资商详情

根据投资商 ID 获取详细信息。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 投资商唯一标识 |

#### 请求示例

```http
GET /api/scout/suppliers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "userId": 1001,
    "name": "红杉资本中国基金",
    "category": "VC",
    "region": "北京",
    "description": "红杉资本中国基金专注于科技、消费和医疗健康领域的早期及成长期投资。",
    "priceRange": "1000万-5亿",
    "qualification": "偏好A轮及以后阶段，单笔投资500万-2亿人民币",
    "contactInfo": "contact@sequoiacap.cn",
    "rating": 4.8,
    "cooperationCount": 156,
    "status": "ACTIVE",
    "createdAt": "2025-06-15T10:30:00",
    "updatedAt": "2026-03-20T14:22:00"
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `id` 格式不合法（非数字） |
| 401 | Token 缺失或已过期 |
| 404 | 指定 ID 的投资商不存在 |

```json
{
  "code": 404,
  "message": "投资商不存在：id=999",
  "data": null
}
```

#### 备注

- 若投资商状态为 `DELETED`，同样返回 `404`
- 返回完整字段信息，无字段裁剪

---

### 5.4 PUT /suppliers/{id} - 更新投资商

更新指定投资商的信息。支持部分更新，仅传入需要修改的字段即可。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 投资商唯一标识 |

#### 请求体

```json
{
  "name": "红杉资本中国基金（更新）",
  "priceRange": "2000万-8亿",
  "qualification": "扩大投资范围，新增碳中和及ESG相关赛道",
  "rating": 4.9
}
```

#### 请求示例

```http
PUT /api/scout/suppliers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "红杉资本中国基金（更新）",
  "priceRange": "2000万-8亿",
  "qualification": "扩大投资范围，新增碳中和及ESG相关赛道",
  "rating": 4.9
}
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "userId": 1001,
    "name": "红杉资本中国基金（更新）",
    "category": "VC",
    "region": "北京",
    "description": "红杉资本中国基金专注于科技、消费和医疗健康领域的早期及成长期投资。",
    "priceRange": "2000万-8亿",
    "qualification": "扩大投资范围，新增碳中和及ESG相关赛道",
    "contactInfo": "contact@sequoiacap.cn",
    "rating": 4.9,
    "cooperationCount": 156,
    "status": "ACTIVE",
    "createdAt": "2025-06-15T10:30:00",
    "updatedAt": "2026-04-24T09:15:00"
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `name` 超过 200 字符；`rating` 超出 0.0~5.0 范围 |
| 401 | Token 缺失或已过期 |
| 404 | 指定 ID 的投资商不存在 |
| 500 | 服务端更新失败 |

```json
{
  "code": 400,
  "message": "参数错误：rating 必须在 0.0 到 5.0 之间",
  "data": null
}
```

#### 备注

- 采用部分更新策略：未传入的字段保持原值不变
- `id`、`userId`、`status`、`createdAt` 不可通过此接口修改
- `updatedAt` 由服务端自动更新为当前时间
- 不允许更新状态为 `DELETED` 的投资商

---

### 5.5 DELETE /suppliers/{id} - 删除投资商

对指定投资商执行软删除操作，将其状态标记为 `DELETED`。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 投资商唯一标识 |

#### 请求示例

```http
DELETE /api/scout/suppliers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "status": "DELETED"
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `id` 格式不合法 |
| 401 | Token 缺失或已过期 |
| 404 | 指定 ID 的投资商不存在（含已删除的记录） |
| 500 | 服务端删除失败 |

```json
{
  "code": 404,
  "message": "投资商不存在：id=999",
  "data": null
}
```

#### 备注

- 采用**软删除**策略，数据库记录不会被物理删除
- 删除后状态变为 `DELETED`，该投资商将不再出现在列表和搜索结果中
- 已删除的投资商不可再次删除，接口将返回 `404`
- 后续如需恢复，需通过管理后台操作或数据库层面处理

---

### 5.6 POST /suppliers/search - 搜索投资商

根据关键词搜索投资商，支持按类别和区域进一步筛选。搜索范围覆盖名称、描述和资质字段。

#### 请求参数

无 Query 参数，数据通过 Request Body 传递。

#### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| keyword | String | 是 | - | 搜索关键词（最少 2 个字符） |
| category | String | 否 | - | 投资类别筛选 |
| region | String | 否 | - | 区域筛选 |

#### 请求体示例

```json
{
  "keyword": "人工智能",
  "category": "VC",
  "region": "北京"
}
```

#### 请求示例

```http
POST /api/scout/suppliers/search
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "keyword": "人工智能",
  "category": "VC",
  "region": "北京"
}
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 3,
      "userId": 1002,
      "name": "创新工场",
      "category": "VC",
      "region": "北京",
      "description": "创新工场由李开复创办，专注于人工智能及硬科技领域的早期投资。",
      "priceRange": "500万-5000万",
      "qualification": "重点关注AI大模型、自动驾驶、机器人等前沿方向",
      "contactInfo": "contact@chuangxin.com",
      "rating": 4.6,
      "cooperationCount": 89,
      "status": "ACTIVE",
      "createdAt": "2025-08-10T08:00:00",
      "updatedAt": "2026-04-01T16:30:00"
    },
    {
      "id": 5,
      "userId": 1005,
      "name": "明势资本",
      "category": "VC",
      "region": "北京",
      "description": "明势资本专注早期科技投资，在人工智能和智能制造领域有深度布局。",
      "priceRange": "300万-3000万",
      "qualification": "偏好Pre-A和A轮，技术驱动型团队优先",
      "contactInfo": "bp@futurecap.com",
      "rating": 4.3,
      "cooperationCount": 45,
      "status": "ACTIVE",
      "createdAt": "2025-09-20T11:00:00",
      "updatedAt": "2026-03-15T09:45:00"
    }
  ]
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `keyword` 为空或少于 2 个字符 |
| 401 | Token 缺失或已过期 |
| 500 | 搜索服务异常 |

```json
{
  "code": 400,
  "message": "参数错误：keyword 不能为空且至少 2 个字符",
  "data": null
}
```

#### 备注

- 搜索范围包括 `name`、`description`、`qualification` 三个字段
- 结果默认按相关度排序，相关度相同时按 `rating` 降序
- 搜索结果上限为 50 条，不做分页
- 关键词不区分大小写
- 仅搜索状态为 `ACTIVE` 的投资商

---

### 5.7 POST /compare - 对比投资商

将多个投资商进行多维度对比分析，返回各投资商在关键指标上的横向比较数据。

#### 请求参数

无 Query 参数，数据通过 Request Body 传递。

#### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| ids | Long[] | 是 | - | 待对比的投资商 ID 列表（2~5 个） |

#### 请求体示例

```json
{
  "ids": [1, 2, 3]
}
```

#### 请求示例

```http
POST /api/scout/compare
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "suppliers": [
      {
        "id": 1,
        "name": "红杉资本中国基金",
        "category": "VC",
        "region": "北京",
        "priceRange": "1000万-5亿",
        "rating": 4.8,
        "cooperationCount": 156
      },
      {
        "id": 2,
        "name": "深创投集团",
        "category": "PE",
        "region": "深圳",
        "priceRange": "5000万-10亿",
        "rating": 4.5,
        "cooperationCount": 230
      },
      {
        "id": 3,
        "name": "创新工场",
        "category": "VC",
        "region": "北京",
        "priceRange": "500万-5000万",
        "rating": 4.6,
        "cooperationCount": 89
      }
    ],
    "dimensions": [
      {
        "name": "综合评分",
        "key": "rating",
        "values": [4.8, 4.5, 4.6],
        "best": 1
      },
      {
        "name": "合作次数",
        "key": "cooperationCount",
        "values": [156, 230, 89],
        "best": 2
      },
      {
        "name": "投资类别",
        "key": "category",
        "values": ["VC", "PE", "VC"],
        "best": null
      },
      {
        "name": "所在区域",
        "key": "region",
        "values": ["北京", "深圳", "北京"],
        "best": null
      }
    ]
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `ids` 为空、少于 2 个或超过 5 个；ID 列表中存在重复 |
| 401 | Token 缺失或已过期 |
| 404 | 某个 ID 对应的投资商不存在 |
| 500 | 对比分析服务异常 |

```json
{
  "code": 400,
  "message": "参数错误：对比投资商数量需在 2 到 5 个之间",
  "data": null
}
```

```json
{
  "code": 404,
  "message": "投资商不存在：id=999",
  "data": null
}
```

#### 备注

- 对比数量限制为 **2~5** 个投资商
- `dimensions` 中的 `best` 字段表示该维度表现最优的投资商在 `suppliers` 数组中的索引（从 0 开始），非数值型维度 `best` 为 `null`
- 对比结果中仅返回关键维度，不包含 `description`、`contactInfo` 等长文本字段
- 仅支持对比状态为 `ACTIVE` 的投资商

---

### 5.8 GET /reports - 行业报告列表

获取行业研究报告的分页列表，支持按行业筛选。

#### 请求参数（Query String）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| industry | String | 否 | - | 行业筛选（如：人工智能、新能源、半导体） |
| page | Integer | 否 | 0 | 页码（从 0 开始） |
| size | Integer | 否 | 10 | 每页条数（最大 100） |

#### 请求示例

```http
GET /api/scout/reports?industry=人工智能&page=0&size=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "title": "2026年中国人工智能行业投资趋势报告",
        "industry": "人工智能",
        "summary": "本报告深入分析了2026年中国AI行业的投资格局，涵盖大模型、AIGC、自动驾驶等热门赛道。",
        "content": null,
        "publishDate": "2026-03-15",
        "source": "艾瑞咨询",
        "knowledgeBaseId": 2001,
        "viewCount": 3842,
        "createdAt": "2026-03-16T08:00:00",
        "updatedAt": "2026-03-16T08:00:00"
      },
      {
        "id": 2,
        "title": "全球生成式AI融资报告 Q1 2026",
        "industry": "人工智能",
        "summary": "2026年第一季度全球生成式AI领域融资总额达120亿美元，同比增长45%。",
        "content": null,
        "publishDate": "2026-04-01",
        "source": "CB Insights",
        "knowledgeBaseId": 2002,
        "viewCount": 2156,
        "createdAt": "2026-04-02T10:00:00",
        "updatedAt": "2026-04-02T10:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 28,
    "totalPages": 3,
    "last": false
  }
}
```

#### 错误响应

| 状态码 | 场景 |
|--------|------|
| 400 | `size` 超过最大值 100，或 `page` 为负数 |
| 401 | Token 缺失或已过期 |
| 500 | 服务端查询异常 |

```json
{
  "code": 400,
  "message": "参数错误：size 不能超过 100",
  "data": null
}
```

#### 备注

- 列表接口默认不返回 `content` 字段（正文内容），以减少数据传输量
- 默认按 `publishDate` 降序排列，最新报告优先
- `viewCount` 在每次查看报告详情时自增
- 分页从 `0` 开始计数
