const { chromium } = require('playwright');

async function testCompleteFlow() {
  console.log('=== 开始完整流程测试 ===\n');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 步骤1: 访问首页
    console.log('步骤1: 访问首页');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-1-home.png' });
    console.log('  ✓ 首页加载完成\n');

    // 步骤2: 选择产品类型（公路车）
    console.log('步骤2: 选择产品类型');

    // 直接点击包含"公路车"文本的区域
    await page.click('text=公路车');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-2-direction.png' });
    console.log('  ✓ 已选择公路车\n');

    // 步骤3: 选择设计方向
    console.log('步骤3: 选择设计方向');
    await page.waitForTimeout(2000);

    // 点击第一个"选择此方案"按钮
    const selectButton = page.locator('text=选择此方案').first();
    await selectButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-3-analysis-start.png' });
    console.log('  ✓ 已选择设计方向\n');

    // 步骤4: 等待进入竞品分析系统
    console.log('步骤4: 等待竞品分析系统加载');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-4-battlefield.png' });
    console.log('  ✓ 竞品分析系统已加载\n');

    // 步骤5: 填写战场定义（处理多个问题）
    console.log('步骤5: 处理战场定义页面（可能有多个问题）');

    // 最多处理5个问题（防止无限循环）
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(2000);

      // 查找Skip按钮
      const skipButton = page.locator('text=Skip').or(page.locator('text=使用推荐'));
      const skipCount = await skipButton.count();

      if (skipCount > 0) {
        console.log(`  问题 ${i + 1}: 发现"Skip"按钮，点击跳过`);
        await skipButton.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `c:/Users/25066/Desktop/AI CO/test-5-skip-${i + 1}.png` });
      } else {
        // 检查是否有"继续"按钮（最后一步）
        const continueBtn = page.locator('button:has-text("继续")');
        const continueCount = await continueBtn.count();

        if (continueCount > 0) {
          console.log('  发现"继续"按钮，完成战场定义');
          await continueBtn.first().click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-5-final.png' });
          break;
        } else {
          // 没有Skip也没有继续按钮，可能已经进入下一个阶段
          console.log('  未发现Skip或继续按钮，可能已进入下一阶段');
          break;
        }
      }
    }

    // 步骤6: 等待市场调研页面加载
    console.log('\n步骤6: 等待市场调研页面');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-6-market-research.png' });

    // 检查页面元素
    console.log('\n检查市场调研页面元素:');
    const quickLoadingText = await page.locator('text=快速分析').or(page.locator('text=AI 正在快速分析')).count();
    const quickSummaryText = await page.locator('text=快速摘要').count();
    const thinkingText = await page.locator('text=AI 思考过程').or(page.locator('text=思考')).count();

    console.log(`  - 快速分析提示: ${quickLoadingText > 0 ? '✓ 存在' : '✗ 不存在'}`);
    console.log(`  - 快速摘要: ${quickSummaryText > 0 ? '✓ 存在' : '✗ 不存在'}`);
    console.log(`  - AI思考过程: ${thinkingText > 0 ? '✓ 存在' : '✗ 不存在'}`);

    // 步骤7: 等待快速摘要生成（最多等待30秒）
    console.log('\n步骤7: 等待快速摘要生成（最多30秒）');
    let waitTime = 0;
    let quickSummaryReady = false;

    while (waitTime < 30 && !quickSummaryReady) {
      await page.waitForTimeout(2000);
      waitTime += 2;

      const continueNextButton = await page.locator('text=继续下一步').count();
      const viewFullButton = await page.locator('text=查看完整报告').count();

      if (continueNextButton > 0 || viewFullButton > 0) {
        quickSummaryReady = true;
        console.log(`  ✓ 快速摘要已生成（用时约${waitTime}秒）`);
        await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-7-quick-summary.png' });

        // 检查快速摘要内容
        console.log('\n快速摘要内容检查:');
        const priceRange = await page.locator('text=价格区间').count();
        const avgPrice = await page.locator('text=市场均价').count();
        const competitors = await page.locator('text=代表性竞品').count();
        const advice = await page.locator('text=定价建议').count();

        console.log(`  - 价格区间: ${priceRange > 0 ? '✓' : '✗'}`);
        console.log(`  - 市场均价: ${avgPrice > 0 ? '✓' : '✗'}`);
        console.log(`  - 代表性竞品: ${competitors > 0 ? '✓' : '✗'}`);
        console.log(`  - 定价建议: ${advice > 0 ? '✓' : '✗'}`);

        // 检查按钮
        console.log('\n操作按钮检查:');
        console.log(`  - "继续下一步"按钮: ${continueNextButton > 0 ? '✓' : '✗'}`);
        console.log(`  - "查看完整报告"按钮: ${viewFullButton > 0 ? '✓' : '✗'}`);

      } else {
        process.stdout.write(`  等待中... ${waitTime}秒\r`);
        await page.screenshot({ path: `c:/Users/25066/Desktop/AI CO/test-7-waiting-${waitTime}s.png` });
      }
    }

    if (!quickSummaryReady) {
      console.log('\n  ✗ 超时：快速摘要未在30秒内生成');
      await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-7-timeout.png' });
    }

    // 步骤8: 测试"继续下一步"按钮
    if (quickSummaryReady) {
      console.log('\n步骤8: 测试"继续下一步"按钮');
      const continueNextBtn = page.locator('text=继续下一步').first();
      await continueNextBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-8-after-continue.png' });

      const currentUrl = page.url();
      console.log(`  当前URL: ${currentUrl}`);

      // 检查是否进入了下一个页面
      const nextPageIndicator = await page.locator('text=产品拆解').or(page.locator('text=Break')).count();
      if (nextPageIndicator > 0) {
        console.log('  ✓ 成功进入下一个页面');
      } else {
        console.log('  ⚠ 可能未正确跳转到下一页面');
      }
    }

    console.log('\n=== 测试完成 ===');
    console.log('所有截图已保存到: c:/Users/25066/Desktop/AI CO/');
    console.log('\n浏览器将保持打开60秒，请查看结果...');

    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ 测试出错:', error.message);
    await page.screenshot({ path: 'c:/Users/25066/Desktop/AI CO/test-error.png' });
    console.log('错误截图已保存');
  } finally {
    await browser.close();
    console.log('\n浏览器已关闭');
  }
}

testCompleteFlow();
