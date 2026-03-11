# 🎭 Playwright MCP 本地调试指南

## 📋 概述

本指南帮助你配置和使用 Playwright MCP (Model Context Protocol) 进行本地调试。

## 🚀 快速开始

### 1. 确认安装

项目已经安装了必要的依赖：
- `@playwright/test` - Playwright 测试框架
- `@playwright/mcp` - Playwright MCP 服务器

### 2. 配置文件说明

#### `playwright-debug.config.ts`
调试专用的 Playwright 配置：
- 启用慢动作执行（slowMo: 500ms）
- 显示浏览器窗口（headless: false）
- 自动打开开发者工具
- 记录完整的 trace、截图和视频
- 增加超时时间

#### `mcp-config.json`
MCP 服务器配置：
- 配置 Playwright MCP 服务器
- 可以被 Claude Code 或其他 MCP 客户端使用

#### `tests/mcp-debug.spec.ts`
调试测试文件：
- 完整流程测试
- 交互式调试模式

## 🎮 使用方法

### 方法 1: 使用调试配置运行测试

```bash
# 进入项目目录
cd "c:\Users\25066\Desktop\备份\BreakItDown"

# 使用调试配置运行所有测试
npx playwright test --config=playwright-debug.config.ts

# 运行特定的调试测试
npx playwright test tests/mcp-debug.spec.ts --config=playwright-debug.config.ts

# 运行交互式调试
npx playwright test tests/mcp-debug.spec.ts --config=playwright-debug.config.ts --grep="交互式调试"
```

### 方法 2: 使用 Playwright UI 模式

```bash
# 启动 Playwright UI（推荐用于调试）
npx playwright test --ui --config=playwright-debug.config.ts

# 或者使用默认配置
npx playwright test --ui
```

UI 模式特点：
- 可视化测试执行
- 实时查看浏览器状态
- 单步执行测试
- 查看 DOM 快照
- 时间旅行调试

### 方法 3: 使用 Playwright Inspector

```bash
# 启动 Inspector 进行逐步调试
npx playwright test tests/mcp-debug.spec.ts --debug

# 或者在测试中添加断点
# 在代码中添加: await page.pause();
```

### 方法 4: 通过 Claude Code 使用 MCP

如果你使用 Claude Code CLI，可以配置 MCP 服务器：

1. 将 `mcp-config.json` 的内容添加到 Claude Code 配置中
2. 或者在 `.claude/settings.json` 中添加 MCP 配置

## 🔍 调试技巧

### 1. 查看测试报告

```bash
# 运行测试后查看 HTML 报告
npx playwright show-report
```

### 2. 查看 Trace

```bash
# 打开 trace 查看器
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 3. 截图和视频

测试运行后，查看以下目录：
- `screenshots/` - 测试截图
- `test-results/` - 测试结果、视频和 trace
- `playwright-report/` - HTML 测试报告

### 4. 控制台输出

调试测试会输出详细的日志：
- 浏览器控制台消息
- 页面错误
- 请求失败
- 测试步骤

### 5. 选择器调试

```bash
# 使用 Playwright 的选择器工具
npx playwright codegen http://localhost:3000
```

这会打开浏览器并记录你的操作，生成测试代码。

## 📝 常见调试场景

### 场景 1: 调试树节点弹窗

```bash
# 运行完整流程测试
npx playwright test tests/mcp-debug.spec.ts --config=playwright-debug.config.ts --grep="完整流程"
```

测试会：
1. 等待 30 秒让你手动设置
2. 自动测试树节点弹窗
3. 生成详细的截图和日志

### 场景 2: 手动交互调试

```bash
# 运行交互式调试
npx playwright test tests/mcp-debug.spec.ts --config=playwright-debug.config.ts --grep="交互式"
```

浏览器会保持打开 5 分钟，你可以：
- 手动操作页面
- 在开发者工具中检查元素
- 测试各种交互

### 场景 3: 调试特定测试

```bash
# 使用 --debug 标志
npx playwright test tests/manual-tree-popup.spec.ts --debug

# 或者在测试代码中添加断点
# await page.pause();
```

## 🛠️ 配置 MCP 服务器

### 在 Claude Code 中使用

1. 编辑 `.claude/settings.json`：

```json
{
  "permissions": {
    "allow": [
      "Bash(npx playwright test*)",
      "Bash(npx playwright show-report)",
      "Bash(npx playwright codegen*)"
    ]
  },
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    }
  }
}
```

2. 重启 Claude Code

3. 现在可以通过 Claude Code 与 Playwright 交互

### MCP 服务器功能

通过 MCP，你可以：
- 启动浏览器会话
- 导航到页面
- 执行操作（点击、输入等）
- 截图
- 提取页面内容
- 运行测试

## 📊 性能分析

### 启用性能追踪

在测试中添加：

```typescript
await page.tracing.start({ screenshots: true, snapshots: true });
// ... 执行操作
await page.tracing.stop({ path: 'trace.zip' });
```

### 查看性能数据

```bash
npx playwright show-trace trace.zip
```

## 🐛 常见问题

### 问题 1: 浏览器未打开

**解决方案：**
- 确保使用 `--config=playwright-debug.config.ts`
- 或者在命令中添加 `--headed`

### 问题 2: 测试超时

**解决方案：**
- 调试配置已增加超时时间
- 可以在测试中添加 `test.setTimeout(300000)` 设置更长的超时

### 问题 3: 选择器找不到元素

**解决方案：**
- 使用 `npx playwright codegen` 生成正确的选择器
- 添加等待：`await page.waitForSelector('selector')`
- 使用更宽松的选择器

### 问题 4: MCP 服务器无法启动

**解决方案：**
- 确保已安装 `@playwright/mcp`
- 运行 `npx playwright install` 安装浏览器
- 检查 Node.js 版本 >= 18

## 📚 更多资源

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 调试指南](https://playwright.dev/docs/debug)
- [MCP 协议文档](https://modelcontextprotocol.io)

## 🎯 下一步

1. 运行交互式调试熟悉环境
2. 使用 UI 模式查看测试执行
3. 编写自己的调试测试
4. 配置 MCP 服务器与 Claude Code 集成

祝调试顺利！🎉
