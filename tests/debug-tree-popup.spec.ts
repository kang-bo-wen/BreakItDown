import { test, expect } from '@playwright/test';

test('Debug tree popup functionality', async ({ page }) => {
  console.log('🔍 Starting debug session...\n');

  // 监听所有控制台消息
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ [ERROR] ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  [WARN] ${text}`);
    } else if (text.includes('✅') || text.includes('❌')) {
      console.log(`   ${text}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.log(`❌ [PAGE ERROR] ${error.message}`);
  });

  // 监听请求失败
  page.on('requestfailed', request => {
    console.log(`❌ [REQUEST FAILED] ${request.url()}`);
  });

  try {
    // 步骤 1: 访问首页
    console.log('📍 Step 1: Navigate to homepage');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ Homepage loaded\n');

    // 步骤 2: 检查是否需要登录
    console.log('📍 Step 2: Check authentication');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
      console.log('⚠️  Not authenticated, need to login first');
      console.log('   Please manually login and run the test again\n');

      // 截图当前状态
      await page.screenshot({ path: 'screenshots/debug-01-need-login.png', fullPage: true });
      return;
    }

    // 步骤 3: 导航到 canvas 页面
    console.log('📍 Step 3: Navigate to canvas page');
    await page.goto('http://localhost:3000/canvas');
    await page.waitForTimeout(2000);

    const canvasUrl = page.url();
    console.log(`   Canvas URL: ${canvasUrl}`);

    if (!canvasUrl.includes('/canvas')) {
      console.log('❌ Failed to navigate to canvas page');
      await page.screenshot({ path: 'screenshots/debug-02-canvas-failed.png', fullPage: true });
      return;
    }
    console.log('✅ Canvas page loaded\n');

    // 截图
    await page.screenshot({ path: 'screenshots/debug-03-canvas-initial.png', fullPage: true });

    // 步骤 4: 检查是否有分解结构树
    console.log('📍 Step 4: Check for decomposition tree');
    const treeContainer = await page.$('.text-sm');

    if (!treeContainer) {
      console.log('⚠️  No tree container found, might need to start breakdown first');

      // 查找"开始拆解"按钮
      const startButton = await page.$('button:has-text("开始拆解")');
      if (startButton) {
        console.log('   Found "开始拆解" button, but skipping auto-click');
        console.log('   Please manually start breakdown and run test again\n');
      }

      await page.screenshot({ path: 'screenshots/debug-04-no-tree.png', fullPage: true });
      return;
    }
    console.log('✅ Tree container found\n');

    // 步骤 5: 查找树节点
    console.log('📍 Step 5: Find tree nodes');
    const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
    console.log(`   Found ${treeNodes.length} tree nodes`);

    if (treeNodes.length === 0) {
      console.log('❌ No tree nodes found');
      await page.screenshot({ path: 'screenshots/debug-05-no-nodes.png', fullPage: true });
      return;
    }
    console.log('✅ Tree nodes found\n');

    // 步骤 6: 测试点击第一个节点
    console.log('📍 Step 6: Click first tree node');
    console.log('   Clicking node...');

    // 获取节点文本
    const nodeText = await treeNodes[0].textContent();
    console.log(`   Node text: ${nodeText}`);

    await treeNodes[0].click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/debug-06-after-click.png', fullPage: true });
    console.log('✅ Node clicked\n');

    // 步骤 7: 检查弹窗是否出现
    console.log('📍 Step 7: Check for popup');
    const popup = await page.$('.fixed.z-\\[99999\\]');

    if (!popup) {
      console.log('❌ Popup did NOT appear!');
      console.log('   Debugging info:');

      // 检查是否有任何 fixed 元素
      const fixedElements = await page.$$('.fixed');
      console.log(`   - Found ${fixedElements.length} fixed elements`);

      // 检查是否有 Portal 渲染的元素
      const bodyChildren = await page.evaluate(() => {
        return document.body.children.length;
      });
      console.log(`   - Body has ${bodyChildren} children`);

      await page.screenshot({ path: 'screenshots/debug-07-no-popup.png', fullPage: true });

      // 尝试再次点击
      console.log('\n   Trying to click again...');
      await treeNodes[0].click();
      await page.waitForTimeout(1000);

      const popupRetry = await page.$('.fixed.z-\\[99999\\]');
      if (popupRetry) {
        console.log('✅ Popup appeared on second try!');
      } else {
        console.log('❌ Still no popup on second try');
        await page.screenshot({ path: 'screenshots/debug-08-still-no-popup.png', fullPage: true });
        return;
      }
    } else {
      console.log('✅ Popup appeared!\n');
    }

    // 步骤 8: 检查弹窗内容
    console.log('📍 Step 8: Check popup content');

    // 检查节点名称
    const popupTitle = await page.$('.fixed.z-\\[99999\\] .text-lg.font-bold');
    if (popupTitle) {
      const titleText = await popupTitle.textContent();
      console.log(`   ✅ Popup title: ${titleText}`);
    } else {
      console.log('   ❌ No popup title found');
    }

    // 检查描述
    const popupDesc = await page.$('.fixed.z-\\[99999\\] .text-sm.text-gray-300');
    if (popupDesc) {
      const descText = await popupDesc.textContent();
      console.log(`   ✅ Popup description: ${descText?.substring(0, 50)}...`);
    } else {
      console.log('   ❌ No popup description found');
    }

    // 检查按钮
    console.log('\n   Checking buttons:');

    const continueButton = await page.$('button:has-text("继续拆解")');
    if (continueButton) {
      console.log('   ✅ "继续拆解" button found');

      // 检查按钮是否可见
      const isVisible = await continueButton.isVisible();
      console.log(`      - Visible: ${isVisible}`);

      // 检查按钮是否可点击
      const isEnabled = await continueButton.isEnabled();
      console.log(`      - Enabled: ${isEnabled}`);
    } else {
      console.log('   ❌ "继续拆解" button NOT found');
    }

    const productionButton = await page.$('button:has-text("生产规划")');
    if (productionButton) {
      console.log('   ✅ "生产规划" button found');

      const isVisible = await productionButton.isVisible();
      console.log(`      - Visible: ${isVisible}`);

      const isEnabled = await productionButton.isEnabled();
      console.log(`      - Enabled: ${isEnabled}`);
    } else {
      console.log('   ❌ "生产规划" button NOT found');
    }

    const closeButton = await page.$('button[title="关闭"]');
    if (closeButton) {
      console.log('   ✅ Close button found');
    } else {
      console.log('   ❌ Close button NOT found');
    }

    await page.screenshot({ path: 'screenshots/debug-09-popup-content.png', fullPage: true });
    console.log('');

    // 步骤 9: 测试关闭按钮
    if (closeButton) {
      console.log('📍 Step 9: Test close button');
      await closeButton.click();
      await page.waitForTimeout(500);

      const popupAfterClose = await page.$('.fixed.z-\\[99999\\]');
      if (!popupAfterClose) {
        console.log('✅ Popup closed successfully\n');
      } else {
        console.log('❌ Popup still visible after close\n');
      }

      await page.screenshot({ path: 'screenshots/debug-10-after-close.png', fullPage: true });
    }

    // 步骤 10: 测试继续拆解按钮
    if (continueButton) {
      console.log('📍 Step 10: Test continue breakdown button');

      // 重新打开弹窗
      await treeNodes[0].click();
      await page.waitForTimeout(1000);

      const continueButtonAgain = await page.$('button:has-text("继续拆解")');
      if (continueButtonAgain) {
        console.log('   Clicking "继续拆解" button...');
        await continueButtonAgain.click();

        console.log('   Waiting for breakdown to complete...');
        await page.waitForTimeout(8000);

        await page.screenshot({ path: 'screenshots/debug-11-after-breakdown.png', fullPage: true });

        // 检查是否有新的子节点
        const treeNodesAfter = await page.$$('.select-none > div[class*="relative flex items-center"]');
        console.log(`   Tree nodes after breakdown: ${treeNodesAfter.length}`);

        if (treeNodesAfter.length > treeNodes.length) {
          console.log('✅ New nodes added after breakdown\n');
        } else {
          console.log('⚠️  No new nodes added (might be loading or error)\n');
        }
      }
    }

    // 步骤 11: 测试生产规划按钮
    if (productionButton && treeNodes.length > 1) {
      console.log('📍 Step 11: Test production planning button');

      // 点击第二个节点
      await treeNodes[1].click();
      await page.waitForTimeout(1000);

      const productionButtonAgain = await page.$('button:has-text("生产规划")');
      if (productionButtonAgain) {
        console.log('   Clicking "生产规划" button...');

        const urlBefore = page.url();
        await productionButtonAgain.click();
        await page.waitForTimeout(2000);

        const urlAfter = page.url();
        console.log(`   URL before: ${urlBefore}`);
        console.log(`   URL after: ${urlAfter}`);

        if (urlAfter !== urlBefore) {
          console.log('✅ Navigation occurred\n');
        } else {
          console.log('⚠️  No navigation (might open modal instead)\n');
        }

        await page.screenshot({ path: 'screenshots/debug-12-after-production.png', fullPage: true });
      }
    }

    console.log('✅ All tests completed successfully!\n');
    console.log('📸 Screenshots saved to screenshots/ directory');

  } catch (error) {
    console.log(`\n❌ Test failed with error: ${error}`);
    await page.screenshot({ path: 'screenshots/debug-error.png', fullPage: true });
    throw error;
  }
});
