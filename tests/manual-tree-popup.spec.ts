import { test } from '@playwright/test';

test('Manual setup - Test tree popup only', async ({ page }) => {
  console.log('🎯 Testing tree popup functionality\n');
  console.log('⚠️  PREREQUISITES:');
  console.log('   1. You must be logged in');
  console.log('   2. You must have a breakdown tree on the canvas page');
  console.log('   3. Navigate to http://localhost:3000/canvas before running this test\n');
  console.log('📝 This test will wait 30 seconds for you to set up...\n');

  // 监听错误
  page.on('pageerror', error => {
    if (!error.message.includes('Invariant')) {
      console.log(`❌ [ERROR] ${error.message}`);
    }
  });

  // 访问 canvas 页面
  await page.goto('http://localhost:3000/canvas');
  console.log('✅ Navigated to canvas page');
  console.log('⏳ Waiting 30 seconds for manual setup...\n');

  await page.waitForTimeout(30000);

  console.log('🔍 Starting automated tests...\n');

  // 截图初始状态
  await page.screenshot({ path: 'screenshots/manual-01-initial.png', fullPage: true });

  // 查找树节点
  console.log('📍 Step 1: Find tree nodes');
  const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
  console.log(`   Found ${treeNodes.length} tree nodes`);

  if (treeNodes.length === 0) {
    console.log('\n❌ No tree nodes found!');
    console.log('   Please make sure you have:');
    console.log('   1. Completed identification');
    console.log('   2. Started breakdown');
    console.log('   3. Waited for breakdown to complete\n');
    return;
  }

  console.log('✅ Tree nodes found\n');

  // 测试每个节点
  for (let i = 0; i < Math.min(treeNodes.length, 3); i++) {
    console.log(`📍 Step ${i + 2}: Test node ${i + 1}`);

    const node = treeNodes[i];
    const nodeText = await node.textContent();
    console.log(`   Node text: ${nodeText?.substring(0, 50)}`);

    // 点击节点
    await node.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: `screenshots/manual-02-node${i + 1}-clicked.png`, fullPage: true });

    // 检查弹窗
    const popup = await page.$('.fixed.z-\\[99999\\]');

    if (!popup) {
      console.log(`   ❌ Popup did NOT appear for node ${i + 1}`);

      // 调试信息
      console.log('   Debugging:');

      // 检查是否有 showPopup 状态
      const hasFixed = await page.$$('.fixed');
      console.log(`   - Found ${hasFixed.length} fixed elements`);

      // 检查 Portal 渲染
      const bodyChildren = await page.evaluate(() => {
        return Array.from(document.body.children).map(el => ({
          tag: el.tagName,
          class: el.className,
          id: el.id
        }));
      });
      console.log(`   - Body children: ${JSON.stringify(bodyChildren, null, 2)}`);

      // 尝试再次点击
      console.log('   Trying again...');
      await node.click();
      await page.waitForTimeout(1000);

      const popupRetry = await page.$('.fixed.z-\\[99999\\]');
      if (popupRetry) {
        console.log('   ✅ Popup appeared on retry!');
      } else {
        console.log('   ❌ Still no popup');
        continue;
      }
    } else {
      console.log('   ✅ Popup appeared!');
    }

    // 检查弹窗内容
    const popupTitle = await page.$('.fixed.z-\\[99999\\] .text-lg.font-bold');
    if (popupTitle) {
      const title = await popupTitle.textContent();
      console.log(`   ✅ Popup title: ${title}`);
    } else {
      console.log('   ❌ No popup title');
    }

    // 检查按钮
    const continueBtn = await page.$('button:has-text("继续拆解")');
    const productionBtn = await page.$('button:has-text("生产规划")');
    const closeBtn = await page.$('button[title="关闭"]');

    console.log(`   ${continueBtn ? '✅' : '❌'} Continue breakdown button`);
    console.log(`   ${productionBtn ? '✅' : '❌'} Production planning button`);
    console.log(`   ${closeBtn ? '✅' : '❌'} Close button`);

    await page.screenshot({ path: `screenshots/manual-03-node${i + 1}-popup.png`, fullPage: true });

    // 测试关闭按钮
    if (closeBtn) {
      console.log('   Testing close button...');
      await closeBtn.click();
      await page.waitForTimeout(500);

      const popupAfter = await page.$('.fixed.z-\\[99999\\]');
      if (!popupAfter) {
        console.log('   ✅ Popup closed successfully');
      } else {
        console.log('   ❌ Popup still visible');
      }

      await page.screenshot({ path: `screenshots/manual-04-node${i + 1}-closed.png`, fullPage: true });
    }

    console.log('');
  }

  // 测试继续拆解功能
  if (treeNodes.length >= 2) {
    console.log('📍 Final test: Continue breakdown');

    await treeNodes[1].click();
    await page.waitForTimeout(1000);

    const continueBtn = await page.$('button:has-text("继续拆解")');
    if (continueBtn) {
      console.log('   Clicking continue breakdown...');
      await continueBtn.click();

      console.log('   Waiting 10 seconds for breakdown...');
      await page.waitForTimeout(10000);

      const nodesAfter = await page.$$('.select-none > div[class*="relative flex items-center"]');
      console.log(`   Nodes before: ${treeNodes.length}, after: ${nodesAfter.length}`);

      if (nodesAfter.length > treeNodes.length) {
        console.log('   ✅ New nodes added!');
      } else {
        console.log('   ⚠️  No new nodes (might still be loading)');
      }

      await page.screenshot({ path: 'screenshots/manual-05-after-breakdown.png', fullPage: true });
    }
  }

  console.log('\n✅✅✅ Testing completed! ✅✅✅');
  console.log('📸 Screenshots saved to screenshots/ directory\n');
});
