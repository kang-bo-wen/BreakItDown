import { chromium } from 'playwright';

async function comprehensiveTest() {
  console.log('开始全面功能测试...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  let testsPassed = 0;
  let testsFailed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      testsPassed++;
    } catch (error) {
      console.error(`✗ ${name}: ${error.message}`);
      testsFailed++;
    }
  };

  try {
    // 1. 页面加载测试
    console.log('=== 页面加载测试 ===');
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(1000);

    await test('页面标题正确', async () => {
      const title = await page.title();
      if (!title.includes('智能制造业')) throw new Error('标题不正确');
    });

    await test('系统副标题存在', async () => {
      const subtitle = await page.$('.system-subtitle');
      if (!subtitle) throw new Error('副标题未找到');
    });

    await test('三栏布局存在', async () => {
      const leftCol = await page.$('.left-column');
      const centerCol = await page.$('.center-column');
      const rightCol = await page.$('.right-column');
      if (!leftCol || !centerCol || !rightCol) throw new Error('三栏布局不完整');
    });

    // 2. 主题样式测试
    console.log('\n=== 主题样式测试 ===');
    await test('背景色为黑色', async () => {
      const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      if (bg !== 'rgb(0, 0, 0)') throw new Error(`背景色不正确: ${bg}`);
    });

    await test('输入框有新拟态阴影', async () => {
      const input = await page.$('#productName');
      const shadow = await input.evaluate(el => window.getComputedStyle(el).boxShadow);
      if (!shadow || shadow === 'none') throw new Error('输入框没有阴影');
    });

    // 3. 交互功能测试
    console.log('\n=== 交互功能测试 ===');
    await test('输入产品名称', async () => {
      await page.fill('#productName', '白色金属闹钟');
      const value = await page.inputValue('#productName');
      if (value !== '白色金属闹钟') throw new Error('输入值不正确');
    });

    await test('点击开始分析按钮', async () => {
      await page.click('#startBtn');
      await page.waitForTimeout(500);
    });

    await test('零件树加载', async () => {
      await page.waitForSelector('.part-item', { timeout: 15000 });
      const items = await page.$$('.part-item');
      if (items.length === 0) throw new Error('零件树未加载');
      console.log(`  → 加载了 ${items.length} 个零件`);
    });

    // 4. 零件选择测试
    console.log('\n=== 零件选择测试 ===');
    const partItems = await page.$$('.part-item');

    await test('选择第一个零件', async () => {
      await partItems[0].click();
      await page.waitForTimeout(1000);
      const selected = await page.$('.part-item.selected');
      if (!selected) throw new Error('零件未被选中');
    });

    await test('Agent面板加载', async () => {
      await page.waitForTimeout(3000);
      const agents = await page.$$('.agent-card');
      if (agents.length === 0) throw new Error('Agent面板未加载');
      console.log(`  → 加载了 ${agents.length} 个Agent`);
    });

    await test('Keep Breaking Agent未出现在中间面板', async () => {
      const keepBreaking = await page.$('[data-agent="Keep Breaking Agent"]');
      if (keepBreaking) throw new Error('Keep Breaking Agent不应该出现');
    });

    await test('供应商列表加载', async () => {
      await page.waitForSelector('.supplier-item', { timeout: 15000 });
      const suppliers = await page.$$('.supplier-item');
      if (suppliers.length === 0) throw new Error('供应商列表未加载');
      console.log(`  → 加载了 ${suppliers.length} 个供应商`);
    });

    // 5. 供应商选择和弹窗测试
    console.log('\n=== 供应商选择和弹窗测试 ===');
    const supplierItems = await page.$$('.supplier-item');

    await test('选择第一个供应商', async () => {
      await supplierItems[0].click();
      await page.waitForTimeout(1000);
    });

    await test('等待评估结果', async () => {
      console.log('  → 等待评估完成（最多30秒）...');
      await page.waitForTimeout(30000);
    });

    await test('评估结果弹窗显示', async () => {
      const modal = await page.$('#assessmentModal.show');
      if (!modal) throw new Error('弹窗未显示');
    });

    await test('弹窗包含评估结果', async () => {
      const modalBody = await page.$('#assessmentModalBody');
      const text = await modalBody.textContent();
      if (!text.includes('评估结果')) throw new Error('弹窗内容不正确');
      if (!text.includes('Keep Breaking Agent')) throw new Error('缺少Keep Breaking Agent建议');
    });

    await test('弹窗包含成本分析', async () => {
      const costCard = await page.$('.assessment-card:has-text("成本分析")');
      if (!costCard) throw new Error('缺少成本分析卡片');
    });

    await test('弹窗包含工程风险', async () => {
      const riskCard = await page.$('.assessment-card:has-text("工程风险")');
      if (!riskCard) throw new Error('缺少工程风险卡片');
    });

    await test('弹窗包含碳排放', async () => {
      const carbonCard = await page.$('.assessment-card:has-text("碳排放")');
      if (!carbonCard) throw new Error('缺少碳排放卡片');
    });

    await test('弹窗包含操作按钮', async () => {
      const breakdownBtn = await page.$('button:has-text("继续拆分零件")');
      const keepBtn = await page.$('button:has-text("保持当前选项")');
      if (!breakdownBtn || !keepBtn) throw new Error('缺少操作按钮');
    });

    // 6. 弹窗关闭测试
    console.log('\n=== 弹窗关闭测试 ===');
    await test('点击关闭按钮', async () => {
      const closeBtn = await page.$('.close-modal');
      await closeBtn.click();
      await page.waitForTimeout(500);
    });

    await test('弹窗已关闭', async () => {
      const modal = await page.$('#assessmentModal.show');
      if (modal) throw new Error('弹窗未正确关闭');
    });

    // 7. 截图
    console.log('\n=== 保存截图 ===');
    await page.screenshot({ path: 'comprehensive-test.png', fullPage: true });
    console.log('✓ 截图已保存: comprehensive-test.png');

    // 测试总结
    console.log('\n' + '='.repeat(60));
    console.log('测试总结');
    console.log('='.repeat(60));
    console.log(`通过: ${testsPassed} 个测试`);
    console.log(`失败: ${testsFailed} 个测试`);
    console.log(`总计: ${testsPassed + testsFailed} 个测试`);
    console.log('='.repeat(60));

    if (testsFailed === 0) {
      console.log('\n🎉 所有测试通过！黑金新拟态风格完美运行！');
    } else {
      console.log(`\n⚠️  有 ${testsFailed} 个测试失败，请检查`);
    }

    console.log('\n浏览器将保持打开30秒以便查看...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n✗ 测试过程中发生错误:', error.message);
    await page.screenshot({ path: 'comprehensive-test-error.png' });
    console.log('已保存错误截图: comprehensive-test-error.png');
  } finally {
    await browser.close();
  }
}

comprehensiveTest().catch(console.error);
