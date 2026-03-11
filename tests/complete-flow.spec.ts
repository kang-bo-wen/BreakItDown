import { test, expect } from '@playwright/test';

test('Complete production analysis flow', async ({ page }) => {
  // 1. 注册
  await page.goto('http://localhost:8000/register');
  const timestamp = Date.now();
  const testEmail = `prod${timestamp}@example.com`;

  await page.fill('input#name', 'Prod User');
  await page.fill('input#email', testEmail);
  await page.fill('input#password', 'testpassword123');
  await page.fill('input#confirmPassword', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/setup', { timeout: 10000 });
  console.log('✓ Registered and navigated to setup');

  // 2. 输入并识别
  await page.click('button:has-text("文字")');
  await page.fill('textarea', '四足机器人');
  await page.click('button:has-text("开始识别")');
  await page.waitForTimeout(6000); // 等待AI识别
  console.log('✓ Identified item');

  // 3. 选择生产模式
  await page.click('button:has-text("生产模式")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/flow-01-production-mode.png', fullPage: true });
  console.log('✓ Selected production mode');

  // 4. 导航到 canvas
  await page.click('button:has-text("开始拆解")');
  await page.waitForURL('**/canvas**', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('✓ Navigated to canvas');

  // 5. 点击"开始拆解"按钮
  const startButton = await page.waitForSelector('button:has-text("开始拆解")', { timeout: 5000 });
  await startButton.click();
  console.log('✓ Clicked start deconstruction button');

  // 6. 等待拆解完成
  await page.waitForTimeout(15000);
  await page.screenshot({ path: 'screenshots/flow-02-after-deconstruction.png', fullPage: true });

  // 7. 检查 breakdownMode
  const breakdownMode = await page.evaluate(() => {
    const setupData = localStorage.getItem('setupState');
    return setupData ? JSON.parse(setupData).breakdownMode : null;
  });
  console.log('Breakdown mode:', breakdownMode);

  // 8. 查找生产分析按钮
  const productionButtons = await page.$$('button[title="查看生产分析"]');
  console.log(`Found ${productionButtons.length} production analysis buttons`);

  // 9. 如果没有找到，检查树节点
  if (productionButtons.length === 0) {
    // 检查是否有树节点
    const treeNodes = await page.$$('[class*="select-none"]');
    console.log(`Found ${treeNodes.length} tree nodes`);

    // 获取第一个树节点的HTML
    if (treeNodes.length > 0) {
      const firstNodeHTML = await treeNodes[0].innerHTML();
      console.log('First node HTML:', firstNodeHTML.substring(0, 500));
    }

    // 检查页面上是否有 "🏭" emoji
    const hasFactoryEmoji = await page.evaluate(() => {
      return document.body.innerText.includes('🏭');
    });
    console.log('Has factory emoji:', hasFactoryEmoji);
  } else {
    // 点击第一个生产分析按钮
    await productionButtons[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/flow-03-production-analysis.png', fullPage: true });

    const url = page.url();
    console.log('Current URL after clicking:', url);
    expect(url).toContain('/production-analysis');
  }
});
