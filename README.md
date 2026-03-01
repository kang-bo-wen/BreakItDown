# Playwright MCP 配置说明

## ✅ 安装状态

**状态**: 已完成安装和测试，无 bug

**测试日期**: 2026-03-01

## 已完成的配置

### 1. 安装的包
- `@playwright/mcp` (v0.0.68) - Playwright 官方 MCP 服务器
- Chromium 浏览器 (v1212) - 已安装并配置

### 2. 配置文件

#### Claude Desktop 配置
- 位置: `C:\Users\25066\AppData\Roaming\Claude\claude_desktop_config.json`
- 配置: 使用 Chromium 浏览器，headless 模式
- 这个配置会让 Claude Desktop 自动加载 Playwright MCP 服务器

#### 本地配置示例
- 位置: `playwright-mcp-config.json`
- 可用于其他 MCP 客户端

### 3. 测试文件
- `test-mcp-full.js` - 完整的 MCP 协议测试
- `test-browser-automation.js` - 基础浏览器自动化测试
- `test-advanced-interaction.js` - 高级交互功能测试

## 测试结果

### ✅ 基础功能测试
- ✓ MCP 服务器初始化成功
- ✓ 浏览器导航功能正常
- ✓ 页面快照功能正常
- ✓ 控制台消息获取正常
- ✓ 网络请求监控正常
- ✓ 浏览器关闭功能正常

### ✅ 高级交互测试
- ✓ 浏览器窗口调整
- ✓ 标签页管理（列表、创建、切换）
- ✓ 多标签页导航
- ✓ 后退/前进导航
- ✓ JavaScript 代码执行
- ✓ 页面元素交互

### ✅ 可用工具 (22个)
1. browser_navigate - 导航到 URL
2. browser_snapshot - 获取页面快照（推荐）
3. browser_take_screenshot - 截图
4. browser_click - 点击元素
5. browser_type - 输入文本
6. browser_fill_form - 填充表单
7. browser_hover - 鼠标悬停
8. browser_drag - 拖拽元素
9. browser_select_option - 选择下拉选项
10. browser_press_key - 按键
11. browser_evaluate - 执行 JavaScript
12. browser_run_code - 运行 Playwright 代码
13. browser_tabs - 标签页管理
14. browser_navigate_back - 后退
15. browser_resize - 调整窗口大小
16. browser_close - 关闭浏览器
17. browser_console_messages - 获取控制台消息
18. browser_network_requests - 获取网络请求
19. browser_handle_dialog - 处理对话框
20. browser_file_upload - 上传文件
21. browser_wait_for - 等待元素或时间
22. browser_install - 安装浏览器

## 使用方法

### 在 Claude Desktop 中使用
1. 重启 Claude Desktop 应用
2. MCP 服务器会自动加载
3. 你可以使用 Playwright 相关的工具来自动化浏览器操作

### 直接运行 MCP 服务器
```bash
npx @playwright/mcp@latest --browser chromium --headless
```

### 运行测试
```bash
# 完整功能测试
node test-mcp-full.js

# 基础浏览器自动化测试
node test-browser-automation.js

# 高级交互测试
node test-advanced-interaction.js
```

## 主要功能

- **浏览器自动化**: 使用 Playwright 进行网页自动化
- **无需截图**: 基于可访问性树，不需要视觉模型
- **LLM 友好**: 纯结构化数据操作
- **支持多浏览器**: Chrome, Firefox, WebKit, Chromium
- **Headless 模式**: 后台运行，不显示浏览器窗口

## 配置选项

可以在配置文件的 `args` 数组中添加以下选项：

- `--browser <browser>`: 指定浏览器 (chrome, firefox, webkit, chromium)
- `--headless`: 无头模式运行
- `--allowed-hosts <hosts>`: 允许访问的主机列表
- `--caps <caps>`: 启用额外功能 (vision, pdf, devtools)

示例：
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser",
        "chromium",
        "--headless"
      ]
    }
  }
}
```

## 故障排除

### 问题: 浏览器未找到
**解决方案**: 运行 `npx playwright install chromium` 安装浏览器

### 问题: Chrome 未找到
**解决方案**: 使用 `--browser chromium` 参数，或安装 Chrome 浏览器

### 问题: MCP 服务器无响应
**解决方案**: 检查配置文件格式是否正确，重启 Claude Desktop

## 文档链接

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Playwright 文档](https://playwright.dev)
