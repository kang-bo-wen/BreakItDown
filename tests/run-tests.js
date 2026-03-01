import { chromium } from 'playwright';

async function runTests() {
  console.log('开始自动化测试...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 测试1: 访问主页
    console.log('测试1: 访问主页');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#productName');
    console.log('✓ 主页加载成功');

    // 测试2: 输入产品名称并开始分析
    console.log('测试2: 输入产品名称并开始分析');
    await page.fill('#productName', '白色金属闹钟');
    await page.click('#startBtn');
    await page.waitForTimeout(3000);

    // 等待零件树出现
    await page.waitForSelector('.part-item', { timeout: 30000 });
    console.log('✓ 零件拆解成功');

    // 测试3: 选择第一个零件
    console.log('测试3: 选择第一个零件');
    await page.click('.part-item:first-child');
    await page.waitForTimeout(2000);

    // 等待供应商列表出现
    await page.waitForSelector('.supplier-item', { timeout: 30000 });
    console.log('✓ 供应商检索成功');

    // 测试4: 选择第一个供应商
    console.log('测试4: 选择第一个供应商');
    await page.click('.supplier-item:first-child');
    await page.waitForTimeout(5000);

    // 等待评估结果出现
    await page.waitForSelector('.assessment-results', { timeout: 60000 });
    console.log('✓ 状态A评估完成');

    // 测试5: 检查Agent面板
    console.log('测试5: 检查Agent面板');
    const agentCards = await page.$$('.agent-card');
    console.log(`✓ 发现 ${agentCards.length} 个Agent面板`);

    // 测试6: 检查思考过程
    console.log('测试6: 检查思考过程');
    const thinkingContent = await page.$$eval('.agent-thinking', elements =>
      elements.map(el => el.textContent.length)
    );
    console.log(`✓ Agent思考内容长度: ${thinkingContent.join(', ')}`);

    // 测试7: 测试定制化流程
    console.log('测试7: 测试定制化流程');
    await page.click('button:has-text("更换供应商")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("定制零件")');
    await page.waitForTimeout(3000);

    // 等待定制问题出现
    const hasCustomForm = await page.$('#customizationForm');
    if (hasCustomForm) {
      console.log('✓ 定制化问题生成成功');

      // 填写定制表单
      const inputs = await page.$$('#customizationForm input, #customizationForm select');
      for (const input of inputs) {
        const tagName = await input.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'input') {
          await input.fill('测试值');
        }
      }

      await page.click('#customizationForm button[type="submit"]');
      await page.waitForTimeout(5000);

      // 等待工艺方案出现
      await page.waitForSelector('#processList', { timeout: 30000 });
      console.log('✓ 工艺方案生成成功');

      // 选择第一个工艺
      const processItems = await page.$$('#processList .supplier-item');
      if (processItems.length > 0) {
        await processItems[0].click();
        await page.waitForTimeout(5000);

        // 等待评估结果
        await page.waitForSelector('.assessment-results', { timeout: 60000 });
        console.log('✓ 定制化流程评估完成');
      }
    }

    console.log('\n所有测试通过! ✓');

  } catch (error) {
    console.error('测试失败:', error);
    await page.screenshot({ path: 'test-error.png' });
    console.log('错误截图已保存: test-error.png');
  } finally {
    await browser.close();
  }
}

// 运行测试
runTests().catch(console.error);