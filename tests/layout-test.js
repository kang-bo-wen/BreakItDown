import { chromium } from 'playwright';

async function testLayout() {
  console.log('开始测试前端布局...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 访问页面
    await page.goto('http://localhost:4000');
    console.log('✓ 页面加载成功');

    // 等待页面加载
    await page.waitForTimeout(1000);

    // 检查三栏布局是否存在
    const leftColumn = await page.$('.left-column');
    const centerColumn = await page.$('.center-column');
    const rightColumn = await page.$('.right-column');

    if (!leftColumn) {
      throw new Error('左栏（零件树）未找到');
    }
    console.log('✓ 左栏（零件树）存在');

    if (!centerColumn) {
      throw new Error('中间栏（Agent面板）未找到');
    }
    console.log('✓ 中间栏（Agent面板）存在');

    if (!rightColumn) {
      throw new Error('右栏（供应商选项）未找到');
    }
    console.log('✓ 右栏（供应商选项）存在');

    // 检查左栏宽度是否为20%
    const leftColumnWidth = await leftColumn.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement.getBoundingClientRect();
      return (rect.width / parentRect.width) * 100;
    });
    console.log(`左栏宽度: ${leftColumnWidth.toFixed(2)}%`);
    if (Math.abs(leftColumnWidth - 20) > 2) {
      console.warn(`⚠ 左栏宽度不是20%，当前为${leftColumnWidth.toFixed(2)}%`);
    } else {
      console.log('✓ 左栏宽度正确（约20%）');
    }

    // 检查弹窗是否存在
    const modal = await page.$('#assessmentModal');
    if (!modal) {
      throw new Error('评估结果弹窗未找到');
    }
    console.log('✓ 评估结果弹窗存在');

    // 检查弹窗初始状态是否隐藏
    const modalDisplay = await modal.evaluate(el => window.getComputedStyle(el).display);
    if (modalDisplay !== 'none') {
      throw new Error('弹窗初始状态应该是隐藏的');
    }
    console.log('✓ 弹窗初始状态正确（隐藏）');

    // 测试输入产品名称并开始分析
    await page.fill('#productName', '白色金属闹钟');
    console.log('✓ 输入产品名称');

    await page.click('#startBtn');
    console.log('✓ 点击开始分析按钮');

    // 等待零件树加载
    await page.waitForTimeout(3000);

    // 检查零件树是否有内容
    const partsTree = await page.$('#partsTree');
    const partsTreeContent = await partsTree.innerHTML();
    if (partsTreeContent.trim().length > 0) {
      console.log('✓ 零件树已加载内容');
    } else {
      console.warn('⚠ 零件树可能未加载内容');
    }

    // 等待Agent面板加载
    await page.waitForTimeout(2000);

    // 检查Agent面板是否有内容
    const agentsGrid = await page.$('#agentsGrid');
    const agentsGridContent = await agentsGrid.innerHTML();
    if (agentsGridContent.trim().length > 0) {
      console.log('✓ Agent面板已加载内容');

      // 检查是否有Keep Breaking Agent在中间面板（不应该有）
      const keepBreakingAgent = await page.$('[data-agent="Keep Breaking Agent"]');
      if (keepBreakingAgent) {
        console.warn('⚠ Keep Breaking Agent不应该出现在中间面板');
      } else {
        console.log('✓ Keep Breaking Agent未出现在中间面板（正确）');
      }
    } else {
      console.warn('⚠ Agent面板可能未加载内容');
    }

    console.log('\n测试完成！保持浏览器打开以便查看...');
    console.log('按Ctrl+C退出测试');

    // 保持浏览器打开
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testLayout().catch(console.error);

