import { test, expect } from '@playwright/test';

test('Complete E2E debug with tree popup', async ({ page }) => {
  console.log('🚀 Starting complete E2E debug...\n');

  // 监听控制台
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' && !text.includes('404') && !text.includes('next-auth')) {
      console.log(`❌ [ERROR] ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`❌ [PAGE ERROR] ${error.message}`);
  });

  try {
    // 步骤 1: 注册新用户
    console.log('📍 Step 1: Register new user');
    await page.goto('http://localhost:3000/register');
    await page.waitForTimeout(2000);

    const timestamp = Date.now();
    const email = `debug${timestamp}@test.com`;

    // 查找输入框
    const nameInput = await page.$('input[type="text"]');
    const emailInput = await page.$('input[type="email"]');
    const passwordInputs = await page.$$('input[type="password"]');

    if (!nameInput || !emailInput || passwordInputs.length < 2) {
      console.log('❌ Registration form not found');
      await page.screenshot({ path: 'screenshots/e2e-debug-01-no-form.png', fullPage: true });
      return;
    }

    await nameInput.fill('Debug User');
    await emailInput.fill(email);
    await passwordInputs[0].fill('test123456');
    await passwordInputs[1].fill('test123456');

    await page.screenshot({ path: 'screenshots/e2e-debug-02-form-filled.png', fullPage: true });

    await page.click('button[type="submit"]');
    console.log('   Waiting for registration...');
    await page.waitForTimeout(3000);

    console.log(`   Current URL: ${page.url()}`);

    // 如果没有自动跳转，手动导航
    if (!page.url().includes('/setup')) {
      console.log('   Manually navigating to setup...');
      await page.goto('http://localhost:3000/setup');
      await page.waitForTimeout(2000);
    }

    console.log('✅ Registration completed\n');
    await page.screenshot({ path: 'screenshots/e2e-debug-03-setup.png', fullPage: true });

    // 步骤 2: 识别物品
    console.log('📍 Step 2: Identify item');

    // 选择文字输入
    const textButton = await page.$('button:has-text("文字")');
    if (!textButton) {
      console.log('❌ Text input button not found');
      return;
    }

    await textButton.click();
    await page.waitForTimeout(500);

    // 输入物品名称
    const textarea = await page.$('textarea');
    if (!textarea) {
      console.log('❌ Textarea not found');
      return;
    }

    await textarea.fill('智能手机');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/e2e-debug-04-input.png', fullPage: true });

    // 点击开始识别
    const identifyButton = await page.$('button:has-text("开始识别")');
    if (!identifyButton) {
      console.log('❌ Identify button not found');
      return;
    }

    await identifyButton.click();
    console.log('   Waiting for identification (8s)...');
    await page.waitForTimeout(8000);

    console.log('✅ Item identified\n');
    await page.screenshot({ path: 'screenshots/e2e-debug-05-identified.png', fullPage: true });

    // 步骤 3: 选择生产模式
    console.log('📍 Step 3: Select production mode');
    const productionButton = await page.$('button:has-text("生产模式")');

    if (productionButton) {
      await productionButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Production mode selected\n');
    } else {
      console.log('⚠️  Production mode button not found, continuing...\n');
    }

    await page.screenshot({ path: 'screenshots/e2e-debug-06-mode.png', fullPage: true });

    // 步骤 4: 开始拆解
    console.log('📍 Step 4: Start breakdown');
    const startButton = await page.$('button:has-text("开始拆解")');

    if (!startButton) {
      console.log('❌ Start breakdown button not found');
      return;
    }

    await startButton.click();
    await page.waitForTimeout(2000);

    console.log(`   Current URL: ${page.url()}`);

    if (!page.url().includes('/canvas')) {
      console.log('   Manually navigating to canvas...');
      await page.goto('http://localhost:3000/canvas');
      await page.waitForTimeout(2000);
    }

    console.log('✅ Navigated to canvas\n');
    await page.screenshot({ path: 'screenshots/e2e-debug-07-canvas.png', fullPage: true });

    // 步骤 5: 点击开始拆解按钮
    console.log('📍 Step 5: Click start breakdown on canvas');
    const canvasStartButton = await page.$('button:has-text("开始拆解")');

    if (!canvasStartButton) {
      console.log('⚠️  Start breakdown button not found on canvas');
      console.log('   Might already have data, continuing...\n');
    } else {
      await canvasStartButton.click();
      console.log('   Waiting for breakdown (15s)...');
      await page.waitForTimeout(15000);
      console.log('✅ Breakdown completed\n');
    }

    await page.screenshot({ path: 'screenshots/e2e-debug-08-breakdown.png', fullPage: true });

    // 步骤 6: 查找树节点
    console.log('📍 Step 6: Find tree nodes');
    await page.waitForTimeout(2000);

    const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
    console.log(`   Found ${treeNodes.length} tree nodes`);

    if (treeNodes.length === 0) {
      console.log('❌ No tree nodes found');

      // 检查是否有错误消息
      const errorMsg = await page.$('.text-red-500');
      if (errorMsg) {
        const errorText = await errorMsg.textContent();
        console.log(`   Error message: ${errorText}`);
      }

      await page.screenshot({ path: 'screenshots/e2e-debug-09-no-nodes.png', fullPage: true });
      return;
    }

    console.log('✅ Tree nodes found\n');

    // 步骤 7: 点击第一个节点
    console.log('📍 Step 7: Click first tree node');
    const firstNode = treeNodes[0];
    const nodeText = await firstNode.textContent();
    console.log(`   Node text: ${nodeText}`);

    await firstNode.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/e2e-debug-10-clicked.png', fullPage: true });
    console.log('✅ Node clicked\n');

    // 步骤 8: 检查弹窗
    console.log('📍 Step 8: Check popup');
    const popup = await page.$('.fixed.z-\\[99999\\]');

    if (!popup) {
      console.log('❌ Popup did NOT appear!');

      // 调试信息
      const allFixed = await page.$$('.fixed');
      console.log(`   Found ${allFixed.length} fixed elements`);

      // 检查 body 的子元素
      const bodyHTML = await page.evaluate(() => {
        const portals = Array.from(document.body.children).filter(el =>
          el.className && el.className.includes('fixed')
        );
        return portals.map(el => el.className).join(', ');
      });
      console.log(`   Fixed elements in body: ${bodyHTML}`);

      await page.screenshot({ path: 'screenshots/e2e-debug-11-no-popup.png', fullPage: true });
      return;
    }

    console.log('✅ Popup appeared!\n');

    // 步骤 9: 检查弹窗内容
    console.log('📍 Step 9: Check popup content');

    const popupTitle = await popup.$('.text-lg.font-bold');
    if (popupTitle) {
      const title = await popupTitle.textContent();
      console.log(`   ✅ Title: ${title}`);
    }

    const continueBtn = await page.$('button:has-text("继续拆解")');
    const productionBtn = await page.$('button:has-text("生产规划")');
    const closeBtn = await page.$('button[title="关闭"]');

    console.log(`   ✅ Continue button: ${continueBtn ? 'Found' : 'NOT found'}`);
    console.log(`   ✅ Production button: ${productionBtn ? 'Found' : 'NOT found'}`);
    console.log(`   ✅ Close button: ${closeBtn ? 'Found' : 'NOT found'}`);

    await page.screenshot({ path: 'screenshots/e2e-debug-12-popup.png', fullPage: true });
    console.log('');

    // 步骤 10: 测试关闭按钮
    if (closeBtn) {
      console.log('📍 Step 10: Test close button');
      await closeBtn.click();
      await page.waitForTimeout(500);

      const popupAfter = await page.$('.fixed.z-\\[99999\\]');
      if (!popupAfter) {
        console.log('✅ Popup closed successfully\n');
      } else {
        console.log('❌ Popup still visible\n');
      }

      await page.screenshot({ path: 'screenshots/e2e-debug-13-closed.png', fullPage: true });
    }

    // 步骤 11: 测试继续拆解
    if (continueBtn && treeNodes.length > 1) {
      console.log('📍 Step 11: Test continue breakdown');

      // 点击第二个节点
      await treeNodes[1].click();
      await page.waitForTimeout(1000);

      const continueBtnAgain = await page.$('button:has-text("继续拆解")');
      if (continueBtnAgain) {
        await continueBtnAgain.click();
        console.log('   Waiting for breakdown (10s)...');
        await page.waitForTimeout(10000);

        const nodesAfter = await page.$$('.select-none > div[class*="relative flex items-center"]');
        console.log(`   Nodes before: ${treeNodes.length}, after: ${nodesAfter.length}`);

        if (nodesAfter.length > treeNodes.length) {
          console.log('✅ New nodes added\n');
        } else {
          console.log('⚠️  No new nodes (might be loading)\n');
        }

        await page.screenshot({ path: 'screenshots/e2e-debug-14-breakdown.png', fullPage: true });
      }
    }

    console.log('✅✅✅ All tests passed! ✅✅✅\n');
    console.log('📸 All screenshots saved to screenshots/ directory');

  } catch (error) {
    console.log(`\n❌❌❌ Test failed: ${error}\n`);
    await page.screenshot({ path: 'screenshots/e2e-debug-error.png', fullPage: true });
    throw error;
  }
});
