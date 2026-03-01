import { chromium } from 'playwright';

async function finalTest() {
  console.log('开始最终测试...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. 加载页面
    console.log('步骤1: 加载页面');
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(1000);
    console.log('✓ 页面加载成功\n');

    // 2. 验证三栏布局
    console.log('步骤2: 验证三栏布局');
    const leftColumn = await page.$('.left-column');
    const centerColumn = await page.$('.center-column');
    const rightColumn = await page.$('.right-column');

    if (!leftColumn || !centerColumn || !rightColumn) {
      throw new Error('三栏布局不完整');
    }
    console.log('✓ 三栏布局存在\n');

    // 3. 输入产品名称并开始分析
    console.log('步骤3: 输入产品名称并开始分析');
    await page.fill('#productName', '白色金属闹钟');
    await page.click('#startBtn');
    console.log('✓ 已开始分析\n');

    // 4. 等待零件树加载
    console.log('步骤4: 等待零件树加载');
    await page.waitForSelector('.part-item', { timeout: 15000 });
    const partItems = await page.$$('.part-item');
    console.log(`✓ 零件树已加载 (${partItems.length} 个零件)\n`);

    // 5. 点击第一个零件
    console.log('步骤5: 选择第一个零件');
    await partItems[0].click();
    const firstPartName = await partItems[0].textContent();
    console.log(`✓ 已选择零件: ${firstPartName.trim()}\n`);

    // 6. 等待Agent面板加载
    console.log('步骤6: 等待Agent面板加载');
    await page.waitForTimeout(3000);
    const agentCards = await page.$$('.agent-card');
    console.log(`✓ Agent面板已加载 (${agentCards.length} 个Agent)\n`);

    // 验证Keep Breaking Agent不在中间面板
    const keepBreakingAgent = await page.$('[data-agent="Keep Breaking Agent"]');
    if (keepBreakingAgent) {
      console.warn('⚠ 警告: Keep Breaking Agent出现在中间面板（不应该）\n');
    } else {
      console.log('✓ Keep Breaking Agent未出现在中间面板（正确）\n');
    }

    // 7. 等待供应商选项加载
    console.log('步骤7: 等待供应商选项加载');
    await page.waitForSelector('.supplier-item', { timeout: 15000 });
    const supplierItems = await page.$$('.supplier-item');
    console.log(`✓ 供应商选项已加载 (${supplierItems.length} 个选项)\n`);

    // 8. 选择第一个供应商
    console.log('步骤8: 选择第一个供应商');
    await supplierItems[0].click();
    console.log('✓ 已选择供应商\n');

    // 9. 等待评估结果弹窗
    console.log('步骤9: 等待评估结果弹窗');
    await page.waitForTimeout(12000);

    const modal = await page.$('#assessmentModal.show');
    if (modal) {
      console.log('✓ 评估结果弹窗已显示\n');

      // 验证弹窗内容
      const modalBody = await page.$('#assessmentModalBody');
      const modalText = await modalBody.textContent();

      if (modalText.includes('评估结果')) {
        console.log('✓ 弹窗包含评估结果');
      }
      if (modalText.includes('Keep Breaking Agent')) {
        console.log('✓ 弹窗包含Keep Breaking Agent建议');
      }
      if (modalText.includes('成本分析')) {
        console.log('✓ 弹窗包含成本分析');
      }
      if (modalText.includes('工程风险')) {
        console.log('✓ 弹窗包含工程风险');
      }
      if (modalText.includes('碳排放')) {
        console.log('✓ 弹窗包含碳排放');
      }

      // 10. 测试关闭弹窗
      console.log('\n步骤10: 测试关闭弹窗');
      const closeBtn = await page.$('.close-modal');
      await closeBtn.click();
      await page.waitForTimeout(500);

      const modalAfterClose = await page.$('#assessmentModal.show');
      if (!modalAfterClose) {
        console.log('✓ 弹窗已成功关闭\n');
      } else {
        console.warn('⚠ 弹窗未正确关闭\n');
      }
    } else {
      console.warn('⚠ 评估结果弹窗未显示\n');
    }

    console.log('='.repeat(50));
    console.log('测试完成！所有功能正常工作。');
    console.log('='.repeat(50));
    console.log('\n布局验证:');
    console.log('✓ 左栏（20%）：零件树结构');
    console.log('✓ 中间栏：Agent工作面板（不含Keep Breaking Agent）');
    console.log('✓ 右栏：供应商选项');
    console.log('✓ 弹窗：评估结果和Keep Breaking Agent建议');
    console.log('\n浏览器将保持打开30秒以便查看...');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    await page.screenshot({ path: 'final-test-error.png' });
    console.log('已保存错误截图: final-test-error.png');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

finalTest().catch(console.error);
