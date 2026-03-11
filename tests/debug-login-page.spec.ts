import { test, expect } from '@playwright/test';

test.describe('调试登录页面 500 错误', () => {
  test('捕获登录页面的详细错误信息', async ({ page }) => {
    // 监听所有控制台消息
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // 监听页面错误
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(`[PAGE ERROR] ${error.message}\n${error.stack}`);
    });

    // 监听网络请求失败
    const failedRequests: any[] = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
      });
    });

    // 监听响应
    const responses: any[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    console.log('\n🔍 开始访问登录页面...\n');

    try {
      // 访问登录页面
      const response = await page.goto('http://localhost:3000/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      console.log(`📊 响应状态: ${response?.status()}`);
      console.log(`📊 响应状态文本: ${response?.statusText()}`);

      // 等待一下让所有资源加载
      await page.waitForTimeout(2000);

      // 获取页面内容
      const pageContent = await page.content();
      console.log('\n📄 页面内容长度:', pageContent.length);

      // 检查是否有错误页面
      const hasErrorPage = pageContent.includes('Application error') ||
                          pageContent.includes('500') ||
                          pageContent.includes('Internal Server Error');

      if (hasErrorPage) {
        console.log('\n❌ 检测到错误页面');

        // 尝试提取错误信息
        const errorMatch = pageContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        if (errorMatch) {
          console.log('\n🔴 错误详情:\n', errorMatch[1].substring(0, 500));
        }
      }

      // 截图
      await page.screenshot({
        path: 'screenshots/login-error.png',
        fullPage: true
      });
      console.log('\n📸 截图已保存: screenshots/login-error.png');

    } catch (error: any) {
      console.log('\n❌ 访问失败:', error.message);
    }

    // 输出收集的信息
    console.log('\n📋 控制台消息 (' + consoleMessages.length + ' 条):');
    consoleMessages.slice(0, 10).forEach(msg => console.log('  ', msg));

    console.log('\n🚨 页面错误 (' + pageErrors.length + ' 条):');
    pageErrors.forEach(err => console.log('  ', err));

    console.log('\n❌ 失败的请求 (' + failedRequests.length + ' 条):');
    failedRequests.forEach(req => console.log('  ', JSON.stringify(req, null, 2)));

    console.log('\n⚠️  错误响应 (' + responses.length + ' 条):');
    responses.forEach(res => console.log('  ', JSON.stringify(res, null, 2)));

    // 检查服务器日志
    console.log('\n💡 建议检查服务器控制台日志以获取更多信息');
  });

  test('测试其他页面是否正常', async ({ page }) => {
    console.log('\n🔍 测试其他页面...\n');

    const pages = [
      { url: '/', name: '首页' },
      { url: '/register', name: '注册页面' },
      { url: '/about', name: '关于页面' },
    ];

    for (const pageInfo of pages) {
      try {
        const response = await page.goto(`http://localhost:3000${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });

        const status = response?.status() || 0;
        const icon = status === 200 ? '✅' : '❌';
        console.log(`${icon} ${pageInfo.name}: ${status}`);

      } catch (error: any) {
        console.log(`❌ ${pageInfo.name}: 失败 - ${error.message}`);
      }
    }
  });
});
