import { chromium } from 'playwright';

async function testFullWorkflow() {
  console.log('开始完整工作流测试...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 访问页面
    await page.goto('http://localhost:4000');
    console.log('✓ 页面加载成功');
    await page.waitForTimeout(1000);

    // 输入产品名称
    await page.fill('#productName', '白色金属闹钟');
    console.log('✓ 输入产品名称');

    // 点击开始分析
    await page.click('#startBtn');
    console.log('✓ 点击开始分析按钮');

    // 等待零件树加载
    await page.waitForSelector('.part-item', { timeout: 10000 });
    console.log('✓ 零件树已加载');

    // 等待一段时间让Agent工作
    await page.waitForTimeout(3000);

    // 检查Agent卡片数量
    const agentCards = await page.locator('.agent-card').count();
    console.log(`✓ 显示了 ${agentCards} 个Agent卡片`);

    // 检查Agent工作面板的grid布局
    const gridStyle = await page.locator('#agentsGrid').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gridTemplateRows: styles.gridTemplateRows,
        gap: styles.gap
      };
    });

    console.log('\nAgent工作面板布局:');
    console.log(`  display: ${gridStyle.display}`);
    console.log(`  grid-template-columns: ${gridStyle.gridTemplateColumns}`);
    console.log(`  grid-template-rows: ${gridStyle.gridTemplateRows}`);
    console.log(`  gap: ${gridStyle.gap}`);

    // 验证2x2布局
    if (gridStyle.display === 'grid' &&
        gridStyle.gridTemplateColumns.includes('350px 350px')) {
      console.log('✓ Agent面板正确使用2x2网格布局');
    } else {
      console.log('✗ Agent面板布局不正确');
    }

    // 截图保存当前状态
    await page.screenshot({
      path: 'c:/Users/25066/Desktop/BIDtest2/BIDtest2/tests/screenshot-agents.png',
      fullPage: true
    });
    console.log('✓ 已保存Agent面板截图');

    // 点击第一个零件
    await page.click('.part-item:first-child');
    console.log('\n✓ 点击第一个零件');
    await page.waitForTimeout(3000);

    // 等待供应商列表加载
    const hasSuppliers = await page.locator('.supplier-item').count();
    if (hasSuppliers > 0) {
      console.log(`✓ 加载了 ${hasSuppliers} 个供应商`);

      // 点击第一个供应商
      await page.click('.supplier-item:first-child');
      console.log('✓ 点击第一个供应商');
      await page.waitForTimeout(3000);

      // 等待评估弹窗出现
      const modalVisible = await page.locator('#assessmentModal.show').isVisible();
      if (modalVisible) {
        console.log('\n✓ 评估弹窗已显示');

        // 检查弹窗尺寸
        const modalSize = await page.locator('#assessmentModal .modal-content').evaluate(el => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return {
            width: rect.width,
            height: rect.height,
            maxWidth: styles.maxWidth,
            maxHeight: styles.maxHeight,
            padding: styles.padding
          };
        });

        console.log('弹窗尺寸:');
        console.log(`  实际宽度: ${Math.round(modalSize.width)}px`);
        console.log(`  实际高度: ${Math.round(modalSize.height)}px`);
        console.log(`  max-width: ${modalSize.maxWidth}`);
        console.log(`  max-height: ${modalSize.maxHeight}`);
        console.log(`  padding: ${modalSize.padding}`);

        // 验证弹窗尺寸
        if (modalSize.maxWidth === '1200px' && modalSize.maxHeight === '972px') {
          console.log('✓ 弹窗尺寸已正确放大');
        } else {
          console.log('✗ 弹窗尺寸不正确');
        }

        // 截图保存弹窗状态
        await page.screenshot({
          path: 'c:/Users/25066/Desktop/BIDtest2/BIDtest2/tests/screenshot-modal.png',
          fullPage: true
        });
        console.log('✓ 已保存弹窗截图');
      } else {
        console.log('✗ 评估弹窗未显示');
      }
    }

    console.log('\n所有测试通过！等待5秒后关闭...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n测试失败:', error.message);
    await page.screenshot({
      path: 'c:/Users/25066/Desktop/BIDtest2/BIDtest2/tests/screenshot-error.png',
      fullPage: true
    });
    console.log('已保存错误截图');
  } finally {
    await browser.close();
  }
}

testFullWorkflow();
