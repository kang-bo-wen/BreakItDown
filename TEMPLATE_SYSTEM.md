# 动态模板缓存系统（Shadow Cache）

## 📖 系统概述

这是一个为路演准备的"影子缓存"系统，预设了 20 个顶级工业与消费品案例。当用户输入匹配预设关键词时，系统会模拟 AI 处理延迟后直接返回预设的高质量模板数据，而不是调用真实的 AI API。

## 🏗️ 系统架构

### 1. 数据层（Prisma Schema）

新增 `TemplateSession` 模型：

```prisma
model TemplateSession {
  id                   String   @id @default(cuid())
  templateKey          String   @unique
  displayName          String
  category             String
  keywords             String   // JSON 数组
  identificationResult Json
  treeData             Json
  nodePositions        Json?
  agentReports         Json
  productionAnalysis   Json?
  priority             Int      @default(0)
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### 2. 模板存储（JSON 文件）

位置：`prisma/seeds/templates/`

每个模板一个 JSON 文件，包含：
- 识别结果（IdentificationResponse）
- 完整拆解树（treeData）
- 7 个智能体分析报告（agentReports）
- 生产分析数据（productionAnalysis）

### 3. 拦截器（Template Interceptor）

位置：`lib/template-interceptor.ts`

核心功能：
- 关键词匹配（精确匹配 + 模糊匹配）
- 模拟 AI 延迟（1-1.5秒）
- 提取模板数据

### 4. API 集成

位置：`app/api/identify-text/route.ts`

流程：
1. 接收用户输入
2. 调用拦截器检测是否命中模板
3. 如果命中：模拟延迟 → 返回模板数据
4. 如果未命中：调用真实 AI API

## 📦 20 大模板清单

### 【大国重器】
1. 空间计算头显
2. 可回收液氧甲烷火箭发动机
3. 高动态四足机器狗
4. 军用级微型侦察无人机
5. 大型船舶电动吊舱推进器

### 【极客定制】
6. 客制化机械键盘 ✅
7. 发烧级全自动意式咖啡机
8. 模块化微单相机
9. 碳纤维公路自行车
10. 全景声降噪头戴式耳机

### 【生活黑科技】
11. 智能仿生睡眠床垫
12. 高速无叶吹风机
13. AI视觉智能宠物喂食器
14. 电竞级人体工学椅
15. AR全息滑雪护目镜

### 【绿色新消费】
16. 培育钻石订婚戒指
17. 植物基人造肉汉堡
18. 环保降解跑鞋
19. 限量版潮玩盲盒公仔
20. 智能恒温婴儿车

## 🚀 使用指南

### 1. 生成单个模板

```bash
# 生成【客制化机械键盘】模板
npx tsx scripts/generate-keyboard-template.ts
```

### 2. 批量生成所有模板

```bash
# 生成所有 20 个模板（需要约 10-15 分钟）
npx tsx scripts/generate-all-templates.ts
```

### 3. 加载模板到数据库

```bash
# 运行 seed 脚本
npm run db:seed
```

### 4. 测试拦截器

```bash
# 测试关键词匹配
npx tsx scripts/test-template-interceptor.ts
```

### 5. 启动开发服务器

```bash
npm run dev
```

## 🧪 测试示例

在前端输入以下关键词，应该命中模板：

- "机械键盘" → 客制化机械键盘
- "mechanical keyboard" → 客制化机械键盘
- "客制化键盘" → 客制化机械键盘
- "火箭发动机" → 可回收液氧甲烷火箭发动机
- "咖啡机" → 发烧级全自动意式咖啡机

## 📝 添加新模板

### 方法 1：使用生成器（推荐）

1. 编辑 `scripts/generate-all-templates.ts`，添加新配置
2. 运行生成脚本
3. 运行 `npm run db:seed` 加载到数据库

### 方法 2：手动创建

1. 在 `prisma/seeds/templates/` 创建新的 JSON 文件
2. 按照现有模板格式填写数据
3. 运行 `npm run db:seed` 加载到数据库

## 🔧 配置说明

### 关键词匹配规则

- **精确匹配**：用户输入完全包含关键词 → 置信度 1.0
- **模糊匹配**：编辑距离 ≤ 2 且长度相近 → 置信度 0.8
- **阈值**：置信度 ≥ 0.8 才返回模板

### 模拟延迟

- 延迟时间：1000-1500ms（随机）
- 目的：让用户感觉是真实 AI 生成

### 优先级

- 模板按 `priority` 字段排序
- 数值越大优先级越高
- 用于处理关键词冲突

## 📊 数据库管理

```bash
# 查看数据库
npx prisma studio

# 重置数据库
npm run db:reset

# 创建迁移
npm run db:migrate
```

## ⚠️ 注意事项

1. **API 限流**：批量生成时每个模板间隔 3 秒，避免触发 DeepSeek API 限流
2. **关键词冲突**：确保不同模板的关键词不要重叠
3. **数据一致性**：修改 JSON 文件后必须重新运行 `npm run db:seed`
4. **视觉风格**：模板数据必须符合现有 UI 组件的数据结构

## 🎯 核心设计原则

1. **零硬编码**：所有模板数据存储在 JSON 文件和数据库中
2. **横向扩展**：添加新模板只需创建 JSON 文件并运行 seed
3. **视觉继承**：完全复用现有 UI 组件和样式
4. **透明拦截**：用户无法察觉是模板还是真实 AI 生成

## 📚 相关文件

- `prisma/schema.prisma` - 数据库模型定义
- `prisma/seed.ts` - 种子脚本
- `lib/template-generator.ts` - 模板生成器
- `lib/template-interceptor.ts` - 拦截器逻辑
- `app/api/identify-text/route.ts` - API 集成
- `scripts/generate-all-templates.ts` - 批量生成脚本
- `scripts/test-template-interceptor.ts` - 测试脚本
