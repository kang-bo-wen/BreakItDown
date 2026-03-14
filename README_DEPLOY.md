# 导航功能 - 部署说明

## 这是什么

纯静态 HTML/CSS/JS 的 scroll 叙事导航，共 8 个场景（Scene 0-7），以"无限细分的到来。"结尾。
无任何框架依赖，可直接部署到任意静态托管平台。

## 文件结构

```
index.html   # 主页面，包含所有 8 个 scene
style.css    # 样式
main.js      # scroll 引擎（wheel/touch/keyboard 三端支持）
```

## 当前公网部署信息

已部署到 **ModelScope Space**，配置如下：

- 平台：[ModelScope](https://modelscope.cn)
- 仓库：`https://github.com/kang-bo-wen/BreakItDown.git`
- 当前生产分支：`kang`
- Space 类型：Docker
- 端口：7860（ModelScope 标准端口）

### 生产环境变量（Next.js 主应用）

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEXTAUTH_URL=https://your-space-name.modelscope.cn
NEXTAUTH_SECRET=<openssl rand -base64 32 生成>
DASHSCOPE_API_KEY=your_dashscope_key   # 通义千问
AI_BASE_URL=https://your-api.com/v1    # 或自定义 AI API
AI_API_KEY=your_key
AI_MODEL_VISION=gemini-3-flash-preview
AI_MODEL_TEXT=gemini-3-flash-preview
PIXABAY_API_KEY=your_pixabay_key
```

### 更新生产部署

1. push 代码到 GitHub `kang` 分支
2. 在 ModelScope Space 控制台点击"重新构建"
3. 等待约 5-10 分钟构建完成

## 迁移到新项目

这个导航功能是独立的静态模块，迁移时只需：

1. 复制 `index.html` / `style.css` / `main.js` 三个文件
2. 按需修改 scene 内容（每个 `<div class="scene">` 是一个独立页面）
3. 添加新 scene 时同步在 `style.css` 末尾添加对应 `.bg-N` 背景样式
4. `main.js` 无需修改，自动适配 scene 数量

### 集成到 Next.js / React 项目

可将 `main.js` 的逻辑改写为 React hook，或直接用 `<iframe>` 嵌入静态页面。
scroll 引擎核心逻辑在 `main.js` 的 `setSceneState()` 和 `render()` 函数。
