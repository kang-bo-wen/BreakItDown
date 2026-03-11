import { test, expect } from '@playwright/test';

test.describe('Debug Breakdown Flow', () => {
  test('调试拆解流程 - 详细步骤', async ({ page }) => {
    console.log('🎯 开始调试拆解流程\n');

    // 监听控制台
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   [浏览器错误] ${msg.text()}`);
      }
    });

    // 监听网络请求
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`   [请求失败] ${response.status()} ${response.url()}`);
      }
    });

    // 生成唯一的测试用户
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'testpassword123';

    // ========== 注册 ==========
    console.log('📍 Step 1: 注册');
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');

    await page.fill('input#name', 'Test User');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);
    console.log(`   当前 URL: ${page.url()}\n`);

    // ========== 识别物品 ==========
    console.log('📍 Step 2: 识别物品');

    // 等待页面加载
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/debug-step2-1-initial.png', fullPage: true });

    // 查找并点击文字输入按钮
    const textButtons = await page.$$('button');
    console.log(`   找到 ${textButtons.length} 个按钮`);

    for (const btn of textButtons) {
      const text = await btn.textContent();
      console.log(`   按钮文本: "${text}"`);
      if (text?.includes('文字')) {
        await btn.click();
        console.log('   ✅ 点击了"文字"按钮');
        await page.waitForTimeout(1000);
        break;
      }
    }

    await page.screenshot({ path: 'screenshots/debug-step2-2-text-selected.png', fullPage: true });

    // 查找输入框
    const inputs = await page.$$('input[type="text"], textarea');
    console.log(`   找到 ${inputs.length} 个输入框`);

    if (inputs.length > 0) {
      await inputs[0].fill('智能手机');
      console.log('   ✅ 输入了"智能手机"');
    }

    await page.screenshot({ path: 'screenshots/debug-step2-3-input-filled.png', fullPage: true });

    // 查找并点击识别按钮
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text?.includes('识别') || text?.includes('开始')) {
        console.log(`   找到按钮: "${text}"`);
        await btn.click();
        console.log('   ✅ 点击了识别按钮');
        break;
      }
    }

    // 等待识别完成
    console.log('   等待识别完成（15秒）...');
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'screenshots/debug-step2-4-identified.png', fullPage: true });
    console.log('   ✅ 识别完成\n');

    // ========== 选择模式 ==========
    console.log('📍 Step 3: 选择模式');
    const modeButtons = await page.$$('button');
    for (const btn of modeButtons) {
      const text = await btn.textContent();
      if (text?.includes('生产')) {
        await btn.click();
        console.log('   ✅ 选择了生产模式');
        await page.waitForTimeout(1000);
        break;
      }
    }
    await page.screenshot({ path: 'screenshots/debug-step3-mode.png', fullPage: true });
    console.log('');

    // ========== 开始拆解 ==========
    console.log('📍 Step 4: 开始拆解');

    // 查找"开始拆解"按钮
    const breakdownButtons = await page.$$('button');
    console.log(`   当前页面有 ${breakdownButtons.length} 个按钮`);

    let foundBreakdownBtn = false;
    for (const btn of breakdownButtons) {
      const text = await btn.textContent();
      console.log(`   按钮: "${text}"`);
      if (text?.includes('拆解')) {
        await btn.click();
        console.log('   ✅ 点击了"开始拆解"按钮');
        foundBreakdownBtn = true;
        break;
      }
    }

    if (!foundBreakdownBtn) {
      console.log('   ❌ 没有找到"开始拆解"按钮');
    }

    // 等待跳转
    await page.waitForTimeout(3000);
    console.log(`   当前 URL: ${page.url()}`);
    await page.screenshot({ path: 'screenshots/debug-step4-1-after-click.png', fullPage: true });

    // 如果在 canvas 页面，再次点击开始拆解
    if (page.url().includes('/canvas')) {
      console.log('   已在 canvas 页面，查找拆解按钮...');
      await page.waitForTimeout(2000);

      const canvasButtons = await page.$$('button');
      console.log(`   Canvas 页面有 ${canvasButtons.length} 个按钮`);

      for (const btn of canvasButtons) {
        const text = await btn.textContent();
        console.log(`   Canvas 按钮: "${text}"`);
        if (text?.includes('拆解')) {
          await btn.click();
          console.log('   ✅ 点击了 canvas 页面的"开始拆解"按钮');
          break;
        }
      }

      // 等待拆解完成
      console.log('   等待拆解完成（20秒）...');
      await page.waitForTimeout(20000);
      await page.screenshot({ path: 'screenshots/debug-step4-2-decomposed.png', fullPage: true });
      console.log('   ✅ 拆解完成\n');
    }

    // ========== 查找树节点 ==========
    console.log('📍 Step 5: 查找树节点');

    // 尝试多种选择器
    const selectors = [
      '.select-none > div[class*="relative flex items-center"]',
      '[class*="tree"] [class*="node"]',
      '[class*="decomposition"] [class*="item"]',
      'div[role="treeitem"]',
      '.tree-node',
      '[data-testid*="node"]'
    ];

    for (const selector of selectors) {
      const nodes = await page.$$(selector);
      console.log(`   选择器 "${selector}": 找到 ${nodes.length} 个节点`);
      if (nodes.length > 0) {
        console.log('   ✅ 找到树节点！');

        // 测试第一个节点
        const firstNode = nodes[0];
        const nodeText = await firstNode.textContent();
        console.log(`   节点文本: ${nodeText?.substring(0, 100)}`);

        await firstNode.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/debug-step5-node-clicked.png', fullPage: true });

        // 检查弹窗
        const popup = await page.$('.fixed');
        if (popup) {
          console.log('   ✅ 弹窗出现');
          await page.screenshot({ path: 'screenshots/debug-step5-popup.png', fullPage: true });
        } else {
          console.log('   ❌ 弹窗未出现');
        }

        break;
      }
    }

    // 如果都没找到，截图整个页面并输出 HTML
    const allNodes = await page.$$('.select-none > div[class*="relative flex items-center"]');
    if (allNodes.length === 0) {
      console.log('\n   ❌ 没有找到任何树节点');
      console.log('   保存页面 HTML 用于调试...');

      const html = await page.content();
      const fs = require('fs');
      fs.writeFileSync('screenshots/debug-page-html.html', html);

      await page.screenshot({ path: 'screenshots/debug-final-state.png', fullPage: true });
    }

    console.log('\n✅ 调试测试完成');
  });
});
