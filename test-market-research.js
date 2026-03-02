const { chromium } = require('playwright');

async function testMarketResearch() {
  console.log('启动浏览器测试...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 访问应用
    console.log('1. 访问应用 http://localhost:3001');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // 2. 查找并点击"竞品分析"相关按钮
    console.log('2. 查找竞品分析入口...');

    // 截图查看当前页面
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/screenshot-1-home.png' });
    console.log('   截图已保存: screenshot-1-home.png');

    // 等待用户手动操作到市场调研页面
    console.log('\n请手动操作到"市场调研"页面，然后按回车继续...');
    console.log('（或者等待30秒后自动继续）');

    await page.waitForTimeout(30000);

    // 3. 检查快速摘要是否显示
    console.log('3. 检查页面状态...');
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/screenshot-2-current.png' });
    console.log('   截图已保存: screenshot-2-current.png');

    // 检查是否有快速摘要相关元素
    const quickSummaryTitle = await page.locator('text=快速摘要').count();
    const continueButton = await page.locator('text=继续下一步').count();
    const fullReportButton = await page.locator('text=查看完整报告').count();

    console.log('\n页面元素检查:');
    console.log(`   - 快速摘要标题: ${quickSummaryTitle > 0 ? '✓ 存在' : '✗ 不存在'}`);
    console.log(`   - 继续下一步按钮: ${continueButton > 0 ? '✓ 存在' : '✗ 不存在'}`);
    console.log(`   - 查看完整报告按钮: ${fullReportButton > 0 ? '✓ 存在' : '✗ 不存在'}`);

    // 4. 如果找到按钮，测试点击
    if (continueButton > 0) {
      console.log('\n4. 测试"继续下一步"按钮...');
      await page.locator('text=继续下一步').click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/screenshot-3-after-continue.png' });
      console.log('   点击后截图已保存: screenshot-3-after-continue.png');

      // 检查是否进入下一个页面
      const url = page.url();
      console.log(`   当前URL: ${url}`);
    }

    console.log('\n测试完成！请查看截图文件。');
    console.log('浏览器将保持打开状态，按 Ctrl+C 退出。');

    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('测试出错:', error);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/screenshot-error.png' });
  } finally {
    await browser.close();
  }
}

testMarketResearch();
