# 工匠模块接口文档（Maker API）

> **模块定位：** 工匠是 AI Mate 平台的内容创作专家模块，提供营销文案、社交媒体内容、短视频脚本等多种内容的创建、管理和协作能力。

## 基本信息

| 项目 | 说明 |
|------|------|
| Base URL | `/api/maker` |
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

### ContentPiece（内容）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键，自增 | 内容 ID |
| userId | Long | 非空 | 创建用户 ID |
| title | String(200) | 非空 | 内容标题 |
| type | enum | 非空 | 内容类型：`COPYWRITING`（营销文案）、`SOCIAL`（社交媒体）、`VIDEO`（短视频脚本）、`PRODUCT`（产品描述）、`BRAND`（品牌故事） |
| platform | String(50) | 可选 | 目标平台（如：微信、抖音、小红书等） |
| targetAudience | String(200) | 可选 | 目标受众描述 |
| productInfo | TEXT | 可选 | 产品信息描述 |
| currentVersion | Integer | 默认 1 | 当前版本号 |
| status | enum | 默认 DRAFT | 状态：`DRAFT`（草稿）、`PUBLISHED`（已发布）、`ARCHIVED`（已归档） |
| createdAt | DateTime | 自动生成 | 创建时间 |
| updatedAt | DateTime | 自动更新 | 更新时间 |

### ContentVersion（内容版本）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键，自增 | 版本 ID |
| contentId | Long | 非空，外键 | 关联内容 ID |
| version | Integer | 非空 | 版本号 |
| content | TEXT | 非空 | 版本正文内容 |
| style | String(50) | 可选 | 写作风格（如：专业、轻松、幽默等） |
| wordCount | Integer | 默认 0 | 字数统计 |
| createdAt | DateTime | 自动生成 | 创建时间 |

### CollabSpace（协作空间）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键，自增 | 空间 ID |
| name | String(100) | 非空 | 空间名称 |
| description | String(500) | 可选 | 空间描述 |
| ownerId | Long | 非空 | 创建者/所有者 ID |
| memberCount | Integer | 默认 1 | 成员数量 |
| contentCount | Integer | 默认 0 | 内容数量 |
| status | enum | 默认 ACTIVE | 状态：`ACTIVE`（活跃）、`ARCHIVED`（已归档）、`CLOSED`（已关闭） |
| createdAt | DateTime | 自动生成 | 创建时间 |
| updatedAt | DateTime | 自动更新 | 更新时间 |

---

## 接口列表

### 1. 获取内容列表

获取当前用户的内容列表，支持按类型筛选和分页。

- **URL:** `GET /api/maker/content`
- **认证:** 需要 Bearer Token

#### 请求参数（Query Parameters）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | String | 否 | 无 | 按内容类型筛选，可选值：`COPYWRITING`、`SOCIAL`、`VIDEO`、`PRODUCT`、`BRAND` |
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
        "title": "春季新品推广文案",
        "type": "COPYWRITING",
        "platform": "微信公众号",
        "targetAudience": "25-35岁都市女性",
        "productInfo": "春季护肤系列新品，主打天然植物成分",
        "currentVersion": 2,
        "status": "DRAFT",
        "createdAt": "2026-04-20T10:30:00",
        "updatedAt": "2026-04-22T14:20:00"
      },
      {
        "id": 2,
        "userId": 1001,
        "title": "抖音短视频脚本-产品开箱",
        "type": "VIDEO",
        "platform": "抖音",
        "targetAudience": "18-30岁数码爱好者",
        "productInfo": "智能手表Pro",
        "currentVersion": 1,
        "status": "PUBLISHED",
        "createdAt": "2026-04-18T09:00:00",
        "updatedAt": "2026-04-18T09:00:00"
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

```json
{
  "code": 400,
  "message": "分页参数错误：size 不能超过 50",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 2. 创建内容

创建一条新的内容记录，初始版本号默认为 1。

- **URL:** `POST /api/maker/content`
- **认证:** 需要 Bearer Token

#### 请求体（Request Body）

```json
{
  "title": "春季新品推广文案",
  "type": "COPYWRITING",
  "platform": "微信公众号",
  "targetAudience": "25-35岁都市女性",
  "productInfo": "春季护肤系列新品，主打天然植物成分"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String(200) | 是 | 内容标题，最大 200 字符 |
| type | String | 是 | 内容类型枚举 |
| platform | String(50) | 否 | 目标平台 |
| targetAudience | String(200) | 否 | 目标受众 |
| productInfo | String | 否 | 产品信息描述 |

#### 成功响应（201 Created）

```json
{
  "code": 201,
  "message": "内容创建成功",
  "data": {
    "id": 3,
    "userId": 1001,
    "title": "春季新品推广文案",
    "type": "COPYWRITING",
    "platform": "微信公众号",
    "targetAudience": "25-35岁都市女性",
    "productInfo": "春季护肤系列新品，主打天然植物成分",
    "currentVersion": 1,
    "status": "DRAFT",
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
  "message": "标题不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "内容类型不合法，可选值：COPYWRITING, SOCIAL, VIDEO, PRODUCT, BRAND",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 3. 获取内容详情

获取指定内容的详细信息，包含最新版本的内容正文。

- **URL:** `GET /api/maker/content/{id}`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 内容 ID |

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "userId": 1001,
    "title": "春季新品推广文案",
    "type": "COPYWRITING",
    "platform": "微信公众号",
    "targetAudience": "25-35岁都市女性",
    "productInfo": "春季护肤系列新品，主打天然植物成分",
    "currentVersion": 2,
    "status": "DRAFT",
    "createdAt": "2026-04-20T10:30:00",
    "updatedAt": "2026-04-22T14:20:00",
    "latestVersion": {
      "id": 5,
      "contentId": 1,
      "version": 2,
      "content": "春风十里，不如你。全新春季护肤系列，萃取天然植物精华，为肌肤注入春天的活力...",
      "style": "文艺清新",
      "wordCount": 356,
      "createdAt": "2026-04-22T14:20:00"
    }
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "内容不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 403,
  "message": "无权访问该内容",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 4. 更新内容

更新指定内容的基本信息（标题、平台、受众等），不涉及版本内容变更。

- **URL:** `PUT /api/maker/content/{id}`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 内容 ID |

#### 请求体（Request Body）

```json
{
  "title": "春季新品推广文案（修改版）",
  "platform": "微信公众号、小红书",
  "targetAudience": "25-40岁关注护肤的都市女性",
  "status": "PUBLISHED"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String(200) | 否 | 内容标题 |
| platform | String(50) | 否 | 目标平台 |
| targetAudience | String(200) | 否 | 目标受众 |
| productInfo | String | 否 | 产品信息 |
| status | String | 否 | 状态枚举 |

#### 成功响应

```json
{
  "code": 200,
  "message": "内容更新成功",
  "data": {
    "id": 1,
    "userId": 1001,
    "title": "春季新品推广文案（修改版）",
    "type": "COPYWRITING",
    "platform": "微信公众号、小红书",
    "targetAudience": "25-40岁关注护肤的都市女性",
    "productInfo": "春季护肤系列新品，主打天然植物成分",
    "currentVersion": 2,
    "status": "PUBLISHED",
    "createdAt": "2026-04-20T10:30:00",
    "updatedAt": "2026-04-24T11:00:00"
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "内容不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "状态流转不合法：无法从 ARCHIVED 变更为 DRAFT",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 5. 删除内容

对指定内容执行软删除操作，删除后状态标记为已删除，不会物理删除数据。

- **URL:** `DELETE /api/maker/content/{id}`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 内容 ID |

#### 成功响应

```json
{
  "code": 200,
  "message": "内容已删除",
  "data": null,
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "内容不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 403,
  "message": "无权删除该内容",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 6. 获取版本历史

获取指定内容的所有版本历史记录，按版本号倒序排列。

- **URL:** `GET /api/maker/content/{id}/versions`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 内容 ID |

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "id": 5,
      "contentId": 1,
      "version": 2,
      "content": "春风十里，不如你。全新春季护肤系列，萃取天然植物精华，为肌肤注入春天的活力。温和不刺激，敏感肌也能安心使用。让每一天都从清新开始...",
      "style": "文艺清新",
      "wordCount": 356,
      "createdAt": "2026-04-22T14:20:00"
    },
    {
      "id": 3,
      "contentId": 1,
      "version": 1,
      "content": "春季护肤新品上市！天然植物成分，温和呵护您的肌肤。立即体验春天的味道，让美丽自然绽放。限时优惠，不容错过！",
      "style": "促销直白",
      "wordCount": 218,
      "createdAt": "2026-04-20T10:35:00"
    }
  ],
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "内容不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 7. 创建新版本

为指定内容创建一个新版本。版本号自动递增（基于当前 `currentVersion` + 1），同时更新内容的 `currentVersion` 字段。

- **URL:** `POST /api/maker/content/{id}/versions`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 内容 ID |

#### 请求体（Request Body）

```json
{
  "content": "春风十里，不如你。全新春季护肤系列，萃取天然植物精华，为肌肤注入春天的活力。温和不刺激，敏感肌也能安心使用。让每一天都从清新开始。我们的产品经过皮肤科医生推荐，98%的用户表示使用后肌肤明显改善。",
  "style": "文艺清新"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | String | 是 | 版本正文内容 |
| style | String(50) | 否 | 写作风格 |

#### 成功响应（201 Created）

```json
{
  "code": 201,
  "message": "版本创建成功",
  "data": {
    "id": 6,
    "contentId": 1,
    "version": 3,
    "content": "春风十里，不如你。全新春季护肤系列，萃取天然植物精华，为肌肤注入春天的活力。温和不刺激，敏感肌也能安心使用。让每一天都从清新开始。我们的产品经过皮肤科医生推荐，98%的用户表示使用后肌肤明显改善。",
    "style": "文艺清新",
    "wordCount": 420,
    "createdAt": "2026-04-24T12:00:00"
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "内容不存在或已被删除",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "版本内容不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 8. 获取协作空间列表

获取当前用户参与的协作空间列表。

- **URL:** `GET /api/maker/spaces`
- **认证:** 需要 Bearer Token

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "id": 1,
      "name": "品牌营销团队",
      "description": "负责品牌推广和营销内容创作",
      "ownerId": 1001,
      "memberCount": 5,
      "contentCount": 23,
      "status": "ACTIVE",
      "createdAt": "2026-03-01T09:00:00",
      "updatedAt": "2026-04-24T08:00:00"
    },
    {
      "id": 2,
      "name": "社交媒体运营组",
      "description": "管理各社交平台的内容发布",
      "ownerId": 1002,
      "memberCount": 3,
      "contentCount": 15,
      "status": "ACTIVE",
      "createdAt": "2026-03-15T14:00:00",
      "updatedAt": "2026-04-23T16:30:00"
    }
  ],
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

### 9. 创建协作空间

创建一个新的协作空间，当前用户自动成为空间所有者。

- **URL:** `POST /api/maker/spaces`
- **认证:** 需要 Bearer Token

#### 请求体（Request Body）

```json
{
  "name": "新品发布筹备组",
  "description": "负责Q2季度新品发布的全部内容准备工作"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String(100) | 是 | 空间名称，最大 100 字符 |
| description | String(500) | 否 | 空间描述，最大 500 字符 |

#### 成功响应（201 Created）

```json
{
  "code": 201,
  "message": "协作空间创建成功",
  "data": {
    "id": 3,
    "name": "新品发布筹备组",
    "description": "负责Q2季度新品发布的全部内容准备工作",
    "ownerId": 1001,
    "memberCount": 1,
    "contentCount": 0,
    "status": "ACTIVE",
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
  "message": "空间名称不能为空",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 400,
  "message": "空间名称长度不能超过 100 个字符",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 10. 获取协作空间详情

获取指定协作空间的详细信息。

- **URL:** `GET /api/maker/spaces/{id}`
- **认证:** 需要 Bearer Token

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 空间 ID |

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "name": "品牌营销团队",
    "description": "负责品牌推广和营销内容创作",
    "ownerId": 1001,
    "memberCount": 5,
    "contentCount": 23,
    "status": "ACTIVE",
    "createdAt": "2026-03-01T09:00:00",
    "updatedAt": "2026-04-24T08:00:00"
  },
  "timestamp": 1714000000000
}
```

#### 错误响应

```json
{
  "code": 404,
  "message": "协作空间不存在",
  "data": null,
  "timestamp": 1714000000000
}
```

```json
{
  "code": 403,
  "message": "您不是该协作空间的成员，无权查看",
  "data": null,
  "timestamp": 1714000000000
}
```

---

## 附录

### 枚举值汇总

#### 内容类型（ContentPiece.type）

| 值 | 说明 |
|----|------|
| COPYWRITING | 营销文案 |
| SOCIAL | 社交媒体内容 |
| VIDEO | 短视频脚本 |
| PRODUCT | 产品描述 |
| BRAND | 品牌故事 |

#### 内容状态（ContentPiece.status）

| 值 | 说明 |
|----|------|
| DRAFT | 草稿 |
| PUBLISHED | 已发布 |
| ARCHIVED | 已归档 |

#### 空间状态（CollabSpace.status）

| 值 | 说明 |
|----|------|
| ACTIVE | 活跃 |
| ARCHIVED | 已归档 |
| CLOSED | 已关闭 |
