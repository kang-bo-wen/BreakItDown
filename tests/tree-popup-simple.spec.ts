import { test, expect } from '@playwright/test';

test('Simple test for decomposition tree popup', async ({ page }) => {
  // 监听控制台日志和错误
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  // 访问首页
  await page.goto('http://localhost:8000');
  await page.waitForTimeout(2000);

  console.log('Page loaded, current URL:', page.url());

  // 截图
  await page.screenshot({ path: 'screenshots/simple-test-01-homepage.png', fullPage: true });

  // 检查页面是否加载成功
  const title = await page.title();
  console.log('Page title:', title);

  // 尝试访问 canvas 页面（如果有保存的会话）
  await page.goto('http://localhost:8000/canvas');
  await page.waitForTimeout(3000);

  console.log('Canvas page loaded, current URL:', page.url());

  // 截图
  await page.screenshot({ path: 'screenshots/simple-test-02-canvas.png', fullPage: true });

  // 查找分解结构树
  const treeContainer = await page.$('.text-sm');
  if (treeContainer) {
    console.log('Found tree container');

    // 查找所有树节点
    const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
    console.log(`Found ${treeNodes.length} tree nodes`);

    if (treeNodes.length > 0) {
      // 点击第一个节点
      console.log('Clicking first tree node...');
      await treeNodes[0].click();
      await page.waitForTimeout(1000);

      // 截图
      await page.screenshot({ path: 'screenshots/simple-test-03-after-click.png', fullPage: true });

      // 检查弹窗是否出现
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

        // 测试关闭按钮
        const closeButton = await page.$('button[title="关闭"]');
        if (closeButton) {
          console.log('Testing close button...');
          await closeButton.click();
          await page.waitForTimeout(500);

          // 检查弹窗是否关闭
          const popupAfterClose = await page.$('.fixed.z-\\[99999\\]');
          if (!popupAfterClose) {
            console.log('✅ Popup closed successfully!');
          } else {
            console.log('❌ Popup still visible after close');
          }
        }
      } else {
        console.log('❌ Popup did NOT appear');
      }
    } else {
      console.log('No tree nodes found');
    }
  } else {
    console.log('Tree container not found');
  }

  console.log('Test completed!');
});
