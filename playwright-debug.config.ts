import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 调试配置
 * 用于本地调试和 MCP 集成
 */
export default defineConfig({
  testDir: './tests',

  // 调试模式：不并行执行
  fullyParallel: false,
  workers: 1,

  // 调试时不限制重试
  retries: 0,

  // 使用详细的报告器
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',

    // 调试配置
    trace: 'on',  // 始终记录 trace
    screenshot: 'on',  // 始终截图
    video: 'on',  // 始终录制视频

    // 慢动作执行，便于观察
    slowMo: 500,

    // 显示浏览器
    headless: false,

    // 增加超时时间
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // 超时配置
  timeout: 120000,  // 2分钟测试超时
  expect: {
    timeout: 10000,  // 10秒断言超时
  },

  projects: [
    {
      name: 'chromium-debug',
      use: {
        ...devices['Desktop Chrome'],
        // 启用开发者工具
        launchOptions: {
          devtools: true,
        },
      },
    },
  ],

  // 自动启动开发服务器
  webServer: {
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
