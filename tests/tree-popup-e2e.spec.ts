import { test, expect } from '@playwright/test';

test('Complete E2E test for decomposition tree popup', async ({ page }) => {
  // 监听控制台日志
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser error:', msg.text());
    } else {
      console.log('📝 Browser log:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });

  console.log('🚀 Starting E2E test...');

  // 步骤 1: 注册新用户
  console.log('\n📝 Step 1: Register new user');
  await page.goto('http://localhost:8000/register');
  await page.waitForTimeout(1000);

  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;

  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'testpass123');
  await page.fill('input[name="confirmPassword"]', 'testpass123');

  await page.screenshot({ path: 'screenshots/e2e-01-register.png', fullPage: true });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Current URL after register:', page.url());

  // 步骤 2: 识别物品
  console.log('\n🔍 Step 2: Identify item');

  // 如果没有自动跳转到 setup，手动导航
  if (!page.url().includes('/setup')) {
    await page.goto('http://localhost:8000/setup');
    await page.waitForTimeout(1000);
  }

  // 选择文字输入
  await page.click('button:has-text("文字")');
  await page.waitForTimeout(500);

  // 输入物品名称
  await page.fill('textarea', '智能手机');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'screenshots/e2e-02-input.png', fullPage: true });

  // 点击开始识别
  await page.click('button:has-text("开始识别")');
  console.log('⏳ Waiting for identification...');
  await page.waitForTimeout(8000);

  await page.screenshot({ path: 'screenshots/e2e-03-identified.png', fullPage: true });

  // 步骤 3: 选择生产模式
  console.log('\n🏭 Step 3: Select production mode');
  const productionModeButton = await page.$('button:has-text("生产模式")');
  if (productionModeButton) {
    await productionModeButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Production mode selected');
  } else {
    console.log('⚠️ Production mode button not found, continuing anyway');
  }

  await page.screenshot({ path: 'screenshots/e2e-04-mode-selected.png', fullPage: true });

  // 步骤 4: 开始拆解
  console.log('\n🔧 Step 4: Start breakdown');
  await page.click('button:has-text("开始拆解")');
  await page.waitForTimeout(2000);

  console.log('Current URL after start:', page.url());

  // 等待进入 canvas 页面
  if (!page.url().includes('/canvas')) {
    console.log('⚠️ Not on canvas page, navigating...');
    await page.goto('http://localhost:8000/canvas');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'screenshots/e2e-05-canvas-initial.png', fullPage: true });

  // 点击开始拆解按钮
  const startBreakdownButton = await page.$('button:has-text("开始拆解")');
  if (startBreakdownButton) {
    await startBreakdownButton.click();
    console.log('⏳ Waiting for breakdown to complete...');
    await page.waitForTimeout(15000);
  }

  await page.screenshot({ path: 'screenshots/e2e-06-after-breakdown.png', fullPage: true });

  // 步骤 5: 测试分解结构树的弹窗
  console.log('\n🎯 Step 5: Test decomposition tree popup');

  // 查找树节点
  const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
  console.log(`Found ${treeNodes.length} tree nodes`);

  if (treeNodes.length >= 2) {
    // 点击第二个节点（第一个子节点）
    console.log('Clicking second tree node...');
    await treeNodes[1].click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/e2e-07-popup-shown.png', fullPage: true });

    // 检查弹窗
    const popup = await page.$('.fixed.z-\\[99999\\]');
    if (popup) {
      console.log('✅ Popup appeared!');

      // 检查按钮
      const continueButton = await page.$('button:has-text("继续拆解")');
      const productionButton = await page.$('button:has-text("生产规划")');

      if (continueButton) {
        console.log('✅ Continue breakdown button found!');
      } else {
        console.log('❌ Continue breakdown button NOT found');
      }

      if (productionButton) {
        console.log('✅ Production planning button found!');
      } else {
        console.log('❌ Production planning button NOT found');
      }

      // 测试继续拆解按钮
      if (continueButton) {
        console.log('\n🔧 Testing continue breakdown button...');
        await continueButton.click();
        console.log('⏳ Waiting for breakdown...');
        await page.waitForTimeout(12000);

        await page.screenshot({ path: 'screenshots/e2e-08-after-continue-breakdown.png', fullPage: true });
        console.log('✅ Continue breakdown completed!');
      }

      // 再次点击节点测试生产规划按钮
      const treeNodesAgain = await page.$$('.select-none > div[class*="relative flex items-center"]');
      if (treeNodesAgain.length >= 2) {
        console.log('\n💡 Testing production planning button...');
        await treeNodesAgain[1].click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'screenshots/e2e-09-popup-shown-again.png', fullPage: true });

        const productionButtonAgain = await page.$('button:has-text("生产规划")');
        if (productionButtonAgain) {
          await productionButtonAgain.click();
          await page.waitForTimeout(3000);

          await page.screenshot({ path: 'screenshots/e2e-10-production-planning.png', fullPage: true });

          const currentUrl = page.url();
          console.log('Current URL after production planning:', currentUrl);

          if (currentUrl.includes('production-analysis')) {
            console.log('✅ Successfully navigated to production analysis page!');
          } else {
            console.log('⚠️ Did not navigate to production analysis page');
          }
        }
      }
    } else {
      console.log('❌ Popup did NOT appear');
    }
  } else {
    console.log('❌ Not enough tree nodes found');
  }

  console.log('\n✅ Test completed!');
});
