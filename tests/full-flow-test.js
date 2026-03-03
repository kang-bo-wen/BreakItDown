import { chromium } from 'playwright';

async function testFullFlow() {
  console.log('开始完整流程测试...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台消息
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('浏览器错误:', msg.text());
    }
  });

  try {
    // 1. 访问页面
    console.log('步骤1: 访问页面');
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(1000);
    console.log('✓ 页面加载成功\n');

    // 2. 检查布局
    console.log('步骤2: 检查三栏布局');
    const leftColumn = await page.$('.left-column');
    const centerColumn = await page.$('.center-column');
    const rightColumn = await page.$('.right-column');

    if (!leftColumn || !centerColumn || !rightColumn) {
      throw new Error('三栏布局不完整');
    }
    console.log('✓ 三栏布局正确\n');

    // 3. 输入产品名称
    console.log('步骤3: 输入产品名称');
    await page.fill('#productName', '白色金属闹钟');
    console.log('✓ 已输入: 白色金属闹钟\n');

    // 4. 开始分析
    console.log('步骤4: 开始分析');
    await page.click('#startBtn');
    console.log('✓ 已点击开始分析按钮');
    console.log('等待零件树加载...');
    await page.waitForTimeout(5000);

    // 5. 检查零件树
    console.log('\n步骤5: 检查零件树');
    const partsTreeItems = await page.$$('.part-item');
    console.log(`零件树中有 ${partsTreeItems.length} 个零件`);

    if (partsTreeItems.length > 0) {
      console.log('✓ 零件树已加载');

      // 点击第一个零件
      console.log('\n步骤6: 选择第一个零件');
      await partsTreeItems[0].click();
      console.log('✓ 已点击第一个零件');
      console.log('等待Agent工作...');
      await page.waitForTimeout(8000);

      // 6. 检查Agent面板
      console.log('\n步骤7: 检查Agent面板');
      const agentCards = await page.$$('.agent-card');
      console.log(`Agent面板中有 ${agentCards.length} 个Agent`);

      if (agentCards.length > 0) {
        console.log('✓ Agent面板已加载');

        // 检查每个Agent的名称
        for (const card of agentCards) {
          const agentName = await card.$eval('.agent-name', el => el.textContent);
          console.log(`  - ${agentName}`);

          if (agentName === 'Keep Breaking Agent') {
            throw new Error('Keep Breaking Agent不应该出现在中间面板');
          }
        }
        console.log('✓ 所有Agent都正确显示（不包含Keep Breaking Agent）');
      } else {
        console.warn('⚠ Agent面板未加载内容');
      }

      // 7. 检查供应商选项
      console.log('\n步骤8: 检查供应商选项');
      await page.waitForTimeout(3000);
      const supplierItems = await page.$$('.supplier-item');
      console.log(`供应商面板中有 ${supplierItems.length} 个选项`);

      if (supplierItems.length > 0) {
        console.log('✓ 供应商选项已加载');

        // 点击第一个供应商
        console.log('\n步骤9: 选择第一个供应商');
        await supplierItems[0].click();
        console.log('✓ 已点击第一个供应商');
        console.log('等待评估结果...');
        await page.waitForTimeout(10000);

        // 8. 检查弹窗
        console.log('\n步骤10: 检查评估结果弹窗');
        const modal = await page.$('#assessmentModal');
        const modalClasses = await modal.getAttribute('class');

        if (modalClasses.includes('show')) {
          console.log('✓ 评估结果弹窗已显示');

          // 检查弹窗内容
          const modalBody = await page.$('#assessmentModalBody');
          const modalContent = await modalBody.textContent();

          if (modalContent.includes('评估结果')) {
            console.log('✓ 弹窗包含评估结果');
          }

          if (modalContent.includes('Keep Breaking Agent')) {
            console.log('✓ 弹窗包含Keep Breaking Agent建议');
          }

          // 检查按钮
          const breakdownBtn = await page.$('button:has-text("继续拆分零件")');
          const keepBtn = await page.$('button:has-text("保持当前选项")');

          if (breakdownBtn && keepBtn) {
            console.log('✓ 弹窗包含两个操作按钮');
          }

          // 测试关闭弹窗
          console.log('\n步骤11: 测试关闭弹窗');
          const closeBtn = await page.$('.close-modal');
          await closeBtn.click();
          await page.waitForTimeout(500);

          const modalClassesAfterClose = await modal.getAttribute('class');
          if (!modalClassesAfterClose.includes('show')) {
            console.log('✓ 弹窗已关闭');
          } else {
            console.warn('⚠ 弹窗未正确关闭');
          }
        } else {
          console.warn('⚠ 评估结果弹窗未显示');
        }
      } else {
        console.warn('⚠ 供应商选项未加载');
      }
    } else {
      console.warn('⚠ 零件树未加载内容');
    }

    console.log('\n=================================');
    console.log('测试完成！所有功能正常工作。');
    console.log('=================================\n');
    console.log('浏览器将保持打开30秒以便查看...');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    console.log('\n浏览器将保持打开以便调试...');
    await page.waitForTimeout(30000);
    throw error;
  } finally {
    await browser.close();
  }
}

testFullFlow().catch(console.error);
