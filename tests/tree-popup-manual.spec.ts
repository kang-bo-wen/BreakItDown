import { test, expect } from '@playwright/test';

test('Manual test - Check if popup appears on tree node click', async ({ page }) => {
  console.log('🚀 Starting manual test...');
  console.log('📝 Please manually navigate to the canvas page with a breakdown tree');
  console.log('📝 This test will wait for 60 seconds for you to set up the page');

  // 等待用户手动设置页面
  await page.goto('http://localhost:8000');
  await page.waitForTimeout(60000);

  console.log('\n🔍 Looking for tree nodes...');

  // 查找树节点
  const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
  console.log(`Found ${treeNodes.length} tree nodes`);

  if (treeNodes.length > 0) {
    console.log('\n🎯 Clicking first tree node...');
    await treeNodes[0].click();
    await page.waitForTimeout(1000);

    // 截图
    await page.screenshot({ path: 'screenshots/manual-test-after-click.png', fullPage: true });

    // 检查弹窗
    const popup = await page.$('.fixed.z-\\[99999\\]');
    if (popup) {
      console.log('✅ Popup appeared!');

      // 检查按钮
      const continueButton = await page.$('button:has-text("继续拆解")');
      const productionButton = await page.$('button:has-text("生产规划")');
      const closeButton = await page.$('button[title="关闭"]');

      console.log('\n📊 Button check results:');
      console.log(`  - Continue breakdown button: ${continueButton ? '✅ Found' : '❌ Not found'}`);
      console.log(`  - Production planning button: ${productionButton ? '✅ Found' : '❌ Not found'}`);
      console.log(`  - Close button: ${closeButton ? '✅ Found' : '❌ Not found'}`);

      // 测试关闭按钮
      if (closeButton) {
        console.log('\n🔘 Testing close button...');
        await closeButton.click();
        await page.waitForTimeout(500);

        const popupAfterClose = await page.$('.fixed.z-\\[99999\\]');
        if (!popupAfterClose) {
          console.log('✅ Popup closed successfully!');
        } else {
          console.log('❌ Popup still visible after close');
        }
      }

      // 再次点击节点
      console.log('\n🎯 Clicking tree node again...');
      await treeNodes[0].click();
      await page.waitForTimeout(1000);

      // 测试继续拆解按钮
      const continueButtonAgain = await page.$('button:has-text("继续拆解")');
      if (continueButtonAgain) {
        console.log('\n🔧 Testing continue breakdown button...');
        await continueButtonAgain.click();
        console.log('⏳ Waiting 5 seconds...');
        await page.waitForTimeout(5000);

        await page.screenshot({ path: 'screenshots/manual-test-after-breakdown.png', fullPage: true });
        console.log('✅ Continue breakdown button clicked!');
      }
    } else {
      console.log('❌ Popup did NOT appear');
    }
  } else {
    console.log('❌ No tree nodes found');
  }

  console.log('\n✅ Manual test completed!');
  console.log('📸 Screenshots saved to screenshots/ directory');
});
