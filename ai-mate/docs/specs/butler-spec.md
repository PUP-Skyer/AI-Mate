# AI Mate - 管家AI (Butler) 功能规格说明书

> **文档版本**: v1.0.0
> **最后更新**: 2026-04-23
> **文档状态**: 正式发布
> **负责人**: AI Mate 产品团队

---

## 目录

1. [角色定位](#1-角色定位)
2. [核心功能](#2-核心功能)
3. [用户交互流程](#3-用户交互流程)
4. [API 接口设计](#4-api-接口设计)
5. [数据模型](#5-数据模型)
6. [技术实现方案](#6-技术实现方案)

---

## 1. 角色定位

### 1.1 角色概述

管家AI（Butler）是 AI Mate 平台中的**客户服务管家**，扮演着用户与平台之间的桥梁角色。管家AI 融合了智能客服、运营管理助手和用户成长引导三重身份，为用户提供从新手入门到深度使用的全生命周期服务。通过自然语言交互，管家AI 能够精准理解用户意图，提供即时、准确、有温度的服务体验。

### 1.2 目标用户

| 用户类型 | 典型画像 | 核心诉求 |
|---------|---------|---------|
| **新注册用户** | 首次使用 AI Mate 的用户 | 快速了解平台功能，完成新手引导 |
| **免费版用户** | 体验基础功能的个人用户 | 了解升级路径，获取使用帮助 |
| **付费版用户** | 订阅了会员服务的用户 | 获取专属客服支持，解决使用问题 |
| **企业用户** | 团队版/企业版管理员 | 账户管理、成员权限、用量统计 |
| **遇到问题的用户** | 使用过程中遇到困难的用户 | 快速定位问题，获得解决方案 |

### 1.3 核心价值主张

- **即时响应**: 7x24 小时全天候智能客服，平均响应时间 < 2 秒
- **精准解答**: 基于知识库的语义搜索，提供准确的问题解答
- **主动引导**: 智能识别用户需求，主动推荐相关功能和帮助内容
- **情感关怀**: 在交互中融入情感理解，提供有温度的服务体验
- **持续成长**: 陪伴式新手引导，帮助用户逐步掌握平台全部能力

### 1.4 与其他 AI 角色的关系

管家AI 在 AI Mate 平台中承担「服务与运营」职能，与其他 AI 角色紧密协作：

- **工匠AI（Maker）**: 管家AI 可代为调用工匠AI 的内容生成能力，为用户提供一站式服务
- **顾问AI（Advisor）**: 复杂的业务咨询和数据分析需求，管家AI 可转接至顾问AI 处理
- **平台系统**: 管家AI 与账户系统、计费系统、通知系统深度集成，实现服务闭环

---

## 2. 核心功能

### 2.1 常见问题解答（FAQ）

#### 功能描述

构建结构化的知识库体系，支持自然语言语义搜索，为用户提供精准的问题解答服务。

#### 知识库分类体系

```
FAQ 知识库分类:
├── 账户与登录
│   ├── 注册与激活
│   ├── 密码找回
│   ├── 账号安全
│   └── 多端登录
├── 会员与计费
│   ├── 会员套餐介绍
│   ├── 订阅与续费
│   ├── 发票与账单
│   └── 退款政策
├── 功能使用
│   ├── 工匠AI 使用指南
│   ├── 顾问AI 使用指南
│   ├── 协作空间
│   └── 数据导出
├── 技术问题
│   ├── 页面加载异常
│   ├── 内容生成失败
│   ├── 文件上传问题
│   └── 兼容性问题
└── 政策与合规
    ├── 用户协议
    ├── 隐私政策
    ├── 内容规范
    └── 知识产权
```

#### 语义搜索能力

- **意图识别**: 精准识别用户问题的真实意图，即使表述模糊也能准确匹配
- **同义词扩展**: 自动扩展搜索词的同义词和相关词，提升召回率
- **上下文理解**: 结合对话上下文理解用户问题，支持多轮对话式问答
- **智能推荐**: 在回答问题的同时推荐相关的 FAQ 条目，预防潜在问题

#### FAQ 管理后台

- 支持管理员通过后台新增、编辑、删除 FAQ 条目
- 支持设置 FAQ 的排序权重和展示优先级
- 支持标记 FAQ 为「置顶」「热门」「最新」
- 提供 FAQ 数据分析面板（浏览量、有帮助/无帮助比例、搜索热词）

### 2.2 新手使用引导

#### 功能描述

为首次使用平台的用户提供分步骤的交互式引导，帮助用户快速上手核心功能。

#### 引导步骤设计

```
新手引导流程（共6步）:

步骤1: 欢迎与介绍
├── 欢迎动画 + 平台核心价值介绍
├── "AI Mate 是你的全能AI助手..."
└── 预计耗时: 30秒

步骤2: 角色认知
├── 介绍三大AI角色（工匠、管家、顾问）
├── 每个角色的核心能力展示
├── 用户选择最感兴趣的角色
└── 预计耗时: 1分钟

步骤3: 基础功能体验
├── 引导用户完成第一次AI对话
├── 提供预设的体验问题（如"帮我写一段产品介绍"）
├── 展示AI生成结果
└── 预计耗时: 2分钟

步骤4: 个人资料完善
├── 引导用户填写基本信息
├── 选择行业领域和使用场景
├── 设置偏好（语言风格、通知方式等）
└── 预计耗时: 1分钟

步骤5: 进阶功能探索
├── 介绍协作空间、版本管理等进阶功能
├── 引导用户创建第一个协作空间（可选）
├── 展示内容导出功能
└── 预计耗时: 2分钟

步骤6: 引导完成与奖励
├── 新手引导完成庆祝动画
├── 发放新手奖励（如免费生成额度）
├── 推荐下一步操作
└── 预计耗时: 30秒
```

#### 引导特性

- **断点续传**: 用户可随时暂停引导，下次登录时从断点继续
- **跳过机制**: 每个步骤提供「跳过」选项，尊重用户自主选择
- **重新引导**: 设置中提供「重新查看新手引导」入口
- **个性化调整**: 根据用户选择的行业和场景，动态调整引导内容

### 2.3 问题反馈提交

#### 功能描述

提供结构化的问题反馈表单，支持用户提交使用过程中遇到的各类问题，并提供完整的反馈状态追踪。

#### 反馈类型分类

| 反馈类型 | 说明 | 处理时效 |
|---------|------|---------|
| **功能异常** | 系统Bug、功能不可用 | 24小时内响应 |
| **功能建议** | 新功能需求、改进建议 | 48小时内评估 |
| **内容质量** | AI 生成内容不满意 | 24小时内跟进 |
| **账户问题** | 登录异常、权限问题 | 4小时内响应 |
| **计费问题** | 账单异常、退款申请 | 4小时内响应 |
| **其他问题** | 不属于以上分类的问题 | 48小时内响应 |

#### 反馈表单结构

```
问题反馈表单:
├── 反馈类型（必选，单选）
├── 问题标题（必填，最大50字）
├── 问题描述（必填，最大2000字）
│   └── 支持富文本（可插入截图）
├── 相关功能模块（可选，下拉选择）
├── 复现步骤（可选，结构化输入）
│   ├── 步骤1: ...
│   ├── 步骤2: ...
│   └── 步骤3: ...
├── 期望结果（可选）
├── 联系方式（可选，用于后续跟进）
└── 附件上传（可选，最大10MB，支持图片/视频）
```

#### 状态追踪

```
反馈状态流转:

  [已提交] ──自动分配──> [处理中] ──客服处理──> [已回复]
     │                      │                      │
     │                      │                      ├── 用户满意 ──> [已关闭]
     │                      │                      │
     │                      │                      └── 用户不满意 ──> [处理中]
     │                      │
     │                      └── 需要更多信息 ──> [待补充] ──用户补充──> [处理中]
     │
     └── 用户撤销 ──> [已关闭]
```

### 2.4 售后服务咨询

#### 功能描述

为付费用户提供专业的售后服务咨询，支持历史数据检索和个性化服务方案推荐。

#### 服务内容

- **订阅管理**: 查看当前订阅状态、到期时间、自动续费设置
- **用量查询**: 查看本月 AI 调用次数、已用额度、剩余额度
- **账单查询**: 查看历史账单、下载发票、申请退款
- **升级/降级**: 会员套餐变更、企业版定制方案咨询
- **专属服务**: 企业用户的专属客户经理对接

#### 个性化服务能力

- **历史数据检索**: 根据用户账户信息自动检索相关的使用记录、订单记录
- **智能推荐**: 基于用户使用模式推荐最适合的套餐方案
- **问题预判**: 根据用户近期行为预判可能遇到的问题，主动提供帮助
- **服务记录**: 完整记录每次服务交互，确保服务连续性

### 2.5 账户问题处理

#### 功能描述

处理用户账户相关的各类问题，包括账户信息管理、使用统计、安全设置等。

#### 账户管理功能

| 功能 | 说明 | 操作方式 |
|------|------|---------|
| **个人信息** | 查看/修改昵称、头像、联系方式 | 用户自助修改 |
| **安全设置** | 修改密码、绑定手机/邮箱、两步验证 | 用户自助操作 |
| **登录设备** | 查看已登录设备列表、远程登出 | 用户自助管理 |
| **使用统计** | 查看累计使用天数、生成内容数量、AI调用次数 | 只读展示 |
| **成员管理** | 企业用户管理团队成员、分配权限 | 管理员操作 |
| **数据导出** | 导出个人数据（GDPR/个人信息保护法合规） | 用户自助申请 |

#### 使用统计面板

```
账户使用统计:
├── 基础数据
│   ├── 注册时间: 2026-01-15
│   ├── 累计登录天数: 68天
│   ├── 本月登录天数: 12天
│   └── 连续使用天数: 5天
├── 内容统计
│   ├── 累计生成内容: 156篇
│   ├── 本月生成: 23篇
│   ├── 已发布内容: 89篇
│   └── 协作空间: 3个
├── AI 使用量
│   ├── 本月已用额度: 1,250 / 5,000 次
│   ├── 额度使用进度: ████████░░░░ 25%
│   ├── 高峰使用时段: 14:00-16:00
│   └── 最常用功能: 营销文案创作 (42%)
└── 成就系统
    ├── 内容创作达人 (累计100篇)
    ├── 协作先锋 (创建5个空间)
    └── 连续打卡 (连续7天登录)
```

---

## 3. 用户交互流程

### 3.1 智能客服对话流程

```
用户与管家AI对话流程:
┌─────────────────────────────────────────────────────────────┐
│  步骤1: 用户发起对话                                         │
│  ├── 点击页面右下角的管家AI对话图标                            │
│  ├── 或通过快捷键（Ctrl+B）唤起                               │
│  └── 管家AI 主动问候: "您好！我是您的AI管家，有什么可以帮您？"  │
├─────────────────────────────────────────────────────────────┤
│  步骤2: 意图识别与路由                                        │
│  ├── 管家AI 分析用户输入，识别意图类型                         │
│  ├── 意图分类:                                               │
│  │   ├── FAQ 类 → 搜索知识库，返回匹配答案                    │
│  │   ├── 反馈类 → 引导进入反馈提交流程                        │
│  │   ├── 售后类 → 查询账户数据，提供个性化服务                 │
│  │   ├── 引导类 → 进入新手引导流程                            │
│  │   └── 转接类 → 转接至工匠AI/顾问AI                        │
│  └── 置信度不足时 → 提供澄清问题或转人工客服                   │
├─────────────────────────────────────────────────────────────┤
│  步骤3: 答案生成与展示                                        │
│  ├── 从知识库检索相关FAQ条目                                  │
│  ├── AI 对检索结果进行整理和个性化改写                         │
│  ├── 以对话形式展示答案，附带相关链接和操作按钮                 │
│  └── 提供"是否有帮助"反馈按钮                                 │
├─────────────────────────────────────────────────────────────┤
│  步骤4: 多轮对话跟进                                          │
│  ├── 用户可继续追问相关问题                                    │
│  ├── 管家AI 结合上下文理解，提供连贯回答                       │
│  ├── 适时推荐相关帮助内容                                     │
│  └── 问题解决后主动询问是否还有其他需求                        │
├─────────────────────────────────────────────────────────────┤
│  步骤5: 对话结束与记录                                        │
│  ├── 对话自动归档                                             │
│  ├── 记录用户满意度反馈                                       │
│  ├── 更新FAQ知识库（标记高频问题）                             │
│  └── 生成对话摘要，用于服务质量分析                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 新手引导流程

```
新手引导完整流程:

[用户首次登录]
      │
      v
[显示欢迎弹窗] ──"开始探索"──> [步骤1: 欢迎介绍]
      │
   "稍后再说"
      │
      v
[进入主页面，顶部显示引导提示条]
      │
      v
[步骤1: 欢迎介绍] ──下一步──> [步骤2: 角色认知]
      │                              │
   跳过                          下一步
      │                              │
      v                              v
[跳至步骤4]                  [步骤2: 角色认知] ──下一步──> [步骤3: 功能体验]
                                           │                      │
                                        跳过                   下一步
                                           │                      │
                                           v                      v
                                      [跳至步骤4]          [步骤3: 功能体验]
                                                                  │
                                                               下一步
                                                                  │
                                                                  v
                                                           [步骤4: 资料完善]
                                                                  │
                                                               下一步
                                                                  │
                                                                  v
                                                           [步骤5: 进阶探索]
                                                                  │
                                                               下一步
                                                                  │
                                                                  v
                                                           [步骤6: 完成奖励]
                                                                  │
                                                                  v
                                                           [引导完成，进入主页]
```

### 3.3 问题反馈处理流程

```
反馈处理全流程:

[用户提交反馈]
      │
      v
[系统自动分类] ──> [分配优先级]
      │                │
      │           ┌────┴────┐
      │           │         │
      │        [高优先级] [普通优先级]
      │           │         │
      │      立即通知     进入处理队列
      │      客服团队        │
      │           │         │
      v           v         v
[客服人员处理] <─────────────┘
      │
      ├── 需要更多信息 ──> [通知用户补充] ──> [用户补充] ──> [继续处理]
      │
      ├── 处理完成 ──> [发送回复通知] ──> [用户查看回复]
      │                                          │
      │                                     ┌────┴────┐
      │                                     │         │
      │                                  [满意]    [不满意]
      │                                     │         │
      │                                     v         v
      │                               [关闭工单]  [重新处理]
      │
      └── 转交技术团队 ──> [技术排查] ──> [修复/回复]
```

### 3.4 售后服务流程

```
售后服务咨询流程:

[用户发起售后咨询]
      │
      v
[管家AI 身份验证] ──验证通过──> [查询用户账户信息]
      │
  验证失败
      │
      v
[引导身份验证流程]
      │
      v
[展示售后服务菜单]
      ├── 1. 查看订阅状态
      ├── 2. 查询使用额度
      ├── 3. 账单与发票
      ├── 4. 套餐变更
      └── 5. 其他问题
      │
      v
[用户选择服务类型]
      │
      ├── 订阅状态 ──> 展示当前套餐、到期时间、续费状态
      │                    └── 提供续费/升级操作入口
      │
      ├── 使用额度 ──> 展示额度使用情况（图表+数据）
      │                    └── 推荐合适的套餐方案
      │
      ├── 账单发票 ──> 展示历史账单列表
      │                    └── 支持下载发票/申请退款
      │
      └── 套餐变更 ──> 展示可选套餐对比
                           └── 引导完成变更操作
```

---

## 4. API 接口设计

### 4.1 FAQ 管理接口

#### `GET /api/butler/faq`

获取 FAQ 列表，支持分类筛选和关键词搜索。

**请求参数:**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| category | query | string | 否 | 分类筛选 |
| keyword | query | string | 否 | 关键词搜索 |
| page | query | number | 否 | 页码，默认1 |
| pageSize | query | number | 否 | 每页数量，默认20 |
| sortBy | query | string | 否 | 排序字段：`viewCount` / `helpfulCount` / `sortOrder` |

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 86,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": "faq_001",
        "question": "如何修改我的账户密码？",
        "answer": "请按照以下步骤修改密码：\n1. 点击右上角头像进入「账户设置」\n2. 选择「安全设置」标签页\n3. 点击「修改密码」\n4. 输入当前密码和新密码\n5. 点击「确认修改」即可完成",
        "category": "account",
        "keywords": ["密码", "修改密码", "账户安全"],
        "viewCount": 1523,
        "helpfulCount": 1380,
        "sortOrder": 1,
        "status": "published",
        "createdAt": "2026-01-10T08:00:00Z"
      }
    ]
  }
}
```

#### `POST /api/butler/faq`

新增 FAQ 条目（管理员权限）。

**请求参数:**

```json
{
  "question": "如何升级为专业版会员？",
  "answer": "升级步骤：\n1. 进入「账户设置」>「会员管理」\n2. 点击「升级套餐」\n3. 选择「专业版」\n4. 选择付费周期（月付/年付）\n5. 完成支付即可升级",
  "category": "billing",
  "keywords": ["升级", "会员", "专业版", "套餐"],
  "sortOrder": 5,
  "status": "published"
}
```

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "faq_087",
    "question": "如何升级为专业版会员？",
    "category": "billing",
    "status": "published",
    "createdAt": "2026-04-23T10:00:00Z"
  }
}
```

### 4.2 新手引导接口

#### `GET /api/butler/onboarding/status`

获取当前用户的新手引导进度。

**请求参数:**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| userId | header | string | 是 | 用户ID（从Token中提取） |

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "obd_20260423_001",
    "userId": "usr_10001",
    "currentStep": 3,
    "totalSteps": 6,
    "completedSteps": [1, 2],
    "progress": 33,
    "status": "in_progress",
    "startedAt": "2026-04-23T09:00:00Z",
    "lastUpdatedAt": "2026-04-23T09:05:00Z",
    "stepDetails": [
      {
        "step": 1,
        "title": "欢迎与介绍",
        "status": "completed",
        "completedAt": "2026-04-23T09:00:30Z"
      },
      {
        "step": 2,
        "title": "角色认知",
        "status": "completed",
        "completedAt": "2026-04-23T09:02:00Z"
      },
      {
        "step": 3,
        "title": "基础功能体验",
        "status": "current",
        "completedAt": null
      },
      {
        "step": 4,
        "title": "个人资料完善",
        "status": "pending",
        "completedAt": null
      },
      {
        "step": 5,
        "title": "进阶功能探索",
        "status": "pending",
        "completedAt": null
      },
      {
        "step": 6,
        "title": "引导完成与奖励",
        "status": "pending",
        "completedAt": null
      }
    ]
  }
}
```

#### `POST /api/butler/onboarding/step`

完成新手引导的某个步骤。

**请求参数:**

```json
{
  "step": 3,
  "action": "complete",
  "metadata": {
    "trialFeature": "marketing_copy",
    "trialResult": "success",
    "timeSpent": 125
  }
}
```

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "currentStep": 4,
    "completedSteps": [1, 2, 3],
    "progress": 50,
    "status": "in_progress",
    "reward": {
      "type": "credits",
      "amount": 50,
      "description": "完成步骤3奖励：50次免费生成额度"
    }
  }
}
```

### 4.3 反馈管理接口

#### `GET /api/butler/feedback`

获取用户的反馈列表。

**请求参数:**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| status | query | string | 否 | 状态筛选：`submitted` / `processing` / `replied` / `closed` |
| type | query | string | 否 | 类型筛选：`bug` / `suggestion` / `quality` / `account` / `billing` |
| page | query | number | 否 | 页码，默认1 |
| pageSize | query | number | 否 | 每页数量，默认10 |

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 3,
    "page": 1,
    "pageSize": 10,
    "items": [
      {
        "id": "fb_20260420_001",
        "type": "bug",
        "title": "内容生成偶尔出现超时",
        "description": "在使用工匠AI生成营销文案时，大约每5次会有1次出现请求超时...",
        "status": "replied",
        "priority": "medium",
        "createdAt": "2026-04-20T14:30:00Z",
        "repliedAt": "2026-04-21T09:00:00Z",
        "reply": "感谢您的反馈！该问题已定位并修复，是由于高峰期服务器负载过高导致。我们已扩容服务器资源，目前该问题已解决。"
      }
    ]
  }
}
```

#### `POST /api/butler/feedback`

提交新的问题反馈。

**请求参数:**

```json
{
  "type": "suggestion",
  "title": "希望增加批量导出功能",
  "description": "目前只能单篇导出内容，希望能支持批量选择多篇内容后一次性导出为ZIP文件，方便整理和分享给团队。",
  "module": "maker",
  "reproductionSteps": [
    "进入协作空间",
    "选择多篇内容",
    "点击导出（目前无批量导出选项）"
  ],
  "expectedResult": "支持勾选多篇内容后批量导出",
  "contactInfo": {
    "email": "user@example.com",
    "phone": "138****8888"
  }
}
```

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "fb_20260423_002",
    "type": "suggestion",
    "title": "希望增加批量导出功能",
    "status": "submitted",
    "priority": "normal",
    "estimatedResponseTime": "48小时内",
    "createdAt": "2026-04-23T11:00:00Z"
  }
}
```

### 4.4 数据统计接口

#### `GET /api/dashboard/feedback-stats`

获取反馈统计数据（管理员权限）。

**请求参数:**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| startDate | query | string | 否 | 开始日期，格式 YYYY-MM-DD |
| endDate | query | string | 否 | 结束日期，格式 YYYY-MM-DD |
| groupBy | query | string | 否 | 分组维度：`type` / `status` / `day` |

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overview": {
      "totalFeedback": 1523,
      "newThisWeek": 87,
      "resolvedThisWeek": 72,
      "avgResolutionTime": "18.5小时",
      "resolutionRate": "82.8%"
    },
    "byType": {
      "bug": { "count": 423, "percentage": 27.8 },
      "suggestion": { "count": 567, "percentage": 37.2 },
      "quality": { "count": 298, "percentage": 19.6 },
      "account": { "count": 134, "percentage": 8.8 },
      "billing": { "count": 101, "percentage": 6.6 }
    },
    "byStatus": {
      "submitted": { "count": 45, "percentage": 3.0 },
      "processing": { "count": 128, "percentage": 8.4 },
      "replied": { "count": 89, "percentage": 5.8 },
      "closed": { "count": 1261, "percentage": 82.8 }
    },
    "trend": [
      { "date": "2026-04-17", "count": 12 },
      { "date": "2026-04-18", "count": 15 },
      { "date": "2026-04-19", "count": 8 },
      { "date": "2026-04-20", "count": 18 },
      { "date": "2026-04-21", "count": 14 },
      { "date": "2026-04-22", "count": 11 },
      { "date": "2026-04-23", "count": 9 }
    ]
  }
}
```

#### `GET /api/dashboard/satisfaction`

获取用户满意度统计数据。

**请求参数:**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| period | query | string | 否 | 统计周期：`week` / `month` / `quarter` |

**响应结果:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overall": {
      "satisfactionScore": 4.3,
      "totalRatings": 8923,
      "distribution": {
        "5_star": { "count": 4521, "percentage": 50.7 },
        "4_star": { "count": 2677, "percentage": 30.0 },
        "3_star": { "count": 1071, "percentage": 12.0 },
        "2_star": { "count": 446, "percentage": 5.0 },
        "1_star": { "count": 208, "percentage": 2.3 }
      }
    },
    "byCategory": {
      "faq_helpfulness": { "score": 4.5, "ratings": 5230 },
      "feedback_resolution": { "score": 4.1, "ratings": 1523 },
      "onboarding_experience": { "score": 4.6, "ratings": 3456 },
      "customer_service": { "score": 4.2, "ratings": 2100 }
    },
    "trend": [
      { "period": "2026-W15", "score": 4.1 },
      { "period": "2026-W16", "score": 4.2 },
      { "period": "2026-W17", "score": 4.3 }
    ],
    "recentComments": [
      {
        "category": "onboarding_experience",
        "rating": 5,
        "comment": "新手引导做得很棒，很快就上手了！",
        "createdAt": "2026-04-22T16:00:00Z"
      }
    ]
  }
}
```

---

## 5. 数据模型

### 5.1 FAQ（常见问题）

存储知识库中的常见问题及答案。

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `id` | string (UUID) | 是 | FAQ 唯一标识 |
| `question` | string | 是 | 问题标题，最大长度200字符 |
| `answer` | text | 是 | 答案正文，支持 Markdown 格式 |
| `category` | enum | 是 | 分类：`account` / `billing` / `feature` / `technical` / `policy` |
| `keywords` | string[] | 否 | 搜索关键词标签，用于语义搜索 |
| `viewCount` | integer | 是 | 浏览次数，默认0 |
| `helpfulCount` | integer | 是 | "有帮助"点击次数，默认0 |
| `sortOrder` | integer | 是 | 排序权重，数值越小越靠前 |
| `status` | enum | 是 | 状态：`draft` / `published` / `archived` |
| `createdAt` | datetime | 是 | 创建时间 |

**索引设计:**

- 主键索引: `id`
- 分类查询索引: `category + sortOrder`
- 搜索索引: `keywords`（GIN 索引，支持数组查询）
- 全文搜索索引: `question + answer`（GIN 索引，支持中文分词）

### 5.2 OnboardingProgress（新手引导进度）

记录用户的新手引导完成进度。

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `id` | string (UUID) | 是 | 记录唯一标识 |
| `userId` | string (UUID) | 是 | 用户ID（外键关联用户表） |
| `currentStep` | integer | 是 | 当前步骤编号（1-6） |
| `completedSteps` | integer[] | 是 | 已完成的步骤编号列表 |
| `status` | enum | 是 | 状态：`not_started` / `in_progress` / `completed` / `skipped` |
| `startedAt` | datetime | 否 | 开始时间 |
| `completedAt` | datetime | 否 | 完成时间 |
| `createdAt` | datetime | 是 | 记录创建时间 |

**索引设计:**

- 主键索引: `id`
- 用户查询索引: `userId`（唯一索引）
- 状态筛选索引: `status + createdAt`

### 5.3 Feedback（问题反馈）

存储用户提交的问题反馈信息。

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `id` | string (UUID) | 是 | 反馈唯一标识 |
| `userId` | string (UUID) | 是 | 提交者用户ID |
| `type` | enum | 是 | 反馈类型：`bug` / `suggestion` / `quality` / `account` / `billing` / `other` |
| `title` | string | 是 | 问题标题，最大长度100字符 |
| `description` | text | 是 | 详细描述，最大长度5000字符 |
| `module` | string | 否 | 相关功能模块 |
| `reproductionSteps` | string[] | 否 | 问题复现步骤 |
| `expectedResult` | string | 否 | 期望结果 |
| `contactInfo` | JSON | 否 | 联系方式（邮箱、手机号） |
| `attachments` | string[] | 否 | 附件URL列表 |
| `status` | enum | 是 | 状态：`submitted` / `processing` / `waiting_info` / `replied` / `closed` |
| `priority` | enum | 是 | 优先级：`low` / `normal` / `medium` / `high` / `urgent` |
| `reply` | text | 否 | 客服回复内容 |
| `repliedBy` | string (UUID) | 否 | 回复客服ID |
| `repliedAt` | datetime | 否 | 回复时间 |
| `createdAt` | datetime | 是 | 提交时间 |
| `updatedAt` | datetime | 是 | 最后更新时间 |

**索引设计:**

- 主键索引: `id`
- 用户查询索引: `userId + createdAt`
- 状态筛选索引: `status + priority`
- 类型筛选索引: `type + status`
- 客服工作台索引: `status + createdAt`（用于客服人员查看待处理工单）

### 5.4 ER 关系图

```
┌──────────────────┐     ┌──────────────────────┐
│       User       │     │  OnboardingProgress   │
│──────────────────│     │──────────────────────│
│ id (PK)          │<───>│ id (PK)              │
│ name             │ 1:1 │ userId (FK, Unique)  │
│ email            │     │ currentStep          │
│ ...              │     │ completedSteps       │
└────────┬─────────┘     │ status               │
         │               │ startedAt            │
         │               │ completedAt          │
         │               └──────────────────────┘
         │
         │ 1:N
         │
┌────────┴─────────┐     ┌──────────────────────┐
│     Feedback     │     │         FAQ          │
│──────────────────│     │──────────────────────│
│ id (PK)          │     │ id (PK)              │
│ userId (FK)      │     │ question             │
│ type             │     │ answer               │
│ title            │     │ category             │
│ description      │     │ keywords             │
│ status           │     │ viewCount            │
│ priority         │     │ helpfulCount         │
│ reply            │     │ sortOrder            │
│ repliedBy (FK)   │     │ status               │
│ createdAt        │     │ createdAt            │
└──────────────────┘     └──────────────────────┘
```

---

## 6. 技术实现方案

### 6.1 AI 通道选择策略

管家AI 的核心是智能对话能力，采用以下模型选择策略：

| 服务场景 | 首选模型 | 备选模型 | 选择依据 |
|---------|---------|---------|---------|
| 意图识别 | GPT-4o-mini | 通义千问 | 分类任务，轻量模型即可胜任，成本低 |
| FAQ 语义搜索 | BGE-M3 (Embedding) | text-embedding-3-small | 中文语义向量质量高，检索准确 |
| 对话生成 | GPT-4o | Claude 3.5 | 对话自然度好，中文表达流畅 |
| 情感分析 | GPT-4o-mini | 自训练模型 | 情感分类准确率高 |
| 反馈自动分类 | GPT-4o-mini | 自训练分类模型 | 分类精度满足需求，成本低 |

**意图识别路由逻辑:**

```
function routeIntent(userMessage, context):
    // Step 1: 意图分类
    intent = classifyIntent(userMessage, context)
    // 可选意图: faq, feedback, onboarding, aftersale, account, transfer_maker, transfer_advisor

    // Step 2: 根据意图路由
    switch(intent):
        case 'faq':
            return searchFAQ(userMessage, context)
        case 'feedback':
            return guideToFeedbackForm(userMessage)
        case 'onboarding':
            return checkOnboardingStatus(context.userId)
        case 'aftersale':
            return queryAccountData(context.userId, 'billing')
        case 'account':
            return queryAccountData(context.userId, 'account')
        case 'transfer_maker':
            return transferToMaker(userMessage, context)
        case 'transfer_advisor':
            return transferToAdvisor(userMessage, context)
        default:
            return clarifyIntent(userMessage)
```

### 6.2 前端组件架构

```
src/modules/butler/
├── components/
│   ├── ChatWidget/                  # 对话窗口组件
│   │   ├── ChatBubble.vue           # 对话气泡
│   │   ├── ChatInput.vue            # 输入框组件
│   │   ├── QuickActions.vue         # 快捷操作按钮
│   │   ├── ChatHistory.vue          # 对话历史
│   │   └── SatisfactionRating.vue   # 满意度评价组件
│   ├── FAQ/                         # FAQ 组件
│   │   ├── FAQList.vue              # FAQ 列表
│   │   ├── FAQSearch.vue            # FAQ 搜索
│   │   ├── FAQDetail.vue            # FAQ 详情
│   │   └── FAQCategoryNav.vue       # 分类导航
│   ├── Onboarding/                  # 新手引导组件
│   │   ├── OnboardingOverlay.vue    # 引导弹层
│   │   ├── StepIndicator.vue        # 步骤指示器
│   │   ├── WelcomeStep.vue          # 欢迎步骤
│   │   ├── RoleIntroStep.vue        # 角色介绍步骤
│   │   ├── TrialStep.vue            # 功能体验步骤
│   │   ├── ProfileStep.vue          # 资料完善步骤
│   │   ├── ExploreStep.vue          # 进阶探索步骤
│   │   └── CompletionStep.vue       # 完成奖励步骤
│   ├── Feedback/                    # 反馈组件
│   │   ├── FeedbackForm.vue         # 反馈表单
│   │   ├── FeedbackList.vue         # 反馈列表
│   │   ├── FeedbackDetail.vue       # 反馈详情
│   │   ├── StatusTracker.vue        # 状态追踪
│   │   └── FileUploader.vue         # 附件上传
│   ├── AfterSale/                   # 售后服务组件
│   │   ├── SubscriptionPanel.vue    # 订阅管理面板
│   │   ├── UsageChart.vue           # 用量图表
│   │   ├── BillList.vue             # 账单列表
│   │   └── PlanComparison.vue       # 套餐对比
│   └── Dashboard/                   # 管理后台组件
│       ├── FeedbackStats.vue        # 反馈统计面板
│       ├── SatisfactionChart.vue    # 满意度图表
│       ├── TrendChart.vue           # 趋势图表
│       └── HotKeywords.vue          # 热搜关键词
├── composables/
│   ├── useChat.ts                   # 对话逻辑
│   ├── useFAQ.ts                    # FAQ 搜索逻辑
│   ├── useOnboarding.ts             # 引导流程逻辑
│   ├── useFeedback.ts               # 反馈管理逻辑
│   └── useAfterSale.ts              # 售后服务逻辑
├── stores/
│   ├── chatStore.ts                 # 对话状态管理
│   ├── faqStore.ts                  # FAQ 状态管理
│   └── feedbackStore.ts             # 反馈状态管理
├── services/
│   ├── butlerApi.ts                 # API 请求封装
│   ├── chatService.ts               # 对话服务（WebSocket）
│   └── searchService.ts             # 语义搜索服务
└── types/
    ├── chat.ts                      # 对话相关类型
    ├── faq.ts                       # FAQ 相关类型
    ├── feedback.ts                  # 反馈相关类型
    └── onboarding.ts                # 引导相关类型
```

### 6.3 后端服务架构

```
services/butler-service/
├── controllers/
│   ├── FAQController.java           # FAQ 管理控制器
│   ├── OnboardingController.java    # 新手引导控制器
│   ├── FeedbackController.java      # 反馈管理控制器
│   ├── AfterSaleController.java     # 售后服务控制器
│   └── DashboardController.java     # 数据统计控制器
├── services/
│   ├── FAQService.java              # FAQ 业务逻辑
│   ├── SearchService.java           # 语义搜索服务
│   ├── OnboardingService.java       # 新手引导逻辑
│   ├── FeedbackService.java         # 反馈处理逻辑
│   ├── AfterSaleService.java        # 售后服务逻辑
│   ├── ChatService.java             # 对话核心服务
│   ├── IntentClassifier.java        # 意图分类器
│   └── SatisfactionService.java     # 满意度分析服务
├── adapters/
│   ├── EmbeddingAdapter.java        # 向量化适配器
│   ├── VectorStoreAdapter.java      # 向量数据库适配器
│   └── LLMAdapter.java              # 大语言模型适配器
├── repositories/
│   ├── FAQRepository.java           # FAQ 数据访问
│   ├── OnboardingRepository.java    # 引导进度数据访问
│   ├── FeedbackRepository.java      # 反馈数据访问
│   └── ChatHistoryRepository.java   # 对话历史数据访问
├── models/
│   ├── FAQ.java                     # FAQ 实体
│   ├── OnboardingProgress.java      # 引导进度实体
│   ├── Feedback.java                # 反馈实体
│   ├── ChatMessage.java             # 对话消息实体
│   └── SatisfactionRating.java      # 满意度评价实体
└── config/
    ├── ChatConfig.java              # 对话配置
    ├── SearchConfig.java            # 搜索配置
    └── OnboardingConfig.java        # 引导流程配置
```

### 6.4 语义搜索实现方案

FAQ 的语义搜索是管家AI 的核心技术能力，采用**向量检索 + 关键词检索**的混合搜索方案：

```
语义搜索流程:

用户输入: "怎么改密码"
      │
      v
[文本向量化] ──BGE-M3 Embedding──> [向量: [0.023, -0.156, 0.789, ...]]
      │
      v
[混合检索]
      ├── 向量检索: 在向量数据库中查找语义最相似的FAQ
      │   └── 使用余弦相似度，返回 Top-10 结果
      │
      └── 关键词检索: 在全文索引中查找关键词匹配的FAQ
          └── 使用 BM25 算法，返回 Top-10 结果
      │
      v
[结果融合] ──RRF (Reciprocal Rank Fusion)──> [融合排序结果]
      │
      v
[AI 重排序] ──LLM 对 Top-5 结果进行相关性打分──> [最终排序]
      │
      v
[返回最佳匹配 FAQ]
```

**向量数据库选型:**

- **开发/测试环境**: 使用 PostgreSQL + pgvector 扩展，降低基础设施成本
- **生产环境**: 使用 Milvus 或 Qdrant，支持大规模向量检索，延迟 < 50ms

### 6.5 对话系统实现方案

#### WebSocket 实时通信

管家AI 的对话功能基于 WebSocket 实现实时双向通信：

```
通信协议设计:

客户端 -> 服务端:
{
  "type": "message",
  "content": "怎么升级会员？",
  "sessionId": "sess_abc123",
  "timestamp": "2026-04-23T10:00:00Z"
}

服务端 -> 客户端 (流式响应):
{
  "type": "stream_start",
  "sessionId": "sess_abc123"
}
{
  "type": "stream_chunk",
  "content": "升级会员",
  "sessionId": "sess_abc123"
}
{
  "type": "stream_chunk",
  "content": "非常简单，",
  "sessionId": "sess_abc123"
}
{
  "type": "stream_end",
  "sessionId": "sess_abc123",
  "intent": "aftersale",
  "relatedFAQs": ["faq_010", "faq_011"],
  "actions": [
    { "type": "link", "label": "立即升级", "url": "/settings/subscription" }
  ]
}
```

#### 对话上下文管理

```
对话上下文结构:
{
  "sessionId": "sess_abc123",
  "userId": "usr_10001",
  "messages": [
    { "role": "user", "content": "你好", "timestamp": "..." },
    { "role": "assistant", "content": "您好！我是您的AI管家...", "timestamp": "..." },
    { "role": "user", "content": "怎么升级会员？", "timestamp": "..." }
  ],
  "context": {
    "detectedIntent": "aftersale",
    "userPlan": "free",
    "userUsage": { "used": 1250, "total": 5000 },
    "recentActions": ["generated_content", "viewed_pricing"]
  },
  "createdAt": "2026-04-23T10:00:00Z",
  "lastActivityAt": "2026-04-23T10:05:00Z"
}
```

### 6.6 集成方案

#### 与平台其他模块的集成

- **用户中心集成**: 共享用户认证体系，获取用户基本信息、会员状态、使用权限
- **工匠AI集成**: 管家AI 可代为调用工匠AI 的内容生成能力，实现"一句话创作"
- **顾问AI集成**: 复杂的数据分析需求无缝转接至顾问AI
- **通知服务集成**: 反馈状态变更、客服回复通过多渠道通知用户
- **计费系统集成**: 售后服务模块直接查询计费系统的订阅和账单数据
- **数据中台集成**: 对话数据、FAQ 使用数据、满意度数据同步至数据中台

#### 第三方服务集成

| 服务 | 用途 | 集成方式 |
|------|------|---------|
| OpenAI API | GPT-4o / GPT-4o-mini 模型调用 | REST API + SDK |
| BGE-M3 | 中文文本向量化 | 本地部署 / API |
| Milvus / pgvector | 向量存储与检索 | SDK |
| Redis | 对话缓存、会话管理、限流计数 | Redis Client |
| PostgreSQL | 核心数据持久化存储 | ORM |
| Elasticsearch | FAQ 全文检索 | REST API |
| WebSocket (Socket.IO) | 实时对话通信 | Socket.IO Client/Server |
| 阿里云 OSS | 反馈附件存储 | S3 兼容 API |

### 6.7 性能优化策略

- **FAQ 缓存**: 热门 FAQ 条目缓存至 Redis，减少数据库查询压力
- **向量预计算**: FAQ 内容变更时异步更新向量索引，避免查询时实时计算
- **对话连接池**: WebSocket 连接复用，减少连接建立开销
- **意图识别缓存**: 相似问题的意图识别结果缓存，提升响应速度
- **CDN 加速**: 静态资源（引导动画、图标、样式文件）通过 CDN 分发
- **数据库优化**: FAQ 全文索引使用中文分词器（jieba/pg_jieba），提升搜索精度

### 6.8 安全策略

- **敏感信息过滤**: 对话中涉及的密码、手机号等敏感信息自动脱敏
- **权限控制**: FAQ 管理接口限制管理员权限，反馈统计接口限制客服/管理员权限
- **输入验证**: 所有用户输入进行 XSS 防护和 SQL 注入防护
- **对话安全**: 对话内容经过安全审核，防止生成不当内容
- **数据加密**: 用户反馈中的联系方式等敏感字段加密存储
- **审计日志**: 客服操作记录完整审计日志，支持事后追溯
- **GDPR 合规**: 支持用户数据导出和删除请求，符合个人信息保护法要求

---

> **文档维护说明**: 本文档由 AI Mate 产品团队维护，如有功能变更请及时更新。技术实现细节以实际代码为准。
