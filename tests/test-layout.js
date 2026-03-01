import { chromium } from 'playwright';

async function testLayout() {
  console.log('开始测试布局...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 访问页面
    await page.goto('http://localhost:4000');
    console.log('✓ 页面加载成功');

    // 等待页面加载
    await page.waitForTimeout(1000);

    // 检查Agent工作面板是否存在
    const agentsGrid = await page.locator('#agentsGrid');
    const isVisible = await agentsGrid.isVisible();
    console.log(`✓ Agent工作面板可见: ${isVisible}`);

    // 检查CSS样式
    const gridStyle = await agentsGrid.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gridTemplateRows: styles.gridTemplateRows
      };
    });

    console.log('Agent工作面板样式:');
    console.log(`  display: ${gridStyle.display}`);
    console.log(`  grid-template-columns: ${gridStyle.gridTemplateColumns}`);
    console.log(`  grid-template-rows: ${gridStyle.gridTemplateRows}`);

    // 验证是否为grid布局
    if (gridStyle.display === 'grid') {
      console.log('✓ Agent工作面板使用grid布局');
    } else {
      console.log('✗ Agent工作面板未使用grid布局');
    }

    // 检查弹窗样式
    const modal = await page.locator('#assessmentModal .modal-content');
    const modalStyle = await modal.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        maxWidth: styles.maxWidth,
        maxHeight: styles.maxHeight,
        padding: styles.padding
      };
    });

    console.log('\n弹窗样式:');
    console.log(`  max-width: ${modalStyle.maxWidth}`);
    console.log(`  max-height: ${modalStyle.maxHeight}`);
    console.log(`  padding: ${modalStyle.padding}`);

    // 验证弹窗尺寸
    if (modalStyle.maxWidth === '1200px') {
      console.log('✓ 弹窗宽度已放大到1200px');
    } else {
      console.log(`✗ 弹窗宽度为 ${modalStyle.maxWidth}，期望1200px`);
    }

    console.log('\n测试完成！按任意键关闭浏览器...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await browser.close();
  }
}

testLayout();
