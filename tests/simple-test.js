import { chromium } from 'playwright';

async function simpleTest() {
  console.log('开始简单测试...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:4000');
    console.log('✓ 页面已加载\n');

    // 输入产品名称
    await page.fill('#productName', '白色金属闹钟');
    console.log('✓ 已输入产品名称\n');

    // 点击开始分析
    await page.click('#startBtn');
    console.log('✓ 已点击开始分析\n');

    // 等待零件树加载
    console.log('等待零件树加载...');
    await page.waitForSelector('.part-item', { timeout: 10000 });
    console.log('✓ 零件树已加载\n');

    // 获取零件数量
    const partItems = await page.$$('.part-item');
    console.log(`零件数量: ${partItems.length}\n`);

    // 显示每个零件的名称
    for (let i = 0; i < partItems.length; i++) {
      const partName = await partItems[i].textContent();
      console.log(`零件 ${i + 1}: ${partName.trim()}`);
    }

    console.log('\n✓ 测试成功！\n');
    console.log('浏览器将保持打开60秒...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('已保存错误截图: error-screenshot.png');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);
