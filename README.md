---
title: Break It Down - Deconstruction
emoji: 🎮
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: MIT
tags:
  - AI
  - Game
  - Visualization
  - Next.js
---

# Break It Down - Mode 1: Deconstruction

一个交互式的"Mine & Craft"游戏，通过AI驱动的可视化方式，将现代物体拆解到其自然/元素根源。

## ✨ 核心亮点

- 🎨 **智能图片识别**: 上传任意物体图片，AI自动识别并创建根节点
- 🌳 **递归拆解可视化**: 点击节点逐层拆解，直到自然原材料
- 💡 **AI知识卡片**: 每个组件都有详细的制造流程和材料说明
- 🎮 **交互式图谱**: 可拖拽、缩放、全屏查看的树状结构，节点位置自动保存
- 🎭 **自定义AI风格**: 调节幽默度和专业度，或使用自定义prompt模板
- 🗺️ **智能控制面板**: 缩略图、锁定拖拽、自适应视图等功能
- 👤 **用户认证系统**: 支持邮箱登录，安全管理个人数据
- 📚 **历史记录管理**: 自动保存拆解历史，支持快速加载和恢复
- 💾 **智能缓存**: 会话缓存和知识卡片缓存，提升加载速度

## 🎮 项目概述

这是一个为Hackathon比赛开发的创新项目，用户可以：
1. 上传任意物体的图片
2. AI识别物体并创建根节点
3. 点击节点递归拆解，直到达到自然原材料
4. 通过可视化的树状图展示物体的完整构成

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **可视化**: React Flow
- **AI**: 阿里云通义千问 (Qwen) / 自定义OpenAI兼容接口
- **动画**: Framer Motion
- **数据库**: PostgreSQL (Neon)
- **ORM**: Prisma 6
- **认证**: NextAuth.js
- **图片搜索**: Pixabay API

## 📦 安装步骤

1. 克隆项目并安装依赖：
```bash
git clone <repository-url>
cd break-it-down
npm install
```

2. 配置环境变量：
```bash
cp .env.local.example .env.local
```

3. 在 `.env.local` 中配置必要的环境变量：

```env
# 数据库配置 (使用 Neon 免费套餐)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # 使用 openssl rand -base64 32 生成

# AI API 配置 (二选一)
# 方式1: 阿里云通义千问
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# 方式2: 自定义OpenAI兼容接口
AI_BASE_URL=https://your-api-endpoint.com/v1
AI_API_KEY=your_api_key_here
AI_MODEL_VISION=gpt-4-vision-preview
AI_MODEL_TEXT=gpt-4

# Pixabay API (可选，用于搜索真实图片)
PIXABAY_API_KEY=your_pixabay_api_key_here
```

获取API Key:
- 通义千问: https://dashscope.console.aliyun.com/apiKey
- Neon数据库: https://neon.tech
- Pixabay: https://pixabay.com/api/docs/

4. 初始化数据库：
```bash
npx prisma generate
npx prisma db push
```

5. 启动开发服务器：
```bash
npm run dev
```

6. 打开浏览器访问 http://localhost:3000

## 🧪 测试 API

详细的API测试指南请查看 [API-TESTING.md](./API-TESTING.md)

快速测试:
```bash
# 测试物体拆解
curl -X POST http://localhost:3000/api/deconstruct \
  -H "Content-Type: application/json" \
  -d '{"itemName": "iPhone 15"}'
```

## 🚀 部署

### Vercel 部署（推荐）

1. 在 Vercel 上导入项目
2. 配置环境变量（与 .env.local 相同）
3. 部署完成

详细部署指南请查看 [README_DEPLOY.md](./README_DEPLOY.md)

### 本地生产构建
```bash
npm run build
npm start
```

## 📁 项目结构

```
break-it-down/
├── app/
│   ├── api/
│   │   ├── auth/              # NextAuth 认证端点
│   │   ├── identify/          # 图片识别API
│   │   ├── deconstruct/       # 物体拆解API
│   │   ├── knowledge/         # 知识卡片API
│   │   └── sessions/          # 会话管理API
│   ├── components/
│   │   ├── GraphView.tsx      # 主可视化组件
│   │   ├── MatterNode.tsx     # 自定义节点组件
│   │   ├── Sidebar.tsx        # 侧边栏历史记录
│   │   └── KnowledgeCard.tsx  # 知识卡片组件
│   ├── deconstruct/           # 拆解游戏页面
│   └── about/                 # 关于页面
├── lib/
│   ├── ai-client.ts           # AI客户端配置
│   ├── auth.ts                # NextAuth配置
│   └── db.ts                  # Prisma数据库客户端
├── prisma/
│   └── schema.prisma          # 数据库模型定义
└── package.json
```

## 🎯 核心功能

### 1. 用户认证
- 邮箱登录系统
- 安全的会话管理
- 个人数据隔离

### 2. 图片识别
- 用户上传图片
- AI识别主要物体
- 创建根节点

### 3. 递归拆解
- 点击节点触发AI分析
- 返回直接组成部分
- 自动判断是否为原材料
- 节点位置自动保存和恢复

### 4. 知识卡片
- 详细的制造流程说明
- 材料来源和用途
- 智能缓存机制

### 5. 历史管理
- 自动保存拆解会话
- 快速加载历史记录
- 会话缓存优化
- 保存AI风格和提示词设置

### 6. 终止条件
- 识别自然原材料（木材、水、沙子等）
- 标记为终止节点
- 视觉高亮显示"已收集"

## 🔑 API端点

### POST /api/auth/[...nextauth]
NextAuth.js 认证端点

### POST /api/identify
上传图片并识别物体
```typescript
// Request: FormData with 'image' file
// Response:
{
  "name": "iPhone 15",
  "category": "Electronic",
  "brief_description": "A modern smartphone...",
  "icon": "📱"
}
```

### POST /api/deconstruct
拆解物体到组成部分
```typescript
// Request:
{
  "itemName": "iPhone 15",
  "parentContext": "Electronic Device" // optional
}

// Response:
{
  "parent_item": "iPhone 15",
  "parts": [
    {
      "name": "Screen",
      "description": "Display component",
      "is_raw_material": false
    },
    ...
  ]
}
```

### POST /api/knowledge
获取组件的知识卡片
```typescript
// Request:
{
  "nodeName": "Screen",
  "parentContext": "iPhone 15"
}

// Response:
{
  "title": "Screen",
  "content": "Detailed manufacturing process...",
  "materials": ["Glass", "LCD", "..."],
  "process": "Manufacturing steps..."
}
```

### GET/POST/PUT/DELETE /api/sessions
会话管理端点
- GET: 获取用户的所有会话
- POST: 创建新会话
- PUT: 更新会话（自动保存）
- DELETE: 删除会话

## 📝 最新更新

### v2.0 (2026-02-20)
- ✅ 完整的用户认证系统（NextAuth.js + 邮箱登录）
- ✅ 历史记录管理和会话保存
- ✅ 节点拖拽位置自动保存和恢复
- ✅ 会话缓存和知识卡片缓存
- ✅ AI风格和提示词设置保存
- ✅ 拖拽事件触发即时保存
- ✅ 优化错误处理和加载状态
- ✅ Vercel 部署支持

### v1.0
- ✅ 基础拆解功能
- ✅ 图片识别
- ✅ 知识卡片
- ✅ 可视化图谱

## 🔧 开发计划

- [ ] 添加收集进度追踪
- [ ] 优化移动端体验
- [ ] 支持更多AI模型
- [ ] 添加分享功能

## 🤝 贡献

这是一个Hackathon项目，欢迎提出建议和改进！

## 📄 许可证

MIT License

## 🙏 致谢

本项目使用了以下优秀的开源项目和服务：
- Next.js - React 框架
- React Flow - 可视化图谱
- Prisma - 数据库ORM
- NextAuth.js - 认证系统
- Tailwind CSS - 样式框架
- 阿里云通义千问 - AI服务
- Neon - PostgreSQL 数据库
- Pixabay - 图片搜索API
