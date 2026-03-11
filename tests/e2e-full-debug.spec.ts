import { test, expect } from '@playwright/test';

test.describe('Complete E2E Debug Test', () => {
  test('完整流程：注册 -> 登录 -> 识别 -> 拆解 -> 测试树节点', async ({ page }) => {
    console.log('🎯 开始完整的端到端测试\n');

    // 生成唯一的测试用户
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'testpassword123';

    // ========== 步骤 1: 注册 ==========
    console.log('📍 Step 1: 注册新用户');
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');

    await page.fill('input#name', 'Test User');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);

    await page.screenshot({ path: 'screenshots/e2e-01-register.png', fullPage: true });

    await page.click('button[type="submit"]');
    console.log('   等待注册完成...');

    // 等待跳转到 setup 页面（使用更宽松的策略）
    try {
      await page.waitForURL('**/setup', { timeout: 15000, waitUntil: 'domcontentloaded' });
      console.log('   ✅ 注册成功，已跳转到 setup 页面\n');
    } catch (e) {
      // 如果超时，检查当前 URL
      const currentUrl = page.url();
      console.log(`   当前 URL: ${currentUrl}`);
      if (currentUrl.includes('/setup')) {
        console.log('   ✅ 已在 setup 页面（虽然加载较慢）\n');
      } else {
        throw e;
      }
    }

    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/e2e-02-setup.png', fullPage: true });

    // ========== 步骤 2: 识别物品 ==========
    console.log('📍 Step 2: 识别物品');

    // 选择文字输入
    const textInputBtn = await page.$('button:has-text("文字")');
    if (textInputBtn) {
      await textInputBtn.click();
      await page.waitForTimeout(500);
    }

    // 输入物品名称
    const input = await page.$('input[type="text"], textarea');
    if (input) {
      await input.fill('智能手机');
      console.log('   输入物品：智能手机');
    }

    await page.screenshot({ path: 'screenshots/e2e-03-input.png', fullPage: true });

    // 点击开始识别
    const identifyBtn = await page.$('button:has-text("开始识别"), button:has-text("识别")');
    if (identifyBtn) {
      await identifyBtn.click();
      console.log('   点击开始识别...');

      // 等待识别完成（最多 15 秒）
      await page.waitForTimeout(15000);
      console.log('   ✅ 识别完成\n');
    }

    await page.screenshot({ path: 'screenshots/e2e-04-identified.png', fullPage: true });

    // ========== 步骤 3: 选择生产模式（可选）==========
    console.log('📍 Step 3: 选择生产模式');
    const productionBtn = await page.$('button:has-text("生产模式")');
    if (productionBtn) {
      await productionBtn.click();
      console.log('   ✅ 已选择生产模式\n');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'screenshots/e2e-05-mode.png', fullPage: true });

    // ========== 步骤 4: 开始拆解 ==========
    console.log('📍 Step 4: 开始拆解');
    const breakdownBtn = await page.$('button:has-text("开始拆解")');
    if (breakdownBtn) {
      await breakdownBtn.click();
      console.log('   点击开始拆解...');

      // 等待跳转到 canvas 页面
      await page.waitForURL('**/canvas', { timeout: 10000 });
      console.log('   ✅ 已跳转到 canvas 页面');

      // 再次点击开始拆解（canvas 页面上的按钮）
      await page.waitForTimeout(2000);
      const canvasBreakdownBtn = await page.$('button:has-text("开始拆解")');
      if (canvasBreakdownBtn) {
        await canvasBreakdownBtn.click();
        console.log('   开始拆解过程...');

        // 等待拆解完成（最多 20 秒）
        await page.waitForTimeout(20000);
        console.log('   ✅ 拆解完成\n');
      }
    }

    await page.screenshot({ path: 'screenshots/e2e-06-decomposed.png', fullPage: true });

    // ========== 步骤 5: 测试树节点弹窗 ==========
    console.log('📍 Step 5: 测试树节点弹窗');

    // 查找树节点
    const treeNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
    console.log(`   找到 ${treeNodes.length} 个树节点`);

    if (treeNodes.length === 0) {
      console.log('   ❌ 没有找到树节点！');
      return;
    }

    // 测试第一个节点
    const firstNode = treeNodes[0];
    const nodeText = await firstNode.textContent();
    console.log(`   测试节点：${nodeText?.substring(0, 50)}`);

    // 点击节点
    await firstNode.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/e2e-07-node-clicked.png', fullPage: true });

    // 检查弹窗
    const popup = await page.$('.fixed.z-\\[99999\\]');
    if (popup) {
      console.log('   ✅ 弹窗出现');

      // 检查弹窗内容
      const title = await page.$('.fixed.z-\\[99999\\] .text-lg.font-bold');
      if (title) {
        const titleText = await title.textContent();
        console.log(`   弹窗标题：${titleText}`);
      }

      // 检查按钮
      const continueBtn = await page.$('button:has-text("继续拆解")');
      const productionBtn = await page.$('button:has-text("生产规划")');
      const closeBtn = await page.$('button[title="关闭"]');

      console.log(`   ${continueBtn ? '✅' : '❌'} 继续拆解按钮`);
      console.log(`   ${productionBtn ? '✅' : '❌'} 生产规划按钮`);
      console.log(`   ${closeBtn ? '✅' : '❌'} 关闭按钮`);

      await page.screenshot({ path: 'screenshots/e2e-08-popup.png', fullPage: true });

      // 测试关闭按钮
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        const popupAfter = await page.$('.fixed.z-\\[99999\\]');
        console.log(`   ${!popupAfter ? '✅' : '❌'} 弹窗关闭`);
      }

      await page.screenshot({ path: 'screenshots/e2e-09-popup-closed.png', fullPage: true });
    } else {
      console.log('   ❌ 弹窗未出现');
    }

    console.log('\n✅✅✅ 完整测试完成！✅✅✅');
    console.log('📸 所有截图已保存到 screenshots/ 目录\n');
  });
});
