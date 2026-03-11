import { test, expect } from '@playwright/test';

/**
 * Playwright MCP 调试测试
 * 用于测试和调试应用的交互功能
 */

test.describe('MCP Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 监听控制台输出
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // 监听页面错误
    page.on('pageerror', error => {
      console.error(`[Page Error] ${error.message}`);
    });

    // 监听请求失败
    page.on('requestfailed', request => {
      console.error(`[Request Failed] ${request.url()}`);
    });
  });

  test('Debug: 完整流程测试', async ({ page }) => {
    console.log('🎯 开始调试测试\n');

    // 1. 访问首页
    console.log('📍 Step 1: 访问首页');
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/debug-01-home.png', fullPage: true });
    console.log('✅ 首页加载完成\n');

    // 2. 等待用户手动操作
    console.log('⏸️  暂停 30 秒，请手动完成以下操作：');
    console.log('   1. 注册/登录');
    console.log('   2. 识别物品');
    console.log('   3. 开始拆解');
    console.log('   4. 等待拆解完成\n');

    await page.waitForTimeout(30000);

    // 3. 检查 canvas 页面
    console.log('📍 Step 2: 检查 canvas 页面');
    const currentUrl = page.url();
    console.log(`   当前 URL: ${currentUrl}`);

    if (!currentUrl.includes('/canvas')) {
      console.log('   ⚠️  不在 canvas 页面，尝试导航...');
      await page.goto('/canvas');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'screenshots/debug-02-canvas.png', fullPage: true });
    console.log('✅ Canvas 页面加载完成\n');

    // 4. 查找树节点
    console.log('📍 Step 3: 查找树节点');
    const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
    console.log(`   找到 ${treeNodes.length} 个树节点`);

    if (treeNodes.length === 0) {
      console.log('   ❌ 没有找到树节点！');
      console.log('   请确保已完成拆解操作\n');
      return;
    }

    // 5. 测试第一个节点
    console.log('\n📍 Step 4: 测试第一个节点');
    const firstNode = treeNodes[0];
    const nodeText = await firstNode.textContent();
    console.log(`   节点文本: ${nodeText?.substring(0, 50)}`);

    // 点击节点
    await firstNode.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/debug-03-node-clicked.png', fullPage: true });

    // 检查弹窗
    const popup = await page.$('.fixed.z-\\[99999\\]');
    if (popup) {
      console.log('   ✅ 弹窗出现');

      // 检查弹窗内容
      const title = await page.$('.fixed.z-\\[99999\\] .text-lg.font-bold');
      if (title) {
        const titleText = await title.textContent();
        console.log(`   弹窗标题: ${titleText}`);
      }

      // 检查按钮
      const continueBtn = await page.$('button:has-text("继续拆解")');
      const productionBtn = await page.$('button:has-text("生产规划")');
      const closeBtn = await page.$('button[title="关闭"]');

      console.log(`   ${continueBtn ? '✅' : '❌'} 继续拆解按钮`);
      console.log(`   ${productionBtn ? '✅' : '❌'} 生产规划按钮`);
      console.log(`   ${closeBtn ? '✅' : '❌'} 关闭按钮`);

      await page.screenshot({ path: 'screenshots/debug-04-popup.png', fullPage: true });

      // 测试关闭
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        const popupAfter = await page.$('.fixed.z-\\[99999\\]');
        console.log(`   ${!popupAfter ? '✅' : '❌'} 弹窗关闭`);
      }
    } else {
      console.log('   ❌ 弹窗未出现');
    }

    console.log('\n✅ 调试测试完成！');
    console.log('📸 截图保存在 screenshots/ 目录\n');
  });

  test('Debug: 交互式调试', async ({ page }) => {
    console.log('🎯 交互式调试模式\n');
    console.log('⏸️  浏览器将保持打开状态');
    console.log('   你可以手动与页面交互');
    console.log('   测试将在 5 分钟后自动结束\n');

    await page.goto('/');

    // 保持浏览器打开 5 分钟
    await page.waitForTimeout(300000);

    console.log('✅ 调试会话结束');
  });
});
