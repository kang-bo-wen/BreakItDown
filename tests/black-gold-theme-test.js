import { chromium } from 'playwright';

async function testBlackGoldTheme() {
  console.log('开始测试黑金新拟态风格...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. 加载页面
    console.log('步骤1: 加载页面');
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(1000);
    console.log('✓ 页面加载成功\n');

    // 2. 验证背景色
    console.log('步骤2: 验证黑金主题');
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Body背景色: ${bodyBg}`);
    if (bodyBg === 'rgb(0, 0, 0)' || bodyBg === 'rgba(0, 0, 0, 1)') {
      console.log('✓ 背景色正确（黑色）');
    } else {
      console.warn(`⚠ 背景色不是黑色: ${bodyBg}`);
    }

    // 3. 验证容器样式
    const containerBg = await page.evaluate(() => {
      const container = document.querySelector('.container');
      return window.getComputedStyle(container).backgroundColor;
    });
    console.log(`Container背景色: ${containerBg}`);

    // 4. 验证系统副标题
    const subtitle = await page.$('.system-subtitle');
    if (subtitle) {
      const subtitleText = await subtitle.textContent();
      console.log(`✓ 系统副标题存在: ${subtitleText}`);
    } else {
      console.warn('⚠ 系统副标题未找到');
    }

    // 5. 输入产品名称并开始分析
    console.log('\n步骤3: 测试交互功能');
    await page.fill('#productName', '白色金属闹钟');
    console.log('✓ 已输入产品名称');

    await page.click('#startBtn');
    console.log('✓ 已点击开始分析按钮');

    // 6. 等待零件树加载
    console.log('\n步骤4: 等待零件树加载');
    await page.waitForSelector('.part-item', { timeout: 15000 });
    const partItems = await page.$$('.part-item');
    console.log(`✓ 零件树已加载 (${partItems.length} 个零件)\n`);

    // 7. 验证零件项样式
    if (partItems.length > 0) {
      const partItemBg = await partItems[0].evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log(`零件项背景色: ${partItemBg}`);

      const partItemBorder = await partItems[0].evaluate(el => {
        return window.getComputedStyle(el).borderColor;
      });
      console.log(`零件项边框色: ${partItemBorder}`);
    }

    // 8. 点击第一个零件
    console.log('\n步骤5: 选择第一个零件');
    await partItems[0].click();
    await page.waitForTimeout(1000);
    console.log('✓ 已选择零件\n');

    // 9. 等待Agent面板加载
    console.log('步骤6: 等待Agent面板加载');
    await page.waitForTimeout(3000);
    const agentCards = await page.$$('.agent-card');
    console.log(`✓ Agent面板已加载 (${agentCards.length} 个Agent)\n`);

    // 10. 验证Agent卡片样式
    if (agentCards.length > 0) {
      const agentCardBg = await agentCards[0].evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log(`Agent卡片背景色: ${agentCardBg}`);

      const agentCardBorder = await agentCards[0].evaluate(el => {
        return window.getComputedStyle(el).borderColor;
      });
      console.log(`Agent卡片边框色: ${agentCardBorder}`);
    }

    // 11. 等待供应商加载
    console.log('\n步骤7: 等待供应商加载');
    await page.waitForSelector('.supplier-item', { timeout: 15000 });
    const supplierItems = await page.$$('.supplier-item');
    console.log(`✓ 供应商已加载 (${supplierItems.length} 个选项)\n`);

    // 12. 验证供应商项样式
    if (supplierItems.length > 0) {
      const supplierItemBg = await supplierItems[0].evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log(`供应商项背景色: ${supplierItemBg}`);
    }

    // 13. 截图保存
    console.log('\n步骤8: 保存截图');
    await page.screenshot({ path: 'black-gold-theme.png', fullPage: true });
    console.log('✓ 截图已保存: black-gold-theme.png\n');

    console.log('='.repeat(50));
    console.log('黑金新拟态风格测试完成！');
    console.log('='.repeat(50));
    console.log('\n浏览器将保持打开60秒以便查看...');

    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    await page.screenshot({ path: 'theme-test-error.png' });
    console.log('已保存错误截图: theme-test-error.png');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

testBlackGoldTheme().catch(console.error);
