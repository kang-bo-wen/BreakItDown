import { test, expect } from '@playwright/test';

test('Test decomposition tree node popup with continue breakdown and production planning', async ({ page }) => {
  // 监听控制台日志
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  // 直接导航到 setup 页面（假设已登录）
  await page.goto('http://localhost:8000/setup');
  await page.waitForTimeout(2000);

  // 识别
  await page.click('button:has-text("文字")');
  await page.fill('textarea', '四足机器人');
  await page.click('button:has-text("开始识别")');
  await page.waitForTimeout(6000);

  // 选择生产模式
  await page.click('button:has-text("生产模式")');
  await page.waitForTimeout(500);

  // 导航到 canvas
  await page.click('button:has-text("开始拆解")');
  await page.waitForURL('**/canvas**');
  await page.waitForTimeout(2000);

  // 点击开始拆解
  await page.click('button:has-text("开始拆解")');
  console.log('Waiting for initial breakdown...');
  await page.waitForTimeout(15000);

  // 截图：初始状态
  await page.screenshot({ path: 'screenshots/tree-popup-01-initial.png', fullPage: true });

  // 查找分解结构中的第一个节点（不是根节点）
  console.log('Looking for tree nodes...');

  // 等待树节点出现
  await page.waitForSelector('.select-none', { timeout: 10000 });

  // 获取所有树节点
  const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
  console.log(`Found ${treeNodes.length} tree nodes`);

  if (treeNodes.length < 2) {
    console.log('Not enough tree nodes found, waiting longer...');
    await page.waitForTimeout(5000);
  }

  // 点击第二个节点（第一个子节点）
  if (treeNodes.length >= 2) {
    console.log('Clicking on the second tree node...');
    await treeNodes[1].click();
    await page.waitForTimeout(1000);

    // 截图：弹窗出现
    await page.screenshot({ path: 'screenshots/tree-popup-02-popup-shown.png', fullPage: true });

    // 检查弹窗是否出现
    const popup = await page.$('.fixed.z-\\[99999\\]');
    expect(popup).not.toBeNull();
    console.log('Popup appeared!');

    // 检查"继续拆解"按钮是否存在
    const continueBreakdownButton = await page.$('button:has-text("继续拆解")');
    expect(continueBreakdownButton).not.toBeNull();
    console.log('Continue breakdown button found!');

    // 检查"生产规划"按钮是否存在
    const productionPlanningButton = await page.$('button:has-text("生产规划")');
    expect(productionPlanningButton).not.toBeNull();
    console.log('Production planning button found!');

    // 测试"继续拆解"按钮
    console.log('Testing continue breakdown button...');
    await continueBreakdownButton!.click();
    await page.waitForTimeout(10000); // 等待拆解完成

    // 截图：拆解后
    await page.screenshot({ path: 'screenshots/tree-popup-03-after-breakdown.png', fullPage: true });

    // 再次点击节点，测试"生产规划"按钮
    console.log('Clicking on tree node again...');
    const treeNodesAgain = await page.$$('.select-none > div[class*="relative flex items-center"]');
    if (treeNodesAgain.length >= 2) {
      await treeNodesAgain[1].click();
      await page.waitForTimeout(1000);

      // 截图：弹窗再次出现
      await page.screenshot({ path: 'screenshots/tree-popup-04-popup-shown-again.png', fullPage: true });

      // 测试"生产规划"按钮
      const productionPlanningButtonAgain = await page.$('button:has-text("生产规划")');
      if (productionPlanningButtonAgain) {
        console.log('Testing production planning button...');
        await productionPlanningButtonAgain.click();
        await page.waitForTimeout(3000);

        // 截图：生产规划页面
        await page.screenshot({ path: 'screenshots/tree-popup-05-production-planning.png', fullPage: true });

        // 检查是否跳转到生产分析页面
        const currentUrl = page.url();
        console.log('Current URL after production planning click:', currentUrl);
      }
    }

    console.log('Test completed successfully!');
  } else {
    console.log('ERROR: Not enough tree nodes found');
    await page.screenshot({ path: 'screenshots/tree-popup-error.png', fullPage: true });
  }
});
